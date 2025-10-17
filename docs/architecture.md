# WebinarWins MVP - Architecture Documentation

**CONFIDENTIAL - Internal Documentation Only**

Version: 1.0.0  
Last Updated: October 15, 2025

**Note:** This document contains proprietary technical information. Not for public distribution.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [API Architecture](#api-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Security](#security)
- [Performance Considerations](#performance-considerations)
- [Deployment Architecture](#deployment-architecture)

---

## Overview

WebinarWins MVP is built as a modern, scalable web application using a decoupled frontend-backend architecture. The system is designed to handle CSV uploads, process engagement data, generate personalized emails using AI, and provide analytics insights.

### Key Design Principles

1. **Simplicity First** - Keep the MVP simple and focused on core value
2. **API-First** - Backend exposes RESTful APIs for frontend consumption
3. **Scalable Foundation** - Architecture allows for future growth
4. **AI-Powered** - Leverage OpenAI GPT-4 for intelligent email generation
5. **Data Privacy** - User data is encrypted and can be deleted on request

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React Frontend (Vite)                        │  │
│  │  - Upload UI  - Dashboard  - Email Review  - Export      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                         HTTPS/REST                               │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           FastAPI Backend (Python 3.11+)                  │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │   API v1    │  │   Services   │  │   Core Logic   │  │  │
│  │  │  Endpoints  │  │  - CSV Parse │  │   - Scoring    │  │  │
│  │  │             │  │  - AI Gen    │  │   - Auth       │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐    ┌────────────────────┐    ┌─────────────┐
│  PostgreSQL  │    │   OpenAI GPT-4     │    │  SendGrid   │
│   Database   │    │   API (Email Gen)  │    │  (Emails)   │
└──────────────┘    └────────────────────┘    └─────────────┘
```

---

## Technology Stack

### Frontend Stack

```
React 18.2
├── Vite (Build Tool)
├── React Router (Navigation)
├── Zustand (State Management)
├── React Query (Server State)
├── Tailwind CSS (Styling)
├── PapaParse (CSV Parsing)
├── Axios (HTTP Client)
└── Lucide Icons (Icons)
```

**Why these choices?**
- **Vite**: Lightning-fast dev server and builds
- **Zustand**: Lightweight state management (vs Redux complexity)
- **React Query**: Handles caching, background updates, optimistic updates
- **Tailwind**: Rapid UI development with utility classes

### Backend Stack

```
Python 3.11+
├── FastAPI (Web Framework)
├── Uvicorn (ASGI Server)
├── SQLAlchemy (ORM)
├── Alembic (Migrations)
├── Pydantic (Validation)
├── PostgreSQL (Database)
├── OpenAI SDK (AI Integration)
└── Python-Jose (JWT)
```

**Why these choices?**
- **FastAPI**: Modern, fast, auto-documentation, async support
- **SQLAlchemy**: Mature ORM with great PostgreSQL support
- **Pydantic**: Type safety and validation built-in
- **PostgreSQL**: Robust, scalable, JSON support for flexible data

### Infrastructure

```
Frontend: Vercel
Backend: Railway
Database: Railway PostgreSQL
Monitoring: Sentry
CI/CD: GitHub Actions
```

---

## Data Flow

### User Journey: Upload to Export

```
1. USER UPLOADS CSV FILES
   │
   ├─→ Frontend: Parse CSV preview
   │   └─→ Validate columns
   │
   └─→ POST /api/v1/webinars/create
       │
       ├─→ Backend receives multipart/form-data
       │   ├─→ Validate CSV format
       │   ├─→ Parse attendance data
       │   ├─→ Parse chat data
       │   └─→ Match attendees with chat messages
       │
       ├─→ Store in Database
       │   ├─→ webinars table
       │   ├─→ attendees table
       │   └─→ chat_messages table
       │
       └─→ Return webinar_id

2. ENGAGEMENT SCORING
   │
   ├─→ POST /api/v1/webinars/{id}/generate-emails
   │   │
   │   ├─→ For each attendee:
   │   │   ├─→ Calculate Focus Score (40%)
   │   │   ├─→ Calculate Attendance Score (30%)
   │   │   ├─→ Calculate Chat Score (20%)
   │   │   ├─→ Calculate Question Score (10%)
   │   │   └─→ Determine Tier (Hot/Warm/Cool/Cold/No-Show)
   │   │
   │   └─→ Store scores in attendees table

3. AI EMAIL GENERATION
   │
   ├─→ For each attendee (batched):
   │   │
   │   ├─→ Build context from:
   │   │   ├─→ Engagement data
   │   │   ├─→ Chat messages
   │   │   ├─→ Questions asked
   │   │   └─→ Webinar details
   │   │
   │   ├─→ Select tier-specific prompt template
   │   │
   │   ├─→ Call OpenAI GPT-4 API
   │   │   └─→ Response: Personalized email
   │   │
   │   └─→ Store in generated_emails table
   │
   └─→ Return generation status

4. REVIEW & EDIT
   │
   ├─→ GET /api/v1/webinars/{id}/attendees
   │   └─→ Display sorted by engagement score
   │
   ├─→ GET /api/v1/emails/{email_id}
   │   └─→ Preview individual email
   │
   └─→ PUT /api/v1/emails/{email_id}
       └─→ User edits, save changes

5. EXPORT
   │
   └─→ POST /api/v1/webinars/{id}/export
       │
       ├─→ Fetch all emails with attendee data
       ├─→ Format as CSV
       ├─→ Generate download link
       └─→ Return download_url
```

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────────┐
│    users     │         │    webinars      │
├──────────────┤         ├──────────────────┤
│ id (PK)      │────────<│ user_id (FK)     │
│ email        │         │ id (PK)          │
│ name         │         │ title            │
│ created_at   │         │ topic            │
│ subscription │         │ date_hosted      │
└──────────────┘         │ offer_name       │
                         │ offer_description│
                         │ price            │
                         │ deadline         │
                         │ replay_url       │
                         └──────────────────┘
                                  │
                                  │
                 ┌────────────────┴────────────────┐
                 │                                  │
                 ▼                                  ▼
        ┌─────────────────┐              ┌──────────────────┐
        │   attendees     │              │generated_emails  │
        ├─────────────────┤              ├──────────────────┤
        │ id (PK)         │──────────────│ attendee_id (FK) │
        │ webinar_id (FK) │              │ id (PK)          │
        │ name            │              │ subject_line     │
        │ email           │              │ email_body_text  │
        │ attended        │              │ email_body_html  │
        │ focus_percent   │              │ engagement_score │
        │ attendance_%    │              │ engagement_tier  │
        │ join_time       │              │ user_edited      │
        │ exit_time       │              │ user_notes       │
        └─────────────────┘              └──────────────────┘
                 │
                 │
                 ▼
        ┌──────────────────┐
        │  chat_messages   │
        ├──────────────────┤
        │ id (PK)          │
        │ attendee_id (FK) │
        │ message_text     │
        │ timestamp        │
        │ is_question      │
        └──────────────────┘
```

### Table Definitions

**users**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    api_credits_remaining INTEGER DEFAULT 1
);
```

**webinars**
```sql
CREATE TABLE webinars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    topic TEXT,
    date_hosted TIMESTAMP,
    offer_name VARCHAR(255),
    offer_description TEXT,
    price DECIMAL(10,2),
    deadline VARCHAR(100),
    replay_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'processing'
);
```

**attendees**
```sql
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webinar_id UUID REFERENCES webinars(id) ON DELETE CASCADE,
    name VARCHAR(255),
    email VARCHAR(255),
    attended BOOLEAN DEFAULT false,
    attendance_percent INTEGER,
    focus_percent INTEGER,
    attendance_minutes INTEGER,
    join_time TIMESTAMP,
    exit_time TIMESTAMP,
    location VARCHAR(255),
    engagement_score INTEGER,
    engagement_tier VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);
