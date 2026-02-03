"""Authentication middleware."""
from src.middleware.auth import get_current_user, CurrentUser

__all__ = ["get_current_user", "CurrentUser"]
