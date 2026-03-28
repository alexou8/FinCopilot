import logging
from openai import AsyncOpenAI
from app.config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=OPENAI_API_KEY)


async def chat_completion(
    messages: list[dict],
    temperature: float = 0.7,
    json_mode: bool = False,
) -> str:
    """Send a chat completion request to GPT-4o and return the assistant message content."""
    try:
        kwargs: dict = {
            "model": "gpt-4o",
            "messages": messages,
            "temperature": temperature,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = await client.chat.completions.create(**kwargs)
        return response.choices[0].message.content or ""
    except Exception:
        logger.exception("OpenAI API call failed")
        raise
