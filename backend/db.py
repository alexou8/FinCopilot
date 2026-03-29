import logging
from backend.config import SUPABASE_URL, SUPABASE_SERVICE_KEY
from backend.models.schemas import ComparisonProfile, FinancialProfile
from backend.services.profile_translation import comparison_to_legacy, legacy_to_comparison

logger = logging.getLogger(__name__)

# ── Try to connect to Supabase; fall back to in-memory storage ───────

_use_memory = False
_conversations: dict[str, list[dict]] = {}
_profiles: dict[str, dict] = {}

try:
    from supabase import create_client, Client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    # Quick connectivity check
    supabase.table("conversations").select("id").limit(1).execute()
    logger.info("Connected to Supabase")
except Exception as e:
    logger.warning("Supabase unavailable (%s) — using in-memory storage", e)
    _use_memory = True


async def get_conversation_history(user_id: str) -> list[dict]:
    """Fetch all messages for a user, ordered by creation time."""
    if _use_memory:
        return _conversations.get(user_id, [])
    response = (
        supabase.table("conversations")
        .select("role, content")
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    return response.data


async def save_message(user_id: str, role: str, content: str) -> None:
    """Insert a single message into the conversations table."""
    if _use_memory:
        _conversations.setdefault(user_id, []).append(
            {"role": role, "content": content}
        )
        return
    supabase.table("conversations").insert(
        {"user_id": user_id, "role": role, "content": content}
    ).execute()


async def get_profile(user_id: str) -> dict | None:
    """Fetch the legacy financial profile for a user."""
    if _use_memory:
        return _profiles.get(user_id)
    response = (
        supabase.table("financial_profiles")
        .select("profile_data_before, profile_data_after")
        .eq("user_id", user_id)
        .execute()
    )
    if response.data:
        row = response.data[0]
        profile_data = row.get("profile_data_before") or row.get("profile_data_after")
        if not profile_data:
            return None
        comparison = ComparisonProfile(**profile_data)
        return comparison_to_legacy(comparison).model_dump()
    return None


async def upsert_profile(user_id: str, data: dict) -> None:
    """Create a profile row if missing, otherwise update the existing row."""
    if _use_memory:
        _profiles[user_id] = data
        return
    legacy_profile = FinancialProfile(**data)
    comparison = legacy_to_comparison(legacy_profile)
    payload = {"profile_data_before": comparison.model_dump()}
    existing = (
        supabase.table("financial_profiles")
        .select("id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        (
            supabase.table("financial_profiles")
            .update(payload)
            .eq("user_id", user_id)
            .execute()
        )
        return
    supabase.table("financial_profiles").insert(
        {"user_id": user_id, **payload}
    ).execute()


async def get_profile_raw(user_id: str) -> dict | None:
    """Return the raw profile_data_before dict for a user (ComparisonProfile shape)."""
    if _use_memory:
        return _profiles.get(user_id)
    response = (
        supabase.table("financial_profiles")
        .select("profile_data_before")
        .eq("user_id", user_id)
        .execute()
    )
    if response.data:
        return response.data[0].get("profile_data_before")
    return None


async def get_comparison_profile(
    user_id: str, target_profile: str = "before"
) -> dict | None:
    """Return the raw comparison profile for the requested before/after slot."""
    column = "profile_data_after" if target_profile == "after" else "profile_data_before"
    if _use_memory:
        stored = _profiles.get(user_id)
        if not stored:
            return None
        return stored.get(column)
    response = (
        supabase.table("financial_profiles")
        .select(column)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if response.data:
        return response.data[0].get(column)
    return None


async def save_comparison_profile(
    user_id: str, profile_data: dict, target_profile: str = "before"
) -> None:
    """Create a row if missing, otherwise update the chosen before/after profile slot."""
    column = "profile_data_after" if target_profile == "after" else "profile_data_before"
    if _use_memory:
        _profiles.setdefault(user_id, {})[column] = profile_data
        return
    payload = {column: profile_data}
    existing = (
        supabase.table("financial_profiles")
        .select("id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        supabase.table("financial_profiles").update(payload).eq("user_id", user_id).execute()
        return
    supabase.table("financial_profiles").insert({"user_id": user_id, **payload}).execute()


# ── Simulations ───────────────────────────────────────────────────────

_simulations: list[dict] = []


async def get_simulations(user_id: str) -> list[dict]:
    """Fetch all simulations for a user, newest first."""
    if _use_memory:
        return [s for s in _simulations if s.get("user_id") == user_id]
    response = (
        supabase.table("simulations")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


async def save_simulation(data: dict) -> dict:
    """Insert a simulation row; returns the inserted row with its generated id."""
    if _use_memory:
        new_id = len(_simulations) + 1
        row = {"id": new_id, **data}
        _simulations.append(row)
        return row
    response = (
        supabase.table("simulations")
        .insert(data)
        .execute()
    )
    return response.data[0] if response.data else data


async def delete_simulation(simulation_id: int) -> None:
    """Delete a simulation by id."""
    if _use_memory:
        global _simulations
        _simulations = [s for s in _simulations if s.get("id") != simulation_id]
        return
    supabase.table("simulations").delete().eq("id", simulation_id).execute()
