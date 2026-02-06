"""Behavioral scoring service for gamified scenarios."""
from datetime import datetime
from typing import Any

from src.models.mosaic import (
    ScenarioType,
    EmotionalDimension,
    BehavioralScenarioResponse,
    BehavioralSessionResponse,
    EmotionalProfileResponse,
    SubmitBehavioralChoiceResponse,
)
from src.services.supabase_client import get_supabase_client
from src.logging_config import get_logger

logger = get_logger(__name__)

# Reaction time thresholds for instinct scoring (milliseconds)
FAST_REACTION_MS = 2000  # Under 2s = instinctive
SLOW_REACTION_MS = 8000  # Over 8s = deliberate

# Engagement score thresholds
LOW_ENGAGEMENT_THRESHOLD = 0.3
HIGH_ENGAGEMENT_THRESHOLD = 0.8


class BehavioralScoringService:
    """Service for managing behavioral scenarios and scoring emotional dimensions."""

    def __init__(self):
        self.supabase = get_supabase_client()

    async def get_available_scenarios(
        self,
        age_months: int,
        completed_scenario_ids: list[str] | None = None,
    ) -> list[BehavioralScenarioResponse]:
        """Get scenarios available for a child's age."""
        result = self.supabase.table("behavioral_scenarios").select("*").eq(
            "active", True
        ).lte(
            "min_age_months", age_months
        ).gte(
            "max_age_months", age_months
        ).execute()

        scenarios = result.data

        # Filter out completed scenarios if provided
        if completed_scenario_ids:
            scenarios = [s for s in scenarios if s["id"] not in completed_scenario_ids]

        return [self._map_scenario_response(s) for s in scenarios]

    async def get_scenario(self, scenario_id: str) -> BehavioralScenarioResponse | None:
        """Get a specific scenario by ID."""
        result = self.supabase.table("behavioral_scenarios").select("*").eq(
            "id", scenario_id
        ).execute()

        if not result.data:
            return None

        return self._map_scenario_response(result.data[0])

    async def start_session(
        self,
        child_id: str,
        scenario_id: str,
        device_info: dict | None = None,
    ) -> BehavioralSessionResponse:
        """Start a new behavioral session."""
        # Verify scenario exists
        scenario_result = self.supabase.table("behavioral_scenarios").select("id").eq(
            "id", scenario_id
        ).execute()

        if not scenario_result.data:
            raise ValueError("Scenario not found")

        insert_data: dict[str, Any] = {
            "child_id": child_id,
            "scenario_id": scenario_id,
            "status": "in_progress",
            "choices_made": 0,
        }
        if device_info:
            insert_data["device_info"] = device_info

        result = self.supabase.table("behavioral_sessions").insert(insert_data).execute()
        session = result.data[0]

        logger.info("Started behavioral session %s for child %s", session["id"], child_id)

        return self._map_session_response(session)

    async def submit_choice(
        self,
        session_id: str,
        choice_id: str,
        selected_option: str,
        reaction_time_ms: int,
        hesitation_count: int = 0,
    ) -> SubmitBehavioralChoiceResponse:
        """Submit a choice and update emotional profile."""
        # Get session and scenario
        session_result = self.supabase.table("behavioral_sessions").select(
            "*, behavioral_scenarios(*)"
        ).eq("id", session_id).execute()

        if not session_result.data:
            raise ValueError("Session not found")

        session = session_result.data[0]
        scenario = session["behavioral_scenarios"]

        # Find the choice in the scenario
        choice_data = None
        selected_option_data = None
        for choice in scenario["choices"]:
            if choice["id"] == choice_id:
                choice_data = choice
                for option in choice["options"]:
                    if option["id"] == selected_option:
                        selected_option_data = option
                        break
                break

        if not choice_data or not selected_option_data:
            raise ValueError("Invalid choice or option")

        # Get dimension scores from the selected option
        dimension_scores = selected_option_data.get("dimension_scores", {})
        emotional_dimensions = [EmotionalDimension(d) for d in dimension_scores.keys()]

        # Weight scores by reaction time (faster = more instinctive)
        weighted_scores = self._weight_by_reaction_time(dimension_scores, reaction_time_ms)

        # Calculate choice index
        choices_made = session.get("choices_made", 0) + 1

        # Save choice
        self.supabase.table("behavioral_choices").insert({
            "session_id": session_id,
            "choice_id": choice_id,
            "choice_index": choices_made,
            "selected_option": selected_option,
            "reaction_time_ms": reaction_time_ms,
            "hesitation_count": hesitation_count,
            "emotional_dimensions": [d.value for d in emotional_dimensions],
            "dimension_scores": weighted_scores,
        }).execute()

        # Update session
        self.supabase.table("behavioral_sessions").update({
            "choices_made": choices_made,
        }).eq("id", session_id).execute()

        # Check if session is complete
        is_complete = choices_made >= len(scenario["choices"])
        next_segment_id = selected_option_data.get("next_segment_id")

        if is_complete:
            await self._complete_session(session_id, session["child_id"])
            next_segment_id = None

        # Get feedback
        feedback = selected_option_data.get("feedback")

        logger.info(
            "Choice submitted for session %s: choice=%s, option=%s, reaction=%dms",
            session_id, choice_id, selected_option, reaction_time_ms
        )

        return SubmitBehavioralChoiceResponse(
            recorded=True,
            dimension_scores=weighted_scores,
            next_segment_id=next_segment_id,
            feedback=feedback,
            is_session_complete=is_complete,
        )

    def _weight_by_reaction_time(
        self,
        scores: dict[str, float],
        reaction_time_ms: int,
    ) -> dict[str, float]:
        """Weight scores by reaction time - faster reactions = more instinctive.

        Fast reactions (< 2s) get full weight.
        Slow reactions (> 8s) get reduced weight (0.7x).
        """
        if reaction_time_ms <= FAST_REACTION_MS:
            weight = 1.0
        elif reaction_time_ms >= SLOW_REACTION_MS:
            weight = 0.7
        else:
            # Linear interpolation
            weight = 1.0 - 0.3 * (reaction_time_ms - FAST_REACTION_MS) / (SLOW_REACTION_MS - FAST_REACTION_MS)

        return {dim: score * weight for dim, score in scores.items()}

    async def _complete_session(self, session_id: str, child_id: str):
        """Complete a session and update emotional profile."""
        # Get all choices for this session
        choices_result = self.supabase.table("behavioral_choices").select("*").eq(
            "session_id", session_id
        ).execute()

        choices = choices_result.data

        if not choices:
            return

        # Calculate engagement score
        total_duration = sum(c["reaction_time_ms"] for c in choices)
        engagement_score = self._calculate_engagement(choices)

        # Complete the session
        self.supabase.table("behavioral_sessions").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "total_duration_ms": total_duration,
            "engagement_score": engagement_score,
        }).eq("id", session_id).execute()

        # Update emotional profile
        await self._update_emotional_profile(child_id, choices)

        logger.info(
            "Completed session %s: %d choices, engagement=%.2f",
            session_id, len(choices), engagement_score
        )

    def _calculate_engagement(self, choices: list[dict]) -> float:
        """Calculate engagement score based on choice patterns.

        Factors:
        - Consistent reaction times (not too fast/random)
        - Low hesitation counts
        - Variety in choices (not always same option)
        """
        if not choices:
            return 0.5

        # Check for variety in choices
        selected_options = [c["selected_option"] for c in choices]
        unique_ratio = len(set(selected_options)) / len(selected_options)

        # Check reaction time consistency
        reaction_times = [c["reaction_time_ms"] for c in choices]
        avg_reaction = sum(reaction_times) / len(reaction_times)

        # Penalize very fast (random clicking) or very slow (disengaged) responses
        reaction_score = 1.0
        if avg_reaction < 500:  # Too fast, likely random
            reaction_score = 0.5
        elif avg_reaction > 15000:  # Too slow, likely disengaged
            reaction_score = 0.6

        # Check hesitation
        avg_hesitation = sum(c.get("hesitation_count", 0) for c in choices) / len(choices)
        hesitation_score = max(0.5, 1.0 - avg_hesitation * 0.1)

        # Combine factors
        engagement = (unique_ratio * 0.3 + reaction_score * 0.4 + hesitation_score * 0.3)
        return min(1.0, max(0.0, engagement))

    async def _update_emotional_profile(self, child_id: str, choices: list[dict]):
        """Update or create emotional profile based on session choices."""
        # Aggregate dimension scores
        dimension_totals: dict[str, list[float]] = {}
        reaction_times: list[int] = []

        for choice in choices:
            reaction_times.append(choice["reaction_time_ms"])
            for dim, score in choice.get("dimension_scores", {}).items():
                if dim not in dimension_totals:
                    dimension_totals[dim] = []
                dimension_totals[dim].append(score)

        # Calculate average scores per dimension
        dimension_averages = {
            dim: sum(scores) / len(scores)
            for dim, scores in dimension_totals.items()
        }

        # Calculate instinct index (based on how fast responses were)
        avg_reaction = sum(reaction_times) / len(reaction_times) if reaction_times else 5000
        instinct_index = max(0, min(1, 1 - (avg_reaction - FAST_REACTION_MS) / (SLOW_REACTION_MS - FAST_REACTION_MS)))

        # Get or create profile
        profile_result = self.supabase.table("emotional_profiles").select("*").eq(
            "child_id", child_id
        ).execute()

        if profile_result.data:
            profile = profile_result.data[0]
            sessions_completed = profile.get("sessions_completed", 0) + 1

            # Calculate running averages
            update_data: dict[str, Any] = {
                "sessions_completed": sessions_completed,
                "instinct_index": (
                    (profile.get("instinct_index", 0.5) * (sessions_completed - 1) + instinct_index)
                    / sessions_completed
                ),
                "last_updated_at": datetime.utcnow().isoformat(),
            }

            # Update each dimension with running average
            for dim, new_score in dimension_averages.items():
                score_field = f"{dim}_score"
                old_score = profile.get(score_field)
                if old_score is not None:
                    # Running average
                    update_data[score_field] = (old_score * (sessions_completed - 1) + new_score * 10) / sessions_completed
                else:
                    # Scale to 0-100
                    update_data[score_field] = new_score * 10 + 50  # Center around 50

            self.supabase.table("emotional_profiles").update(update_data).eq(
                "child_id", child_id
            ).execute()
        else:
            # Create new profile
            insert_data: dict[str, Any] = {
                "child_id": child_id,
                "sessions_completed": 1,
                "instinct_index": instinct_index,
            }

            for dim, score in dimension_averages.items():
                insert_data[f"{dim}_score"] = score * 10 + 50  # Scale to 0-100, centered at 50

            self.supabase.table("emotional_profiles").insert(insert_data).execute()

        # Recalculate composite
        await self._recalculate_composite(child_id)

    async def _recalculate_composite(self, child_id: str):
        """Recalculate composite EQ score."""
        profile_result = self.supabase.table("emotional_profiles").select("*").eq(
            "child_id", child_id
        ).execute()

        if not profile_result.data:
            return

        profile = profile_result.data[0]

        dimensions = [
            "empathy", "risk_tolerance", "delayed_gratification",
            "cooperation", "failure_resilience", "emotional_regulation"
        ]

        scores = []
        for dim in dimensions:
            score = profile.get(f"{dim}_score")
            if score is not None:
                scores.append(score)

        if scores:
            composite = sum(scores) / len(scores)
            self.supabase.table("emotional_profiles").update({
                "composite_eq_score": composite,
            }).eq("child_id", child_id).execute()

    async def get_session(self, session_id: str) -> BehavioralSessionResponse | None:
        """Get a behavioral session by ID."""
        result = self.supabase.table("behavioral_sessions").select("*").eq(
            "id", session_id
        ).execute()

        if not result.data:
            return None

        return self._map_session_response(result.data[0])

    async def get_emotional_profile(self, child_id: str) -> EmotionalProfileResponse | None:
        """Get emotional profile for a child."""
        result = self.supabase.table("emotional_profiles").select("*").eq(
            "child_id", child_id
        ).execute()

        if not result.data:
            return None

        return self._map_profile_response(result.data[0])

    async def get_completed_sessions(self, child_id: str) -> list[BehavioralSessionResponse]:
        """Get all completed sessions for a child."""
        result = self.supabase.table("behavioral_sessions").select("*").eq(
            "child_id", child_id
        ).eq("status", "completed").order("completed_at", desc=True).execute()

        return [self._map_session_response(s) for s in result.data]

    def _map_scenario_response(self, data: dict) -> BehavioralScenarioResponse:
        """Map database row to scenario response model."""
        return BehavioralScenarioResponse(
            id=data["id"],
            scenario_type=ScenarioType(data["scenario_type"]),
            title=data["title"],
            description=data.get("description"),
            story_content=data["story_content"],
            choices=data["choices"],
            min_age_months=data["min_age_months"],
            max_age_months=data["max_age_months"],
            estimated_duration_seconds=data.get("estimated_duration_seconds", 120),
            difficulty_level=data.get("difficulty_level", 3),
            emotional_dimensions=[EmotionalDimension(d) for d in data["emotional_dimensions"]],
            assets=data.get("assets"),
            audio_assets=data.get("audio_assets"),
        )

    def _map_session_response(self, data: dict) -> BehavioralSessionResponse:
        """Map database row to session response model."""
        return BehavioralSessionResponse(
            id=data["id"],
            child_id=data["child_id"],
            scenario_id=data["scenario_id"],
            started_at=datetime.fromisoformat(data["started_at"]),
            completed_at=datetime.fromisoformat(data["completed_at"]) if data.get("completed_at") else None,
            total_duration_ms=data.get("total_duration_ms"),
            choices_made=data.get("choices_made", 0),
            engagement_score=data.get("engagement_score"),
            status=data["status"],
        )

    def _map_profile_response(self, data: dict) -> EmotionalProfileResponse:
        """Map database row to profile response model."""
        return EmotionalProfileResponse(
            id=data["id"],
            child_id=data["child_id"],
            empathy_score=data.get("empathy_score"),
            risk_tolerance_score=data.get("risk_tolerance_score"),
            delayed_gratification_score=data.get("delayed_gratification_score"),
            cooperation_score=data.get("cooperation_score"),
            failure_resilience_score=data.get("failure_resilience_score"),
            emotional_regulation_score=data.get("emotional_regulation_score"),
            composite_eq_score=data.get("composite_eq_score"),
            instinct_index=data.get("instinct_index"),
            consistency_index=data.get("consistency_index"),
            sessions_completed=data.get("sessions_completed", 0),
            last_updated_at=datetime.fromisoformat(data["last_updated_at"]),
        )
