from __future__ import annotations
from typing import Literal
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
    amount: float | None = None   # AI may return null before full extraction
    frequency: str = "monthly"


class DebtItem(BaseModel):
    name: str
    balance: float | None = None  # AI may return null before full extraction
    months_remaining: int | None = None
    interest_rate: float | None = None
    minimum_payment: float | None = None


class RecurringExpenseItem(BaseModel):
    name: str
    amount: float | None = None   # AI may return null before full extraction
    frequency: str = "monthly"


class OutlierItem(BaseModel):
    name: str
    kind: str
    amount: float | None = None   # AI may return null before full extraction
    month: str


class AccountItem(BaseModel):
    name: str
    type: str
    balance: float | None = None  # AI may return null before full extraction
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
    profile_target: Literal["before", "after"] = "before"
    chat_mode: Literal["onboarding", "simulation"] = "onboarding"
    profile_user_id: str | None = None  # real user_id for profile extraction (defaults to user_id)


class ChatResponse(BaseModel):
    reply: str
    profile: ComparisonProfile | None = None


# ── Issues ───────────────────────────────────────────────────────────

class IssueDetectRequest(BaseModel):
    user_id: str


class Issue(BaseModel):
    rule_id: str
    severity: str
    title: str
    explanation: str
    action: str
    actionType: str
    metrics: dict[str, float | int | str | bool | None] | None = None
    reasons: list[str] | None = None


class IssueDetectResponse(BaseModel):
    issues: list[Issue]


class IssueResearchRequest(BaseModel):
    user_id: str
    rule_id: str


class IssueResearchStep(BaseModel):
    title: str
    action: str
    reason: str
    source_hint: str | None = None


class IssueResearchFinding(BaseModel):
    label: str
    value: str
    detail: str | None = None


class IssueResearchRecommendation(BaseModel):
    title: str
    description: str
    expected_impact: str | None = None


class IssueResearchSource(BaseModel):
    title: str
    url: str


class IssueResearchPlan(BaseModel):
    query: str
    browser_goal: str
    summary: str
    findings: list[IssueResearchFinding]
    steps: list[IssueResearchStep]
    recommendations: list[IssueResearchRecommendation]


class IssueResearchResponse(BaseModel):
    rule_id: str
    title: str
    action: str
    mode: Literal["live", "manual"]
    search_query: str
    search_url: str
    browser_goal: str
    summary: str
    findings: list[IssueResearchFinding]
    steps: list[IssueResearchStep]
    recommendations: list[IssueResearchRecommendation]
    sources: list[IssueResearchSource]


class IssueBrowserAgentStartRequest(BaseModel):
    user_id: str
    task_id: str | None = None
    research: IssueResearchResponse


class IssueBrowserAgentStartResponse(BaseModel):
    session_id: str
    task_id: str | None = None
    started: bool
    state: str
    message: str


class IssueBrowserAgentAnswerRequest(BaseModel):
    answer: str


class IssueBrowserAgentVisitedPage(BaseModel):
    title: str
    url: str
    domain: str
    snippet: str | None = None


class IssueBrowserAgentStatusResponse(BaseModel):
    session_id: str
    task_id: str | None = None
    active: bool
    state: str
    message: str | None = None
    question: str | None = None
    result: str | None = None
    current_url: str | None = None
    error: str | None = None
    runtime_mode: str | None = None
    pages_analyzed: int = 0
    domains_analyzed: int = 0
    step_log: list[str] = []
    visited_pages: list[IssueBrowserAgentVisitedPage] = []


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


# ── Simulations ──────────────────────────────────────────────────────

class RunSimulationRequest(BaseModel):
    user_id: str
    scenario_name: str   # e.g. "Can I afford to move out?"
    prompt: str | None = None


class MonthlyNetWorthPoint(BaseModel):
    month: str   # "2026-04"
    value: float


class SimulationSummary(BaseModel):
    debt_total: float
    account_total: float
    monthly_income: float
    monthly_expenses: float
    monthly_surplus: float


class SimulationRecommendation(BaseModel):
    feasible: bool
    headline: str
    body: str
    recommendations: list[str]


class SimulationRecord(BaseModel):
    id: int | None = None
    user_id: str
    scenario_key: str
    scenario_name: str
    months: int
    monthly_net_worth_before: list[MonthlyNetWorthPoint]
    monthly_net_worth_after: list[MonthlyNetWorthPoint]
    summary_before: SimulationSummary
    summary_after: SimulationSummary
    recommendation: SimulationRecommendation
    profile_data_before: dict | None = None
    profile_data_after: dict | None = None
    created_at: str | None = None
