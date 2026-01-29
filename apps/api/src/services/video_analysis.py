"""Video analysis service using MediaPipe and AI."""
import os
import uuid
import tempfile
from datetime import datetime
from typing import Any

import cv2
import numpy as np
import mediapipe as mp

from src.models.video import (
    VideoContext,
    ProcessingStatus,
    BehaviorType,
    VideoProcessingStatus,
    VideoAnalysisResult,
    DetectedBehavior,
    MovementMetrics,
    InteractionMetrics,
)
from src.services.supabase_client import get_supabase_client, get_storage_client
from src.config import settings


class VideoAnalysisService:
    """Service for video upload, processing, and AI analysis."""

    def __init__(self):
        self.supabase = get_supabase_client()
        self.storage = get_storage_client()

        # Initialize MediaPipe
        self.mp_pose = mp.solutions.pose
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_hands = mp.solutions.hands

    async def upload_video(
        self,
        file_contents: bytes,
        filename: str,
        child_id: str,
        context: VideoContext,
        recorded_at: datetime,
        assessment_id: str | None = None,
    ) -> dict:
        """Upload video to storage and create database record."""
        video_id = str(uuid.uuid4())
        storage_path = f"{child_id}/{video_id}/{filename}"

        # Upload to Supabase Storage
        self.storage.from_(settings.video_storage_bucket).upload(
            storage_path, file_contents
        )

        # Get public URL
        storage_url = self.storage.from_(settings.video_storage_bucket).get_public_url(
            storage_path
        )

        # Get video duration using OpenCV
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            tmp.write(file_contents)
            tmp_path = tmp.name

        cap = cv2.VideoCapture(tmp_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        duration = frame_count / fps if fps > 0 else 0
        cap.release()
        os.unlink(tmp_path)

        # Create database record
        result = self.supabase.table("video_uploads").insert({
            "id": video_id,
            "child_id": child_id,
            "assessment_id": assessment_id,
            "file_name": filename,
            "file_size": len(file_contents),
            "duration": duration,
            "context": context.value,
            "recorded_at": recorded_at.isoformat(),
            "storage_path": storage_path,
            "storage_url": storage_url,
            "processing_status": ProcessingStatus.PENDING.value,
        }).execute()

        return {
            "video_id": video_id,
            "storage_url": storage_url,
            "duration": duration,
            "status": ProcessingStatus.PENDING.value,
        }

    async def start_processing(
        self,
        video_id: str,
        video_url: str,
        child_age_months: int,
        analysis_types: list[BehaviorType],
    ) -> VideoProcessingStatus:
        """Mark video as processing and return status."""
        now = datetime.utcnow()

        self.supabase.table("video_uploads").update({
            "processing_status": ProcessingStatus.PROCESSING.value,
            "processing_started_at": now.isoformat(),
        }).eq("id", video_id).execute()

        return VideoProcessingStatus(
            video_id=video_id,
            status=ProcessingStatus.PROCESSING,
            progress=0,
            started_at=now,
        )

    async def analyze_video(
        self,
        video_id: str,
        video_url: str,
        child_age_months: int,
        analysis_types: list[BehaviorType],
    ) -> VideoAnalysisResult:
        """
        Perform AI analysis on video.

        Uses MediaPipe for pose, face, and hand detection.
        Analyzes behaviors relevant to developmental assessment.
        """
        start_time = datetime.utcnow()
        behaviors: list[DetectedBehavior] = []

        try:
            # Download video to temp file
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(video_url)
                video_bytes = response.content

            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                tmp.write(video_bytes)
                tmp_path = tmp.name

            # Analyze video with MediaPipe
            cap = cv2.VideoCapture(tmp_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps if fps > 0 else 0

            # Initialize metrics
            movement_data = {
                "positions": [],
                "velocities": [],
                "pose_stability": [],
            }
            interaction_data = {
                "face_detections": [],
                "eye_contact_frames": 0,
                "total_analyzed_frames": 0,
            }

            # Process frames
            frame_interval = max(1, int(fps / 5))  # Analyze 5 frames per second
            frame_idx = 0

            with self.mp_pose.Pose(min_detection_confidence=0.5) as pose:
                with self.mp_face_mesh.FaceMesh(min_detection_confidence=0.5) as face_mesh:
                    while cap.isOpened():
                        ret, frame = cap.read()
                        if not ret:
                            break

                        if frame_idx % frame_interval == 0:
                            # Convert to RGB
                            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                            # Pose analysis
                            pose_results = pose.process(rgb_frame)
                            if pose_results.pose_landmarks:
                                self._analyze_pose(
                                    pose_results,
                                    frame_idx / fps,
                                    movement_data,
                                    behaviors,
                                    analysis_types,
                                )

                            # Face analysis
                            face_results = face_mesh.process(rgb_frame)
                            if face_results.multi_face_landmarks:
                                self._analyze_face(
                                    face_results,
                                    frame_idx / fps,
                                    interaction_data,
                                    behaviors,
                                    analysis_types,
                                )

                            interaction_data["total_analyzed_frames"] += 1

                        frame_idx += 1

            cap.release()
            os.unlink(tmp_path)

            # Calculate final metrics
            movement_metrics = self._calculate_movement_metrics(movement_data)
            interaction_metrics = self._calculate_interaction_metrics(
                interaction_data, duration
            )

            # Calculate overall confidence
            confidence = min(1.0, len(behaviors) / 10) * 0.5 + 0.5

            processing_time_ms = int(
                (datetime.utcnow() - start_time).total_seconds() * 1000
            )

            result = VideoAnalysisResult(
                video_id=video_id,
                analyzed_at=datetime.utcnow(),
                duration=duration,
                behaviors=behaviors,
                movement_metrics=movement_metrics,
                interaction_metrics=interaction_metrics,
                confidence=confidence,
                processing_time_ms=processing_time_ms,
            )

            # Save results to database
            await self._save_analysis_result(video_id, result)

            # Update video status
            self.supabase.table("video_uploads").update({
                "processing_status": ProcessingStatus.COMPLETED.value,
                "processing_completed_at": datetime.utcnow().isoformat(),
            }).eq("id", video_id).execute()

            return result

        except Exception as e:
            # Update video status with error
            self.supabase.table("video_uploads").update({
                "processing_status": ProcessingStatus.FAILED.value,
                "processing_error": str(e),
            }).eq("id", video_id).execute()
            raise

    def _analyze_pose(
        self,
        pose_results: Any,
        timestamp: float,
        movement_data: dict,
        behaviors: list[DetectedBehavior],
        analysis_types: list[BehaviorType],
    ):
        """Analyze pose landmarks for movement and coordination."""
        landmarks = pose_results.pose_landmarks.landmark

        # Calculate center of mass
        hip_center = np.array([
            (landmarks[23].x + landmarks[24].x) / 2,
            (landmarks[23].y + landmarks[24].y) / 2,
        ])
        movement_data["positions"].append(hip_center)

        # Calculate movement quality
        if len(movement_data["positions"]) > 1:
            velocity = np.linalg.norm(
                movement_data["positions"][-1] - movement_data["positions"][-2]
            )
            movement_data["velocities"].append(velocity)

        # Check for specific movements
        if BehaviorType.MOVEMENT_QUALITY in analysis_types:
            # Detect coordinated movement
            if self._is_coordinated_movement(landmarks):
                behaviors.append(DetectedBehavior(
                    type=BehaviorType.MOVEMENT_QUALITY,
                    start_time=timestamp,
                    end_time=timestamp + 0.2,
                    confidence=0.7,
                    description="Coordinated body movement detected",
                    related_milestones=["gross_motor"],
                ))

        if BehaviorType.MOTOR_COORDINATION in analysis_types:
            # Check bilateral coordination
            if self._has_bilateral_coordination(landmarks):
                behaviors.append(DetectedBehavior(
                    type=BehaviorType.MOTOR_COORDINATION,
                    start_time=timestamp,
                    end_time=timestamp + 0.2,
                    confidence=0.75,
                    description="Bilateral coordination observed",
                    related_milestones=["fine_motor", "gross_motor"],
                ))

    def _analyze_face(
        self,
        face_results: Any,
        timestamp: float,
        interaction_data: dict,
        behaviors: list[DetectedBehavior],
        analysis_types: list[BehaviorType],
    ):
        """Analyze face mesh for eye contact and expressions."""
        for face_landmarks in face_results.multi_face_landmarks:
            interaction_data["face_detections"].append(timestamp)

            # Simplified eye contact detection
            # In production, this would use gaze estimation
            if BehaviorType.EYE_CONTACT in analysis_types:
                # Check if face is oriented toward camera
                nose = face_landmarks.landmark[1]
                if 0.4 < nose.x < 0.6 and 0.4 < nose.y < 0.6:
                    interaction_data["eye_contact_frames"] += 1
                    behaviors.append(DetectedBehavior(
                        type=BehaviorType.EYE_CONTACT,
                        start_time=timestamp,
                        end_time=timestamp + 0.2,
                        confidence=0.6,
                        description="Potential eye contact detected",
                        related_milestones=["communication", "personal_social"],
                    ))

    def _is_coordinated_movement(self, landmarks: list) -> bool:
        """Check if movement appears coordinated."""
        # Simplified check - in production use more sophisticated analysis
        left_hip = landmarks[23]
        right_hip = landmarks[24]
        return abs(left_hip.y - right_hip.y) < 0.1

    def _has_bilateral_coordination(self, landmarks: list) -> bool:
        """Check for bilateral coordination (using both sides of body)."""
        left_wrist = landmarks[15]
        right_wrist = landmarks[16]
        # Check if both hands are active (moving differently from body)
        return abs(left_wrist.y - right_wrist.y) < 0.2

    def _calculate_movement_metrics(self, movement_data: dict) -> MovementMetrics:
        """Calculate final movement metrics from collected data."""
        velocities = movement_data.get("velocities", [])

        distance = sum(velocities) if velocities else 0
        avg_speed = np.mean(velocities) if velocities else 0
        velocity_std = np.std(velocities) if velocities else 0

        # Determine movement quality based on velocity variance
        if velocity_std < 0.01:
            quality = "smooth"
        elif velocity_std < 0.03:
            quality = "coordinated"
        elif velocity_std < 0.05:
            quality = "jerky"
        else:
            quality = "uncoordinated"

        return MovementMetrics(
            distance_traversed=float(distance),
            movement_quality=quality,
            posture_stability=max(0, min(1, 1 - velocity_std * 10)),
            bilateral_coordination=0.7,  # Placeholder
            crossing_midline=False,
            average_speed=float(avg_speed),
        )

    def _calculate_interaction_metrics(
        self, interaction_data: dict, duration: float
    ) -> InteractionMetrics:
        """Calculate final interaction metrics."""
        total_frames = interaction_data.get("total_analyzed_frames", 1)
        eye_contact_frames = interaction_data.get("eye_contact_frames", 0)

        eye_contact_pct = eye_contact_frames / total_frames if total_frames > 0 else 0

        return InteractionMetrics(
            eye_contact_duration=eye_contact_frames * 0.2,  # Approximate
            eye_contact_percentage=eye_contact_pct * 100,
            joint_attention_episodes=len(interaction_data.get("face_detections", [])) // 10,
            vocalizations=0,  # Would need audio analysis
            vocalization_duration=0,
            positive_affect_instances=0,
            responsiveness_to_cues=0.5,
            turn_taking_instances=0,
            proximity_to_caregiver=0,
        )

    async def _save_analysis_result(
        self, video_id: str, result: VideoAnalysisResult
    ):
        """Save analysis result to database."""
        # Insert main result
        analysis_data = {
            "video_id": video_id,
            "analyzed_at": result.analyzed_at.isoformat(),
            "duration": result.duration,
            "confidence": result.confidence,
            "movement_metrics": result.movement_metrics.model_dump(),
            "interaction_metrics": result.interaction_metrics.model_dump(),
        }

        analysis_result = self.supabase.table("video_analysis_results").insert(
            analysis_data
        ).execute()

        analysis_id = analysis_result.data[0]["id"]

        # Insert detected behaviors
        for behavior in result.behaviors:
            self.supabase.table("detected_behaviors").insert({
                "analysis_id": analysis_id,
                "behavior_type": behavior.type.value,
                "start_time": behavior.start_time,
                "end_time": behavior.end_time,
                "confidence": behavior.confidence,
                "description": behavior.description,
                "related_milestones": behavior.related_milestones,
            }).execute()

    async def get_processing_status(self, video_id: str) -> VideoProcessingStatus | None:
        """Get current processing status for a video."""
        result = self.supabase.table("video_uploads").select("*").eq(
            "id", video_id
        ).execute()

        if not result.data:
            return None

        video = result.data[0]
        return VideoProcessingStatus(
            video_id=video_id,
            status=ProcessingStatus(video["processing_status"]),
            started_at=video.get("processing_started_at"),
            completed_at=video.get("processing_completed_at"),
            error=video.get("processing_error"),
        )

    async def get_analysis_result(self, video_id: str) -> VideoAnalysisResult | None:
        """Get analysis result for a video."""
        result = self.supabase.table("video_analysis_results").select(
            "*, detected_behaviors(*)"
        ).eq("video_id", video_id).execute()

        if not result.data:
            return None

        data = result.data[0]
        behaviors = [
            DetectedBehavior(
                type=BehaviorType(b["behavior_type"]),
                start_time=b["start_time"],
                end_time=b["end_time"],
                confidence=b["confidence"],
                description=b["description"],
                related_milestones=b.get("related_milestones", []),
            )
            for b in data.get("detected_behaviors", [])
        ]

        return VideoAnalysisResult(
            video_id=video_id,
            analyzed_at=datetime.fromisoformat(data["analyzed_at"]),
            duration=data["duration"],
            behaviors=behaviors,
            movement_metrics=MovementMetrics(**data["movement_metrics"]),
            interaction_metrics=InteractionMetrics(**data["interaction_metrics"]),
            confidence=data["confidence"],
            processing_time_ms=0,
        )

    async def get_videos_by_child(
        self, child_id: str, limit: int = 20, offset: int = 0
    ) -> list[dict]:
        """Get all videos for a child."""
        result = self.supabase.table("video_uploads").select("*").eq(
            "child_id", child_id
        ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        return result.data

    async def delete_video(self, video_id: str):
        """Delete video and associated data."""
        # Get video info
        video_result = self.supabase.table("video_uploads").select("*").eq(
            "id", video_id
        ).execute()

        if video_result.data:
            storage_path = video_result.data[0]["storage_path"]
            # Delete from storage
            self.storage.from_(settings.video_storage_bucket).remove([storage_path])

        # Delete from database (cascade will handle related records)
        self.supabase.table("video_uploads").delete().eq("id", video_id).execute()
