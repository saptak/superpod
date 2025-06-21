"""
Playback session models
"""

from typing import Optional

from sqlalchemy import Float, Boolean, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class PlaybackSession(BaseModel):
    """Playback session model for tracking user listening."""
    __tablename__ = "playback_sessions"
    
    # Foreign keys
    user_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    
    media_file_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("media_files.id"),
        nullable=False,
        index=True
    )
    
    # Session data
    session_token: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    current_time: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    duration: Mapped[Optional[float]] = mapped_column(Float)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Analytics
    total_listen_time: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    completion_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="playback_sessions")
    media_file = relationship("MediaFile", back_populates="playback_sessions")
    
    def __repr__(self) -> str:
        return (
            f"<PlaybackSession(user_id='{self.user_id}', "
            f"media_file_id='{self.media_file_id}', current_time={self.current_time})>"
        )