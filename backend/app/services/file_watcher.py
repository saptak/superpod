"""
File watcher service for monitoring new media files
"""

import asyncio
import os
from pathlib import Path
from typing import Set

import structlog
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from app.core.config import get_settings
from app.services.media_processor import MediaProcessor

logger = structlog.get_logger(__name__)


class MediaFileHandler(FileSystemEventHandler):
    """Handler for media file system events."""
    
    def __init__(self, processor: MediaProcessor):
        self.processor = processor
        self.settings = get_settings()
        self.processing_files: Set[str] = set()
        
        # Supported file extensions
        self.supported_extensions = {
            '.mp3', '.wav', '.flac', '.ogg', '.m4a',  # Audio
            '.mp4', '.avi', '.mov', '.wmv', '.mkv',   # Video
        }
    
    def on_created(self, event):
        """Handle file creation events."""
        if event.is_directory:
            return
        
        file_path = Path(event.src_path)
        
        # Check if it's a supported media file
        if file_path.suffix.lower() in self.supported_extensions:
            logger.info("New media file detected", file_path=str(file_path))
            asyncio.create_task(self._process_new_file(file_path))
    
    def on_moved(self, event):
        """Handle file move events."""
        if event.is_directory:
            return
        
        dest_path = Path(event.dest_path)
        
        # Check if it's a supported media file moved into our directory
        if dest_path.suffix.lower() in self.supported_extensions:
            logger.info("Media file moved into directory", file_path=str(dest_path))
            asyncio.create_task(self._process_new_file(dest_path))
    
    async def _process_new_file(self, file_path: Path) -> None:
        """Process a newly detected media file."""
        file_path_str = str(file_path)
        
        # Avoid processing the same file multiple times
        if file_path_str in self.processing_files:
            return
        
        self.processing_files.add(file_path_str)
        
        try:
            # Wait a bit to ensure file is fully written
            await asyncio.sleep(2.0)
            
            # Check if file still exists and is readable
            if not file_path.exists() or not os.access(file_path, os.R_OK):
                logger.warning("File not accessible", file_path=file_path_str)
                return
            
            # Process the media file
            await self.processor.process_new_media_file(file_path)
            
        except Exception as e:
            logger.error("Error processing new file", 
                        file_path=file_path_str, 
                        error=str(e))
        finally:
            self.processing_files.discard(file_path_str)


class FileWatcherService:
    """Service for watching media directory for new files."""
    
    def __init__(self):
        self.settings = get_settings()
        self.observer = None
        self.processor = MediaProcessor()
        self.is_running = False
    
    async def start(self) -> None:
        """Start watching the media directory."""
        try:
            # Ensure media directory exists
            media_path = Path(self.settings.MEDIA_STORAGE_PATH)
            media_path.mkdir(parents=True, exist_ok=True)
            
            # Set up file system observer
            event_handler = MediaFileHandler(self.processor)
            self.observer = Observer()
            self.observer.schedule(
                event_handler, 
                str(media_path), 
                recursive=True
            )
            
            # Start observer
            self.observer.start()
            self.is_running = True
            
            logger.info("File watcher started", 
                       directory=str(media_path),
                       recursive=True)
            
            # Process any existing files that haven't been processed
            await self._process_existing_files(media_path)
            
        except Exception as e:
            logger.error("Failed to start file watcher", error=str(e))
            raise
    
    async def stop(self) -> None:
        """Stop the file watcher."""
        if self.observer and self.is_running:
            self.observer.stop()
            self.observer.join()
            self.is_running = False
            logger.info("File watcher stopped")
    
    async def _process_existing_files(self, media_path: Path) -> None:
        """Process any existing files that haven't been processed yet."""
        try:
            logger.info("Checking for existing unprocessed files")
            
            supported_extensions = {
                '.mp3', '.wav', '.flac', '.ogg', '.m4a',
                '.mp4', '.avi', '.mov', '.wmv', '.mkv',
            }
            
            # Find all media files
            media_files = []
            for ext in supported_extensions:
                media_files.extend(media_path.rglob(f"*{ext}"))
            
            logger.info("Found existing media files", count=len(media_files))
            
            # Process files that aren't in database yet
            for file_path in media_files:
                try:
                    # Check if file is already in database
                    is_processed = await self.processor.is_file_processed(file_path)
                    
                    if not is_processed:
                        logger.info("Processing existing file", file_path=str(file_path))
                        await self.processor.process_new_media_file(file_path)
                    
                except Exception as e:
                    logger.error("Error processing existing file", 
                                file_path=str(file_path), 
                                error=str(e))
            
        except Exception as e:
            logger.error("Error processing existing files", error=str(e))