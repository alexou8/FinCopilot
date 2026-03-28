import json
import logging

from backend.services.llm import chat_completion
from backend.prompts.extraction import EXTRACTION_SYSTEM_PROMPT
from backend.db import upsert_profile

logger = logging.getLogger(__name__)


async def extract_and_save_profile(user_id: str, conversation: list[dict]) -> dict | None:
    """Run structured extraction on the conversation and persist to Supabase.

    Returns the extracted profile dict, or None if extraction fails.
    """
    messages = [
        {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
        *conversation,
    ]

    try:
        raw = await chat_completion(messages, temperature=0, json_mode=True)
        profile_data = json.loads(raw)
        await upsert_profile(user_id, profile_data)
        return profile_data
    except Exception:
        logger.exception("Extraction failed for user %s — skipping", user_id)
        return None
