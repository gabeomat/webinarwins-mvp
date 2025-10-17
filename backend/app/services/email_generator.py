"""
AI-powered email generator for personalized webinar follow-ups
"""
import time
from typing import List, Dict, Optional, Tuple
from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Attendee, ChatMessage, Webinar


class EmailGenerationError(Exception):
    """Custom exception for email generation failures"""
    pass


def format_chat_context(chat_messages: List[ChatMessage]) -> str:
    """
    Format chat messages into a readable context string for the AI.

    Args:
        chat_messages: List of ChatMessage objects

    Returns:
        Formatted string of chat messages
    """
    if not chat_messages:
        return "No chat messages"

    formatted = []
    for msg in chat_messages:
        prefix = "Question" if msg.is_question else "Comment"
        formatted.append(f"{prefix}: {msg.message_text}")

    return "\n".join(formatted)


def format_attendee_context(
    attendee: Attendee,
    webinar: Webinar,
    chat_messages: List[ChatMessage]
) -> Dict[str, any]:
    """
    Format attendee and webinar data into structured context for AI prompts.

    Args:
        attendee: Attendee object with engagement data
        webinar: Webinar object with offer details
        chat_messages: List of chat messages from the attendee

    Returns:
        Dictionary with all context data
    """
    return {
        "attendee_name": attendee.name,
        "attendee_email": attendee.email,
        "attended": attendee.attended,
        "engagement_score": attendee.engagement_score or 0,
        "engagement_tier": attendee.engagement_tier or "Unknown",
        "focus_percent": attendee.focus_percent or 0,
        "attendance_percent": attendee.attendance_percent or 0,
        "attendance_minutes": attendee.attendance_minutes or 0,
        "message_count": len(chat_messages),
        "question_count": sum(1 for msg in chat_messages if msg.is_question),
        "chat_context": format_chat_context(chat_messages),
        "webinar_title": webinar.title,
        "webinar_topic": webinar.topic or "the webinar content",
        "offer_name": webinar.offer_name or "our special offer",
        "offer_description": webinar.offer_description or "",
        "price": webinar.price or 0,
        "deadline": webinar.deadline or "soon",
        "replay_url": webinar.replay_url or ""
    }


def build_system_prompt() -> str:
    """
    Build the system prompt that sets the tone and style for all emails.

    Returns:
        System prompt string
    """
    return """You are an expert email copywriter specializing in conversational, authentic follow-up emails for webinar attendees. Your writing style is:

Conversational and human. You write like you talk — relaxed, natural, sometimes irreverent, but always with heart.

Emotionally honest. You don't posture as the expert who has it all figured out. You share truth, lessons, and real moments — even the messy ones.

Story-driven and self-aware. You use personal examples, metaphors, and reflections that make complex ideas click.

Warm with an edge. You're unafraid to call out outdated or "bro-marketing" nonsense — but you never attack people. You invite them to see a better way.

Invitational, not persuasive. You don't push or hype. You hold space, tell the truth, and let resonance do the work.

Rhythmic and readable. Short lines. Natural breaks. Emphasis that feels like real conversation, not copywriting gymnastics.

The goal: write emails that connect, not convince — where every word sounds like it came from a real person who's lived it, learned it, and is here to help others do the same.

Refer to their webinar chat engagement and ONLY where it makes sense - mention things that make the reader feel as though you saw their comment and appreciate their engagement. It should sound authentic and natural, not forced.

Your task is to generate 3 different email versions with varying phrasings, structures, and openings. For each version:
1. Assign a probability rating (0-100) indicating how common or typical that response pattern is
2. Higher probability = more common/generic pattern
3. Lower probability = more unique/distinctive pattern

After generating all 3 versions, select the version with the LOWEST probability rating and return only that version as the final email.

IMPORTANT CONSTRAINTS:
- Maximum 500 words per email
- Subject line + body format
- Conversational tone throughout
- Natural mention of fast action bonus (if applicable)
- No placeholder text like [Your Name] or [Insert Details]
- Make it sound human, not AI-generated"""


