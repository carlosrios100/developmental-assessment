"""Test fixtures and configuration."""
import sys
import pytest
from unittest.mock import MagicMock, AsyncMock, patch

# Mock xhtml2pdf before importing app (it requires pycairo which may not be installed)
sys.modules['xhtml2pdf'] = MagicMock()
sys.modules['xhtml2pdf.pisa'] = MagicMock()

from fastapi.testclient import TestClient

from src.main import app
from src.middleware.auth import get_current_user, CurrentUser


# Mock current user for authenticated endpoints
def mock_current_user():
    return CurrentUser(id="test-user-id", email="test@example.com", role="parent")


@pytest.fixture
def client():
    """Create test client with mocked auth."""
    app.dependency_overrides[get_current_user] = mock_current_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def unauthenticated_client():
    """Create test client without auth override."""
    app.dependency_overrides.clear()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def mock_supabase():
    """Create mock Supabase client."""
    mock = MagicMock()
    # Chain mock for table().select().eq().execute() pattern
    mock_table = MagicMock()
    mock.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.update.return_value = mock_table
    mock_table.upsert.return_value = mock_table
    mock_table.delete.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.range.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.single.return_value = mock_table
    return mock


@pytest.fixture
def sample_child():
    return {
        "id": "child-1",
        "parent_user_id": "test-user-id",
        "first_name": "Emma",
        "last_name": "Test",
        "date_of_birth": "2024-06-15",
        "gender": "female",
        "premature_weeks": 0,
        "photo_url": None,
        "notes": None,
        "created_at": "2024-06-20T10:00:00Z",
        "updated_at": "2024-06-20T10:00:00Z",
    }


@pytest.fixture
def sample_assessment():
    return {
        "id": "assessment-1",
        "child_id": "child-1",
        "age_at_assessment": 12,
        "questionnaire_version": 12,
        "status": "completed",
        "completed_by": "parent",
        "started_at": "2025-06-15T10:00:00Z",
        "completed_at": "2025-06-15T10:30:00Z",
        "overall_risk_level": "typical",
        "notes": None,
    }


@pytest.fixture
def sample_domain_scores():
    return [
        {"domain": "communication", "raw_score": 50, "max_score": 60, "percentile": 80, "z_score": 0.84, "risk_level": "typical", "cutoff_score": 15, "monitoring_zone_cutoff": 25},
        {"domain": "gross_motor", "raw_score": 45, "max_score": 60, "percentile": 70, "z_score": 0.52, "risk_level": "typical", "cutoff_score": 20, "monitoring_zone_cutoff": 30},
        {"domain": "fine_motor", "raw_score": 40, "max_score": 60, "percentile": 55, "z_score": 0.13, "risk_level": "typical", "cutoff_score": 20, "monitoring_zone_cutoff": 30},
        {"domain": "problem_solving", "raw_score": 48, "max_score": 60, "percentile": 75, "z_score": 0.67, "risk_level": "typical", "cutoff_score": 20, "monitoring_zone_cutoff": 30},
        {"domain": "personal_social", "raw_score": 42, "max_score": 60, "percentile": 62, "z_score": 0.31, "risk_level": "typical", "cutoff_score": 15, "monitoring_zone_cutoff": 25},
    ]
