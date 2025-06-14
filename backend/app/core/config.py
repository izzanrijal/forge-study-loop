
from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/recallforge")
    
    # Supabase
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # AI Services
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    
    # Email Service
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    
    # Redis for Celery
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Security
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # File Storage
    upload_dir: str = "uploads"
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    
    # FastAPI Settings
    fastapi_host: str = os.getenv("FASTAPI_HOST", "0.0.0.0")
    fastapi_port: int = int(os.getenv("FASTAPI_PORT", "8000"))
    fastapi_reload: bool = os.getenv("FASTAPI_RELOAD", "true").lower() == "true"
    
    class Config:
        env_file = ".env"

settings = Settings()
