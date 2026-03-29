"""Simulation engine — deterministic net worth projections + AI helpers."""
from __future__ import annotations

import json
import logging
from datetime import date, timedelta

from backend.models.schemas import (
    ComparisonProfile,
    MonthlyNetWorthPoint,
    SimulationRecommendation,
    SimulationSummary,
)
from backend.prompts.simulation import (
    SIMULATION_AFTER_PROFILE_PROMPT,
    SIMULATION_RECOMMENDATION_PROMPT,
)
from backend.services.llm import chat_completion

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────

def _normalize_monthly(amount: float, frequency: str | None) -> float:
    freq = (frequency or "monthly").lower()
    if freq == "weekly":
        return amount * 4.33
    if freq == "biweekly":
        return amount * 2.17
    if freq == "yearly":
        return amount / 12
    return amount


def _month_labels(n: int) -> list[str]:
    """Return n month labels starting from next month, e.g. ['2026-04', '2026-05', ...]."""
    today = date.today()
    # Start from next month
    start = (today.replace(day=1) + timedelta(days=32)).replace(day=1)
    labels = []
    for i in range(n):
        m = (start.month - 1 + i) % 12 + 1
        y = start.year + (start.month - 1 + i) // 12
        labels.append(f"{y:04d}-{m:02d}")
    return labels


# ── Summary ───────────────────────────────────────────────────────────

def calculate_summary(profile: ComparisonProfile) -> SimulationSummary:
    """Derive monthly summary stats from a ComparisonProfile."""
    monthly_income = sum(
        _normalize_monthly(s.amount or 0.0, s.frequency)
        for s in (profile.income_sources or [])
    )
    monthly_recurring = sum(
        _normalize_monthly(e.amount or 0.0, e.frequency)
        for e in (profile.recurring_expenses or [])
    )
    monthly_debt_payments = sum(
        d.minimum_payment or 0.0
        for d in (profile.debts or [])
    )
    monthly_expenses = monthly_recurring + monthly_debt_payments
    debt_total = sum((d.balance or 0.0) for d in (profile.debts or []))
    account_total = sum((a.balance or 0.0) for a in (profile.accounts or []))

    return SimulationSummary(
        monthly_income=round(monthly_income, 2),
        monthly_expenses=round(monthly_expenses, 2),
        monthly_surplus=round(monthly_income - monthly_expenses, 2),
        debt_total=round(debt_total, 2),
        account_total=round(account_total, 2),
    )


# ── Net worth trajectory ──────────────────────────────────────────────

def calculate_monthly_net_worth(
    profile: ComparisonProfile,
    months: int = 12,
) -> list[MonthlyNetWorthPoint]:
    """Deterministically project monthly net worth for `months` months.

    Net worth = total account balances − total debt balances.
    Each month: apply surplus, compound savings interest, apply one-time outliers,
    reduce debt balances by minimum payments.
    """
    accounts = profile.accounts or []
    debts = profile.debts or []
    outliers = profile.outliers or []

    # Mutable state — treat None balances as 0 so the engine always gets a float
    account_balances: dict[str, float] = {a.name: (a.balance or 0.0) for a in accounts}
    debt_balances: dict[str, float] = {d.name: (d.balance or 0.0) for d in debts}

    monthly_income = sum(
        _normalize_monthly(s.amount or 0.0, s.frequency)
        for s in (profile.income_sources or [])
    )
    monthly_recurring = sum(
        _normalize_monthly(e.amount or 0.0, e.frequency)
        for e in (profile.recurring_expenses or [])
    )

    # Monthly interest rates for accounts (annual % → monthly)
    account_rates = {
        a.name: (a.interest_rate or 0.0) / 100 / 12
        for a in accounts
    }

    month_labels = _month_labels(months)
    result: list[MonthlyNetWorthPoint] = []

    for label in month_labels:
        # 1. Calculate surplus this month (income minus recurring; debt payments handled separately)
        total_debt_payments = sum(
            min(d.minimum_payment or 0.0, debt_balances.get(d.name, 0.0))
            for d in debts
        )
        surplus = monthly_income - monthly_recurring - total_debt_payments

        # 2. Distribute surplus across accounts (add to first chequing/savings found, or split evenly)
        if account_balances:
            primary = next(
                (n for n in account_balances if "chequing" in n.lower() or "checking" in n.lower()),
                next(iter(account_balances)),
            )
            account_balances[primary] = account_balances[primary] + surplus

        # 3. Apply monthly interest to all accounts
        for name in account_balances:
            rate = account_rates.get(name, 0.0)
            if rate > 0:
                account_balances[name] *= (1 + rate)

        # 4. Apply outlier events for this month
        for outlier in outliers:
            if outlier.month == label:
                positive_kinds = {"income", "benefit", "refund", "rebate"}
                impact = (
                    (outlier.amount or 0.0)
                    if (outlier.kind or "").lower() in positive_kinds
                    else -(outlier.amount or 0.0)
                )
                if account_balances:
                    primary = next(
                        (n for n in account_balances if "chequing" in n.lower() or "checking" in n.lower()),
                        next(iter(account_balances)),
                    )
                    account_balances[primary] += impact

        # 5. Pay down debts
        for d in debts:
            payment = min(d.minimum_payment or 0.0, debt_balances.get(d.name, 0.0))
            debt_balances[d.name] = max(0.0, debt_balances.get(d.name, 0.0) - payment)

        net_worth = sum(account_balances.values()) - sum(debt_balances.values())
        result.append(MonthlyNetWorthPoint(month=label, value=round(net_worth, 2)))

    return result


