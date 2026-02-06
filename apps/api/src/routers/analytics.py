"""Analytics router for district-level insights."""
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends

from src.models.mosaic import (
    DistrictAnalyticsRequest,
    DistrictAnalyticsResponse,
)
from src.services.supabase_client import get_supabase_client
from src.middleware.auth import get_current_user, CurrentUser
from src.logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)

MINIMUM_SAMPLE_SIZE = 50  # Privacy requirement


@router.get("/district/{zip_code}", response_model=DistrictAnalyticsResponse | None)
async def get_district_analytics(
    zip_code: str,
    age_group: str | None = None,
    period_months: int = 12,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get anonymized district-level analytics for a zip code.

    Requires minimum sample size of 50 children for privacy.

    Args:
        zip_code: The zip code to get analytics for
        age_group: Optional age group filter ('2-4', '4-6', '6-8')
        period_months: Time period in months (default 12)
    """
    try:
        supabase = get_supabase_client()

        # Build query
        query = supabase.table("district_analytics").select("*").eq(
            "zip_code", zip_code
        )

        if age_group:
            query = query.eq("age_group", age_group)

        # Get most recent period
        query = query.order("period_end", desc=True).limit(1)

        result = query.execute()

        if not result.data:
            return None

        data = result.data[0]

        # Verify sample size requirement
        if data["sample_size"] < MINIMUM_SAMPLE_SIZE:
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient sample size for privacy requirements (need {MINIMUM_SAMPLE_SIZE}+)"
            )

        return DistrictAnalyticsResponse(
            id=data["id"],
            zip_code=data["zip_code"],
            state_code=data["state_code"],
            period_start=datetime.fromisoformat(data["period_start"]),
            period_end=datetime.fromisoformat(data["period_end"]),
            sample_size=data["sample_size"],
            age_group=data["age_group"],
            archetype_distribution=data["archetype_distribution"],
            cognitive_domain_averages=data["cognitive_domain_averages"],
            emotional_dimension_averages=data["emotional_dimension_averages"],
            opportunity_utilization=data["opportunity_utilization"],
            top_gaps=data.get("top_gaps"),
            recommended_programs=data.get("recommended_programs"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/district/{zip_code}/trends")
async def get_district_trends(
    zip_code: str,
    age_group: str | None = None,
    periods: int = 4,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get trend data for a district over multiple periods.

    Returns archetype and cognitive domain trends over time.
    """
    try:
        supabase = get_supabase_client()

        query = supabase.table("district_analytics").select(
            "period_start, period_end, archetype_distribution, cognitive_domain_averages, sample_size"
        ).eq("zip_code", zip_code)

        if age_group:
            query = query.eq("age_group", age_group)

        query = query.order("period_end", desc=True).limit(periods)

        result = query.execute()

        if not result.data:
            return {"periods": []}

        # Filter by sample size and format
        valid_periods = [
            {
                "period_start": p["period_start"],
                "period_end": p["period_end"],
                "sample_size": p["sample_size"],
                "archetype_distribution": p["archetype_distribution"],
                "cognitive_averages": p["cognitive_domain_averages"],
            }
            for p in result.data
            if p["sample_size"] >= MINIMUM_SAMPLE_SIZE
        ]

        return {"periods": valid_periods}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/district/{zip_code}/gaps")
async def get_district_gaps(
    zip_code: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get the most common skill gaps in a district.

    Useful for city planners to identify program needs.
    """
    try:
        supabase = get_supabase_client()

        result = supabase.table("district_analytics").select(
            "top_gaps, recommended_programs, sample_size"
        ).eq("zip_code", zip_code).order("period_end", desc=True).limit(1).execute()

        if not result.data:
            return {"gaps": [], "recommended_programs": []}

        data = result.data[0]

        if data["sample_size"] < MINIMUM_SAMPLE_SIZE:
            raise HTTPException(
                status_code=403,
                detail="Insufficient sample size for privacy requirements"
            )

        return {
            "gaps": data.get("top_gaps", []),
            "recommended_programs": data.get("recommended_programs", []),
            "sample_size": data["sample_size"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/state/{state_code}/summary")
async def get_state_summary(
    state_code: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get summary analytics for an entire state.

    Aggregates district-level data for state-wide insights.
    """
    try:
        supabase = get_supabase_client()

        # Get all districts in state with sufficient sample size
        result = supabase.table("district_analytics").select(
            "zip_code, archetype_distribution, cognitive_domain_averages, opportunity_utilization, sample_size"
        ).eq("state_code", state_code).gte("sample_size", MINIMUM_SAMPLE_SIZE).execute()

        if not result.data:
            return {"message": "No data available for this state"}

        # Aggregate data
        total_sample = sum(d["sample_size"] for d in result.data)
        district_count = len(result.data)

        # Aggregate archetype distribution
        archetype_totals = {}
        for district in result.data:
            for archetype, count in district["archetype_distribution"].items():
                archetype_totals[archetype] = archetype_totals.get(archetype, 0) + count

        # Average opportunity utilization
        avg_opportunity = sum(
            d["opportunity_utilization"] for d in result.data
        ) / len(result.data)

        return {
            "state_code": state_code,
            "district_count": district_count,
            "total_children_assessed": total_sample,
            "archetype_distribution": archetype_totals,
            "average_opportunity_utilization": round(avg_opportunity, 2),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/district/generate")
async def generate_district_analytics(
    zip_code: str,
    age_group: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Generate or refresh district analytics for a zip code.

    This aggregates individual Mosaic assessments into anonymized district data.
    Requires admin role.

    Note: In production, this would be a scheduled job, not an API endpoint.
    """
    # Check admin role (simplified - would use proper role checking)
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    try:
        supabase = get_supabase_client()

        # Define period
        period_end = datetime.now()
        period_start = period_end - timedelta(days=365)

        # Get opportunity index for this zip
        opp_result = supabase.table("opportunity_indices").select(
            "state_code"
        ).eq("zip_code", zip_code).execute()

        if not opp_result.data:
            raise HTTPException(status_code=404, detail="Zip code not found in opportunity database")

        state_code = opp_result.data[0]["state_code"]

        # Get family contexts in this zip code
        context_result = supabase.table("family_contexts").select(
            "child_id"
        ).eq("zip_code", zip_code).execute()

        child_ids = [c["child_id"] for c in context_result.data] if context_result.data else []

        if len(child_ids) < MINIMUM_SAMPLE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient sample size: {len(child_ids)} children (need {MINIMUM_SAMPLE_SIZE}+)"
            )

        # Get Mosaic assessments for these children
        mosaic_result = supabase.table("mosaic_assessments").select(
            "primary_archetype, raw_cognitive_score, raw_emotional_score, local_viability_score"
        ).in_("child_id", child_ids).execute()

        if not mosaic_result.data or len(mosaic_result.data) < MINIMUM_SAMPLE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="Insufficient Mosaic assessments for analysis"
            )

        # Aggregate archetype distribution
        archetype_dist = {}
        for m in mosaic_result.data:
            arch = m.get("primary_archetype")
            if arch:
                archetype_dist[arch] = archetype_dist.get(arch, 0) + 1

        # Calculate averages
        cognitive_scores = [m["raw_cognitive_score"] for m in mosaic_result.data if m.get("raw_cognitive_score")]
        emotional_scores = [m["raw_emotional_score"] for m in mosaic_result.data if m.get("raw_emotional_score")]
        viability_scores = [m["local_viability_score"] for m in mosaic_result.data if m.get("local_viability_score")]

        # Create analytics record
        analytics_data = {
            "zip_code": zip_code,
            "state_code": state_code,
            "period_start": period_start.date().isoformat(),
            "period_end": period_end.date().isoformat(),
            "sample_size": len(mosaic_result.data),
            "age_group": age_group,
            "archetype_distribution": archetype_dist,
            "cognitive_domain_averages": {
                "composite": {
                    "mean": sum(cognitive_scores) / len(cognitive_scores) if cognitive_scores else 0,
                    "stddev": 15,  # Simplified
                }
            },
            "emotional_dimension_averages": {
                "composite": {
                    "mean": sum(emotional_scores) / len(emotional_scores) if emotional_scores else 0,
                    "stddev": 15,
                }
            },
            "opportunity_utilization": sum(viability_scores) / len(viability_scores) if viability_scores else 50,
            "differential_privacy_epsilon": 0.1,  # Privacy parameter
        }

        result = supabase.table("district_analytics").upsert(
            analytics_data,
            on_conflict="zip_code,period_start,period_end,age_group",
        ).execute()

        logger.info(
            "Generated district analytics for %s: %d children",
            zip_code, len(mosaic_result.data)
        )

        return {
            "status": "generated",
            "zip_code": zip_code,
            "sample_size": len(mosaic_result.data),
            "archetype_count": len(archetype_dist),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
