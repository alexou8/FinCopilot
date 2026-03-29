"""Simulation engine - deterministic net worth projections + AI helpers."""
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
    """Return month labels starting from next month."""
    today = date.today()
    start = (today.replace(day=1) + timedelta(days=32)).replace(day=1)
    labels = []
    for i in range(n):
        month = (start.month - 1 + i) % 12 + 1
        year = start.year + (start.month - 1 + i) // 12
        labels.append(f"{year:04d}-{month:02d}")
    return labels


def calculate_summary(profile: ComparisonProfile) -> SimulationSummary:
    """Derive monthly summary stats from a ComparisonProfile."""
    monthly_income = sum(
        _normalize_monthly(source.amount, source.frequency)
        for source in (profile.income_sources or [])
    )
    monthly_recurring = sum(
        _normalize_monthly(expense.amount, expense.frequency)
        for expense in (profile.recurring_expenses or [])
    )
    monthly_debt_payments = sum(
        debt.minimum_payment or 0.0
        for debt in (profile.debts or [])
    )
    monthly_expenses = monthly_recurring + monthly_debt_payments
    debt_total = sum(debt.balance for debt in (profile.debts or []))
    account_total = sum(account.balance for account in (profile.accounts or []))

    return SimulationSummary(
        monthly_income=round(monthly_income, 2),
        monthly_expenses=round(monthly_expenses, 2),
        monthly_surplus=round(monthly_income - monthly_expenses, 2),
        debt_total=round(debt_total, 2),
        account_total=round(account_total, 2),
    )


def project_monthly_balances(
    profile: ComparisonProfile,
    months: int = 12,
) -> list[dict]:
    """Project monthly liquid balances, debt totals, and net worth."""
    accounts = profile.accounts or []
    debts = profile.debts or []
    outliers = profile.outliers or []

    account_balances: dict[str, float] = {account.name: account.balance for account in accounts}
    debt_balances: dict[str, float] = {debt.name: debt.balance for debt in debts}

    monthly_income = sum(
        _normalize_monthly(source.amount, source.frequency)
        for source in (profile.income_sources or [])
    )
    monthly_recurring = sum(
        _normalize_monthly(expense.amount, expense.frequency)
        for expense in (profile.recurring_expenses or [])
    )
    account_rates = {
        account.name: (account.interest_rate or 0.0) / 100 / 12
        for account in accounts
    }

    def _primary_account_name() -> str | None:
        if not account_balances:
            return None
        return next(
            (
                name
                for name in account_balances
                if "chequing" in name.lower() or "checking" in name.lower()
            ),
            next(iter(account_balances)),
        )

    results: list[dict] = []
    for label in _month_labels(months):
        total_debt_payments = sum(
            min(debt.minimum_payment or 0.0, debt_balances.get(debt.name, 0.0))
            for debt in debts
        )
        surplus = monthly_income - monthly_recurring - total_debt_payments

        primary = _primary_account_name()
        if primary:
            account_balances[primary] = account_balances[primary] + surplus

        for name in account_balances:
            rate = account_rates.get(name, 0.0)
            if rate > 0:
                account_balances[name] *= (1 + rate)

        month_outlier_impact = 0.0
        month_outlier_names: list[str] = []
        for outlier in outliers:
            if outlier.month != label:
                continue
            positive_kinds = {"income", "benefit", "refund", "rebate"}
            impact = (
                outlier.amount
                if (outlier.kind or "").lower() in positive_kinds
                else -outlier.amount
            )
            month_outlier_impact += impact
            month_outlier_names.append(outlier.name)
            primary = _primary_account_name()
            if primary:
                account_balances[primary] += impact

        for debt in debts:
            payment = min(
                debt.minimum_payment or 0.0,
                debt_balances.get(debt.name, 0.0),
            )
            debt_balances[debt.name] = max(
                0.0,
                debt_balances.get(debt.name, 0.0) - payment,
            )

        liquid_balance = round(sum(account_balances.values()), 2)
        debt_total = round(sum(debt_balances.values()), 2)
        results.append(
            {
                "month": label,
                "liquid_balance": liquid_balance,
                "debt_total": debt_total,
                "net_worth": round(liquid_balance - debt_total, 2),
                "monthly_surplus": round(surplus, 2),
                "outlier_impact": round(month_outlier_impact, 2),
                "outlier_names": month_outlier_names,
            }
        )

    return results


def calculate_monthly_net_worth(
    profile: ComparisonProfile,
    months: int = 12,
) -> list[MonthlyNetWorthPoint]:
    """Deterministically project monthly net worth for `months` months."""
    return [
        MonthlyNetWorthPoint(month=point["month"], value=point["net_worth"])
        for point in project_monthly_balances(profile, months)
    ]


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
        logger.exception(
            "Failed to build after-profile for prompt %r; using before-profile as fallback",
            prompt,
        )
        return profile_before


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
        logger.exception("Failed to generate recommendation; using fallback")
        feasible = summary_after.monthly_surplus >= 0
        return SimulationRecommendation(
            feasible=feasible,
            headline="Simulation complete"
            if feasible
            else "This scenario creates a monthly deficit",
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
