from fastapi import APIRouter, HTTPException

from backend.db import get_comparison_profile
from backend.models.schemas import FinancialProfile
from backend.services.profile_repository import (
    get_profile_by_user_id,
    upsert_profile_by_user_id,
)

router = APIRouter()


@router.get("/profiles/{user_id}/comparison")
async def get_comparison_profile_route(user_id: str):
    """Return the raw ComparisonProfile (profile_data_before) for a user."""
    profile = await get_comparison_profile(user_id, "before")
    if not profile:
        raise HTTPException(status_code=404, detail="Comparison profile not found")
    return profile


@router.get("/profiles/{user_id}", response_model=FinancialProfile)
async def get_profile_route(user_id: str):
    """Return the saved financial profile for a user."""
    profile = await get_profile_by_user_id(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Financial profile not found")
    return profile


@router.put("/profiles/{user_id}", response_model=FinancialProfile)
async def upsert_profile_route(user_id: str, profile: FinancialProfile):
    """Create or replace the saved financial profile for a user."""
    return await upsert_profile_by_user_id(user_id, profile)
