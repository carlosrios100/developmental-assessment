"""Tests for video endpoints."""
import io
from unittest.mock import patch, MagicMock


def test_upload_video_requires_video_content_type(client):
    """Test that upload rejects non-video files."""
    response = client.post(
        "/api/v1/video/upload",
        files={"file": ("test.txt", io.BytesIO(b"not a video"), "text/plain")},
        data={
            "child_id": "child-1",
            "context": "free_play",
            "recorded_at": "2025-01-15T10:00:00Z",
        },
    )
    assert response.status_code == 400
    assert "video" in response.json()["detail"].lower()


def test_upload_video_size_limit(client):
    """Test that upload rejects files exceeding 500MB."""
    # Create a small file that claims to be video
    large_content = b"0" * (501 * 1024 * 1024)  # 501MB
    response = client.post(
        "/api/v1/video/upload",
        files={"file": ("test.mp4", io.BytesIO(large_content), "video/mp4")},
        data={
            "child_id": "child-1",
            "context": "free_play",
            "recorded_at": "2025-01-15T10:00:00Z",
        },
    )
    assert response.status_code == 400
    assert "500MB" in response.json()["detail"]


def test_get_processing_status_not_found(client):
    """Test getting status for non-existent video."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[])

    with patch("src.services.video_analysis.get_supabase_client", return_value=mock_supabase):
        response = client.get("/api/v1/video/status/nonexistent-id")

    assert response.status_code == 404


def test_delete_video(client):
    """Test deleting a video."""
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.delete.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[{"storage_path": "child-1/vid-1/test.mp4"}])

    mock_storage = MagicMock()
    mock_storage.from_.return_value = mock_storage

    with patch("src.services.video_analysis.get_supabase_client", return_value=mock_supabase):
        with patch("src.services.video_analysis.get_storage_client", return_value=mock_storage):
            response = client.delete("/api/v1/video/vid-1")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "deleted"
