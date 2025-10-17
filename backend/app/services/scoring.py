"""
Engagement scoring algorithm for webinar attendees
"""
from typing import Optional


def calculate_engagement_score(
    focus_percent: Optional[int],
    attendance_percent: Optional[int],
    message_count: int,
    question_count: int
) -> int:
    """
    Calculate composite engagement score for an attendee.
    
    Scoring breakdown:
    - Focus % (40% weight): 0-40 points
    - Attendance % (30% weight): 0-30 points
    - Chat Engagement (20% weight): 0-20 points
    - Question Bonus (10% weight): 0-10 points
    
    Args:
        focus_percent: Percentage of time attendee was focused (0-100)
        attendance_percent: Percentage of webinar attended (0-100)
        message_count: Number of chat messages sent
        question_count: Number of questions asked
        
    Returns:
        Engagement score (0-100)
    """
    total_score = 0
    
    # Focus Score (40% weight, 0-40 points)
    if focus_percent is not None:
        if focus_percent >= 80:
            focus_score = 40  # 100 points * 0.4
        elif focus_percent >= 60:
            focus_score = 28  # 70 points * 0.4
        elif focus_percent >= 40:
            focus_score = 16  # 40 points * 0.4
        else:
            focus_score = 0   # 0 points
        total_score += focus_score
    
    # Attendance Score (30% weight, 0-30 points)
    if attendance_percent is not None:
        if attendance_percent >= 90:
            attendance_score = 30  # 100 points * 0.3
        elif attendance_percent >= 75:
            attendance_score = 21  # 70 points * 0.3
        elif attendance_percent >= 50:
            attendance_score = 12  # 40 points * 0.3
        else:
            attendance_score = 0   # 0 points
        total_score += attendance_score
    
    # Chat Engagement Score (20% weight, 0-20 points)
    if message_count >= 5:
        chat_score = 20  # 100 points * 0.2
    elif message_count >= 3:
        chat_score = 14  # 70 points * 0.2
    elif message_count >= 1:
        chat_score = 8   # 40 points * 0.2
    else:
        chat_score = 0   # 0 points
    total_score += chat_score
    
    # Question Bonus (10% weight, 0-10 points)
    if question_count >= 2:
        question_score = 10  # 100 points * 0.1
    elif question_count >= 1:
        question_score = 7   # 70 points * 0.1
    else:
        question_score = 0   # 0 points
    total_score += question_score
    
    # Ensure score is between 0-100
    return max(0, min(100, int(total_score)))


def determine_tier(score: int, attended: bool) -> str:
    """
    Determine engagement tier based on score.
    
    Tiers:
    - Hot Lead (80-100): High focus + high engagement = Ready to buy!
    - Warm Lead (60-79): Good engagement but some distraction
    - Cool Lead (40-59): Interested but not fully engaged
    - Cold Lead (0-39): Attended but not engaged
    - No-Show: Registered but didn't attend
    
    Args:
        score: Engagement score (0-100)
        attended: Whether the person attended the webinar
        
    Returns:
        Engagement tier string
    """
    if not attended:
        return "No-Show"
    
    if score >= 80:
        return "Hot Lead"
    elif score >= 60:
        return "Warm Lead"
    elif score >= 40:
        return "Cool Lead"
    else:
        return "Cold Lead"


def get_tier_color(tier: str) -> str:
    """
    Get color code for tier badge display.
    
    Args:
        tier: Engagement tier
        
    Returns:
        Color name for UI display
    """
    tier_colors = {
        "Hot Lead": "red",
        "Warm Lead": "orange",
        "Cool Lead": "yellow",
        "Cold Lead": "blue",
        "No-Show": "gray"
    }
    return tier_colors.get(tier, "gray")


def get_tier_priority(tier: str) -> int:
    """
    Get numeric priority for tier (for sorting).
    
    Args:
        tier: Engagement tier
        
    Returns:
        Priority number (1 = highest priority)
    """
    tier_priority = {
        "Hot Lead": 1,
        "Warm Lead": 2,
        "Cool Lead": 3,
        "Cold Lead": 4,
        "No-Show": 5
    }
    return tier_priority.get(tier, 5)