def build_hot_lead_prompt(context: Dict[str, any]) -> str:
    """
    Build prompt for Hot Lead tier (80-100 engagement score).

    These are highly engaged attendees who stayed focused, participated actively,
    and asked questions. They're primed and ready to take action.
    """
    chat_ref = ""
    if context["message_count"] > 0:
        chat_ref = f"\n\nTheir chat activity:\n{context['chat_context']}"

    return f"""Generate a personalized follow-up email for a HOT LEAD from our webinar.

ATTENDEE PROFILE:
- Name: {context['attendee_name']}
- Engagement Score: {context['engagement_score']}/100 (TOP TIER)
- Focus: {context['focus_percent']}% (highly focused)
- Attendance: {context['attendance_percent']}% of webinar
- Chat Messages: {context['message_count']} (including {context['question_count']} questions){chat_ref}

WEBINAR & OFFER:
- Topic: {context['webinar_topic']}
- Offer: {context['offer_name']} - {context['offer_description']}
- Price: ${context['price']}
- Deadline: {context['deadline']}
- Replay: {context['replay_url'] if context['replay_url'] else 'available upon request'}

TONE & APPROACH:
- Write like you're talking to a friend, not selling to a prospect
- If they had chat activity, reference it naturally and authentically (only if it adds real value)
- Acknowledge their exceptional engagement without being overly effusive
- Share the opportunity with honest excitement, not hype
- Invite them to join with confidence, but hold space for their decision
- Mention the deadline as helpful context, not pressure
- Be real, vulnerable, and human — not polished corporate speak

Remember: Generate 3 versions with probability ratings, then select and return ONLY the lowest probability version.

Format:
Subject: [your subject line]

[email body - conversational, max 500 words]

---
SELECTED VERSION PROBABILITY: [X%]"""


def build_warm_lead_prompt(context: Dict[str, any]) -> str:
    """
    Build prompt for Warm Lead tier (60-79 engagement score).

    These attendees showed good engagement but weren't at the top tier.
    They're interested and engaged, just need a gentle nudge.
    """
    chat_ref = ""
    if context["message_count"] > 0:
        chat_ref = f"\n\nTheir chat activity:\n{context['chat_context']}"

    return f"""Generate a personalized follow-up email for a WARM LEAD from our webinar.

ATTENDEE PROFILE:
- Name: {context['attendee_name']}
- Engagement Score: {context['engagement_score']}/100 (strong engagement)
- Focus: {context['focus_percent']}%
- Attendance: {context['attendance_percent']}% of webinar
- Chat Messages: {context['message_count']} (including {context['question_count']} questions){chat_ref}

WEBINAR & OFFER:
- Topic: {context['webinar_topic']}
- Offer: {context['offer_name']} - {context['offer_description']}
- Price: ${context['price']}
- Deadline: {context['deadline']}
- Replay: {context['replay_url'] if context['replay_url'] else 'available upon request'}

TONE & APPROACH:
- Write like you're following up with someone you genuinely enjoyed meeting
- If they had chat activity, weave it in naturally (only if it adds real connection)
- Acknowledge their engagement without making it weird or forced
- Share the opportunity honestly, not as a pitch
- Invite them warmly, respecting their autonomy
- Address concerns with empathy and truth, not deflection

Remember: Generate 3 versions with probability ratings, then select and return ONLY the lowest probability version.

Format:
Subject: [your subject line]

[email body - conversational, max 500 words]

---
SELECTED VERSION PROBABILITY: [X%]"""


