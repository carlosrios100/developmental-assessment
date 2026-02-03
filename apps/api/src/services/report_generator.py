"""Report generation service using AI."""
from datetime import datetime, timedelta
from io import BytesIO
import uuid

import markdown
from xhtml2pdf import pisa

from src.logging_config import get_logger
from src.models.report import (
    ReportType,
    ReportFormat,
    ReportResponse,
    ReportSection,
)
from src.services.supabase_client import get_supabase_client
from src.config import settings

logger = get_logger(__name__)


class ReportGeneratorService:
    """Service for generating developmental assessment reports."""

    def __init__(self):
        self.supabase = get_supabase_client()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def generate_report(
        self,
        assessment_id: str,
        child_id: str,
        report_type: ReportType,
        report_format: ReportFormat,
        include_video_analysis: bool = True,
        include_recommendations: bool = True,
        generated_by_user_id: str | None = None,
    ) -> ReportResponse:
        """Generate a developmental assessment report.

        Parameters
        ----------
        assessment_id : str
            The assessment to generate a report for.
        child_id : str
            The child associated with the assessment.
        report_type : ReportType
            Which style of report to produce.
        report_format : ReportFormat
            Output format (JSON, HTML, or PDF).
        include_video_analysis : bool
            Whether to include video analysis data.
        include_recommendations : bool
            Whether to include recommendations.
        generated_by_user_id : str | None
            The user who triggered generation, stored alongside the report.
        """
        report_id = str(uuid.uuid4())
        logger.info(
            "Generating report %s (type=%s, format=%s) for assessment %s",
            report_id,
            report_type.value,
            report_format.value,
            assessment_id,
        )

        # Get assessment data
        assessment = await self._get_assessment_data(assessment_id)
        child = await self._get_child_data(child_id)
        domain_scores = await self._get_domain_scores(assessment_id)
        recommendations = (
            await self._get_recommendations(assessment_id)
            if include_recommendations
            else []
        )
        video_analysis = (
            await self._get_video_analysis(assessment_id)
            if include_video_analysis
            else None
        )

        # Generate sections based on report type
        if report_type == ReportType.PROGRESS_COMPARISON:
            logger.info(
                "Building progress comparison for child %s from assessment %s",
                child_id,
                assessment_id,
            )
            sections = await self._generate_progress_comparison_sections(
                assessment=assessment,
                child=child,
                child_id=child_id,
            )
        else:
            sections = self._generate_sections(
                report_type=report_type,
                assessment=assessment,
                child=child,
                domain_scores=domain_scores,
                recommendations=recommendations,
                video_analysis=video_analysis,
            )

        # ----------------------------------------------------------
        # Render to target format and optionally upload to storage
        # ----------------------------------------------------------
        storage_url: str | None = None

        if report_format in (ReportFormat.HTML, ReportFormat.PDF):
            html = self._render_html(sections)

            if report_format == ReportFormat.PDF:
                pdf_bytes = self._render_pdf(html)
                file_name = f"reports/{report_id}.pdf"
                content_type = "application/pdf"
                file_data = pdf_bytes
                logger.info("Rendered PDF for report %s (%d bytes)", report_id, len(pdf_bytes))
            else:
                file_name = f"reports/{report_id}.html"
                content_type = "text/html"
                file_data = html.encode("utf-8")
                logger.info("Rendered HTML for report %s", report_id)

            # Upload to Supabase Storage
            try:
                self.supabase.storage.from_("reports").upload(
                    path=file_name,
                    file=file_data,
                    file_options={"content-type": content_type},
                )
                storage_url = self.supabase.storage.from_("reports").get_public_url(
                    file_name
                )
                logger.info("Uploaded report %s to storage: %s", report_id, storage_url)
            except Exception:
                logger.exception("Failed to upload report %s to storage", report_id)

        # Save report record
        report_data = {
            "id": report_id,
            "assessment_id": assessment_id,
            "child_id": child_id,
            "type": report_type.value,
            "format": report_format.value,
            "content": {"sections": [s.model_dump() for s in sections]},
            "expires_at": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        }
        if storage_url is not None:
            report_data["storage_url"] = storage_url
        if generated_by_user_id is not None:
            report_data["generated_by_user_id"] = generated_by_user_id

        self.supabase.table("reports").insert(report_data).execute()
        logger.info("Saved report %s to database", report_id)

        return ReportResponse(
            id=report_id,
            assessment_id=assessment_id,
            child_id=child_id,
            report_type=report_type,
            report_format=report_format,
            generated_at=datetime.utcnow(),
            storage_url=storage_url,
            sections=sections,
            expires_at=datetime.utcnow() + timedelta(days=30),
        )

    # ------------------------------------------------------------------
    # Section routing
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # Parent Summary
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # Professional Detailed
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # Referral
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # Video Analysis
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # Progress Comparison (NEW)
    # ------------------------------------------------------------------

    async def _generate_progress_comparison_sections(
        self,
        assessment: dict,
        child: dict,
        child_id: str,
    ) -> list[ReportSection]:
        """Generate progress comparison sections across all assessments for a child.

        Queries every completed assessment for *child_id*, gathers domain
        scores for each, and produces trend sections that classify each
        developmental domain as improving, declining, or stable over time.
        """
        sections: list[ReportSection] = []

        # 1. Fetch all completed assessments for this child, ordered by date
        all_assessments_result = (
            self.supabase.table("assessments")
            .select("*")
            .eq("child_id", child_id)
            .eq("status", "completed")
            .order("completed_at", desc=False)
            .execute()
        )
        all_assessments: list[dict] = all_assessments_result.data or []

        if len(all_assessments) < 2:
            logger.warning(
                "Progress comparison requested for child %s but only %d completed assessment(s) found",
                child_id,
                len(all_assessments),
            )
            sections.append(ReportSection(
                id="progress_insufficient",
                title="Progress Comparison",
                content="Insufficient data for a progress comparison. "
                        "At least two completed assessments are required.",
                order=0,
                highlight=True,
            ))
            return sections

        logger.info(
            "Found %d completed assessments for child %s for progress comparison",
            len(all_assessments),
            child_id,
        )

        # 2. Gather domain scores for each assessment
        # Structure: { assessment_id: { "completed_at": ..., "age": ..., "scores": { domain: raw_score } } }
        timeline: list[dict] = []
        for asmt in all_assessments:
            asmt_id = asmt["id"]
            scores_result = (
                self.supabase.table("domain_scores")
                .select("*")
                .eq("assessment_id", asmt_id)
                .execute()
            )
            scores_by_domain: dict[str, dict] = {}
            for s in scores_result.data or []:
                scores_by_domain[s.get("domain", "")] = {
                    "raw_score": s.get("raw_score", 0),
                    "percentile": s.get("percentile"),
                    "risk_level": s.get("risk_level", "typical"),
                }

            timeline.append({
                "assessment_id": asmt_id,
                "completed_at": asmt.get("completed_at", ""),
                "age_months": asmt.get("age_at_assessment", 0),
                "scores": scores_by_domain,
            })

        # 3. Header section
        child_name = child.get("first_name", "Child")
        first_date = timeline[0]["completed_at"]
        last_date = timeline[-1]["completed_at"]
        sections.append(ReportSection(
            id="progress_header",
            title="Developmental Progress Comparison",
            content=(
                f"## {child_name}'s Progress Over Time\n\n"
                f"**Assessments compared:** {len(timeline)}\n"
                f"**Date range:** {first_date} to {last_date}\n\n"
                f"This report compares developmental scores across multiple "
                f"screening sessions to identify trends."
            ),
            order=0,
        ))

        # 4. Build per-domain trend data
        domain_names = {
            "communication": "Communication",
            "gross_motor": "Gross Motor",
            "fine_motor": "Fine Motor",
            "problem_solving": "Problem Solving",
            "personal_social": "Personal-Social",
        }

        # Collect all domains that appear in any assessment
        all_domains: set[str] = set()
        for entry in timeline:
            all_domains.update(entry["scores"].keys())

        improving: list[str] = []
        declining: list[str] = []
        stable: list[str] = []

        domain_detail_content = ""

        for domain in sorted(all_domains):
            display_name = domain_names.get(domain, domain.replace("_", " ").title())
            scores_over_time: list[tuple[str, int]] = []
            for entry in timeline:
                if domain in entry["scores"]:
                    scores_over_time.append(
                        (entry["completed_at"], entry["scores"][domain]["raw_score"])
                    )

            if len(scores_over_time) < 2:
                stable.append(display_name)
                continue

            # Simple trend: compare first and last score
            first_score = scores_over_time[0][1]
            last_score = scores_over_time[-1][1]
            delta = last_score - first_score

            # Compute a per-step direction for richer detail
            changes = [
                scores_over_time[i + 1][1] - scores_over_time[i][1]
                for i in range(len(scores_over_time) - 1)
            ]
            avg_change = sum(changes) / len(changes) if changes else 0

            # Classify: threshold of +/- 3 points considers meaningful change
            threshold = 3
            if delta >= threshold:
                improving.append(display_name)
                trend_label = "Improving"
            elif delta <= -threshold:
                declining.append(display_name)
                trend_label = "Declining"
            else:
                stable.append(display_name)
                trend_label = "Stable"

            domain_detail_content += f"#### {display_name} -- {trend_label}\n"
            for date_str, score_val in scores_over_time:
                domain_detail_content += f"- {date_str}: **{score_val}/60**\n"
            domain_detail_content += (
                f"\nOverall change: {'+' if delta >= 0 else ''}{delta} points "
                f"(avg per assessment: {'+' if avg_change >= 0 else ''}{avg_change:.1f})\n\n"
            )

        sections.append(ReportSection(
            id="progress_domain_details",
            title="Score Progression by Domain",
            content=domain_detail_content or "No domain score data available.",
            order=1,
        ))

        # 5. Trend summary section
        trend_content = "### Trend Summary\n\n"

        if improving:
            trend_content += "**Improving:**\n"
            for name in improving:
                trend_content += f"- {name}\n"
            trend_content += "\n"

        if declining:
            trend_content += "**Declining (may need attention):**\n"
            for name in declining:
                trend_content += f"- {name}\n"
            trend_content += "\n"

        if stable:
            trend_content += "**Stable:**\n"
            for name in stable:
                trend_content += f"- {name}\n"
            trend_content += "\n"

        sections.append(ReportSection(
            id="progress_trends",
            title="Trend Summary",
            content=trend_content,
            order=2,
            highlight=len(declining) > 0,
        ))

        # 6. Footer / disclaimer
        sections.append(ReportSection(
            id="progress_footer",
            title="Notes",
            content=(
                "### About This Comparison\n\n"
                "Score trends reflect raw screening scores over time and are not "
                "a clinical diagnosis. Developmental progress can be influenced by "
                "many factors including age-appropriate questionnaire differences. "
                "Please consult a qualified professional for interpretation."
            ),
            order=3,
        ))

        return sections

    # ------------------------------------------------------------------
    # HTML / PDF rendering (NEW)
    # ------------------------------------------------------------------

    def _render_html(self, sections: list[ReportSection]) -> str:
        """Convert a list of report sections (markdown content) to a
        complete, styled HTML document."""
        md_extensions = ["tables", "fenced_code", "smarty"]

        body_parts: list[str] = []
        for section in sorted(sections, key=lambda s: s.order):
            highlight_class = ' class="highlight"' if section.highlight else ""
            section_html = markdown.markdown(section.content, extensions=md_extensions)
            body_parts.append(
                f'<section{highlight_class}>\n'
                f"  <h2>{section.title}</h2>\n"
                f"  {section_html}\n"
                f"</section>"
            )

        sections_html = "\n".join(body_parts)
        generated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

        html = f"""\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Developmental Assessment Report</title>
<style>
  /* ---- Reset & base ---- */
  *, *::before, *::after {{ box-sizing: border-box; }}
  body {{
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #2d3748;
    background: #f7fafc;
    margin: 0;
    padding: 0;
    line-height: 1.6;
  }}
  .container {{
    max-width: 860px;
    margin: 40px auto;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    padding: 48px 56px;
  }}
  .report-header {{
    border-bottom: 3px solid #4299e1;
    padding-bottom: 16px;
    margin-bottom: 32px;
  }}
  .report-header h1 {{
    font-size: 24px;
    margin: 0 0 4px 0;
    color: #1a202c;
  }}
  .report-header .meta {{
    font-size: 13px;
    color: #718096;
  }}
  section {{
    margin-bottom: 28px;
    padding: 20px 24px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #ffffff;
  }}
  section.highlight {{
    border-left: 4px solid #e53e3e;
    background: #fff5f5;
  }}
  section h2 {{
    font-size: 18px;
    margin: 0 0 12px 0;
    color: #2b6cb0;
  }}
  section h3 {{ font-size: 16px; color: #2d3748; }}
  section h4 {{ font-size: 14px; color: #4a5568; }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 14px;
  }}
  th, td {{
    text-align: left;
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
  }}
  th {{
    background: #edf2f7;
    font-weight: 600;
  }}
  ul, ol {{ padding-left: 24px; }}
  li {{ margin-bottom: 4px; }}
  strong {{ color: #1a202c; }}
  .footer {{
    text-align: center;
    font-size: 12px;
    color: #a0aec0;
    margin-top: 36px;
  }}
</style>
</head>
<body>
<div class="container">
  <div class="report-header">
    <h1>Developmental Assessment Report</h1>
    <div class="meta">Generated {generated_at}</div>
  </div>
  {sections_html}
  <div class="footer">
    This report was generated automatically and is not a substitute for professional evaluation.
  </div>
</div>
</body>
</html>"""

        return html

    def _render_pdf(self, html: str) -> bytes:
        """Convert an HTML string to PDF bytes using xhtml2pdf."""
        buffer = BytesIO()
        pisa_status = pisa.CreatePDF(src=html, dest=buffer)

        if pisa_status.err:
            logger.error("xhtml2pdf reported %d error(s) during PDF conversion", pisa_status.err)

        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    # ------------------------------------------------------------------
    # Data helpers
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # CRUD helpers
    # ------------------------------------------------------------------

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
        logger.info("Deleted report %s", report_id)
