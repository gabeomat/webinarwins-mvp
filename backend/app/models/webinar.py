"""
Webinar model
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class Webinar(Base, TimestampMixin):
    """Webinar session with offer details"""
    
    __tablename__ = "webinars"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    topic = Column(Text, nullable=True)
    date_hosted = Column(DateTime, nullable=True)
    
    # Offer details
    offer_name = Column(String(255), nullable=True)
    offer_description = Column(Text, nullable=True)
    price = Column(Float, nullable=True)
    deadline = Column(String(100), nullable=True)  # e.g., "48 hours", "3 days"
    replay_url = Column(Text, nullable=True)
    
    # Relationships
    attendees = relationship("Attendee", back_populates="webinar", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Webinar(id={self.id}, title='{self.title}')>"

