"""Application configuration."""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # App
    version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8081", "exp://localhost:8081"]

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # Auth
    supabase_jwt_secret: str = ""

    # AI Services
    anthropic_api_key: str = ""
    replicate_api_token: str = ""

    # Logging
    log_level: str = "INFO"

    # Video Processing
    max_video_size_mb: int = 500
    max_video_duration_seconds: int = 600
    video_temp_dir: str = "/tmp/devassess/videos"

    # Storage
    video_storage_bucket: str = "videos"
    thumbnail_storage_bucket: str = "thumbnails"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings."""
    return Settings()


settings = get_settings()
