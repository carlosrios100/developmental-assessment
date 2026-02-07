"""Tests for video endpoints."""
import io
import sys
from unittest.mock import patch, MagicMock

import numpy as np
import pytest


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
    from src.main import app
    from src.routers.video import get_video_service

    mock_service = MagicMock()
    mock_service.get_processing_status = MagicMock(return_value=None)

    # Make it an async function
    async def mock_get_status(video_id):
        return None

    mock_service.get_processing_status = mock_get_status

    app.dependency_overrides[get_video_service] = lambda: mock_service
    try:
        response = client.get("/api/v1/video/status/nonexistent-id")
        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_video_service, None)


def test_delete_video(client):
    """Test deleting a video."""
    from src.main import app
    from src.routers.video import get_video_service

    mock_service = MagicMock()

    # Make it an async function
    async def mock_delete(video_id):
        return None

    mock_service.delete_video = mock_delete

    app.dependency_overrides[get_video_service] = lambda: mock_service
    try:
        response = client.delete("/api/v1/video/vid-1")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"
    finally:
        app.dependency_overrides.pop(get_video_service, None)


# ------------------------------------------------------------------
# Unit tests for video analysis helper methods
# ------------------------------------------------------------------


@pytest.fixture
def video_service():
    """Create a VideoAnalysisService with mocked dependencies."""
    # Mock the xhtml2pdf import that report_generator needs
    sys.modules['xhtml2pdf'] = MagicMock()
    sys.modules['xhtml2pdf.pisa'] = MagicMock()

    with patch("src.services.video_analysis.get_supabase_client"):
        with patch("src.services.video_analysis.get_storage_client"):
            from src.services.video_analysis import VideoAnalysisService
            service = VideoAnalysisService()
    return service


class TestDetectSmile:
    """Tests for _detect_smile method."""

    def test_detect_smile_with_wide_corners_up(self, video_service):
        """Smile detected when mouth is wide and corners elevated."""
        mock_landmarks = MagicMock()
        # Set up landmarks for a smile
        # Mouth corners (61, 291)
        mock_landmarks.landmark = [MagicMock() for _ in range(500)]

        # Left corner (61) - elevated
        mock_landmarks.landmark[61].x = 0.35
        mock_landmarks.landmark[61].y = 0.48

        # Right corner (291) - elevated
        mock_landmarks.landmark[291].x = 0.65
        mock_landmarks.landmark[291].y = 0.48

        # Upper lip (13)
        mock_landmarks.landmark[13].y = 0.50

        # Lower lip (14)
        mock_landmarks.landmark[14].y = 0.52

        # Eye corners for face width reference
        mock_landmarks.landmark[33].x = 0.25   # LEFT_EYE_OUTER
        mock_landmarks.landmark[362].x = 0.75  # RIGHT_EYE_OUTER

        result = video_service._detect_smile(mock_landmarks)
        assert result is True

    def test_detect_smile_neutral_face(self, video_service):
        """No smile detected for neutral expression."""
        mock_landmarks = MagicMock()
        mock_landmarks.landmark = [MagicMock() for _ in range(500)]

        # Narrow mouth, corners not elevated
        mock_landmarks.landmark[61].x = 0.42
        mock_landmarks.landmark[61].y = 0.51

        mock_landmarks.landmark[291].x = 0.58
        mock_landmarks.landmark[291].y = 0.51

        mock_landmarks.landmark[13].y = 0.50
        mock_landmarks.landmark[14].y = 0.52

        mock_landmarks.landmark[33].x = 0.25
        mock_landmarks.landmark[362].x = 0.75

        result = video_service._detect_smile(mock_landmarks)
        assert result is False


class TestBilateralCoordination:
    """Tests for _calculate_bilateral_coordination method."""

    def test_bilateral_coordination_symmetric_movement(self, video_service):
        """High score for symmetric limb movements."""
        # Create position data with symmetric movements
        positions_left = [
            (0.0, np.array([0.3, 0.5])),
            (0.2, np.array([0.32, 0.52])),
            (0.4, np.array([0.34, 0.54])),
            (0.6, np.array([0.32, 0.52])),
            (0.8, np.array([0.3, 0.5])),
        ]
        positions_right = [
            (0.0, np.array([0.7, 0.5])),
            (0.2, np.array([0.68, 0.52])),
            (0.4, np.array([0.66, 0.54])),
            (0.6, np.array([0.68, 0.52])),
            (0.8, np.array([0.7, 0.5])),
        ]

        movement_data = {
            "left_wrist_positions": positions_left,
            "right_wrist_positions": positions_right,
            "left_ankle_positions": positions_left,
            "right_ankle_positions": positions_right,
        }

        score = video_service._calculate_bilateral_coordination(movement_data)
        assert 0.0 <= score <= 1.0
        assert score > 0.5  # Should be high for symmetric movement

    def test_bilateral_coordination_insufficient_data(self, video_service):
        """Returns neutral score when insufficient data."""
        movement_data = {
            "left_wrist_positions": [(0.0, np.array([0.3, 0.5]))],
            "right_wrist_positions": [(0.0, np.array([0.7, 0.5]))],
            "left_ankle_positions": [],
            "right_ankle_positions": [],
        }

        score = video_service._calculate_bilateral_coordination(movement_data)
        assert score == 0.5


