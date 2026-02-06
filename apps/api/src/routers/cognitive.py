"""Cognitive assessment router for adaptive testing."""
from fastapi import APIRouter, HTTPException, Depends

from src.models.mosaic import (
    CognitiveDomain,
    StartCognitiveAssessmentRequest,
    CognitiveAssessmentResponse,
    CognitiveTestItemResponse,
    CognitiveProfileResponse,
    SubmitCognitiveResponseRequest,
    SubmitCognitiveResponseResponse,
)
from src.services.adaptive_testing import AdaptiveTestingService
from src.middleware.auth import get_current_user, CurrentUser

router = APIRouter()
adaptive_testing = AdaptiveTestingService()


@router.post("/start", response_model=dict)
async def start_cognitive_assessment(
    request: StartCognitiveAssessmentRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Start a new cognitive assessment for a child.

    Returns the assessment session and the first test item.
    """
    try:
        assessment, first_item = await adaptive_testing.start_assessment(
            child_id=request.child_id,
            domain=request.domain,
        )
        return {
            "assessment": assessment,
            "first_item": first_item,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/respond", response_model=SubmitCognitiveResponseResponse)
async def submit_cognitive_response(
    request: SubmitCognitiveResponseRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Submit a response to a cognitive test item.

    Returns whether the answer was correct, updated ability estimate,
    whether the test is complete, and the next item if applicable.
    """
    try:
        result = await adaptive_testing.submit_response(
            assessment_id=request.assessment_id,
            item_id=request.item_id,
            response=request.response,
            reaction_time_ms=request.reaction_time_ms,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assessment/{assessment_id}", response_model=CognitiveAssessmentResponse)
async def get_cognitive_assessment(
    assessment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get a cognitive assessment by ID."""
    try:
        assessment = await adaptive_testing.get_assessment(assessment_id)
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        return assessment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/{child_id}", response_model=CognitiveProfileResponse)
async def get_cognitive_profile(
    child_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get the cognitive profile for a child.

    Returns aggregated scores across all cognitive domains.
    """
    try:
        profile = await adaptive_testing.get_cognitive_profile(child_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Cognitive profile not found")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/domains")
async def list_cognitive_domains():
    """List all available cognitive domains for testing."""
    return {
        "domains": [
            {"id": "math", "name": "Math", "description": "Counting, patterns, basic operations"},
            {"id": "logic", "name": "Logic", "description": "Pattern recognition, sequences, categorization"},
            {"id": "verbal", "name": "Verbal", "description": "Vocabulary, comprehension, following directions"},
            {"id": "spatial", "name": "Spatial", "description": "Puzzles, mental rotation, shape recognition"},
            {"id": "memory", "name": "Memory", "description": "Recall, working memory, sequence memory"},
        ]
    }
