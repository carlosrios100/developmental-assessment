"""Assessment models."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class ResponseValue(str, Enum):
    """Questionnaire response values."""
    YES = "yes"
    SOMETIMES = "sometimes"
    NOT_YET = "not_yet"


class RiskLevel(str, Enum):
    """Risk level classification."""
    TYPICAL = "typical"
    MONITORING = "monitoring"
    AT_RISK = "at_risk"
    CONCERN = "concern"


class AssessmentStatus(str, Enum):
    """Assessment status."""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class QuestionnaireResponseCreate(BaseModel):
    """Create a questionnaire response."""
    item_id: str
    response: ResponseValue
    notes: str | None = None


class DomainScoreResponse(BaseModel):
    """Domain score result."""
    domain: str
    raw_score: float
    max_score: int = 60
    percentile: int | None = None
    z_score: float | None = None
    risk_level: RiskLevel
    cutoff_score: float
    monitoring_zone_cutoff: float


class AssessmentCreate(BaseModel):
    """Create an assessment."""
    child_id: str
    questionnaire_version: int = Field(..., description="Age interval in months")


class AssessmentResponse(BaseModel):
    """Assessment response."""
    id: str
    child_id: str
    age_at_assessment: int
    questionnaire_version: int
    status: AssessmentStatus
    completed_by: str
    started_at: datetime
    completed_at: datetime | None = None
    overall_risk_level: RiskLevel | None = None
    domain_scores: list[DomainScoreResponse] | None = None
    notes: str | None = None


class AssessmentScoreRequest(BaseModel):
    """Request to score an assessment."""
    assessment_id: str
    responses: list[QuestionnaireResponseCreate]
