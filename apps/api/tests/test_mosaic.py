"""Tests for Mosaic protocol router."""
from unittest.mock import patch, AsyncMock


def test_list_archetype_types(client):
    """Test listing archetype types."""
    response = client.get("/api/v1/mosaic/archetype-types")
    assert response.status_code == 200
    data = response.json()
    assert "types" in data
    assert len(data["types"]) == 10
    ids = [t["id"] for t in data["types"]]
    assert "diplomat" in ids
    assert "creator" in ids
    assert "guardian" in ids


def test_get_scoring_info(client):
    """Test getting scoring formula info."""
    response = client.get("/api/v1/mosaic/scoring-info")
    assert response.status_code == 200
    data = response.json()
    assert "formula" in data
    assert data["formula"]["cognitive_weight"] == 0.4
    assert data["formula"]["emotional_weight"] == 0.6
    assert data["formula"]["adversity_multiplier_range"]["min"] == 1.0
    assert data["formula"]["adversity_multiplier_range"]["max"] == 1.5


def test_generate_mosaic(client):
    """Test generating a Mosaic assessment."""
    mock_result = {
        "mosaic_assessment": {
            "id": "ma-1",
            "child_id": "child-1",
            "version": 1,
            "raw_cognitive_score": 0.75,
            "raw_emotional_score": 0.82,
            "raw_combined_score": 0.79,
            "adversity_multiplier": 1.0,
            "true_potential_score": 0.79,
            "true_potential_percentile": 72,
            "confidence_level": 0.85,
            "primary_archetype": "creator",
            "secondary_archetype": "explorer",
            "calculated_at": "2025-06-15T10:00:00Z",
        },
        "archetype_matches": [
            {
                "archetype_type": "creator",
                "match_score": 0.92,
                "match_rank": 1,
                "trait_breakdown": {"creativity": 0.9},
                "local_viability": True,
            }
        ],
        "ikigai_chart": {
            "id": "ik-1",
            "mosaic_assessment_id": "ma-1",
            "talents": [{"name": "art", "score": 0.9}],
            "passions": [{"name": "drawing", "score": 0.85}],
            "world_needs": [{"name": "design", "demand": 0.8}],
            "viable_careers": [{"name": "UX Designer", "fit": 0.88}],
        },
        "gap_analysis": [],
    }

    with patch("src.routers.mosaic.mosaic_service") as mock_service:
        mock_service.generate_mosaic = AsyncMock(return_value=mock_result)
        response = client.post("/api/v1/mosaic/generate", json={
            "child_id": "child-1",
            "include_context": True,
        })

    assert response.status_code == 200
    data = response.json()
    assert "mosaic_assessment" in data
    assert data["mosaic_assessment"]["true_potential_score"] == 0.79


def test_generate_mosaic_missing_data(client):
    """Test generating Mosaic with insufficient data."""
    with patch("src.routers.mosaic.mosaic_service") as mock_service:
        mock_service.generate_mosaic = AsyncMock(
            side_effect=ValueError("Insufficient assessment data")
        )
        response = client.post("/api/v1/mosaic/generate", json={
            "child_id": "child-1",
        })

    assert response.status_code == 400
    assert "Insufficient" in response.json()["detail"]


def test_get_mosaic_assessment_not_found(client):
    """Test getting a Mosaic assessment when none exists."""
    with patch("src.routers.mosaic.mosaic_service") as mock_service:
        mock_service.get_mosaic = AsyncMock(return_value=None)
        response = client.get("/api/v1/mosaic/assessment/child-1")

    assert response.status_code == 404


def test_get_mosaic_history_empty(client):
    """Test getting Mosaic history when none exists."""
    with patch("src.routers.mosaic.mosaic_service") as mock_service:
        mock_service.get_mosaic_history = AsyncMock(return_value=[])
        response = client.get("/api/v1/mosaic/assessment/child-1/history")

    assert response.status_code == 200
    assert response.json() == []


def test_get_all_archetypes(client):
    """Test getting all archetypes."""
    mock_archetypes = [
        {
            "type": "diplomat",
            "name": "The Diplomat",
            "description": "Natural communicators",
            "icon": "handshake",
            "color_primary": "#4A90D9",
            "color_secondary": "#7BB5E8",
            "trait_weights": {"empathy": 0.25},
            "career_pathways": [{"industry": "HR", "roles": ["Manager"]}],
            "industry_matches": ["HR", "Education"],
            "strengths": ["Communication"],
            "growth_areas": ["Assertiveness"],
            "affirmation": "You connect people!",
            "parent_guidance": "Encourage social activities.",
        },
    ]

    with patch("src.routers.mosaic.archetype_service") as mock_service:
        mock_service.get_all_archetypes = AsyncMock(return_value=mock_archetypes)
        response = client.get("/api/v1/mosaic/archetypes")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["type"] == "diplomat"


def test_get_archetype_not_found(client):
    """Test getting a non-existent archetype."""
    with patch("src.routers.mosaic.archetype_service") as mock_service:
        mock_service.get_archetype = AsyncMock(return_value=None)
        response = client.get("/api/v1/mosaic/archetype/diplomat")

    assert response.status_code == 404


def test_get_ikigai_not_found(client):
    """Test getting an Ikigai chart when none exists."""
    with patch("src.routers.mosaic.ikigai_service") as mock_service:
        mock_service.get_ikigai_chart = AsyncMock(return_value=None)
        response = client.get("/api/v1/mosaic/ikigai/nonexistent")

    assert response.status_code == 404


def test_get_gaps_empty(client, mock_supabase):
    """Test getting gap analysis when none exists."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = type(
        "Result", (), {"data": []}
    )()

    with patch("src.routers.mosaic.get_supabase_client", create=True, return_value=mock_supabase):
        with patch("src.services.supabase_client.get_supabase_client", return_value=mock_supabase):
            response = client.get("/api/v1/mosaic/gaps/nonexistent")

    assert response.status_code == 200
    assert response.json() == []
