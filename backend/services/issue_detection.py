import json
import logging

from backend.models.schemas import FinancialProfile, Issue
from backend.services.llm import chat_completion
from backend.prompts.explanation import ISSUE_EXPLANATION_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

# Display metadata for each rule — title + action shown in the Issues panel
_RULE_META: dict[str, dict] = {
    "debt_vs_savings": {
        "title": "Credit card interest exceeds savings earnings",
        "action": "See payoff plan",
        "actionType": "scenario",
    },
    "no_interest_savings": {
        "title": "Savings account earning near-zero interest",
        "action": "Compare TFSA & HISA options",
        "actionType": "advice",
    },
    "low_emergency_buffer": {
        "title": "Emergency fund covers less than 1 month of expenses",
        "action": "Build emergency fund plan",
        "actionType": "advice",
    },
    "spending_exceeds_income": {
        "title": "Monthly spending exceeds income",
        "action": "Review budget",
        "actionType": "advice",
    },
    "unrealistic_goal": {
        "title": "Move-out goal timeline is unrealistic at current savings rate",
        "action": "Run move-out scenario",
        "actionType": "scenario",
    },
}


def _normalize_monthly(amount: float, frequency: str) -> float:
    """Convert an amount to monthly based on its frequency."""
    freq = frequency.lower()
    if freq == "weekly":
        return amount * 4.33
    if freq == "biweekly":
        return amount * 2.17
    return amount  # already monthly


def detect_issues(profile: FinancialProfile) -> list[dict]:
    """Run deterministic rules against the profile. Returns raw issues (no explanations yet)."""
    issues: list[dict] = []

    monthly_income = 0.0
    if profile.income and profile.income.amount:
        monthly_income = _normalize_monthly(
            profile.income.amount, profile.income.frequency or "monthly"
        )

    total_monthly_expenses = 0.0
    if profile.expenses:
        for exp in profile.expenses:
            total_monthly_expenses += _normalize_monthly(exp.amount, exp.frequency)

    total_account_balances = 0.0
    total_savings = 0.0
    if profile.accounts:
        for acc in profile.accounts:
            total_account_balances += acc.balance
            if acc.type.lower() == "savings":
                total_savings += acc.balance

    monthly_surplus = monthly_income - total_monthly_expenses

    # Rule 1: High-interest debt + idle savings
    has_high_interest_debt = False
    if profile.debt:
        has_high_interest_debt = any(
            d.interest_rate is not None and d.interest_rate > 10 for d in profile.debt
        )
    has_idle_savings = False
    if profile.accounts:
        has_idle_savings = any(
            a.balance > 500 and (a.interest_rate is None or a.interest_rate == 0)
            for a in profile.accounts
        )
    if has_high_interest_debt and has_idle_savings:
        issues.append({"rule_id": "debt_vs_savings", "severity": "critical"})

    # Rule 2: Savings in non-interest-bearing account
    if profile.accounts:
        for acc in profile.accounts:
            if acc.type.lower() == "savings" and (
                acc.interest_rate is None or acc.interest_rate == 0
            ):
                issues.append({"rule_id": "no_interest_savings", "severity": "warning"})
                break

    # Rule 3: Variable income + low emergency buffer
    if (
        profile.income
        and profile.income.is_variable
        and total_monthly_expenses > 0
        and total_account_balances < total_monthly_expenses * 2
    ):
        issues.append({"rule_id": "low_emergency_buffer", "severity": "critical"})

    # Rule 4: Monthly expenses exceed monthly income
    if monthly_income > 0 and total_monthly_expenses > monthly_income:
        issues.append({"rule_id": "spending_exceeds_income", "severity": "critical"})

    # Rule 5: Goal timeline unrealistic
    if (
        profile.decision
        and profile.decision.target_amount is not None
        and profile.decision.deadline_months is not None
        and profile.decision.deadline_months > 0
        and monthly_surplus > 0
    ):
        months_needed = (profile.decision.target_amount - total_savings) / monthly_surplus
        if months_needed > profile.decision.deadline_months:
            issues.append({"rule_id": "unrealistic_goal", "severity": "warning"})

    return issues


async def explain_issues(issues: list[dict], profile: FinancialProfile) -> list[Issue]:
    """Generate plain-language explanations for detected issues via a single LLM call."""
    if not issues:
        return []

    issue_descriptions = "\n".join(
        f"- {i['rule_id']} (severity: {i['severity']})" for i in issues
    )

    user_message = (
        f"User's financial profile:\n{profile.model_dump_json(indent=2)}\n\n"
        f"Detected issues:\n{issue_descriptions}"
    )

    messages = [
        {"role": "system", "content": ISSUE_EXPLANATION_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    try:
        raw = await chat_completion(messages, temperature=0.3, json_mode=True)
        explanations = json.loads(raw).get("explanations", {})
    except Exception:
        logger.exception("Issue explanation LLM call failed")
        explanations = {}

    result: list[Issue] = []
    for issue in issues:
        rid = issue["rule_id"]
        meta = _RULE_META.get(rid, {})
        result.append(
            Issue(
                rule_id=rid,
                severity=issue["severity"],
                title=meta.get("title", rid.replace("_", " ").title()),
                explanation=explanations.get(rid, "Unable to generate explanation."),
                action=meta.get("action", "Learn more"),
                actionType=meta.get("actionType", "advice"),
            )
        )
    return result
