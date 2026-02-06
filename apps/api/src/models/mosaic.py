"""Mosaic Protocol models."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class CognitiveDomain(str, Enum):
    """Cognitive assessment domains."""
    MATH = "math"
    LOGIC = "logic"
    VERBAL = "verbal"
    SPATIAL = "spatial"
    MEMORY = "memory"


class EmotionalDimension(str, Enum):
    """Emotional/behavioral dimensions."""
    EMPATHY = "empathy"
    RISK_TOLERANCE = "risk_tolerance"
    DELAYED_GRATIFICATION = "delayed_gratification"
    COOPERATION = "cooperation"
    FAILURE_RESILIENCE = "failure_resilience"
    EMOTIONAL_REGULATION = "emotional_regulation"


class ScenarioType(str, Enum):
    """Behavioral scenario types."""
    SHARING = "sharing"
    DELAYED_GRATIFICATION = "delayed_gratification"
    FAILURE_RECOVERY = "failure_recovery"
    EMPATHY_RESPONSE = "empathy_response"
    RISK_ASSESSMENT = "risk_assessment"
    COOPERATION = "cooperation"


class ArchetypeType(str, Enum):
    """Mosaic archetype types."""
    DIPLOMAT = "diplomat"
    SYSTEMS_ARCHITECT = "systems_architect"
    OPERATOR = "operator"
    CAREGIVER = "caregiver"
    CREATOR = "creator"
    ANALYST = "analyst"
    BUILDER = "builder"
    EXPLORER = "explorer"
    CONNECTOR = "connector"
    GUARDIAN = "guardian"


class ConsentStatus(str, Enum):
    """Consent status."""
    PENDING = "pending"
    GRANTED = "granted"
    REVOKED = "revoked"
    EXPIRED = "expired"


class ConsentCategory(str, Enum):
    """Consent categories for context data."""
    SOCIOECONOMIC = "socioeconomic"
    LOCATION = "location"
    FAMILY_CONTEXT = "family_context"
    RESEARCH_AGGREGATE = "research_aggregate"
    DISTRICT_ANALYTICS = "district_analytics"


# ==================== COGNITIVE ASSESSMENT MODELS ====================


class CognitiveItemContent(BaseModel):
    """Content structure for cognitive test items."""
    type: str = Field(..., description="Item type: multiple_choice, drag_drop, sequence, matching, touch_count")
    prompt: str
    prompt_audio: str | None = None
    options: list[dict] | None = None
    correct_answer: str | list[str]
    images: list[dict] | None = None
    animation: str | None = None
    feedback: dict | None = None


class CognitiveTestItemResponse(BaseModel):
    """Cognitive test item response."""
    id: str
    domain: CognitiveDomain
    difficulty: float
    discrimination: float
    guessing: float
    min_age_months: int
    max_age_months: int
    content: CognitiveItemContent
    instructions: str | None = None
    requires_audio: bool = False
    requires_touch: bool = True
    tags: list[str] | None = None


class StartCognitiveAssessmentRequest(BaseModel):
    """Request to start a cognitive assessment."""
    child_id: str
    domain: CognitiveDomain


class CognitiveAssessmentResponse(BaseModel):
    """Cognitive assessment response."""
    id: str
    child_id: str
    domain: CognitiveDomain
    started_at: datetime
    completed_at: datetime | None = None
    ability_estimate: float | None = None
    standard_error: float | None = None
    items_administered: int = 0
    stopping_reason: str | None = None
    raw_score: float | None = None
    percentile: int | None = None
    status: str


class SubmitCognitiveResponseRequest(BaseModel):
    """Request to submit a cognitive response."""
    assessment_id: str
    item_id: str
    response: str | list[str]
    reaction_time_ms: int


class SubmitCognitiveResponseResponse(BaseModel):
    """Response after submitting a cognitive answer."""
    is_correct: bool
    new_theta: float
    new_se: float
    is_complete: bool
    next_item: CognitiveTestItemResponse | None = None
    feedback: dict | None = None


class CognitiveProfileResponse(BaseModel):
    """Cognitive profile response."""
    id: str
    child_id: str
    math_score: float | None = None
    math_percentile: int | None = None
    logic_score: float | None = None
    logic_percentile: int | None = None
    verbal_score: float | None = None
    verbal_percentile: int | None = None
    spatial_score: float | None = None
    spatial_percentile: int | None = None
    memory_score: float | None = None
    memory_percentile: int | None = None
    composite_score: float | None = None
    composite_percentile: int | None = None
    strengths: list[CognitiveDomain] = []
    growth_areas: list[CognitiveDomain] = []
    last_updated_at: datetime


# ==================== BEHAVIORAL ASSESSMENT MODELS ====================


class BehavioralScenarioResponse(BaseModel):
    """Behavioral scenario response."""
    id: str
    scenario_type: ScenarioType
    title: str
    description: str | None = None
    story_content: dict
    choices: list[dict]
    min_age_months: int
    max_age_months: int
    estimated_duration_seconds: int
    difficulty_level: int
    emotional_dimensions: list[EmotionalDimension]
    assets: dict | None = None
    audio_assets: dict | None = None


class StartBehavioralSessionRequest(BaseModel):
    """Request to start a behavioral session."""
    child_id: str
    scenario_id: str


class BehavioralSessionResponse(BaseModel):
    """Behavioral session response."""
    id: str
    child_id: str
    scenario_id: str
    started_at: datetime
    completed_at: datetime | None = None
    total_duration_ms: int | None = None
    choices_made: int = 0
    engagement_score: float | None = None
    status: str


class SubmitBehavioralChoiceRequest(BaseModel):
    """Request to submit a behavioral choice."""
    session_id: str
    choice_id: str
    selected_option: str
    reaction_time_ms: int
    hesitation_count: int = 0


class SubmitBehavioralChoiceResponse(BaseModel):
    """Response after submitting a behavioral choice."""
    recorded: bool
    dimension_scores: dict[str, float]
    next_segment_id: str | None = None
    feedback: dict | None = None
    is_session_complete: bool = False


class EmotionalProfileResponse(BaseModel):
    """Emotional profile response."""
    id: str
    child_id: str
    empathy_score: float | None = None
    risk_tolerance_score: float | None = None
    delayed_gratification_score: float | None = None
    cooperation_score: float | None = None
    failure_resilience_score: float | None = None
    emotional_regulation_score: float | None = None
    composite_eq_score: float | None = None
    instinct_index: float | None = None
    consistency_index: float | None = None
    sessions_completed: int = 0
    last_updated_at: datetime


# ==================== CONTEXT MODELS ====================


class OpportunityIndexResponse(BaseModel):
    """Opportunity index response."""
    id: str
    zip_code: str
    state_code: str
    city: str | None = None
    opportunity_index: float
    key_industries: list[str]
    local_grants: list[dict] | None = None
    risk_factors: list[str] | None = None
    growth_trends: dict | None = None
    school_quality_score: float | None = None
    internet_access_score: float | None = None
    food_access_score: float | None = None
    median_income: int | None = None


class SaveFamilyContextRequest(BaseModel):
    """Request to save family context."""
    child_id: str
    zip_code: str | None = None
    household_size: int | None = None
    parent_education_level: str | None = None
    household_income_bracket: str | None = None
    single_parent: bool | None = None
    languages_spoken: list[str] | None = None
    primary_language: str | None = None
    receives_assistance: bool | None = None
    assistance_types: list[str] | None = None
    childcare_type: str | None = None
    screen_time_hours_daily: float | None = None
    outdoor_time_hours_daily: float | None = None
    books_in_home: int | None = None


class FamilyContextResponse(BaseModel):
    """Family context response."""
    id: str
    child_id: str
    zip_code: str | None = None
    household_size: int | None = None
    parent_education_level: str | None = None
    household_income_bracket: str | None = None
    single_parent: bool | None = None
    languages_spoken: list[str] | None = None
    primary_language: str | None = None
    receives_assistance: bool | None = None
    childcare_type: str | None = None
    screen_time_hours_daily: float | None = None
    outdoor_time_hours_daily: float | None = None
    books_in_home: int | None = None
    created_at: datetime
    updated_at: datetime


class GrantConsentRequest(BaseModel):
    """Request to grant consent."""
    child_id: str
    category: ConsentCategory


class ConsentResponse(BaseModel):
    """Consent response."""
    id: str
    user_id: str
    child_id: str
    category: ConsentCategory
    status: ConsentStatus
    granted_at: datetime | None = None
    expires_at: datetime | None = None


class ContextMultiplierResponse(BaseModel):
    """Context multiplier response."""
    id: str
    child_id: str
    opportunity_index: float | None = None
    socio_econ_status: float | None = None
    gap_score: float | None = None
    adversity_multiplier: float
    calculation_details: dict | None = None
    data_completeness: float
    calculated_at: datetime


# ==================== MOSAIC OUTPUT MODELS ====================


class ArchetypeResponse(BaseModel):
    """Archetype response."""
    type: ArchetypeType
    name: str
    description: str
    icon: str
    color_primary: str
    color_secondary: str
    trait_weights: dict[str, float]
    career_pathways: list[dict]
    industry_matches: list[str]
    strengths: list[str]
    growth_areas: list[str]
    famous_examples: list[str] | None = None
    affirmation: str
    parent_guidance: str


class ArchetypeMatchResponse(BaseModel):
    """Archetype match response."""
    archetype_type: ArchetypeType
    match_score: float
    match_rank: int
    trait_breakdown: dict[str, float]
    local_viability: bool


class IkigaiChartResponse(BaseModel):
    """Ikigai chart response."""
    id: str
    mosaic_assessment_id: str
    talents: list[dict]
    passions: list[dict]
    world_needs: list[dict]
    viable_careers: list[dict]
    ikigai_center: dict | None = None
    visualization_data: dict | None = None


class GapAnalysisResponse(BaseModel):
    """Gap analysis response."""
    id: str
    gap_type: str
    gap_name: str
    gap_description: str | None = None
    current_level: float | None = None
    target_level: float | None = None
    priority: str
    related_archetype: ArchetypeType | None = None
    matched_resources: list[dict] | None = None
    local_programs: list[dict] | None = None
    estimated_effort: str | None = None


class MosaicAssessmentResponse(BaseModel):
    """Mosaic assessment response."""
    id: str
    child_id: str
    raw_cognitive_score: float | None = None
    raw_emotional_score: float | None = None
    raw_combined_score: float | None = None
    adversity_multiplier: float
    true_potential_score: float | None = None
    true_potential_percentile: int | None = None
    confidence_level: float | None = None
    primary_archetype: ArchetypeType | None = None
    secondary_archetype: ArchetypeType | None = None
    local_viability_score: float | None = None
    calculated_at: datetime
    version: int


class GenerateMosaicRequest(BaseModel):
    """Request to generate Mosaic assessment."""
    child_id: str
    include_context: bool = True


class GenerateMosaicResponse(BaseModel):
    """Complete Mosaic assessment response."""
    mosaic_assessment: MosaicAssessmentResponse
    archetype_matches: list[ArchetypeMatchResponse]
    ikigai_chart: IkigaiChartResponse
    gap_analysis: list[GapAnalysisResponse]
    cognitive_profile: CognitiveProfileResponse | None = None
    emotional_profile: EmotionalProfileResponse | None = None


class DistrictAnalyticsRequest(BaseModel):
    """Request for district analytics."""
    zip_code: str
    age_group: str | None = None
    period_months: int = 12


class DistrictAnalyticsResponse(BaseModel):
    """District analytics response."""
    id: str
    zip_code: str
    state_code: str
    period_start: datetime
    period_end: datetime
    sample_size: int
    age_group: str
    archetype_distribution: dict[str, int]
    cognitive_domain_averages: dict[str, dict]
    emotional_dimension_averages: dict[str, dict]
    opportunity_utilization: float
    top_gaps: list[str] | None = None
    recommended_programs: list[dict] | None = None
