"""
API router configuration
"""

from fastapi import APIRouter

from app.api.endpoints import auth, media, chat, search, playback, admin

api_router = APIRouter()

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(playback.router, prefix="/playback", tags=["playback"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])