# WebinarWins MVP - Deployment Guide

**CONFIDENTIAL - Internal Documentation Only**

Version: 1.0.0  
Last Updated: October 15, 2025

**Note:** This document contains sensitive deployment and infrastructure information. Not for public distribution.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Deployment (Railway)](#backend-deployment-railway)
- [Database Setup](#database-setup)
- [Domain Configuration](#domain-configuration)
- [SSL/TLS Certificates](#ssltls-certificates)
- [Monitoring Setup](#monitoring-setup)
- [Deployment Checklist](#deployment-checklist)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers deploying WebinarWins MVP to production using:
- **Vercel** for frontend hosting
- **Railway** for backend API and PostgreSQL database
- **GitHub** for version control and CI/CD

**Estimated Time**: 2-3 hours for first deployment  
**Cost**: ~$20-30/month

---

## Prerequisites

### Required Accounts

1. **GitHub Account** (free)
   - Repository must be created and code pushed

2. **Vercel Account** (free tier sufficient)
   - Sign up at [vercel.com](https://vercel.com)
   - Connect to GitHub

3. **Railway Account** (starts at $5/month)
   - Sign up at [railway.app](https://railway.app)
   - Connect to GitHub

4. **External Services**
   - OpenAI API key (paid, ~$20-50/month)
   - SendGrid account (free tier: 100 emails/day)
   - Google OAuth credentials (free)

### Required Tools

- Git
- Node.js 18+ and pnpm
- Python 3.11+
- PostgreSQL client (optional, for local testing)

---

## Environment Setup

### 1. Prepare Environment Variables

Create production environment variables for both frontend and backend.

**Backend Production Variables** (Railway):
```bash
# Application
APP_ENV=production
DEBUG=False
SECRET_KEY=<generate-with-openssl-rand-hex-32>

# Database (Railway provides this)
DATABASE_URL=${{DATABASE_URL}}  # Auto-injected by Railway

# OpenAI
OPENAI_API_KEY=sk-your-production-key

# Authentication
JWT_SECRET=<generate-with-openssl-rand-hex-32>
GOOGLE_CLIENT_ID=<your-prod-client-id>
GOOGLE_CLIENT_SECRET=<your-prod-client-secret>

# SendGrid
SENDGRID_API_KEY=<your-sendgrid-key>
FROM_EMAIL=noreply@webinarwins.com

# Frontend URL
FRONTEND_URL=https://webinarwins.com
CORS_ORIGINS=https://webinarwins.com,https://www.webinarwins.com

# Rate Limiting
RATE_LIMIT_PER_MINUTE=30

# Monitoring
SENTRY_DSN=<your-sentry-dsn>
SENTRY_ENVIRONMENT=production
```

**Frontend Production Variables** (Vercel):
```bash
VITE_API_URL=https://api.webinarwins.com
VITE_GOOGLE_CLIENT_ID=<your-prod-client-id>
VITE_ENV=production
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

```bash
cd frontend

# Test production build locally
pnpm build
pnpm preview

# Ensure no errors
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
vercel login

# Deploy (first time - follow prompts)
cd frontend
vercel

# Deploy to production
vercel --prod
```

**Configuration during setup:**
- Project Name: `webinarwins-frontend`
- Framework: `Vite`
- Build Command: `pnpm build`
- Output Directory: `dist`
- Install Command: `pnpm install`

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select `frontend` directory
4. Configure:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `pnpm build`
   - Output Directory: `dist`
5. Add Environment Variables (see above)
6. Click "Deploy"

### Step 3: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add `webinarwins.com`
3. Add DNS records as instructed:
   ```
   A Record:  @ → 76.76.21.21
   CNAME:     www → cname.vercel-dns.com
   ```
4. Wait for DNS propagation (5-60 minutes)

### Step 4: Verify Deployment

```bash
# Test production URL
curl https://webinarwins.vercel.app
# or
curl https://webinarwins.com
```

---

## Backend Deployment (Railway)

### Step 1: Prepare Backend

```bash
cd backend

# Create Dockerfile (Railway uses this)
```

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run migrations and start server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**railway.json** (optional, for configuration):
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "startCommand": "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 2: Deploy to Railway

#### Using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to project (creates new or links existing)
railway link

# Add PostgreSQL database
railway add --database postgresql

# Deploy
railway up
```

#### Using Railway Dashboard

1. Go to [railway.app/new](https://railway.app/new)
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Configure:
   - Root Directory: `backend`
   - Build Command: (leave empty, uses Dockerfile)
   - Start Command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 3: Add PostgreSQL Database

1. In Railway dashboard, click "New"
2. Select "Database" → "PostgreSQL"
3. Database is provisioned automatically
4. `DATABASE_URL` is auto-injected into environment

### Step 4: Configure Environment Variables

1. Go to Project → Variables
2. Add all backend environment variables (see above)
3. Save and redeploy

### Step 5: Run Database Migrations

```bash
# Using Railway CLI
railway run alembic upgrade head

# Or connect directly
railway run bash
> alembic upgrade head
> exit
```

### Step 6: Configure Custom Domain

1. Go to Settings → Domains
2. Click "Generate Domain" (gets Railway subdomain)
3. Add custom domain: `api.webinarwins.com`
4. Add DNS record:
   ```
   CNAME: api → <your-project>.up.railway.app
   ```

### Step 7: Verify Deployment

```bash
# Test API
curl https://<your-project>.up.railway.app/health
# Should return: {"status": "healthy"}

# Test custom domain
curl https://api.webinarwins.com/health
```

---

## Database Setup

### Initial Migration

```bash
# Connect to Railway project
railway link

# Run migrations
railway run alembic upgrade head

# Verify tables created
railway run psql $DATABASE_URL
> \dt
> \q
```

### Seed Data (Optional)

```bash
# Run seed script
railway run python scripts/seed-db.py
```

### Backups

Railway automatically backs up PostgreSQL daily.

**Manual backup:**
```bash
# Backup
railway run pg_dump $DATABASE_URL > backup.sql

# Restore
railway run psql $DATABASE_URL < backup.sql
```

---

## Domain Configuration

### DNS Setup

**Root Domain (webinarwins.com):**
```
Type    Name    Value                      TTL
A       @       76.76.21.21               Auto
CNAME   www     cname.vercel-dns.com      Auto
```

**API Subdomain (api.webinarwins.com):**
```
Type    Name    Value                          TTL
CNAME   api     <project>.up.railway.app      Auto
```

### Update Environment Variables

After domain setup:

**Backend (Railway):**
```bash
FRONTEND_URL=https://webinarwins.com
CORS_ORIGINS=https://webinarwins.com,https://www.webinarwins.com
```

**Frontend (Vercel):**
```bash
VITE_API_URL=https://api.webinarwins.com
```

---

## SSL/TLS Certificates

Both Vercel and Railway provide automatic SSL certificates.

**Verify SSL:**
```bash
# Check Vercel SSL
curl -vI https://webinarwins.com 2>&1 | grep SSL

# Check Railway SSL
curl -vI https://api.webinarwins.com 2>&1 | grep SSL
```

---

## Monitoring Setup

### Sentry Error Tracking

1. Create account at [sentry.io](https://sentry.io)
2. Create new project (Python - FastAPI)
3. Get DSN: `https://xxx@xxx.ingest.sentry.io/xxx`
4. Add to Railway environment:
   ```bash
   SENTRY_DSN=<your-dsn>
   SENTRY_ENVIRONMENT=production
   ```

### Railway Monitoring

Railway provides built-in monitoring:
- CPU usage
- Memory usage
- Network traffic
- Logs

Access via: Dashboard → Metrics

### Uptime Monitoring

Use a service like:
- **UptimeRobot** (free, 50 monitors)
- **Better Uptime**
- **Pingdom**

Monitor:
- `https://webinarwins.com` (frontend)
- `https://api.webinarwins.com/health` (backend)

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Production build tested locally
- [ ] API endpoints tested with Postman
- [ ] Security review completed
- [ ] Performance testing done

### Deployment

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] Database provisioned and migrated
- [ ] Environment variables set
- [ ] Custom domains configured
- [ ] SSL certificates active
- [ ] CORS configured correctly

### Post-Deployment

- [ ] Frontend accessible
- [ ] Backend API accessible
- [ ] Authentication working
- [ ] CSV upload working
- [ ] Email generation working
- [ ] Export functionality working
- [ ] Monitoring setup
- [ ] Error tracking configured
- [ ] Backup strategy in place

### Security

- [ ] No secrets in code
- [ ] Environment variables secure
- [ ] Rate limiting active
- [ ] HTTPS enforced
- [ ] CORS whitelist configured
- [ ] SQL injection protection verified
- [ ] XSS protection verified

---

## Rollback Procedures

### Frontend Rollback (Vercel)

```bash
# Via Vercel Dashboard
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

# Via CLI
vercel rollback
```

### Backend Rollback (Railway)

```bash
# Via Railway Dashboard
1. Go to Deployments
2. Find previous working deployment
3. Click "Redeploy"

# Via CLI
railway rollback
```

### Database Rollback

```bash
# Rollback last migration
railway run alembic downgrade -1

# Rollback to specific version
railway run alembic downgrade <revision>

# Restore from backup
railway run psql $DATABASE_URL < backup.sql
```

---

## Troubleshooting

### Frontend Issues

**Build fails:**
```bash
# Check build logs in Vercel dashboard
# Common issues:
- Missing dependencies in package.json
- Environment variables not set
- Import errors
```

**API calls failing:**
```bash
# Check browser console
# Verify VITE_API_URL is correct
# Check CORS configuration in backend
```

### Backend Issues

**Deployment fails:**
```bash
# Check Railway logs
railway logs

# Common issues:
- Missing dependencies in requirements.txt
- Environment variables not set
- Database connection failed
```

**Database connection errors:**
```bash
# Verify DATABASE_URL
railway variables

# Test connection
railway run python -c "import psycopg2; print('OK')"
```

**Migration errors:**
```bash
# Check migration status
railway run alembic current

# Force migration
railway run alembic stamp head
railway run alembic upgrade head
```

### Performance Issues

**Slow API responses:**
```bash
# Check Railway metrics
# Increase resources if needed
# Add database indexes
# Enable caching
```

**High memory usage:**
```bash
# Check Railway metrics
# Optimize queries
# Add pagination
# Clear old data
```

---

## CI/CD Setup (Optional)

### GitHub Actions Workflow

**.github/workflows/deploy.yml:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: cd frontend && pnpm install
      - run: cd frontend && pnpm test
      - run: cd frontend && pnpm build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: 3.11
      - run: cd backend && pip install -r requirements.txt
      - run: cd backend && pytest
      - uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: backend
```

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review error logs in Sentry
- Check uptime reports
- Monitor costs

**Monthly:**
- Review and rotate secrets
- Update dependencies
- Database maintenance (VACUUM, ANALYZE)
- Review user feedback

**Quarterly:**
- Security audit
- Performance review
- Cost optimization

---

<div align="center">

**WebinarWins Deployment Guide**

[Back to README](../README.md) | [Architecture Docs](architecture.md) | [API Docs](api.md)

</div>

