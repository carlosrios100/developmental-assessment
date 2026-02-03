"""Tests for authentication middleware."""


def test_protected_endpoint_without_auth(unauthenticated_client):
    """Test that protected endpoints return 401 without auth."""
    # The unauthenticated client doesn't override the auth dependency
    # FastAPI will try to use the real auth which requires a valid token
    response = unauthenticated_client.get("/api/v1/assessment/child/test-child-id")
    assert response.status_code in (401, 403)


def test_protected_endpoint_with_auth(client):
    """Test that protected endpoints work with valid auth."""
    # The client fixture overrides auth, so endpoints should not return 401
    # They may return other errors (404, 500) but not auth errors
    response = client.get("/api/v1/assessment/child/test-child-id")
    assert response.status_code != 401