class TestEstimateTurnTaking:
    """Tests for _estimate_turn_taking method."""

    def test_turn_taking_with_gaps(self, video_service):
        """Detects turn-taking from vocalization patterns with gaps."""
        # Vocalizations with 1-2 second gaps (suggesting turn-taking)
        segments = [
            (0.0, 1.5),   # First vocalization
            (3.0, 4.0),   # Gap of 1.5s - potential turn-taking
            (6.5, 7.5),   # Gap of 2.5s - potential turn-taking
        ]

        count = video_service._estimate_turn_taking(segments)
        assert count == 2

    def test_turn_taking_no_gaps(self, video_service):
        """No turn-taking when vocalizations are continuous."""
        # Continuous vocalizations with short gaps
        segments = [
            (0.0, 1.0),
            (1.2, 2.0),  # Gap too short (0.2s)
            (2.3, 3.0),  # Gap too short (0.3s)
        ]

        count = video_service._estimate_turn_taking(segments)
        assert count == 0

    def test_turn_taking_gaps_too_long(self, video_service):
        """No turn-taking when gaps are too long."""
        segments = [
            (0.0, 1.0),
            (8.0, 9.0),   # Gap too long (7s)
            (16.0, 17.0), # Gap too long (7s)
        ]

        count = video_service._estimate_turn_taking(segments)
        assert count == 0

    def test_turn_taking_single_segment(self, video_service):
        """Returns 0 for single vocalization segment."""
        segments = [(0.0, 2.0)]
        count = video_service._estimate_turn_taking(segments)
        assert count == 0


class TestResponsivenessProxy:
    """Tests for _calculate_responsiveness_proxy method."""

    def test_responsiveness_with_activity(self, video_service):
        """Non-zero score when gaze shifts and movement onsets present."""
        interaction_data = {
            "gaze_shifts": [0.5, 1.2, 2.0, 3.5, 5.0, 6.2, 8.0, 9.5],
            "movement_onsets": [1.0, 3.0, 5.5, 8.5],
        }
        duration = 60.0  # 1 minute

        score = video_service._calculate_responsiveness_proxy(
            interaction_data, duration
        )
        assert 0.0 <= score <= 1.0
        assert score > 0.0

    def test_responsiveness_no_activity(self, video_service):
        """Low score when no behavioral changes detected."""
        interaction_data = {
            "gaze_shifts": [],
            "movement_onsets": [],
        }
        duration = 60.0

        score = video_service._calculate_responsiveness_proxy(
            interaction_data, duration
        )
        assert score == 0.0

    def test_responsiveness_zero_duration(self, video_service):
        """Returns neutral score for zero duration."""
        interaction_data = {
            "gaze_shifts": [0.5],
            "movement_onsets": [1.0],
        }
        score = video_service._calculate_responsiveness_proxy(
            interaction_data, 0.0
        )
        assert score == 0.5


class TestMidlineCrossing:
    """Tests for midline crossing detection."""

    def test_movement_metrics_with_crossings(self, video_service):
        """crossing_midline is True when crossings detected."""
        movement_data = {
            "velocities": [0.01, 0.02, 0.01],
            "midline_crossings": [(1.0, "left_wrist_right")],
            "left_wrist_positions": [],
            "right_wrist_positions": [],
            "left_ankle_positions": [],
            "right_ankle_positions": [],
        }

        metrics = video_service._calculate_movement_metrics(movement_data)
        assert metrics.crossing_midline is True

    def test_movement_metrics_no_crossings(self, video_service):
        """crossing_midline is False when no crossings detected."""
        movement_data = {
            "velocities": [0.01, 0.02, 0.01],
            "midline_crossings": [],
            "left_wrist_positions": [],
            "right_wrist_positions": [],
            "left_ankle_positions": [],
            "right_ankle_positions": [],
        }

        metrics = video_service._calculate_movement_metrics(movement_data)
        assert metrics.crossing_midline is False
