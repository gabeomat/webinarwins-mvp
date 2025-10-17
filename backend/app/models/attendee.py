"""
Attendee model
"""
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class Attendee(Base, TimestampMixin):
    """Webinar attendee with engagement metrics"""
    
    __tablename__ = "attendees"
    
    id = Column(Integer, primary_key=True, index=True)
    webinar_id = Column(Integer, ForeignKey("webinars.id"), nullable=False, index=True)
    
    # Basic info
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    attended = Column(Boolean, default=False, nullable=False)
    
    # Engagement metrics
    attendance_percent = Column(Integer, nullable=True)  # 0-100
    focus_percent = Column(Integer, nullable=True)  # 0-100
    attendance_minutes = Column(Integer, nullable=True)
    join_time = Column(DateTime, nullable=True)
    exit_time = Column(DateTime, nullable=True)
    location = Column(String(255), nullable=True)
    
    # Calculated engagement
    engagement_score = Column(Integer, nullable=True)  # 0-100
    engagement_tier = Column(String(20), nullable=True)  # Hot, Warm, Cool, Cold, No-Show
    
    # Relationships
    webinar = relationship("Webinar", back_populates="attendees")
    chat_messages = relationship("ChatMessage", back_populates="attendee", cascade="all, delete-orphan")
    generated_email = relationship("GeneratedEmail", back_populates="attendee", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Attendee(id={self.id}, name='{self.name}', email='{self.email}', tier='{self.engagement_tier}')>"

