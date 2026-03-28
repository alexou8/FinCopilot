from __future__ import annotations
from pydantic import BaseModel


# ── Shared / Profile sub-models ──────────────────────────────────────

class Income(BaseModel):
    amount: float | None = None
    frequency: str | None = None
    is_variable: bool | None = None


class Expense(BaseModel):
    name: str
    amount: float
    frequency: str = "monthly"


class Debt(BaseModel):
    type: str
    balance: float
    interest_rate: float | None = None
    minimum_payment: float | None = None


class Account(BaseModel):
    type: str
    balance: float
    interest_rate: float | None = None


class RecurringCost(BaseModel):
    name: str
    amount: float
    frequency: str = "monthly"


class Decision(BaseModel):
    description: str | None = None
    target_amount: float | None = None
    deadline_months: int | None = None
    new_recurring_costs: list[RecurringCost] | None = None


class FinancialProfile(BaseModel):
    income: Income | None = None
    expenses: list[Expense] | None = None
    debt: list[Debt] | None = None
    accounts: list[Account] | None = None
    decision: Decision | None = None


class IncomeSourceItem(BaseModel):
    name: str
    type: str
    amount: float
    frequency: str = "monthly"


class DebtItem(BaseModel):
    name: str
    balance: float
    months_remaining: int | None = None
    interest_rate: float | None = None
    minimum_payment: float | None = None


class RecurringExpenseItem(BaseModel):
    name: str
    amount: float
    frequency: str = "monthly"


class OutlierItem(BaseModel):
    name: str
    kind: str
    amount: float
    month: str


class AccountItem(BaseModel):
    name: str
    type: str
    balance: float
    interest_rate: float | None = None


class DashboardSummary(BaseModel):
    monthly_income: float
    monthly_surplus: float
    debt_total: float
    account_total: float


class ComparisonDecision(BaseModel):
    description: str | None = None
    target_amount: float | None = None
    deadline_months: int | None = None
    new_recurring_costs: list[RecurringExpenseItem] | None = None


class ComparisonProfile(BaseModel):
    profile_label: str | None = None
    scenario_name: str | None = None
    income_sources: list[IncomeSourceItem] | None = None
    debts: list[DebtItem] | None = None
    recurring_expenses: list[RecurringExpenseItem] | None = None
    outliers: list[OutlierItem] | None = None
    accounts: list[AccountItem] | None = None
    dashboard_summary: DashboardSummary | None = None
    decision: ComparisonDecision | None = None


# ── Chat ─────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    user_id: str
    message: str


class ChatResponse(BaseModel):
    reply: str
    profile: FinancialProfile | None = None


# ── Issues ───────────────────────────────────────────────────────────

class IssueDetectRequest(BaseModel):
    user_id: str


class Issue(BaseModel):
    rule_id: str
    severity: str
    explanation: str


class IssueDetectResponse(BaseModel):
    issues: list[Issue]


# ── Scenarios ────────────────────────────────────────────────────────

class ScenarioCompareRequest(BaseModel):
    user_id: str


class MonthlyExpense(BaseModel):
    name: str
    amount: float


class PathA(BaseModel):
    label: str
    upfront_cost: float
    new_monthly_expenses: list[MonthlyExpense] | None = None
    removed_monthly_expenses: list[MonthlyExpense] | None = None


class PathB(BaseModel):
    label: str
    strategy: str  # "debt_paydown" | "hisa" | "index_fund"
    monthly_contribution: float
    expected_annual_return: float | None = None
    rationale: str


class ScenarioCompareResponse(BaseModel):
    decision_summary: str
    timeline_months: int
    path_a: PathA
    path_b: PathB


class MonthSnapshot(BaseModel):
    month: int
    balance: float
    savings: float
    debt_remaining: float


class ScenarioExplainRequest(BaseModel):
    user_id: str
    path_a_trajectory: list[MonthSnapshot]
    path_b_trajectory: list[MonthSnapshot]


class ScenarioExplainResponse(BaseModel):
    verdict: str
    path_a_feasible: bool
    path_b_advantage: str
    path_a_advantage: str
    risk: str
    recommendation: str
