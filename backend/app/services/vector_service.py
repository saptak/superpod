"""
Vector database service for semantic search
"""

import os
from typing import List, Dict, Any, Optional
from pathlib import Path

import chromadb
import numpy as np
import structlog
from sentence_transformers import SentenceTransformer

from app.core.config import get_settings

logger = structlog.get_logger(__name__)


class VectorService:
    """Service for vector operations and semantic search."""
    
    def __init__(self):
        self.settings = get_settings()
        self._client = None
        self._collection = None
        self._embedding_model = None
        self._initialize()
    
    def _initialize(self) -> None:
        """Initialize vector database and embedding model."""
        try:
            # Initialize ChromaDB
            db_path = Path(self.settings.CHROMADB_PATH)
            db_path.mkdir(parents=True, exist_ok=True)
            
            self._client = chromadb.PersistentClient(path=str(db_path))
            self._collection = self._client.get_or_create_collection(
                name="transcription_segments",
                metadata={"description": "Podcast transcription segments for semantic search"}
            )
            
            # Initialize embedding model
            self._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            logger.info("Vector service initialized", 
                       db_path=str(db_path),
                       collection_count=self._collection.count())
            
        except Exception as e:
            logger.error("Failed to initialize vector service", error=str(e))
            raise
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text."""
        try:
            # Clean and prepare text
            cleaned_text = text.strip()
            if not cleaned_text:
                return [0.0] * 384  # Return zero vector for empty text
            
            # Generate embedding
            embedding = self._embedding_model.encode(cleaned_text)
            return embedding.tolist()
            
        except Exception as e:
            logger.error("Failed to generate embedding", text=text[:100], error=str(e))
            return [0.0] * 384  # Return zero vector on error
    
    async def store_segment_embedding(
        self,
        segment_id: str,
        text: str,
        embedding: List[float],
        metadata: Dict[str, Any]
    ) -> None:
        """Store segment embedding in vector database."""
        try:
            self._collection.add(
                ids=[segment_id],
                documents=[text],
                embeddings=[embedding],
                metadatas=[metadata]
            )
            
            logger.debug("Stored segment embedding", segment_id=segment_id)
            
        except Exception as e:
            logger.error("Failed to store embedding", 
                        segment_id=segment_id, 
                        error=str(e))
            raise
    
    async def search_similar_segments(
        self,
        query: str,
        limit: int = 10,
        threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """Search for similar segments using semantic similarity."""
        try:
            # Generate query embedding
            query_embedding = await self.generate_embedding(query)
            
            # Search in vector database
            results = self._collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                include=['documents', 'metadatas', 'distances']
            )
            
            # Process results
            search_results = []
            for i in range(len(results['ids'][0])):
                distance = results['distances'][0][i]
                similarity = 1 - distance  # Convert distance to similarity
                
                if similarity >= threshold:
                    search_results.append({
                        'segment_id': results['ids'][0][i],
                        'text': results['documents'][0][i],
                        'similarity': similarity,
                        'metadata': results['metadatas'][0][i]
                    })
            
            logger.info("Semantic search completed", 
                       query=query[:100], 
                       results_count=len(search_results))
            
            return search_results
            
        except Exception as e:
            logger.error("Semantic search failed", query=query[:100], error=str(e))
            return []
    
    async def get_recommendations_for_segment(
        self,
        segment_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get recommendations based on a specific segment."""
        try:
            # Get the segment from collection
            segment_result = self._collection.get(
                ids=[segment_id],
                include=['embeddings', 'metadatas']
            )
            
            if not segment_result['ids']:
                logger.warning("Segment not found for recommendations", segment_id=segment_id)
                return []
            
            # Use segment embedding to find similar content
            embedding = segment_result['embeddings'][0]
            results = self._collection.query(
                query_embeddings=[embedding],
                n_results=limit + 1,  # +1 to exclude the original segment
                include=['documents', 'metadatas', 'distances']
            )
            
            # Process and filter results (exclude the original segment)
            recommendations = []
            for i in range(len(results['ids'][0])):
                if results['ids'][0][i] != segment_id:  # Exclude original segment
                    distance = results['distances'][0][i]
                    similarity = 1 - distance
                    
                    recommendations.append({
                        'segment_id': results['ids'][0][i],
                        'text': results['documents'][0][i],
                        'similarity': similarity,
                        'metadata': results['metadatas'][0][i]
                    })
            
            return recommendations[:limit]
            
        except Exception as e:
            logger.error("Failed to get recommendations", 
                        segment_id=segment_id, 
                        error=str(e))
            return []
    
    async def delete_media_embeddings(self, media_file_id: str) -> None:
        """Delete all embeddings for a media file."""
        try:
            # Get all segments for this media file
            results = self._collection.get(
                where={"media_file_id": media_file_id},
                include=['ids']
            )
            
            if results['ids']:
                # Delete embeddings
                self._collection.delete(ids=results['ids'])
                
                logger.info("Deleted media embeddings", 
                           media_file_id=media_file_id,
                           deleted_count=len(results['ids']))
            
        except Exception as e:
            logger.error("Failed to delete media embeddings", 
                        media_file_id=media_file_id, 
                        error=str(e))
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get vector collection statistics."""
        try:
            count = self._collection.count()
            return {
                'total_segments': count,
                'collection_name': self._collection.name,
                'status': 'healthy' if self._client else 'disconnected'
            }
            
        except Exception as e:
            logger.error("Failed to get collection stats", error=str(e))
            return {
                'total_segments': 0,
                'collection_name': 'unknown',
                'status': 'error'
            }