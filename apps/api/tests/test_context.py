"""Tests for context router endpoints."""
from unittest.mock import patch, MagicMock


def test_opportunity_index_found(client, mock_supabase):
    """Test opportunity index for a known zip code."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "opp-1",
            "zip_code": "33178",
            "state_code": "FL",
            "city": "Doral",
            "opportunity_index": 0.85,
            "key_industries": ["Technology", "Logistics"],
            "local_grants": None,
            "risk_factors": ["High Cost of Living"],
            "growth_trends": None,
            "school_quality_score": 8.2,
            "internet_access_score": 0.95,
            "food_access_score": 0.88,
            "median_income": 72500,
            "expires_at": "2030-01-01T00:00:00+00:00",
        }]
    )

    with patch("src.routers.context.geopolitical_service.supabase", mock_supabase):
        response = client.get("/api/v1/context/opportunity/33178")

    assert response.status_code == 200
    data = response.json()
    assert data["zip_code"] == "33178"
    assert data["opportunity_index"] == 0.85
    assert data["is_estimated"] is False


def test_opportunity_index_fallback(client, mock_supabase):
    """Test opportunity index returns national estimate for unknown zip."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    with patch("src.routers.context.geopolitical_service.supabase", mock_supabase):
        response = client.get("/api/v1/context/opportunity/00000")

    assert response.status_code == 200
    data = response.json()
    assert data["zip_code"] == "00000"
    assert data["is_estimated"] is True
    assert data["opportunity_index"] == 0.50
    assert data["state_code"] == "US"
    assert data["id"] == "estimated"


def test_consent_categories(client):
    """Test listing consent categories."""
    response = client.get("/api/v1/context/consent-categories")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert len(data["categories"]) == 5
    ids = [c["id"] for c in data["categories"]]
    assert "socioeconomic" in ids
    assert "location" in ids
    assert "family_context" in ids
