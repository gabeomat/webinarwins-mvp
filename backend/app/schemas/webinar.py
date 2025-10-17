"""
Webinar schemas for API requests and responses
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class WebinarCreate(BaseModel):
    """Schema for creating a new webinar"""
    title: str = Field(..., min_length=1, max_length=500)
    topic: Optional[str] = None
    date_hosted: Optional[datetime] = None
    offer_name: Optional[str] = Field(None, max_length=255)
    offer_description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    deadline: Optional[str] = Field(None, max_length=100)
    replay_url: Optional[str] = None


class AttendeeResponse(BaseModel):
    """Schema for attendee data in responses"""
    id: int
    name: str
    email: str
    attended: bool
    attendance_percent: Optional[int] = None
    focus_percent: Optional[int] = None
    attendance_minutes: Optional[int] = None
    engagement_score: Optional[int] = None
    engagement_tier: Optional[str] = None
    message_count: int = 0
    question_count: int = 0
    
    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    """Schema for chat message data"""
    id: int
    message_text: str
    timestamp: Optional[datetime] = None
    is_question: bool
    
    class Config:
        from_attributes = True


class WebinarStats(BaseModel):
    """Statistics for a webinar"""
    total_registrants: int
    total_attendees: int
    no_shows: int
    attendance_rate: float
    hot_leads: int = 0
    warm_leads: int = 0
    cool_leads: int = 0
    cold_leads: int = 0
    avg_focus_percent: Optional[float] = None
    avg_attendance_percent: Optional[float] = None
    total_chat_messages: int = 0


class WebinarResponse(BaseModel):
    """Schema for webinar data in responses"""
    id: int
    title: str
    topic: Optional[str] = None
    date_hosted: Optional[datetime] = None
    offer_name: Optional[str] = None
    offer_description: Optional[str] = None
    price: Optional[float] = None
    deadline: Optional[str] = None
    replay_url: Optional[str] = None
    created_at: datetime
    stats: Optional[WebinarStats] = None
    
    class Config:
        from_attributes = True


class WebinarDetailResponse(WebinarResponse):
    """Detailed webinar response with attendees"""
    attendees: List[AttendeeResponse] = []


class GeneratedEmailResponse(BaseModel):
    """Schema for generated email data"""
    id: int
    attendee_id: int
    attendee_name: str
    attendee_email: str
    subject_line: str
    email_body_text: str
    email_body_html: Optional[str] = None
    engagement_score: Optional[int] = None
    engagement_tier: Optional[str] = None
    user_edited: bool = False
    user_notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class EmailGenerationResponse(BaseModel):
    """Response for email generation request"""
    webinar_id: int
    status: str
    emails_generated: int
    message: str

