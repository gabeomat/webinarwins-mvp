# Email Sending Feature Setup Guide

This guide will help you set up the email sending feature for WebinarWins.

## Overview

The email sending feature allows you to send generated follow-up emails directly from the platform using Resend, a modern email API with built-in tracking and analytics.

## Why Resend?

- **Simple Setup**: Just one API key needed
- **Email Tracking**: Track opens, clicks, and delivery
- **Better Deliverability**: Dedicated infrastructure for transactional emails
- **Free Tier**: 3,000 emails/month free (perfect for MVP testing)

## Prerequisites

1. ✅ Gmail integration connected (for reference only, not used for sending)
2. Database schema updated (see step 1 below)
3. Resend account created (see step 2 below)
4. Supabase Edge Function deployed (see step 3 below)

## Setup Steps

### Step 1: Update Database Schema

Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query):

```sql
ALTER TABLE generated_emails 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS sent_status VARCHAR(50) DEFAULT 'draft';

UPDATE generated_emails SET sent_status = 'draft' WHERE sent_status IS NULL;
```

You can also find this SQL in: `database-migrations/add-email-sent-tracking.sql`

### Step 2: Get Resend API Key

1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Verify your domain OR use the testing domain `onboarding@resend.dev`
3. Go to API Keys → Create API Key
4. Copy the API key (starts with `re_`)

### Step 3: Configure Supabase Edge Function Secrets

1. In Supabase Dashboard, go to **Edge Functions** → **Manage Secrets**
2. Add these secrets:
   - `RESEND_API_KEY`: Your Resend API key (from step 2)
   - `FROM_EMAIL`: Your verified sender email (or `onboarding@resend.dev` for testing)

Example:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxx
FROM_EMAIL=gabriel@yourdomain.com
```

**Note**: For production use, verify your domain in Resend to use a custom sender email.

### Step 4: Deploy Supabase Edge Function

1. Copy the entire contents of `supabase/functions/send-email/index.ts`
2. In your Supabase dashboard, go to **Edge Functions**
3. Click **Create a new function**
4. Name it: `send-email`
5. Paste the code
6. Click **Deploy**

### Step 5: Test Email Sending

1. Go to your app and generate emails for a webinar
2. Click the **SEND** button on an email draft
3. Confirm the send dialog
4. Check that:
   - The button changes to "✓ SENT" with a date
   - The email was received in the recipient's inbox
   - The email appears in your Resend dashboard

## Troubleshooting

### "Email service not configured" error
- Make sure `RESEND_API_KEY` is added to Edge Function secrets
- Redeploy the Edge Function after adding secrets

### "Failed to send email" error
- Check Resend API key is valid
- Check FROM_EMAIL is verified or using `onboarding@resend.dev`
- View logs in Supabase Edge Functions → Logs

### Email not received
- Check spam/junk folder
- Verify recipient email is correct
- Check Resend dashboard for delivery status

## Email Tracking (Bonus Feature)

With Resend, you can track email engagement:

1. Go to your Resend dashboard
2. Click on "Emails" to see all sent emails
3. View delivery status, opens, and clicks for each email

This data can help you understand which follow-up emails are most effective!

## Future Enhancements

- ✨ Batch sending for multiple emails
- ✨ Email templates with variables
- ✨ Schedule emails for later
- ✨ Email preview before sending
- ✨ Webhook integration to track opens/clicks in your database

## Cost Estimate

**Free Tier (Resend)**:
- 3,000 emails/month
- 100 emails/day
- Perfect for testing and small webinars

**Paid Plans**:
- $20/month: 50,000 emails
- $80/month: 250,000 emails

For most webinar hosts with 100-500 attendees per event, the free tier is sufficient for several webinars per month.
