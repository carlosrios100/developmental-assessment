"""Assessment router."""
from fastapi import APIRouter, HTTPException, Depends

from src.models.assessment import (
    AssessmentCreate,
    AssessmentResponse,
    AssessmentScoreRequest,
    QuestionnaireResponseCreate,
    DomainScoreResponse,
)
from src.services.assessment import AssessmentService
from src.middleware.auth import get_current_user, CurrentUser

router = APIRouter()
assessment_service = AssessmentService()


@router.post("/", response_model=AssessmentResponse)
async def create_assessment(
    request: AssessmentCreate,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a new assessment for a child."""
    try:
        assessment = await assessment_service.create_assessment(
            child_id=request.child_id,
            questionnaire_version=request.questionnaire_version,
            completed_by_user_id=current_user.id,
        )
        return assessment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get assessment by ID."""
    try:
        assessment = await assessment_service.get_assessment(assessment_id)
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        return assessment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{assessment_id}/responses")
async def save_responses(
    assessment_id: str,
    responses: list[QuestionnaireResponseCreate],
    current_user: CurrentUser = Depends(get_current_user),
):
    """Save questionnaire responses for an assessment."""
    try:
        await assessment_service.save_responses(assessment_id, responses)
        return {"status": "saved", "count": len(responses)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{assessment_id}/score", response_model=AssessmentResponse)
async def score_assessment(
    assessment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Calculate scores for a completed assessment.

    - Calculates domain scores based on responses
    - Determines risk levels for each domain
    - Updates overall assessment risk level
    - Generates recommendations
    """
    try:
        result = await assessment_service.score_assessment(assessment_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{assessment_id}/scores", response_model=list[DomainScoreResponse])
async def get_domain_scores(
    assessment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get domain scores for an assessment."""
    try:
        scores = await assessment_service.get_domain_scores(assessment_id)
        return scores
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/child/{child_id}", response_model=list[AssessmentResponse])
async def get_child_assessments(
    child_id: str,
    limit: int = 10,
    offset: int = 0,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get all assessments for a child."""
    try:
        assessments = await assessment_service.get_assessments_by_child(
            child_id, limit, offset
        )
        return assessments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{assessment_id}")
async def delete_assessment(
    assessment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete an assessment."""
    try:
        await assessment_service.delete_assessment(assessment_id)
        return {"status": "deleted", "assessment_id": assessment_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
