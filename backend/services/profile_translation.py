from backend.models.schemas import (
    Account,
    AccountItem,
    ComparisonDecision,
    ComparisonProfile,
    DashboardSummary,
    Decision,
    Debt,
    DebtItem,
    Expense,
    FinancialProfile,
    Income,
    IncomeSourceItem,
    RecurringCost,
    RecurringExpenseItem,
)


def _normalize_monthly(amount: float, frequency: str | None) -> float:
    freq = (frequency or "monthly").lower()
    if freq == "weekly":
        return amount * 4.33
    if freq == "biweekly":
        return amount * 2.17
    if freq == "yearly":
        return amount / 12
    return amount


def comparison_to_legacy(profile: ComparisonProfile) -> FinancialProfile:
    """Map the persisted comparison profile shape into the legacy workflow model."""
    income_sources = profile.income_sources or []
    monthly_income = sum(
        _normalize_monthly(item.amount, item.frequency) for item in income_sources
    )
    income = None
    if income_sources:
        income = Income(
            amount=round(monthly_income, 2),
            frequency="monthly",
            is_variable=len(income_sources) > 1,
        )

    expenses = None
    if profile.recurring_expenses:
        expenses = [
            Expense(name=item.name, amount=item.amount, frequency=item.frequency)
            for item in profile.recurring_expenses
        ]

    debt = None
    if profile.debts:
        debt = [
            Debt(
                type=item.name,
                balance=item.balance,
                interest_rate=item.interest_rate,
                minimum_payment=item.minimum_payment,
            )
            for item in profile.debts
        ]

    accounts = None
    if profile.accounts:
        accounts = [
            Account(
                type=item.type,
                balance=item.balance,
                interest_rate=item.interest_rate,
            )
            for item in profile.accounts
        ]

    decision = None
    if profile.decision:
        decision = Decision(
            description=profile.decision.description,
            target_amount=profile.decision.target_amount,
            deadline_months=profile.decision.deadline_months,
            new_recurring_costs=[
                RecurringCost(name=c.name, amount=c.amount, frequency=c.frequency)
                for c in (profile.decision.new_recurring_costs or [])
            ] or None,
        )

    return FinancialProfile(
        name=profile.name,
        income=income,
        expenses=expenses,
        debt=debt,
        accounts=accounts,
        decision=decision,
    )


def legacy_to_comparison(
    profile: FinancialProfile,
    *,
    profile_label: str = "before",
    scenario_name: str = "Current path",
) -> ComparisonProfile:
    """Map the legacy workflow profile into the persisted comparison shape."""
    income_sources = None
    if profile.income and profile.income.amount is not None:
        income_sources = [
            IncomeSourceItem(
                name="Primary Income",
                type="job",
                amount=profile.income.amount,
                frequency=profile.income.frequency or "monthly",
            )
        ]

    recurring_expenses = None
    if profile.expenses:
        recurring_expenses = [
            RecurringExpenseItem(
                name=item.name, amount=item.amount, frequency=item.frequency
            )
            for item in profile.expenses
        ]

    debts = None
    if profile.debt:
        debts = [
            DebtItem(
                name=item.type,
                balance=item.balance,
                interest_rate=item.interest_rate,
                minimum_payment=item.minimum_payment,
            )
            for item in profile.debt
        ]

    accounts = None
    if profile.accounts:
        accounts = [
            AccountItem(
                name=item.type.title(),
                type=item.type,
                balance=item.balance,
                interest_rate=item.interest_rate,
            )
            for item in profile.accounts
        ]

    monthly_income = (
        _normalize_monthly(profile.income.amount, profile.income.frequency)
        if profile.income and profile.income.amount is not None
        else 0.0
    )
    monthly_expenses = sum(
        _normalize_monthly(item.amount, item.frequency)
        for item in (profile.expenses or [])
    )
    debt_total = sum(item.balance for item in (profile.debt or []))
    account_total = sum(item.balance for item in (profile.accounts or []))

    decision = None
    if profile.decision:
        decision = ComparisonDecision(
            description=profile.decision.description,
            target_amount=profile.decision.target_amount,
            deadline_months=profile.decision.deadline_months,
            new_recurring_costs=[
                RecurringExpenseItem(name=c.name, amount=c.amount, frequency=c.frequency)
                for c in (profile.decision.new_recurring_costs or [])
            ] or None,
        )

    return ComparisonProfile(
        name=profile.name,
        profile_label=profile_label,
        scenario_name=scenario_name,
        income_sources=income_sources,
        debts=debts,
        recurring_expenses=recurring_expenses,
        outliers=[],
        accounts=accounts,
        dashboard_summary=DashboardSummary(
            monthly_income=round(monthly_income, 2),
            monthly_surplus=round(monthly_income - monthly_expenses, 2),
            debt_total=round(debt_total, 2),
            account_total=round(account_total, 2),
        ),
        decision=decision,
    )
