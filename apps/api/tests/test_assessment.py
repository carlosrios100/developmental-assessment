"""Tests for assessment endpoints."""
from unittest.mock import MagicMock

from src.main import app
from src.routers.assessment import get_assessment_service


def test_create_assessment(client, sample_child, sample_assessment):
    """Test creating a new assessment."""
    mock_service = MagicMock()

    async def mock_create(child_id, questionnaire_version, completed_by_user_id=None):
        return sample_assessment

    mock_service.create_assessment = mock_create

    app.dependency_overrides[get_assessment_service] = lambda: mock_service
    try:
        response = client.post("/api/v1/assessment/", json={
            "child_id": "child-1",
            "questionnaire_version": 12,
        })

        assert response.status_code == 200
        data = response.json()
        assert data["child_id"] == "child-1"
    finally:
        app.dependency_overrides.pop(get_assessment_service, None)


def test_get_assessment_not_found(client):
    """Test getting a non-existent assessment."""
    mock_service = MagicMock()

    async def mock_get(assessment_id):
        return None

    mock_service.get_assessment = mock_get

    app.dependency_overrides[get_assessment_service] = lambda: mock_service
    try:
        response = client.get("/api/v1/assessment/nonexistent-id")
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_assessment_service, None)


def test_get_child_assessments(client, sample_assessment):
    """Test getting assessments for a child."""
    mock_service = MagicMock()

    async def mock_get_by_child(child_id, limit, offset):
        return [sample_assessment]

    mock_service.get_assessments_by_child = mock_get_by_child

    app.dependency_overrides[get_assessment_service] = lambda: mock_service
    try:
        response = client.get("/api/v1/assessment/child/child-1")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["child_id"] == "child-1"
    finally:
        app.dependency_overrides.pop(get_assessment_service, None)


def test_delete_assessment(client):
    """Test deleting an assessment."""
    mock_service = MagicMock()

    async def mock_delete(assessment_id):
        return None

    mock_service.delete_assessment = mock_delete

    app.dependency_overrides[get_assessment_service] = lambda: mock_service
    try:
        response = client.delete("/api/v1/assessment/assessment-1")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"
    finally:
        app.dependency_overrides.pop(get_assessment_service, None)
