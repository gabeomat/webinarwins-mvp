"""
Webinar API endpoints
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models import Webinar, Attendee, ChatMessage
from app.schemas.webinar import (
    WebinarResponse,
    WebinarDetailResponse,
    AttendeeResponse,
    WebinarStats
)
from app.services.csv_parser import (
    parse_attendance_csv,
    parse_chat_csv,
    match_attendees_to_chats
)
from app.services.scoring import calculate_engagement_score, determine_tier

router = APIRouter()


@router.post("/create", response_model=WebinarResponse, status_code=201)
async def create_webinar(
    title: str = Form(...),
    topic: Optional[str] = Form(None),
    offer_name: Optional[str] = Form(None),
    offer_description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    deadline: Optional[str] = Form(None),
    replay_url: Optional[str] = Form(None),
    attendance_csv: UploadFile = File(...),
    chat_csv: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Create a new webinar by uploading attendance and chat CSV files.
    
    This endpoint:
    1. Parses both CSV files
    2. Creates webinar record
    3. Creates attendee records
    4. Creates chat message records
    5. Links chat messages to attendees
    6. Returns webinar with basic stats
    """
    try:
        # Parse CSV files
        attendees_data = parse_attendance_csv(attendance_csv)
        messages_data = parse_chat_csv(chat_csv)
        
        # Match messages to attendees
        email_to_messages = match_attendees_to_chats(attendees_data, messages_data)
        
        # Create webinar
        webinar = Webinar(
            title=title,
            topic=topic,
            date_hosted=datetime.utcnow(),
            offer_name=offer_name,
            offer_description=offer_description,
            price=price,
            deadline=deadline,
            replay_url=replay_url
        )
        db.add(webinar)
        db.flush()  # Get webinar ID
        
        # Create attendees
        attendee_objects = []
        for attendee_data in attendees_data:
            attendee = Attendee(
                webinar_id=webinar.id,
                name=attendee_data['name'],
                email=attendee_data['email'],
                attended=attendee_data['attended'],
                attendance_percent=attendee_data['attendance_percent'],
                focus_percent=attendee_data['focus_percent'],
                attendance_minutes=attendee_data['attendance_minutes'],
                join_time=attendee_data['join_time'],
                exit_time=attendee_data['exit_time'],
                location=attendee_data['location']
            )
            db.add(attendee)
            db.flush()  # Get attendee ID
            attendee_objects.append(attendee)
            
            # Create chat messages for this attendee
            message_count = 0
            question_count = 0
            if attendee.email in email_to_messages:
                for msg_data in email_to_messages[attendee.email]:
                    chat_msg = ChatMessage(
                        attendee_id=attendee.id,
                        message_text=msg_data['message_text'],
                        timestamp=msg_data['timestamp'],
                        is_question=msg_data['is_question']
                    )
                    db.add(chat_msg)
                    message_count += 1
                    if msg_data['is_question']:
                        question_count += 1
            
            # Calculate engagement score and tier
            engagement_score = calculate_engagement_score(
                focus_percent=attendee.focus_percent,
                attendance_percent=attendee.attendance_percent,
                message_count=message_count,
                question_count=question_count
            )
            engagement_tier = determine_tier(engagement_score, attendee.attended)
            
            # Update attendee with score and tier
            attendee.engagement_score = engagement_score
            attendee.engagement_tier = engagement_tier
        
        db.commit()
        db.refresh(webinar)
        
        # Calculate stats with tier breakdown
        total_attendees = sum(1 for a in attendee_objects if a.attended)
        total_registrants = len(attendee_objects)
        no_shows = total_registrants - total_attendees
        attendance_rate = (total_attendees / total_registrants * 100) if total_registrants > 0 else 0
        
        # Calculate averages for attendees
        attended = [a for a in attendee_objects if a.attended]
        avg_focus = sum(a.focus_percent or 0 for a in attended) / len(attended) if attended else 0
        avg_attendance = sum(a.attendance_percent or 0 for a in attended) / len(attended) if attended else 0
        
        # Count by tier
        tier_counts = {
            'hot': sum(1 for a in attendee_objects if a.engagement_tier == 'Hot Lead'),
            'warm': sum(1 for a in attendee_objects if a.engagement_tier == 'Warm Lead'),
            'cool': sum(1 for a in attendee_objects if a.engagement_tier == 'Cool Lead'),
            'cold': sum(1 for a in attendee_objects if a.engagement_tier == 'Cold Lead'),
        }
        
        stats = WebinarStats(
            total_registrants=total_registrants,
            total_attendees=total_attendees,
            no_shows=no_shows,
            attendance_rate=round(attendance_rate, 1),
            hot_leads=tier_counts['hot'],
            warm_leads=tier_counts['warm'],
            cool_leads=tier_counts['cool'],
            cold_leads=tier_counts['cold'],
            avg_focus_percent=round(avg_focus, 1) if avg_focus else None,
            avg_attendance_percent=round(avg_attendance, 1) if avg_attendance else None,
            total_chat_messages=len(messages_data)
        )
        
        response = WebinarResponse.from_orm(webinar)
        response.stats = stats
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating webinar: {str(e)}")


