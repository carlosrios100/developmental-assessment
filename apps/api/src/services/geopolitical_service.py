"""Geopolitical service for opportunity indices and context data."""
from datetime import datetime, timedelta
from typing import Any

from src.models.mosaic import (
    ConsentCategory,
    ConsentStatus,
    OpportunityIndexResponse,
    FamilyContextResponse,
    ConsentResponse,
    ContextMultiplierResponse,
)
from src.services.supabase_client import get_supabase_client
from src.logging_config import get_logger

logger = get_logger(__name__)

# Consent text templates
CONSENT_TEXTS = {
    ConsentCategory.SOCIOECONOMIC: """We would like to collect information about your family's socio-economic context to better understand and support your child's development. This data helps us:

1. Recognize resilience and potential in children facing challenges
2. Match recommendations to locally available resources
3. Identify community-level needs (only with aggregated, anonymized data)

Your data is encrypted and never shared in identifiable form. You can withdraw consent at any time.""",

    ConsentCategory.LOCATION: """We would like to use your location (zip code) to:

1. Find local programs, grants, and resources for your child
2. Match career pathways to local job market opportunities
3. Contribute to anonymized community insights (with separate consent)

We never track precise location. Only zip code is stored.""",

    ConsentCategory.FAMILY_CONTEXT: """We would like to collect optional family context information to:

1. Adjust expectations based on environmental factors
2. Recognize achievements in context (the "true potential" score)
3. Provide culturally and economically relevant recommendations

All fields are optional. Data is encrypted and you can delete it anytime.""",

    ConsentCategory.RESEARCH_AGGREGATE: """We would like to include your child's anonymized data in aggregate research to:

1. Improve our assessment algorithms
2. Identify developmental patterns across populations
3. Publish findings that help all children

No individual data is ever identifiable. Minimum sample sizes (50+) are required for any reporting.""",

    ConsentCategory.DISTRICT_ANALYTICS: """We would like to include your child's anonymized data in district-level analytics to:

1. Help city planners understand community needs
2. Inform resource allocation for early childhood programs
3. Identify gaps in local services

Data is anonymized using differential privacy techniques. No individual child can ever be identified.""",
}

# Income bracket to socio-economic status mapping (0-1 scale)
INCOME_SES_MAP = {
    "under_25k": 0.1,
    "25k_50k": 0.25,
    "50k_75k": 0.4,
    "75k_100k": 0.55,
    "100k_150k": 0.7,
    "150k_200k": 0.85,
    "over_200k": 0.95,
    "prefer_not_say": 0.5,  # Neutral default
}

# Education level weights
EDUCATION_WEIGHTS = {
    "less_than_high_school": 0.1,
    "high_school": 0.25,
    "some_college": 0.4,
    "associates": 0.5,
    "bachelors": 0.7,
    "masters": 0.85,
    "doctorate": 0.95,
}


