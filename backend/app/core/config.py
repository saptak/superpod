"""
Application configuration settings
"""

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Server configuration
    HOST: str = Field(default="0.0.0.0", description="Server host")
    PORT: int = Field(default=8000, description="Server port")
    DEBUG: bool = Field(default=True, description="Debug mode")
    
    # Security
    SECRET_KEY: str = Field(..., description="Secret key for JWT tokens")
    ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="Access token expiration")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token expiration")
    
    # CORS
    ALLOWED_HOSTS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        description="Allowed CORS origins"
    )
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost/superpod",
        description="Database connection URL"
    )
    
    # Vector Database
    VECTOR_DB_TYPE: str = Field(default="chromadb", description="Vector database type")
    CHROMADB_PATH: str = Field(default="./data/chromadb", description="ChromaDB storage path")
    PINECONE_API_KEY: str = Field(default="", description="Pinecone API key")
    PINECONE_ENVIRONMENT: str = Field(default="", description="Pinecone environment")
    
    # AI Services
    LLAMA_API_URL: str = Field(
        default="https://api.openai.com/v1",
        description="Llama API base URL"
    )
    LLAMA_API_KEY: str = Field(..., description="Llama API key")
    LLAMA_MODEL: str = Field(default="gpt-3.5-turbo", description="Llama model name")
    
    # File Storage
    MEDIA_STORAGE_PATH: str = Field(
        default="./data/media",
        description="Path to media file storage"
    )
    UPLOAD_MAX_SIZE: int = Field(
        default=500 * 1024 * 1024,  # 500MB
        description="Maximum upload file size in bytes"
    )
    ALLOWED_MEDIA_TYPES: List[str] = Field(
        default=[
            "audio/mpeg",
            "audio/wav",
            "audio/flac",
            "audio/ogg",
            "video/mp4",
            "video/avi",
            "video/mov",
            "video/wmv",
        ],
        description="Allowed media file types"
    )
    
    # Background Tasks
    CELERY_BROKER_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Celery broker URL"
    )
    CELERY_RESULT_BACKEND: str = Field(
        default="redis://localhost:6379/0",
        description="Celery result backend URL"
    )
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(default="json", description="Log format (json or console)")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()