"""Tests for health check endpoint."""


def test_health_check(client):
    """Test the health check endpoint returns 200."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_health_db_check(client):
    """Test the DB health check endpoint."""
    response = client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("connected", "error")
    assert "database" in data


def test_health_config_check(client):
    """Test the config health check endpoint."""
    response = client.get("/health/config")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ok", "missing_config")
    assert "checks" in data
    assert "supabase_url" in data["checks"]
    assert "anthropic_api_key" in data["checks"]


def test_readiness_check(client):
    """Test the readiness check endpoint."""
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ready", "not_ready")


def test_root_endpoint(client):
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
