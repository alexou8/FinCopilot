from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    ScenarioParseRequest,
    ScenarioParseResponse,
    ScenarioExplainRequest,
    ScenarioExplainResponse,
    FinancialProfile,
)
from app.services.scenario_parser import parse_scenario, explain_scenario
from app.db import get_profile

router = APIRouter()


@router.post("/scenarios/parse", response_model=ScenarioParseResponse)
async def parse(req: ScenarioParseRequest):
    """Parse a natural-language what-if question into structured scenario changes."""
    profile_data = await get_profile(req.user_id)
    if not profile_data:
        raise HTTPException(status_code=404, detail="Financial profile not found")

    profile = FinancialProfile(**profile_data)

    try:
        result = await parse_scenario(profile, req.question)
    except Exception:
        raise HTTPException(status_code=502, detail="AI service unavailable")

    return result


@router.post("/scenarios/explain", response_model=ScenarioExplainResponse)
async def explain(req: ScenarioExplainRequest):
    """Generate a plain-language comparison of current vs modified financial trajectories."""
    try:
        result = await explain_scenario(req.current, req.modified)
    except Exception:
        raise HTTPException(status_code=502, detail="AI service unavailable")

    return result
