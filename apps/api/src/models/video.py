"""Video analysis models."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class VideoContext(str, Enum):
    """Video recording context."""
    FREE_PLAY = "free_play"
    STRUCTURED_ACTIVITY = "structured_activity"
    CAREGIVER_INTERACTION = "caregiver_interaction"
    FEEDING = "feeding"
    BOOK_READING = "book_reading"
    PHYSICAL_ACTIVITY = "physical_activity"
    PEER_INTERACTION = "peer_interaction"
    SELF_CARE_ROUTINE = "self_care_routine"


class ProcessingStatus(str, Enum):
    """Video processing status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class BehaviorType(str, Enum):
    """Detectable behavior types."""
    EYE_CONTACT = "eye_contact"
    JOINT_ATTENTION = "joint_attention"
    GESTURE_USE = "gesture_use"
    VOCALIZATION = "vocalization"
    MOVEMENT_QUALITY = "movement_quality"
    SOCIAL_ENGAGEMENT = "social_engagement"
    EMOTIONAL_EXPRESSION = "emotional_expression"
    MOTOR_COORDINATION = "motor_coordination"
    OBJECT_MANIPULATION = "object_manipulation"
    CAREGIVER_INTERACTION = "caregiver_interaction"


class VideoUploadRequest(BaseModel):
    """Request to upload a video."""
    child_id: str
    assessment_id: str | None = None
    context: VideoContext
    recorded_at: datetime
    duration: float = Field(..., gt=0, description="Duration in seconds")


class VideoProcessingRequest(BaseModel):
    """Request to process a video."""
    video_id: str
    video_url: str
    child_age_months: int = Field(..., ge=0, le=72)
    analysis_types: list[BehaviorType] = Field(default_factory=list)
    priority: str = "normal"


class DetectedBehavior(BaseModel):
    """A behavior detected in video analysis."""
    type: BehaviorType
    start_time: float
    end_time: float
    confidence: float = Field(..., ge=0, le=1)
    description: str
    related_milestones: list[str] = Field(default_factory=list)
    bounding_box: dict | None = None


class MovementMetrics(BaseModel):
    """Movement analysis metrics."""
    distance_traversed: float = 0.0
    movement_quality: str = "coordinated"
    posture_stability: float = Field(default=0.5, ge=0, le=1)
    bilateral_coordination: float = Field(default=0.5, ge=0, le=1)
    crossing_midline: bool = False
    average_speed: float = 0.0


class InteractionMetrics(BaseModel):
    """Interaction analysis metrics."""
    eye_contact_duration: float = 0.0
    eye_contact_percentage: float = 0.0
    joint_attention_episodes: int = 0
    vocalizations: int = 0
    vocalization_duration: float = 0.0
    positive_affect_instances: int = 0
    responsiveness_to_cues: float = Field(default=0.5, ge=0, le=1)
    turn_taking_instances: int = 0
    proximity_to_caregiver: float = 0.0


class VideoAnalysisResult(BaseModel):
    """Complete video analysis result."""
    video_id: str
    analyzed_at: datetime
    duration: float
    behaviors: list[DetectedBehavior]
    movement_metrics: MovementMetrics
    interaction_metrics: InteractionMetrics
    confidence: float = Field(..., ge=0, le=1)
    processing_time_ms: int


class VideoProcessingStatus(BaseModel):
    """Video processing status response."""
    video_id: str
    status: ProcessingStatus
    progress: int | None = Field(default=None, ge=0, le=100)
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error: str | None = None
    result: VideoAnalysisResult | None = None