def build_cool_lead_prompt(context: Dict[str, any]) -> str:
    """
    Build prompt for Cool Lead tier (40-59 engagement score).

    These attendees showed moderate interest but weren't highly engaged.
    They need more value demonstration and a softer approach.
    """
    chat_ref = ""
    if context["message_count"] > 0:
        chat_ref = f"\n\nTheir chat activity:\n{context['chat_context']}"

    return f"""Generate a personalized follow-up email for a COOL LEAD from our webinar.

ATTENDEE PROFILE:
- Name: {context['attendee_name']}
- Engagement Score: {context['engagement_score']}/100 (moderate engagement)
- Focus: {context['focus_percent']}%
- Attendance: {context['attendance_percent']}% of webinar
- Chat Messages: {context['message_count']}{chat_ref}

WEBINAR & OFFER:
- Topic: {context['webinar_topic']}
- Offer: {context['offer_name']} - {context['offer_description']}
- Price: ${context['price']}
- Deadline: {context['deadline']}
- Replay: {context['replay_url'] if context['replay_url'] else 'available upon request'}

TONE & APPROACH:
- Write like you're checking in with someone who seemed interested but distracted
- If they had any chat activity, reference it genuinely (only if natural)
- Recap key insights without lecturing
- Offer the replay as a genuine resource, not a sales tactic
- Mention the offer as an option, not an agenda
- Keep it light, warm, and pressure-free
- Educational without being preachy

Remember: Generate 3 versions with probability ratings, then select and return ONLY the lowest probability version.

Format:
Subject: [your subject line]

[email body - conversational, max 500 words]

---
SELECTED VERSION PROBABILITY: [X%]"""


def build_cold_lead_prompt(context: Dict[str, any]) -> str:
    """
    Build prompt for Cold Lead tier (0-39 engagement score).

    These attendees were present but not engaged. They may have been
    multitasking or distracted. Very soft, no-pressure approach needed.
    """
    return f"""Generate a personalized follow-up email for a COLD LEAD from our webinar.

ATTENDEE PROFILE:
- Name: {context['attendee_name']}
- Engagement Score: {context['engagement_score']}/100 (limited engagement)
- Focus: {context['focus_percent']}%
- Attendance: {context['attendance_percent']}% of webinar
- Chat Messages: {context['message_count']}

WEBINAR & OFFER:
- Topic: {context['webinar_topic']}
- Offer: {context['offer_name']} - {context['offer_description']}
- Price: ${context['price']}
- Deadline: {context['deadline']}
- Replay: {context['replay_url'] if context['replay_url'] else 'available upon request'}

TONE & APPROACH:
- Write with complete non-judgment — life is messy, multitasking happens
- Offer the replay with genuine helpfulness, not guilt
- Share highlights that actually matter
- Mention the opportunity super casually, like you're letting them know about something cool
- Zero pressure, zero hype, zero tactics
- Make it easy for them to engage if it resonates

Remember: Generate 3 versions with probability ratings, then select and return ONLY the lowest probability version.

Format:
Subject: [your subject line]

[email body - conversational, max 500 words]

---
SELECTED VERSION PROBABILITY: [X%]"""


def build_no_show_prompt(context: Dict[str, any]) -> str:
    """
    Build prompt for No-Show tier.

    These registrants didn't attend. Zero guilt or shame. Create curiosity
    and FOMO about what they missed, with a special incentive for watching.
    """
    return f"""Generate a personalized follow-up email for a NO-SHOW from our webinar.

ATTENDEE PROFILE:
- Name: {context['attendee_name']}
- Status: Registered but didn't attend
- They missed the live event

WEBINAR & OFFER:
- Topic: {context['webinar_topic']}
- Offer: {context['offer_name']} - {context['offer_description']}
- Price: ${context['price']}
- Deadline: {context['deadline']}
- Replay: {context['replay_url'] if context['replay_url'] else 'available upon request'}

TONE & APPROACH:
- Write with total understanding — no guilt, no shame, life happens
- Acknowledge that things come up without being condescending
- Create genuine curiosity, not manufactured FOMO
- Offer the replay as something truly valuable, not a consolation prize
- Share what they missed in a way that sparks interest, not pressure
- Mention the bonus naturally, not as a hook
- Make them feel welcomed, not like they're behind

Remember: Generate 3 versions with probability ratings, then select and return ONLY the lowest probability version.

Format:
Subject: [your subject line]

[email body - conversational, max 500 words]

---
SELECTED VERSION PROBABILITY: [X%]"""


