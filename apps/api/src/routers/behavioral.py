"""Behavioral assessment router for gamified scenarios."""
from fastapi import APIRouter, HTTPException, Depends, Request

from src.models.mosaic import (
    StartBehavioralSessionRequest,
    BehavioralSessionResponse,
    BehavioralScenarioResponse,
    EmotionalProfileResponse,
    SubmitBehavioralChoiceRequest,
    SubmitBehavioralChoiceResponse,
)
from src.services.behavioral_scoring import BehavioralScoringService
from src.middleware.auth import get_current_user, CurrentUser

router = APIRouter()
behavioral_service = BehavioralScoringService()


@router.get("/scenarios", response_model=list[BehavioralScenarioResponse])
async def get_available_scenarios(
    age_months: int,
    exclude_completed: str = "",
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get available behavioral scenarios for a child's age.

    Args:
        age_months: Child's age in months (24-96)
        exclude_completed: Comma-separated list of completed scenario IDs to exclude
    """
    try:
        completed_ids = [s.strip() for s in exclude_completed.split(",") if s.strip()]
        scenarios = await behavioral_service.get_available_scenarios(
            age_months=age_months,
            completed_scenario_ids=completed_ids if completed_ids else None,
        )
        return scenarios
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scenario/{scenario_id}", response_model=BehavioralScenarioResponse)
async def get_scenario(
    scenario_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get a specific behavioral scenario by ID."""
    try:
        scenario = await behavioral_service.get_scenario(scenario_id)
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        return scenario
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/start", response_model=BehavioralSessionResponse)
async def start_behavioral_session(
    request: StartBehavioralSessionRequest,
    http_request: Request,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Start a new behavioral scenario session.

    Returns the session details for tracking gameplay.
    """
    try:
        # Extract device info from request headers
        device_info = {
            "user_agent": http_request.headers.get("user-agent"),
            "platform": http_request.headers.get("sec-ch-ua-platform", "unknown"),
        }

        session = await behavioral_service.start_session(
            child_id=request.child_id,
            scenario_id=request.scenario_id,
            device_info=device_info,
        )
        return session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/session/choice", response_model=SubmitBehavioralChoiceResponse)
async def submit_behavioral_choice(
    request: SubmitBehavioralChoiceRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Submit a choice during a behavioral scenario.

    Records the choice, reaction time, and calculates emotional dimension scores.
    Returns the next segment ID or indicates session completion.
    """
    try:
        result = await behavioral_service.submit_choice(
            session_id=request.session_id,
            choice_id=request.choice_id,
            selected_option=request.selected_option,
            reaction_time_ms=request.reaction_time_ms,
            hesitation_count=request.hesitation_count,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}", response_model=BehavioralSessionResponse)
async def get_behavioral_session(
    session_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get a behavioral session by ID."""
    try:
        session = await behavioral_service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{child_id}", response_model=list[BehavioralSessionResponse])
async def get_completed_sessions(
    child_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get all completed behavioral sessions for a child."""
    try:
        sessions = await behavioral_service.get_completed_sessions(child_id)
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/{child_id}", response_model=EmotionalProfileResponse)
async def get_emotional_profile(
    child_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get the emotional profile for a child.

    Returns aggregated scores across all emotional dimensions.
    """
    try:
        profile = await behavioral_service.get_emotional_profile(child_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Emotional profile not found")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dimensions")
async def list_emotional_dimensions():
    """List all emotional dimensions measured by behavioral scenarios."""
    return {
        "dimensions": [
            {
                "id": "empathy",
                "name": "Empathy",
                "description": "Understanding and responding to others' feelings",
            },
            {
                "id": "risk_tolerance",
                "name": "Risk Tolerance",
                "description": "Willingness to take calculated risks",
            },
            {
                "id": "delayed_gratification",
                "name": "Delayed Gratification",
                "description": "Ability to wait for larger rewards",
            },
            {
                "id": "cooperation",
                "name": "Cooperation",
                "description": "Working effectively with others",
            },
            {
                "id": "failure_resilience",
                "name": "Failure Resilience",
                "description": "Bouncing back from setbacks",
            },
            {
                "id": "emotional_regulation",
                "name": "Emotional Regulation",
                "description": "Managing emotions effectively",
            },
        ]
    }


@router.get("/scenario-types")
async def list_scenario_types():
    """List all behavioral scenario types."""
    return {
        "types": [
            {
                "id": "sharing",
                "name": "Sharing",
                "description": "Resource allocation decisions",
                "measures": ["empathy", "cooperation"],
            },
            {
                "id": "delayed_gratification",
                "name": "Delayed Gratification",
                "description": "Wait for bigger reward vs immediate small reward",
                "measures": ["delayed_gratification", "emotional_regulation"],
            },
            {
                "id": "failure_recovery",
                "name": "Failure Recovery",
                "description": "How child responds to setbacks",
                "measures": ["failure_resilience", "emotional_regulation"],
            },
            {
                "id": "empathy_response",
                "name": "Empathy Response",
                "description": "Help character in distress",
                "measures": ["empathy", "cooperation"],
            },
            {
                "id": "risk_assessment",
                "name": "Risk Assessment",
                "description": "Safe vs risky choices",
                "measures": ["risk_tolerance", "delayed_gratification"],
            },
            {
                "id": "cooperation",
                "name": "Cooperation",
                "description": "Team vs solo decisions",
                "measures": ["cooperation", "empathy"],
            },
        ]
    }
