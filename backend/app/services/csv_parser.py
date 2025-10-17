"""
CSV parsing service for attendance and chat data
"""
import csv
import io
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import UploadFile, HTTPException


def parse_attendance_csv(file: UploadFile) -> List[Dict[str, Any]]:
    """
    Parse attendance CSV file.
    
    Expected columns: Name, Email, Attended, Attendance %, Focus %, 
                     Attendance Minutes, Join Time, Exit Time, Location
    
    Returns list of attendee dictionaries.
    """
    try:
        # Read file content
        contents = file.file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(contents))
        
        attendees = []
        for row in csv_reader:
            # Parse the row - handle various column name variations
            name = row.get('Name') or row.get('name') or row.get('NAME')
            email = row.get('Email') or row.get('email') or row.get('EMAIL')
            
            if not name or not email:
                continue  # Skip rows without name or email
            
            # Parse attended status
            attended_str = (row.get('Attended') or row.get('attended') or 'No').strip().lower()
            attended = attended_str in ['yes', 'true', '1', 'y']
            
            # Parse percentages (remove % sign if present)
            attendance_percent = parse_percent(row.get('Attendance %') or row.get('Attendance') or '0')
            focus_percent = parse_percent(row.get('Focus %') or row.get('Focus') or '0')
            
            # Parse attendance minutes
            attendance_minutes_str = row.get('Attendance Minutes') or row.get('Attendance minutes') or '0'
            try:
                attendance_minutes = int(float(attendance_minutes_str))
            except (ValueError, TypeError):
                attendance_minutes = 0
            
            # Parse timestamps
            join_time = parse_datetime(row.get('Join Time') or row.get('Join time'))
            exit_time = parse_datetime(row.get('Exit Time') or row.get('Exit time'))
            
            location = row.get('Location') or row.get('location') or ''
            
            attendee = {
                'name': name,
                'email': email.lower().strip(),
                'attended': attended,
                'attendance_percent': attendance_percent,
                'focus_percent': focus_percent,
                'attendance_minutes': attendance_minutes,
                'join_time': join_time,
                'exit_time': exit_time,
                'location': location
            }
            
            attendees.append(attendee)
        
        return attendees
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error parsing attendance CSV: {str(e)}"
        )


def parse_chat_csv(file: UploadFile) -> List[Dict[str, Any]]:
    """
    Parse chat CSV file.
    
    Expected columns: Timestamp, Name, Email, Message, Is Question
    
    Returns list of chat message dictionaries.
    """
    try:
        # Read file content
        contents = file.file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(contents))
        
        messages = []
        for row in csv_reader:
            # Parse the row
            timestamp_str = row.get('Timestamp') or row.get('timestamp') or row.get('Time')
            name = row.get('Name') or row.get('name')
            email = row.get('Email') or row.get('email')
            message_text = row.get('Message') or row.get('message') or row.get('Text')
            
            if not email or not message_text:
                continue  # Skip rows without email or message
            
            # Parse is_question
            is_question_str = (row.get('Is Question') or row.get('is_question') or 'No').strip().lower()
            is_question = is_question_str in ['yes', 'true', '1', 'y']
            
            # Also detect questions by looking for ? at the end
            if not is_question and message_text.strip().endswith('?'):
                is_question = True
            
            timestamp = parse_datetime(timestamp_str)
            
            message = {
                'name': name or '',
                'email': email.lower().strip(),
                'message_text': message_text,
                'timestamp': timestamp,
                'is_question': is_question
            }
            
            messages.append(message)
        
        return messages
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error parsing chat CSV: {str(e)}"
        )


def match_attendees_to_chats(
    attendees: List[Dict[str, Any]],
    messages: List[Dict[str, Any]]
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Match chat messages to attendees by email.
    
    Returns dictionary mapping email to list of messages.
    """
    # Create a mapping of email to messages
    email_to_messages = {}
    
    for message in messages:
        email = message['email']
        if email not in email_to_messages:
            email_to_messages[email] = []
        email_to_messages[email].append(message)
    
    return email_to_messages


def parse_percent(value: str) -> int:
    """
    Parse percentage string to integer (0-100).
    Handles values like "85%", "85.5", "85", etc.
    """
    if not value:
        return 0
    
    try:
        # Remove % sign and whitespace
        value = value.strip().replace('%', '')
        # Convert to float then int
        percent = int(float(value))
        # Clamp to 0-100 range
        return max(0, min(100, percent))
    except (ValueError, TypeError):
        return 0


def parse_datetime(value: Optional[str]) -> Optional[datetime]:
    """
    Parse datetime string to datetime object.
    Tries multiple common formats.
    """
    if not value or not value.strip():
        return None
    
    formats = [
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%d %H:%M',
        '%m/%d/%Y %H:%M:%S',
        '%m/%d/%Y %H:%M',
        '%d/%m/%Y %H:%M:%S',
        '%d/%m/%Y %H:%M',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%SZ',
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(value.strip(), fmt)
        except ValueError:
            continue
    
    # If all formats fail, return None
    return None

