"""Ikigai service for generating purpose-finding charts."""
from datetime import datetime
from typing import Any

from src.models.mosaic import (
    ArchetypeType,
    IkigaiChartResponse,
)
from src.services.supabase_client import get_supabase_client
from src.logging_config import get_logger

logger = get_logger(__name__)

# Career pathway data for each archetype
ARCHETYPE_CAREERS = {
    ArchetypeType.DIPLOMAT: [
        {"career": "Diplomat", "education": "Master's degree", "salary_range": [70000, 150000]},
        {"career": "International Business Manager", "education": "Bachelor's degree", "salary_range": [80000, 140000]},
        {"career": "Hotel Manager", "education": "Bachelor's degree", "salary_range": [50000, 100000]},
        {"career": "Public Relations Specialist", "education": "Bachelor's degree", "salary_range": [45000, 90000]},
        {"career": "Event Coordinator", "education": "Associate's degree", "salary_range": [40000, 70000]},
    ],
    ArchetypeType.SYSTEMS_ARCHITECT: [
        {"career": "Software Architect", "education": "Bachelor's degree", "salary_range": [120000, 200000]},
        {"career": "Systems Engineer", "education": "Bachelor's degree", "salary_range": [90000, 150000]},
        {"career": "DevOps Lead", "education": "Bachelor's degree", "salary_range": [100000, 170000]},
        {"career": "Process Engineer", "education": "Bachelor's degree", "salary_range": [70000, 120000]},
        {"career": "Network Administrator", "education": "Associate's degree", "salary_range": [55000, 90000]},
    ],
    ArchetypeType.OPERATOR: [
        {"career": "Operations Manager", "education": "Bachelor's degree", "salary_range": [70000, 130000]},
        {"career": "Project Manager", "education": "Bachelor's degree", "salary_range": [65000, 120000]},
        {"career": "Healthcare Administrator", "education": "Master's degree", "salary_range": [80000, 140000]},
        {"career": "Business Analyst", "education": "Bachelor's degree", "salary_range": [60000, 100000]},
        {"career": "Military Officer", "education": "Bachelor's degree", "salary_range": [50000, 100000]},
    ],
    ArchetypeType.CAREGIVER: [
        {"career": "Registered Nurse", "education": "Bachelor's degree", "salary_range": [55000, 90000]},
        {"career": "Occupational Therapist", "education": "Master's degree", "salary_range": [70000, 100000]},
        {"career": "School Counselor", "education": "Master's degree", "salary_range": [50000, 80000]},
        {"career": "Social Worker", "education": "Master's degree", "salary_range": [45000, 70000]},
        {"career": "Childcare Director", "education": "Bachelor's degree", "salary_range": [40000, 65000]},
    ],
    ArchetypeType.CREATOR: [
        {"career": "UX Designer", "education": "Bachelor's degree", "salary_range": [70000, 130000]},
        {"career": "Art Director", "education": "Bachelor's degree", "salary_range": [80000, 150000]},
        {"career": "Content Creator", "education": "Self-taught/Bachelor's", "salary_range": [35000, 200000]},
        {"career": "Game Designer", "education": "Bachelor's degree", "salary_range": [60000, 120000]},
        {"career": "Animator", "education": "Bachelor's degree", "salary_range": [50000, 90000]},
    ],
    ArchetypeType.ANALYST: [
        {"career": "Data Scientist", "education": "Master's degree", "salary_range": [100000, 180000]},
        {"career": "Financial Analyst", "education": "Bachelor's degree", "salary_range": [60000, 120000]},
        {"career": "Research Scientist", "education": "PhD", "salary_range": [70000, 130000]},
        {"career": "Market Research Analyst", "education": "Bachelor's degree", "salary_range": [55000, 90000]},
        {"career": "Actuary", "education": "Bachelor's degree", "salary_range": [80000, 150000]},
    ],
    ArchetypeType.BUILDER: [
        {"career": "Civil Engineer", "education": "Bachelor's degree", "salary_range": [65000, 110000]},
        {"career": "Architect", "education": "Master's degree", "salary_range": [60000, 130000]},
        {"career": "Electrician", "education": "Trade certification", "salary_range": [45000, 80000]},
        {"career": "Industrial Designer", "education": "Bachelor's degree", "salary_range": [55000, 100000]},
        {"career": "Robotics Engineer", "education": "Bachelor's degree", "salary_range": [80000, 140000]},
    ],
    ArchetypeType.EXPLORER: [
        {"career": "Travel Writer", "education": "Bachelor's degree", "salary_range": [40000, 80000]},
        {"career": "Documentary Filmmaker", "education": "Bachelor's degree", "salary_range": [50000, 150000]},
        {"career": "Startup Founder", "education": "Varies", "salary_range": [0, 1000000]},
        {"career": "Foreign Correspondent", "education": "Bachelor's degree", "salary_range": [50000, 100000]},
        {"career": "Adventure Tourism Guide", "education": "Certification", "salary_range": [35000, 60000]},
    ],
    ArchetypeType.CONNECTOR: [
        {"career": "Sales Director", "education": "Bachelor's degree", "salary_range": [80000, 200000]},
        {"career": "Recruiter", "education": "Bachelor's degree", "salary_range": [50000, 100000]},
        {"career": "Community Organizer", "education": "Bachelor's degree", "salary_range": [40000, 70000]},
        {"career": "HR Manager", "education": "Bachelor's degree", "salary_range": [65000, 110000]},
        {"career": "Real Estate Agent", "education": "License", "salary_range": [40000, 150000]},
    ],
    ArchetypeType.GUARDIAN: [
        {"career": "Police Officer", "education": "Associate's/Bachelor's", "salary_range": [45000, 90000]},
        {"career": "Attorney", "education": "Juris Doctor", "salary_range": [70000, 200000]},
        {"career": "Firefighter", "education": "Certification", "salary_range": [45000, 80000]},
        {"career": "Military Officer", "education": "Bachelor's degree", "salary_range": [50000, 100000]},
        {"career": "Security Director", "education": "Bachelor's degree", "salary_range": [70000, 130000]},
    ],
}


