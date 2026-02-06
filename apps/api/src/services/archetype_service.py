"""Archetype service for matching children to personality archetypes."""
from datetime import datetime
from typing import Any

from src.models.mosaic import (
    ArchetypeType,
    CognitiveDomain,
    EmotionalDimension,
    ArchetypeResponse,
    ArchetypeMatchResponse,
)
from src.services.supabase_client import get_supabase_client
from src.logging_config import get_logger

logger = get_logger(__name__)

# Mapping of cognitive domains and emotional dimensions to archetype weights
# Each archetype has trait weights defined in the database
# This service calculates match scores based on child profiles


class ArchetypeService:
    """Service for archetype matching and career pathway recommendations."""

    def __init__(self):
        self.supabase = get_supabase_client()
        self._archetype_cache: dict[str, ArchetypeResponse] | None = None

    async def get_all_archetypes(self) -> list[ArchetypeResponse]:
        """Get all active archetypes."""
        result = self.supabase.table("archetypes").select("*").eq("active", True).execute()
        return [self._map_archetype_response(a) for a in result.data]

    async def get_archetype(self, archetype_type: ArchetypeType) -> ArchetypeResponse | None:
        """Get a specific archetype by type."""
        result = self.supabase.table("archetypes").select("*").eq(
            "type", archetype_type.value
        ).execute()

        if not result.data:
            return None

        return self._map_archetype_response(result.data[0])

    async def calculate_archetype_matches(
        self,
        cognitive_scores: dict[str, float],
        emotional_scores: dict[str, float],
        local_industries: list[str] | None = None,
    ) -> list[ArchetypeMatchResponse]:
        """Calculate archetype match scores based on cognitive and emotional profiles.

        Args:
            cognitive_scores: Dict of cognitive domain -> score (theta, -3 to +3)
            emotional_scores: Dict of emotional dimension -> score (0-100)
            local_industries: List of industries available locally

        Returns:
            List of archetype matches sorted by match score (descending)
        """
        # Normalize scores to 0-1 scale
        normalized_cognitive = {
            k: (v + 3) / 6  # theta -3 to +3 -> 0 to 1
            for k, v in cognitive_scores.items()
        }
        normalized_emotional = {
            k: v / 100  # 0-100 -> 0-1
            for k, v in emotional_scores.items()
        }

        # Combine into single trait dict
        all_traits = {**normalized_cognitive, **normalized_emotional}

        # Get all archetypes
        archetypes = await self.get_all_archetypes()

        matches = []
        for archetype in archetypes:
            # Calculate match score using weighted sum
            match_score = 0.0
            trait_breakdown = {}
            total_weight = 0.0

            for trait, weight in archetype.trait_weights.items():
                if trait in all_traits:
                    trait_score = all_traits[trait] * weight
                    match_score += trait_score
                    trait_breakdown[trait] = round(trait_score * 100, 1)
                    total_weight += weight

            # Normalize by total weight
            if total_weight > 0:
                match_score = (match_score / total_weight) * 100
            else:
                match_score = 50  # Default if no traits match

            # Check local viability
            local_viability = False
            if local_industries:
                local_viability = any(
                    industry in archetype.industry_matches
                    for industry in local_industries
                )

            matches.append({
                "archetype_type": archetype.type,
                "match_score": round(match_score, 1),
                "trait_breakdown": trait_breakdown,
                "local_viability": local_viability,
            })

        # Sort by match score
        matches.sort(key=lambda x: x["match_score"], reverse=True)

        # Add ranks
        for i, match in enumerate(matches):
            match["match_rank"] = i + 1

        return [
            ArchetypeMatchResponse(
                archetype_type=ArchetypeType(m["archetype_type"]),
                match_score=m["match_score"],
                match_rank=m["match_rank"],
                trait_breakdown=m["trait_breakdown"],
                local_viability=m["local_viability"],
            )
            for m in matches
        ]

    async def get_career_pathways_for_archetype(
        self,
        archetype_type: ArchetypeType,
        local_industries: list[str] | None = None,
    ) -> list[dict]:
        """Get career pathways for an archetype, prioritizing local matches."""
        archetype = await self.get_archetype(archetype_type)
        if not archetype:
            return []

        pathways = archetype.career_pathways

        # If local industries provided, sort pathways by local availability
        if local_industries:
            def local_priority(pathway: dict) -> int:
                if pathway["industry"] in local_industries:
                    return 0  # Highest priority
                return 1

            pathways = sorted(pathways, key=local_priority)

            # Add local availability flag
            for pathway in pathways:
                pathway["is_local"] = pathway["industry"] in local_industries

        return pathways

    async def get_archetype_guidance(
        self,
        archetype_type: ArchetypeType,
    ) -> dict[str, Any]:
        """Get parent guidance for nurturing a child's archetype."""
        archetype = await self.get_archetype(archetype_type)
        if not archetype:
            return {}

        return {
            "archetype": archetype.name,
            "description": archetype.description,
            "affirmation": archetype.affirmation,
            "parent_guidance": archetype.parent_guidance,
            "strengths_to_nurture": archetype.strengths,
            "growth_areas_to_develop": archetype.growth_areas,
            "famous_examples": archetype.famous_examples,
            "suggested_activities": self._get_suggested_activities(archetype_type),
        }

    def _get_suggested_activities(self, archetype_type: ArchetypeType) -> list[dict]:
        """Get suggested developmental activities for an archetype."""
        activities = {
            ArchetypeType.DIPLOMAT: [
                {"activity": "Language learning games", "develops": ["verbal", "empathy"]},
                {"activity": "Role-playing social situations", "develops": ["cooperation", "emotional_regulation"]},
                {"activity": "Cultural exploration activities", "develops": ["empathy", "verbal"]},
            ],
            ArchetypeType.SYSTEMS_ARCHITECT: [
                {"activity": "Building with LEGO/blocks", "develops": ["spatial", "logic"]},
                {"activity": "Coding games (Scratch Jr)", "develops": ["logic", "delayed_gratification"]},
                {"activity": "Puzzle solving", "develops": ["logic", "spatial"]},
            ],
            ArchetypeType.OPERATOR: [
                {"activity": "Team sports", "develops": ["cooperation", "failure_resilience"]},
                {"activity": "Board games with strategy", "develops": ["logic", "delayed_gratification"]},
                {"activity": "Chore responsibilities", "develops": ["delayed_gratification", "cooperation"]},
            ],
            ArchetypeType.CAREGIVER: [
                {"activity": "Pet care", "develops": ["empathy", "cooperation"]},
                {"activity": "Helping younger children", "develops": ["empathy", "emotional_regulation"]},
                {"activity": "Gardening", "develops": ["delayed_gratification", "empathy"]},
            ],
            ArchetypeType.CREATOR: [
                {"activity": "Art projects (mixed media)", "develops": ["spatial", "risk_tolerance"]},
                {"activity": "Storytelling and writing", "develops": ["verbal", "empathy"]},
                {"activity": "Music and dance", "develops": ["spatial", "emotional_regulation"]},
            ],
            ArchetypeType.ANALYST: [
                {"activity": "Science experiments", "develops": ["logic", "math"]},
                {"activity": "Counting and sorting games", "develops": ["math", "memory"]},
                {"activity": "Pattern recognition activities", "develops": ["logic", "spatial"]},
            ],
            ArchetypeType.BUILDER: [
                {"activity": "Woodworking (age-appropriate)", "develops": ["spatial", "delayed_gratification"]},
                {"activity": "Model building", "develops": ["spatial", "failure_resilience"]},
                {"activity": "Craft projects with multiple steps", "develops": ["delayed_gratification", "spatial"]},
            ],
            ArchetypeType.EXPLORER: [
                {"activity": "Nature hikes and scavenger hunts", "develops": ["spatial", "risk_tolerance"]},
                {"activity": "New experience challenges", "develops": ["risk_tolerance", "failure_resilience"]},
                {"activity": "Map reading and navigation", "develops": ["spatial", "logic"]},
            ],
            ArchetypeType.CONNECTOR: [
                {"activity": "Playdates with diverse children", "develops": ["empathy", "verbal"]},
                {"activity": "Show and tell presentations", "develops": ["verbal", "cooperation"]},
                {"activity": "Community events participation", "develops": ["empathy", "cooperation"]},
            ],
            ArchetypeType.GUARDIAN: [
                {"activity": "First aid learning", "develops": ["empathy", "failure_resilience"]},
                {"activity": "Physical fitness activities", "develops": ["failure_resilience", "cooperation"]},
                {"activity": "Rule-based games", "develops": ["logic", "cooperation"]},
            ],
        }

        return activities.get(archetype_type, [])

    def _map_archetype_response(self, data: dict) -> ArchetypeResponse:
        """Map database row to archetype response model."""
        return ArchetypeResponse(
            type=ArchetypeType(data["type"]),
            name=data["name"],
            description=data["description"],
            icon=data["icon"],
            color_primary=data["color_primary"],
            color_secondary=data["color_secondary"],
            trait_weights=data["trait_weights"],
            career_pathways=data["career_pathways"],
            industry_matches=data["industry_matches"],
            strengths=data["strengths"],
            growth_areas=data["growth_areas"],
            famous_examples=data.get("famous_examples"),
            affirmation=data["affirmation"],
            parent_guidance=data["parent_guidance"],
        )
