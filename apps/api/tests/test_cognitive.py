"""Tests for cognitive assessment router."""
from unittest.mock import patch, MagicMock, AsyncMock


def test_list_cognitive_domains(client):
    """Test listing available cognitive domains."""
    response = client.get("/api/v1/cognitive/domains")
    assert response.status_code == 200
    data = response.json()
    assert "domains" in data
    assert len(data["domains"]) == 5
    ids = [d["id"] for d in data["domains"]]
    assert "math" in ids
    assert "logic" in ids
    assert "verbal" in ids
    assert "spatial" in ids
    assert "memory" in ids


def test_start_cognitive_assessment(client):
    """Test starting a cognitive assessment."""
    mock_assessment = {
        "id": "ca-1",
        "child_id": "child-1",
        "domain": "math",
        "status": "in_progress",
        "current_ability": 0.0,
        "items_administered": 0,
    }
    mock_item = {
        "id": "item-1",
        "domain": "math",
        "content": {"type": "multiple_choice", "prompt": "Count the apples"},
    }

    with patch("src.routers.cognitive.adaptive_testing") as mock_service:
        mock_service.start_assessment = AsyncMock(return_value=(mock_assessment, mock_item))
        response = client.post("/api/v1/cognitive/start", json={
            "child_id": "child-1",
            "domain": "math",
        })

    assert response.status_code == 200
    data = response.json()
    assert "assessment" in data
    assert "first_item" in data
    assert data["assessment"]["domain"] == "math"


def test_submit_cognitive_response(client):
    """Test submitting a cognitive response."""
    mock_result = {
        "is_correct": True,
        "new_theta": 0.5,
        "new_se": 0.3,
        "is_complete": False,
        "next_item": None,
        "feedback": None,
    }

    with patch("src.routers.cognitive.adaptive_testing") as mock_service:
        mock_service.submit_response = AsyncMock(return_value=mock_result)
        response = client.post("/api/v1/cognitive/respond", json={
            "assessment_id": "ca-1",
            "item_id": "item-1",
            "response": "a",
            "reaction_time_ms": 3500,
        })

    assert response.status_code == 200
    data = response.json()
    assert data["is_correct"] is True
    assert data["is_complete"] is False


def test_get_cognitive_assessment_not_found(client):
    """Test getting a non-existent cognitive assessment."""
    with patch("src.routers.cognitive.adaptive_testing") as mock_service:
        mock_service.get_assessment = AsyncMock(return_value=None)
        response = client.get("/api/v1/cognitive/assessment/nonexistent")

    assert response.status_code == 404


def test_get_cognitive_profile_not_found(client):
    """Test getting a cognitive profile when none exists."""
    with patch("src.routers.cognitive.adaptive_testing") as mock_service:
        mock_service.get_cognitive_profile = AsyncMock(return_value=None)
        response = client.get("/api/v1/cognitive/profile/child-1")

    assert response.status_code == 404
