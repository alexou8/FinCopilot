import json
import logging

from backend.models.schemas import ComparisonProfile
from backend.services.llm import chat_completion
from backend.prompts.extraction import EXTRACTION_SYSTEM_PROMPT
from backend.db import save_comparison_profile

logger = logging.getLogger(__name__)


async def extract_and_save_profile(
    user_id: str, conversation: list[dict], target_profile: str = "before"
) -> dict | None:
    """Run structured extraction on the conversation and persist to Supabase.

    Returns the extracted profile dict, or None if extraction fails.
    """
    messages = [
        {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Update the user's {target_profile} comparison profile. "
                f"Set profile_label to '{target_profile}'."
            ),
        },
        *conversation,
    ]

    try:
        raw = await chat_completion(messages, temperature=0, json_mode=True)
        profile_data = ComparisonProfile(**json.loads(raw)).model_dump()
        await save_comparison_profile(user_id, profile_data, target_profile)
        return profile_data
    except Exception:
        logger.exception("Extraction failed for user %s — skipping", user_id)
        return None
