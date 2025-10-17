# WebinarWins MVP - Project Structure

**CONFIDENTIAL - Internal Documentation Only**

Generated: October 15, 2025

## Overview

This document provides a complete overview of the WebinarWins MVP project structure, including all directories, key files, and their purposes.

**Note:** This is proprietary software. All information in this document is confidential and proprietary to WebinarWins.

## Directory Structure

```
webinarwins-mvp/
│
├── 📄 README.md                      # Main project documentation
├── 📄 WebinarWins_MVP_PRD.md        # Product Requirements Document
├── 📄 QUICK_START.md                # Quick setup guide
├── 📄 CONTRIBUTING.md               # Contribution guidelines
├── 📄 LICENSE                       # MIT License
├── 📄 ENV_TEMPLATE.txt              # Environment variables template
├── 📄 .gitignore                    # Git ignore rules
│
├── 📁 frontend/                     # React Frontend Application
│   ├── 📁 public/                   # Static assets
│   ├── 📁 src/
│   │   ├── 📁 app/
│   │   │   └── 📁 components/      # React components
│   │   │       ├── 📁 ui/          # Reusable UI components (Button, Input, etc.)
│   │   │       ├── 📁 dashboard/   # Dashboard feature components
│   │   │       ├── 📁 upload/      # CSV upload feature components
│   │   │       ├── 📁 review/      # Email review feature components
│   │   │       └── 📁 email/       # Email-related components
│   │   ├── 📁 lib/                 # Utility functions
│   │   ├── 📁 hooks/               # Custom React hooks
│   │   ├── 📁 services/            # API service layer
│   │   ├── 📁 types/               # TypeScript types (future)
│   │   ├── 📄 App.jsx              # Main App component
│   │   ├── 📄 main.jsx             # React entry point
│   │   └── 📄 index.css            # Global styles (Tailwind)
│   ├── 📄 index.html               # HTML entry point
│   ├── 📄 package.json             # Node.js dependencies
│   ├── 📄 vite.config.js           # Vite configuration
│   └── 📄 tailwind.config.js       # Tailwind CSS configuration
│
├── 📁 backend/                      # Python FastAPI Backend
│   ├── 📁 app/
│   │   ├── 📁 api/                 # API endpoints
│   │   │   └── 📁 v1/              # API version 1
│   │   │       ├── webinars.py     # Webinar endpoints (to be created)
│   │   │       ├── attendees.py    # Attendee endpoints (to be created)
│   │   │       ├── emails.py       # Email endpoints (to be created)
│   │   │       └── insights.py     # Analytics endpoints (to be created)
│   │   ├── 📁 core/                # Core functionality
│   │   │   ├── 📄 config.py        # Configuration management
│   │   │   ├── security.py         # Auth & security (to be created)
│   │   │   └── scoring.py          # Engagement scoring (to be created)
│   │   ├── 📁 models/              # SQLAlchemy models
│   │   │   ├── user.py             # User model (to be created)
│   │   │   ├── webinar.py          # Webinar model (to be created)
│   │   │   ├── attendee.py         # Attendee model (to be created)
│   │   │   └── email.py            # Email model (to be created)
│   │   ├── 📁 schemas/             # Pydantic schemas (to be created)
│   │   ├── 📁 services/            # Business logic
│   │   │   ├── csv_parser.py       # CSV parsing (to be created)
│   │   │   ├── email_generator.py  # AI email generation (to be created)
│   │   │   └── analytics.py        # Analytics logic (to be created)
│   │   └── 📄 main.py              # FastAPI application entry
│   ├── 📁 alembic/                 # Database migrations
│   │   └── 📁 versions/            # Migration files
│   ├── 📁 tests/                   # Unit and integration tests
│   └── 📄 requirements.txt         # Python dependencies
│
├── 📁 docs/                         # Documentation
│   ├── 📄 api.md                   # API documentation
│   ├── 📄 architecture.md          # System architecture
│   └── 📄 deployment.md            # Deployment guide
│
├── 📁 scripts/                      # Utility scripts
│   ├── 📄 setup-dev.sh             # Development setup script
│   └── seed-db.py                  # Database seeding (to be created)
│
└── 📁 .github/                      # GitHub configuration
    └── 📁 workflows/                # CI/CD workflows (to be created)
```

