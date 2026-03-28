from fastapi import APIRouter, HTTPException

from backend.models.schemas import IssueDetectRequest, IssueDetectResponse, FinancialProfile
from backend.services.issue_detection import detect_issues, explain_issues
from backend.db import get_profile

router = APIRouter()


@router.post("/issues/detect", response_model=IssueDetectResponse)
async def detect(req: IssueDetectRequest):
    """Detect critical financial issues in the user's profile using deterministic rules,
    then generate plain-language explanations via the LLM."""
    profile_data = await get_profile(req.user_id)
    if not profile_data:
        raise HTTPException(status_code=404, detail="Financial profile not found")

    profile = FinancialProfile(**profile_data)

    raw_issues = detect_issues(profile)
    explained = await explain_issues(raw_issues, profile)

    return IssueDetectResponse(issues=explained)
