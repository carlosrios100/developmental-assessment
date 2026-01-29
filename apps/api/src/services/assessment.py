"""Assessment service with scoring algorithms."""
from datetime import datetime
from typing import Any

from src.models.assessment import (
    AssessmentResponse,
    AssessmentStatus,
    QuestionnaireResponseCreate,
    DomainScoreResponse,
    RiskLevel,
    ResponseValue,
)
from src.services.supabase_client import get_supabase_client


# Response value mapping
RESPONSE_VALUES = {
    ResponseValue.YES: 10,
    ResponseValue.SOMETIMES: 5,
    ResponseValue.NOT_YET: 0,
}

# Domain prefixes in item IDs
DOMAIN_PREFIXES = {
    "communication": "comm",
    "gross_motor": "gm",
    "fine_motor": "fm",
    "problem_solving": "ps",
    "personal_social": "pss",
}

# Cutoff scores by age (simplified - full data in shared package)
CUTOFF_SCORES = {
    12: {
        "communication": {"cutoff": 15.64, "monitoring": 28.52, "mean": 41.4, "std": 12.88},
        "gross_motor": {"cutoff": 21.93, "monitoring": 35.18, "mean": 48.43, "std": 13.25},
        "fine_motor": {"cutoff": 27.82, "monitoring": 39.49, "mean": 51.16, "std": 11.67},
        "problem_solving": {"cutoff": 25.21, "monitoring": 37.74, "mean": 50.27, "std": 12.53},
        "personal_social": {"cutoff": 22.45, "monitoring": 35.67, "mean": 48.89, "std": 13.22},
    },
    24: {
        "communication": {"cutoff": 19.52, "monitoring": 32.97, "mean": 46.42, "std": 13.45},
        "gross_motor": {"cutoff": 36.71, "monitoring": 46.03, "mean": 55.35, "std": 9.32},
        "fine_motor": {"cutoff": 31.52, "monitoring": 42.18, "mean": 52.84, "std": 10.66},
        "problem_solving": {"cutoff": 27.98, "monitoring": 40.12, "mean": 52.26, "std": 12.14},
        "personal_social": {"cutoff": 30.25, "monitoring": 41.87, "mean": 53.49, "std": 11.62},
    },
}