class GeopoliticalService:
    """Service for managing geopolitical context and opportunity data."""

    def __init__(self):
        self.supabase = get_supabase_client()

    async def get_opportunity_index(self, zip_code: str) -> OpportunityIndexResponse:
        """Get opportunity index for a zip code.

        Returns actual data if available, otherwise a national-average estimate.
        """
        result = self.supabase.table("opportunity_indices").select("*").eq(
            "zip_code", zip_code
        ).execute()

        if not result.data:
            logger.info("No opportunity data for zip %s, returning national estimate", zip_code)
            return self._national_estimate(zip_code)

        data = result.data[0]

        # Check if data is expired
        expires_at = datetime.fromisoformat(data["expires_at"].replace("Z", "+00:00"))
        if expires_at < datetime.now(expires_at.tzinfo):
            # Data is stale, but still return it (could trigger async refresh)
            logger.warning("Opportunity index for %s is expired", zip_code)

        return self._map_opportunity_response(data)

    async def search_opportunity_indices(
        self,
        state_code: str | None = None,
        city: str | None = None,
        min_opportunity: float | None = None,
    ) -> list[OpportunityIndexResponse]:
        """Search for opportunity indices matching criteria."""
        query = self.supabase.table("opportunity_indices").select("*")

        if state_code:
            query = query.eq("state_code", state_code)
        if city:
            query = query.ilike("city", f"%{city}%")
        if min_opportunity is not None:
            query = query.gte("opportunity_index", min_opportunity)

        result = query.order("opportunity_index", desc=True).limit(50).execute()

        return [self._map_opportunity_response(d) for d in result.data]

    async def save_family_context(
        self,
        child_id: str,
        context: dict[str, Any],
    ) -> FamilyContextResponse:
        """Save or update family context for a child."""
        # Check for existing context
        existing_result = self.supabase.table("family_contexts").select("id").eq(
            "child_id", child_id
        ).execute()

        context_data = {
            "child_id": child_id,
            **context,
            "consent_version": 1,
        }

        if existing_result.data:
            # Update existing
            result = self.supabase.table("family_contexts").update(context_data).eq(
                "child_id", child_id
            ).execute()
        else:
            # Insert new
            result = self.supabase.table("family_contexts").insert(context_data).execute()

        data = result.data[0]

        # Recalculate context multiplier
        await self._recalculate_multiplier(child_id)

        logger.info("Saved family context for child %s", child_id)

        return self._map_family_context_response(data)

    async def get_family_context(self, child_id: str) -> FamilyContextResponse | None:
        """Get family context for a child."""
        result = self.supabase.table("family_contexts").select("*").eq(
            "child_id", child_id
        ).execute()

        if not result.data:
            return None

        return self._map_family_context_response(result.data[0])

    async def delete_family_context(self, child_id: str) -> bool:
        """Delete family context for a child."""
        self.supabase.table("family_contexts").delete().eq(
            "child_id", child_id
        ).execute()

        # Remove context multiplier
        self.supabase.table("context_multipliers").delete().eq(
            "child_id", child_id
        ).execute()

        logger.info("Deleted family context for child %s", child_id)
        return True

    async def grant_consent(
        self,
        user_id: str,
        child_id: str,
        category: ConsentCategory,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> ConsentResponse:
        """Grant consent for a data category."""
        consent_text = CONSENT_TEXTS[category]

        consent_data: dict[str, Any] = {
            "user_id": user_id,
            "child_id": child_id,
            "category": category.value,
            "status": ConsentStatus.GRANTED.value,
            "granted_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(days=365)).isoformat(),
            "consent_text": consent_text,
            "consent_version": 1,
        }

        if ip_address:
            consent_data["ip_address"] = ip_address
        if user_agent:
            consent_data["user_agent"] = user_agent

        # Upsert consent
        result = self.supabase.table("context_consents").upsert(
            consent_data,
            on_conflict="user_id,child_id,category",
        ).execute()

        logger.info("Consent granted for user %s, child %s, category %s", user_id, child_id, category.value)

        return self._map_consent_response(result.data[0])

    async def revoke_consent(
        self,
        user_id: str,
        child_id: str,
        category: ConsentCategory,
    ) -> ConsentResponse:
        """Revoke consent for a data category."""
        result = self.supabase.table("context_consents").update({
            "status": ConsentStatus.REVOKED.value,
            "revoked_at": datetime.utcnow().isoformat(),
        }).eq("user_id", user_id).eq("child_id", child_id).eq("category", category.value).execute()

        if not result.data:
            raise ValueError("Consent not found")

        logger.info("Consent revoked for user %s, child %s, category %s", user_id, child_id, category.value)

        return self._map_consent_response(result.data[0])

    async def get_consents(self, user_id: str, child_id: str) -> list[ConsentResponse]:
        """Get all consents for a user and child."""
        result = self.supabase.table("context_consents").select("*").eq(
            "user_id", user_id
        ).eq("child_id", child_id).execute()

        return [self._map_consent_response(d) for d in result.data]

    async def check_consent(
        self,
        user_id: str,
        child_id: str,
        category: ConsentCategory,
    ) -> bool:
        """Check if consent is granted for a category."""
        result = self.supabase.table("context_consents").select("status, expires_at").eq(
            "user_id", user_id
        ).eq("child_id", child_id).eq("category", category.value).execute()

        if not result.data:
            return False

        consent = result.data[0]
        if consent["status"] != ConsentStatus.GRANTED.value:
            return False

        # Check expiration
        if consent.get("expires_at"):
            expires_at = datetime.fromisoformat(consent["expires_at"].replace("Z", "+00:00"))
            if expires_at < datetime.now(expires_at.tzinfo):
                return False

        return True

    async def get_context_multiplier(self, child_id: str) -> ContextMultiplierResponse | None:
        """Get context multiplier for a child."""
        result = self.supabase.table("context_multipliers").select("*").eq(
            "child_id", child_id
        ).execute()

        if not result.data:
            return None

        return self._map_multiplier_response(result.data[0])

    async def _recalculate_multiplier(self, child_id: str):
        """Recalculate context multiplier based on family context and opportunity index."""
        # Get family context
        context_result = self.supabase.table("family_contexts").select("*").eq(
            "child_id", child_id
        ).execute()

        if not context_result.data:
            return

        context = context_result.data[0]

        # Calculate socio-economic status (0-1)
        ses_components = []
        component_weights = {}

        if context.get("household_income_bracket"):
            income_ses = INCOME_SES_MAP.get(context["household_income_bracket"], 0.5)
            ses_components.append(income_ses)
            component_weights["income"] = income_ses

        if context.get("parent_education_level"):
            education_ses = EDUCATION_WEIGHTS.get(context["parent_education_level"], 0.5)
            ses_components.append(education_ses)
            component_weights["education"] = education_ses

        # Other factors (each adds/subtracts from SES)
        adjustment = 0
        if context.get("receives_assistance"):
            adjustment -= 0.1
            component_weights["assistance"] = -0.1

        if context.get("single_parent"):
            adjustment -= 0.05
            component_weights["single_parent"] = -0.05

        if context.get("books_in_home"):
            books = context["books_in_home"]
            book_factor = min(0.1, books / 500)  # Max 0.1 bonus for 50+ books
            adjustment += book_factor
            component_weights["books"] = book_factor

        # Calculate base SES
        if ses_components:
            socio_econ_status = sum(ses_components) / len(ses_components) + adjustment
        else:
            socio_econ_status = 0.5 + adjustment  # Default to middle

        socio_econ_status = max(0, min(1, socio_econ_status))

        # Get opportunity index
        opportunity_index = None
        if context.get("zip_code"):
            opp_result = self.supabase.table("opportunity_indices").select("opportunity_index").eq(
                "zip_code", context["zip_code"]
            ).execute()

            if opp_result.data:
                opportunity_index = opp_result.data[0]["opportunity_index"]

        # Calculate gap score and adversity multiplier
        if opportunity_index is not None:
            # Higher gap = more adversity (living in high-opportunity area but low SES)
            gap_score = opportunity_index - socio_econ_status

            # Adversity multiplier: 1.0 to 1.5
            # Only positive gaps (disadvantage) contribute
            adversity_multiplier = 1.0 + min(max(gap_score, 0), 0.5)
        else:
            gap_score = None
            adversity_multiplier = 1.0

        # Calculate data completeness
        total_fields = 10  # Number of optional context fields
        filled_fields = sum(1 for k in [
            "zip_code", "household_size", "parent_education_level",
            "household_income_bracket", "single_parent", "languages_spoken",
            "receives_assistance", "childcare_type", "screen_time_hours_daily",
            "books_in_home"
        ] if context.get(k) is not None)
        data_completeness = filled_fields / total_fields

        # Upsert multiplier
        multiplier_data = {
            "child_id": child_id,
            "opportunity_index": opportunity_index,
            "socio_econ_status": socio_econ_status,
            "gap_score": gap_score,
            "adversity_multiplier": adversity_multiplier,
            "calculation_details": {
                "components": component_weights,
                "weights": {"income": 0.5, "education": 0.5},
                "formula": "adversity = 1.0 + min(max(opportunity - ses, 0), 0.5)",
            },
            "data_completeness": data_completeness,
            "calculated_at": datetime.utcnow().isoformat(),
        }

        self.supabase.table("context_multipliers").upsert(
            multiplier_data,
            on_conflict="child_id",
        ).execute()

        logger.info(
            "Recalculated multiplier for child %s: SES=%.2f, opportunity=%.2f, multiplier=%.2f",
            child_id, socio_econ_status, opportunity_index or 0, adversity_multiplier
        )

    @staticmethod
    def _national_estimate(zip_code: str) -> OpportunityIndexResponse:
        """Return a national-average fallback for an unknown zip code."""
        return OpportunityIndexResponse(
            id="estimated",
            zip_code=zip_code,
            state_code="US",
            city=None,
            opportunity_index=0.50,
            key_industries=["Healthcare", "Education", "Retail", "Technology"],
            local_grants=None,
            risk_factors=None,
            growth_trends=None,
            school_quality_score=None,
            internet_access_score=None,
            food_access_score=None,
            median_income=None,
            is_estimated=True,
        )

    def _map_opportunity_response(self, data: dict) -> OpportunityIndexResponse:
        """Map database row to opportunity response model."""
        return OpportunityIndexResponse(
            id=data["id"],
            zip_code=data["zip_code"],
            state_code=data["state_code"],
            city=data.get("city"),
            opportunity_index=data["opportunity_index"],
            key_industries=data["key_industries"],
            local_grants=data.get("local_grants"),
            risk_factors=data.get("risk_factors"),
            growth_trends=data.get("growth_trends"),
            school_quality_score=data.get("school_quality_score"),
            internet_access_score=data.get("internet_access_score"),
            food_access_score=data.get("food_access_score"),
            median_income=data.get("median_income"),
        )

    def _map_family_context_response(self, data: dict) -> FamilyContextResponse:
        """Map database row to family context response model."""
        return FamilyContextResponse(
            id=data["id"],
            child_id=data["child_id"],
            zip_code=data.get("zip_code"),
            household_size=data.get("household_size"),
            parent_education_level=data.get("parent_education_level"),
            household_income_bracket=data.get("household_income_bracket"),
            single_parent=data.get("single_parent"),
            languages_spoken=data.get("languages_spoken"),
            primary_language=data.get("primary_language"),
            receives_assistance=data.get("receives_assistance"),
            childcare_type=data.get("childcare_type"),
            screen_time_hours_daily=data.get("screen_time_hours_daily"),
            outdoor_time_hours_daily=data.get("outdoor_time_hours_daily"),
            books_in_home=data.get("books_in_home"),
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
        )

    def _map_consent_response(self, data: dict) -> ConsentResponse:
        """Map database row to consent response model."""
        return ConsentResponse(
            id=data["id"],
            user_id=data["user_id"],
            child_id=data["child_id"],
            category=ConsentCategory(data["category"]),
            status=ConsentStatus(data["status"]),
            granted_at=datetime.fromisoformat(data["granted_at"]) if data.get("granted_at") else None,
            expires_at=datetime.fromisoformat(data["expires_at"]) if data.get("expires_at") else None,
        )

    def _map_multiplier_response(self, data: dict) -> ContextMultiplierResponse:
        """Map database row to multiplier response model."""
        return ContextMultiplierResponse(
            id=data["id"],
            child_id=data["child_id"],
            opportunity_index=data.get("opportunity_index"),
            socio_econ_status=data.get("socio_econ_status"),
            gap_score=data.get("gap_score"),
            adversity_multiplier=data["adversity_multiplier"],
            calculation_details=data.get("calculation_details"),
            data_completeness=data["data_completeness"],
            calculated_at=datetime.fromisoformat(data["calculated_at"]),
        )
