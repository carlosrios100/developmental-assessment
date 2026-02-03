"""Tests for assessment endpoints."""
from unittest.mock import patch, MagicMock


def test_create_assessment(client, sample_child, sample_assessment):
    """Test creating a new assessment."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.eq.return_value = mock_table

    # Mock child lookup
    mock_table.execute.side_effect = [
        MagicMock(data=[sample_child]),  # children table lookup
        MagicMock(data=[sample_assessment]),  # assessments insert
    ]

    with patch("src.services.assessment.get_supabase_client", return_value=mock_supabase):
        response = client.post("/api/v1/assessment/", json={
            "child_id": "child-1",
            "questionnaire_version": 12,
        })

    assert response.status_code == 200
    data = response.json()
    assert data["child_id"] == "child-1"


def test_get_assessment_not_found(client):
    """Test getting a non-existent assessment."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[])

    with patch("src.services.assessment.get_supabase_client", return_value=mock_supabase):
        response = client.get("/api/v1/assessment/nonexistent-id")

    assert response.status_code == 404


def test_get_child_assessments(client, sample_assessment):
    """Test getting assessments for a child."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.range.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[sample_assessment])

    with patch("src.services.assessment.get_supabase_client", return_value=mock_supabase):
        response = client.get("/api/v1/assessment/child/child-1")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["child_id"] == "child-1"


def test_delete_assessment(client):
    """Test deleting an assessment."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.delete.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[])

    with patch("src.services.assessment.get_supabase_client", return_value=mock_supabase):
        response = client.delete("/api/v1/assessment/assessment-1")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "deleted"
