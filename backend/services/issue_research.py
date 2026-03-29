from __future__ import annotations

import json
import logging
from typing import Any
from urllib.parse import quote_plus, urlparse

from backend.models.schemas import (
    ComparisonProfile,
    IssueResearchFinding,
    IssueResearchPlan,
    IssueResearchRecommendation,
    IssueResearchResponse,
    IssueResearchSource,
    IssueResearchStep,
)
from backend.services.issue_catalog import get_issue_catalog_entry
from backend.services.issue_rules import IssueFinding
from backend.services.llm import client

logger = logging.getLogger(__name__)


ISSUE_RESEARCH_BRIEFS: dict[str, dict[str, Any]] = {
    "debt_vs_savings": {
        "query": "best ways to pay off high interest credit card debt balance transfer credit counselling Canada",
        "browser_goal": "Find current debt payoff options that can lower interest costs faster than leaving cash in a low-yield savings account.",
        "resource_types": [
            "official bank balance transfer pages",
            "nonprofit credit counselling organizations",
            "trusted debt repayment explainers",
        ],
        "focus_points": [
            "intro APR or promotional balance transfer details",
            "transfer fees or other costs",
            "what action reduces interest first",
        ],
    },
    "low_yield_savings": {
        "query": "best high interest savings account rates Canada no monthly fee student",
        "browser_goal": "Find current savings products with materially better yield, low fees, and simple setup requirements.",
        "resource_types": [
            "official bank or credit union rate pages",
            "trusted personal finance comparison sites",
            "TFSA or HISA explainers",
        ],
        "focus_points": [
            "current APY or interest rate",
            "monthly fees or minimum balance rules",
            "whether the product is easy to switch into",
        ],
    },
    "low_emergency_buffer": {
        "query": "how to build an emergency fund quickly student budget low income Canada",
        "browser_goal": "Find practical ways to rebuild a starter emergency fund without adding high-cost debt.",
        "resource_types": [
            "trusted budgeting guides",
            "bank savings automation tools",
            "student support or emergency aid resources",
        ],
        "focus_points": [
            "starter emergency fund targets",
            "small automatic transfer strategies",
            "fee-free cash parking options",
        ],
    },
    "negative_monthly_cashflow": {
        "query": "student budget cuts low cost phone internet transit grocery options Canada",
        "browser_goal": "Find realistic expense cuts and support programs that can close a monthly cash shortfall quickly.",
        "resource_types": [
            "budgeting resources",
            "low-cost service plan pages",
            "student discount or support program pages",
        ],
        "focus_points": [
            "monthly savings opportunities",
            "recurring bills that can be renegotiated",
            "support programs or discounts with current pricing",
        ],
    },
    "high_rent_burden": {
        "query": "student room rent near campus roommate listings internet transit cost Canada",
        "browser_goal": "Gather current housing and living-cost examples to see whether cheaper rent scenarios are realistic.",
        "resource_types": [
            "housing listing pages",
            "student housing boards",
            "internet or transit cost pages",
        ],
        "focus_points": [
            "room or shared-unit rent ranges",
            "typical internet or transit add-ons",
            "trade-offs between current rent and cheaper options",
        ],
    },
    "tuition_or_outlier_shortfall": {
        "query": "student tuition payment plan emergency bursary deadline Canada",
        "browser_goal": "Find current payment-plan, bursary, or short-term bridge options for a crunch month caused by a known expense.",
        "resource_types": [
            "school registrar or finance office pages",
            "student aid pages",
            "trusted banking or student line-of-credit explainers",
        ],
        "focus_points": [
            "payment plan availability or fees",
            "emergency bursary eligibility",
            "how to split a one-time cost across multiple months",
        ],
    },
    "decision_timeline_unrealistic": {
        "query": "cost to move out first apartment budget deposits utilities internet Canada",
        "browser_goal": "Pull current cost examples and lower-cost alternatives so the user can reset an unrealistic timeline with real numbers.",
        "resource_types": [
            "housing cost guides",
            "deposit and utility explainers",
            "side-income or cost-cutting resources",
        ],
        "focus_points": [
            "upfront moving costs",
            "ongoing monthly costs",
            "lower-cost alternatives that buy more time",
        ],
    },
}


def _fmt_currency(value: float | int | None) -> str:
    if value is None:
        return "unknown"
    return f"${value:,.0f}"


def _profile_snapshot(profile: ComparisonProfile) -> dict[str, Any]:
    dashboard = profile.dashboard_summary
    savings_accounts = [
        account
        for account in (profile.accounts or [])
        if (account.type or "").lower() in {"savings", "hisa", "tfsa", "cash"}
    ]
    liquid_balance = sum((account.balance or 0) for account in (profile.accounts or []))
    return {
        "monthly_income": getattr(dashboard, "monthly_income", None),
        "monthly_surplus": getattr(dashboard, "monthly_surplus", None),
        "monthly_expenses": (
            None
            if dashboard is None
            else round((dashboard.monthly_income or 0) - (dashboard.monthly_surplus or 0), 2)
        ),
        "debt_total": getattr(dashboard, "debt_total", None),
        "account_total": getattr(dashboard, "account_total", None),
        "liquid_balance": liquid_balance,
        "savings_accounts": [
            {
                "name": account.name,
                "balance": account.balance,
                "interest_rate": account.interest_rate,
            }
            for account in savings_accounts
        ],
        "decision": profile.decision.model_dump(mode="json") if profile.decision else None,
    }


