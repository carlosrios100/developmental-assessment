"""Video analysis router."""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks, Depends
from datetime import datetime

from src.models.video import (
    VideoUploadRequest,
    VideoProcessingRequest,
    VideoProcessingStatus,
    VideoAnalysisResult,
    VideoContext,
    ProcessingStatus,
    BehaviorType,
)
from src.services.video_analysis import VideoAnalysisService
from src.middleware.auth import get_current_user, CurrentUser

router = APIRouter()
video_service = VideoAnalysisService()


@router.post("/upload", response_model=dict)
async def upload_video(
    current_user: CurrentUser = Depends(get_current_user),
    file: UploadFile = File(...),
    child_id: str = Form(...),
    context: VideoContext = Form(...),
    recorded_at: datetime = Form(...),
    assessment_id: str | None = Form(None),
):
    """
    Upload a video for analysis.

    - Validates video format and size
    - Stores video in Supabase Storage
    - Creates video record in database
    - Returns video ID for tracking
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")

    # Validate file size (500MB max)
    max_size = 500 * 1024 * 1024
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="File size exceeds 500MB limit")

    try:
        result = await video_service.upload_video(
            file_contents=contents,
            filename=file.filename or "video.mp4",
            child_id=child_id,
            context=context,
            recorded_at=recorded_at,
            assessment_id=assessment_id,
            uploaded_by_user_id=current_user.id,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process", response_model=VideoProcessingStatus)
async def process_video(
    request: VideoProcessingRequest,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Start video processing and analysis.

    - Queues video for AI analysis
    - Returns processing status
    - Analysis runs in background
    """
    try:
        # Start background processing
        status = await video_service.start_processing(
            video_id=request.video_id,
            video_url=request.video_url,
            child_age_months=request.child_age_months,
            analysis_types=request.analysis_types,
        )

        # Queue actual processing in background
        background_tasks.add_task(
            video_service.analyze_video,
            request.video_id,
            request.video_url,
            request.child_age_months,
            request.analysis_types,
        )

        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{video_id}", response_model=VideoProcessingStatus)
async def get_processing_status(
    video_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get video processing status."""
    try:
        status = await video_service.get_processing_status(video_id)
        if not status:
            raise HTTPException(status_code=404, detail="Video not found")
        return status
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/result/{video_id}", response_model=VideoAnalysisResult)
async def get_analysis_result(
    video_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get video analysis result."""
    try:
        result = await video_service.get_analysis_result(video_id)
        if not result:
            raise HTTPException(status_code=404, detail="Analysis result not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/child/{child_id}", response_model=list[dict])
async def get_child_videos(
    child_id: str,
    limit: int = 20,
    offset: int = 0,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Get all videos for a child."""
    try:
        videos = await video_service.get_videos_by_child(child_id, limit, offset)
        return videos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete a video and its analysis results."""
    try:
        await video_service.delete_video(video_id)
        return {"status": "deleted", "video_id": video_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