@router.get("/{webinar_id}", response_model=WebinarDetailResponse)
async def get_webinar(
    webinar_id: int,
    db: Session = Depends(get_db)
):
    """
    Get webinar details with all attendees.
    """
    webinar = db.query(Webinar).filter(Webinar.id == webinar_id).first()
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    # Get attendees with message counts
    attendees_response = []
    for attendee in webinar.attendees:
        message_count = len(attendee.chat_messages)
        question_count = sum(1 for msg in attendee.chat_messages if msg.is_question)
        
        attendee_dict = AttendeeResponse.from_orm(attendee).dict()
        attendee_dict['message_count'] = message_count
        attendee_dict['question_count'] = question_count
        attendees_response.append(AttendeeResponse(**attendee_dict))
    
    # Calculate stats
    total_attendees = sum(1 for a in webinar.attendees if a.attended)
    total_registrants = len(webinar.attendees)
    no_shows = total_registrants - total_attendees
    attendance_rate = (total_attendees / total_registrants * 100) if total_registrants > 0 else 0
    
    attended = [a for a in webinar.attendees if a.attended]
    avg_focus = sum(a.focus_percent or 0 for a in attended) / len(attended) if attended else 0
    avg_attendance = sum(a.attendance_percent or 0 for a in attended) / len(attended) if attended else 0
    
    # Count by tier
    tier_counts = {'hot': 0, 'warm': 0, 'cool': 0, 'cold': 0}
    for a in webinar.attendees:
        if a.engagement_tier:
            tier = a.engagement_tier.lower().replace(' lead', '').replace('-', '')
            if tier in tier_counts:
                tier_counts[tier] += 1
    
    total_messages = sum(len(a.chat_messages) for a in webinar.attendees)
    
    stats = WebinarStats(
        total_registrants=total_registrants,
        total_attendees=total_attendees,
        no_shows=no_shows,
        attendance_rate=round(attendance_rate, 1),
        hot_leads=tier_counts['hot'],
        warm_leads=tier_counts['warm'],
        cool_leads=tier_counts['cool'],
        cold_leads=tier_counts['cold'],
        avg_focus_percent=round(avg_focus, 1) if avg_focus else None,
        avg_attendance_percent=round(avg_attendance, 1) if avg_attendance else None,
        total_chat_messages=total_messages
    )
    
    response = WebinarDetailResponse.from_orm(webinar)
    response.attendees = attendees_response
    response.stats = stats
    
    return response


@router.get("/{webinar_id}/attendees", response_model=List[AttendeeResponse])
async def get_attendees(
    webinar_id: int,
    tier: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all attendees for a webinar, optionally filtered by tier.
    Returns attendees sorted by engagement score (highest first).
    """
    webinar = db.query(Webinar).filter(Webinar.id == webinar_id).first()
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")
    
    attendees = webinar.attendees
    
    # Filter by tier if specified
    if tier:
        tier_normalized = tier.lower().replace(' ', '-')
        attendees = [a for a in attendees if a.engagement_tier and 
                    a.engagement_tier.lower().replace(' ', '-') == tier_normalized]
    
    # Sort by engagement score (highest first), then by name
    attendees = sorted(
        attendees,
        key=lambda a: (a.engagement_score or 0, a.name),
        reverse=True
    )
    
    # Build response with message counts
    attendees_response = []
    for attendee in attendees:
        message_count = len(attendee.chat_messages)
        question_count = sum(1 for msg in attendee.chat_messages if msg.is_question)
        
        attendee_dict = AttendeeResponse.from_orm(attendee).dict()
        attendee_dict['message_count'] = message_count
        attendee_dict['question_count'] = question_count
        attendees_response.append(AttendeeResponse(**attendee_dict))
    
    return attendees_response