def _default_brief(rule_id: str) -> dict[str, Any]:
    return ISSUE_RESEARCH_BRIEFS.get(
        rule_id,
        {
            "query": "financial issue solutions current costs trusted resources",
            "browser_goal": "Find current resources and costs that help the user address this financial issue.",
            "resource_types": ["official guidance", "trusted comparison pages"],
            "focus_points": ["practical next steps", "current numbers", "risks to avoid"],
        },
    )


def _build_search_url(query: str) -> str:
    return f"https://www.google.com/search?q={quote_plus(query)}"


def _host_label(url: str) -> str:
    host = urlparse(url).netloc.replace("www.", "")
    return host or "Source"


def _add_source(
    sources: list[IssueResearchSource],
    seen: set[str],
    *,
    url: str | None,
    title: str | None = None,
) -> None:
    if not url or url in seen:
        return
    seen.add(url)
    sources.append(IssueResearchSource(title=title or _host_label(url), url=url))


def _extract_sources(response: Any) -> list[IssueResearchSource]:
    sources: list[IssueResearchSource] = []
    seen: set[str] = set()

    for item in getattr(response, "output", []) or []:
        if getattr(item, "type", None) == "web_search_call":
            action = getattr(item, "action", None)
            if getattr(action, "type", None) == "search":
                for source in getattr(action, "sources", []) or []:
                    _add_source(sources, seen, url=getattr(source, "url", None))

        if getattr(item, "type", None) != "message":
            continue

        for content in getattr(item, "content", []) or []:
            if getattr(content, "type", None) != "output_text":
                continue
            for annotation in getattr(content, "annotations", []) or []:
                if getattr(annotation, "type", None) == "url_citation":
                    _add_source(
                        sources,
                        seen,
                        url=getattr(annotation, "url", None),
                        title=getattr(annotation, "title", None),
                    )

    return sources[:8]


def _metric_findings(rule_id: str, metrics: dict[str, Any]) -> list[IssueResearchFinding]:
    if rule_id == "debt_vs_savings":
        return [
            IssueResearchFinding(
                label="High-interest debt",
                value=_fmt_currency(metrics.get("high_interest_debt_balance")),
                detail=f"{metrics.get('debt_rate', 'unknown')}% interest on the expensive balance.",
            ),
            IssueResearchFinding(
                label="Idle savings",
                value=_fmt_currency(metrics.get("idle_savings_balance")),
                detail=f"{metrics.get('savings_rate', 'unknown')}% savings rate right now.",
            ),
        ]
    if rule_id == "low_yield_savings":
        return [
            IssueResearchFinding(
                label="Savings balance",
                value=_fmt_currency(metrics.get("savings_balance")),
                detail=f"Earning about {metrics.get('savings_rate', 'unknown')}% right now.",
            ),
        ]
    if rule_id == "low_emergency_buffer":
        return [
            IssueResearchFinding(
                label="Emergency cushion",
                value=f"{metrics.get('emergency_months', 'unknown')} months",
                detail=f"Liquid cash of {_fmt_currency(metrics.get('liquid_balance'))} against monthly obligations of {_fmt_currency(metrics.get('monthly_required'))}.",
            ),
        ]
    if rule_id == "negative_monthly_cashflow":
        monthly_surplus = metrics.get("monthly_surplus")
        return [
            IssueResearchFinding(
                label="Monthly shortfall",
                value=_fmt_currency(abs(monthly_surplus or 0)),
                detail=f"Income {_fmt_currency(metrics.get('monthly_income'))} vs obligations {_fmt_currency(metrics.get('monthly_expenses'))}.",
            ),
        ]
    if rule_id == "high_rent_burden":
        return [
            IssueResearchFinding(
                label="Rent burden",
                value=f"{metrics.get('rent_burden_percent', 'unknown')}%",
                detail=f"Rent {_fmt_currency(metrics.get('monthly_rent'))} out of income {_fmt_currency(metrics.get('monthly_income'))}.",
            ),
        ]
    if rule_id == "tuition_or_outlier_shortfall":
        return [
            IssueResearchFinding(
                label="Crunch month",
                value=str(metrics.get("crunch_month", "unknown")),
                detail=f"Projected liquid balance near {_fmt_currency(metrics.get('projected_liquid_balance'))}.",
            ),
        ]
    if rule_id == "decision_timeline_unrealistic":
        return [
            IssueResearchFinding(
                label="Target gap",
                value=_fmt_currency(metrics.get("target_amount")),
                detail=f"Current surplus {_fmt_currency(metrics.get('monthly_surplus'))}; timeline {metrics.get('deadline_months', 'unknown')} months.",
            ),
        ]
    return []


