from fastapi import APIRouter, HTTPException

from backend.models.schemas import (
    ScenarioCompareRequest,
    ScenarioCompareResponse,
    ScenarioExplainRequest,
    ScenarioExplainResponse,
    FinancialProfile,
)
from backend.services.scenario_parser import parse_decision, explain_comparison
from backend.db import get_profile

router = APIRouter()


@router.post("/scenarios/compare", response_model=ScenarioCompareResponse)
async def compare(req: ScenarioCompareRequest):
    """Parse the user's big decision into two structured paths: Proceed vs Save & Invest."""
    profile_data = await get_profile(req.user_id)
    if not profile_data:
        raise HTTPException(status_code=404, detail="Financial profile not found")

    profile = FinancialProfile(**profile_data)

    try:
        result = await parse_decision(profile)
    except Exception:
        raise HTTPException(status_code=502, detail="AI service unavailable")

    return result


@router.post("/scenarios/explain", response_model=ScenarioExplainResponse)
async def explain(req: ScenarioExplainRequest):
    """Generate a plain-language verdict comparing Path A vs Path B simulation results."""
    try:
        result = await explain_comparison(req.path_a_trajectory, req.path_b_trajectory)
    except Exception:
        raise HTTPException(status_code=502, detail="AI service unavailable")

    return result
