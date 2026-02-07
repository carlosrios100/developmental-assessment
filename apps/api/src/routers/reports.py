"""Reports router."""
from functools import lru_cache

from fastapi import APIRouter, HTTPException, Depends

from src.models.report import ReportRequest, ReportResponse
from src.services.report_generator import ReportGeneratorService
from src.middleware.auth import get_current_user, CurrentUser

router = APIRouter()


@lru_cache
def get_report_service() -> ReportGeneratorService:
    """Get cached report generator service instance."""
    return ReportGeneratorService()


@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    request: ReportRequest,
    current_user: CurrentUser = Depends(get_current_user),
    report_service: ReportGeneratorService = Depends(get_report_service),
):
    """
    Generate a developmental assessment report.

    Report types:
    - parent_summary: Parent-friendly summary with recommendations
    - professional_detailed: Detailed clinical report
    - referral: Report for referral to specialists
    - progress_comparison: Longitudinal progress report
    - video_analysis: Video analysis summary report
    """
    try:
        report = await report_service.generate_report(
            assessment_id=request.assessment_id,
            child_id=request.child_id,
            report_type=request.report_type,
            report_format=request.report_format,
            include_video_analysis=request.include_video_analysis,
            include_recommendations=request.include_recommendations,
            generated_by_user_id=current_user.id,
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    report_service: ReportGeneratorService = Depends(get_report_service),
):
    """Get a generated report by ID."""
    try:
        report = await report_service.get_report(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assessment/{assessment_id}", response_model=list[ReportResponse])
async def get_assessment_reports(
    assessment_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    report_service: ReportGeneratorService = Depends(get_report_service),
):
    """Get all reports for an assessment."""
    try:
        reports = await report_service.get_reports_by_assessment(assessment_id)
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/child/{child_id}", response_model=list[ReportResponse])
async def get_child_reports(
    child_id: str,
    limit: int = 10,
    offset: int = 0,
    current_user: CurrentUser = Depends(get_current_user),
    report_service: ReportGeneratorService = Depends(get_report_service),
):
    """Get all reports for a child."""
    try:
        reports = await report_service.get_reports_by_child(child_id, limit, offset)
        return reports
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    report_service: ReportGeneratorService = Depends(get_report_service),
):
    """Delete a report."""
    try:
        await report_service.delete_report(report_id)
        return {"status": "deleted", "report_id": report_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
