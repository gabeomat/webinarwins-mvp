# WebinarWins MVP

<div align="center">

**Transform 3-5 hours of manual webinar follow-up into 15 minutes of review time**

[![Status](https://img.shields.io/badge/status-mvp%20development-orange)]()
[![License](https://img.shields.io/badge/license-proprietary-red.svg)](LICENSE)
[![PRD](https://img.shields.io/badge/docs-PRD-green)](WebinarWins_MVP_PRD.md)

**Private SaaS Product - Proprietary & Confidential**

</div>

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development Roadmap](#development-roadmap)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Team Development](#team-development)

---

## 🎯 Project Overview

WebinarWins MVP is a lightweight automation tool that analyzes webinar participant engagement (attendance %, focus %, chat activity, questions) and generates hyper-personalized follow-up emails within 2 hours of webinar completion, increasing conversion rates for offers made during the webinar.

### Target User

Solo entrepreneurs and small teams running educational webinars with a sales offer at the end. Currently spending 3-5 hours manually segmenting attendees and crafting follow-ups, resulting in generic messages and missed opportunities.

### Core Value Proposition

Transform 3-5 hours of manual work into 15 minutes of review time while delivering personalized follow-ups that reference specific attendee behaviors (including their focus level during the webinar), doubling conversion rates on end-of-webinar offers.

### MVP Success Metric

10 paying customers within 90 days, each reporting 1.5x-2x improvement in post-webinar conversion rates compared to their manual baseline.

---

## 🔍 The Problem

Webinar hosts selling products/services at the end of their webinars are missing sales opportunities because follow-up emails are:

1. **Too generic** - Same message to everyone, regardless of engagement level
2. **Too slow** - Sent 24-48 hours later when interest has cooled
3. **Too time-consuming** - 3-5 hours of manual segmentation and writing
4. **Ignoring valuable data** - Focus %, attendance patterns, chat engagement

### Real Impact

- Only 2-3% conversion rate on post-webinar offers (5-8% possible with personalization)
- High-focus attendees who didn't buy represent thousands in lost revenue
- No-shows need re-engagement but rarely get personalized outreach
- Valuable engagement data (Focus %, chat patterns) goes unused

---

## 💡 The Solution

### Advanced Engagement Scoring

WebinarWins uses a composite engagement score based on:

- **Focus % (40% weight)** - Were they actively watching or multitasking?
- **Attendance % (30% weight)** - How much did they watch?
- **Chat Engagement (20% weight)** - Did they participate?
- **Question Bonus (10% weight)** - Did they ask questions?

### 5-Tier Personalized Emails

1. **Hot Lead (80-100 points)** - High focus + high engagement = Ready to buy!
2. **Warm Lead (60-79 points)** - Good engagement but some distraction
3. **Cool Lead (40-59 points)** - Interested but not fully engaged
4. **Cold Lead (0-39 points)** - Attended but not engaged
5. **No-Show** - Registered but didn't attend (separate strategy)

### Key Features

- ✅ CSV upload for webinar attendance data and chat logs
- ✅ Smart engagement scoring with Focus % analysis
- ✅ AI-powered personalized email generation (5 tiers)
- ✅ Insights dashboard with priority follow-up list
- ✅ Review & edit interface for all generated emails
- ✅ Export to CSV for email tool import

---

## 🛠 Tech Stack

### Frontend

- **React.js** - UI framework (using Vite for fast development)
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **PapaParse** - CSV parsing
- **Zustand** - State management (lightweight)
- **React Query** - Server state management

### Backend

- **Python 3.11+** - Programming language
- **FastAPI** - REST API framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **OpenAI GPT-4** - Email generation
- **Pydantic** - Data validation
- **Alembic** - Database migrations

### Infrastructure

- **Frontend Hosting**: Vercel (free tier)
- **Backend + DB**: Railway ($5-20/month)
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry (error tracking)

### External Services

- **OpenAI API** - GPT-4 for email generation
- **SendGrid** - Transactional emails (account notifications)

---

## 📁 Project Structure

```
webinarwins-mvp/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── app/            # Main app components
│   │   │   └── components/ # Reusable components
│   │   │       ├── ui/     # UI component library
│   │   │       ├── dashboard/
│   │   │       ├── upload/
│   │   │       └── review/
│   │   ├── lib/            # Utilities and helpers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── App.jsx         # Root component
│   ├── package.json
│   └── vite.config.js
│
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   │   ├── v1/
│   │   │   │   ├── webinars.py
│   │   │   │   ├── attendees.py
│   │   │   │   ├── emails.py
│   │   │   │   └── insights.py
│   │   │   └── deps.py     # Dependencies
│   │   ├── core/           # Core functionality
│   │   │   ├── config.py   # Configuration
│   │   │   ├── security.py # Auth & security
│   │   │   └── scoring.py  # Engagement scoring
│   │   ├── models/         # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── webinar.py
│   │   │   ├── attendee.py
│   │   │   └── email.py
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   │   ├── csv_parser.py
│   │   │   ├── email_generator.py
│   │   │   └── analytics.py
│   │   └── main.py         # FastAPI app entry
│   ├── alembic/            # Database migrations
│   ├── tests/              # Unit and integration tests
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                    # Documentation
│   ├── api.md              # API documentation
│   ├── architecture.md     # System architecture
│   └── deployment.md       # Deployment guide
│
├── scripts/                 # Utility scripts
│   ├── setup-dev.sh        # Development setup
│   └── seed-db.py          # Database seeding
│
├── .github/                 # GitHub configuration
│   └── workflows/          # CI/CD workflows
│
├── .gitignore
├── .env.example            # Example environment variables
├── README.md               # This file
├── WebinarWins_MVP_PRD.md  # Product Requirements Document
└── LICENSE
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **pnpm** (for frontend)
- **Python** 3.11+ and **pip** (for backend)
- **PostgreSQL** 14+ (or Docker)
- **OpenAI API Key** (from OpenAI platform)

### Initial Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd webinarwins-mvp
```

2. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Set up the backend**

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

4. **Set up the frontend**

```bash
cd frontend

# Install dependencies (using pnpm as specified)
pnpm install

# Start the development server
pnpm dev
```

Frontend will be available at `http://localhost:5173`

5. **Verify installation**

- Visit `http://localhost:5173` - Frontend should load
- Visit `http://localhost:8000/docs` - API docs should be accessible
- Check console for any errors

### Running Tests

**Backend tests:**
```bash
cd backend
pytest
```

**Frontend tests:**
```bash
cd frontend
pnpm test
```

---

## 📅 Development Roadmap

### 9-Week MVP Timeline

#### **Phase 1: Core Infrastructure (Week 1-2)**
- [ ] Set up frontend and backend scaffolding
- [ ] Implement CSV upload and parsing
- [ ] Build data model and database
- [ ] Create basic authentication (OAuth with Google)
- [ ] Set up CI/CD pipelines

#### **Phase 2: Engagement Scoring (Week 3)**
- [ ] Implement scoring algorithm
- [ ] Build attendee matching logic (chat to attendance)
- [ ] Create engagement tier calculation
- [ ] Unit tests for scoring accuracy
- [ ] Edge case handling

#### **Phase 3: AI Email Generation (Week 4-5)**
- [ ] Integrate OpenAI GPT-4 API
- [ ] Build prompt templates for each tier (5 tiers)
- [ ] Implement batch generation
- [ ] Test output quality across scenarios
- [ ] Add error handling and fallbacks

#### **Phase 4: Dashboard & Review (Week 6)**
- [ ] Build main dashboard UI
- [ ] Create email preview and edit functionality
- [ ] Implement priority ranking view
- [ ] Add export functionality (CSV, copy to clipboard)
- [ ] Smart filtering and search

#### **Phase 5: Polish & Testing (Week 7-8)**
- [ ] End-to-end testing
- [ ] User acceptance testing with 3-5 beta users
- [ ] Bug fixes and refinements
- [ ] Documentation and onboarding flow
- [ ] Performance optimization

#### **Phase 6: Launch (Week 9)**
- [ ] Soft launch to initial customers
- [ ] Gather feedback
- [ ] Iterate quickly on issues
- [ ] Begin marketing push
- [ ] Set up monitoring and analytics

### Current Status

🟡 **Phase 1 in progress** - Setting up initial infrastructure

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

### Backend Environment Variables

```bash
# Application
APP_NAME=WebinarWins
APP_ENV=development  # development, staging, production
DEBUG=True
SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -hex 32

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/webinarwins
# For Railway: Use the provided DATABASE_URL

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1000

# Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# SendGrid (for transactional emails)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@webinarwins.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_PER_MINUTE=10
```

### Frontend Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:8000/api
VITE_API_TIMEOUT=30000

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Environment
VITE_ENV=development
```

### Getting API Keys

1. **OpenAI API Key**: 
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create account and generate API key
   - Estimated cost: $20-50/month for MVP usage

2. **Google OAuth**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs

3. **SendGrid API Key**:
   - Visit [SendGrid](https://sendgrid.com/)
   - Create free account (100 emails/day free)
   - Generate API key

---

## 📖 API Documentation

Comprehensive API documentation is available at:
- **Interactive Docs**: `http://localhost:8000/docs` (Swagger UI)
- **ReDoc**: `http://localhost:8000/redoc`
- **Detailed Guide**: [docs/api.md](docs/api.md)

### Quick API Overview

```
POST   /api/v1/webinars/create          - Create new webinar session
GET    /api/v1/webinars/{id}            - Get webinar details
POST   /api/v1/webinars/{id}/generate   - Generate emails
GET    /api/v1/webinars/{id}/attendees  - List attendees with scores
PUT    /api/v1/emails/{id}              - Update email
POST   /api/v1/webinars/{id}/export     - Export to CSV
GET    /api/v1/webinars/{id}/insights   - Get analytics
```

See [docs/api.md](docs/api.md) for detailed endpoints, request/response schemas, and examples.

---

## 💻 Team Development

### Code Style Guidelines

**Frontend:**
- Use ESLint + Prettier
- Follow React best practices
- Component naming: PascalCase
- File naming: kebab-case

**Backend:**
- Follow PEP 8 style guide
- Use Black for formatting
- Use type hints
- Run `pylint` before commits

### Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat: add feature"`
3. Push branch: `git push origin feature/your-feature`
4. Create Pull Request for team review

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Team Collaboration

- All code changes require review from at least one team member
- Maintain comprehensive documentation for all features
- Update PRD and technical docs as product evolves
- Regular sync meetings to align on architecture decisions

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_scoring.py

# Run with verbose output
pytest -v
```

### Frontend Testing

```bash
cd frontend

# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch
```

---

## 🚢 Deployment

### Production Deployment

**Frontend (Vercel):**
```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
cd frontend
vercel --prod
```

**Backend (Railway):**
1. Connect GitHub repository to Railway
2. Set environment variables
3. Railway will auto-deploy on push to main

See [docs/deployment.md](docs/deployment.md) for detailed instructions.

---

## 📊 Monitoring

- **Error Tracking**: Sentry
- **Logs**: Railway logs / Vercel logs
- **Performance**: Web Vitals (frontend)
- **API Metrics**: FastAPI built-in metrics

---

## 📄 License

This is proprietary software. All rights reserved.

**Copyright (c) 2025 WebinarWins. All rights reserved.**

This software and associated documentation files are the proprietary and confidential property of WebinarWins. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

See the [LICENSE](LICENSE) file for complete terms.

---

## 📞 Internal Support

- **Documentation**: [docs/](docs/)
- **Team Issues**: GitHub Issues (private repository)
- **Team Support**: team@webinarwins.com
- **Technical Lead**: dev@webinarwins.com

---

## 🎯 Pricing (Planned)

- **Free Trial**: 14 days, 1 webinar, 50 attendees
- **Starter**: $29/month - 4 webinars, 100 attendees
- **Pro**: $79/month - Unlimited webinars, 500 attendees

---

## 📈 Success Metrics

**Target Goals:**
- ✅ 10 paying customers by Day 90
- ✅ 1.5x-2x improvement in conversion rates
- ✅ 80% reduction in follow-up time
- ✅ 4.5+ stars average rating

---

<div align="center">

**Built with ❤️ for webinar hosts who want to convert more attendees**

**Proprietary & Confidential - WebinarWins 2025**

[View PRD](WebinarWins_MVP_PRD.md) | [API Docs](docs/api.md) | [Architecture](docs/architecture.md)

</div>

