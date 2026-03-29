"""Simulations router: run a scenario, list history, delete a simulation."""
import logging
import re
from datetime import datetime

from fastapi import APIRouter, HTTPException

from backend.db import (
    delete_simulation,
    get_comparison_profile,
    get_simulations,
    save_simulation,
)
from backend.models.schemas import (
    ComparisonProfile,
    RunSimulationRequest,
    SimulationRecord,
)
from backend.services.simulation_engine import (
    calculate_monthly_net_worth,
    calculate_summary,
    generate_recommendation,
)

router = APIRouter(prefix="/simulations", tags=["simulations"])
logger = logging.getLogger(__name__)


def _scenario_key(name: str) -> str:
    """Convert a scenario name to a unique URL-safe key for historical runs."""
    base = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_") or "simulation"
    stamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return f"{base[:48]}_{stamp}"


@router.post("/run", response_model=SimulationRecord)
async def run_simulation(req: RunSimulationRequest):
    """Run a new deterministic simulation using stored before/after profiles."""
    raw_before = await get_comparison_profile(req.user_id, "before")
    if not raw_before:
        raise HTTPException(
            status_code=404,
            detail="No before profile found for this user. Please complete onboarding first.",
        )

    raw_after = await get_comparison_profile(req.user_id, "after")
    if not raw_after:
        raise HTTPException(
            status_code=404,
            detail="No after profile found for this user. Please build the comparison scenario first.",
        )

    try:
        profile_before = ComparisonProfile(**raw_before)
        profile_after = ComparisonProfile(**raw_after)
    except Exception as exc:
        logger.exception("Invalid comparison profiles for user %s", req.user_id)
        raise HTTPException(status_code=422, detail=f"Profile data is malformed: {exc}") from exc

    months = 12
    traj_before = calculate_monthly_net_worth(profile_before, months)
    traj_after = calculate_monthly_net_worth(profile_after, months)

    summary_before = calculate_summary(profile_before)
    summary_after = calculate_summary(profile_after)

    scenario_name = req.scenario_name or req.prompt or "Scenario comparison"
    recommendation = await generate_recommendation(
        scenario_name,
        summary_before,
        summary_after,
    )

    scenario_key = _scenario_key(scenario_name)
    row = await save_simulation(
        {
            "user_id": req.user_id,
            "scenario_key": scenario_key,
            "scenario_name": scenario_name,
            "months": months,
            "monthly_net_worth_before": [p.model_dump() for p in traj_before],
            "monthly_net_worth_after": [p.model_dump() for p in traj_after],
            "summary_before": summary_before.model_dump(),
            "summary_after": summary_after.model_dump(),
            "recommendation": recommendation.model_dump(),
            "profile_data_before": profile_before.model_dump(),
            "profile_data_after": profile_after.model_dump(),
        }
    )

    return SimulationRecord(
        id=row.get("id"),
        user_id=req.user_id,
        scenario_key=scenario_key,
        scenario_name=scenario_name,
        months=months,
        monthly_net_worth_before=traj_before,
        monthly_net_worth_after=traj_after,
        summary_before=summary_before,
        summary_after=summary_after,
        recommendation=recommendation,
        profile_data_before=profile_before.model_dump(),
        profile_data_after=profile_after.model_dump(),
        created_at=str(row.get("created_at", "")),
    )


@router.get("/{user_id}", response_model=list[SimulationRecord])
async def list_simulations(user_id: str):
    """Fetch all simulations for a user, newest first."""
    rows = await get_simulations(user_id)
    records = []
    for row in rows:
        try:
            records.append(
                SimulationRecord(
                    id=row.get("id"),
                    user_id=row.get("user_id", user_id),
                    scenario_key=row.get("scenario_key", ""),
                    scenario_name=row.get("scenario_name", ""),
                    months=row.get("months", 12),
                    monthly_net_worth_before=row.get("monthly_net_worth_before", []),
                    monthly_net_worth_after=row.get("monthly_net_worth_after", []),
                    summary_before=row.get("summary_before", {}),
                    summary_after=row.get("summary_after", {}),
                    recommendation=row.get("recommendation", {}),
                    profile_data_before=row.get("profile_data_before"),
                    profile_data_after=row.get("profile_data_after"),
                    created_at=str(row.get("created_at", "")),
                )
            )
        except Exception:
            logger.warning("Skipping malformed simulation row id=%s", row.get("id"))
    return records


@router.delete("/{simulation_id}")
async def remove_simulation(simulation_id: int):
    """Delete a simulation by id."""
    await delete_simulation(simulation_id)
    return {"deleted": simulation_id}
