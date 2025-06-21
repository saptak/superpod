"""
Media file models
"""

from enum import Enum
from typing import List, Optional

from sqlalchemy import Float, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class TranscriptionStatus(str, Enum):
    """Transcription processing status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class MediaFile(BaseModel):
    """Media file model."""
    __tablename__ = "media_files"
    
    # File information
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    
    # File metadata
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    duration: Mapped[Optional[float]] = mapped_column(Float)  # Duration in seconds
    
    # Processing status
    transcription_status: Mapped[TranscriptionStatus] = mapped_column(
        default=TranscriptionStatus.PENDING,
        nullable=False
    )
    
    # Content analysis
    topics: Mapped[List[str]] = mapped_column(JSON, default=list)
    genre: Mapped[Optional[str]] = mapped_column(String(100))
    language: Mapped[Optional[str]] = mapped_column(String(10), default="en")
    
    # Relationships
    transcription = relationship("Transcription", back_populates="media_file", uselist=False)
    playback_sessions = relationship("PlaybackSession", back_populates="media_file")
    
    def __repr__(self) -> str:
        return f"<MediaFile(filename='{self.filename}', title='{self.title}')>"


class Transcription(BaseModel):
    """Transcription model."""
    __tablename__ = "transcriptions"
    
    # Foreign key
    media_file_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    
    # Transcription data
    full_text: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    # Processing metadata
    model_used: Mapped[Optional[str]] = mapped_column(String(100))
    processing_time: Mapped[Optional[float]] = mapped_column(Float)  # Time in seconds
    
    # Relationships
    media_file = relationship("MediaFile", back_populates="transcription")
    segments = relationship("TranscriptionSegment", back_populates="transcription")
    
    def __repr__(self) -> str:
        return f"<Transcription(media_file_id='{self.media_file_id}', language='{self.language}')>"


class TranscriptionSegment(BaseModel):
    """Transcription segment model for timestamped text."""
    __tablename__ = "transcription_segments"
    
    # Foreign key
    transcription_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    
    # Segment data
    start_time: Mapped[float] = mapped_column(Float, nullable=False)  # Start time in seconds
    end_time: Mapped[float] = mapped_column(Float, nullable=False)    # End time in seconds
    text: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    speaker: Mapped[Optional[str]] = mapped_column(String(100))  # Speaker identification
    
    # Vector embedding for semantic search
    embedding_vector: Mapped[Optional[str]] = mapped_column(Text)  # JSON serialized vector
    
    # Relationships
    transcription = relationship("Transcription", back_populates="segments")
    
    def __repr__(self) -> str:
        return f"<TranscriptionSegment(start={self.start_time}, end={self.end_time})>"