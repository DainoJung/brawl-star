from supabase import create_client, Client
from app.core.config import settings

supabase: Client | None = None


def get_supabase() -> Client:
    global supabase
    if supabase is None:
        supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )
    return supabase


def get_supabase_admin() -> Client:
    """서비스 키를 사용하는 관리자 클라이언트"""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_KEY
    )
