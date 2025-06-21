"""
SuperPod FastAPI Application
Main application entry point
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.db.database import init_db
from app.services.file_watcher import FileWatcherService

# Configure logging
setup_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    logger.info("Starting SuperPod backend")
    
    # Initialize database
    await init_db()
    
    # Start file watcher service
    file_watcher = FileWatcherService()
    await file_watcher.start()
    
    logger.info("SuperPod backend started successfully")
    
    yield
    
    # Cleanup
    await file_watcher.stop()
    logger.info("SuperPod backend stopped")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title="SuperPod API",
        description="AI-powered podcast discovery platform with local media files",
        version="1.0.0",
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )
    
    # Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_HOSTS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS,
    )
    
    # Routes
    app.include_router(api_router, prefix="/api")
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "ok", "message": "SuperPod API is running"}
    
    return app


app = create_app()

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_config=None,  # Use our custom logging
    )