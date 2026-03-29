from fastapi import APIRouter, HTTPException

from backend.models.schemas import (
    ComparisonProfile,
    IssueBrowserAgentAnswerRequest,
    IssueBrowserAgentStartRequest,
    IssueBrowserAgentStartResponse,
    IssueBrowserAgentStatusResponse,
    IssueDetectRequest,
    IssueDetectResponse,
    IssueResearchRequest,
    IssueResearchResponse,
)
from backend.db import get_comparison_profile
from backend.services.browser_agent import browser_agent_manager
from backend.services.issue_detection import detect_issues, explain_issues
from backend.services.issue_research import build_issue_research

router = APIRouter()


@router.post("/issues/detect", response_model=IssueDetectResponse)
async def detect(req: IssueDetectRequest):
    """Detect baseline financial issues from profile_data_before."""
    profile_data = await get_comparison_profile(req.user_id, "before")
    if not profile_data:
        raise HTTPException(status_code=404, detail="Financial profile not found")

    profile = ComparisonProfile(**profile_data)
    findings = detect_issues(profile)
    explained = await explain_issues(findings, profile)

    return IssueDetectResponse(issues=explained)


@router.post("/issues/research", response_model=IssueResearchResponse)
async def research_issue(req: IssueResearchRequest):
    """Build a guided, issue-specific web research plan."""
    profile_data = await get_comparison_profile(req.user_id, "before")
    if not profile_data:
        raise HTTPException(status_code=404, detail="Financial profile not found")

    profile = ComparisonProfile(**profile_data)
    findings = detect_issues(profile)
    finding = next((item for item in findings if item.rule_id == req.rule_id), None)
    if finding is None:
        raise HTTPException(status_code=404, detail="Financial issue not found")

    return await build_issue_research(profile=profile, finding=finding)


@router.post(
    "/issues/browser-agent/start",
    response_model=IssueBrowserAgentStartResponse,
)
async def start_issue_browser_agent(req: IssueBrowserAgentStartRequest):
    """Start a visible browser agent session for an issue research task."""
    return await browser_agent_manager.start_session(req)


@router.get(
    "/issues/browser-agent/status/{session_id}",
    response_model=IssueBrowserAgentStatusResponse,
)
async def get_issue_browser_agent_status(session_id: str):
    try:
        return browser_agent_manager.get_status(session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Browser agent session not found")


@router.post(
    "/issues/browser-agent/pause/{session_id}",
    response_model=IssueBrowserAgentStatusResponse,
)
async def pause_issue_browser_agent(session_id: str):
    try:
        return await browser_agent_manager.pause(session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Browser agent session not found")


@router.post(
    "/issues/browser-agent/resume/{session_id}",
    response_model=IssueBrowserAgentStatusResponse,
)
async def resume_issue_browser_agent(session_id: str):
    try:
        return await browser_agent_manager.resume(session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Browser agent session not found")


@router.post(
    "/issues/browser-agent/stop/{session_id}",
    response_model=IssueBrowserAgentStatusResponse,
)
async def stop_issue_browser_agent(session_id: str):
    try:
        return await browser_agent_manager.stop(session_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Browser agent session not found")


@router.post(
    "/issues/browser-agent/answer/{session_id}",
    response_model=IssueBrowserAgentStatusResponse,
)
async def answer_issue_browser_agent(
    session_id: str, req: IssueBrowserAgentAnswerRequest
):
    try:
        return await browser_agent_manager.answer(session_id, req.answer)
    except KeyError:
        raise HTTPException(status_code=404, detail="Browser agent session not found")
