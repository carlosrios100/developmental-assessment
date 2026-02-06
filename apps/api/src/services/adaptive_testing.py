"""Adaptive testing service with IRT-based item selection."""
import math
from datetime import datetime
from typing import Any

from src.models.mosaic import (
    CognitiveDomain,
    CognitiveAssessmentResponse,
    CognitiveTestItemResponse,
    CognitiveItemContent,
    CognitiveProfileResponse,
    SubmitCognitiveResponseResponse,
)
from src.services.supabase_client import get_supabase_client
from src.logging_config import get_logger

logger = get_logger(__name__)

# Adaptive testing configuration
MIN_ITEMS = 10
MAX_ITEMS = 30
TARGET_SE = 0.3
INITIAL_THETA = 0.0
INITIAL_SE = 1.0


class AdaptiveTestingService:
    """Service for computerized adaptive testing using IRT."""

    def __init__(self):
        self.supabase = get_supabase_client()

    def _probability_correct(self, theta: float, a: float, b: float, c: float) -> float:
        """Calculate probability of correct response using 3PL IRT model.

        Args:
            theta: Ability estimate
            a: Discrimination parameter
            b: Difficulty parameter
            c: Guessing parameter
        """
        z = a * (theta - b)
        return c + (1 - c) / (1 + math.exp(-z))

    def _item_information(self, theta: float, a: float, b: float, c: float) -> float:
        """Calculate Fisher information for an item at given theta.

        Higher information = more discriminating at this ability level.
        """
        p = self._probability_correct(theta, a, b, c)
        q = 1 - p

        # Derivative of P with respect to theta
        dp = a * (p - c) * (1 - p) / (1 - c) if c < 1 else 0

        # Fisher information
        if p > 0 and q > 0:
            return (dp ** 2) / (p * q)
        return 0

    def _estimate_ability(
        self,
        responses: list[dict],
        items: list[dict],
        prior_theta: float = 0.0,
    ) -> tuple[float, float]:
        """Estimate ability using maximum likelihood estimation with Bayesian prior.

        Returns (theta_estimate, standard_error).
        """
        if not responses:
            return prior_theta, INITIAL_SE

        # Newton-Raphson iteration for MLE
        theta = prior_theta
        for _ in range(20):  # Max iterations
            numerator = 0.0
            denominator = 0.0

            for i, response in enumerate(responses):
                item = items[i]
                a = item["discrimination"]
                b = item["difficulty"]
                c = item["guessing"]

                p = self._probability_correct(theta, a, b, c)
                q = 1 - p

                # Weight for this response
                u = 1 if response["is_correct"] else 0
                w = a * (p - c) / (p * (1 - c)) if c < 1 else a

                numerator += w * (u - p)
                denominator += (w ** 2) * p * q

            # Add Bayesian prior (normal with mean 0, sd 1)
            numerator -= theta
            denominator += 1

            if abs(denominator) < 0.0001:
                break

            delta = numerator / denominator
            theta += delta

            if abs(delta) < 0.001:
                break

        # Clamp theta to reasonable range
        theta = max(-3.0, min(3.0, theta))

        # Calculate standard error
        info = sum(
            self._item_information(theta, item["discrimination"], item["difficulty"], item["guessing"])
            for item in items
        )
        # Add prior information
        info += 1

        se = 1 / math.sqrt(info) if info > 0 else INITIAL_SE

        return theta, se

    def _select_next_item(
        self,
        theta: float,
        age_months: int,
        domain: CognitiveDomain,
        used_item_ids: list[str],
    ) -> dict | None:
        """Select the next item that maximizes information at current ability."""
        # Get available items for this age and domain
        result = self.supabase.table("cognitive_test_items").select("*").eq(
            "domain", domain.value
        ).eq("active", True).lte(
            "min_age_months", age_months
        ).gte(
            "max_age_months", age_months
        ).execute()

        items = [item for item in result.data if item["id"] not in used_item_ids]

        if not items:
            # Try expanding age range slightly
            result = self.supabase.table("cognitive_test_items").select("*").eq(
                "domain", domain.value
            ).eq("active", True).lte(
                "min_age_months", age_months + 6
            ).gte(
                "max_age_months", age_months - 6
            ).execute()
            items = [item for item in result.data if item["id"] not in used_item_ids]

        if not items:
            return None

        # Select item with maximum information at current theta
        best_item = None
        max_info = -1

        for item in items:
            info = self._item_information(
                theta,
                item["discrimination"],
                item["difficulty"],
                item["guessing"],
            )
            if info > max_info:
                max_info = info
                best_item = item

        return best_item

    async def start_assessment(
        self,
        child_id: str,
        domain: CognitiveDomain,
    ) -> tuple[CognitiveAssessmentResponse, CognitiveTestItemResponse | None]:
        """Start a new cognitive assessment session."""
        # Get child's age
        child_result = self.supabase.table("children").select("date_of_birth").eq(
            "id", child_id
        ).execute()

        if not child_result.data:
            raise ValueError("Child not found")

        dob = datetime.fromisoformat(child_result.data[0]["date_of_birth"])
        age_months = (datetime.now().date() - dob).days // 30

        # Create assessment record
        insert_data = {
            "child_id": child_id,
            "domain": domain.value,
            "ability_estimate": INITIAL_THETA,
            "standard_error": INITIAL_SE,
            "items_administered": 0,
            "status": "in_progress",
        }

        result = self.supabase.table("cognitive_assessments").insert(insert_data).execute()
        assessment = result.data[0]

        logger.info(
            "Started cognitive assessment %s for child %s (age %d months, domain %s)",
            assessment["id"], child_id, age_months, domain.value
        )

        # Select first item
        first_item = self._select_next_item(INITIAL_THETA, age_months, domain, [])

        return (
            self._map_assessment_response(assessment),
            self._map_item_response(first_item) if first_item else None,
        )

    async def submit_response(
        self,
        assessment_id: str,
        item_id: str,
        response: str | list[str],
        reaction_time_ms: int,
    ) -> SubmitCognitiveResponseResponse:
        """Submit a response and get the next item or completion status."""
        # Get assessment
        assessment_result = self.supabase.table("cognitive_assessments").select("*").eq(
            "id", assessment_id
        ).execute()

        if not assessment_result.data:
            raise ValueError("Assessment not found")

        assessment = assessment_result.data[0]

        # Get child age
        child_result = self.supabase.table("children").select("date_of_birth").eq(
            "id", assessment["child_id"]
        ).execute()
        dob = datetime.fromisoformat(child_result.data[0]["date_of_birth"])
        age_months = (datetime.now().date() - dob).days // 30

        # Get the item
        item_result = self.supabase.table("cognitive_test_items").select("*").eq(
            "id", item_id
        ).execute()

        if not item_result.data:
            raise ValueError("Item not found")

        item = item_result.data[0]

        # Check correctness
        correct_answer = item["content"]["correct_answer"]
        if isinstance(response, list):
            is_correct = set(response) == set(correct_answer) if isinstance(correct_answer, list) else False
        else:
            is_correct = response == correct_answer

        # Get previous responses
        prev_result = self.supabase.table("cognitive_responses").select(
            "*, cognitive_test_items(*)"
        ).eq("assessment_id", assessment_id).order("item_sequence").execute()

        previous_responses = prev_result.data
        previous_items = [r["cognitive_test_items"] for r in previous_responses]

        # Current response for ability estimation
        all_responses = list(previous_responses) + [{"is_correct": is_correct}]
        all_items = list(previous_items) + [item]

        # Re-estimate ability
        theta_before = assessment["ability_estimate"]
        se_before = assessment["standard_error"]
        theta_after, se_after = self._estimate_ability(all_responses, all_items, theta_before)

        # Save response
        item_sequence = len(previous_responses) + 1
        self.supabase.table("cognitive_responses").insert({
            "assessment_id": assessment_id,
            "item_id": item_id,
            "response": response if isinstance(response, list) else [response],
            "is_correct": is_correct,
            "reaction_time_ms": reaction_time_ms,
            "theta_before": theta_before,
            "theta_after": theta_after,
            "se_before": se_before,
            "se_after": se_after,
            "item_sequence": item_sequence,
        }).execute()

        # Update assessment
        self.supabase.table("cognitive_assessments").update({
            "ability_estimate": theta_after,
            "standard_error": se_after,
            "items_administered": item_sequence,
        }).eq("id", assessment_id).execute()

        # Check stopping rules
        is_complete = False
        stopping_reason = None

        if item_sequence >= MAX_ITEMS:
            is_complete = True
            stopping_reason = "max_items"
        elif item_sequence >= MIN_ITEMS and se_after < TARGET_SE:
            is_complete = True
            stopping_reason = "min_se"

        next_item = None
        if not is_complete:
            used_ids = [r["item_id"] for r in previous_responses] + [item_id]
            next_item_data = self._select_next_item(
                theta_after, age_months, CognitiveDomain(assessment["domain"]), used_ids
            )
            if next_item_data:
                next_item = self._map_item_response(next_item_data)
            else:
                is_complete = True
                stopping_reason = "no_items"

        if is_complete:
            await self._complete_assessment(assessment_id, theta_after, se_after, stopping_reason)

        # Generate feedback
        feedback = {
            "correct": "Great job!" if is_correct else "Good try!",
            "encouragement": self._get_encouragement(item_sequence, is_correct),
        }

        logger.info(
            "Response for assessment %s item %d: correct=%s, theta=%.2f->%.2f, SE=%.3f",
            assessment_id, item_sequence, is_correct, theta_before, theta_after, se_after
        )

        return SubmitCognitiveResponseResponse(
            is_correct=is_correct,
            new_theta=theta_after,
            new_se=se_after,
            is_complete=is_complete,
            next_item=next_item,
            feedback=feedback,
        )

    async def _complete_assessment(
        self,
        assessment_id: str,
        theta: float,
        se: float,
        stopping_reason: str,
    ):
        """Complete an assessment and update cognitive profile."""
        # Calculate percentile from theta
        percentile = int(self._theta_to_percentile(theta))

        # Raw score approximation (scaled 0-100)
        raw_score = (theta + 3) / 6 * 100

        self.supabase.table("cognitive_assessments").update({
            "status": "completed",
            "completed_at": datetime.utcnow().isoformat(),
            "stopping_reason": stopping_reason,
            "raw_score": raw_score,
            "percentile": percentile,
        }).eq("id", assessment_id).execute()

        # Update cognitive profile
        assessment = self.supabase.table("cognitive_assessments").select("*").eq(
            "id", assessment_id
        ).execute().data[0]

        await self._update_cognitive_profile(assessment["child_id"], assessment["domain"], theta, percentile)

        logger.info(
            "Completed assessment %s: theta=%.2f, percentile=%d, reason=%s",
            assessment_id, theta, percentile, stopping_reason
        )

    async def _update_cognitive_profile(
        self,
        child_id: str,
        domain: str,
        score: float,
        percentile: int,
    ):
        """Update or create cognitive profile for a child."""
        # Get or create profile
        profile_result = self.supabase.table("cognitive_profiles").select("*").eq(
            "child_id", child_id
        ).execute()

        score_field = f"{domain}_score"
        percentile_field = f"{domain}_percentile"

        if profile_result.data:
            # Update existing profile
            update_data = {
                score_field: score,
                percentile_field: percentile,
                "last_updated_at": datetime.utcnow().isoformat(),
            }
            self.supabase.table("cognitive_profiles").update(update_data).eq(
                "child_id", child_id
            ).execute()
        else:
            # Create new profile
            insert_data = {
                "child_id": child_id,
                score_field: score,
                percentile_field: percentile,
            }
            self.supabase.table("cognitive_profiles").insert(insert_data).execute()

        # Recalculate composite and strengths/growth areas
        await self._recalculate_profile_aggregates(child_id)

    async def _recalculate_profile_aggregates(self, child_id: str):
        """Recalculate composite scores and identify strengths/growth areas."""
        profile_result = self.supabase.table("cognitive_profiles").select("*").eq(
            "child_id", child_id
        ).execute()

        if not profile_result.data:
            return

        profile = profile_result.data[0]

        # Collect domain scores
        domains = ["math", "logic", "verbal", "spatial", "memory"]
        scores = {}
        for domain in domains:
            score = profile.get(f"{domain}_score")
            if score is not None:
                scores[domain] = score

        if not scores:
            return

        # Calculate composite (simple average for now)
        composite_score = sum(scores.values()) / len(scores)
        composite_percentile = int(self._theta_to_percentile(composite_score))

        # Identify strengths and growth areas
        if len(scores) >= 2:
            sorted_domains = sorted(scores.items(), key=lambda x: x[1], reverse=True)
            strengths = [d[0] for d in sorted_domains[:2] if d[1] > 0]
            growth_areas = [d[0] for d in sorted_domains[-2:] if d[1] < composite_score]
        else:
            strengths = []
            growth_areas = []

        self.supabase.table("cognitive_profiles").update({
            "composite_score": composite_score,
            "composite_percentile": composite_percentile,
            "strengths": strengths,
            "growth_areas": growth_areas,
            "last_updated_at": datetime.utcnow().isoformat(),
        }).eq("child_id", child_id).execute()

    def _theta_to_percentile(self, theta: float) -> float:
        """Convert theta (ability estimate) to percentile using normal CDF."""
        # Standard normal CDF
        return 50 * (1 + math.erf(theta / math.sqrt(2)))

    def _get_encouragement(self, item_number: int, is_correct: bool) -> str:
        """Get age-appropriate encouragement message."""
        if is_correct:
            messages = [
                "You're doing great!",
                "Awesome work!",
                "Keep it up!",
                "You're a star!",
                "Fantastic!",
            ]
        else:
            messages = [
                "Nice try! Let's keep going!",
                "That was tricky! You're doing well!",
                "Good effort! Try the next one!",
                "Keep going, you've got this!",
            ]
        return messages[item_number % len(messages)]

    async def get_assessment(self, assessment_id: str) -> CognitiveAssessmentResponse | None:
        """Get a cognitive assessment by ID."""
        result = self.supabase.table("cognitive_assessments").select("*").eq(
            "id", assessment_id
        ).execute()

        if not result.data:
            return None

        return self._map_assessment_response(result.data[0])

    async def get_cognitive_profile(self, child_id: str) -> CognitiveProfileResponse | None:
        """Get cognitive profile for a child."""
        result = self.supabase.table("cognitive_profiles").select("*").eq(
            "child_id", child_id
        ).execute()

        if not result.data:
            return None

        return self._map_profile_response(result.data[0])

    def _map_assessment_response(self, data: dict) -> CognitiveAssessmentResponse:
        """Map database row to response model."""
        return CognitiveAssessmentResponse(
            id=data["id"],
            child_id=data["child_id"],
            domain=CognitiveDomain(data["domain"]),
            started_at=datetime.fromisoformat(data["started_at"]),
            completed_at=datetime.fromisoformat(data["completed_at"]) if data.get("completed_at") else None,
            ability_estimate=data.get("ability_estimate"),
            standard_error=data.get("standard_error"),
            items_administered=data.get("items_administered", 0),
            stopping_reason=data.get("stopping_reason"),
            raw_score=data.get("raw_score"),
            percentile=data.get("percentile"),
            status=data["status"],
        )

    def _map_item_response(self, data: dict) -> CognitiveTestItemResponse:
        """Map database row to item response model."""
        content = data["content"]
        return CognitiveTestItemResponse(
            id=data["id"],
            domain=CognitiveDomain(data["domain"]),
            difficulty=data["difficulty"],
            discrimination=data["discrimination"],
            guessing=data["guessing"],
            min_age_months=data["min_age_months"],
            max_age_months=data["max_age_months"],
            content=CognitiveItemContent(
                type=content["type"],
                prompt=content["prompt"],
                prompt_audio=content.get("prompt_audio"),
                options=content.get("options"),
                correct_answer=content["correct_answer"],
                images=content.get("images"),
                animation=content.get("animation"),
                feedback=content.get("feedback"),
            ),
            instructions=data.get("instructions"),
            requires_audio=data.get("requires_audio", False),
            requires_touch=data.get("requires_touch", True),
            tags=data.get("tags"),
        )

    def _map_profile_response(self, data: dict) -> CognitiveProfileResponse:
        """Map database row to profile response model."""
        return CognitiveProfileResponse(
            id=data["id"],
            child_id=data["child_id"],
            math_score=data.get("math_score"),
            math_percentile=data.get("math_percentile"),
            logic_score=data.get("logic_score"),
            logic_percentile=data.get("logic_percentile"),
            verbal_score=data.get("verbal_score"),
            verbal_percentile=data.get("verbal_percentile"),
            spatial_score=data.get("spatial_score"),
            spatial_percentile=data.get("spatial_percentile"),
            memory_score=data.get("memory_score"),
            memory_percentile=data.get("memory_percentile"),
            composite_score=data.get("composite_score"),
            composite_percentile=data.get("composite_percentile"),
            strengths=[CognitiveDomain(s) for s in data.get("strengths", [])],
            growth_areas=[CognitiveDomain(g) for g in data.get("growth_areas", [])],
            last_updated_at=datetime.fromisoformat(data["last_updated_at"]),
        )
