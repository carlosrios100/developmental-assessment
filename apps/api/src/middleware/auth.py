"""JWT authentication middleware using Supabase."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from src.services.supabase_client import get_supabase_client


security = HTTPBearer()


class CurrentUser(BaseModel):
    """Authenticated user model."""
    id: str
    email: str
    role: str = "parent"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    """Validate JWT token and return the current user.

    Uses Supabase auth to validate the token and extract user info.
    """
    token = credentials.credentials

    try:
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)
        user = user_response.user

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Get role from profiles table
        role = "parent"
        profile_result = supabase.table("profiles").select("role").eq(
            "id", user.id
        ).execute()
        if profile_result.data:
            role = profile_result.data[0].get("role", "parent")

        return CurrentUser(
            id=user.id,
            email=user.email or "",
            role=role,
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