def parse_ai_response(response_text: str) -> Tuple[str, str, int]:
    """
    Parse the AI response to extract subject, body, and probability.

    Args:
        response_text: Raw response from OpenAI

    Returns:
        Tuple of (subject_line, email_body, probability_score)
    """
    lines = response_text.strip().split('\n')

    subject_line = ""
    email_body_lines = []
    probability = 50

    in_body = False

    for line in lines:
        line = line.strip()

        if line.startswith("Subject:"):
            subject_line = line.replace("Subject:", "").strip()
            in_body = True
            continue

        if "SELECTED VERSION PROBABILITY:" in line:
            prob_str = line.split(":")[-1].strip().replace("%", "")
            try:
                probability = int(prob_str)
            except ValueError:
                probability = 50
            break

        if in_body and line and not line.startswith("---"):
            email_body_lines.append(line)

    email_body = "\n\n".join(email_body_lines).strip()

    if not subject_line or not email_body:
        raise EmailGenerationError("Failed to parse AI response - missing subject or body")

    return subject_line, email_body, probability


def generate_email_with_retry(
    attendee: Attendee,
    webinar: Webinar,
    db: Session,
    max_retries: int = None
) -> Dict[str, any]:
    """
    Generate a personalized email for an attendee with retry logic.

    Args:
        attendee: Attendee object
        webinar: Webinar object
        db: Database session
        max_retries: Maximum number of retry attempts (uses config default if None)

    Returns:
        Dictionary with generated email data and metadata

    Raises:
        EmailGenerationError: If generation fails after all retries
    """
    if max_retries is None:
        max_retries = settings.OPENAI_MAX_RETRIES

    chat_messages = attendee.chat_messages
    context = format_attendee_context(attendee, webinar, chat_messages)

    tier = attendee.engagement_tier or "No-Show"
    if tier == "Hot Lead":
        prompt = build_hot_lead_prompt(context)
    elif tier == "Warm Lead":
        prompt = build_warm_lead_prompt(context)
    elif tier == "Cool Lead":
        prompt = build_cool_lead_prompt(context)
    elif tier == "Cold Lead":
        prompt = build_cold_lead_prompt(context)
    else:
        prompt = build_no_show_prompt(context)

    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    last_error = None
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": build_system_prompt()},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE,
                timeout=settings.OPENAI_TIMEOUT
            )

            response_text = response.choices[0].message.content
            subject_line, email_body, probability = parse_ai_response(response_text)

            chat_references = []
            if chat_messages:
                chat_references = [
                    {
                        "message": msg.message_text,
                        "is_question": msg.is_question,
                        "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
                    }
                    for msg in chat_messages
                ]

            return {
                "subject_line": subject_line,
                "email_body_text": email_body,
                "email_body_html": None,
                "engagement_score": attendee.engagement_score,
                "engagement_tier": attendee.engagement_tier,
                "personalization_elements": {
                    "engagement_score": context["engagement_score"],
                    "engagement_tier": context["engagement_tier"],
                    "focus_percent": context["focus_percent"],
                    "attendance_percent": context["attendance_percent"],
                    "message_count": context["message_count"],
                    "question_count": context["question_count"],
                    "chat_references": chat_references,
                    "ai_selection_info": {
                        "selected_probability": probability,
                        "model_used": settings.OPENAI_MODEL,
                        "generation_method": "3-version-selection"
                    }
                },
                "generation_metadata": {
                    "model_used": settings.OPENAI_MODEL,
                    "tokens_consumed": response.usage.total_tokens,
                    "temperature": settings.OPENAI_TEMPERATURE,
                    "max_tokens": settings.OPENAI_MAX_TOKENS
                }
            }

        except Exception as e:
            last_error = e
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                time.sleep(wait_time)
                continue

    raise EmailGenerationError(f"Failed to generate email after {max_retries} attempts: {str(last_error)}")


def validate_email_content(subject: str, body: str) -> bool:
    """
    Validate that generated email meets quality standards.

    Args:
        subject: Email subject line
        body: Email body text

    Returns:
        True if valid, False otherwise
    """
    placeholders = [
        "[your name]", "[insert", "[name]", "[email]",
        "[company]", "[details]", "xxx", "placeholder"
    ]

    content_lower = (subject + " " + body).lower()

    for placeholder in placeholders:
        if placeholder in content_lower:
            return False

    word_count = len(body.split())
    if word_count > 550 or word_count < 50:
        return False

    if not subject or len(subject) < 5 or len(subject) > 100:
        return False

    return True
