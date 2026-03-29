from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class IssueCatalogEntry:
    title: str
    default_severity: str
    action: str
    action_type: str


ISSUE_CATALOG: dict[str, IssueCatalogEntry] = {
    "debt_vs_savings": IssueCatalogEntry(
        title="High-interest debt is outpacing your savings",
        default_severity="critical",
        action="See payoff options",
        action_type="scenario",
    ),
    "low_yield_savings": IssueCatalogEntry(
        title="Your savings are earning very little",
        default_severity="warning",
        action="Compare savings options",
        action_type="advice",
    ),
    "low_emergency_buffer": IssueCatalogEntry(
        title="Your emergency buffer is under 1 month",
        default_severity="critical",
        action="Build a cash buffer",
        action_type="advice",
    ),
    "negative_monthly_cashflow": IssueCatalogEntry(
        title="Your monthly plan is running a deficit",
        default_severity="critical",
        action="Review budget changes",
        action_type="advice",
    ),
    "high_rent_burden": IssueCatalogEntry(
        title="Rent is taking too much of your income",
        default_severity="warning",
        action="Run a housing scenario",
        action_type="scenario",
    ),
    "tuition_or_outlier_shortfall": IssueCatalogEntry(
        title="A known upcoming expense creates a crunch month",
        default_severity="critical",
        action="Stress-test this month",
        action_type="scenario",
    ),
    "decision_timeline_unrealistic": IssueCatalogEntry(
        title="Your current timeline looks unrealistic",
        default_severity="warning",
        action="Compare alternative plans",
        action_type="scenario",
    ),
}

SEVERITY_ORDER = {"critical": 0, "warning": 1, "tip": 2}


def get_issue_catalog_entry(rule_id: str) -> IssueCatalogEntry:
    return ISSUE_CATALOG.get(
        rule_id,
        IssueCatalogEntry(
            title=rule_id.replace("_", " ").title(),
            default_severity="warning",
            action="Learn more",
            action_type="advice",
        ),
    )