# ── AI: build after-profile ───────────────────────────────────────────

async def build_after_profile(
    profile_before: ComparisonProfile,
    prompt: str,
) -> ComparisonProfile:
    """Use GPT-4o to derive profile_after from profile_before + user scenario prompt."""
    messages = [
        {"role": "system", "content": SIMULATION_AFTER_PROFILE_PROMPT},
        {
            "role": "user",
            "content": (
                f"Current profile (JSON):\n{profile_before.model_dump_json(indent=2)}\n\n"
                f"Scenario: {prompt}"
            ),
        },
    ]
    try:
        raw = await chat_completion(messages, temperature=0.2, json_mode=True)
        data = json.loads(raw)
        return ComparisonProfile(**data)
    except Exception:
        logger.exception("Failed to build after-profile for prompt %r — using before-profile as fallback", prompt)
        return profile_before


# ── AI: recommendation ────────────────────────────────────────────────

async def generate_recommendation(
    scenario: str,
    summary_before: SimulationSummary,
    summary_after: SimulationSummary,
) -> SimulationRecommendation:
    """Use GPT-4o to generate a plain-language verdict comparing before vs after."""
    context = (
        f"Scenario: {scenario}\n\n"
        f"Before:\n"
        f"  Monthly income:   ${summary_before.monthly_income:,.0f}\n"
        f"  Monthly expenses: ${summary_before.monthly_expenses:,.0f}\n"
        f"  Monthly surplus:  ${summary_before.monthly_surplus:,.0f}\n"
        f"  Debt total:       ${summary_before.debt_total:,.0f}\n"
        f"  Accounts total:   ${summary_before.account_total:,.0f}\n\n"
        f"After (with scenario applied):\n"
        f"  Monthly income:   ${summary_after.monthly_income:,.0f}\n"
        f"  Monthly expenses: ${summary_after.monthly_expenses:,.0f}\n"
        f"  Monthly surplus:  ${summary_after.monthly_surplus:,.0f}\n"
        f"  Debt total:       ${summary_after.debt_total:,.0f}\n"
        f"  Accounts total:   ${summary_after.account_total:,.0f}"
    )
    messages = [
        {"role": "system", "content": SIMULATION_RECOMMENDATION_PROMPT},
        {"role": "user", "content": context},
    ]
    try:
        raw = await chat_completion(messages, temperature=0.4, json_mode=True)
        data = json.loads(raw)
        return SimulationRecommendation(**data)
    except Exception:
        logger.exception("Failed to generate recommendation — using fallback")
        feasible = summary_after.monthly_surplus >= 0
        return SimulationRecommendation(
            feasible=feasible,
            headline="Simulation complete" if feasible else "This scenario creates a monthly deficit",
            body=(
                f"After applying the scenario, your monthly surplus would be "
                f"${summary_after.monthly_surplus:,.0f}/month "
                f"(currently ${summary_before.monthly_surplus:,.0f}/month)."
            ),
            recommendations=[
                "Review your monthly expenses for potential savings.",
                "Consider building an emergency fund before proceeding.",
                "Track spending for 30 days to find cut opportunities.",
            ],
        )
