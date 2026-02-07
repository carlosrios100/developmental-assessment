"""Tests for behavioral assessment router."""
from unittest.mock import patch, AsyncMock


def test_list_emotional_dimensions(client):
    """Test listing emotional dimensions."""
    response = client.get("/api/v1/behavioral/dimensions")
    assert response.status_code == 200
    data = response.json()
    assert "dimensions" in data
    assert len(data["dimensions"]) == 6
    ids = [d["id"] for d in data["dimensions"]]
    assert "empathy" in ids
    assert "risk_tolerance" in ids
    assert "delayed_gratification" in ids
    assert "cooperation" in ids
    assert "failure_resilience" in ids
    assert "emotional_regulation" in ids


def test_list_scenario_types(client):
    """Test listing scenario types."""
    response = client.get("/api/v1/behavioral/scenario-types")
    assert response.status_code == 200
    data = response.json()
    assert "types" in data
    assert len(data["types"]) == 6
    ids = [t["id"] for t in data["types"]]
    assert "sharing" in ids
    assert "cooperation" in ids
    assert "failure_recovery" in ids


def test_get_available_scenarios(client):
    """Test getting scenarios for an age range."""
    mock_scenarios = [
        {
            "id": "sc-1",
            "scenario_type": "sharing",
            "title": "The Treasure Chest",
            "description": "A sharing scenario",
            "story_content": {"intro": "Once upon a time..."},
            "choices": [{"id": "c1", "text": "Share"}],
            "min_age_months": 36,
            "max_age_months": 72,
            "estimated_duration_seconds": 180,
            "difficulty_level": 1,
            "emotional_dimensions": ["empathy", "cooperation"],
        }
    ]

    with patch("src.routers.behavioral.behavioral_service") as mock_service:
        mock_service.get_available_scenarios = AsyncMock(return_value=mock_scenarios)
        response = client.get("/api/v1/behavioral/scenarios?age_months=48")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["scenario_type"] == "sharing"


def test_get_scenario_not_found(client):
    """Test getting a non-existent scenario."""
    with patch("src.routers.behavioral.behavioral_service") as mock_service:
        mock_service.get_scenario = AsyncMock(return_value=None)
        response = client.get("/api/v1/behavioral/scenario/nonexistent")

    assert response.status_code == 404


def test_start_behavioral_session(client):
    """Test starting a behavioral session."""
    mock_session = {
        "id": "bs-1",
        "child_id": "child-1",
        "scenario_id": "sc-1",
        "status": "in_progress",
        "started_at": "2025-06-15T10:00:00Z",
    }

    with patch("src.routers.behavioral.behavioral_service") as mock_service:
        mock_service.start_session = AsyncMock(return_value=mock_session)
        response = client.post("/api/v1/behavioral/session/start", json={
            "child_id": "child-1",
            "scenario_id": "sc-1",
        })

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "in_progress"


def test_submit_behavioral_choice(client):
    """Test submitting a choice during a behavioral scenario."""
    mock_result = {
        "recorded": True,
        "dimension_scores": {"empathy": 0.8, "cooperation": 0.7},
        "next_segment_id": "segment_2",
        "is_session_complete": False,
        "feedback": None,
    }

    with patch("src.routers.behavioral.behavioral_service") as mock_service:
        mock_service.submit_choice = AsyncMock(return_value=mock_result)
        response = client.post("/api/v1/behavioral/session/choice", json={
            "session_id": "bs-1",
            "choice_id": "choice-1",
            "selected_option": "share_equally",
            "reaction_time_ms": 2000,
            "hesitation_count": 1,
        })

    assert response.status_code == 200
    data = response.json()
    assert data["recorded"] is True
    assert data["is_session_complete"] is False


def test_get_behavioral_session_not_found(client):
    """Test getting a non-existent session."""
    with patch("src.routers.behavioral.behavioral_service") as mock_service:
        mock_service.get_session = AsyncMock(return_value=None)
        response = client.get("/api/v1/behavioral/session/nonexistent")

    assert response.status_code == 404


def test_get_emotional_profile_not_found(client):
    """Test getting an emotional profile when none exists."""
    with patch("src.routers.behavioral.behavioral_service") as mock_service:
        mock_service.get_emotional_profile = AsyncMock(return_value=None)
        response = client.get("/api/v1/behavioral/profile/child-1")

    assert response.status_code == 404


def test_get_completed_sessions_empty(client):
    """Test getting completed sessions when none exist."""
    with patch("src.routers.behavioral.behavioral_service") as mock_service:
        mock_service.get_completed_sessions = AsyncMock(return_value=[])
        response = client.get("/api/v1/behavioral/sessions/child-1")

    assert response.status_code == 200
    assert response.json() == []