## Key Files Created

### Root Level

| File | Purpose | Status |
|------|---------|--------|
| `README.md` | Main project documentation with setup instructions | ✅ Created |
| `WebinarWins_MVP_PRD.md` | Product Requirements Document | ✅ Existing |
| `QUICK_START.md` | Quick setup guide for developers | ✅ Created |
| `LICENSE` | Proprietary License | ✅ Created |
| `ENV_TEMPLATE.txt` | Environment variables template | ✅ Created |
| `.gitignore` | Git ignore configuration | ✅ Created |

### Frontend (`/frontend`)

| File | Purpose | Status |
|------|---------|--------|
| `package.json` | Node.js dependencies and scripts | ✅ Created |
| `vite.config.js` | Vite build configuration | ✅ Created |
| `tailwind.config.js` | Tailwind CSS configuration | ✅ Created |
| `index.html` | HTML entry point | ✅ Created |
| `src/main.jsx` | React application entry point | ✅ Created |
| `src/App.jsx` | Main App component | ✅ Created |
| `src/index.css` | Global styles with Tailwind | ✅ Created |

**Components Structure:**
- `src/app/components/ui/` - Reusable UI components (Button, Input, Card, Modal, etc.)
- `src/app/components/dashboard/` - Dashboard views and stats
- `src/app/components/upload/` - CSV upload interface
- `src/app/components/review/` - Email review and editing
- `src/app/components/email/` - Email preview and management

### Backend (`/backend`)

| File | Purpose | Status |
|------|---------|--------|
| `requirements.txt` | Python dependencies | ✅ Created |
| `app/main.py` | FastAPI application entry | ✅ Created |
| `app/core/config.py` | Configuration management | ✅ Created |

**To Be Created (Phase 1-2):**
- API endpoints (`app/api/v1/*.py`)
- Database models (`app/models/*.py`)
- Pydantic schemas (`app/schemas/*.py`)
- Business logic services (`app/services/*.py`)
- Database migrations (`alembic/versions/*.py`)
- Tests (`tests/*.py`)

### Documentation (`/docs`)

| File | Purpose | Status |
|------|---------|--------|
| `api.md` | Complete API documentation with endpoints, schemas, examples | ✅ Created |
| `architecture.md` | System architecture, tech stack, data flow, database schema | ✅ Created |
| `deployment.md` | Deployment guide for Vercel and Railway | ✅ Created |

### Scripts (`/scripts`)

| File | Purpose | Status |
|------|---------|--------|
| `setup-dev.sh` | Automated development environment setup | ✅ Created |
| `seed-db.py` | Database seeding script | 🔜 To be created |

## Next Steps

### Phase 1: Core Infrastructure (Week 1-2)

**Backend:**
1. Create database models (`models/`)
2. Set up Alembic migrations
3. Create Pydantic schemas (`schemas/`)
4. Implement authentication (`core/security.py`)
5. Create basic API endpoints (`api/v1/`)

**Frontend:**
1. Set up routing with React Router
2. Create UI component library (`components/ui/`)
3. Implement upload form (`components/upload/`)
4. Set up API client (`lib/api.js`)
5. Create auth flow

### Phase 2: Engagement Scoring (Week 3)

1. Implement scoring algorithm (`core/scoring.py`)
2. Create CSV parser service (`services/csv_parser.py`)
3. Build attendee matching logic
4. Add tests for scoring accuracy

### Phase 3: AI Email Generation (Week 4-5)

