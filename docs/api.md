# WebinarWins API Documentation

**CONFIDENTIAL - Internal Documentation Only**

Version: 1.0.0 (MVP)  
Base URL: `http://localhost:8000/api/v1` (Development)  
Production URL: `https://api.webinarwins.com/api/v1`

**Note:** This API documentation is proprietary and confidential. Not for public distribution.

---

## Table of Contents

- [Authentication](#authentication)
- [Webinars](#webinars)
- [Attendees](#attendees)
- [Emails](#emails)
- [Insights](#insights)
- [Users](#users)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All API requests require authentication using JWT Bearer tokens.

### Login with Google OAuth

```http
POST /api/v1/auth/google
Content-Type: application/json

{
  "id_token": "google_oauth_id_token"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "subscription_tier": "starter"
  }
}
```

### Using Bearer Tokens

Include the token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Webinars

### Create Webinar Session

Upload CSV files and create a new webinar session.

```http
POST /api/v1/webinars/create
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "title": "Building Custom GPTs for Your Business",
  "topic": "AI and Custom GPT development",
  "date_hosted": "2025-10-01T14:00:00Z",
  "offer_name": "AI Evolution Lab Membership",
  "offer_description": "Monthly membership with training and community",
  "price": 97.00,
  "deadline": "48 hours",
  "replay_url": "https://example.com/replay",
  "attendance_csv": <file>,
  "chat_csv": <file>
}
```

**CSV Format - Attendance:**
```csv
Name,Email,Attended,Attendance %,Focus %,Attendance Minutes,Join Time,Exit Time,Location
John Doe,john@example.com,Yes,100,97,60,2025-10-01 14:00,2025-10-01 15:00,New York
```

**CSV Format - Chat:**
```csv
Timestamp,Name,Email,Message,Is Question
2025-10-01 14:15,John Doe,john@example.com,Great presentation!,No
2025-10-01 14:30,John Doe,john@example.com,Can you limit sharing?,Yes
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Building Custom GPTs for Your Business",
  "topic": "AI and Custom GPT development",
  "date_hosted": "2025-10-01T14:00:00Z",
  "offer": {
    "name": "AI Evolution Lab Membership",
    "description": "Monthly membership with training and community",
    "price": 97.00,
    "deadline": "48 hours"
  },
  "replay_url": "https://example.com/replay",
  "attendee_count": 14,
  "registrant_count": 45,
  "no_show_count": 31,
  "created_at": "2025-10-15T10:30:00Z",
  "status": "processing"
}
```

**Status Codes:**
- `201 Created` - Webinar created successfully
- `400 Bad Request` - Invalid CSV format or missing required fields
- `401 Unauthorized` - Missing or invalid token
- `413 Payload Too Large` - CSV files too large (max 10MB each)

---

### Get Webinar Details

```http
GET /api/v1/webinars/{webinar_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Building Custom GPTs for Your Business",
  "topic": "AI and Custom GPT development",
  "date_hosted": "2025-10-01T14:00:00Z",
  "offer": {
    "name": "AI Evolution Lab Membership",
    "description": "Monthly membership with training and community",
    "price": 97.00,
    "deadline": "48 hours"
  },
  "replay_url": "https://example.com/replay",
  "stats": {
    "total_registrants": 45,
    "total_attendees": 14,
    "no_shows": 31,
    "attendance_rate": 31.1,
    "hot_leads": 3,
    "warm_leads": 3,
    "cool_leads": 3,
    "cold_leads": 5,
    "avg_focus_percent": 72.5,
    "avg_attendance_percent": 88.2,
    "total_chat_messages": 79
  },
  "created_at": "2025-10-15T10:30:00Z",
  "status": "completed"
}
```

---

### List User's Webinars

```http
GET /api/v1/webinars
Authorization: Bearer {token}
Query Parameters:
  - page: int (default: 1)
  - limit: int (default: 20, max: 100)
  - status: string (processing|completed|archived)
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Building Custom GPTs",
      "date_hosted": "2025-10-01T14:00:00Z",
      "attendee_count": 14,
      "hot_leads": 3,
      "status": "completed",
      "created_at": "2025-10-15T10:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "pages": 1
}
```

---

### Generate Emails for Webinar

Trigger AI-powered email generation for all attendees.

```http
POST /api/v1/webinars/{webinar_id}/generate-emails
Authorization: Bearer {token}
Content-Type: application/json

{
  "regenerate": false  // Set to true to regenerate all emails
}
```

**Response:**
```json
{
  "webinar_id": "uuid",
  "status": "generating",
  "estimated_completion": "2025-10-15T10:32:00Z",
  "total_emails_to_generate": 45,
  "message": "Email generation started. This will take approximately 30 seconds."
}
```

**Check generation status:**
```http
GET /api/v1/webinars/{webinar_id}/generation-status
```

**Status Response:**
```json
{
  "status": "completed",
  "progress": 100,
  "emails_generated": 45,
  "errors": 0,
  "completed_at": "2025-10-15T10:31:45Z"
}
```

---

### Delete Webinar

```http
DELETE /api/v1/webinars/{webinar_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "Webinar deleted successfully",
  "id": "uuid"
}
```

---

## Attendees

### List Attendees with Engagement Scores

```http
GET /api/v1/webinars/{webinar_id}/attendees
Authorization: Bearer {token}
Query Parameters:
  - tier: string (hot|warm|cool|cold|no-show)
  - min_score: int (0-100)
  - max_score: int (0-100)
  - has_questions: bool
  - sort_by: string (score|focus|attendance|messages) (default: score)
  - sort_order: string (asc|desc) (default: desc)
  - page: int (default: 1)
  - limit: int (default: 50)
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Lori Smith",
      "email": "lori@example.com",
      "attended": true,
      "engagement_score": 93,
      "engagement_tier": "hot",
      "focus_percent": 97,
      "attendance_percent": 100,
      "attendance_minutes": 60,
      "chat_messages_count": 8,
      "questions_count": 2,
      "messages": [
        {
          "timestamp": "2025-10-01T14:15:00Z",
          "message": "This is exactly what I need!",
          "is_question": false
        },
        {
          "timestamp": "2025-10-01T14:30:00Z",
          "message": "Can you show more examples?",
          "is_question": true
        }
      ],
      "score_breakdown": {
        "focus_score": 40,
        "attendance_score": 30,
        "chat_score": 20,
        "question_score": 10
      },
      "email_generated": true,
      "email_id": "uuid"
    }
  ],
  "total": 14,
  "page": 1,
  "pages": 1,
  "summary": {
    "hot_leads": 3,
    "warm_leads": 3,
    "cool_leads": 3,
    "cold_leads": 5
  }
}
```

---

### Get Single Attendee

```http
GET /api/v1/attendees/{attendee_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "webinar_id": "uuid",
  "name": "Lori Smith",
  "email": "lori@example.com",
  "attended": true,
  "engagement_score": 93,
  "engagement_tier": "hot",
  "focus_percent": 97,
  "attendance_percent": 100,
  "attendance_minutes": 60,
  "join_time": "2025-10-01T14:00:00Z",
  "exit_time": "2025-10-01T15:00:00Z",
  "location": "New York, USA",
  "chat_messages": [
    {
      "id": "uuid",
      "timestamp": "2025-10-01T14:15:00Z",
      "message": "This is exactly what I need!",
      "is_question": false
    }
  ],
  "score_breakdown": {
    "focus_score": 40,
    "attendance_score": 30,
    "chat_score": 20,
    "question_score": 10
  },
  "email": {
    "id": "uuid",
    "subject": "Lori, your question about AI + human touch...",
    "generated_at": "2025-10-15T10:31:00Z",
    "edited": false
  }
}
```

---

## Emails

### Get Generated Email

```http
GET /api/v1/emails/{email_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "attendee_id": "uuid",
  "attendee_name": "Lori Smith",
  "attendee_email": "lori@example.com",
  "subject_line": "Lori, your question about AI + human touch...",
  "email_body_text": "Hi Lori,\n\nI couldn't help but notice...",
  "email_body_html": "<p>Hi Lori,</p><p>I couldn't help but notice...</p>",
  "engagement_score": 93,
  "engagement_tier": "hot",
  "personalization_elements": {
    "references_question": true,
    "mentions_focus": true,
    "includes_chat_quote": true,
    "custom_urgency": true
  },
  "user_edited": false,
  "user_notes": "",
  "generated_at": "2025-10-15T10:31:00Z",
  "updated_at": "2025-10-15T10:31:00Z"
}
```

---

### Update Email

Edit a generated email.

```http
PUT /api/v1/emails/{email_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "subject_line": "Updated subject line",
  "email_body_text": "Updated email body...",
  "email_body_html": "<p>Updated email body...</p>",
  "user_notes": "Added personal touch about their business"
}
```

**Response:**
```json
{
  "id": "uuid",
  "subject_line": "Updated subject line",
  "email_body_text": "Updated email body...",
  "user_edited": true,
  "updated_at": "2025-10-15T11:00:00Z"
}
```

---

### List Emails for Webinar

```http
GET /api/v1/webinars/{webinar_id}/emails
Authorization: Bearer {token}
Query Parameters:
  - tier: string (hot|warm|cool|cold|no-show)
  - edited_only: bool
  - page: int
  - limit: int
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "attendee_name": "Lori Smith",
      "attendee_email": "lori@example.com",
      "subject_line": "Lori, your question about...",
      "engagement_tier": "hot",
      "engagement_score": 93,
      "user_edited": false,
      "generated_at": "2025-10-15T10:31:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pages": 1
}
```

---

## Insights

### Get Webinar Insights & Analytics

```http
GET /api/v1/webinars/{webinar_id}/insights
Authorization: Bearer {token}
```

**Response:**
```json
{
  "webinar_id": "uuid",
  "overview": {
    "total_registrants": 45,
    "total_attendees": 14,
    "no_shows": 31,
    "attendance_rate": 31.1,
    "hot_leads": 3,
    "warm_leads": 3,
    "cool_leads": 3,
    "cold_leads": 5
  },
  "engagement_distribution": {
    "hot_leads_percent": 21.4,
    "warm_leads_percent": 21.4,
    "cool_leads_percent": 21.4,
    "cold_leads_percent": 35.7
  },
  "focus_analysis": {
    "average": 72.5,
    "median": 75.0,
    "highest": 100,
    "lowest": 11,
    "distribution": {
      "80-100%": 5,
      "60-79%": 3,
      "40-59%": 3,
      "0-39%": 3
    }
  },
  "chat_analysis": {
    "total_messages": 79,
    "total_questions": 15,
    "most_active": [
      {
        "name": "Laura",
        "messages": 13,
        "questions": 0
      }
    ],
    "common_topics": [
      "imposter syndrome",
      "monetization",
      "Claude vs GPT"
    ]
  },
  "priority_follow_ups": [
    {
      "rank": 1,
      "name": "Rachel",
      "email": "rachel@example.com",
      "score": 91,
      "tier": "hot",
      "key_signals": [
        "Asked 6 questions about monetization",
        "93% focus throughout",
        "Showed buying intent"
      ],
      "recommended_action": "Call personally within 2 hours"
    }
  ],
  "revenue_opportunity": {
    "hot_leads_value": 2250.00,
    "warm_leads_value": 1350.00,
    "total_potential": 3600.00,
    "conversion_estimate": "30-40% on hot leads = $675-900"
  },
  "benchmarks": {
    "your_attendance_rate": 31.1,
    "industry_average": 40.0,
    "your_hot_leads": 21.4,
    "industry_average_engagement": 15.0
  },
  "recommendations": [
    "5 people with 86%+ focus didn't buy - consider addressing objections",
    "31 no-shows need re-engagement - send replay within 24 hours",
    "Chat analysis shows 'imposter syndrome' mentioned 4 times - address this in follow-ups"
  ]
}
```

---

### Get Priority Follow-Up List

```http
GET /api/v1/webinars/{webinar_id}/priority-list
Authorization: Bearer {token}
Query Parameters:
  - limit: int (default: 10)
```

**Response:**
```json
{
  "webinar_id": "uuid",
  "generated_at": "2025-10-15T10:35:00Z",
  "priority_list": [
    {
      "rank": 1,
      "attendee_id": "uuid",
      "name": "Rachel Bellamy",
      "email": "rachel@example.com",
      "phone": null,
      "engagement_score": 91,
      "tier": "hot",
      "focus_percent": 93,
      "attendance_percent": 81,
      "key_signals": [
        "📞 Asked 6 questions about monetization",
        "💬 Highly engaged in chat",
        "🎯 Showed buying intent: 'Can you limit sharing?'"
      ],
      "talking_points": [
        "Reference her questions about GPT monetization",
        "Address her concern about content sharing/protection",
        "Mention she was one of the most engaged participants"
      ],
      "recommended_action": "Call personally within 2 hours",
      "estimated_close_probability": "60-70%"
    }
  ],
  "summary": {
    "total_priority_leads": 5,
    "estimated_value": 2250.00,
    "recommended_timeline": "Contact all within 2-4 hours for maximum impact"
  }
}
```

---

## Export

### Export Emails to CSV

```http
POST /api/v1/webinars/{webinar_id}/export
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "csv",  // csv, mailchimp, json
  "include_tiers": ["hot", "warm", "cool", "cold", "no-show"],
  "include_fields": [
    "name",
    "email",
    "subject",
    "body_text",
    "body_html",
    "engagement_score",
    "engagement_tier",
    "focus_percent",
    "attendance_percent",
    "has_questions",
    "user_notes"
  ]
}
```

**Response:**
```json
{
  "download_url": "https://api.webinarwins.com/downloads/uuid/export.csv",
  "expires_at": "2025-10-15T12:00:00Z",
  "file_size": 125000,
  "record_count": 45,
  "format": "csv"
}
```

---

## Users

### Get Current User Profile

```http
GET /api/v1/users/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "subscription_tier": "starter",
  "api_credits_remaining": 4,
  "webinars_processed": 1,
  "created_at": "2025-09-01T10:00:00Z",
  "subscription": {
    "plan": "starter",
    "status": "active",
    "current_period_start": "2025-10-01T00:00:00Z",
    "current_period_end": "2025-11-01T00:00:00Z",
    "webinars_limit": 4,
    "attendees_limit": 100
  }
}
```

---

### Update User Profile

```http
PUT /api/v1/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Smith",
  "company": "Acme Inc",
  "phone": "+1234567890"
}
```

---

## Error Handling

All API errors follow a consistent format:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    },
    "request_id": "uuid"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `authentication_required` | 401 | Missing or invalid authentication token |
| `invalid_token` | 401 | Token expired or malformed |
| `permission_denied` | 403 | User doesn't have access to this resource |
| `resource_not_found` | 404 | Requested resource doesn't exist |
| `validation_error` | 400 | Request data validation failed |
| `rate_limit_exceeded` | 429 | Too many requests |
| `csv_parse_error` | 400 | CSV file format is invalid |
| `openai_api_error` | 500 | OpenAI API request failed |
| `database_error` | 500 | Database operation failed |
| `quota_exceeded` | 403 | User exceeded their plan limits |

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Free Trial**: 10 requests/minute
- **Starter**: 30 requests/minute
- **Pro**: 100 requests/minute

Rate limit headers are included in every response:

```http
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1697380800
```

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retry_after": 60
  }
}
```

---

## Webhooks (Coming Soon)

Webhooks will notify your application when events occur:

- `webinar.created`
- `webinar.emails_generated`
- `email.edited`
- `export.completed`

---

## SDKs and Client Libraries (Coming Soon)

Official client libraries will be available for:

- JavaScript/TypeScript
- Python
- Ruby
- PHP

---

## Support

- **API Status**: [status.webinarwins.com](https://status.webinarwins.com)
- **Interactive Docs**: [localhost:8000/docs](http://localhost:8000/docs)
- **Support Email**: api@webinarwins.com

---

## Changelog

### v1.0.0 (MVP) - October 2025
- Initial API release
- Core webinar management endpoints
- Email generation with 5-tier system
- Engagement scoring and insights
- CSV export functionality

---

<div align="center">

**WebinarWins API Documentation**

[Back to README](../README.md) | [Architecture Docs](architecture.md)

</div>

