from fastapi import APIRouter, HTTPException

from backend.models.schemas import ChatRequest, ChatResponse, ComparisonProfile
from backend.services.llm import chat_completion
from backend.services.extraction import extract_and_save_profile
from backend.prompts.onboarding import ONBOARDING_SYSTEM_PROMPT
from backend.prompts.simulation_chat import SIMULATION_CHAT_PROMPT
from backend.db import get_conversation_history, save_message

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Conversational onboarding endpoint.

    Sends the user's message + history to GPT-4o and returns the assistant reply.
    Runs profile extraction inline so the response always has the latest profile.

    When chat_mode="simulation", uses a scenario-gathering prompt and targets
    profile_data_after. The conversation is scoped to req.user_id (which the
    frontend sets to "{real_user_id}_sim"), while profile extraction saves to
    req.profile_user_id (the real user_id).
    """
    # 1. Load conversation history (scoped to user_id so sim chat is separate)
    history = await get_conversation_history(req.user_id)

    # 2. Select system prompt based on chat mode
    system_prompt = SIMULATION_CHAT_PROMPT if req.chat_mode == "simulation" else ONBOARDING_SYSTEM_PROMPT

    # 3. Build messages for OpenAI
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": req.message})

    # 4. Get assistant reply
    try:
        reply = await chat_completion(messages, temperature=0.7)
    except Exception:
        raise HTTPException(status_code=502, detail="AI service unavailable")

    # 5. Persist both messages under the conversation scope (user_id)
    await save_message(req.user_id, "user", req.message)
    await save_message(req.user_id, "assistant", reply)

    # 6. Run extraction inline — save profile under the real user_id
    profile_uid = req.profile_user_id or req.user_id
    full_conversation = [
        *history,
        {"role": "user", "content": req.message},
        {"role": "assistant", "content": reply},
    ]
    profile_data = await extract_and_save_profile(
        profile_uid, full_conversation, req.profile_target
    )

    # 7. Return reply + freshly extracted profile
    profile = ComparisonProfile(**profile_data) if profile_data else None
    return ChatResponse(reply=reply, profile=profile)
