"""
Webinar API endpoints
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models import Webinar, Attendee, ChatMessage, GeneratedEmail
from app.schemas.webinar import (
    WebinarResponse,
    WebinarDetailResponse,
    AttendeeResponse,
    WebinarStats,
    GeneratedEmailResponse,
    EmailGenerationResponse,
    EmailGenerationStatus
)
from app.services.csv_parser import (
    parse_attendance_csv,
    parse_chat_csv,
    match_attendees_to_chats
)
from app.services.scoring import calculate_engagement_score, determine_tier
from app.services.email_generator import generate_email_with_retry, validate_email_content

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


@router.post("/{webinar_id}/generate-emails", response_model=EmailGenerationResponse)
async def generate_emails(
    webinar_id: int,
    regenerate: bool = Query(False, description="Force regeneration of existing emails"),
    tier: Optional[str] = Query(None, description="Generate only for specific tier (hot-lead, warm-lead, cool-lead, cold-lead, no-show)"),
    db: Session = Depends(get_db)
):
    """
    Generate AI-powered personalized emails for webinar attendees.

    This endpoint:
    1. Fetches all attendees for the webinar (optionally filtered by tier)
    2. Skips attendees who already have generated emails (unless regenerate=true)
    3. Uses OpenAI GPT-4o to generate personalized emails based on engagement
    4. Stores generated emails in the database
    5. Returns generation status with success/failure counts

    Args:
        webinar_id: The webinar ID
        regenerate: If true, regenerate emails even if they already exist
        tier: Optional tier filter (e.g., "hot-lead", "warm-lead")

    Returns:
        EmailGenerationResponse with status and counts
    """
    webinar = db.query(Webinar).filter(Webinar.id == webinar_id).first()
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")

    attendees = webinar.attendees

    if tier:
        tier_normalized = tier.lower().replace('-', ' ').title()
        attendees = [a for a in attendees if a.engagement_tier and
                    a.engagement_tier.lower().replace(' ', '-') == tier.lower()]

    if not attendees:
        return EmailGenerationResponse(
            webinar_id=webinar_id,
            status="no_attendees",
            emails_generated=0,
            message="No attendees found matching criteria",
            details=EmailGenerationStatus(
                total_attendees=0,
                successful=0,
                failed=0,
                skipped=0,
                errors=[],
                tier_breakdown={}
            )
        )

    successful = 0
    failed = 0
    skipped = 0
    errors = []
    tier_breakdown = {}

    for attendee in attendees:
        tier_key = attendee.engagement_tier or "Unknown"
        tier_breakdown[tier_key] = tier_breakdown.get(tier_key, 0)

        try:
            existing_email = db.query(GeneratedEmail).filter(
                GeneratedEmail.attendee_id == attendee.id
            ).first()

            if existing_email and not regenerate:
                skipped += 1
                continue

            email_data = generate_email_with_retry(attendee, webinar, db)

            if not validate_email_content(email_data["subject_line"], email_data["email_body_text"]):
                failed += 1
                errors.append(f"Generated email for {attendee.name} failed validation")
                continue

            if existing_email:
                existing_email.subject_line = email_data["subject_line"]
                existing_email.email_body_text = email_data["email_body_text"]
                existing_email.email_body_html = email_data.get("email_body_html")
                existing_email.engagement_score = email_data.get("engagement_score")
                existing_email.engagement_tier = email_data.get("engagement_tier")
                existing_email.personalization_elements = email_data.get("personalization_elements")
                existing_email.user_edited = False
            else:
                new_email = GeneratedEmail(
                    attendee_id=attendee.id,
                    subject_line=email_data["subject_line"],
                    email_body_text=email_data["email_body_text"],
                    email_body_html=email_data.get("email_body_html"),
                    engagement_score=email_data.get("engagement_score"),
                    engagement_tier=email_data.get("engagement_tier"),
                    personalization_elements=email_data.get("personalization_elements"),
                    user_edited=False
                )
                db.add(new_email)

            successful += 1
            tier_breakdown[tier_key] = tier_breakdown.get(tier_key, 0) + 1

        except Exception as e:
            failed += 1
            errors.append(f"Failed for {attendee.name}: {str(e)}")
            continue

    db.commit()

    status = "completed" if failed == 0 else "partial_success" if successful > 0 else "failed"
    message = f"Generated {successful} emails, skipped {skipped}, failed {failed}"

    return EmailGenerationResponse(
        webinar_id=webinar_id,
        status=status,
        emails_generated=successful,
        message=message,
        details=EmailGenerationStatus(
            total_attendees=len(attendees),
            successful=successful,
            failed=failed,
            skipped=skipped,
            errors=errors[:10],
            tier_breakdown=tier_breakdown
        )
    )


@router.get("/{webinar_id}/emails", response_model=List[GeneratedEmailResponse])
async def get_generated_emails(
    webinar_id: int,
    tier: Optional[str] = Query(None, description="Filter by engagement tier"),
    search: Optional[str] = Query(None, description="Search by attendee name or email"),
    db: Session = Depends(get_db)
):
    """
    Get all generated emails for a webinar with optional filtering.

    Args:
        webinar_id: The webinar ID
        tier: Optional tier filter (e.g., "hot-lead", "warm-lead")
        search: Optional search string for attendee name or email

    Returns:
        List of GeneratedEmailResponse objects sorted by engagement tier priority
    """
    webinar = db.query(Webinar).filter(Webinar.id == webinar_id).first()
    if not webinar:
        raise HTTPException(status_code=404, detail="Webinar not found")

    query = db.query(GeneratedEmail).join(Attendee).filter(
        Attendee.webinar_id == webinar_id
    )

    if tier:
        tier_normalized = tier.lower().replace('-', ' ').title()
        query = query.filter(GeneratedEmail.engagement_tier == tier_normalized)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Attendee.name.ilike(search_pattern)) |
            (Attendee.email.ilike(search_pattern))
        )

    generated_emails = query.all()

    tier_priority = {
        "Hot Lead": 1,
        "Warm Lead": 2,
        "Cool Lead": 3,
        "Cold Lead": 4,
        "No-Show": 5
    }

    generated_emails = sorted(
        generated_emails,
        key=lambda e: (tier_priority.get(e.engagement_tier or "Unknown", 6), e.attendee.name)
    )

    response = []
    for email in generated_emails:
        email_dict = {
            "id": email.id,
            "attendee_id": email.attendee_id,
            "attendee_name": email.attendee.name,
            "attendee_email": email.attendee.email,
            "subject_line": email.subject_line,
            "email_body_text": email.email_body_text,
            "email_body_html": email.email_body_html,
            "engagement_score": email.engagement_score,
            "engagement_tier": email.engagement_tier,
            "personalization_elements": email.personalization_elements,
            "user_edited": email.user_edited,
            "user_notes": email.user_notes,
            "created_at": email.created_at
        }
        response.append(GeneratedEmailResponse(**email_dict))

    return response

