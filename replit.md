# WebinarWins MVP - Replit Configuration

## Project Overview
WebinarWins is a React-based web application that helps webinar hosts automate personalized follow-up emails based on attendee engagement metrics. The app uses Supabase for authentication and backend services.

## Recent Changes (October 17, 2025)
- Imported GitHub repository to Replit
- Configured Vite dev server for Replit environment (port 5000, host 0.0.0.0)
- Created missing Supabase configuration file (`frontend/src/lib/supabase.js`)
- Added PostCSS configuration for frontend
- Set up development workflow
- Created `.env` file template for Supabase credentials

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
