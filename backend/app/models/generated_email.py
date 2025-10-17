"""
Generated email model
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class GeneratedEmail(Base, TimestampMixin):
    """AI-generated personalized email for attendee"""
    
    __tablename__ = "generated_emails"
    
    id = Column(Integer, primary_key=True, index=True)
    attendee_id = Column(Integer, ForeignKey("attendees.id"), nullable=False, unique=True, index=True)
    
    subject_line = Column(String(500), nullable=False)
    email_body_text = Column(Text, nullable=False)
    email_body_html = Column(Text, nullable=True)
    
    engagement_score = Column(Integer, nullable=True)
    engagement_tier = Column(String(20), nullable=True)
    
    # Metadata
    personalization_elements = Column(JSON, nullable=True)  # Track what was personalized
    user_edited = Column(Boolean, default=False, nullable=False)
    user_notes = Column(Text, nullable=True)
    
    # Relationships
    attendee = relationship("Attendee", back_populates="generated_email")
    
    def __repr__(self):
        return f"<GeneratedEmail(id={self.id}, attendee_id={self.attendee_id}, tier='{self.engagement_tier}')>"

