"""Supabase client configuration."""
from functools import lru_cache
from supabase import create_client, Client

from src.config import settings


@lru_cache
def get_supabase_client() -> Client:
    """Get Supabase client instance."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_storage_client():
    """Get Supabase storage client."""
    return get_supabase_client().storage
