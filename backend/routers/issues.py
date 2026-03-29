from fastapi import APIRouter, HTTPException

from backend.models.schemas import ComparisonProfile, IssueDetectRequest, IssueDetectResponse
from backend.db import get_comparison_profile
from backend.services.issue_detection import detect_issues, explain_issues

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
