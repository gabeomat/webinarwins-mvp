# WebinarWins - Neubrutalism Edition

Transform 3-5 hours of webinar follow-up work into 15 minutes with AI-powered personalized emails.

## Features

- **Supabase Authentication** - Secure email/password sign-up and login
- **CSV Upload & Processing** - Upload attendance and chat data
- **Engagement Scoring** - Automatically calculate Hot/Warm/Cool/Cold leads based on:
  - Focus % (40% weight)
  - Attendance % (30% weight)
  - Chat engagement (20% weight)
  - Questions asked (10% weight)
- **Beautiful Neubrutalism Design** - Bold colors, thick borders, strong shadows
- **Dashboard** - View all your webinars and attendees
- **Export to CSV** - Download attendee data with engagement scores

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Environment Variables

Already configured in `.env`:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Usage

1. **Sign Up/Sign In** - Create an account or sign in
2. **Upload Webinar Data** - Click "New Webinar" and upload:
   - Attendance CSV (Name, Email, Attendance %, Focus %)
   - Chat CSV (Timestamp, Name, Email, Message)
3. **View Results** - See attendees ranked by engagement score
4. **Export** - Download CSV with all attendee data and scores

## Design System

### Colors
- **Yellow** (`#FFE500`) - Primary actions
- **Pink** (`#FF006E`) - Hot leads, danger actions
- **Cyan** (`#00F0FF`) - Secondary actions, Cool leads
- **Lime** (`#CCFF00`) - Success states
- **Orange** (`#FF6B00`) - Warm leads
- **Black** (`#000000`) - Borders, text

### Typography
- **Font:** Space Grotesk (Google Fonts)
- **Weights:** 400 (Regular), 700 (Bold), 900 (Black)

### Components
All components use neubrutalism principles:
- 3px solid black borders
- Bold box shadows (4px/8px/12px offset)
- No border radius
- High contrast colors
