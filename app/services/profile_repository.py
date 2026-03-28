from app.db import get_profile, upsert_profile
from app.models.schemas import FinancialProfile


async def get_profile_by_user_id(user_id: str) -> FinancialProfile | None:
    """Fetch a user's financial profile from persistence."""
    profile_data = await get_profile(user_id)
    if not profile_data:
        return None
    return FinancialProfile(**profile_data)


async def upsert_profile_by_user_id(
    user_id: str, profile: FinancialProfile
) -> FinancialProfile:
    """Create or replace a user's financial profile in persistence."""
    profile_data = profile.model_dump()
    await upsert_profile(user_id, profile_data)
    return profile
