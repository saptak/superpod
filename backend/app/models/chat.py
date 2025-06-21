"""
Chat models
"""

from enum import Enum
from typing import Optional

from sqlalchemy import String, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class MessageRole(str, Enum):
    """Chat message role."""
    USER = "user"
    ASSISTANT = "assistant"


class ChatConversation(BaseModel):
    """Chat conversation model."""
    __tablename__ = "chat_conversations"
    
    # Foreign key
    user_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    
    # Conversation metadata
    title: Mapped[Optional[str]] = mapped_column(String(255))
    context: Mapped[Optional[dict]] = mapped_column(JSON)  # Current media file, time, etc.
    
    # Relationships
    user = relationship("User", back_populates="chat_conversations")
    messages = relationship("ChatMessage", back_populates="conversation")
    
    def __repr__(self) -> str:
        return f"<ChatConversation(user_id='{self.user_id}', title='{self.title}')>"


class ChatMessage(BaseModel):
    """Chat message model."""
    __tablename__ = "chat_messages"
    
    # Foreign key
    conversation_id: Mapped[str] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("chat_conversations.id"),
        nullable=False,
        index=True
    )
    
    # Message data
    role: Mapped[MessageRole] = mapped_column(nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Metadata
    metadata: Mapped[Optional[dict]] = mapped_column(JSON)  # Recommendations, segments, etc.
    processing_time: Mapped[Optional[float]] = mapped_column()  # AI response time
    
    # Relationships
    conversation = relationship("ChatConversation", back_populates="messages")
    
    def __repr__(self) -> str:
        return f"<ChatMessage(role='{self.role}', conversation_id='{self.conversation_id}')>"