class IkigaiService:
    """Service for generating Ikigai charts and life purpose recommendations."""

    def __init__(self):
        self.supabase = get_supabase_client()

    async def generate_ikigai_chart(
        self,
        mosaic_assessment_id: str,
        cognitive_profile: dict | None,
        emotional_profile: dict | None,
        archetype_matches: list[dict],
        local_industries: list[str] | None = None,
        local_grants: list[dict] | None = None,
    ) -> IkigaiChartResponse:
        """Generate Ikigai chart for a Mosaic assessment.

        The Ikigai model has four circles:
        1. What you're good at (Talents) - from cognitive/behavioral scores
        2. What you love (Passions) - inferred from engagement patterns
        3. What the world needs (World Needs) - from local economy data
        4. What you can be paid for (Viable Careers) - from archetype careers + local jobs
        """
        # Extract talents from cognitive profile
        talents = self._extract_talents(cognitive_profile, emotional_profile)

        # Infer passions from engagement patterns
        passions = self._infer_passions(emotional_profile, archetype_matches)

        # Get world needs from local industries
        world_needs = self._identify_world_needs(local_industries)

        # Get viable careers
        primary_archetype = ArchetypeType(archetype_matches[0]["archetype_type"]) if archetype_matches else None
        secondary_archetype = ArchetypeType(archetype_matches[1]["archetype_type"]) if len(archetype_matches) > 1 else None
        viable_careers = self._get_viable_careers(
            primary_archetype,
            secondary_archetype,
            local_industries,
        )

        # Calculate Ikigai center (intersection)
        ikigai_center = self._find_ikigai_center(
            talents, passions, world_needs, viable_careers
        )

        # Generate visualization data
        visualization_data = self._generate_visualization_data(
            talents, passions, world_needs, viable_careers
        )

        # Save to database
        chart_data = {
            "mosaic_assessment_id": mosaic_assessment_id,
            "talents": [t for t in talents],
            "passions": [p for p in passions],
            "world_needs": [w for w in world_needs],
            "viable_careers": [c for c in viable_careers],
            "ikigai_center": ikigai_center,
            "visualization_data": visualization_data,
        }

        result = self.supabase.table("ikigai_charts").upsert(
            chart_data,
            on_conflict="mosaic_assessment_id",
        ).execute()

        data = result.data[0]

        logger.info("Generated Ikigai chart for assessment %s", mosaic_assessment_id)

        return IkigaiChartResponse(
            id=data["id"],
            mosaic_assessment_id=data["mosaic_assessment_id"],
            talents=data["talents"],
            passions=data["passions"],
            world_needs=data["world_needs"],
            viable_careers=data["viable_careers"],
            ikigai_center=data.get("ikigai_center"),
            visualization_data=data.get("visualization_data"),
        )

    def _extract_talents(
        self,
        cognitive_profile: dict | None,
        emotional_profile: dict | None,
    ) -> list[dict]:
        """Extract talents from cognitive and emotional profiles."""
        talents = []

        if cognitive_profile:
            # Add cognitive strengths
            cognitive_domains = ["math", "logic", "verbal", "spatial", "memory"]
            for domain in cognitive_domains:
                percentile = cognitive_profile.get(f"{domain}_percentile")
                if percentile and percentile >= 60:  # Above average
                    talents.append({
                        "name": domain.title(),
                        "score": percentile,
                        "source": "cognitive",
                    })

            # Add composite if strong
            if cognitive_profile.get("composite_percentile", 0) >= 70:
                talents.append({
                    "name": "General Cognitive Ability",
                    "score": cognitive_profile["composite_percentile"],
                    "source": "cognitive",
                })

        if emotional_profile:
            # Add emotional strengths
            emotional_dimensions = [
                ("empathy", "Empathy"),
                ("cooperation", "Teamwork"),
                ("delayed_gratification", "Patience"),
                ("failure_resilience", "Resilience"),
                ("emotional_regulation", "Self-Control"),
            ]

            for dim, name in emotional_dimensions:
                score = emotional_profile.get(f"{dim}_score")
                if score and score >= 60:
                    talents.append({
                        "name": name,
                        "score": score,
                        "source": "behavioral",
                    })

        # Sort by score descending
        talents.sort(key=lambda x: x["score"], reverse=True)

        return talents[:8]  # Top 8 talents

    def _infer_passions(
        self,
        emotional_profile: dict | None,
        archetype_matches: list[dict],
    ) -> list[dict]:
        """Infer passions from engagement patterns."""
        passions = []

        # Infer from emotional profile tendencies
        if emotional_profile:
            if emotional_profile.get("empathy_score", 0) >= 60:
                passions.append({
                    "name": "Helping Others",
                    "engagement_score": emotional_profile["empathy_score"],
                    "inferred_from": "empathy_scenarios",
                })

            if emotional_profile.get("risk_tolerance_score", 0) >= 60:
                passions.append({
                    "name": "Adventure & Discovery",
                    "engagement_score": emotional_profile["risk_tolerance_score"],
                    "inferred_from": "risk_scenarios",
                })

            if emotional_profile.get("cooperation_score", 0) >= 60:
                passions.append({
                    "name": "Working with Teams",
                    "engagement_score": emotional_profile["cooperation_score"],
                    "inferred_from": "cooperation_scenarios",
                })

            if emotional_profile.get("delayed_gratification_score", 0) >= 60:
                passions.append({
                    "name": "Building & Creating",
                    "engagement_score": emotional_profile["delayed_gratification_score"],
                    "inferred_from": "patience_scenarios",
                })

        # Infer from top archetype
        if archetype_matches:
            top_archetype = archetype_matches[0]["archetype_type"]
            archetype_passions = {
                "diplomat": "Connecting Cultures",
                "systems_architect": "Solving Complex Problems",
                "operator": "Making Things Work",
                "caregiver": "Nurturing Growth",
                "creator": "Expressing Ideas",
                "analyst": "Finding Truth in Data",
                "builder": "Creating with Hands",
                "explorer": "Discovering New Things",
                "connector": "Bringing People Together",
                "guardian": "Protecting Others",
            }

            if top_archetype in archetype_passions:
                passions.append({
                    "name": archetype_passions[top_archetype],
                    "engagement_score": archetype_matches[0]["match_score"],
                    "inferred_from": f"archetype_{top_archetype}",
                })

        return passions[:6]

    def _identify_world_needs(
        self,
        local_industries: list[str] | None,
    ) -> list[dict]:
        """Identify world needs based on local economy and global trends."""
        world_needs = []

        # Always include universal needs
        universal_needs = [
            {"need": "Technology Solutions", "local_demand": "high", "growth_trend": 15},
            {"need": "Healthcare Services", "local_demand": "high", "growth_trend": 12},
            {"need": "Education & Training", "local_demand": "high", "growth_trend": 8},
            {"need": "Environmental Solutions", "local_demand": "medium", "growth_trend": 10},
        ]

        # Add local industry needs
        if local_industries:
            industry_needs = {
                "Technology": {"need": "Tech Innovation", "growth_trend": 15},
                "Import/Export": {"need": "Trade & Logistics", "growth_trend": 8},
                "Logistics": {"need": "Supply Chain Management", "growth_trend": 10},
                "Hospitality": {"need": "Tourism & Service", "growth_trend": 6},
                "Healthcare": {"need": "Medical Care", "growth_trend": 12},
                "Finance": {"need": "Financial Services", "growth_trend": 7},
                "Manufacturing": {"need": "Product Creation", "growth_trend": 4},
                "Retail": {"need": "Consumer Goods", "growth_trend": 3},
            }

            for industry in local_industries:
                if industry in industry_needs:
                    need = industry_needs[industry]
                    world_needs.append({
                        "need": need["need"],
                        "local_demand": "high",
                        "growth_trend": need["growth_trend"],
                    })

        # Add universal needs for any missing slots
        for need in universal_needs:
            if len(world_needs) < 6 and need["need"] not in [w["need"] for w in world_needs]:
                world_needs.append(need)

        return world_needs[:6]

    def _get_viable_careers(
        self,
        primary_archetype: ArchetypeType | None,
        secondary_archetype: ArchetypeType | None,
        local_industries: list[str] | None,
    ) -> list[dict]:
        """Get viable careers based on archetypes and local economy."""
        careers = []

        # Get careers from primary archetype
        if primary_archetype and primary_archetype in ARCHETYPE_CAREERS:
            for career in ARCHETYPE_CAREERS[primary_archetype][:3]:
                careers.append({
                    **career,
                    "match_score": 90,
                    "local_availability": self._check_local_availability(
                        career["career"], local_industries
                    ),
                })

        # Get careers from secondary archetype
        if secondary_archetype and secondary_archetype in ARCHETYPE_CAREERS:
            for career in ARCHETYPE_CAREERS[secondary_archetype][:2]:
                if career["career"] not in [c["career"] for c in careers]:
                    careers.append({
                        **career,
                        "match_score": 75,
                        "local_availability": self._check_local_availability(
                            career["career"], local_industries
                        ),
                    })

        # Sort by local availability first, then match score
        careers.sort(key=lambda c: (
            {"abundant": 0, "moderate": 1, "limited": 2}.get(c["local_availability"], 3),
            -c["match_score"]
        ))

        return careers[:8]

    def _check_local_availability(
        self,
        career: str,
        local_industries: list[str] | None,
    ) -> str:
        """Check local availability of a career."""
        if not local_industries:
            return "moderate"

        # Map careers to industries
        career_industry_map = {
            "Software Architect": ["Technology"],
            "Systems Engineer": ["Technology", "Engineering"],
            "Hotel Manager": ["Hospitality"],
            "Logistics Coordinator": ["Logistics", "Import/Export"],
            "Supply Chain Manager": ["Logistics", "Import/Export"],
            "Nurse": ["Healthcare"],
            "Data Scientist": ["Technology", "Finance"],
            "Financial Analyst": ["Finance"],
        }

        career_industries = career_industry_map.get(career, [])

        matches = sum(1 for ind in career_industries if ind in local_industries)

        if matches >= 2:
            return "abundant"
        elif matches == 1:
            return "moderate"
        return "limited"

    def _find_ikigai_center(
        self,
        talents: list[dict],
        passions: list[dict],
        world_needs: list[dict],
        viable_careers: list[dict],
    ) -> dict | None:
        """Find the Ikigai center - the intersection of all four circles."""
        if not (talents and passions and world_needs and viable_careers):
            return None

        # The ideal path combines top talent, passion, local need, and career
        primary_path = viable_careers[0]["career"] if viable_careers else "Unknown"

        secondary_paths = [c["career"] for c in viable_careers[1:3]] if len(viable_careers) > 1 else []

        actionable_steps = [
            f"Nurture {talents[0]['name']} skills through practice and challenges" if talents else "Explore different activities",
            f"Encourage activities related to {passions[0]['name']}" if passions else "Try new experiences",
            f"Learn about {world_needs[0]['need']} in your community" if world_needs else "Explore community needs",
            f"Explore what {primary_path}s do" if viable_careers else "Research different careers",
        ]

        return {
            "primary_path": primary_path,
            "secondary_paths": secondary_paths,
            "description": f"Your child shows potential for {primary_path}, combining their natural talents with what the world needs.",
            "actionable_steps": actionable_steps,
        }

    def _generate_visualization_data(
        self,
        talents: list[dict],
        passions: list[dict],
        world_needs: list[dict],
        viable_careers: list[dict],
    ) -> dict:
        """Generate data for Ikigai chart visualization."""
        # SVG-friendly coordinates for a 400x400 viewbox
        center = 200
        radius = 100
        offset = 50

        return {
            "talent_circle": {"x": center - offset, "y": center - offset, "radius": radius},
            "passion_circle": {"x": center + offset, "y": center - offset, "radius": radius},
            "world_need_circle": {"x": center + offset, "y": center + offset, "radius": radius},
            "viable_career_circle": {"x": center - offset, "y": center + offset, "radius": radius},
            "intersections": {
                "talent_passion": {
                    "x": center,
                    "y": center - offset,
                    "label": "Satisfaction",
                    "items": [t["name"] for t in talents[:2]],
                },
                "passion_need": {
                    "x": center + offset,
                    "y": center,
                    "label": "Mission",
                    "items": [p["name"] for p in passions[:2]],
                },
                "need_career": {
                    "x": center,
                    "y": center + offset,
                    "label": "Vocation",
                    "items": [w["need"] for w in world_needs[:2]],
                },
                "career_talent": {
                    "x": center - offset,
                    "y": center,
                    "label": "Profession",
                    "items": [c["career"] for c in viable_careers[:2]],
                },
                "ikigai": {
                    "x": center,
                    "y": center,
                    "label": "Ikigai",
                    "items": [viable_careers[0]["career"]] if viable_careers else [],
                },
            },
        }

    async def get_ikigai_chart(
        self,
        mosaic_assessment_id: str,
    ) -> IkigaiChartResponse | None:
        """Get Ikigai chart for a Mosaic assessment."""
        result = self.supabase.table("ikigai_charts").select("*").eq(
            "mosaic_assessment_id", mosaic_assessment_id
        ).execute()

        if not result.data:
            return None

        data = result.data[0]

        return IkigaiChartResponse(
            id=data["id"],
            mosaic_assessment_id=data["mosaic_assessment_id"],
            talents=data["talents"],
            passions=data["passions"],
            world_needs=data["world_needs"],
            viable_careers=data["viable_careers"],
            ikigai_center=data.get("ikigai_center"),
            visualization_data=data.get("visualization_data"),
        )
