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
    IssueBrowserAgentAnalysisReport,
    IssueBrowserAgentPotentialSolution,
    IssueBrowserAgentStartRequest,
    IssueBrowserAgentStartResponse,
    IssueBrowserAgentStatusResponse,
)
from backend.services.llm import client

logger = logging.getLogger(__name__)

DISPLAY_WIDTH = 1440
DISPLAY_HEIGHT = 960
MAX_AGENT_STEPS = 48
MIN_ANALYZED_PAGES = 4
MAX_VISITED_PAGE_SUMMARIES = 10
MAX_CANDIDATE_LINKS = 10
MAX_ANALYSIS_FINDINGS = 4
MAX_ANALYSIS_SOLUTIONS = 3
MAX_ANALYSIS_STEPS = 4
TOP_SOURCE_REVIEW_TARGET = 3
FULL_SOURCE_VIEW_THRESHOLD = 0.9


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
    analysis_report: IssueBrowserAgentAnalysisReport | None = None
    source_review_progress: dict[str, float] = field(default_factory=dict)
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
        research_payload = req.research.model_dump(mode="json")
        session = BrowserAgentSession(
            session_id=session_id,
            user_id=req.user_id,
            task_id=req.task_id,
            research=research_payload,
            analysis_report=self._build_pending_analysis_report(research_payload),
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
            analysis_report=session.analysis_report,
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
        await self._finalize_analysis_report(session)
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
            session.analysis_report = self._build_limited_analysis_report(
                session,
                coverage_note="The browser task could not start because no launch URL was available.",
            )
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
            self._append_page_observation(session, "Opened the first trusted page")
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
            if session.state in {"failed", "done"}:
                await self._finalize_analysis_report(session)
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
                if not self._has_enough_evidence(session):
                    reminder = self._build_coverage_reminder(session)
                    session.state = "running"
                    session.message = reminder
                    session.step_log.append(reminder)
                    await self._show_step(session, reminder)
                    return await client.responses.create(
                        model=OPENAI_BROWSER_AGENT_MODEL,
                        previous_response_id=response.id,
                        tools=self._tools(),
                        input=[
                            {
                                "type": "function_call_output",
                                "call_id": function_call.call_id,
                                "output": json.dumps(
                                    {
                                        "status": "need_more_evidence",
                                        "message": reminder,
                                    }
                                ),
                            }
                        ],
                        truncation="auto",
                        reasoning={"summary": "concise"},
                    )

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
                    reminder = self._build_coverage_reminder(session)
                    current_source_url = self._current_tracked_source_url(session)
                    if current_source_url and not self._source_review_complete(session, current_source_url):
                        session.step_log.append(reminder)
                        decision = VisionBrowserDecision(
                            decision="action",
                            narration=reminder,
                            type="scroll",
                            scroll_y=720,
                        )
                        normalized = self._normalize_vision_decision(session, decision)
                        await self._execute_action(session, normalized)
                        session.current_url = session.page.url if session.page else session.current_url
                        session.action_count += 1
                        session.step_log.append(self._describe_action(normalized))
                        steps_taken += 1
                        continue

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
        source_progress_lines = self._format_source_review_lines(session)
        required_source_reviews = self._required_source_review_count(session)
        top_source_rules = (
            f"- Before finishing, fully review the first {required_source_reviews} candidate source(s) when available.\n"
            f"- A tracked source only counts as fully reviewed after you open that source page and see at least {int(FULL_SOURCE_VIEW_THRESHOLD * 100)}% of it, unless the page is already short enough to fit on screen.\n"
            "- Prioritize the listed candidate sources in order before exploring extra links.\n"
            if required_source_reviews
            else "- Prioritize the listed candidate sources in order before exploring extra links.\n"
        )

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
            "Tracked top-source coverage:\n"
            f"{source_progress_lines}\n\n"
            "Recommended end-state:\n"
            f"{recommendation_lines}\n\n"
            "Important behavior rules:\n"
            "- Narrate progress through your reasoning summary in short, concrete language.\n"
            "- Keep the user in control when the page asks for personal information or when a safety warning appears.\n"
            "- Prefer reading and comparing current public information over pushing deep into a site.\n"
            f"{top_source_rules}"
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
        target_pages, target_domains = self._coverage_targets(session)
        required_source_reviews = self._required_source_review_count(session)
        source_progress_lines = self._format_source_review_lines(session)
        coverage_rules = (
            f"- Do not finish until you have fully reviewed at least {required_source_reviews} of the top candidate source(s), unless fewer than that were provided.\n"
            f"- A tracked source counts as fully reviewed only after its page has reached at least {int(FULL_SOURCE_VIEW_THRESHOLD * 100)}% view coverage or is clearly short enough to fit on screen.\n"
            "- If the current tracked source is not fully reviewed yet, prefer scrolling before moving elsewhere.\n"
            if required_source_reviews
            else "- Prefer scrolling or opening another trusted page before finishing if coverage still looks thin.\n"
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
            "Tracked top-source coverage:\n"
            f"{source_progress_lines}\n\n"
            "Relevant extracted links from the current page:\n"
            f"{candidate_links}\n\n"
            "Pages already analyzed:\n"
            f"{visited_lines}\n\n"
            "Recent step history:\n"
            f"{history_lines}\n\n"
            "Coverage requirement:\n"
            f"- Do not finish until you have analyzed at least {target_pages} trusted page(s) across at least {target_domains} domain(s).\n"
            f"{coverage_rules}\n"
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

    def _build_pending_analysis_report(
        self, research: dict[str, Any]
    ) -> IssueBrowserAgentAnalysisReport:
        title = research.get("title") or "this issue"
        return IssueBrowserAgentAnalysisReport(
            status="pending",
            headline=f"Building analysis for {title}",
            summary=(
                "FinCopilot is scanning trusted pages and will summarize the most practical "
                "solutions once the browser pass is complete."
            ),
            key_findings=[],
            potential_solutions=[],
            recommended_next_steps=[],
            coverage_note="Analysis will populate after the current browser run finishes.",
        )

    async def _finalize_analysis_report(self, session: BrowserAgentSession) -> None:
        current = session.analysis_report
        if current and current.status in {"ready", "limited"}:
            return

        if session.state not in {"done", "failed"}:
            session.analysis_report = self._build_pending_analysis_report(session.research)
            return

        if not self._has_enough_evidence(session):
            session.analysis_report = self._build_limited_analysis_report(session)
            return

        try:
            report = await self._generate_analysis_report(session)
            session.analysis_report = self._sanitize_analysis_report(session, report)
        except Exception:
            logger.exception("Failed to generate browser agent analysis report")
            session.analysis_report = self._build_limited_analysis_report(
                session,
                coverage_note=(
                    "FinCopilot gathered browser evidence, but the final analysis had to "
                    "fall back to the guided research summary."
                ),
            )

    async def _generate_analysis_report(
        self, session: BrowserAgentSession
    ) -> IssueBrowserAgentAnalysisReport:
        response = await client.responses.parse(
            model=OPENAI_BROWSER_AGENT_FALLBACK_MODEL,
            instructions=(
                "You are FinCopilot's financial browser analyst. Build a concise advisory "
                "report from the browser evidence that was already captured. "
                "Only cite URLs that were actually analyzed by the browser agent. "
                "Return status `ready` when the evidence is sufficient, otherwise `limited`. "
                "Never return `pending`. Keep recommendations practical and non-transactional."
            ),
            input=self._build_analysis_report_prompt(session),
            temperature=0.1,
            text_format=IssueBrowserAgentAnalysisReport,
        )
        if response.output_parsed is None:
            raise RuntimeError("Browser agent analysis report returned no structured output.")
        return response.output_parsed

    def _build_analysis_report_prompt(self, session: BrowserAgentSession) -> str:
        research = session.research
        findings = "\n".join(
            f"- {item.get('label')}: {item.get('value')} ({item.get('detail') or 'No extra detail.'})"
            for item in (research.get("findings") or [])[:MAX_ANALYSIS_FINDINGS]
        ) or "- No structured findings were preloaded."
        recommendations = "\n".join(
            f"- {item.get('title')}: {item.get('description')} "
            f"(Impact: {item.get('expected_impact') or 'Unspecified'})"
            for item in (research.get("recommendations") or [])[:MAX_ANALYSIS_SOLUTIONS]
        ) or "- No guided recommendations were preloaded."
        visited_pages = "\n".join(
            f"- {page['title']} | {page['domain']} | {page['url']} | Snippet: {page.get('snippet') or 'No snippet.'}"
            for page in session.visited_pages[-MAX_VISITED_PAGE_SUMMARIES:]
        ) or "- No analyzed pages were recorded."
        step_log = "\n".join(f"- {entry}" for entry in session.step_log[-12:]) or "- No step history."
        available_urls = "\n".join(
            f"- {page['url']}" for page in session.visited_pages[-MAX_VISITED_PAGE_SUMMARIES:]
        ) or "- No analyzed URLs."

        return (
            f"Issue: {research.get('title')}\n"
            f"Browser goal: {research.get('browser_goal')}\n"
            f"Initial research summary: {research.get('summary')}\n"
            f"Run state: {session.state}\n"
            f"Runtime mode: {session.runtime_mode}\n"
            f"Browser result: {session.result or session.message or 'No result yet.'}\n"
            f"Pages analyzed: {len(session.visited_pages)}\n"
            f"Domains analyzed: {len({page['domain'] for page in session.visited_pages})}\n\n"
            "Guided findings:\n"
            f"{findings}\n\n"
            "Guided recommendations:\n"
            f"{recommendations}\n\n"
            "Visited pages:\n"
            f"{visited_pages}\n\n"
            "Step log:\n"
            f"{step_log}\n\n"
            "Allowed evidence URLs:\n"
            f"{available_urls}\n"
        )

    def _sanitize_analysis_report(
        self,
        session: BrowserAgentSession,
        report: IssueBrowserAgentAnalysisReport,
    ) -> IssueBrowserAgentAnalysisReport:
        allowed_urls = [page["url"] for page in session.visited_pages if page.get("url")]
        sanitized_solutions: list[IssueBrowserAgentPotentialSolution] = []

        for item in report.potential_solutions[:MAX_ANALYSIS_SOLUTIONS]:
            evidence_urls = self._dedupe_strings(
                [
                    url
                    for url in (item.evidence_urls or [])
                    if url in allowed_urls
                ]
            )[:3]
            if not evidence_urls:
                evidence_urls = allowed_urls[:3]

            sanitized_solutions.append(
                IssueBrowserAgentPotentialSolution(
                    title=item.title.strip() or "Potential solution",
                    description=item.description.strip() or "Review the cited evidence before acting.",
                    tradeoffs=(
                        item.tradeoffs.strip()
                        if isinstance(item.tradeoffs, str) and item.tradeoffs.strip()
                        else "Verify current eligibility, fees, and timeline before acting."
                    ),
                    evidence_urls=evidence_urls,
                )
            )

        status = "limited" if report.status == "limited" else "ready"
        coverage_note = report.coverage_note
        if status == "limited" and not coverage_note:
            coverage_note = self._build_coverage_note(session)

        return IssueBrowserAgentAnalysisReport(
            status=status,
            headline=report.headline.strip() or "Browser analysis complete",
            summary=report.summary.strip() or (session.result or session.message or "Analysis complete."),
            key_findings=self._dedupe_strings(report.key_findings)[:MAX_ANALYSIS_FINDINGS],
            potential_solutions=sanitized_solutions,
            recommended_next_steps=self._dedupe_strings(report.recommended_next_steps)[:MAX_ANALYSIS_STEPS],
            coverage_note=coverage_note,
        )

    def _build_limited_analysis_report(
        self,
        session: BrowserAgentSession,
        coverage_note: str | None = None,
    ) -> IssueBrowserAgentAnalysisReport:
        research = session.research
        key_findings = [
            f"{item.get('label')}: {item.get('value')}"
            for item in (research.get("findings") or [])[:MAX_ANALYSIS_FINDINGS]
            if item.get("label") and item.get("value")
        ]
        key_findings.extend(
            f"Observed page: {page['title']} ({page['domain']})"
            for page in session.visited_pages[:2]
        )

        evidence_urls = self._dedupe_strings(
            [
                page["url"]
                for page in session.visited_pages
                if page.get("url")
            ]
        )
        if not evidence_urls:
            evidence_urls = self._dedupe_strings(
                [
                    item.get("url", "")
                    for item in (research.get("sources") or [])
                    if item.get("url")
                ]
            )

        potential_solutions = [
            IssueBrowserAgentPotentialSolution(
                title=item.get("title") or "Potential solution",
                description=item.get("description") or "Review the guided research summary.",
                tradeoffs=item.get("expected_impact")
                or "Confirm the current details on an official page before acting.",
                evidence_urls=evidence_urls[:3],
            )
            for item in (research.get("recommendations") or [])[:MAX_ANALYSIS_SOLUTIONS]
        ]

        recommended_next_steps = [
            step.get("action") or step.get("title") or "Review the browser findings."
            for step in (research.get("steps") or [])[:MAX_ANALYSIS_STEPS]
            if step.get("action") or step.get("title")
        ]
        if session.result:
            recommended_next_steps.insert(0, session.result)

        return IssueBrowserAgentAnalysisReport(
            status="limited",
            headline=f"Limited browser analysis for {research.get('title') or 'this issue'}",
            summary=(
                f"FinCopilot reviewed {len(session.visited_pages)} page(s) across "
                f"{len({page['domain'] for page in session.visited_pages})} domain(s). "
                "The report below leans on the guided research brief because the browser "
                "coverage was limited or the run ended early."
            ),
            key_findings=self._dedupe_strings(key_findings)[:MAX_ANALYSIS_FINDINGS],
            potential_solutions=potential_solutions,
            recommended_next_steps=self._dedupe_strings(recommended_next_steps)[:MAX_ANALYSIS_STEPS],
            coverage_note=coverage_note or self._build_coverage_note(session),
        )

    def _build_coverage_note(self, session: BrowserAgentSession) -> str:
        if session.state == "failed":
            return (
                "The browser run ended with a runtime issue, so FinCopilot fell back to a "
                "limited report based on the evidence gathered before the failure."
            )
        if session.stop_requested:
            return "The browser run was stopped early, so the recommendations are based on partial evidence."
        return (
            "The browser agent did not reach the target page coverage, so review the cited pages "
            "before treating these recommendations as final."
        )

    def _append_page_observation(
        self, session: BrowserAgentSession, prefix: str = "Observed page"
    ) -> None:
        context = session.current_page_context or {}
        title = context.get("title") or "Page"
        domain = context.get("domain") or urlparse(context.get("url", "")).netloc or "unknown domain"
        entry = f"{prefix}: {title} ({domain})"
        if not session.step_log or session.step_log[-1] != entry:
            session.step_log.append(entry)

    def _dedupe_strings(self, values: list[str] | None) -> list[str]:
        seen: set[str] = set()
        result: list[str] = []
        for value in values or []:
            text = (value or "").strip()
            if not text or text in seen:
                continue
            seen.add(text)
            result.append(text)
        return result

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
        required_source_reviews = self._required_source_review_count(session)
        completed_source_reviews = self._count_completed_source_reviews(session)
        target_pages, target_domains = self._coverage_targets(session)
        return (
            pages_analyzed >= target_pages
            and domains_analyzed >= target_domains
            and completed_source_reviews >= required_source_reviews
        )

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
        for url in self._tracked_source_urls(session):
            if url and not self._source_review_complete(session, url) and not self._urls_match(url, session.current_url or ""):
                return url

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
        self._append_page_observation(session)
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
                    scroll_y: window.scrollY || document.documentElement?.scrollTop || 0,
                    viewport_height: window.innerHeight || document.documentElement?.clientHeight || 0,
                    document_height: Math.max(
                      document.documentElement?.scrollHeight || 0,
                      document.body?.scrollHeight || 0,
                      window.innerHeight || 0
                    ),
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
            "view_progress": self._compute_view_progress(raw_context),
            "candidate_links": self._rank_candidate_links(
                session,
                current_url,
                raw_context.get("links") or [],
            ),
        }
        session.current_page_context = context
        session.current_url = context["url"]
        self._update_source_review_progress(session, context)
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

    def _coverage_targets(self, session: BrowserAgentSession) -> tuple[int, int]:
        available_source_domains = {
            urlparse(item.get("url", "")).netloc
            for item in (session.research.get("sources") or [])
            if item.get("url")
        }
        required_source_reviews = self._required_source_review_count(session)
        target_pages = max(
            2,
            required_source_reviews,
            min(MIN_ANALYZED_PAGES, len(available_source_domains) or MIN_ANALYZED_PAGES),
        )
        target_domains = max(1, min(2, len(available_source_domains) or 1))
        return target_pages, target_domains

    def _required_source_review_count(self, session: BrowserAgentSession) -> int:
        return len(self._tracked_source_urls(session))

    def _tracked_source_urls(self, session: BrowserAgentSession) -> list[str]:
        return self._dedupe_strings(
            [
                item.get("url", "")
                for item in (session.research.get("sources") or [])
                if item.get("url")
            ]
        )[:TOP_SOURCE_REVIEW_TARGET]

    def _count_completed_source_reviews(self, session: BrowserAgentSession) -> int:
        return sum(
            1
            for url in self._tracked_source_urls(session)
            if self._source_review_complete(session, url)
        )

    def _source_review_complete(self, session: BrowserAgentSession, url: str) -> bool:
        return session.source_review_progress.get(url, 0.0) >= FULL_SOURCE_VIEW_THRESHOLD

    def _build_coverage_reminder(self, session: BrowserAgentSession) -> str:
        required_source_reviews = self._required_source_review_count(session)
        completed_source_reviews = self._count_completed_source_reviews(session)
        target_pages, target_domains = self._coverage_targets(session)
        pages_analyzed = len(session.visited_pages)
        domains_analyzed = len({page["domain"] for page in session.visited_pages})
        incomplete_sources = [
            f"{self._source_label(session, url)} ({int(round(session.source_review_progress.get(url, 0.0) * 100))}% viewed)"
            for url in self._tracked_source_urls(session)
            if not self._source_review_complete(session, url)
        ]

        reminder = (
            f"Keep going: fully review {required_source_reviews} top source(s) before finishing "
            f"({completed_source_reviews}/{required_source_reviews} complete; "
            f"{pages_analyzed}/{target_pages} page(s), {domains_analyzed}/{target_domains} domain(s))."
            if required_source_reviews
            else f"Keep going: gather broader coverage before finishing ({pages_analyzed}/{target_pages} page(s), {domains_analyzed}/{target_domains} domain(s))."
        )
        if incomplete_sources:
            reminder = f"{reminder} Incomplete tracked sources: {', '.join(incomplete_sources[:TOP_SOURCE_REVIEW_TARGET])}."
        return reminder

    def _format_source_review_lines(self, session: BrowserAgentSession) -> str:
        tracked_urls = self._tracked_source_urls(session)
        if not tracked_urls:
            return "- No tracked source URLs."

        lines: list[str] = []
        for url in tracked_urls:
            progress = session.source_review_progress.get(url, 0.0)
            status = (
                "complete"
                if progress >= FULL_SOURCE_VIEW_THRESHOLD
                else f"{int(round(progress * 100))}% viewed"
            )
            lines.append(f"- {self._source_label(session, url)}: {url} [{status}]")
        return "\n".join(lines)

    def _source_label(self, session: BrowserAgentSession, url: str) -> str:
        for item in (session.research.get("sources") or []):
            if self._urls_match(item.get("url", ""), url):
                return item.get("title") or urlparse(url).netloc or "Source"
        return urlparse(url).netloc or "Source"

    def _current_tracked_source_url(self, session: BrowserAgentSession) -> str | None:
        current_url = session.current_url or ""
        for url in self._tracked_source_urls(session):
            if self._urls_match(current_url, url):
                return url
        return None

    def _normalize_match_url(self, url: str) -> str:
        parsed = urlparse((url or "").strip())
        if not parsed.scheme or not parsed.netloc:
            return ""
        path = parsed.path.rstrip("/") or "/"
        return f"{parsed.scheme.lower()}://{parsed.netloc.lower()}{path}"

    def _urls_match(self, left: str, right: str) -> bool:
        return self._normalize_match_url(left) == self._normalize_match_url(right)

    def _compute_view_progress(self, raw_context: dict[str, Any]) -> float:
        viewport_height = int(raw_context.get("viewport_height") or 0)
        document_height = int(raw_context.get("document_height") or 0)
        scroll_y = int(raw_context.get("scroll_y") or 0)
        if document_height <= 0 or viewport_height <= 0:
            return 0.0
        if document_height <= viewport_height + 24:
            return 1.0
        return max(0.0, min(1.0, (scroll_y + viewport_height) / document_height))

    def _update_source_review_progress(
        self,
        session: BrowserAgentSession,
        context: dict[str, Any],
    ) -> None:
        current_url = context.get("url", "")
        if not current_url:
            return

        progress = float(context.get("view_progress") or 0.0)
        for url in self._tracked_source_urls(session):
            if self._urls_match(current_url, url):
                session.source_review_progress[url] = max(
                    progress,
                    session.source_review_progress.get(url, 0.0),
                )

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
