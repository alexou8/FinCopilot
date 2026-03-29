import logging

from fastapi import APIRouter, HTTPException

from backend.models.schemas import ChatRequest, ChatResponse, ComparisonProfile
from backend.services.llm import chat_completion
from backend.services.extraction import extract_and_save_profile
from backend.services.simulation_engine import build_after_profile
from backend.prompts.onboarding import ONBOARDING_SYSTEM_PROMPT
from backend.db import (
    get_conversation_history,
    get_comparison_profile,
    save_comparison_profile,
    save_message,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Conversational onboarding endpoint.

    Sends the user's message + history to GPT-4o and returns the assistant reply.
    Runs profile extraction inline so the response always has the latest profile.
    When onboarding is complete (decision detected), auto-generates profile_data_after.
    """
    # 1. Load conversation history
    history = await get_conversation_history(req.user_id)

    # 2. Build messages for OpenAI
    messages = [{"role": "system", "content": ONBOARDING_SYSTEM_PROMPT}]
    messages.extend(history)
    messages.append({"role": "user", "content": req.message})

    # 3. Get assistant reply
    try:
        reply = await chat_completion(messages, temperature=0.7)
    except Exception:
        raise HTTPException(status_code=502, detail="AI service unavailable")

    # 4. Persist both messages
    await save_message(req.user_id, "user", req.message)
    await save_message(req.user_id, "assistant", reply)

    # 5. Run extraction inline (so the profile is up to date in the response)
    full_conversation = [
        *history,
        {"role": "user", "content": req.message},
        {"role": "assistant", "content": reply},
    ]
    profile_data = await extract_and_save_profile(
        req.user_id, full_conversation, req.profile_target
    )

    # 6. Auto-generate profile_data_after when onboarding is complete
    #    Triggered when: the before-profile has a decision AND no after-profile exists yet
    if profile_data and req.profile_target == "before":
        decision = profile_data.get("decision")
        if decision and decision.get("description"):
            existing_after = await get_comparison_profile(req.user_id, "after")
            if not existing_after:
                try:
                    profile_before = ComparisonProfile(**profile_data)
                    profile_after = await build_after_profile(
                        profile_before, decision["description"]
                    )
                    await save_comparison_profile(
                        req.user_id, profile_after.model_dump(), "after"
                    )
                    logger.info(
                        "Auto-generated profile_data_after for user %s", req.user_id
                    )
                except Exception:
                    logger.exception(
                        "Failed to auto-generate profile_data_after for user %s",
                        req.user_id,
                    )

    # 7. Return reply + freshly extracted profile
    profile = ComparisonProfile(**profile_data) if profile_data else None
    return ChatResponse(reply=reply, profile=profile)
