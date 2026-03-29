from __future__ import annotations

import json
import logging

from backend.models.schemas import ComparisonProfile, Issue
from backend.prompts.explanation import ISSUE_EXPLANATION_SYSTEM_PROMPT
from backend.services.issue_catalog import get_issue_catalog_entry
from backend.services.issue_rules import IssueFinding, detect_issues as detect_issue_findings
from backend.services.llm import chat_completion

logger = logging.getLogger(__name__)


def detect_issues(profile: ComparisonProfile) -> list[IssueFinding]:
    """Return deterministic issue findings for the baseline profile."""
    return detect_issue_findings(profile)


def _fmt_currency(value: float | int | None) -> str:
    if value is None:
        return "unknown"
    return f"${value:,.0f}"


def _fallback_explanation(finding: IssueFinding) -> str:
    metrics = finding.metrics
    reasons = " ".join(finding.reasons)

    if finding.rule_id == "debt_vs_savings":
        return (
            f"You have about {_fmt_currency(metrics.get('high_interest_debt_balance'))} of high-interest debt "
            f"while {_fmt_currency(metrics.get('idle_savings_balance'))} sits at only "
            f"{metrics.get('savings_rate', 0)}% APY. {reasons}"
        )
    if finding.rule_id == "low_yield_savings":
        return (
            f"Your savings balance of {_fmt_currency(metrics.get('savings_balance'))} is earning only "
            f"{metrics.get('savings_rate', 0)}% APY. {reasons}"
        )
    if finding.rule_id == "low_emergency_buffer":
        return (
            f"You have about {_fmt_currency(metrics.get('liquid_balance'))} available for "
            f"{_fmt_currency(metrics.get('monthly_required'))} of monthly obligations, or roughly "
            f"{metrics.get('emergency_months', 0)} months of cushion. {reasons}"
        )
    if finding.rule_id == "negative_monthly_cashflow":
        return (
            f"Your current monthly income is {_fmt_currency(metrics.get('monthly_income'))}, but your recurring "
            f"obligations are about {_fmt_currency(metrics.get('monthly_expenses'))}. {reasons}"
        )
    if finding.rule_id == "high_rent_burden":
        return (
            f"Rent is using about {metrics.get('rent_burden_percent', 0)}% of your monthly income "
            f"({_fmt_currency(metrics.get('monthly_rent'))} out of {_fmt_currency(metrics.get('monthly_income'))}). "
            f"{reasons}"
        )
    if finding.rule_id == "tuition_or_outlier_shortfall":
        return (
            f"In {metrics.get('crunch_month')}, a planned one-time cost changes your cash by "
            f"{_fmt_currency(metrics.get('outlier_impact'))} and leaves you near "
            f"{_fmt_currency(metrics.get('projected_liquid_balance'))}. {reasons}"
        )
    if finding.rule_id == "decision_timeline_unrealistic":
        months_needed = metrics.get("months_needed")
        if months_needed is None:
            return (
                f"This decision needs {_fmt_currency(metrics.get('target_amount'))}, but your current monthly surplus "
                f"is {_fmt_currency(metrics.get('monthly_surplus'))}. {reasons}"
            )
        return (
            f"This decision needs about {_fmt_currency(metrics.get('target_amount'))} and looks closer to "
            f"{months_needed} months away than the requested {metrics.get('deadline_months')} months. {reasons}"
        )
    return reasons or "This issue needs attention."


async def _generate_llm_explanations(
    findings: list[IssueFinding],
    profile: ComparisonProfile,
) -> dict[str, str]:
    payload = {
        "profile": profile.model_dump(mode="json"),
        "issues": [
            {
                "rule_id": finding.rule_id,
                "severity": finding.severity,
                "metrics": finding.metrics,
                "reasons": finding.reasons,
            }
            for finding in findings
        ],
    }
    messages = [
        {"role": "system", "content": ISSUE_EXPLANATION_SYSTEM_PROMPT},
        {"role": "user", "content": json.dumps(payload, indent=2)},
    ]
    raw = await chat_completion(messages, temperature=0.3, json_mode=True)
    return json.loads(raw).get("explanations", {})


async def explain_issues(
    findings: list[IssueFinding],
    profile: ComparisonProfile,
) -> list[Issue]:
    """Optionally rewrite deterministic findings into friendlier issue cards."""
    if not findings:
        return []

    try:
        llm_explanations = await _generate_llm_explanations(findings, profile)
    except Exception:
        logger.exception("Issue explanation LLM call failed")
        llm_explanations = {}

    explained: list[Issue] = []
    for finding in findings:
        meta = get_issue_catalog_entry(finding.rule_id)
        explained.append(
            Issue(
                rule_id=finding.rule_id,
                severity=finding.severity or meta.default_severity,
                title=meta.title,
                explanation=llm_explanations.get(finding.rule_id, _fallback_explanation(finding)),
                action=meta.action,
                actionType=meta.action_type,
                metrics=finding.metrics,
                reasons=finding.reasons,
            )
        )
    return explained
