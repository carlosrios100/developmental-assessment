"""Health check router."""
from fastapi import APIRouter

from src.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.version}


@router.get("/health/db")
async def db_health_check():
    """Database connectivity check.

    Verifies Supabase connection by querying a lightweight table.
    """
    try:
        from src.services.supabase_client import get_supabase_client
        client = get_supabase_client()
        # Query archetypes table (public read, always has data after migrations)
        result = client.table("archetypes").select("id").limit(1).execute()
        return {
            "status": "connected",
            "database": "supabase",
            "tables_accessible": True,
            "row_count_sample": len(result.data),
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "supabase",
            "tables_accessible": False,
            "error": str(e),
        }


@router.get("/health/config")
async def config_check():
    """Validate that required configuration is present."""
    checks = {
        "supabase_url": bool(settings.supabase_url),
        "supabase_anon_key": bool(settings.supabase_anon_key),
        "supabase_service_role_key": bool(settings.supabase_service_role_key),
        "supabase_jwt_secret": bool(settings.supabase_jwt_secret),
        "anthropic_api_key": bool(settings.anthropic_api_key),
    }
    all_present = all(checks.values())
    return {
        "status": "ok" if all_present else "missing_config",
        "checks": checks,
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check - verifies DB and config are available."""
    errors = []

    # Check config
    if not settings.supabase_url:
        errors.append("SUPABASE_URL not configured")
    if not settings.supabase_service_role_key:
        errors.append("SUPABASE_SERVICE_ROLE_KEY not configured")

    # Check DB connectivity
    try:
        from src.services.supabase_client import get_supabase_client
        client = get_supabase_client()
        client.table("archetypes").select("id").limit(1).execute()
    except Exception as e:
        errors.append(f"Database unreachable: {e}")

    if errors:
        return {"status": "not_ready", "errors": errors}

    return {"status": "ready"}
