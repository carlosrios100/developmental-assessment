"""Report generation service using AI."""
from datetime import datetime, timedelta
import uuid

from src.models.report import (
    ReportType,
    ReportFormat,
    ReportResponse,
    ReportSection,
)
from src.services.supabase_client import get_supabase_client
from src.config import settings


class ReportGeneratorService:
    """Service for generating developmental assessment reports."""

    def __init__(self):
        self.supabase = get_supabase_client()

    async def generate_report(
        self,
        assessment_id: str,
        child_id: str,
        report_type: ReportType,
        report_format: ReportFormat,
        include_video_analysis: bool = True,
        include_recommendations: bool = True,
    ) -> ReportResponse:
        """Generate a developmental assessment report."""
        report_id = str(uuid.uuid4())

        # Get assessment data
        assessment = await self._get_assessment_data(assessment_id)
        child = await self._get_child_data(child_id)
        domain_scores = await self._get_domain_scores(assessment_id)
        recommendations = await self._get_recommendations(assessment_id) if include_recommendations else []
        video_analysis = await self._get_video_analysis(assessment_id) if include_video_analysis else None

        # Generate sections based on report type
        sections = self._generate_sections(
            report_type=report_type,
            assessment=assessment,
            child=child,
            domain_scores=domain_scores,
            recommendations=recommendations,
            video_analysis=video_analysis,
        )

        # Save report
        report_data = {
            "id": report_id,
            "assessment_id": assessment_id,
            "child_id": child_id,
            "type": report_type.value,
            "format": report_format.value,
            "content": {"sections": [s.model_dump() for s in sections]},
            "expires_at": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        }

        self.supabase.table("reports").insert(report_data).execute()

        return ReportResponse(
            id=report_id,
            assessment_id=assessment_id,
            child_id=child_id,
            report_type=report_type,
            report_format=report_format,
            generated_at=datetime.utcnow(),
            sections=sections,
            expires_at=datetime.utcnow() + timedelta(days=30),
        )

    def _generate_sections(
        self,
        report_type: ReportType,
        assessment: dict,
        child: dict,
        domain_scores: list,
        recommendations: list,
        video_analysis: dict | None,
    ) -> list[ReportSection]:
        """Generate report sections based on type."""
        sections = []

        if report_type == ReportType.PARENT_SUMMARY:
            sections = self._generate_parent_summary_sections(
                assessment, child, domain_scores, recommendations, video_analysis
            )
        elif report_type == ReportType.PROFESSIONAL_DETAILED:
            sections = self._generate_professional_sections(
                assessment, child, domain_scores, recommendations, video_analysis
            )
        elif report_type == ReportType.REFERRAL:
            sections = self._generate_referral_sections(
                assessment, child, domain_scores
            )
        elif report_type == ReportType.VIDEO_ANALYSIS:
            sections = self._generate_video_analysis_sections(video_analysis)

        return sections

    def _generate_parent_summary_sections(
        self,
        assessment: dict,
        child: dict,
        domain_scores: list,
        recommendations: list,
        video_analysis: dict | None,
    ) -> list[ReportSection]:
        """Generate parent-friendly summary sections."""
        sections = []

        # Header
        child_name = child.get("first_name", "Your child")
        age = assessment.get("age_at_assessment", 0)
        sections.append(ReportSection(
            id="header",
            title="Developmental Screening Summary",
            content=f"## {child_name}'s Development at {age} Months\n\n"
                    f"**Assessment Date:** {assessment.get('completed_at', 'N/A')}\n\n"
                    f"This report summarizes {child_name}'s developmental screening results.",
            order=0,
        ))

        # Overall summary
        risk_level = assessment.get("overall_risk_level", "typical")
        risk_messages = {
            "typical": ("On Track", "Development appears to be progressing well."),
            "monitoring": ("Monitor", "Some areas need continued observation."),
            "at_risk": ("Needs Review", "Some areas may benefit from professional evaluation."),
            "concern": ("Evaluation Needed", "Multiple areas suggest professional evaluation."),
        }
        title, desc = risk_messages.get(risk_level, ("Unknown", ""))

        sections.append(ReportSection(
            id="overall",
            title="Overall Summary",
            content=f"### {title}\n\n{desc}",
            order=1,
            highlight=risk_level not in ("typical",),
        ))

        # Domain results
        domain_content = ""
        domain_names = {
            "communication": "Communication",
            "gross_motor": "Gross Motor",
            "fine_motor": "Fine Motor",
            "problem_solving": "Problem Solving",
            "personal_social": "Personal-Social",
        }

        for score in domain_scores:
            domain = score.get("domain", "")
            name = domain_names.get(domain, domain)
            raw = score.get("raw_score", 0)
            pct = score.get("percentile", "N/A")
            risk = score.get("risk_level", "typical")

            domain_content += f"#### {name}\n"
            domain_content += f"**Score:** {raw}/60 ({pct}th percentile)\n"
            domain_content += f"**Status:** {risk.replace('_', ' ').title()}\n\n"

        sections.append(ReportSection(
            id="domains",
            title="Results by Developmental Area",
            content=domain_content,
            order=2,
        ))

        # Recommendations
        if recommendations:
            rec_content = "### Suggested Next Steps\n\n"
            for rec in recommendations:
                priority = rec.get("priority", "")
                title = rec.get("title", "")
                desc = rec.get("description", "")
                if priority == "high":
                    rec_content += f"**Important:** {title}\n{desc}\n\n"
                else:
                    rec_content += f"- {title}: {desc}\n"

            sections.append(ReportSection(
                id="recommendations",
                title="Recommendations",
                content=rec_content,
                order=3,
            ))

        # Footer
        sections.append(ReportSection(
            id="footer",
            title="Important Information",
            content="### About This Screening\n\n"
                    "This screening is not a diagnosis. Children develop at different rates. "
                    "If you have concerns, please talk with your child's healthcare provider.\n\n"
                    "**Resources:**\n"
                    "- CDC's \"Learn the Signs. Act Early.\"\n"
                    "- Your child's pediatrician",
            order=4,
        ))

        return sections

    def _generate_professional_sections(
        self,
        assessment: dict,
        child: dict,
        domain_scores: list,
        recommendations: list,
        video_analysis: dict | None,
    ) -> list[ReportSection]:
        """Generate detailed clinical report sections."""
        sections = []

        # Clinical header
        sections.append(ReportSection(
            id="header",
            title="Clinical Developmental Assessment Report",
            content=f"**Child ID:** {child.get('id', 'N/A')}\n"
                    f"**DOB:** {child.get('date_of_birth', 'N/A')}\n"
                    f"**Age at Assessment:** {assessment.get('age_at_assessment', 'N/A')} months\n"
                    f"**Questionnaire Version:** {assessment.get('questionnaire_version', 'N/A')}-month\n"
                    f"**Assessment Date:** {assessment.get('completed_at', 'N/A')}",
            order=0,
        ))

        # Scoring table
        score_table = "| Domain | Raw Score | Percentile | Z-Score | Risk Level |\n"
        score_table += "|--------|-----------|------------|---------|------------|\n"
        for score in domain_scores:
            score_table += (
                f"| {score.get('domain', '').replace('_', ' ').title()} | "
                f"{score.get('raw_score', 0)}/60 | "
                f"{score.get('percentile', 'N/A')}% | "
                f"{score.get('z_score', 'N/A')} | "
                f"{score.get('risk_level', '').upper()} |\n"
            )

        sections.append(ReportSection(
            id="scores",
            title="Domain Scores",
            content=score_table,
            order=1,
        ))

        # Risk assessment
        at_risk = [s for s in domain_scores if s.get("risk_level") == "at_risk"]
        monitoring = [s for s in domain_scores if s.get("risk_level") == "monitoring"]

        risk_content = f"**Overall Classification:** {assessment.get('overall_risk_level', 'N/A').upper()}\n\n"
        risk_content += "**Areas Requiring Further Evaluation:**\n"
        risk_content += "\n".join([f"- {s.get('domain', '').replace('_', ' ').title()}" for s in at_risk]) or "None"
        risk_content += "\n\n**Areas for Monitoring:**\n"
        risk_content += "\n".join([f"- {s.get('domain', '').replace('_', ' ').title()}" for s in monitoring]) or "None"

        sections.append(ReportSection(
            id="risk",
            title="Risk Assessment",
            content=risk_content,
            order=2,
            highlight=len(at_risk) > 0,
        ))

        return sections

    def _generate_referral_sections(
        self,
        assessment: dict,
        child: dict,
        domain_scores: list,
    ) -> list[ReportSection]:
        """Generate referral report sections."""
        return [
            ReportSection(
                id="referral_header",
                title="Developmental Screening Referral",
                content=f"**Child DOB:** {child.get('date_of_birth', 'N/A')}\n"
                        f"**Age at Screening:** {assessment.get('age_at_assessment', 'N/A')} months\n"
                        f"**Overall Risk Level:** {assessment.get('overall_risk_level', 'N/A').upper()}",
                order=0,
            ),
            ReportSection(
                id="referral_reason",
                title="Reason for Referral",
                content="Developmental screening indicates areas that may benefit from "
                        "further professional evaluation.",
                order=1,
            ),
        ]

    def _generate_video_analysis_sections(
        self,
        video_analysis: dict | None,
    ) -> list[ReportSection]:
        """Generate video analysis report sections."""
        if not video_analysis:
            return [ReportSection(
                id="no_video",
                title="Video Analysis",
                content="No video analysis data available.",
                order=0,
            )]

        return [ReportSection(
            id="video_summary",
            title="Video Analysis Summary",
            content=f"**Videos Analyzed:** {video_analysis.get('count', 0)}\n"
                    f"**Total Duration:** {video_analysis.get('duration', 0)} seconds",
            order=0,
        )]

    async def _get_assessment_data(self, assessment_id: str) -> dict:
        """Get assessment data from database."""
        result = self.supabase.table("assessments").select("*").eq(
            "id", assessment_id
        ).execute()
        return result.data[0] if result.data else {}

    async def _get_child_data(self, child_id: str) -> dict:
        """Get child data from database."""
        result = self.supabase.table("children").select("*").eq(
            "id", child_id
        ).execute()
        return result.data[0] if result.data else {}

    async def _get_domain_scores(self, assessment_id: str) -> list:
        """Get domain scores from database."""
        result = self.supabase.table("domain_scores").select("*").eq(
            "assessment_id", assessment_id
        ).execute()
        return result.data

    async def _get_recommendations(self, assessment_id: str) -> list:
        """Get recommendations from database."""
        result = self.supabase.table("recommendations").select("*").eq(
            "assessment_id", assessment_id
        ).execute()
        return result.data

    async def _get_video_analysis(self, assessment_id: str) -> dict | None:
        """Get video analysis summary for assessment."""
        result = self.supabase.table("video_uploads").select(
            "id, duration"
        ).eq("assessment_id", assessment_id).execute()

        if not result.data:
            return None

        return {
            "count": len(result.data),
            "duration": sum(v.get("duration", 0) for v in result.data),
        }

    async def get_report(self, report_id: str) -> ReportResponse | None:
        """Get report by ID."""
        result = self.supabase.table("reports").select("*").eq(
            "id", report_id
        ).execute()

        if not result.data:
            return None

        data = result.data[0]
        sections = [
            ReportSection(**s) for s in data.get("content", {}).get("sections", [])
        ]

        return ReportResponse(
            id=data["id"],
            assessment_id=data["assessment_id"],
            child_id=data["child_id"],
            report_type=ReportType(data["type"]),
            report_format=ReportFormat(data["format"]),
            generated_at=datetime.fromisoformat(data["created_at"]),
            storage_url=data.get("storage_url"),
            sections=sections,
            expires_at=datetime.fromisoformat(data["expires_at"]) if data.get("expires_at") else None,
        )

    async def get_reports_by_assessment(self, assessment_id: str) -> list[ReportResponse]:
        """Get all reports for an assessment."""
        result = self.supabase.table("reports").select("*").eq(
            "assessment_id", assessment_id
        ).execute()

        return [
            ReportResponse(
                id=r["id"],
                assessment_id=r["assessment_id"],
                child_id=r["child_id"],
                report_type=ReportType(r["type"]),
                report_format=ReportFormat(r["format"]),
                generated_at=datetime.fromisoformat(r["created_at"]),
                storage_url=r.get("storage_url"),
            )
            for r in result.data
        ]

    async def get_reports_by_child(
        self, child_id: str, limit: int = 10, offset: int = 0
    ) -> list[ReportResponse]:
        """Get all reports for a child."""
        result = self.supabase.table("reports").select("*").eq(
            "child_id", child_id
        ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        return [
            ReportResponse(
                id=r["id"],
                assessment_id=r["assessment_id"],
                child_id=r["child_id"],
                report_type=ReportType(r["type"]),
                report_format=ReportFormat(r["format"]),
                generated_at=datetime.fromisoformat(r["created_at"]),
                storage_url=r.get("storage_url"),
            )
            for r in result.data
        ]

    async def delete_report(self, report_id: str):
        """Delete a report."""
        self.supabase.table("reports").delete().eq("id", report_id).execute()