```

**chat_messages**
```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
    message_text TEXT,
    timestamp TIMESTAMP,
    is_question BOOLEAN DEFAULT false
);
```

**generated_emails**
```sql
CREATE TABLE generated_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
    subject_line VARCHAR(500),
    email_body_text TEXT,
    email_body_html TEXT,
    engagement_score INTEGER,
    engagement_tier VARCHAR(20),
    personalization_elements JSONB,
    user_edited BOOLEAN DEFAULT false,
    user_notes TEXT,
    generated_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────┐
│              API Endpoints Layer                 │
│  (Routes, Request/Response Handling)            │
│  app/api/v1/webinars.py, emails.py, etc.       │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│           Business Logic Layer                   │
│  (Services: Scoring, Email Generation, etc.)    │
│  app/services/email_generator.py, scoring.py    │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│            Data Access Layer                     │
│  (SQLAlchemy Models, CRUD Operations)           │
│  app/models/webinar.py, attendee.py             │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
                 Database
```

### Key Design Patterns

1. **Repository Pattern** - Data access abstracted from business logic
2. **Service Layer** - Business logic separated from API routes
3. **Dependency Injection** - FastAPI's DI for database sessions, auth
4. **DTO Pattern** - Pydantic schemas for data transfer

---

## Frontend Architecture

### Component Structure

```
src/
├── app/
│   └── components/
│       ├── ui/              # Reusable UI components
│       │   ├── Button.jsx
│       │   ├── Input.jsx
│       │   ├── Card.jsx
│       │   └── Modal.jsx
│       │
│       ├── dashboard/        # Dashboard feature
│       │   ├── DashboardView.jsx
│       │   ├── StatsCard.jsx
│       │   └── PriorityList.jsx
│       │
│       ├── upload/           # CSV Upload feature
│       │   ├── UploadForm.jsx
│       │   ├── CSVPreview.jsx
│       │   └── WebinarDetails.jsx
│       │
│       └── review/           # Email Review feature
│           ├── EmailList.jsx
│           ├── EmailPreview.jsx
│           └── EmailEditor.jsx
│
├── lib/                      # Utilities
│   ├── api.js               # API client
│   ├── csv-parser.js        # CSV utilities
│   └── utils.js             # Helpers
│
├── hooks/                    # Custom React hooks
│   ├── useWebinar.js
│   ├── useAttendees.js
│   └── useEmails.js
│
├── services/                 # API services
│   ├── webinarService.js
│   ├── emailService.js
│   └── authService.js
│
└── types/                    # TypeScript types (future)
```

### State Management

```
Zustand Store
├── authStore
│   ├── user
│   ├── token
│   └── login/logout actions
│
├── webinarStore
│   ├── currentWebinar
│   ├── webinars list
│   └── CRUD actions
│
└── uiStore
    ├── sidebarOpen
    ├── modalState
    └── UI actions
