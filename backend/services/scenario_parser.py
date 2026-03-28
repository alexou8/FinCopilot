import json
import logging

from backend.services.llm import chat_completion
from backend.prompts.scenario import SCENARIO_PARSE_SYSTEM_PROMPT, SCENARIO_EXPLAIN_SYSTEM_PROMPT
from backend.models.schemas import (
    FinancialProfile,
    PathA,
    PathB,
    ScenarioCompareResponse,
    ScenarioExplainResponse,
    MonthSnapshot,
)

logger = logging.getLogger(__name__)


async def parse_decision(profile: FinancialProfile) -> ScenarioCompareResponse:
    """Analyse the user's profile and big decision, returning structured Path A vs Path B."""
    user_message = (
        f"User's financial profile:\n{profile.model_dump_json(indent=2)}"
    )

    messages = [
        {"role": "system", "content": SCENARIO_PARSE_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    raw = await chat_completion(messages, temperature=0, json_mode=True)
    data = json.loads(raw)

    return ScenarioCompareResponse(
        decision_summary=data.get("decision_summary", ""),
        timeline_months=data.get("timeline_months", 12),
        path_a=PathA(**(data.get("path_a") or {})),
        path_b=PathB(**(data.get("path_b") or {})),
    )


async def explain_comparison(
    path_a_trajectory: list[MonthSnapshot],
    path_b_trajectory: list[MonthSnapshot],
) -> ScenarioExplainResponse:
    """Generate a plain-language verdict comparing Path A vs Path B simulation results."""
    user_message = (
        f"Path A (Proceed) trajectory:\n"
        f"{json.dumps([s.model_dump() for s in path_a_trajectory], indent=2)}\n\n"
        f"Path B (Save & Invest) trajectory:\n"
        f"{json.dumps([s.model_dump() for s in path_b_trajectory], indent=2)}"
    )

    messages = [
        {"role": "system", "content": SCENARIO_EXPLAIN_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    raw = await chat_completion(messages, temperature=0.3, json_mode=True)
    data = json.loads(raw)

    return ScenarioExplainResponse(
        verdict=data.get("verdict", ""),
        path_a_feasible=data.get("path_a_feasible", False),
        path_b_advantage=data.get("path_b_advantage", ""),
        path_a_advantage=data.get("path_a_advantage", ""),
        risk=data.get("risk", ""),
        recommendation=data.get("recommendation", ""),
    )
