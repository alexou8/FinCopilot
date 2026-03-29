from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from backend.models.schemas import AccountItem, ComparisonProfile, DebtItem, RecurringExpenseItem
from backend.services.issue_catalog import SEVERITY_ORDER
from backend.services.simulation_engine import project_monthly_balances

HIGH_INTEREST_DEBT_APR = 10.0
LOW_YIELD_APR = 1.0
MEANINGFUL_SAVINGS_BALANCE = 500.0
RENT_BURDEN_WARNING = 0.40
RENT_BURDEN_CRITICAL = 0.50


@dataclass(frozen=True)
class IssueFinding:
    rule_id: str
    severity: str
    impact_score: float
    metrics: dict[str, Any]
    reasons: list[str]


def _normalize_monthly(amount: float, frequency: str | None) -> float:
    freq = (frequency or "monthly").lower()
    if freq == "weekly":
        return amount * 4.33
    if freq == "biweekly":
        return amount * 2.17
    if freq == "yearly":
        return amount / 12
    return amount


def _monthly_income(profile: ComparisonProfile) -> float:
    return sum(
        _normalize_monthly(source.amount, source.frequency)
        for source in (profile.income_sources or [])
    )


def _monthly_recurring_expenses(profile: ComparisonProfile) -> float:
    return sum(
        _normalize_monthly(expense.amount, expense.frequency)
        for expense in (profile.recurring_expenses or [])
    )


def _monthly_debt_payments(profile: ComparisonProfile) -> float:
    return sum(debt.minimum_payment or 0.0 for debt in (profile.debts or []))


def _savings_accounts(profile: ComparisonProfile) -> list[AccountItem]:
    return [
        account
        for account in (profile.accounts or [])
        if "saving" in account.type.lower()
    ]


def _liquid_accounts(profile: ComparisonProfile) -> list[AccountItem]:
    liquid_types = {"savings", "chequing", "checking", "cash"}
    return [
        account
        for account in (profile.accounts or [])
        if any(token in account.type.lower() for token in liquid_types)
    ]


def _total_balance(accounts: list[AccountItem]) -> float:
    return sum(account.balance for account in accounts)


def _weighted_rate(accounts: list[AccountItem]) -> float:
    balance = _total_balance(accounts)
    if balance <= 0:
        return 0.0
    weighted_sum = sum(account.balance * (account.interest_rate or 0.0) for account in accounts)
    return weighted_sum / balance


def _rent_expense(expenses: list[RecurringExpenseItem]) -> RecurringExpenseItem | None:
    return next((expense for expense in expenses if "rent" in expense.name.lower()), None)


def _severity_key(severity: str) -> tuple[int, str]:
    return (SEVERITY_ORDER.get(severity, 99), severity)


def _find_debt_vs_savings(profile: ComparisonProfile) -> IssueFinding | None:
    savings_accounts = _savings_accounts(profile)
    high_interest_debts = [
        debt for debt in (profile.debts or []) if (debt.interest_rate or 0.0) > HIGH_INTEREST_DEBT_APR
    ]
    total_savings = _total_balance(savings_accounts)
    savings_rate = _weighted_rate(savings_accounts)
    if not high_interest_debts or total_savings < MEANINGFUL_SAVINGS_BALANCE or savings_rate > LOW_YIELD_APR:
        return None

    max_debt_apr = max(debt.interest_rate or 0.0 for debt in high_interest_debts)
    apr_gap = max(max_debt_apr - savings_rate, 0.0)
    return IssueFinding(
        rule_id="debt_vs_savings",
        severity="critical",
        impact_score=round(total_savings * apr_gap / 100, 2),
        metrics={
            "high_interest_debt_balance": round(sum(debt.balance for debt in high_interest_debts), 2),
            "idle_savings_balance": round(total_savings, 2),
            "debt_apr": round(max_debt_apr, 2),
            "savings_rate": round(savings_rate, 2),
            "apr_gap": round(apr_gap, 2),
        },
        reasons=[
            "You have debt charging double-digit interest.",
            "A meaningful savings balance is sitting in low-yield cash.",
        ],
    )


def _find_low_yield_savings(profile: ComparisonProfile) -> IssueFinding | None:
    savings_accounts = _savings_accounts(profile)
    total_savings = _total_balance(savings_accounts)
    savings_rate = _weighted_rate(savings_accounts)
    if total_savings < MEANINGFUL_SAVINGS_BALANCE or savings_rate > LOW_YIELD_APR:
        return None

    return IssueFinding(
        rule_id="low_yield_savings",
        severity="warning",
        impact_score=round(total_savings * max(3.0 - savings_rate, 0.0) / 100, 2),
        metrics={
            "savings_balance": round(total_savings, 2),
            "savings_rate": round(savings_rate, 2),
        },
        reasons=[
            "Your savings balance is large enough that the interest rate matters.",
            "The current APY is near zero compared with common student-friendly savings options.",
        ],
    )


def _find_low_emergency_buffer(profile: ComparisonProfile) -> IssueFinding | None:
    monthly_required = _monthly_recurring_expenses(profile) + _monthly_debt_payments(profile)
    if monthly_required <= 0:
        return None

    liquid_balance = _total_balance(_liquid_accounts(profile))
    emergency_months = liquid_balance / monthly_required if monthly_required else 0.0
    if emergency_months >= 1.0:
        return None

    return IssueFinding(
        rule_id="low_emergency_buffer",
        severity="critical",
        impact_score=round((1.0 - emergency_months) * monthly_required, 2),
        metrics={
            "liquid_balance": round(liquid_balance, 2),
            "monthly_required": round(monthly_required, 2),
            "emergency_months": round(emergency_months, 2),
        },
        reasons=[
            "Your liquid accounts would not cover one full month of obligations.",
        ],
    )


