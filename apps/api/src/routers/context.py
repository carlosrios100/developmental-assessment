"""Context router for socio-economic data and consent management."""
from fastapi import APIRouter, HTTPException, Depends, Request

from src.models.mosaic import (
    ConsentCategory,
    SaveFamilyContextRequest,
    FamilyContextResponse,
    GrantConsentRequest,
    ConsentResponse,
    OpportunityIndexResponse,
    ContextMultiplierResponse,
)
from src.services.geopolitical_service import GeopoliticalService
from src.middleware.auth import get_current_user, CurrentUser

router = APIRouter()
geopolitical_service = GeopoliticalService()


# ==================== OPPORTUNITY INDEX ENDPOINTS ====================


@router.get("/opportunity/{zip_code}", response_model=OpportunityIndexResponse)
async def get_opportunity_index(
    zip_code: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get opportunity index data for a zip code.

    Returns local industries, grants, school quality, and other opportunity metrics.
    """
    try:
        opportunity = await geopolitical_service.get_opportunity_index(zip_code)
        if not opportunity:
            raise HTTPException(
                status_code=404,
                detail=f"No opportunity data found for zip code {zip_code}"
            )
        return opportunity
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/opportunity/search", response_model=list[OpportunityIndexResponse])
async def search_opportunity_indices(
    state_code: str | None = None,
    city: str | None = None,
    min_opportunity: float | None = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Search for opportunity indices by state, city, or minimum opportunity score."""
    try:
        opportunities = await geopolitical_service.search_opportunity_indices(
            state_code=state_code,
            city=city,
            min_opportunity=min_opportunity,
        )
        return opportunities
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FAMILY CONTEXT ENDPOINTS ====================


@router.post("/family", response_model=FamilyContextResponse)
async def save_family_context(
    request: SaveFamilyContextRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Save or update family context for a child.

    This data is used to calculate the adversity multiplier for the Mosaic score.
    All fields are optional. Requires consent to be granted first.
    """
    try:
        # Check if consent is granted
        has_consent = await geopolitical_service.check_consent(
            user_id=current_user.id,
            child_id=request.child_id,
            category=ConsentCategory.FAMILY_CONTEXT,
        )

        if not has_consent:
            raise HTTPException(
                status_code=403,
                detail="Consent for family context data collection is required"
            )

        context = await geopolitical_service.save_family_context(
            child_id=request.child_id,
            context=request.model_dump(exclude={"child_id"}, exclude_none=True),
        )
        return context
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/family/{child_id}", response_model=FamilyContextResponse)
async def get_family_context(
    child_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get family context for a child."""
    try:
        context = await geopolitical_service.get_family_context(child_id)
        if not context:
            raise HTTPException(status_code=404, detail="Family context not found")
        return context
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/family/{child_id}")
async def delete_family_context(
    child_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete family context for a child.

    This also removes the associated context multiplier.
    """
    try:
        await geopolitical_service.delete_family_context(child_id)
        return {"status": "deleted", "child_id": child_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CONSENT ENDPOINTS ====================


@router.post("/consent/grant", response_model=ConsentResponse)
async def grant_consent(
    request: GrantConsentRequest,
    http_request: Request,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Grant consent for a data collection category.

    Categories:
    - socioeconomic: Family income, education, assistance data
    - location: Zip code for opportunity matching
    - family_context: Household details, childcare, etc.
    - research_aggregate: Include in anonymized research
    - district_analytics: Include in district-level reports
    """
    try:
        # Get client info for audit
        ip_address = http_request.client.host if http_request.client else None
        user_agent = http_request.headers.get("user-agent")

        consent = await geopolitical_service.grant_consent(
            user_id=current_user.id,
            child_id=request.child_id,
            category=request.category,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return consent
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/consent/revoke", response_model=ConsentResponse)
async def revoke_consent(
    request: GrantConsentRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Revoke consent for a data collection category.

    The data will be retained but no longer processed.
    """
    try:
        consent = await geopolitical_service.revoke_consent(
            user_id=current_user.id,
            child_id=request.child_id,
            category=request.category,
        )
        return consent
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/consent/{child_id}", response_model=list[ConsentResponse])
async def get_consents(
    child_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get all consent records for a child."""
    try:
        consents = await geopolitical_service.get_consents(
            user_id=current_user.id,
            child_id=child_id,
        )
        return consents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/consent/{child_id}/check/{category}")
async def check_consent(
    child_id: str,
    category: ConsentCategory,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Check if consent is granted for a specific category."""
    try:
        has_consent = await geopolitical_service.check_consent(
            user_id=current_user.id,
            child_id=child_id,
            category=category,
        )
        return {"category": category.value, "granted": has_consent}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== CONTEXT MULTIPLIER ENDPOINTS ====================


@router.get("/multiplier/{child_id}", response_model=ContextMultiplierResponse)
async def get_context_multiplier(
    child_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get the calculated context multiplier for a child.

    The multiplier is calculated based on:
    - Opportunity index of the child's zip code
    - Family's socio-economic status
    - Gap between opportunity and status (adversity)

    Higher adversity = higher multiplier (1.0 to 1.5)
    """
    try:
        multiplier = await geopolitical_service.get_context_multiplier(child_id)
        if not multiplier:
            raise HTTPException(
                status_code=404,
                detail="Context multiplier not found. Save family context first."
            )
        return multiplier
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== METADATA ENDPOINTS ====================


@router.get("/consent-categories")
async def list_consent_categories():
    """List all consent categories with descriptions."""
    return {
        "categories": [
            {
                "id": "socioeconomic",
                "name": "Socio-Economic Data",
                "description": "Family income, education level, and assistance programs",
                "required_for": ["adversity_multiplier", "gap_analysis"],
            },
            {
                "id": "location",
                "name": "Location Data",
                "description": "Zip code for matching local opportunities and resources",
                "required_for": ["opportunity_index", "local_careers"],
            },
            {
                "id": "family_context",
                "name": "Family Context",
                "description": "Household details, languages, childcare arrangements",
                "required_for": ["context_multiplier", "personalized_recommendations"],
            },
            {
                "id": "research_aggregate",
                "name": "Research Contribution",
                "description": "Anonymized data for improving assessment algorithms",
                "required_for": ["algorithm_improvement"],
            },
            {
                "id": "district_analytics",
                "name": "District Analytics",
                "description": "Anonymized data for community-level insights",
                "required_for": ["district_reports"],
            },
        ]
    }
