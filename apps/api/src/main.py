"""
DevAssess API - AI-powered developmental assessment video analysis
"""
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from src.routers import video, assessment, reports, health
from src.routers import cognitive, behavioral, context, mosaic, analytics
from src.config import settings
from src.logging_config import setup_logging, get_logger

STATIC_DIR = Path(__file__).parent.parent / "static"

try:
    from src.routers import test_video
except ImportError:
    test_video = None

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    setup_logging()
    logger.info("Starting DevAssess API v%s (env=%s)", settings.version, settings.environment)
    yield
    logger.info("Shutting down DevAssess API")


app = FastAPI(
    title="DevAssess API",
    description="AI-powered video analysis API for developmental assessment",
    version=settings.version,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log request method, path, and response time."""
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s -> %d (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(video.router, prefix="/api/v1/video", tags=["Video Analysis"])
app.include_router(assessment.router, prefix="/api/v1/assessment", tags=["Assessment"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])

# Test router (NO AUTH) - only available in development
if test_video is not None:
    app.include_router(test_video.router, prefix="/api/v1/test", tags=["Test (No Auth)"])

# Mosaic Protocol routers
app.include_router(cognitive.router, prefix="/api/v1/cognitive", tags=["Cognitive Assessment"])
app.include_router(behavioral.router, prefix="/api/v1/behavioral", tags=["Behavioral Assessment"])
app.include_router(context.router, prefix="/api/v1/context", tags=["Context & Consent"])
app.include_router(mosaic.router, prefix="/api/v1/mosaic", tags=["Mosaic Protocol"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["District Analytics"])


@app.get("/")
async def root():
    """Root endpoint - serve test UI or basic info."""
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"name": "DevAssess API", "version": settings.version}


@app.get("/api")
async def api_info():
    """API info endpoint."""
    return {
        "name": "DevAssess API",
        "version": settings.version,
        "status": "running",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
