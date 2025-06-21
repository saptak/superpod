"""
Media processor service for handling new media files
"""

import mimetypes
import os
from pathlib import Path
from typing import Optional

import structlog
from pydub import AudioSegment
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.database import AsyncSessionLocal
from app.models.media import MediaFile, TranscriptionStatus
from app.services.media_service import MediaService
from app.services.transcription_service import TranscriptionService

logger = structlog.get_logger(__name__)


class MediaProcessor:
    """Service for processing new media files."""
    
    def __init__(self):
        self.settings = get_settings()
    
    async def process_new_media_file(self, file_path: Path) -> Optional[MediaFile]:
        """Process a new media file: create database entry and start transcription."""
        async with AsyncSessionLocal() as db:
            try:
                media_service = MediaService(db)
                
                # Check if file already exists in database
                existing_file = await media_service.get_by_file_path(str(file_path))
                if existing_file:
                    logger.info("File already exists in database", 
                               file_path=str(file_path),
                               media_file_id=str(existing_file.id))
                    return existing_file
                
                # Extract file metadata
                file_info = await self._extract_file_info(file_path)
                if not file_info:
                    logger.error("Failed to extract file info", file_path=str(file_path))
                    return None
                
                # Create media file record
                media_file = await media_service.create(
                    filename=file_path.stem,
                    original_filename=file_path.name,
                    title=self._generate_title(file_path.stem),
                    file_path=str(file_path),
                    file_size=file_info['file_size'],
                    mime_type=file_info['mime_type'],
                    duration=file_info.get('duration'),
                    transcription_status=TranscriptionStatus.PENDING
                )
                
                logger.info("Created media file record", 
                           media_file_id=str(media_file.id),
                           filename=media_file.filename)
                
                # Start transcription asynchronously
                await self._start_transcription(media_file.id, db)
                
                return media_file
                
            except Exception as e:
                logger.error("Error processing media file", 
                            file_path=str(file_path), 
                            error=str(e))
                return None
    
    async def is_file_processed(self, file_path: Path) -> bool:
        """Check if a file has already been processed."""
        async with AsyncSessionLocal() as db:
            media_service = MediaService(db)
            existing_file = await media_service.get_by_file_path(str(file_path))
            return existing_file is not None
    
    async def _extract_file_info(self, file_path: Path) -> Optional[dict]:
        """Extract metadata from media file."""
        try:
            # Get file size
            file_size = file_path.stat().st_size
            
            # Get MIME type
            mime_type, _ = mimetypes.guess_type(str(file_path))
            if not mime_type:
                # Fallback based on extension
                ext = file_path.suffix.lower()
                if ext in ['.mp3', '.wav', '.flac', '.ogg', '.m4a']:
                    mime_type = f'audio/{ext[1:]}'
                elif ext in ['.mp4', '.avi', '.mov', '.wmv', '.mkv']:
                    mime_type = f'video/{ext[1:]}'
                else:
                    mime_type = 'application/octet-stream'
            
            # Get duration for audio/video files
            duration = None
            try:
                if mime_type.startswith(('audio/', 'video/')):
                    # Use pydub for audio duration
                    if mime_type.startswith('audio/'):
                        audio = AudioSegment.from_file(str(file_path))
                        duration = len(audio) / 1000.0  # Convert to seconds
                    else:
                        # For video files, we could use ffprobe, but for now skip
                        # TODO: Add video duration extraction
                        pass
            except Exception as e:
                logger.warning("Could not extract duration", 
                              file_path=str(file_path), 
                              error=str(e))
            
            return {
                'file_size': file_size,
                'mime_type': mime_type,
                'duration': duration
            }
            
        except Exception as e:
            logger.error("Error extracting file info", 
                        file_path=str(file_path), 
                        error=str(e))
            return None
    
    def _generate_title(self, filename: str) -> str:
        """Generate a human-readable title from filename."""
        # Remove common file prefixes/suffixes
        title = filename.replace('_', ' ').replace('-', ' ')
        
        # Capitalize words
        title = ' '.join(word.capitalize() for word in title.split())
        
        return title
    
    async def _start_transcription(self, media_file_id: str, db: AsyncSession) -> None:
        """Start transcription process for a media file."""
        try:
            transcription_service = TranscriptionService(db)
            
            # Start transcription (this should be done in background)
            # For now, we'll do it synchronously, but in production this should be
            # handled by a task queue like Celery
            logger.info("Starting transcription", media_file_id=media_file_id)
            
            # TODO: Move this to a background task/queue
            await transcription_service.transcribe_media_file(media_file_id)
            
        except Exception as e:
            logger.error("Error starting transcription", 
                        media_file_id=media_file_id, 
                        error=str(e))