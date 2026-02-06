"""Mosaic scoring service - combines cognitive, emotional, and context data."""
from datetime import datetime
from typing import Any

from src.models.mosaic import (
    ArchetypeType,
    MosaicAssessmentResponse,
    GenerateMosaicResponse,
    GapAnalysisResponse,
)
from src.services.supabase_client import get_supabase_client
from src.services.adaptive_testing import AdaptiveTestingService
from src.services.behavioral_scoring import BehavioralScoringService
from src.services.geopolitical_service import GeopoliticalService
from src.services.archetype_service import ArchetypeService
from src.services.ikigai_service import IkigaiService
from src.logging_config import get_logger

logger = get_logger(__name__)

# Mosaic scoring weights
COGNITIVE_WEIGHT = 0.4
EMOTIONAL_WEIGHT = 0.6

# Adversity multiplier bounds
MIN_ADVERSITY_MULTIPLIER = 1.0
MAX_ADVERSITY_MULTIPLIER = 1.5


class MosaicScoringService:
    """Service for generating comprehensive Mosaic assessments."""

    def __init__(self):
        self.supabase = get_supabase_client()
        self.adaptive_testing = AdaptiveTestingService()
        self.behavioral_scoring = BehavioralScoringService()
        self.geopolitical = GeopoliticalService()
        self.archetype_service = ArchetypeService()
        self.ikigai_service = IkigaiService()

    async def generate_mosaic(
        self,
        child_id: str,
        include_context: bool = True,
    ) -> GenerateMosaicResponse:
        """Generate a complete Mosaic assessment for a child.

        The Mosaic Protocol combines:
        1. Cognitive assessment (IQ-like) - 40% weight
        2. Emotional/behavioral assessment (EQ-like) - 60% weight
        3. Socio-economic context (adversity multiplier) - boosts potential

        The formula:
        raw_score = (cognitive * 0.4) + (emotional * 0.6)
        true_potential = raw_score * adversity_multiplier

        Where adversity_multiplier rewards resilience in challenging environments.
        """
        # Get cognitive profile
        cognitive_profile = await self.adaptive_testing.get_cognitive_profile(child_id)
        cognitive_dict = self._profile_to_dict(cognitive_profile) if cognitive_profile else None

        # Get emotional profile
        emotional_profile = await self.behavioral_scoring.get_emotional_profile(child_id)
        emotional_dict = self._profile_to_dict(emotional_profile) if emotional_profile else None

        # Get context multiplier
        context_multiplier = None
        opportunity_index = None
        local_industries = []
        local_grants = []

        if include_context:
            context_multiplier = await self.geopolitical.get_context_multiplier(child_id)
            family_context = await self.geopolitical.get_family_context(child_id)

            if family_context and family_context.zip_code:
                opp_index = await self.geopolitical.get_opportunity_index(family_context.zip_code)
                if opp_index:
                    opportunity_index = opp_index
                    local_industries = opp_index.key_industries
                    local_grants = opp_index.local_grants or []

        # Calculate raw scores
        raw_cognitive = self._calculate_raw_cognitive(cognitive_dict)
        raw_emotional = self._calculate_raw_emotional(emotional_dict)

        # Combined raw score
        if raw_cognitive is not None and raw_emotional is not None:
            raw_combined = (raw_cognitive * COGNITIVE_WEIGHT) + (raw_emotional * EMOTIONAL_WEIGHT)
        elif raw_cognitive is not None:
            raw_combined = raw_cognitive
        elif raw_emotional is not None:
            raw_combined = raw_emotional
        else:
            raw_combined = None

        # Get adversity multiplier
        adversity_multiplier = MIN_ADVERSITY_MULTIPLIER
        if context_multiplier:
            adversity_multiplier = context_multiplier.adversity_multiplier

        # Calculate true potential
        true_potential = None
        true_potential_percentile = None
        if raw_combined is not None:
            true_potential = raw_combined * adversity_multiplier
            true_potential_percentile = self._score_to_percentile(true_potential)

        # Calculate archetype matches
        cognitive_scores = {}
        emotional_scores = {}

        if cognitive_dict:
            for domain in ["math", "logic", "verbal", "spatial", "memory"]:
                score = cognitive_dict.get(f"{domain}_score")
                if score is not None:
                    cognitive_scores[domain] = score

        if emotional_dict:
            for dim in ["empathy", "risk_tolerance", "delayed_gratification", "cooperation", "failure_resilience", "emotional_regulation"]:
                score = emotional_dict.get(f"{dim}_score")
                if score is not None:
                    emotional_scores[dim] = score

        archetype_matches = await self.archetype_service.calculate_archetype_matches(
            cognitive_scores,
            emotional_scores,
            local_industries,
        )

        # Determine primary and secondary archetypes
        primary_archetype = archetype_matches[0].archetype_type if archetype_matches else None
        secondary_archetype = archetype_matches[1].archetype_type if len(archetype_matches) > 1 else None

        # Calculate local viability score
        local_viability_score = self._calculate_local_viability(
            archetype_matches,
            local_industries,
        )

        # Calculate confidence level based on data completeness
        confidence_level = self._calculate_confidence(
            cognitive_dict,
            emotional_dict,
            context_multiplier,
        )

        # Get next version number
        version = await self._get_next_version(child_id)

        # Save Mosaic assessment
        mosaic_data = {
            "child_id": child_id,
            "cognitive_profile_id": cognitive_profile.id if cognitive_profile else None,
            "emotional_profile_id": emotional_profile.id if emotional_profile else None,
            "context_multiplier_id": context_multiplier.id if context_multiplier else None,
            "raw_cognitive_score": raw_cognitive,
            "raw_emotional_score": raw_emotional,
            "raw_combined_score": raw_combined,
            "adversity_multiplier": adversity_multiplier,
            "true_potential_score": true_potential,
            "true_potential_percentile": true_potential_percentile,
            "confidence_level": confidence_level,
            "primary_archetype": primary_archetype.value if primary_archetype else None,
            "secondary_archetype": secondary_archetype.value if secondary_archetype else None,
            "local_viability_score": local_viability_score,
            "calculated_at": datetime.utcnow().isoformat(),
            "version": version,
        }

        result = self.supabase.table("mosaic_assessments").insert(mosaic_data).execute()
        mosaic_assessment = result.data[0]

        # Save archetype matches
        for match in archetype_matches:
            self.supabase.table("archetype_matches").insert({
                "mosaic_assessment_id": mosaic_assessment["id"],
                "archetype_type": match.archetype_type.value,
                "match_score": match.match_score,
                "match_rank": match.match_rank,
                "trait_breakdown": match.trait_breakdown,
                "local_viability": match.local_viability,
            }).execute()

        # Generate Ikigai chart
        ikigai_chart = await self.ikigai_service.generate_ikigai_chart(
            mosaic_assessment["id"],
            cognitive_dict,
            emotional_dict,
            [{"archetype_type": m.archetype_type.value, "match_score": m.match_score} for m in archetype_matches],
            local_industries,
            local_grants,
        )

        # Generate gap analysis
        gap_analysis = await self._generate_gap_analysis(
            mosaic_assessment["id"],
            cognitive_dict,
            emotional_dict,
            primary_archetype,
            local_grants,
        )

        logger.info(
            "Generated Mosaic for child %s: true_potential=%.1f, archetype=%s, confidence=%.2f",
            child_id,
            true_potential or 0,
            primary_archetype.value if primary_archetype else "unknown",
            confidence_level,
        )

        return GenerateMosaicResponse(
            mosaic_assessment=self._map_mosaic_response(mosaic_assessment),
            archetype_matches=[
                {
                    "archetype_type": m.archetype_type,
                    "match_score": m.match_score,
                    "match_rank": m.match_rank,
                    "trait_breakdown": m.trait_breakdown,
                    "local_viability": m.local_viability,
                }
                for m in archetype_matches
            ],
            ikigai_chart=ikigai_chart,
            gap_analysis=gap_analysis,
            cognitive_profile=cognitive_profile,
            emotional_profile=emotional_profile,
        )

    def _profile_to_dict(self, profile: Any) -> dict | None:
        """Convert profile object to dict."""
        if profile is None:
            return None
        return profile.model_dump() if hasattr(profile, "model_dump") else dict(profile)

    def _calculate_raw_cognitive(self, cognitive: dict | None) -> float | None:
        """Calculate raw cognitive score (0-100 scale)."""
        if not cognitive:
            return None

        # Use composite percentile if available
        if cognitive.get("composite_percentile") is not None:
            return cognitive["composite_percentile"]

        # Otherwise, average available domain percentiles
        domains = ["math", "logic", "verbal", "spatial", "memory"]
        scores = [cognitive.get(f"{d}_percentile") for d in domains if cognitive.get(f"{d}_percentile") is not None]

        if scores:
            return sum(scores) / len(scores)

        return None

    def _calculate_raw_emotional(self, emotional: dict | None) -> float | None:
        """Calculate raw emotional score (0-100 scale)."""
        if not emotional:
            return None

        # Use composite if available
        if emotional.get("composite_eq_score") is not None:
            return emotional["composite_eq_score"]

        # Otherwise, average available dimension scores
        dimensions = [
            "empathy", "risk_tolerance", "delayed_gratification",
            "cooperation", "failure_resilience", "emotional_regulation"
        ]
        scores = [emotional.get(f"{d}_score") for d in dimensions if emotional.get(f"{d}_score") is not None]

        if scores:
            return sum(scores) / len(scores)

        return None

    def _score_to_percentile(self, score: float) -> int:
        """Convert score to percentile (assuming normal distribution)."""
        # Score is already on 0-100+ scale after multiplier
        # Clamp and return as percentile
        return min(99, max(1, int(score)))

    def _calculate_local_viability(
        self,
        archetype_matches: list,
        local_industries: list[str],
    ) -> float:
        """Calculate how well the child's archetypes match local economy."""
        if not archetype_matches or not local_industries:
            return 50.0  # Neutral

        # Weight by match score and local viability
        total_weight = 0
        viable_weight = 0

        for i, match in enumerate(archetype_matches[:3]):  # Top 3
            weight = match.match_score * (1 - i * 0.2)  # Decreasing weight for lower ranks
            total_weight += weight
            if match.local_viability:
                viable_weight += weight

        if total_weight > 0:
            return (viable_weight / total_weight) * 100

        return 50.0

    def _calculate_confidence(
        self,
        cognitive: dict | None,
        emotional: dict | None,
        context: Any,
    ) -> float:
        """Calculate confidence level based on data completeness."""
        components = []

        # Cognitive completeness
        if cognitive:
            domains = ["math", "logic", "verbal", "spatial", "memory"]
            cognitive_complete = sum(1 for d in domains if cognitive.get(f"{d}_score") is not None) / len(domains)
            components.append(cognitive_complete)

        # Emotional completeness
        if emotional:
            dimensions = ["empathy", "risk_tolerance", "delayed_gratification", "cooperation", "failure_resilience", "emotional_regulation"]
            emotional_complete = sum(1 for d in dimensions if emotional.get(f"{d}_score") is not None) / len(dimensions)
            components.append(emotional_complete)

        # Context completeness
        if context:
            components.append(context.data_completeness)

        if components:
            return sum(components) / len(components)

        return 0.1  # Minimum confidence

    async def _get_next_version(self, child_id: str) -> int:
        """Get next version number for Mosaic assessment."""
        result = self.supabase.table("mosaic_assessments").select("version").eq(
            "child_id", child_id
        ).order("version", desc=True).limit(1).execute()

        if result.data:
            return result.data[0]["version"] + 1
        return 1

    async def _generate_gap_analysis(
        self,
        mosaic_assessment_id: str,
        cognitive: dict | None,
        emotional: dict | None,
        primary_archetype: ArchetypeType | None,
        local_grants: list[dict],
    ) -> list[GapAnalysisResponse]:
        """Generate gap analysis with matched resources."""
        gaps = []

        # Identify cognitive gaps
        if cognitive:
            growth_areas = cognitive.get("growth_areas", [])
            for area in growth_areas[:2]:  # Top 2 growth areas
                gap = {
                    "mosaic_assessment_id": mosaic_assessment_id,
                    "gap_type": "skill",
                    "gap_name": f"{area.title()} Skills",
                    "gap_description": f"Opportunities for growth in {area} reasoning and problem-solving",
                    "current_level": cognitive.get(f"{area}_percentile", 30),
                    "target_level": 70,
                    "priority": "medium",
                    "related_archetype": primary_archetype.value if primary_archetype else None,
                    "matched_resources": self._get_resources_for_gap(area),
                    "local_programs": self._match_local_programs(area, local_grants),
                    "estimated_effort": "months",
                }
                gaps.append(gap)

        # Identify emotional gaps
        if emotional:
            dimensions = ["empathy", "delayed_gratification", "failure_resilience", "cooperation"]
            for dim in dimensions:
                score = emotional.get(f"{dim}_score")
                if score is not None and score < 50:
                    gap = {
                        "mosaic_assessment_id": mosaic_assessment_id,
                        "gap_type": "skill",
                        "gap_name": dim.replace("_", " ").title(),
                        "gap_description": f"Developing {dim.replace('_', ' ')} through practice and guidance",
                        "current_level": score,
                        "target_level": 60,
                        "priority": "high" if score < 30 else "medium",
                        "related_archetype": primary_archetype.value if primary_archetype else None,
                        "matched_resources": self._get_resources_for_gap(dim),
                        "local_programs": self._match_local_programs(dim, local_grants),
                        "estimated_effort": "months",
                    }
                    gaps.append(gap)

        # Save to database
        saved_gaps = []
        for gap in gaps[:5]:  # Top 5 gaps
            result = self.supabase.table("mosaic_gap_analysis").insert(gap).execute()
            saved_gaps.append(self._map_gap_response(result.data[0]))

        return saved_gaps

    def _get_resources_for_gap(self, gap_area: str) -> list[dict]:
        """Get resources for a specific gap area."""
        resources = {
            "math": [
                {"resource_type": "app", "name": "Khan Academy Kids", "description": "Free math games and lessons", "cost": "free", "is_local": False},
                {"resource_type": "activity", "name": "Counting games", "description": "Daily counting and number activities", "cost": "free", "is_local": True},
            ],
            "logic": [
                {"resource_type": "app", "name": "ThinkFun Games", "description": "Logic puzzle games", "cost": "low", "is_local": False},
                {"resource_type": "activity", "name": "Pattern blocks", "description": "Physical pattern building toys", "cost": "low", "is_local": True},
            ],
            "verbal": [
                {"resource_type": "activity", "name": "Story time", "description": "Daily reading and discussion", "cost": "free", "is_local": True},
                {"resource_type": "app", "name": "Endless Alphabet", "description": "Vocabulary building app", "cost": "low", "is_local": False},
            ],
            "spatial": [
                {"resource_type": "activity", "name": "Building blocks", "description": "LEGO, blocks, construction toys", "cost": "low", "is_local": True},
                {"resource_type": "app", "name": "Toca Builders", "description": "Digital building game", "cost": "low", "is_local": False},
            ],
            "memory": [
                {"resource_type": "activity", "name": "Memory games", "description": "Card matching and sequence games", "cost": "free", "is_local": True},
                {"resource_type": "activity", "name": "Simon Says", "description": "Following sequences and instructions", "cost": "free", "is_local": True},
            ],
            "empathy": [
                {"resource_type": "book", "name": "Social-emotional books", "description": "Books about feelings and perspective-taking", "cost": "low", "is_local": True},
                {"resource_type": "activity", "name": "Role-playing", "description": "Acting out different scenarios", "cost": "free", "is_local": True},
            ],
            "delayed_gratification": [
                {"resource_type": "activity", "name": "Waiting games", "description": "Practice patience with structured activities", "cost": "free", "is_local": True},
                {"resource_type": "activity", "name": "Garden project", "description": "Growing plants teaches patience", "cost": "low", "is_local": True},
            ],
            "failure_resilience": [
                {"resource_type": "activity", "name": "Challenge puzzles", "description": "Age-appropriate challenging tasks", "cost": "low", "is_local": True},
                {"resource_type": "book", "name": "Growth mindset books", "description": "Books about learning from mistakes", "cost": "low", "is_local": True},
            ],
            "cooperation": [
                {"resource_type": "activity", "name": "Team games", "description": "Cooperative board games and activities", "cost": "low", "is_local": True},
                {"resource_type": "program", "name": "Group classes", "description": "Sports, art, or music classes", "cost": "medium", "is_local": True},
            ],
        }

        return resources.get(gap_area, [])

    def _match_local_programs(
        self,
        gap_area: str,
        local_grants: list[dict],
    ) -> list[dict]:
        """Match local programs and grants to gap area."""
        programs = []

        # Add any relevant local grants
        for grant in local_grants:
            # Simple keyword matching
            grant_lower = grant.get("description", "").lower()
            if gap_area.lower() in grant_lower or "children" in grant_lower or "early" in grant_lower:
                programs.append({
                    "name": grant["name"],
                    "organization": "Local Grant",
                    "description": grant.get("description", ""),
                    "eligibility": grant.get("eligibility"),
                    "url": grant.get("url"),
                })

        return programs[:3]

    async def get_mosaic(self, child_id: str, version: int | None = None) -> MosaicAssessmentResponse | None:
        """Get a Mosaic assessment for a child."""
        query = self.supabase.table("mosaic_assessments").select("*").eq("child_id", child_id)

        if version is not None:
            query = query.eq("version", version)
        else:
            query = query.order("version", desc=True).limit(1)

        result = query.execute()

        if not result.data:
            return None

        return self._map_mosaic_response(result.data[0])

    async def get_mosaic_history(self, child_id: str) -> list[MosaicAssessmentResponse]:
        """Get all Mosaic assessments for a child."""
        result = self.supabase.table("mosaic_assessments").select("*").eq(
            "child_id", child_id
        ).order("version", desc=True).execute()

        return [self._map_mosaic_response(m) for m in result.data]

    def _map_mosaic_response(self, data: dict) -> MosaicAssessmentResponse:
        """Map database row to Mosaic response model."""
        return MosaicAssessmentResponse(
            id=data["id"],
            child_id=data["child_id"],
            raw_cognitive_score=data.get("raw_cognitive_score"),
            raw_emotional_score=data.get("raw_emotional_score"),
            raw_combined_score=data.get("raw_combined_score"),
            adversity_multiplier=data["adversity_multiplier"],
            true_potential_score=data.get("true_potential_score"),
            true_potential_percentile=data.get("true_potential_percentile"),
            confidence_level=data.get("confidence_level"),
            primary_archetype=ArchetypeType(data["primary_archetype"]) if data.get("primary_archetype") else None,
            secondary_archetype=ArchetypeType(data["secondary_archetype"]) if data.get("secondary_archetype") else None,
            local_viability_score=data.get("local_viability_score"),
            calculated_at=datetime.fromisoformat(data["calculated_at"]),
            version=data["version"],
        )

    def _map_gap_response(self, data: dict) -> GapAnalysisResponse:
        """Map database row to gap analysis response model."""
        return GapAnalysisResponse(
            id=data["id"],
            gap_type=data["gap_type"],
            gap_name=data["gap_name"],
            gap_description=data.get("gap_description"),
            current_level=data.get("current_level"),
            target_level=data.get("target_level"),
            priority=data["priority"],
            related_archetype=ArchetypeType(data["related_archetype"]) if data.get("related_archetype") else None,
            matched_resources=data.get("matched_resources"),
            local_programs=data.get("local_programs"),
            estimated_effort=data.get("estimated_effort"),
        )
