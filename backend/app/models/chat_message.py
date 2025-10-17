"""
Chat message model
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class ChatMessage(Base, TimestampMixin):
    """Chat message from webinar"""
    
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    attendee_id = Column(Integer, ForeignKey("attendees.id"), nullable=False, index=True)
    
    message_text = Column(Text, nullable=False)
    timestamp = Column(DateTime, nullable=True)
    is_question = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    attendee = relationship("Attendee", back_populates="chat_messages")
    
    def __repr__(self):
        return f"<ChatMessage(id={self.id}, attendee_id={self.attendee_id}, is_question={self.is_question})>"

