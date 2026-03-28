from backend.db import get_profile, upsert_profile
from backend.models.schemas import ComparisonProfile, FinancialProfile
from backend.services.profile_translation import comparison_to_legacy, legacy_to_comparison


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


def comparison_to_legacy_profile(profile: ComparisonProfile) -> FinancialProfile:
    """Expose the comparison -> legacy mapper for callers that need both shapes."""
    return comparison_to_legacy(profile)


def legacy_to_comparison_profile(profile: FinancialProfile) -> ComparisonProfile:
    """Expose the legacy -> comparison mapper for callers that need both shapes."""
    return legacy_to_comparison(profile)
