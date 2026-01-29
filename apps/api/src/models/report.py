"""Report models."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class ReportType(str, Enum):
    """Report types."""
    PARENT_SUMMARY = "parent_summary"
    PROFESSIONAL_DETAILED = "professional_detailed"
    REFERRAL = "referral"
    PROGRESS_COMPARISON = "progress_comparison"
    VIDEO_ANALYSIS = "video_analysis"


class ReportFormat(str, Enum):
    """Report formats."""
    PDF = "pdf"
    HTML = "html"
    JSON = "json"


class ReportRequest(BaseModel):
    """Request to generate a report."""
    assessment_id: str
    child_id: str
    report_type: ReportType
    report_format: ReportFormat = ReportFormat.PDF
    include_video_analysis: bool = True
    include_recommendations: bool = True


class ReportSection(BaseModel):
    """Report section."""
    id: str
    title: str
    content: str
    order: int
    highlight: bool = False


class ReportResponse(BaseModel):
    """Generated report response."""
    id: str
    assessment_id: str
    child_id: str
    report_type: ReportType
    report_format: ReportFormat
    generated_at: datetime
    storage_url: str | None = None
    sections: list[ReportSection] | None = None
    expires_at: datetime | None = None