class AssessmentService:
    """Service for managing assessments and calculating scores."""

    def __init__(self):
        self.supabase = get_supabase_client()

    async def create_assessment(
        self, child_id: str, questionnaire_version: int
    ) -> AssessmentResponse:
        """Create a new assessment."""
        # Get child's age
        child_result = self.supabase.table("children").select("date_of_birth").eq(
            "id", child_id
        ).execute()

        if not child_result.data:
            raise ValueError("Child not found")

        dob = datetime.fromisoformat(child_result.data[0]["date_of_birth"])
        age_months = (datetime.now().date() - dob).days // 30

        result = self.supabase.table("assessments").insert({
            "child_id": child_id,
            "age_at_assessment": age_months,
            "questionnaire_version": questionnaire_version,
            "status": AssessmentStatus.DRAFT.value,
            "completed_by": "parent",
        }).execute()

        data = result.data[0]
        return self._map_to_response(data)

    async def get_assessment(self, assessment_id: str) -> AssessmentResponse | None:
        """Get assessment by ID."""
        result = self.supabase.table("assessments").select(
            "*, domain_scores(*)"
        ).eq("id", assessment_id).execute()

        if not result.data:
            return None

        data = result.data[0]
        return self._map_to_response(data)

    async def save_responses(
        self, assessment_id: str, responses: list[QuestionnaireResponseCreate]
    ):
        """Save questionnaire responses."""
        # Update assessment status
        self.supabase.table("assessments").update({
            "status": AssessmentStatus.IN_PROGRESS.value,
        }).eq("id", assessment_id).execute()

        # Upsert responses
        for response in responses:
            self.supabase.table("questionnaire_responses").upsert({
                "assessment_id": assessment_id,
                "item_id": response.item_id,
                "response": response.response.value,
                "response_value": RESPONSE_VALUES[response.response],
                "notes": response.notes,
            }).execute()

    async def score_assessment(self, assessment_id: str) -> AssessmentResponse:
        """Calculate scores for an assessment."""
        # Get assessment and responses
        assessment_result = self.supabase.table("assessments").select("*").eq(
            "id", assessment_id
        ).execute()

        if not assessment_result.data:
            raise ValueError("Assessment not found")

        assessment = assessment_result.data[0]
        age_months = assessment["questionnaire_version"]

        responses_result = self.supabase.table("questionnaire_responses").select(
            "*"
        ).eq("assessment_id", assessment_id).execute()

        responses = responses_result.data

        # Calculate domain scores
        domain_scores = []
        for domain, prefix in DOMAIN_PREFIXES.items():
            domain_responses = [r for r in responses if r["item_id"].startswith(prefix)]
            raw_score = sum(r["response_value"] for r in domain_responses)

            # Get cutoffs for this age
            cutoffs = self._get_cutoffs(age_months, domain)

            # Determine risk level
            if raw_score < cutoffs["cutoff"]:
                risk_level = RiskLevel.AT_RISK
            elif raw_score < cutoffs["monitoring"]:
                risk_level = RiskLevel.MONITORING
            else:
                risk_level = RiskLevel.TYPICAL

            # Calculate percentile
            z_score = (raw_score - cutoffs["mean"]) / cutoffs["std"]
            percentile = int(self._normal_cdf(z_score) * 100)

            score = DomainScoreResponse(
                domain=domain,
                raw_score=raw_score,
                max_score=60,
                percentile=percentile,
                z_score=round(z_score, 2),
                risk_level=risk_level,
                cutoff_score=cutoffs["cutoff"],
                monitoring_zone_cutoff=cutoffs["monitoring"],
            )
            domain_scores.append(score)

            # Save to database
            self.supabase.table("domain_scores").upsert({
                "assessment_id": assessment_id,
                "domain": domain,
                "raw_score": raw_score,
                "max_score": 60,
                "percentile": percentile,
                "z_score": round(z_score, 2),
                "risk_level": risk_level.value,
                "cutoff_score": cutoffs["cutoff"],
                "monitoring_zone_cutoff": cutoffs["monitoring"],
            }).execute()

        # Determine overall risk level
        at_risk_count = sum(1 for s in domain_scores if s.risk_level == RiskLevel.AT_RISK)
        has_monitoring = any(s.risk_level == RiskLevel.MONITORING for s in domain_scores)

        if at_risk_count >= 2:
            overall_risk = RiskLevel.CONCERN
        elif at_risk_count == 1:
            overall_risk = RiskLevel.AT_RISK
        elif has_monitoring:
            overall_risk = RiskLevel.MONITORING
        else:
            overall_risk = RiskLevel.TYPICAL

        # Update assessment
        self.supabase.table("assessments").update({
            "status": AssessmentStatus.COMPLETED.value,
            "completed_at": datetime.utcnow().isoformat(),
            "overall_risk_level": overall_risk.value,
        }).eq("id", assessment_id).execute()

        # Generate recommendations
        await self._generate_recommendations(assessment_id, domain_scores, age_months)

        return await self.get_assessment(assessment_id)

    def _get_cutoffs(self, age_months: int, domain: str) -> dict:
        """Get cutoff scores for age and domain."""
        # Find closest age
        available_ages = sorted(CUTOFF_SCORES.keys())
        closest_age = min(available_ages, key=lambda x: abs(x - age_months))
        return CUTOFF_SCORES[closest_age][domain]

    def _normal_cdf(self, z: float) -> float:
        """Calculate normal cumulative distribution function."""
        import math
        return 0.5 * (1 + math.erf(z / math.sqrt(2)))

    async def _generate_recommendations(
        self,
        assessment_id: str,
        domain_scores: list[DomainScoreResponse],
        age_months: int,
    ):
        """Generate recommendations based on scores."""
        for score in domain_scores:
            if score.risk_level == RiskLevel.AT_RISK:
                self.supabase.table("recommendations").insert({
                    "assessment_id": assessment_id,
                    "priority": "high",
                    "domain": score.domain,
                    "type": "referral",
                    "title": f"Further evaluation recommended for {score.domain.replace('_', ' ').title()}",
                    "description": f"Score of {score.raw_score} is below the cutoff of {score.cutoff_score}. Professional evaluation is recommended.",
                }).execute()
            elif score.risk_level == RiskLevel.MONITORING:
                self.supabase.table("recommendations").insert({
                    "assessment_id": assessment_id,
                    "priority": "medium",
                    "domain": score.domain,
                    "type": "monitoring",
                    "title": f"Monitor {score.domain.replace('_', ' ').title()} development",
                    "description": f"Score of {score.raw_score} is in the monitoring zone. Continue with suggested activities and reassess in 2-3 months.",
                }).execute()

    async def get_domain_scores(self, assessment_id: str) -> list[DomainScoreResponse]:
        """Get domain scores for an assessment."""
        result = self.supabase.table("domain_scores").select("*").eq(
            "assessment_id", assessment_id
        ).execute()

        return [
            DomainScoreResponse(
                domain=row["domain"],
                raw_score=row["raw_score"],
                max_score=row["max_score"],
                percentile=row["percentile"],
                z_score=row["z_score"],
                risk_level=RiskLevel(row["risk_level"]),
                cutoff_score=row["cutoff_score"],
                monitoring_zone_cutoff=row["monitoring_zone_cutoff"],
            )
            for row in result.data
        ]

    async def get_assessments_by_child(
        self, child_id: str, limit: int = 10, offset: int = 0
    ) -> list[AssessmentResponse]:
        """Get all assessments for a child."""
        result = self.supabase.table("assessments").select("*").eq(
            "child_id", child_id
        ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        return [self._map_to_response(row) for row in result.data]

    async def delete_assessment(self, assessment_id: str):
        """Delete an assessment."""
        self.supabase.table("assessments").delete().eq("id", assessment_id).execute()

    def _map_to_response(self, data: dict) -> AssessmentResponse:
        """Map database row to response model."""
        domain_scores = None
        if "domain_scores" in data and data["domain_scores"]:
            domain_scores = [
                DomainScoreResponse(
                    domain=s["domain"],
                    raw_score=s["raw_score"],
                    max_score=s["max_score"],
                    percentile=s["percentile"],
                    z_score=s["z_score"],
                    risk_level=RiskLevel(s["risk_level"]),
                    cutoff_score=s["cutoff_score"],
                    monitoring_zone_cutoff=s["monitoring_zone_cutoff"],
                )
                for s in data["domain_scores"]
            ]

        return AssessmentResponse(
            id=data["id"],
            child_id=data["child_id"],
            age_at_assessment=data["age_at_assessment"],
            questionnaire_version=data["questionnaire_version"],
            status=AssessmentStatus(data["status"]),
            completed_by=data["completed_by"],
            started_at=datetime.fromisoformat(data["started_at"]),
            completed_at=datetime.fromisoformat(data["completed_at"]) if data.get("completed_at") else None,
            overall_risk_level=RiskLevel(data["overall_risk_level"]) if data.get("overall_risk_level") else None,
            domain_scores=domain_scores,
            notes=data.get("notes"),
        )
