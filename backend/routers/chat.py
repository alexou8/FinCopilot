from fastapi import APIRouter, BackgroundTasks, HTTPException

from backend.models.schemas import ChatRequest, ChatResponse
from backend.services.llm import chat_completion
from backend.services.extraction import extract_and_save_profile
from backend.prompts.onboarding import ONBOARDING_SYSTEM_PROMPT
from backend.db import get_conversation_history, save_message, get_profile

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, background_tasks: BackgroundTasks):
    """Conversational onboarding endpoint.

    Sends the user's message + history to GPT-4o and returns the assistant reply.
    Triggers profile extraction in the background after each exchange.
    """
    # 1. Load conversation history from Supabase
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

    # 4. Persist both messages to Supabase
    await save_message(req.user_id, "user", req.message)
    await save_message(req.user_id, "assistant", reply)

    # 5. Build the full conversation for extraction (including the new exchange)
    full_conversation = [*history, {"role": "user", "content": req.message}, {"role": "assistant", "content": reply}]

    # 6. Trigger extraction in the background (non-blocking)
    background_tasks.add_task(extract_and_save_profile, req.user_id, full_conversation)

    # 7. Return reply + current profile (may be from a previous extraction)
    profile_data = await get_profile(req.user_id)

    return ChatResponse(reply=reply, profile=profile_data)
