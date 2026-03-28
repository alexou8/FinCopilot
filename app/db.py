import logging
from app.config import SUPABASE_URL, SUPABASE_KEY

logger = logging.getLogger(__name__)

# ── Try to connect to Supabase; fall back to in-memory storage ───────

_use_memory = False
_conversations: dict[str, list[dict]] = {}
_profiles: dict[str, dict] = {}

try:
    from supabase import create_client, Client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
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
    """Fetch the financial profile for a user. Returns None if not found."""
    if _use_memory:
        return _profiles.get(user_id)
    response = (
        supabase.table("financial_profiles")
        .select("profile_data")
        .eq("user_id", user_id)
        .execute()
    )
    if response.data:
        return response.data[0]["profile_data"]
    return None


async def upsert_profile(user_id: str, data: dict) -> None:
    """Create or update the financial profile for a user."""
    if _use_memory:
        _profiles[user_id] = data
        return
    supabase.table("financial_profiles").upsert(
        {"user_id": user_id, "profile_data": data}
    ).execute()
