"""
Media service for managing media files
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, update, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import structlog

from app.models.media import MediaFile, Transcription, TranscriptionSegment, TranscriptionStatus

logger = structlog.get_logger(__name__)


class MediaService:
    """Service for media file operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(
        self,
        filename: str,
        original_filename: str,
        title: str,
        file_path: str,
        file_size: int,
        mime_type: str,
        duration: Optional[float] = None,
        description: Optional[str] = None,
        transcription_status: TranscriptionStatus = TranscriptionStatus.PENDING
    ) -> MediaFile:
        """Create a new media file record."""
        media_file = MediaFile(
            filename=filename,
            original_filename=original_filename,
            title=title,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            duration=duration,
            description=description,
            transcription_status=transcription_status
        )
        
        self.db.add(media_file)
        await self.db.commit()
        await self.db.refresh(media_file)
        
        logger.info("Media file created", 
                   media_file_id=str(media_file.id), 
                   filename=filename)
        return media_file
    
    async def get_by_id(self, media_file_id: UUID) -> Optional[MediaFile]:
        """Get media file by ID with transcription."""
        result = await self.db.execute(
            select(MediaFile)
            .options(selectinload(MediaFile.transcription))
            .where(MediaFile.id == media_file_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_file_path(self, file_path: str) -> Optional[MediaFile]:
        """Get media file by file path."""
        result = await self.db.execute(
            select(MediaFile).where(MediaFile.file_path == file_path)
        )
        return result.scalar_one_or_none()
    
    async def get_all(
        self,
        limit: int = 50,
        offset: int = 0,
        search: Optional[str] = None,
        topic: Optional[str] = None,
        genre: Optional[str] = None
    ) -> tuple[List[MediaFile], int]:
        """Get paginated list of media files with optional filters."""
        # Build base query
        query = select(MediaFile).options(selectinload(MediaFile.transcription))
        count_query = select(func.count(MediaFile.id))
        
        # Apply filters
        if search:
            search_filter = or_(
                MediaFile.title.ilike(f"%{search}%"),
                MediaFile.filename.ilike(f"%{search}%"),
                MediaFile.description.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        
        if topic:
            topic_filter = MediaFile.topics.contains([topic])
            query = query.where(topic_filter)
            count_query = count_query.where(topic_filter)
        
        if genre:
            genre_filter = MediaFile.genre == genre
            query = query.where(genre_filter)
            count_query = count_query.where(genre_filter)
        
        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.order_by(MediaFile.created_at.desc())
        query = query.offset(offset).limit(limit)
        
        result = await self.db.execute(query)
        media_files = result.scalars().all()
        
        return list(media_files), total
    
    async def update_transcription_status(
        self, 
        media_file_id: UUID, 
        status: TranscriptionStatus
    ) -> bool:
        """Update transcription status for a media file."""
        result = await self.db.execute(
            update(MediaFile)
            .where(MediaFile.id == media_file_id)
            .values(transcription_status=status)
        )
        await self.db.commit()
        
        logger.info("Updated transcription status", 
                   media_file_id=str(media_file_id), 
                   status=status.value)
        
        return result.rowcount > 0
    
    async def update_topics(self, media_file_id: UUID, topics: List[str]) -> bool:
        """Update topics for a media file."""
        result = await self.db.execute(
            update(MediaFile)
            .where(MediaFile.id == media_file_id)
            .values(topics=topics)
        )
        await self.db.commit()
        
        logger.info("Updated topics", 
                   media_file_id=str(media_file_id), 
                   topics=topics)
        
        return result.rowcount > 0
    
    async def delete(self, media_file_id: UUID) -> bool:
        """Delete a media file and its transcription."""
        # Get the media file first
        media_file = await self.get_by_id(media_file_id)
        if not media_file:
            return False
        
        # Delete the file record (cascading should handle transcription)
        await self.db.delete(media_file)
        await self.db.commit()
        
        logger.info("Media file deleted", media_file_id=str(media_file_id))
        return True
    
    async def get_transcription(self, media_file_id: UUID) -> Optional[Transcription]:
        """Get transcription for a media file."""
        result = await self.db.execute(
            select(Transcription)
            .options(selectinload(Transcription.segments))
            .where(Transcription.media_file_id == str(media_file_id))
        )
        return result.scalar_one_or_none()
    
    async def get_pending_transcriptions(self) -> List[MediaFile]:
        """Get media files pending transcription."""
        result = await self.db.execute(
            select(MediaFile)
            .where(MediaFile.transcription_status == TranscriptionStatus.PENDING)
            .order_by(MediaFile.created_at)
        )
        return list(result.scalars().all())