def _find_negative_monthly_cashflow(profile: ComparisonProfile) -> IssueFinding | None:
    monthly_income = _monthly_income(profile)
    monthly_expenses = _monthly_recurring_expenses(profile) + _monthly_debt_payments(profile)
    if monthly_income >= monthly_expenses:
        return None

    deficit = monthly_expenses - monthly_income
    return IssueFinding(
        rule_id="negative_monthly_cashflow",
        severity="critical",
        impact_score=round(deficit, 2),
        metrics={
            "monthly_income": round(monthly_income, 2),
            "monthly_expenses": round(monthly_expenses, 2),
            "monthly_surplus": round(monthly_income - monthly_expenses, 2),
        },
        reasons=[
            "Your recurring plan spends more than it brings in each month.",
        ],
    )


def _find_high_rent_burden(profile: ComparisonProfile) -> IssueFinding | None:
    monthly_income = _monthly_income(profile)
    if monthly_income <= 0:
        return None

    rent = _rent_expense(profile.recurring_expenses or [])
    if not rent:
        return None

    monthly_rent = _normalize_monthly(rent.amount, rent.frequency)
    rent_burden = monthly_rent / monthly_income
    if rent_burden < RENT_BURDEN_WARNING:
        return None

    severity = "critical" if rent_burden >= RENT_BURDEN_CRITICAL else "warning"
    return IssueFinding(
        rule_id="high_rent_burden",
        severity=severity,
        impact_score=round(rent_burden * 100, 2),
        metrics={
            "monthly_income": round(monthly_income, 2),
            "monthly_rent": round(monthly_rent, 2),
            "rent_burden_percent": round(rent_burden * 100, 2),
        },
        reasons=[
            "Rent is taking a large share of your monthly income.",
        ],
    )


def _find_tuition_or_outlier_shortfall(profile: ComparisonProfile) -> IssueFinding | None:
    if not profile.outliers:
        return None

    monthly_required = _monthly_recurring_expenses(profile) + _monthly_debt_payments(profile)
    threshold = max(100.0, monthly_required * 0.25) if monthly_required > 0 else 100.0
    for point in project_monthly_balances(profile, months=12):
        if point["outlier_impact"] >= 0:
            continue
        liquid_balance = point["liquid_balance"]
        if liquid_balance > threshold:
            continue

        severity = "critical" if liquid_balance < 0 else "warning"
        return IssueFinding(
            rule_id="tuition_or_outlier_shortfall",
            severity=severity,
            impact_score=round(max(threshold - liquid_balance, 0.0), 2),
            metrics={
                "crunch_month": point["month"],
                "projected_liquid_balance": round(liquid_balance, 2),
                "threshold": round(threshold, 2),
                "outlier_impact": round(point["outlier_impact"], 2),
            },
            reasons=[
                "A known one-time expense pushes your cash very low in that month.",
                *[f"Triggered by: {name}" for name in point["outlier_names"]],
            ],
        )
    return None


def _find_decision_timeline_unrealistic(profile: ComparisonProfile) -> IssueFinding | None:
    decision = profile.decision
    if not decision or decision.target_amount is None or decision.deadline_months is None:
        return None

    liquid_balance = _total_balance(_liquid_accounts(profile))
    monthly_surplus = _monthly_income(profile) - (
        _monthly_recurring_expenses(profile) + _monthly_debt_payments(profile)
    )
    remaining_gap = max(decision.target_amount - liquid_balance, 0.0)
    if remaining_gap <= 0:
        return None

    if monthly_surplus <= 0:
        return IssueFinding(
            rule_id="decision_timeline_unrealistic",
            severity="critical",
            impact_score=round(remaining_gap, 2),
            metrics={
                "target_amount": round(decision.target_amount, 2),
                "liquid_balance": round(liquid_balance, 2),
                "deadline_months": decision.deadline_months,
                "months_needed": None,
                "monthly_surplus": round(monthly_surplus, 2),
            },
            reasons=[
                "Your current monthly plan is not generating cash toward this decision.",
            ],
        )

    months_needed = remaining_gap / monthly_surplus
    if months_needed <= decision.deadline_months:
        return None

    return IssueFinding(
        rule_id="decision_timeline_unrealistic",
        severity="warning",
        impact_score=round(months_needed - decision.deadline_months, 2),
        metrics={
            "target_amount": round(decision.target_amount, 2),
            "liquid_balance": round(liquid_balance, 2),
            "deadline_months": decision.deadline_months,
            "months_needed": round(months_needed, 1),
            "monthly_surplus": round(monthly_surplus, 2),
        },
        reasons=[
            "At the current savings pace, this decision takes longer than the requested deadline.",
        ],
    )


def detect_issues(profile: ComparisonProfile, limit: int = 5) -> list[IssueFinding]:
    findings = [
        _find_debt_vs_savings(profile),
        _find_low_yield_savings(profile),
        _find_low_emergency_buffer(profile),
        _find_negative_monthly_cashflow(profile),
        _find_high_rent_burden(profile),
        _find_tuition_or_outlier_shortfall(profile),
        _find_decision_timeline_unrealistic(profile),
    ]
    filtered = [finding for finding in findings if finding is not None]
    filtered.sort(key=lambda finding: (_severity_key(finding.severity), -finding.impact_score))
    return filtered[:limit]
