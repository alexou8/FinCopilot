from __future__ import annotations

import asyncio
import base64
import json
import logging
from dataclasses import dataclass, field
from typing import Any, Literal
from urllib.parse import urljoin, urlparse
from uuid import uuid4

from openai import NotFoundError
from pydantic import BaseModel

from backend.config import (
    OPENAI_BROWSER_AGENT_FALLBACK_MODEL,
    OPENAI_BROWSER_AGENT_MODEL,
)
from backend.models.schemas import (
    IssueBrowserAgentStartRequest,
    IssueBrowserAgentStartResponse,
    IssueBrowserAgentStatusResponse,
)
from backend.services.llm import client

logger = logging.getLogger(__name__)

DISPLAY_WIDTH = 1440
DISPLAY_HEIGHT = 960
MAX_AGENT_STEPS = 24
MIN_ANALYZED_PAGES = 4
MAX_VISITED_PAGE_SUMMARIES = 10
MAX_CANDIDATE_LINKS = 10


ASK_USER_TOOL = {
    "type": "function",
    "name": "ask_user",
    "description": "Pause the browser run and ask the user for a missing fact or a clarification before continuing.",
    "parameters": {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
        },
        "required": ["question"],
        "additionalProperties": False,
    },
    "strict": True,
}

FINISH_TASK_TOOL = {
    "type": "function",
    "name": "finish_task",
    "description": "Finish the visible browser task once enough evidence has been gathered for the user.",
    "parameters": {
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
        },
        "required": ["summary"],
        "additionalProperties": False,
    },
    "strict": True,
}


class BrowserAgentUnavailableError(RuntimeError):
    """Raised when the visible browser agent cannot be started."""


class BrowserAgentStoppedError(RuntimeError):
    """Raised when the user intentionally stops the browser task."""


class VisionBrowserDecision(BaseModel):
    decision: Literal["action", "ask_user", "done"]
    narration: str
    type: Literal["click", "double_click", "move", "scroll", "keypress", "type", "wait", "open_url"] | None = None
    x: int | None = None
    y: int | None = None
    button: Literal["left", "middle", "right"] | None = None
    scroll_x: int | None = None
    scroll_y: int | None = None
    text: str | None = None
    keys: list[str] | None = None
    url: str | None = None
    question: str | None = None
    summary: str | None = None


@dataclass
class BrowserAgentSession:
    session_id: str
    user_id: str
    task_id: str | None
    research: dict[str, Any]
    state: str = "idle"
    message: str | None = "Preparing visible browser agent..."
    question: str | None = None
    result: str | None = None
    current_url: str | None = None
    error: str | None = None
    active: bool = True
    last_response_id: str | None = None
    pending_answer: str | None = None
    pending_safety_checks: list[dict[str, Any]] = field(default_factory=list)
    runtime_mode: str = "computer_use"
    step_log: list[str] = field(default_factory=list)
    visited_pages: list[dict[str, str]] = field(default_factory=list)
    current_page_context: dict[str, Any] = field(default_factory=dict)
    pause_requested: bool = False
    stop_requested: bool = False
    action_count: int = 0
    runtime_task: asyncio.Task | None = None
    playwright: Any = None
    browser: Any = None
    context: Any = None
    page: Any = None


