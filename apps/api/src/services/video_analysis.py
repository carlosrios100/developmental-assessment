"""Video analysis service using MediaPipe and AI."""
import os
import uuid
import subprocess
import tempfile
from datetime import datetime
from typing import Any

import cv2
import numpy as np
import mediapipe as mp
import librosa

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
from src.logging_config import get_logger

logger = get_logger(__name__)


class VideoAnalysisService:
    """Service for video upload, processing, and AI analysis."""

    def __init__(self):
        self.supabase = get_supabase_client()
        self.storage = get_storage_client()

        # Initialize MediaPipe
        self.mp_pose = mp.solutions.pose
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_hands = mp.solutions.hands

        logger.info("VideoAnalysisService initialized")

    # ------------------------------------------------------------------
    # Iris-based eye contact constants
    # ------------------------------------------------------------------
    # FaceMesh iris landmark indices
    LEFT_IRIS = [468, 469, 470, 471, 472]
    RIGHT_IRIS = [473, 474, 475, 476, 477]

    # Eye corner landmark indices
    LEFT_EYE_OUTER = 33
    LEFT_EYE_INNER = 133
    RIGHT_EYE_OUTER = 362
    RIGHT_EYE_INNER = 263

    async def upload_video(
        self,
        file_contents: bytes,
        filename: str,
        child_id: str,
        context: VideoContext,
        recorded_at: datetime,
        uploaded_by_user_id: str,
        assessment_id: str | None = None,
    ) -> dict:
        """Upload video to storage and create database record."""
        video_id = str(uuid.uuid4())
        storage_path = f"{child_id}/{video_id}/{filename}"

        logger.info(
            "Uploading video",
            extra={
                "video_id": video_id,
                "child_id": child_id,
                "filename": filename,
                "file_size": len(file_contents),
                "uploaded_by_user_id": uploaded_by_user_id,
            },
        )

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

        logger.info(
            "Video duration calculated",
            extra={"video_id": video_id, "duration": duration, "fps": fps},
        )

        # Create database record
        result = self.supabase.table("video_uploads").insert({
            "id": video_id,
            "child_id": child_id,
            "assessment_id": assessment_id,
            "uploaded_by_user_id": uploaded_by_user_id,
            "file_name": filename,
            "file_size": len(file_contents),
            "duration": duration,
            "context": context.value,
            "recorded_at": recorded_at.isoformat(),
            "storage_path": storage_path,
            "storage_url": storage_url,
            "processing_status": ProcessingStatus.PENDING.value,
        }).execute()

        logger.info("Video upload record created", extra={"video_id": video_id})

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

        logger.info(
            "Starting video processing",
            extra={
                "video_id": video_id,
                "child_age_months": child_age_months,
                "analysis_types": [t.value for t in analysis_types],
            },
        )

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
        Extracts audio for vocalization analysis.
        """
        start_time = datetime.utcnow()
        behaviors: list[DetectedBehavior] = []

        logger.info(
            "Beginning video analysis",
            extra={"video_id": video_id, "child_age_months": child_age_months},
        )

        try:
            # Download video to temp file
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(video_url)
                video_bytes = response.content

            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
                tmp.write(video_bytes)
                tmp_path = tmp.name

            logger.info(
                "Video downloaded for analysis",
                extra={"video_id": video_id, "size_bytes": len(video_bytes)},
            )

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
                "eye_contact_events": [],       # list of (start, end) tuples
                "_eye_contact_ongoing": False,
                "_eye_contact_start": None,
            }

            # Process frames
            frame_interval = max(1, int(fps / 5))  # Analyze 5 frames per second
            frame_idx = 0

            with self.mp_pose.Pose(min_detection_confidence=0.5) as pose:
                with self.mp_face_mesh.FaceMesh(
                    min_detection_confidence=0.5,
                    refine_landmarks=True,
                ) as face_mesh:
                    while cap.isOpened():
                        ret, frame = cap.read()
                        if not ret:
                            break

                        if frame_idx % frame_interval == 0:
                            # Convert to RGB
                            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                            timestamp = frame_idx / fps if fps > 0 else 0

                            # Pose analysis
                            pose_results = pose.process(rgb_frame)
                            if pose_results.pose_landmarks:
                                self._analyze_pose(
                                    pose_results,
                                    timestamp,
                                    movement_data,
                                    behaviors,
                                    analysis_types,
                                )

                            # Face analysis (iris-based eye contact)
                            face_results = face_mesh.process(rgb_frame)
                            if face_results.multi_face_landmarks:
                                self._analyze_face(
                                    face_results,
                                    timestamp,
                                    interaction_data,
                                    behaviors,
                                    analysis_types,
                                )

                            interaction_data["total_analyzed_frames"] += 1

                        frame_idx += 1

            cap.release()

            # Close any ongoing eye contact event
            if interaction_data["_eye_contact_ongoing"]:
                last_ts = (frame_idx - 1) / fps if fps > 0 else 0
                interaction_data["eye_contact_events"].append(
                    (interaction_data["_eye_contact_start"], last_ts)
                )

            logger.info(
                "Video frame analysis complete",
                extra={
                    "video_id": video_id,
                    "frames_analyzed": interaction_data["total_analyzed_frames"],
                    "eye_contact_frames": interaction_data["eye_contact_frames"],
                },
            )

            # ----- Audio analysis -----
            audio_data = self._analyze_audio(tmp_path, video_id)

            os.unlink(tmp_path)

            # Calculate final metrics
            movement_metrics = self._calculate_movement_metrics(movement_data)
            interaction_metrics = self._calculate_interaction_metrics(
                interaction_data, duration, audio_data
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

            logger.info(
                "Video analysis completed",
                extra={
                    "video_id": video_id,
                    "processing_time_ms": processing_time_ms,
                    "behaviors_detected": len(behaviors),
                    "confidence": confidence,
                },
            )

            return result

        except Exception as e:
            logger.error(
                "Video analysis failed",
                extra={"video_id": video_id, "error": str(e)},
                exc_info=True,
            )
            # Update video status with error
            self.supabase.table("video_uploads").update({
                "processing_status": ProcessingStatus.FAILED.value,
                "processing_error": str(e),
            }).eq("id", video_id).execute()
            raise

    # ------------------------------------------------------------------
    # Pose helpers
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # Face / iris-based eye contact helpers
    # ------------------------------------------------------------------

    def _analyze_face(
        self,
        face_results: Any,
        timestamp: float,
        interaction_data: dict,
        behaviors: list[DetectedBehavior],
        analysis_types: list[BehaviorType],
    ):
        """Analyze face mesh for eye contact using iris landmarks and expressions."""
        for face_landmarks in face_results.multi_face_landmarks:
            interaction_data["face_detections"].append(timestamp)

            if BehaviorType.EYE_CONTACT in analysis_types:
                is_forward_gaze = self._detect_forward_gaze(face_landmarks)

                if is_forward_gaze:
                    interaction_data["eye_contact_frames"] += 1

                    # Track eye contact duration events
                    if not interaction_data["_eye_contact_ongoing"]:
                        interaction_data["_eye_contact_ongoing"] = True
                        interaction_data["_eye_contact_start"] = timestamp

                    behaviors.append(DetectedBehavior(
                        type=BehaviorType.EYE_CONTACT,
                        start_time=timestamp,
                        end_time=timestamp + 0.2,
                        confidence=0.75,
                        description="Forward gaze / eye contact detected (iris-based)",
                        related_milestones=["communication", "personal_social"],
                    ))
                else:
                    # End an ongoing eye contact event
                    if interaction_data["_eye_contact_ongoing"]:
                        interaction_data["_eye_contact_ongoing"] = False
                        interaction_data["eye_contact_events"].append(
                            (interaction_data["_eye_contact_start"], timestamp)
                        )

    def _detect_forward_gaze(self, face_landmarks: Any) -> bool:
        """
        Determine whether the subject is looking roughly at the camera
        using iris center position relative to eye corners.

        Calculates the horizontal ratio of iris center within the eye opening.
        A ratio of ~0.5 means the iris is centered (forward gaze).
        Both eyes must have a ratio between 0.35 and 0.65.
        """
        lm = face_landmarks.landmark

        # --- Left eye (uses LEFT_IRIS landmarks 468-472) ---
        left_iris_x = np.mean([lm[i].x for i in self.LEFT_IRIS])
        left_outer_x = lm[self.LEFT_EYE_OUTER].x   # landmark 33
        left_inner_x = lm[self.LEFT_EYE_INNER].x   # landmark 133
        left_eye_width = left_inner_x - left_outer_x
        if abs(left_eye_width) < 1e-6:
            return False
        left_ratio = (left_iris_x - left_outer_x) / left_eye_width

        # --- Right eye (uses RIGHT_IRIS landmarks 473-477) ---
        right_iris_x = np.mean([lm[i].x for i in self.RIGHT_IRIS])
        right_outer_x = lm[self.RIGHT_EYE_OUTER].x  # landmark 362
        right_inner_x = lm[self.RIGHT_EYE_INNER].x  # landmark 263
        right_eye_width = right_inner_x - right_outer_x
        if abs(right_eye_width) < 1e-6:
            return False
        right_ratio = (right_iris_x - right_outer_x) / right_eye_width

        # Both irises should be centered (ratio ~0.5) for forward gaze
        left_centered = 0.35 <= left_ratio <= 0.65
        right_centered = 0.35 <= right_ratio <= 0.65

        return left_centered and right_centered

    # ------------------------------------------------------------------
    # Audio analysis helpers
    # ------------------------------------------------------------------

    def _analyze_audio(self, video_path: str, video_id: str) -> dict:
        """
        Extract audio from video and perform energy-based voice
        activity detection using librosa.

        Returns a dict with keys:
            - vocalizations: int (number of distinct vocal segments)
            - vocalization_duration: float (total seconds of voice activity)
        """
        audio_result: dict[str, Any] = {
            "vocalizations": 0,
            "vocalization_duration": 0.0,
        }

        wav_path = None
        try:
            # Extract audio to a temporary WAV file using ffmpeg
            wav_fd, wav_path = tempfile.mkstemp(suffix=".wav")
            os.close(wav_fd)

            ffmpeg_cmd = [
                "ffmpeg",
                "-y",
                "-i", video_path,
                "-vn",                  # no video
                "-acodec", "pcm_s16le", # PCM 16-bit
                "-ar", "16000",         # 16 kHz sample rate
                "-ac", "1",             # mono
                wav_path,
            ]

            logger.debug(
                "Extracting audio from video",
                extra={"video_id": video_id, "wav_path": wav_path},
            )

            proc = subprocess.run(
                ffmpeg_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=120,
            )

            if proc.returncode != 0:
                logger.warning(
                    "ffmpeg audio extraction failed",
                    extra={
                        "video_id": video_id,
                        "returncode": proc.returncode,
                        "stderr": proc.stderr.decode("utf-8", errors="replace")[:500],
                    },
                )
                return audio_result

            # Check that the wav file has content
            if not os.path.exists(wav_path) or os.path.getsize(wav_path) == 0:
                logger.warning(
                    "Extracted audio file is empty or missing",
                    extra={"video_id": video_id},
                )
                return audio_result

            # Load audio with librosa
            y, sr = librosa.load(wav_path, sr=16000, mono=True)

            if len(y) == 0:
                logger.info(
                    "Audio track is empty after loading",
                    extra={"video_id": video_id},
                )
                return audio_result

            # Compute RMS energy
            hop_length = 512
            rms = librosa.feature.rms(y=y, hop_length=hop_length)[0]

            # Dynamic threshold: use median + 1.5 * std as voice activity threshold
            rms_median = np.median(rms)
            rms_std = np.std(rms)
            threshold = rms_median + 1.5 * rms_std

            # Minimum threshold to avoid pure-silence videos triggering
            threshold = max(threshold, 0.01)

            # Boolean mask of frames above threshold
            voice_active = rms > threshold

            # Convert frame indices to time
            frame_duration = hop_length / sr  # duration of each RMS frame in seconds

            # Count distinct vocalization segments (contiguous runs of True)
            vocalization_count = 0
            total_vocal_duration = 0.0
            in_segment = False

            for i, active in enumerate(voice_active):
                if active and not in_segment:
                    in_segment = True
                    segment_start = i
                    vocalization_count += 1
                elif not active and in_segment:
                    in_segment = False
                    segment_length = (i - segment_start) * frame_duration
                    total_vocal_duration += segment_length

            # Close a final open segment
            if in_segment:
                segment_length = (len(voice_active) - segment_start) * frame_duration
                total_vocal_duration += segment_length

            audio_result["vocalizations"] = vocalization_count
            audio_result["vocalization_duration"] = round(total_vocal_duration, 2)

            logger.info(
                "Audio analysis complete",
                extra={
                    "video_id": video_id,
                    "vocalizations": vocalization_count,
                    "vocalization_duration": audio_result["vocalization_duration"],
                    "rms_threshold": float(threshold),
                },
            )

        except FileNotFoundError:
            logger.warning(
                "ffmpeg not found on system PATH; skipping audio analysis",
                extra={"video_id": video_id},
            )
        except Exception as e:
            logger.error(
                "Audio analysis error",
                extra={"video_id": video_id, "error": str(e)},
                exc_info=True,
            )
        finally:
            if wav_path and os.path.exists(wav_path):
                os.unlink(wav_path)

        return audio_result

    # ------------------------------------------------------------------
    # Movement helpers
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # Metrics calculation
    # ------------------------------------------------------------------

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
        self,
        interaction_data: dict,
        duration: float,
        audio_data: dict | None = None,
    ) -> InteractionMetrics:
        """Calculate final interaction metrics including audio-derived data."""
        total_frames = interaction_data.get("total_analyzed_frames", 1)
        eye_contact_frames = interaction_data.get("eye_contact_frames", 0)

        # Compute eye contact duration from tracked events
        eye_contact_events = interaction_data.get("eye_contact_events", [])
        eye_contact_duration = sum(
            (end - start) for start, end in eye_contact_events
        )
        # Fallback: if no events were closed but frames were counted, approximate
        if eye_contact_duration == 0 and eye_contact_frames > 0:
            eye_contact_duration = eye_contact_frames * 0.2

        eye_contact_pct = eye_contact_frames / total_frames if total_frames > 0 else 0

        # Audio metrics
        vocalizations = 0
        vocalization_duration = 0.0
        if audio_data:
            vocalizations = audio_data.get("vocalizations", 0)
            vocalization_duration = audio_data.get("vocalization_duration", 0.0)

        return InteractionMetrics(
            eye_contact_duration=eye_contact_duration,
            eye_contact_percentage=eye_contact_pct * 100,
            joint_attention_episodes=len(interaction_data.get("face_detections", [])) // 10,
            vocalizations=vocalizations,
            vocalization_duration=vocalization_duration,
            positive_affect_instances=0,
            responsiveness_to_cues=0.5,
            turn_taking_instances=0,
            proximity_to_caregiver=0,
        )

    # ------------------------------------------------------------------
    # Persistence helpers
    # ------------------------------------------------------------------

    async def _save_analysis_result(
        self, video_id: str, result: VideoAnalysisResult
    ):
        """Save analysis result to database."""
        logger.info("Saving analysis result", extra={"video_id": video_id})

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

        logger.info(
            "Analysis result saved",
            extra={
                "video_id": video_id,
                "analysis_id": analysis_id,
                "behavior_count": len(result.behaviors),
            },
        )

    # ------------------------------------------------------------------
    # Query helpers
    # ------------------------------------------------------------------

    async def get_processing_status(self, video_id: str) -> VideoProcessingStatus | None:
        """Get current processing status for a video."""
        logger.debug("Fetching processing status", extra={"video_id": video_id})

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
        logger.debug("Fetching analysis result", extra={"video_id": video_id})

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
        logger.debug(
            "Fetching videos by child",
            extra={"child_id": child_id, "limit": limit, "offset": offset},
        )

        result = self.supabase.table("video_uploads").select("*").eq(
            "child_id", child_id
        ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()

        return result.data

    async def delete_video(self, video_id: str):
        """Delete video and associated data."""
        logger.info("Deleting video", extra={"video_id": video_id})

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

        logger.info("Video deleted", extra={"video_id": video_id})