```

---

## Security

### Authentication Flow

```
1. User clicks "Sign in with Google"
   │
   ▼
2. Google OAuth redirect
   │
   ▼
3. Callback with Google ID token
   │
   ▼
4. Backend verifies with Google
   │
   ▼
5. Backend creates/updates user
   │
   ▼
6. Backend generates JWT token
   │
   ▼
7. Frontend stores token (httpOnly cookie or localStorage)
   │
   ▼
8. All subsequent requests include Authorization: Bearer {token}
```

### Security Measures

1. **Data Encryption**
   - Emails encrypted at rest (PostgreSQL encryption)
   - HTTPS for all communications
   - Secure password hashing (bcrypt)

2. **Authentication**
   - OAuth 2.0 with Google
   - JWT tokens with expiration
   - Refresh token rotation

3. **Authorization**
   - User can only access their own webinars
   - Role-based access control (future)

4. **Input Validation**
   - Pydantic schemas validate all inputs
   - CSV file size limits (10MB)
   - SQL injection protection (ORM)

5. **Rate Limiting**
   - 10-100 requests/minute based on tier
   - Prevents abuse and DDoS

6. **CORS**
   - Whitelist frontend domains only
   - No wildcard origins in production

---

## Performance Considerations

### Frontend Optimization

1. **Code Splitting** - Lazy load routes
2. **Caching** - React Query caches API responses
3. **Virtualization** - Large lists use virtual scrolling
4. **Debouncing** - Search inputs debounced
5. **Image Optimization** - WebP format, lazy loading

### Backend Optimization

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_attendees_webinar ON attendees(webinar_id);
   CREATE INDEX idx_emails_attendee ON generated_emails(attendee_id);
   CREATE INDEX idx_messages_attendee ON chat_messages(attendee_id);
   ```

