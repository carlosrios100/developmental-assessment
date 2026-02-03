"""Tests for report endpoints."""
from unittest.mock import patch, MagicMock


def test_get_report_not_found(client):
    """Test getting a non-existent report."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[])

    with patch("src.services.report_generator.get_supabase_client", return_value=mock_supabase):
        response = client.get("/api/v1/reports/report-nonexistent")

    assert response.status_code == 404


def test_get_assessment_reports(client):
    """Test getting reports for an assessment."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.range.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[
        {
            "id": "report-1",
            "assessment_id": "assessment-1",
            "child_id": "child-1",
            "type": "parent_summary",
            "format": "json",
            "created_at": "2025-01-20T10:00:00Z",
            "storage_url": None,
        }
    ])

    with patch("src.services.report_generator.get_supabase_client", return_value=mock_supabase):
        response = client.get("/api/v1/reports/assessment/assessment-1")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


def test_delete_report(client):
    """Test deleting a report."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.delete.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[])

    with patch("src.services.report_generator.get_supabase_client", return_value=mock_supabase):
        response = client.delete("/api/v1/reports/report-1")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "deleted"