1. Integrate OpenAI API (`services/email_generator.py`)
2. Create prompt templates for each tier
3. Implement batch processing
4. Add error handling and retries

### Phase 4: Dashboard & Review (Week 6)

1. Build dashboard UI (`components/dashboard/`)
2. Create email preview (`components/review/`)
3. Implement email editor
4. Add export functionality

### Phase 5: Polish & Testing (Week 7-8)

1. End-to-end testing
2. User acceptance testing
3. Performance optimization
4. Documentation updates

### Phase 6: Launch (Week 9)

1. Deploy to production
2. Set up monitoring
3. Soft launch to beta users
4. Iterate based on feedback

## Development Workflow

### Starting Development

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
pnpm dev

# Terminal 3: Database (if needed)
psql webinarwins_dev
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
pnpm test
```

### Making Changes

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Run tests
4. Commit with conventional commit message
5. Push and create PR

## Component Organization

### Frontend Components by Feature

```
components/
├── ui/              # Shared UI components
│   ├── Button.jsx
│   ├── Input.jsx
│   ├── Card.jsx
│   ├── Modal.jsx
│   ├── Table.jsx
│   └── Badge.jsx
│
├── dashboard/       # Dashboard feature
│   ├── DashboardView.jsx
│   ├── StatsCard.jsx
│   ├── EngagementChart.jsx
│   └── PriorityList.jsx
│
├── upload/          # CSV upload feature
│   ├── UploadForm.jsx
│   ├── CSVPreview.jsx
│   ├── WebinarDetailsForm.jsx
│   └── ValidationErrors.jsx
│
├── review/          # Email review feature
│   ├── EmailList.jsx
│   ├── EmailPreview.jsx
│   ├── EmailEditor.jsx
│   └── TierFilter.jsx
│
└── email/           # Email management
    ├── EmailCard.jsx
    ├── PersonalizationIndicator.jsx
    └── ExportOptions.jsx
```

### Backend Services by Domain

```
services/
├── csv_parser.py      # CSV file parsing and validation
├── email_generator.py # OpenAI email generation
├── analytics.py       # Analytics and insights
└── export.py          # CSV export formatting
```

## Database Schema Summary

**Core Tables:**
- `users` - User accounts and subscriptions
- `webinars` - Webinar sessions
- `attendees` - Attendee data and engagement scores
- `chat_messages` - Chat messages and questions
- `generated_emails` - AI-generated emails

See [docs/architecture.md](docs/architecture.md) for detailed schema.

## Technology Choices Explained

### Frontend: React + Vite
- **Fast**: HMR and optimized builds
- **Modern**: Latest React features
- **Simple**: No complex build config

### Backend: FastAPI
- **Fast**: Async support, high performance
- **Developer-friendly**: Auto-documentation
- **Type-safe**: Pydantic validation

### Database: PostgreSQL
- **Reliable**: Production-proven
- **Features**: JSON support, full-text search
- **Scalable**: Handles growth easily

### Styling: Tailwind CSS
- **Rapid**: Utility-first approach
- **Consistent**: Design system built-in
- **Flexible**: Easy customization

## Internal Resources

- [README.md](README.md) - Full setup guide
- [QUICK_START.md](QUICK_START.md) - Get started quickly
- [docs/api.md](docs/api.md) - API reference
- [docs/architecture.md](docs/architecture.md) - System design
- [docs/deployment.md](docs/deployment.md) - Deploy to production

**Note:** All documentation is confidential and for internal team use only.

## Current Status

✅ **Completed:**
- Project structure created
- Documentation written
- Configuration files set up
- Basic frontend and backend scaffolding

🚧 **In Progress:**
- Phase 1: Core Infrastructure

🔜 **Coming Next:**
- Database models and migrations
- API endpoints implementation
- UI component library
- Authentication system

---

**Last Updated:** October 15, 2025  
**Current Phase:** Phase 1 - Core Infrastructure (Week 1-2)