2. **Connection Pooling** - SQLAlchemy pool (10 connections)

3. **Async Processing** - Email generation runs async

4. **Batch Processing** - OpenAI API calls batched (5 at a time)

5. **Caching** (Future)
   - Redis for session data
   - Cache common queries

### OpenAI API Optimization

1. **Token Management**
   - Track token usage per request
   - Implement token limits per tier
   - Cache similar prompts

2. **Batch Requests**
   - Generate 5 emails concurrently
   - Prevents rate limiting

3. **Fallback Strategy**
   - Retry failed requests (3 attempts)
   - Use GPT-3.5 if GPT-4 unavailable

---

## Deployment Architecture

### Production Environment

```
┌──────────────────────────────────────────────────┐
│              Vercel Edge Network                  │
│  (Frontend CDN - Global Distribution)            │
└────────────────┬─────────────────────────────────┘
                 │
                 │ HTTPS
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│           Railway (Backend + DB)                  │
│                                                   │
│  ┌──────────────┐      ┌──────────────────┐    │
│  │  FastAPI     │─────>│  PostgreSQL      │    │
│  │  Container   │      │  Database        │    │
│  └──────────────┘      └──────────────────┘    │
│         │                                        │
│         └──────────> External APIs               │
│                      (OpenAI, SendGrid)          │
└──────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
GitHub Push
    │
    ▼
GitHub Actions
    │
    ├─> Frontend Build
    │   ├─> Run tests
    │   ├─> Build with Vite
    │   └─> Deploy to Vercel
    │
    └─> Backend Build
        ├─> Run tests
        ├─> Build Docker image
        └─> Deploy to Railway
```

### Environment Separation

- **Development**: Local (localhost:5173 + localhost:8000)
- **Staging**: staging.webinarwins.com (Future)
- **Production**: webinarwins.com + api.webinarwins.com

---

## Monitoring & Observability

### Metrics to Track

1. **Application Metrics**
   - API response times
   - Email generation time
   - CSV processing time
   - Error rates

2. **Business Metrics**
   - Webinars processed
   - Emails generated
   - User signups
   - Conversion rates

3. **Infrastructure Metrics**
   - Database connections
   - Memory usage
   - CPU usage
   - Disk space

### Logging Strategy

```python
# Structured logging with JSON format
{
    "timestamp": "2025-10-15T10:30:00Z",
    "level": "INFO",
    "service": "webinarwins-api",
    "user_id": "uuid",
    "action": "generate_emails",
    "webinar_id": "uuid",
    "duration_ms": 2500,
    "emails_generated": 45
}
```

---

## Future Enhancements

### Phase 2 (Post-MVP)
- WebSocket for real-time generation status
- Redis caching layer
- Async task queue (Celery)
- Direct webinar platform integrations

### Phase 3 (Scale)
- Microservices architecture
- Kubernetes deployment
- Multi-region support
- GraphQL API

---

<div align="center">

**WebinarWins Architecture Documentation**

[Back to README](../README.md) | [API Docs](api.md) | [Deployment Guide](deployment.md)

</div>

