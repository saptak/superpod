"""
Transcription service using Llama API
"""

import asyncio
import json
import tempfile
from pathlib import Path
from typing import List, Optional, Dict, Any

import ffmpeg
import httpx
import structlog
from pydub import AudioSegment
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.media import MediaFile, Transcription, TranscriptionSegment, TranscriptionStatus
from app.services.media_service import MediaService
from app.services.vector_service import VectorService

logger = structlog.get_logger(__name__)


class TranscriptionService:
    """Service for transcribing audio files using Llama API."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()
        self.media_service = MediaService(db)
        self.vector_service = VectorService()
        
    async def transcribe_media_file(self, media_file_id: str) -> Optional[Transcription]:
        """Transcribe a media file and save results to database."""
        try:
            # Get media file
            media_file = await self.media_service.get_by_id(media_file_id)
            if not media_file:
                logger.error("Media file not found", media_file_id=media_file_id)
                return None
            
            # Update status to processing
            await self.media_service.update_transcription_status(
                media_file_id, TranscriptionStatus.PROCESSING
            )
            
            logger.info("Starting transcription", 
                       media_file_id=media_file_id, 
                       filename=media_file.filename)
            
            # Extract audio if needed
            audio_path = await self._extract_audio(media_file)
            
            # Transcribe using Llama API
            transcription_result = await self._transcribe_with_llama(audio_path)
            
            # Save transcription to database
            transcription = await self._save_transcription(media_file, transcription_result)
            
            # Generate embeddings for vector search
            await self._generate_embeddings(transcription)
            
            # Update status to completed
            await self.media_service.update_transcription_status(
                media_file_id, TranscriptionStatus.COMPLETED
            )
            
            logger.info("Transcription completed", 
                       media_file_id=media_file_id,
                       transcription_id=str(transcription.id))
            
            return transcription
            
        except Exception as e:
            logger.error("Transcription failed", 
                        media_file_id=media_file_id, 
                        error=str(e))
            
            # Update status to failed
            await self.media_service.update_transcription_status(
                media_file_id, TranscriptionStatus.FAILED
            )
            return None
    
    async def _extract_audio(self, media_file: MediaFile) -> Path:
        """Extract audio from media file if needed."""
        file_path = Path(media_file.file_path)
        
        # If already audio, return as is
        if media_file.mime_type.startswith('audio/'):
            return file_path
        
        # Extract audio from video
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            output_path = Path(temp_file.name)
        
        try:
            # Use ffmpeg to extract audio
            stream = ffmpeg.input(str(file_path))
            stream = ffmpeg.output(stream, str(output_path), acodec='pcm_s16le', ar=16000)
            ffmpeg.run(stream, quiet=True, overwrite_output=True)
            
            logger.info("Audio extracted", 
                       input_file=str(file_path),
                       output_file=str(output_path))
            
            return output_path
            
        except Exception as e:
            logger.error("Audio extraction failed", 
                        input_file=str(file_path), 
                        error=str(e))
            raise
    
    async def _transcribe_with_llama(self, audio_path: Path) -> Dict[str, Any]:
        """Transcribe audio using Llama API."""
        # Convert audio to required format (if needed)
        audio = AudioSegment.from_file(str(audio_path))
        
        # Split into chunks for processing (Llama API might have size limits)
        chunk_length_ms = 30000  # 30 seconds
        chunks = [audio[i:i + chunk_length_ms] for i in range(0, len(audio), chunk_length_ms)]
        
        all_segments = []
        current_time = 0.0
        
        async with httpx.AsyncClient() as client:
            for i, chunk in enumerate(chunks):
                # Save chunk to temporary file
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                    chunk_path = Path(temp_file.name)
                    chunk.export(str(chunk_path), format="wav")
                
                try:
                    # Transcribe chunk
                    chunk_result = await self._transcribe_chunk(client, chunk_path, current_time)
                    all_segments.extend(chunk_result.get('segments', []))
                    current_time += len(chunk) / 1000.0  # Convert to seconds
                    
                finally:
                    # Clean up temporary file
                    chunk_path.unlink(missing_ok=True)
        
        # Combine all segments
        full_text = ' '.join([segment['text'] for segment in all_segments])
        
        return {
            'full_text': full_text,
            'segments': all_segments,
            'language': 'en',  # TODO: Detect language
            'confidence': sum(s.get('confidence', 0.8) for s in all_segments) / len(all_segments) if all_segments else 0.0
        }
    
    async def _transcribe_chunk(
        self, 
        client: httpx.AsyncClient, 
        chunk_path: Path, 
        time_offset: float
    ) -> Dict[str, Any]:
        """Transcribe a single audio chunk."""
        # TODO: Replace with actual Llama API call
        # This is a placeholder implementation
        
        headers = {
            'Authorization': f'Bearer {self.settings.LLAMA_API_KEY}',
            'Content-Type': 'multipart/form-data'
        }
        
        # Simulate API call for now
        await asyncio.sleep(0.1)  # Simulate processing time
        
        # Mock response - replace with actual Llama API call
        duration = AudioSegment.from_file(str(chunk_path)).duration_seconds
        
        return {
            'segments': [
                {
                    'start_time': time_offset,
                    'end_time': time_offset + duration,
                    'text': f'Transcribed text for chunk starting at {time_offset:.1f}s',
                    'confidence': 0.95
                }
            ]
        }
    
    async def _save_transcription(
        self, 
        media_file: MediaFile, 
        transcription_result: Dict[str, Any]
    ) -> Transcription:
        """Save transcription results to database."""
        # Create transcription record
        transcription = Transcription(
            media_file_id=str(media_file.id),
            full_text=transcription_result['full_text'],
            language=transcription_result['language'],
            confidence=transcription_result['confidence'],
            model_used=self.settings.LLAMA_MODEL
        )
        
        self.db.add(transcription)
        await self.db.flush()  # Get the ID
        
        # Create segments
        for segment_data in transcription_result['segments']:
            segment = TranscriptionSegment(
                transcription_id=str(transcription.id),
                start_time=segment_data['start_time'],
                end_time=segment_data['end_time'],
                text=segment_data['text'],
                confidence=segment_data.get('confidence', 0.0)
            )
            self.db.add(segment)
        
        await self.db.commit()
        await self.db.refresh(transcription)
        
        return transcription
    
    async def _generate_embeddings(self, transcription: Transcription) -> None:
        """Generate vector embeddings for transcription segments."""
        try:
            # Load segments
            segments = await self.db.execute(
                f"SELECT * FROM transcription_segments WHERE transcription_id = '{transcription.id}'"
            )
            
            for segment in segments:
                # Generate embedding for segment text
                embedding = await self.vector_service.generate_embedding(segment.text)
                
                # Store in vector database
                await self.vector_service.store_segment_embedding(
                    segment_id=str(segment.id),
                    text=segment.text,
                    embedding=embedding,
                    metadata={
                        'media_file_id': transcription.media_file_id,
                        'start_time': segment.start_time,
                        'end_time': segment.end_time,
                        'confidence': segment.confidence
                    }
                )
                
                # Also store embedding in database as JSON
                segment.embedding_vector = json.dumps(embedding)
            
            await self.db.commit()
            
            logger.info("Embeddings generated", transcription_id=str(transcription.id))
            
        except Exception as e:
            logger.error("Failed to generate embeddings", 
                        transcription_id=str(transcription.id), 
                        error=str(e))