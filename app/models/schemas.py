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


class Goal(BaseModel):
    description: str | None = None
    target_amount: float | None = None
    deadline_months: int | None = None


class FinancialProfile(BaseModel):
    income: Income | None = None
    expenses: list[Expense] | None = None
    debt: list[Debt] | None = None
    accounts: list[Account] | None = None
    goal: Goal | None = None


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


class ComparisonProfile(BaseModel):
    profile_label: str | None = None
    scenario_name: str | None = None
    income_sources: list[IncomeSourceItem] | None = None
    debts: list[DebtItem] | None = None
    recurring_expenses: list[RecurringExpenseItem] | None = None
    outliers: list[OutlierItem] | None = None
    accounts: list[AccountItem] | None = None
    dashboard_summary: DashboardSummary | None = None


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

class ScenarioParseRequest(BaseModel):
    user_id: str
    question: str


class ExpenseChange(BaseModel):
    name: str
    new_amount: float


class NewExpense(BaseModel):
    name: str
    amount: float
    frequency: str = "monthly"


class GoalOverride(BaseModel):
    target_amount: float | None = None
    deadline_months: int | None = None


class ScenarioChanges(BaseModel):
    income_change: float | None = None
    expense_changes: list[ExpenseChange] | None = None
    new_expenses: list[NewExpense] | None = None
    goal_override: GoalOverride | None = None


class ScenarioParseResponse(BaseModel):
    scenario_type: str
    parsed_changes: ScenarioChanges
    comparison_label: str


class MonthSnapshot(BaseModel):
    month: int
    balance: float
    savings: float
    debt_remaining: float


class ScenarioExplainRequest(BaseModel):
    user_id: str
    current: list[MonthSnapshot]
    modified: list[MonthSnapshot]


class ScenarioExplainResponse(BaseModel):
    verdict: str
    feasible: bool
    risk: str
    insight: str
