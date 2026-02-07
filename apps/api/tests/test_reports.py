"""Tests for report endpoints."""
from unittest.mock import MagicMock

from src.main import app
from src.routers.reports import get_report_service


def test_get_report_not_found(client):
    """Test getting a non-existent report."""
    mock_service = MagicMock()

    async def mock_get(report_id):
        return None

    mock_service.get_report = mock_get

    app.dependency_overrides[get_report_service] = lambda: mock_service
    try:
        response = client.get("/api/v1/reports/report-nonexistent")
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_report_service, None)


def test_get_assessment_reports(client):
    """Test getting reports for an assessment."""
    mock_service = MagicMock()

    async def mock_get_by_assessment(assessment_id):
        return [{
            "id": "report-1",
            "assessment_id": "assessment-1",
            "child_id": "child-1",
            "report_type": "parent_summary",
            "report_format": "json",
            "generated_at": "2025-01-20T10:00:00Z",
            "storage_url": None,
        }]

    mock_service.get_reports_by_assessment = mock_get_by_assessment

    app.dependency_overrides[get_report_service] = lambda: mock_service
    try:
        response = client.get("/api/v1/reports/assessment/assessment-1")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
    finally:
        app.dependency_overrides.pop(get_report_service, None)


def test_delete_report(client):
    """Test deleting a report."""
    mock_service = MagicMock()

    async def mock_delete(report_id):
        return None

    mock_service.delete_report = mock_delete

    app.dependency_overrides[get_report_service] = lambda: mock_service
    try:
        response = client.delete("/api/v1/reports/report-1")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"
    finally:
        app.dependency_overrides.pop(get_report_service, None)