def _fallback_research(
    *,
    rule_id: str,
    title: str,
    action: str,
    finding: IssueFinding,
) -> IssueResearchResponse:
    brief = _default_brief(rule_id)
    query = brief["query"]
    search_url = _build_search_url(query)
    reasons = " ".join(finding.reasons).strip()

    findings = _metric_findings(rule_id, finding.metrics)
    if not findings:
        findings = [
            IssueResearchFinding(
                label="Issue detected",
                value=title,
                detail=reasons or "Use the guided search to gather current options.",
            )
        ]

    return IssueResearchResponse(
        rule_id=rule_id,
        title=title,
        action=action,
        mode="manual",
        search_query=query,
        search_url=search_url,
        browser_goal=brief["browser_goal"],
        summary=reasons or f"Start with a guided search to gather current options for {title.lower()}.",
        findings=findings,
        steps=[
            IssueResearchStep(
                title="Open the search",
                action=f"Search for: {query}",
                reason="This query is tuned to the specific issue and looks for current pricing, support, and solution pages.",
                source_hint="Open the search tab first, then keep only reputable pages.",
            ),
            IssueResearchStep(
                title="Shortlist trusted sources",
                action="Open 2 to 4 official or well-known pages and note the most relevant numbers.",
                reason="The goal is to compare reliable options, not collect random advice.",
                source_hint=", ".join(brief["resource_types"][:2]),
            ),
            IssueResearchStep(
                title="Bring the numbers back",
                action="Compare the monthly cost, rate, fee, or eligibility details against your current situation.",
                reason="The research is only useful once it changes the decision you can make this month.",
                source_hint=", ".join(brief["focus_points"][:2]),
            ),
        ],
        recommendations=[
            IssueResearchRecommendation(
                title="Start with one measurable change",
                description="Pick the option that creates the clearest monthly improvement or reduces the highest risk first.",
                expected_impact="Use the live search results to estimate the monthly difference before acting.",
            ),
            IssueResearchRecommendation(
                title="Prefer official sources",
                description="Bank pages, nonprofit agencies, school finance offices, and utility providers should outweigh generic blog advice.",
                expected_impact="Better inputs reduce the chance of a bad recommendation.",
            ),
        ],
        sources=[],
    )


async def build_issue_research(
    *,
    profile: ComparisonProfile,
    finding: IssueFinding,
) -> IssueResearchResponse:
    meta = get_issue_catalog_entry(finding.rule_id)
    brief = _default_brief(finding.rule_id)

    instructions = (
        "You are FinCopilot's guided browser research agent. "
        "You must use the web_search tool because the user needs current resources, costs, or rates. "
        "Research the issue using reputable and current sources. Prefer official institutions, schools, government pages, "
        "major providers, or established nonprofit organizations over generic blogs. "
        "Return concise structured output for a UI that will open a new browser tab and narrate the research process. "
        "Do not invent prices, rates, or eligibility rules. If the evidence is mixed, say so briefly inside the summary or detail fields."
    )

    prompt = {
        "issue": {
            "rule_id": finding.rule_id,
            "title": meta.title,
            "action": meta.action,
            "severity": finding.severity,
            "metrics": finding.metrics,
            "reasons": finding.reasons,
        },
        "profile_snapshot": _profile_snapshot(profile),
        "research_brief": brief,
        "output_requirements": {
            "query": "Short web search query suitable for opening in a new tab.",
            "browser_goal": "One sentence describing what the browser agent is trying to verify.",
            "summary": "Two or three sentences with the most important current takeaways.",
            "findings": "Two to four concrete facts, rates, costs, or eligibility notes.",
            "steps": "Exactly three narrated browser steps with title, action, reason, and optional source_hint.",
            "recommendations": "Two or three practical next actions with expected impact when possible.",
        },
    }

    try:
        response = await client.responses.parse(
            model="gpt-4.1-mini",
            instructions=instructions,
            input=json.dumps(prompt, indent=2),
            temperature=0.2,
            include=["web_search_call.action.sources"],
            tools=[{"type": "web_search"}],
            text_format=IssueResearchPlan,
        )
        plan = response.output_parsed
        if plan is None:
            raise RuntimeError("Issue research returned no parsed output")

        search_query = plan.query.strip() or brief["query"]
        sources = _extract_sources(response)
        return IssueResearchResponse(
            rule_id=finding.rule_id,
            title=meta.title,
            action=meta.action,
            mode="live" if sources else "manual",
            search_query=search_query,
            search_url=_build_search_url(search_query),
            browser_goal=plan.browser_goal,
            summary=plan.summary,
            findings=plan.findings,
            steps=plan.steps,
            recommendations=plan.recommendations,
            sources=sources,
        )
    except Exception:
        logger.exception("Issue research web search failed for %s", finding.rule_id)
        return _fallback_research(
            rule_id=finding.rule_id,
            title=meta.title,
            action=meta.action,
            finding=finding,
        )
