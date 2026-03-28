import json
import logging

from app.services.llm import chat_completion
from app.prompts.scenario import SCENARIO_PARSE_SYSTEM_PROMPT, SCENARIO_EXPLAIN_SYSTEM_PROMPT
from app.models.schemas import (
    FinancialProfile,
    ScenarioChanges,
    ScenarioParseResponse,
    ScenarioExplainResponse,
    MonthSnapshot,
)

logger = logging.getLogger(__name__)


async def parse_scenario(
    profile: FinancialProfile, question: str
) -> ScenarioParseResponse:
    """Parse a natural-language what-if question into structured changes."""
    user_message = (
        f"User's financial profile:\n{profile.model_dump_json(indent=2)}\n\n"
        f"Question: {question}"
    )

    messages = [
        {"role": "system", "content": SCENARIO_PARSE_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    raw = await chat_completion(messages, temperature=0, json_mode=True)
    data = json.loads(raw)

    return ScenarioParseResponse(
        scenario_type=data.get("scenario_type", "unknown"),
        parsed_changes=ScenarioChanges(**(data.get("changes") or {})),
        comparison_label=data.get("comparison_label", ""),
    )


async def explain_scenario(
    current: list[MonthSnapshot], modified: list[MonthSnapshot]
) -> ScenarioExplainResponse:
    """Generate a plain-language comparison of two projected trajectories."""
    user_message = (
        f"Current trajectory:\n{json.dumps([s.model_dump() for s in current], indent=2)}\n\n"
        f"Modified trajectory:\n{json.dumps([s.model_dump() for s in modified], indent=2)}"
    )

    messages = [
        {"role": "system", "content": SCENARIO_EXPLAIN_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    raw = await chat_completion(messages, temperature=0.3, json_mode=True)
    data = json.loads(raw)

    return ScenarioExplainResponse(
        verdict=data.get("verdict", ""),
        feasible=data.get("feasible", False),
        risk=data.get("risk", ""),
        insight=data.get("insight", ""),
    )
