# WebinarWins MVP - Replit Configuration

## Project Overview
WebinarWins is a React-based web application that helps webinar hosts automate personalized follow-up emails based on attendee engagement metrics. The app uses Supabase for authentication and backend services.

## Recent Changes (October 17-18, 2025)
- ✅ Imported GitHub repository to Replit
- ✅ Installed all frontend dependencies (React, Vite, Tailwind, Supabase, etc.)
- ✅ Configured Vite dev server for Replit environment (port 5000, host 0.0.0.0, allowedHosts: true)
- ✅ Created missing Supabase configuration file (`frontend/src/lib/supabase.js`) with graceful credential handling
- ✅ Added PostCSS configuration for frontend (`frontend/postcss.config.js`)
- ✅ Set up development workflow "Server" running on port 5000
- ✅ Created `.env` file template in `frontend/.env` for Supabase credentials
- ✅ Configured deployment settings for autoscale deployment
- ✅ Fixed database schema to support decimal values (attendance_percent, focus_percent, attendance_minutes, engagement_score)
- ✅ Updated CSV parsing to match actual CSV format (Attended? TRUE/FALSE, Attendance (%), Join Timestamp/Exit Timestamp)
- ✅ Changed join_time and exit_time columns to TEXT type to store duration strings (e.g., "00:57:31" instead of timestamps)
- ✅ Added delete functionality with confirmation dialogs on Dashboard cards and WebinarDetail page
- ✅ Implemented loading states on delete buttons to prevent accidental double submissions
- ✅ Database cascade delete automatically removes all related attendees, chat messages, and generated emails
- ✅ Fixed null value crash in WebinarDetail page - added proper null handling for engagement_score and percentage fields
- ✅ Fixed engagement score calculation bug - created parsePercentage() helper to strip % symbols from CSV values (e.g., "68%" → 68) before parsing, resolving NaN issues that caused scores to show as 0
- ✅ **Implemented AI-powered email generation feature:**
  - Integrated Supabase Edge Function (`/functions/v1/generate-emails`) for OpenAI-based email generation
  - Added email generation UI in WebinarDetail page with tier-based filtering (Hot, Warm, Cool, Cold, No-Show)
  - Built email display list with subject lines, body preview, and engagement tier badges
  - Implemented inline email editing (subject + body) with save functionality
  - Added CSV export for generated emails
  - Includes loading states, error handling, and user-edited badges
  - Requires OpenAI API key configured in Supabase Edge Functions environment

## Recent Changes (October 19, 2025)
- ✅ **Fixed Supabase Edge Function for email generation:**
  - Added database error checking for insert and update operations (previously failing silently)
  - Increased email word count validation limit from 550 to 800 words to accommodate conversational tone
  - Fixed database schema: changed `engagement_score` column in `generated_emails` table from INTEGER to NUMERIC to support decimal values (e.g., 53.9, 43.8)
  - Edge Function now properly reports database errors when saves fail
  - Email generation fully functional with proper error handling and validation
  - All fixes applied to `supabase/functions/generate-emails/index.ts` (must be manually deployed in Supabase dashboard)
- ✅ **Added AI-powered style refinement for emails:**
  - Emails now go through a two-pass generation process:
    1. First pass: Generate personalized email based on engagement data
    2. Second pass: Rewrite email in Gabriel's authentic voice using style guide
  - Style guide captures conversational, edgy, vulnerable tone with bold language
  - Preserves all factual content while transforming tone and style
  - Results in emails that sound genuinely personal and authentic
  - Edge Function code updated (requires redeployment to Supabase)
- ✅ **Fixed chat CSV upload:**
  - Updated UploadWebinar.jsx to accept flexible column headers: `email` (lowercase) and `date & time` as alternatives
  - Chat messages now properly save to database regardless of CSV header capitalization
  - Supports both standard (`Email`, `Timestamp`) and custom (`email`, `date & time`) column naming
- ✅ **Email sending feature (fully functional):**
  - Send generated email drafts directly from the platform
  - **Implementation**: Resend API for reliable delivery and email tracking (opens, clicks, delivery)
  - **Testing workflow**: Click EDIT → change recipient email → click SEND NOW to test without marking original as sent
  - **Production workflow**: Click SEND button to send to actual attendee (marks as sent with timestamp)
  - Database tracks sent status and timestamp for each email
  - Edge Function deployed with override parameters (override_email, override_subject, override_body)
  - **Free tier**: 3,000 emails/month via Resend
  - Complete setup guide available in `EMAIL-SENDING-SETUP.md`

## Project Structure
- **Frontend**: React + Vite application in `frontend/` directory
- **Backend**: Uses Supabase (external service)
- **Tech Stack**: React, Vite, Tailwind CSS, React Router, Supabase

## Configuration Files
- `frontend/vite.config.js` - Vite configuration (port 5000, 0.0.0.0)
- `frontend/postcss.config.js` - PostCSS with Tailwind & Autoprefixer
- `frontend/tailwind.config.js` - Tailwind CSS with neo-brutalist theme
- `frontend/.env` - Environment variables (Supabase credentials needed)

## Required Environment Variables
The following environment variables need to be set in `frontend/.env`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Running the Application
The workflow "Server" runs the frontend dev server:
```bash
cd frontend && npm run dev
```

Server runs on port 5000 and is accessible via the Replit webview.

## Setup Instructions for New Users
1. Get Supabase credentials from https://supabase.com
2. Add credentials to `frontend/.env`
3. The workflow will automatically restart and the app will be functional

## Notes
- The root directory contains duplicate files (src/, vite.config.js, etc.) that are not used
- The actual working application is entirely in the `frontend/` directory
- No backend server in this repository - uses Supabase as backend-as-a-service
