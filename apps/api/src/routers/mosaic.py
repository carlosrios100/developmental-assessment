"""Mosaic router for unified assessments and archetypes."""
from fastapi import APIRouter, HTTPException, Depends

from src.models.mosaic import (
    ArchetypeType,
    GenerateMosaicRequest,
    GenerateMosaicResponse,
    MosaicAssessmentResponse,
    ArchetypeResponse,
    ArchetypeMatchResponse,
    IkigaiChartResponse,
    GapAnalysisResponse,
)
from src.services.mosaic_scoring import MosaicScoringService
from src.services.archetype_service import ArchetypeService
from src.services.ikigai_service import IkigaiService
from src.middleware.auth import get_current_user, CurrentUser

router = APIRouter()
mosaic_service = MosaicScoringService()
archetype_service = ArchetypeService()
ikigai_service = IkigaiService()


# ==================== MOSAIC ASSESSMENT ENDPOINTS ====================


@router.post("/generate", response_model=GenerateMosaicResponse)
async def generate_mosaic(
    request: GenerateMosaicRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Generate a complete Mosaic assessment for a child.

    The Mosaic Protocol combines:
    - Cognitive assessment (IQ-like) - 40% weight
    - Emotional/behavioral assessment (EQ-like) - 60% weight
    - Socio-economic context (adversity multiplier) - boosts potential

    Returns:
    - Mosaic assessment with true potential score
    - Archetype matches (top 10 ranked)
    - Ikigai chart (talents, passions, world needs, careers)
    - Gap analysis with matched resources
    """
    try:
        result = await mosaic_service.generate_mosaic(
            child_id=request.child_id,
            include_context=request.include_context,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assessment/{child_id}", response_model=MosaicAssessmentResponse)
async def get_mosaic_assessment(
    child_id: str,
    version: int | None = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get the latest Mosaic assessment for a child.

    Optionally specify a version number to get a specific historical assessment.
    """
    try:
        assessment = await mosaic_service.get_mosaic(child_id, version)
        if not assessment:
            raise HTTPException(
                status_code=404,
                detail="Mosaic assessment not found. Generate one first."
            )
        return assessment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assessment/{child_id}/history", response_model=list[MosaicAssessmentResponse])
async def get_mosaic_history(
    child_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get all Mosaic assessment versions for a child."""
    try:
        assessments = await mosaic_service.get_mosaic_history(child_id)
        return assessments
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ARCHETYPE ENDPOINTS ====================


@router.get("/archetypes", response_model=list[ArchetypeResponse])
async def get_all_archetypes(
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get all available archetypes with their descriptions and traits."""
    try:
        archetypes = await archetype_service.get_all_archetypes()
        return archetypes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/archetype/{archetype_type}", response_model=ArchetypeResponse)
async def get_archetype(
    archetype_type: ArchetypeType,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get a specific archetype by type."""
    try:
        archetype = await archetype_service.get_archetype(archetype_type)
        if not archetype:
            raise HTTPException(status_code=404, detail="Archetype not found")
        return archetype
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/archetype/{archetype_type}/guidance")
async def get_archetype_guidance(
    archetype_type: ArchetypeType,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get parent guidance for nurturing a child's archetype.

    Returns:
    - Strengths to nurture
    - Growth areas to develop
    - Suggested activities
    - Famous examples
    """
    try:
        guidance = await archetype_service.get_archetype_guidance(archetype_type)
        if not guidance:
            raise HTTPException(status_code=404, detail="Archetype not found")
        return guidance
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/archetype/{archetype_type}/careers")
async def get_archetype_careers(
    archetype_type: ArchetypeType,
    zip_code: str | None = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get career pathways for an archetype.

    If zip_code is provided, local matches are prioritized.
    """
    try:
        # Get local industries if zip code provided
        local_industries = None
        if zip_code:
            from src.services.geopolitical_service import GeopoliticalService
            geo_service = GeopoliticalService()
            opportunity = await geo_service.get_opportunity_index(zip_code)
            if opportunity:
                local_industries = opportunity.key_industries

        careers = await archetype_service.get_career_pathways_for_archetype(
            archetype_type,
            local_industries,
        )
        return {"archetype": archetype_type.value, "careers": careers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== IKIGAI ENDPOINTS ====================


@router.get("/ikigai/{mosaic_assessment_id}", response_model=IkigaiChartResponse)
async def get_ikigai_chart(
    mosaic_assessment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get the Ikigai chart for a Mosaic assessment.

    The Ikigai model shows the intersection of:
    - What you're good at (Talents)
    - What you love (Passions)
    - What the world needs (World Needs)
    - What you can be paid for (Viable Careers)
    """
    try:
        chart = await ikigai_service.get_ikigai_chart(mosaic_assessment_id)
        if not chart:
            raise HTTPException(status_code=404, detail="Ikigai chart not found")
        return chart
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== GAP ANALYSIS ENDPOINTS ====================


@router.get("/gaps/{mosaic_assessment_id}", response_model=list[GapAnalysisResponse])
async def get_gap_analysis(
    mosaic_assessment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get gap analysis for a Mosaic assessment.

    Shows skill and resource gaps with matched programs and resources.
    """
    try:
        from src.services.supabase_client import get_supabase_client
        supabase = get_supabase_client()

        result = supabase.table("mosaic_gap_analysis").select("*").eq(
            "mosaic_assessment_id", mosaic_assessment_id
        ).order("priority").execute()

        if not result.data:
            return []

        return [mosaic_service._map_gap_response(g) for g in result.data]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== METADATA ENDPOINTS ====================


@router.get("/archetype-types")
async def list_archetype_types():
    """List all archetype types with brief descriptions."""
    return {
        "types": [
            {"id": "diplomat", "name": "The Diplomat", "icon": "handshake"},
            {"id": "systems_architect", "name": "The Systems Architect", "icon": "cpu"},
            {"id": "operator", "name": "The Operator", "icon": "settings"},
            {"id": "caregiver", "name": "The Caregiver", "icon": "heart"},
            {"id": "creator", "name": "The Creator", "icon": "palette"},
            {"id": "analyst", "name": "The Analyst", "icon": "bar-chart"},
            {"id": "builder", "name": "The Builder", "icon": "hammer"},
            {"id": "explorer", "name": "The Explorer", "icon": "compass"},
            {"id": "connector", "name": "The Connector", "icon": "users"},
            {"id": "guardian", "name": "The Guardian", "icon": "shield"},
        ]
    }


@router.get("/scoring-info")
async def get_scoring_info():
    """Get information about how Mosaic scores are calculated."""
    return {
        "formula": {
            "description": "True Potential = (Cognitive * 0.4 + Emotional * 0.6) * Adversity Multiplier",
            "cognitive_weight": 0.4,
            "emotional_weight": 0.6,
            "adversity_multiplier_range": {"min": 1.0, "max": 1.5},
        },
        "adversity_multiplier": {
            "description": "Recognizes resilience in children facing challenges",
            "calculation": "Based on gap between opportunity index and socio-economic status",
            "example": "A child with low SES in a high-opportunity area gets a higher multiplier",
        },
        "confidence_level": {
            "description": "How complete the assessment data is",
            "factors": ["cognitive_assessment_completion", "behavioral_sessions_count", "context_data_completeness"],
        },
    }