class BrowserAgentManager:
    def __init__(self) -> None:
        self._sessions: dict[str, BrowserAgentSession] = {}

    async def start_session(
        self, req: IssueBrowserAgentStartRequest
    ) -> IssueBrowserAgentStartResponse:
        session_id = str(uuid4())
        session = BrowserAgentSession(
            session_id=session_id,
            user_id=req.user_id,
            task_id=req.task_id,
            research=req.research.model_dump(mode="json"),
        )
        self._sessions[session_id] = session
        session.runtime_task = asyncio.create_task(self._run_session(session))

        return IssueBrowserAgentStartResponse(
            session_id=session_id,
            task_id=req.task_id,
            started=True,
            state=session.state,
            message=session.message or "Starting browser agent...",
        )

    def get_status(self, session_id: str) -> IssueBrowserAgentStatusResponse:
        session = self._sessions.get(session_id)
        if not session:
            raise KeyError(session_id)

        return IssueBrowserAgentStatusResponse(
            session_id=session.session_id,
            task_id=session.task_id,
            active=session.active,
            state=session.state,
            message=session.message,
            question=session.question,
            result=session.result,
            current_url=session.current_url,
            error=session.error,
            runtime_mode=session.runtime_mode,
            pages_analyzed=len(session.visited_pages),
            domains_analyzed=len({page["domain"] for page in session.visited_pages}),
            step_log=session.step_log[-12:],
            visited_pages=session.visited_pages[-6:],
        )

    async def pause(self, session_id: str) -> IssueBrowserAgentStatusResponse:
        session = self._require_session(session_id)
        session.pause_requested = True
        if session.state not in {"question", "done", "failed"}:
            session.state = "paused"
            session.message = "Browser agent paused."
        await self._set_overlay_state(session)
        return self.get_status(session_id)

    async def resume(self, session_id: str) -> IssueBrowserAgentStatusResponse:
        session = self._require_session(session_id)
        session.pause_requested = False
        if session.state == "paused":
            session.state = "running"
            session.message = "Browser agent resumed."
        await self._set_overlay_state(session)
        return self.get_status(session_id)

    async def stop(self, session_id: str) -> IssueBrowserAgentStatusResponse:
        session = self._require_session(session_id)
        session.stop_requested = True
        session.active = False
        if session.state not in {"done", "failed"}:
            session.state = "done"
            session.result = session.result or "The browser task was stopped before completion."
            session.message = "Browser agent stopped."
        await self._show_done(session, session.result or "Stopped.")
        await self._close_session(session)
        return self.get_status(session_id)

    async def answer(self, session_id: str, answer: str) -> IssueBrowserAgentStatusResponse:
        session = self._require_session(session_id)
        session.pending_answer = answer.strip()
        return self.get_status(session_id)

    def _require_session(self, session_id: str) -> BrowserAgentSession:
        session = self._sessions.get(session_id)
        if not session:
            raise KeyError(session_id)
        return session

    async def _run_session(self, session: BrowserAgentSession) -> None:
        research = session.research
        start_url = (
            (research.get("sources") or [{}])[0].get("url")
            or research.get("search_url")
        )
        if not start_url:
            session.state = "failed"
            session.active = False
            session.error = "No launch URL was provided for the browser task."
            session.message = session.error
            return

        try:
            playwright_module = await self._import_playwright()
            async_playwright = playwright_module["async_playwright"]

            session.message = "Launching a visible Chromium window..."
            session.playwright = await async_playwright().start()
            session.browser = await session.playwright.chromium.launch(
                headless=False,
                args=["--disable-blink-features=AutomationControlled"],
            )
            session.context = await session.browser.new_context(
                viewport={"width": DISPLAY_WIDTH, "height": DISPLAY_HEIGHT}
            )
            session.page = await session.context.new_page()
            await session.page.goto(start_url, wait_until="domcontentloaded", timeout=45000)
            session.current_url = session.page.url
            await self._capture_page_context(session)
            session.state = "running"
            session.message = "Browser agent is reading the page and planning the next step."
            await self._ensure_overlay(session)
            await self._set_overlay_state(session)
            await self._show_step(
                session,
                "Opening the first trusted page and preparing the visible agent controls.",
            )

            try:
                response = await self._create_initial_response(session)
            except Exception as exc:
                if self._should_use_vision_fallback(exc):
                    session.runtime_mode = "vision"
                    session.message = (
                        f"OpenAI access to `{OPENAI_BROWSER_AGENT_MODEL}` is unavailable. "
                        f"Switching to screenshot-guided browser control with `{OPENAI_BROWSER_AGENT_FALLBACK_MODEL}`."
                    )
                    session.step_log.append(session.message)
                    await self._show_step(session, session.message)
                    await self._run_vision_fallback(session)
                    return
                raise
            steps_taken = 0

            while steps_taken < MAX_AGENT_STEPS and session.active:
                await self._honor_pause_or_stop(session)
                response_payload = await self._handle_model_response(session, response)
                if response_payload is None:
                    break

                response = response_payload
                steps_taken += 1

            if steps_taken >= MAX_AGENT_STEPS and session.active:
                session.state = "done"
                session.active = False
                session.result = (
                    "The browser agent stopped after the step limit. Review the current page and continue manually if needed."
                )
                await self._show_done(session, session.result)
        except BrowserAgentStoppedError as exc:
            session.state = "done"
            session.active = False
            session.result = str(exc)
            session.message = str(exc)
        except BrowserAgentUnavailableError as exc:
            logger.exception("Browser agent unavailable")
            session.state = "failed"
            session.active = False
            session.error = str(exc)
            session.message = str(exc)
        except Exception as exc:
            logger.exception("Browser agent session failed")
            session.state = "failed"
            session.active = False
            session.error = str(exc)
            session.message = "The visible browser agent encountered an error."
            try:
                await self._show_step(session, f"Browser agent error: {exc}")
            except Exception:
                pass
        finally:
            if session.state in {"failed", "done"} and session.result:
                session.message = session.result
            if session.state == "failed" or session.stop_requested:
                await self._close_session(session)
            await self._set_overlay_state(session)

    async def _handle_model_response(
        self, session: BrowserAgentSession, response: Any
    ) -> Any | None:
        summary = self._extract_reasoning_summary(response)
        if summary:
            session.message = summary
            session.step_log.append(summary)
            await self._show_step(session, summary)

        function_calls = [
            item for item in getattr(response, "output", []) or []
            if getattr(item, "type", None) == "function_call"
        ]
        if function_calls:
            function_call = function_calls[0]
            name = getattr(function_call, "name", "")
            args = json.loads(getattr(function_call, "arguments", "{}") or "{}")

            if name == "ask_user":
                question = args.get("question", "I need your input before continuing.")
                session.state = "question"
                session.question = question
                session.message = question
                await self._show_question(session, question)
                answer = await self._wait_for_answer(session)
                session.step_log.append(f"User answered: {answer}")
                session.question = None
                session.state = "running"
                session.message = "Input received. Continuing the browser task."
                await self._set_overlay_state(session)
                await self._show_step(session, session.message)
                return await client.responses.create(
                    model=OPENAI_BROWSER_AGENT_MODEL,
                    previous_response_id=response.id,
                    tools=self._tools(),
                    input=[
                        {
                            "type": "function_call_output",
                            "call_id": function_call.call_id,
                            "output": json.dumps({"answer": answer}),
                        }
                    ],
                    truncation="auto",
                    reasoning={"summary": "concise"},
                )

            if name == "finish_task":
                session.state = "done"
                session.active = False
                session.result = args.get("summary") or "The browser task is complete."
                session.message = session.result
                await self._show_done(session, session.result)
                return None

        computer_calls = [
            item for item in getattr(response, "output", []) or []
            if getattr(item, "type", None) == "computer_call"
        ]
        if not computer_calls:
            output_text = getattr(response, "output_text", None)
            if output_text:
                session.state = "done"
                session.active = False
                session.result = output_text
                session.message = output_text
                await self._show_done(session, output_text)
            return None

        computer_call = computer_calls[0]
        action = getattr(computer_call, "action", None)
        if action is None:
            session.state = "failed"
            session.active = False
            session.error = "Model returned an empty computer action."
            session.message = session.error
            return None

        pending_safety_checks = [
            {
                "id": getattr(check, "id", ""),
                "code": getattr(check, "code", ""),
                "message": getattr(check, "message", ""),
            }
            for check in getattr(computer_call, "pending_safety_checks", []) or []
        ]
        if pending_safety_checks:
            approval = await self._wait_for_safety_approval(
                session, action, pending_safety_checks
            )
            if not approval:
                session.state = "done"
                session.active = False
                session.result = "The browser task was stopped because the required safety approval was not granted."
                await self._show_done(session, session.result)
                return None
            session.pending_safety_checks = pending_safety_checks

        await self._execute_action(session, action)
        session.current_url = session.page.url if session.page else session.current_url
        session.action_count += 1
        screenshot_url = await self._capture_screenshot_data_url(session)

        input_item: dict[str, Any] = {
            "type": "computer_call_output",
            "call_id": computer_call.call_id,
            "output": {
                "type": "computer_screenshot",
                "image_url": screenshot_url,
            },
        }
        if session.pending_safety_checks:
            input_item["acknowledged_safety_checks"] = session.pending_safety_checks
            session.pending_safety_checks = []

        return await client.responses.create(
            model=OPENAI_BROWSER_AGENT_MODEL,
            previous_response_id=response.id,
            tools=self._tools(),
            input=[input_item],
            truncation="auto",
            reasoning={"summary": "concise"},
        )

    async def _run_vision_fallback(self, session: BrowserAgentSession) -> None:
        steps_taken = 0

        while steps_taken < MAX_AGENT_STEPS and session.active:
            await self._honor_pause_or_stop(session)
            await self._capture_page_context(session)
            decision = await self._create_vision_decision(session)
            narration = decision.narration.strip() or "Reviewing the current page."
            session.message = narration
            session.step_log.append(narration)
            await self._show_step(session, narration)

            if decision.decision == "ask_user":
                question = decision.question or "I need your input before continuing."
                session.state = "question"
                session.question = question
                session.message = question
                await self._show_question(session, question)
                answer = await self._wait_for_answer(session)
                session.step_log.append(f"User answered: {answer}")
                session.question = None
                session.state = "running"
                session.message = "Input received. Continuing the browser task."
                await self._set_overlay_state(session)
                await self._show_step(session, session.message)
                steps_taken += 1
                continue

            if decision.decision == "done":
                if not self._has_enough_evidence(session):
                    next_url = self._pick_next_navigation_url(session)
                    if next_url:
                        session.step_log.append(
                            "Collecting more evidence before finishing by opening another relevant page."
                        )
                        decision = VisionBrowserDecision(
                            decision="action",
                            narration="Opening another relevant page so the result is based on more than one screen.",
                            type="open_url",
                            url=next_url,
                        )
                    else:
                        session.state = "done"
                        session.active = False
                        session.result = (
                            decision.summary
                            or f"{narration} Coverage was limited because no additional trusted pages or relevant internal links were available."
                        )
                        session.message = session.result
                        await self._show_done(session, session.result)
                        return
                else:
                    session.state = "done"
                    session.active = False
                    session.result = decision.summary or narration
                    session.message = session.result
                    await self._show_done(session, session.result)
                    return

            normalized = self._normalize_vision_decision(session, decision)
            await self._execute_action(session, normalized)
            session.current_url = session.page.url if session.page else session.current_url
            session.action_count += 1
            session.step_log.append(self._describe_action(normalized))
            steps_taken += 1

        if steps_taken >= MAX_AGENT_STEPS and session.active:
            session.state = "done"
            session.active = False
            session.result = (
                "The browser agent stopped after the step limit. Review the current page and continue manually if needed."
            )
            await self._show_done(session, session.result)

    async def _create_initial_response(self, session: BrowserAgentSession) -> Any:
        screenshot_url = await self._capture_screenshot_data_url(session)
        prompt = self._build_prompt(session)
        return await client.responses.create(
            model=OPENAI_BROWSER_AGENT_MODEL,
            tools=self._tools(),
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt},
                        {"type": "input_image", "image_url": screenshot_url},
                    ],
                }
            ],
            truncation="auto",
            reasoning={"summary": "concise"},
        )

    async def _create_vision_decision(self, session: BrowserAgentSession) -> VisionBrowserDecision:
        screenshot_url = await self._capture_screenshot_data_url(session)
        prompt = self._build_vision_prompt(session)
        response = await client.responses.parse(
            model=OPENAI_BROWSER_AGENT_FALLBACK_MODEL,
            instructions=(
                "You are a cautious browser-control planner for FinCopilot. "
                "Study the screenshot and choose exactly one next step. "
                "Keep narration short and concrete. Prefer scrolling or waiting over risky clicks. "
                "Never log in, submit irreversible forms, or enter payment details."
            ),
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt},
                        {"type": "input_image", "image_url": screenshot_url},
                    ],
                }
            ],
            temperature=0.1,
            text_format=VisionBrowserDecision,
        )
        if response.output_parsed is None:
            raise RuntimeError("Vision fallback returned no structured browser decision.")
        return response.output_parsed

    def _build_prompt(self, session: BrowserAgentSession) -> str:
        research = session.research
        sources = research.get("sources") or []
        source_lines = "\n".join(
            f"- {item.get('title', 'Source')}: {item.get('url', '')}" for item in sources[:6]
        ) or "- Start with the currently open page."

        step_lines = "\n".join(
            f"- {item.get('title')}: {item.get('action')}" for item in (research.get("steps") or [])[:5]
        ) or "- Gather evidence carefully and visibly."

        recommendation_lines = "\n".join(
            f"- {item.get('title')}: {item.get('description')}"
            for item in (research.get("recommendations") or [])[:4]
        ) or "- Finish once you have enough current evidence for the user."

        return (
            "You are FinCopilot's visible browser agent.\n"
            "Your job is to control a browser window on the user's screen while staying transparent.\n"
            "A fixed overlay is visible in the top-right corner of the page and mirrors your status.\n"
            "Use the computer tool to browse public pages only. Do not log in, submit irreversible forms, or enter payment details.\n"
            "If you need the user's clarification or a missing fact, call the ask_user function.\n"
            "When you have enough current evidence, call finish_task with a short practical summary.\n"
            "Avoid loops and avoid unrelated sites.\n\n"
            f"Issue: {research.get('title')}\n"
            f"Mode: {research.get('mode')}\n"
            f"Browser goal: {research.get('browser_goal')}\n"
            f"Current issue summary: {research.get('summary')}\n"
            f"Search query: {research.get('search_query')}\n\n"
            "Suggested steps:\n"
            f"{step_lines}\n\n"
            "Candidate sources:\n"
            f"{source_lines}\n\n"
            "Recommended end-state:\n"
            f"{recommendation_lines}\n\n"
            "Important behavior rules:\n"
            "- Narrate progress through your reasoning summary in short, concrete language.\n"
            "- Keep the user in control when the page asks for personal information or when a safety warning appears.\n"
            "- Prefer reading and comparing current public information over pushing deep into a site.\n"
            "- Stop once you have enough evidence to help the user decide what to do next."
        )

    def _build_vision_prompt(self, session: BrowserAgentSession) -> str:
        research = session.research
        current_page = session.current_page_context or {}
        source_lines = "\n".join(
            f"- {item.get('title', 'Source')}: {item.get('url', '')}"
            for item in (research.get("sources") or [])[:6]
        ) or "- Start with the currently open page."
        step_lines = "\n".join(
            f"- {item.get('title')}: {item.get('action')}"
            for item in (research.get("steps") or [])[:5]
        ) or "- Gather current public evidence."
        history_lines = "\n".join(
            f"- {entry}" for entry in session.step_log[-8:]
        ) or "- No previous steps yet."
        visited_lines = "\n".join(
            f"- {page['title']} ({page['domain']}): {page['url']}"
            for page in session.visited_pages[-MAX_VISITED_PAGE_SUMMARIES:]
        ) or "- No analyzed pages recorded yet."
        candidate_links = "\n".join(
            f"- {link['text']}: {link['url']}"
            for link in current_page.get("candidate_links", [])[:MAX_CANDIDATE_LINKS]
        ) or "- No candidate links extracted from the current page."
        page_snapshot = current_page.get("text_snippet") or "No text snapshot available yet."
        headings = ", ".join(current_page.get("headings", [])[:5]) or "No headings captured."
        target_pages = max(
            2,
            min(
                MIN_ANALYZED_PAGES,
                len({urlparse(item.get('url', '')).netloc for item in (research.get("sources") or []) if item.get("url")})
                or MIN_ANALYZED_PAGES,
            ),
        )

        return (
            "You are controlling a visible Chromium browser for FinCopilot.\n"
            f"The screenshot resolution is {DISPLAY_WIDTH}x{DISPLAY_HEIGHT}. Coordinates must stay inside that viewport.\n"
            "Choose exactly one next step.\n"
            "If you need missing information from the user, set decision to ask_user.\n"
            "If you already have enough current public evidence, set decision to done.\n"
            "Otherwise set decision to action and provide one safe browser action.\n"
            "Allowed action types: click, double_click, move, scroll, keypress, type, wait, open_url.\n"
            "Use scroll when you need more context. Avoid clicking ads or unrelated navigation.\n"
            "Use open_url when you want to move to a trusted source or an extracted relevant link instead of guessing click coordinates.\n"
            "Never log in, submit irreversible forms, or enter payment details.\n\n"
            f"Issue: {research.get('title')}\n"
            f"Browser goal: {research.get('browser_goal')}\n"
            f"Current issue summary: {research.get('summary')}\n"
            f"Current URL: {session.current_url}\n\n"
            "Current page headings:\n"
            f"{headings}\n\n"
            "Current page text snapshot:\n"
            f"{page_snapshot}\n\n"
            "Suggested steps:\n"
            f"{step_lines}\n\n"
            "Candidate sources:\n"
            f"{source_lines}\n\n"
            "Relevant extracted links from the current page:\n"
            f"{candidate_links}\n\n"
            "Pages already analyzed:\n"
            f"{visited_lines}\n\n"
            "Recent step history:\n"
            f"{history_lines}\n\n"
            "Coverage requirement:\n"
            f"- Do not finish until you have analyzed at least {target_pages} trusted pages or exhausted the candidate sources and relevant internal links.\n\n"
            "For action decisions:\n"
            "- For click, double_click, or move: provide x and y.\n"
            "- For scroll: provide scroll_y, and optionally x and y.\n"
            "- For keypress: provide keys like [\"Tab\"] or [\"Control\", \"L\"].\n"
            "- For type: provide text.\n"
            "- For open_url: provide a full URL from candidate sources or extracted links.\n"
            "- For wait: no extra fields are required.\n"
            "Keep narration practical and visible to the user."
        )

    def _tools(self) -> list[dict[str, Any]]:
        return [
            {
                "type": "computer_use_preview",
                "display_width": DISPLAY_WIDTH,
                "display_height": DISPLAY_HEIGHT,
                "environment": "browser",
            },
            ASK_USER_TOOL,
            FINISH_TASK_TOOL,
        ]

    def _should_use_vision_fallback(self, exc: Exception) -> bool:
        message = str(exc).lower()
        if isinstance(exc, NotFoundError):
            return "computer-use-preview" in message or "model_not_found" in message
        return (
            "computer-use-preview" in message
            and ("do not have access" in message or "does not exist" in message)
        )

    def _has_enough_evidence(self, session: BrowserAgentSession) -> bool:
        pages_analyzed = len(session.visited_pages)
        domains_analyzed = len({page["domain"] for page in session.visited_pages})
        available_source_domains = {
            urlparse(item.get("url", "")).netloc
            for item in (session.research.get("sources") or [])
            if item.get("url")
        }
        target_pages = max(2, min(MIN_ANALYZED_PAGES, len(available_source_domains) or MIN_ANALYZED_PAGES))
        target_domains = max(1, min(2, len(available_source_domains) or 1))
        return pages_analyzed >= target_pages and domains_analyzed >= target_domains

    def _pick_next_navigation_url(self, session: BrowserAgentSession) -> str | None:
        visited = {page["url"] for page in session.visited_pages}
        source_urls = [
            item.get("url")
            for item in (session.research.get("sources") or [])
            if item.get("url")
        ]
        if session.research.get("search_url"):
            source_urls.append(session.research["search_url"])

        current_domain = urlparse(session.current_url or "").netloc
        current_candidates = session.current_page_context.get("candidate_links", [])
        for link in current_candidates:
            url = link.get("url")
            if url and url not in visited:
                return url

        for url in source_urls:
            if url and url not in visited:
                return url

        for page in session.visited_pages:
            if page["domain"] == current_domain and page["url"] not in visited:
                return page["url"]

        return None

    def _normalize_vision_decision(
        self, session: BrowserAgentSession, decision: VisionBrowserDecision
    ) -> VisionBrowserDecision:
        normalized = decision.model_copy(deep=True)
        action_type = normalized.type

        if action_type in {"click", "double_click", "move"}:
            if normalized.x is None or normalized.y is None:
                normalized.type = "wait"
        elif action_type == "scroll":
            normalized.x = normalized.x if normalized.x is not None else DISPLAY_WIDTH // 2
            normalized.y = normalized.y if normalized.y is not None else DISPLAY_HEIGHT // 2
            normalized.scroll_x = normalized.scroll_x if normalized.scroll_x is not None else 0
            normalized.scroll_y = normalized.scroll_y if normalized.scroll_y is not None else 640
        elif action_type == "keypress":
            if not normalized.keys:
                normalized.type = "wait"
        elif action_type == "type":
            if not normalized.text:
                normalized.type = "wait"
        elif action_type == "open_url":
            url = (normalized.url or "").strip()
            if not url:
                normalized.type = "wait"
            else:
                normalized.url = urljoin(session.current_url or "", url)
                if not normalized.url.startswith(("http://", "https://")):
                    normalized.type = "wait"
        elif action_type not in {"wait", None}:
            normalized.type = "wait"

        if normalized.type == "wait":
            normalized.x = None
            normalized.y = None
            normalized.scroll_x = None
            normalized.scroll_y = None
            normalized.text = None
            normalized.keys = None
            normalized.url = None

        return normalized

    def _describe_action(self, action: VisionBrowserDecision) -> str:
        action_type = action.type or "wait"
        if action_type in {"click", "double_click", "move"}:
            return f"{action_type} at ({action.x}, {action.y})"
        if action_type == "scroll":
            return f"scroll by ({action.scroll_x or 0}, {action.scroll_y or 0})"
        if action_type == "keypress":
            return f"keypress {'+'.join(action.keys or [])}"
        if action_type == "type":
            return f"type {action.text!r}"
        if action_type == "open_url":
            return f"open {action.url}"
        return "wait for the page to settle"

    async def _execute_action(self, session: BrowserAgentSession, action: Any) -> None:
        page = session.page
        action_type = getattr(action, "type", None)
        if page is None:
            raise RuntimeError("Browser page is unavailable.")

        if action_type in {"click", "double_click", "move"}:
            x = getattr(action, "x", 0)
            y = getattr(action, "y", 0)
            await self._show_highlight(session, x, y)

        if action_type == "click":
            await page.mouse.click(action.x, action.y, button=getattr(action, "button", "left"))
        elif action_type == "double_click":
            await page.mouse.dblclick(action.x, action.y, button=getattr(action, "button", "left"))
        elif action_type == "move":
            await page.mouse.move(action.x, action.y)
        elif action_type == "open_url":
            await page.goto(getattr(action, "url", session.current_url or "about:blank"), wait_until="domcontentloaded", timeout=45000)
        elif action_type == "scroll":
            await page.mouse.move(getattr(action, "x", 0), getattr(action, "y", 0))
            await page.mouse.wheel(getattr(action, "scroll_x", 0), getattr(action, "scroll_y", 0))
        elif action_type == "keypress":
            await page.keyboard.press("+".join(getattr(action, "keys", [])))
        elif action_type == "type":
            await page.keyboard.type(getattr(action, "text", ""), delay=35)
        elif action_type == "drag":
            path = getattr(action, "path", []) or []
            if len(path) >= 2:
                start = path[0]
                await page.mouse.move(start.x, start.y)
                await page.mouse.down()
                for point in path[1:]:
                    await page.mouse.move(point.x, point.y, steps=6)
                await page.mouse.up()
        elif action_type == "wait":
            await page.wait_for_timeout(1100)
        elif action_type == "screenshot":
            return

        await page.wait_for_timeout(900)
        await self._ensure_overlay(session)
        await self._capture_page_context(session)
        await self._set_overlay_state(session)

    async def _wait_for_answer(self, session: BrowserAgentSession) -> str:
        while session.active and not session.stop_requested:
            await self._honor_pause_or_stop(session)
            if session.pending_answer:
                answer = session.pending_answer
                session.pending_answer = None
                return answer

            overlay_answer = await self._consume_overlay_answer(session)
            if overlay_answer:
                return overlay_answer

            await asyncio.sleep(0.4)

        raise BrowserAgentStoppedError("Browser task stopped before an answer was provided.")

    async def _wait_for_safety_approval(
        self,
        session: BrowserAgentSession,
        action: Any,
        safety_checks: list[dict[str, Any]],
    ) -> bool:
        message = safety_checks[0].get("message") or "The agent needs approval to continue."
        question = (
            f"Safety approval needed before the next action ({getattr(action, 'type', 'action')}). "
            f"Type APPROVE to continue or STOP to cancel. {message}"
        )
        session.state = "question"
        session.question = question
        session.message = "Waiting for a safety approval before continuing."
        await self._show_question(session, question)
        answer = await self._wait_for_answer(session)
        session.question = None
        approved = answer.strip().upper() in {"APPROVE", "YES", "CONTINUE"}
        session.state = "running" if approved else "done"
        session.message = (
            "Safety approval received. Continuing the browser task."
            if approved
            else "Safety approval denied. Stopping the browser task."
        )
        await self._set_overlay_state(session)
        if not approved:
            await self._show_done(session, session.message)
        return approved

    async def _honor_pause_or_stop(self, session: BrowserAgentSession) -> None:
        while session.active and not session.stop_requested:
            overlay_state = await self._read_overlay_state(session)
            if overlay_state.get("stopped"):
                session.stop_requested = True
                session.active = False
                session.state = "done"
                session.result = "The browser task was stopped by the user."
                await self._close_session(session)
                raise BrowserAgentStoppedError(session.result)

            if session.pause_requested or overlay_state.get("paused"):
                session.pause_requested = True
                session.state = "paused"
                session.message = "Browser agent paused."
                await self._set_overlay_state(session)
                await asyncio.sleep(0.35)
                continue

            if session.state == "paused":
                session.state = "running"
                session.message = "Browser agent resumed."
                await self._set_overlay_state(session)
            return

        if session.stop_requested:
            await self._close_session(session)
            raise BrowserAgentStoppedError("The browser task was stopped.")

    async def _capture_screenshot_data_url(self, session: BrowserAgentSession) -> str:
        if session.page is None:
            raise RuntimeError("Browser page is unavailable for screenshot capture.")
        screenshot = await session.page.screenshot(type="png")
        encoded = base64.b64encode(screenshot).decode("utf-8")
        return f"data:image/png;base64,{encoded}"

    async def _capture_page_context(self, session: BrowserAgentSession) -> dict[str, Any]:
        if session.page is None:
            return {}

        try:
            raw_context = await session.page.evaluate(
                """() => {
                  const bodyText = (document.body?.innerText || '').replace(/\\s+/g, ' ').trim();
                  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
                    .map((node) => (node.textContent || '').trim())
                    .filter(Boolean)
                    .slice(0, 6);
                  const links = Array.from(document.querySelectorAll('a[href]'))
                    .map((anchor) => ({
                      url: anchor.href,
                      text: (anchor.textContent || '').replace(/\\s+/g, ' ').trim(),
                    }))
                    .filter((item) => item.url && item.text)
                    .slice(0, 80);
                  return {
                    title: document.title || '',
                    url: window.location.href,
                    headings,
                    text_snippet: bodyText.slice(0, 1800),
                    links,
                  };
                }"""
            )
        except Exception:
            return session.current_page_context

        current_url = raw_context.get("url") or session.page.url
        current_domain = urlparse(current_url or "").netloc
        context = {
            "title": raw_context.get("title") or current_domain or "Page",
            "url": current_url,
            "domain": current_domain,
            "headings": raw_context.get("headings") or [],
            "text_snippet": raw_context.get("text_snippet") or "",
            "candidate_links": self._rank_candidate_links(
                session,
                current_url,
                raw_context.get("links") or [],
            ),
        }
        session.current_page_context = context
        session.current_url = context["url"]
        self._record_visited_page(session, context)
        return context

    def _rank_candidate_links(
        self,
        session: BrowserAgentSession,
        current_url: str,
        links: list[dict[str, str]],
    ) -> list[dict[str, str]]:
        current_domain = urlparse(current_url or "").netloc
        source_domains = {
            urlparse(item.get("url", "")).netloc
            for item in (session.research.get("sources") or [])
            if item.get("url")
        }
        visited_urls = {page["url"] for page in session.visited_pages}
        ranked: list[tuple[int, dict[str, str]]] = []
        seen: set[str] = set()

        for link in links:
            raw_url = (link.get("url") or "").strip()
            if not raw_url or raw_url in seen or raw_url in visited_urls:
                continue
            if not raw_url.startswith(("http://", "https://")):
                continue

            seen.add(raw_url)
            text = (link.get("text") or "").strip()
            lower_blob = f"{text} {raw_url}".lower()
            link_domain = urlparse(raw_url).netloc

            if any(token in lower_blob for token in ["login", "sign in", "privacy", "careers", "facebook", "instagram", "linkedin"]):
                continue

            score = 0
            if link_domain == current_domain:
                score += 3
            if link_domain in source_domains:
                score += 2
            for keyword in [
                "rate",
                "apy",
                "interest",
                "fee",
                "pricing",
                "terms",
                "details",
                "faq",
                "account",
                "savings",
                "student",
                "eligibility",
                "disclosure",
                "compare",
            ]:
                if keyword in lower_blob:
                    score += 1

            ranked.append(
                (
                    score,
                    {
                        "text": text[:120] or link_domain or raw_url,
                        "url": raw_url,
                        "domain": link_domain,
                    },
                )
            )

        ranked.sort(key=lambda item: item[0], reverse=True)
        return [item for _, item in ranked[:MAX_CANDIDATE_LINKS]]

    def _record_visited_page(self, session: BrowserAgentSession, context: dict[str, Any]) -> None:
        url = context.get("url")
        if not url:
            return

        snapshot = {
            "title": (context.get("title") or context.get("domain") or "Page")[:140],
            "url": url,
            "domain": context.get("domain") or urlparse(url).netloc or "unknown",
            "snippet": (context.get("text_snippet") or "")[:240],
        }

        for index, existing in enumerate(session.visited_pages):
            if existing["url"] == url:
                session.visited_pages[index] = snapshot
                return

        session.visited_pages.append(snapshot)
        if len(session.visited_pages) > MAX_VISITED_PAGE_SUMMARIES:
            session.visited_pages = session.visited_pages[-MAX_VISITED_PAGE_SUMMARIES:]

    def _extract_reasoning_summary(self, response: Any) -> str | None:
        for item in getattr(response, "output", []) or []:
            if getattr(item, "type", None) != "reasoning":
                continue
            for part in getattr(item, "summary", []) or []:
                text = getattr(part, "text", None)
                if text:
                    return text
        return None

    async def _import_playwright(self) -> dict[str, Any]:
        try:
            from playwright.async_api import async_playwright
        except ImportError as exc:
            raise BrowserAgentUnavailableError(
                "Playwright is not installed. Run `pip install -r backend/requirements.txt` and `python -m playwright install chromium` to enable the visible browser agent."
            ) from exc
        return {"async_playwright": async_playwright}

    async def _ensure_overlay(self, session: BrowserAgentSession) -> None:
        if session.page is None:
            return

        script = """
        (() => {
          if (document.getElementById('__fincopilot_agent_panel')) return;

          const panel = document.createElement('div');
          panel.id = '__fincopilot_agent_panel';
          panel.style.cssText = `
            position: fixed;
            top: 18px;
            right: 18px;
            width: 380px;
            background: linear-gradient(145deg, #E8ECF2, #C0CAD8);
            color: #2D3748;
            border-radius: 26px;
            padding: 18px;
            z-index: 2147483647;
            font-family: "DM Sans", Inter, system-ui, sans-serif;
            box-shadow: 11px 11px 22px #9aabbe, -7px -7px 16px #edf1f7;
            border: 1px solid rgba(255,255,255,0.55);
            backdrop-filter: blur(8px);
          `;
          panel.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
              <div style="width:38px;height:38px;border-radius:14px;background:linear-gradient(145deg, #008080, #004d4d);box-shadow:4px 4px 8px rgba(0,102,102,0.35), -3px -3px 7px rgba(237,241,247,0.55);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <span style="font-size:16px;font-weight:700;color:#fff;line-height:1;">F</span>
              </div>
              <div style="min-width:0;flex:1;">
                <div style="font-size:12px;font-family:'Space Mono', monospace;font-weight:700;color:#2D3748;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Visible Browser Agent</div>
                <div style="font-size:14px;font-weight:700;color:#2D3748;line-height:1.2;">FinCopilot</div>
              </div>
              <div id="__fincopilot_agent_state_badge" style="display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:999px;background:linear-gradient(145deg, #E8ECF2, #C0CAD8);box-shadow:4px 4px 8px #9aabbe, -3px -3px 7px #edf1f7;">
                <span id="__fincopilot_agent_dot" style="width:7px;height:7px;border-radius:999px;background:#00A63D;"></span>
                <span id="__fincopilot_agent_state" style="font-size:11px;color:#006666;font-family:'Space Mono', monospace;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Running</span>
              </div>
            </div>
            <div id="__fincopilot_agent_step" style="background:#DDE2EA;box-shadow:inset 3px 3px 7px #9aabbe, inset -3px -3px 7px #edf1f7;border-radius:16px;padding:16px;min-height:88px;font-size:14px;line-height:1.7;margin-bottom:12px;color:#2D3748;border:1px solid rgba(255,255,255,0.32);">
              Preparing visible browser controls...
            </div>
            <div id="__fincopilot_agent_question_wrap" style="display:none;margin-bottom:12px;">
              <div style="background:#DDE2EA;box-shadow:inset 3px 3px 7px #9aabbe, inset -3px -3px 7px #edf1f7;border-radius:16px;padding:14px 14px 12px;border:1px solid rgba(255,255,255,0.32);">
                <div id="__fincopilot_agent_question" style="font-size:13px;line-height:1.6;color:#5a6a85;margin-bottom:10px;"></div>
                <input id="__fincopilot_agent_input" type="text" placeholder="Type your answer..." style="width:100%;box-sizing:border-box;border-radius:18px;border:none;background:#DDE2EA;color:#2D3748;padding:12px 14px;font-size:13px;outline:none;margin-bottom:10px;box-shadow:inset 3px 3px 7px #9aabbe, inset -3px -3px 7px #edf1f7;" />
                <button id="__fincopilot_agent_submit" style="width:100%;border:none;border-radius:12px;background:linear-gradient(145deg, #008080, #004d4d);color:#fff;padding:11px 14px;font-weight:700;cursor:pointer;box-shadow:4px 4px 8px rgba(0,102,102,0.35), -3px -3px 7px rgba(237,241,247,0.55);">Submit</button>
              </div>
            </div>
            <div style="display:flex;gap:10px;">
              <button id="__fincopilot_agent_stop" style="flex:1;border:none;border-radius:12px;background:linear-gradient(145deg, #E8ECF2, #C0CAD8);color:#FF2157;padding:11px 14px;font-weight:700;cursor:pointer;box-shadow:4px 4px 8px #9aabbe, -3px -3px 7px #edf1f7;">Stop</button>
              <button id="__fincopilot_agent_pause" style="flex:1;border:none;border-radius:12px;background:linear-gradient(145deg, #E8ECF2, #C0CAD8);color:#2D3748;padding:11px 14px;font-weight:700;cursor:pointer;box-shadow:4px 4px 8px #9aabbe, -3px -3px 7px #edf1f7;">Pause</button>
            </div>
          `;
          document.body.appendChild(panel);

          window.__fincopilotAgent = {
            paused: false,
            stopped: false,
            answer: null,
          };

          document.getElementById('__fincopilot_agent_stop')?.addEventListener('click', () => {
            window.__fincopilotAgent.stopped = true;
          });

          document.getElementById('__fincopilot_agent_pause')?.addEventListener('click', (event) => {
            window.__fincopilotAgent.paused = !window.__fincopilotAgent.paused;
            event.currentTarget.textContent = window.__fincopilotAgent.paused ? 'Resume' : 'Pause';
          });

          document.getElementById('__fincopilot_agent_submit')?.addEventListener('click', () => {
            const input = document.getElementById('__fincopilot_agent_input');
            if (!input || !input.value.trim()) return;
            window.__fincopilotAgent.answer = input.value.trim();
            input.value = '';
          });
        })();
        """
        await session.page.evaluate(script)

    async def _set_overlay_state(self, session: BrowserAgentSession) -> None:
        if session.page is None:
            return

        color = {
            "running": "#00A63D",
            "paused": "#FE9900",
            "question": "#FE9900",
            "done": "#00A63D",
            "failed": "#FF2157",
        }.get(session.state, "#5a6a85")
        label = session.state.title()
        await session.page.evaluate(
            """({ label, color, paused }) => {
              const dot = document.getElementById('__fincopilot_agent_dot');
              const state = document.getElementById('__fincopilot_agent_state');
              const badge = document.getElementById('__fincopilot_agent_state_badge');
              const pauseButton = document.getElementById('__fincopilot_agent_pause');
              if (dot) {
                dot.style.background = color;
              }
              if (state) {
                state.textContent = label;
                state.style.color = color;
              }
              if (badge) {
                badge.style.boxShadow = '4px 4px 8px #9aabbe, -3px -3px 7px #edf1f7';
              }
              if (pauseButton) {
                pauseButton.textContent = paused ? 'Resume' : 'Pause';
                pauseButton.style.background = paused
                  ? 'linear-gradient(145deg, #008080, #004d4d)'
                  : 'linear-gradient(145deg, #E8ECF2, #C0CAD8)';
                pauseButton.style.color = paused ? '#ffffff' : '#2D3748';
                pauseButton.style.boxShadow = paused
                  ? '4px 4px 8px rgba(0,102,102,0.35), -3px -3px 7px rgba(237,241,247,0.55)'
                  : '4px 4px 8px #9aabbe, -3px -3px 7px #edf1f7';
              }
            }""",
            {"label": label, "color": color, "paused": session.pause_requested},
        )

    async def _show_step(self, session: BrowserAgentSession, text: str) -> None:
        if session.page is None:
            return
        await session.page.evaluate(
            """(message) => {
              const el = document.getElementById('__fincopilot_agent_step');
              if (el) {
                el.textContent = message;
                el.style.background = '#DDE2EA';
                el.style.borderColor = 'rgba(255,255,255,0.32)';
              }
            }""",
            text,
        )

    async def _show_question(self, session: BrowserAgentSession, question: str) -> None:
        if session.page is None:
            return
        await self._set_overlay_state(session)
        await session.page.evaluate(
            """(question) => {
              const wrap = document.getElementById('__fincopilot_agent_question_wrap');
              const el = document.getElementById('__fincopilot_agent_question');
              const step = document.getElementById('__fincopilot_agent_step');
              if (wrap) wrap.style.display = 'block';
              if (el) el.textContent = question;
              if (step) {
                step.style.borderColor = 'rgba(254, 153, 0, 0.24)';
                step.style.background = '#DDE2EA';
              }
            }""",
            question,
        )

    async def _show_done(self, session: BrowserAgentSession, text: str) -> None:
        if session.page is None:
            return
        session.state = "done" if session.state != "failed" else session.state
        await self._set_overlay_state(session)
        await session.page.evaluate(
            """(message) => {
              const step = document.getElementById('__fincopilot_agent_step');
              const wrap = document.getElementById('__fincopilot_agent_question_wrap');
              if (wrap) wrap.style.display = 'none';
              if (step) {
                step.textContent = message;
                step.style.borderColor = 'rgba(0, 166, 61, 0.22)';
                step.style.background = '#DDEFE4';
              }
            }""",
            text,
        )

    async def _show_highlight(self, session: BrowserAgentSession, x: int, y: int) -> None:
        if session.page is None:
            return
        await session.page.evaluate(
            """({ x, y }) => {
              const existing = document.getElementById('__fincopilot_agent_highlight');
              if (existing) existing.remove();
              const ring = document.createElement('div');
              ring.id = '__fincopilot_agent_highlight';
              ring.style.cssText = `
                position: fixed;
                left: ${Math.max(0, x - 18)}px;
                top: ${Math.max(0, y - 18)}px;
                width: 36px;
                height: 36px;
                border-radius: 999px;
                border: 3px solid rgba(0,102,102,0.88);
                box-shadow: 0 0 0 8px rgba(0,102,102,0.14);
                z-index: 2147483646;
                pointer-events: none;
                transition: opacity 0.25s ease;
              `;
              document.body.appendChild(ring);
              setTimeout(() => ring.remove(), 900);
            }""",
            {"x": x, "y": y},
        )

    async def _read_overlay_state(self, session: BrowserAgentSession) -> dict[str, Any]:
        if session.page is None:
            return {"paused": session.pause_requested, "stopped": session.stop_requested}
        try:
            return await session.page.evaluate(
                """() => ({
                  paused: !!window.__fincopilotAgent?.paused,
                  stopped: !!window.__fincopilotAgent?.stopped
                })"""
            )
        except Exception:
            return {"paused": session.pause_requested, "stopped": session.stop_requested}

    async def _consume_overlay_answer(self, session: BrowserAgentSession) -> str | None:
        if session.page is None:
            return None
        try:
            return await session.page.evaluate(
                """() => {
                  const answer = window.__fincopilotAgent?.answer || null;
                  if (window.__fincopilotAgent) {
                    window.__fincopilotAgent.answer = null;
                  }
                  const wrap = document.getElementById('__fincopilot_agent_question_wrap');
                  if (answer && wrap) wrap.style.display = 'none';
                  return answer;
                }"""
            )
        except Exception:
            return None

    async def _close_session(self, session: BrowserAgentSession) -> None:
        try:
            if session.context:
                await session.context.close()
        except Exception:
            pass
        try:
            if session.browser:
                await session.browser.close()
        except Exception:
            pass
        try:
            if session.playwright:
                await session.playwright.stop()
        except Exception:
            pass
        session.context = None
        session.browser = None
        session.page = None
        session.playwright = None


browser_agent_manager = BrowserAgentManager()
