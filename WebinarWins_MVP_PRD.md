# Product Requirements Document: WebinarWins MVP

**Product:** Personalized Post-Webinar Follow-up for Immediate Conversion  
**Owner:** Product Management  
**Status:** MVP Definition  
**Last Updated:** October 15, 2025  
**Version:** 1.0 (MVP)

---

## 1. Executive Summary

### MVP Vision

WebinarWins MVP is a lightweight automation tool that analyzes webinar participant engagement (attendance %, focus %, chat activity, questions) and generates hyper-personalized follow-up emails within 2 hours of webinar completion, increasing conversion rates for offers made during the webinar.

**Target User:** Solo entrepreneurs and small teams running educational webinars with a sales offer at the end. Currently spending 3-5 hours manually segmenting attendees and crafting follow-ups, resulting in generic messages and missed opportunities.

**Core Value Proposition:** Transform 3-5 hours of manual work into 15 minutes of review time while delivering personalized follow-ups that reference specific attendee behaviors (including their focus level during the webinar), doubling conversion rates on end-of-webinar offers.

**MVP Success Metric:** 10 paying customers within 90 days, each reporting 1.5x-2x improvement in post-webinar conversion rates compared to their manual baseline.

### The Data Advantage

Your webinar platform provides incredibly rich engagement data that most hosts ignore:
- **Focus %** - Were they actively watching or multitasking? (11% to 100% range in your data)
- **Attendance %** - How much did they watch? (74% to 100% for attendees)
- **Chat participation** - Did they engage with the content?
- **Questions asked** - Specific interests and concerns
- **No-show data** - 31 out of 45 registrants didn't attend your last webinar!

---

## 2. Problem Statement

### The Core Problem

**Who:** Webinar hosts selling products/services at the end of their webinars (coaches, course creators, consultants)

**What:** Missing sales opportunities because follow-up emails are:
1. Too generic (same message to everyone, regardless of engagement level)
2. Too slow (sent 24-48 hours later when interest has cooled)
3. Too time-consuming (3-5 hours of manual segmentation and writing)
4. Ignoring valuable data (Focus %, attendance patterns, chat engagement)

**Real Data from Your Last Webinar:**
- 45 registrants → only 14 attended (31% attendance rate)
- Of the 14 who attended:
  - High focus group: 86-97% focus (5 people) - These are HOT leads!
  - Medium focus: 54-65% focus (3 people) - Interested but distracted
  - Low focus: 11% focus (1 person) - Probably multitasking
  - Multiple people asked questions showing buying intent
  - Engagement ranged from 0 chat messages to 10+ messages

**Impact:** 
- Only 2-3% conversion rate on post-webinar offers (industry reports 5-8% possible with personalization)
- The 5 people with 86%+ focus who didn't buy represent $2,500 in immediate lost revenue (assuming $500 product)
- The 31 no-shows need re-engagement (potential $15,500 if just 10% convert)
- Time spent: 3-5 hours manually analyzing this data and writing personalized messages

**Evidence:**
- Your chat data shows Laura engaged 13 times with thoughtful comments about "imposter syndrome"
- Lori sent 8 messages and stayed 100% of webinar with 97% focus - this is a buyer!
- Rachel asked specific questions about GPT monetization - clear buying signal
- Glen Wagner had 86% focus and asked about Claude vs GPT - ready to purchase
- But they all likely got the same generic follow-up (if any)

---

## 3. MVP Scope

### What's IN the MVP

**Core Features (Must Build):**

1. **Data Import**
   - CSV upload for webinar attendance data (Name, Email, Attended?, Attendance %, Focus %, Join/Exit times)
   - CSV upload for chat logs (timestamp, name, email, message, is question?)
   - Simple form to capture: webinar topic, offer made, price point, deadline

2. **Advanced Engagement Scoring**
   The game-changer: Using Focus % to identify TRUE engagement
   
   Calculate composite engagement score based on:
   - **Focus % (40% weight)** - Were they actively watching or multitasking?
     * 80-100% focus = 100 points (fully engaged)
     * 60-79% focus = 70 points (somewhat engaged)
     * 40-59% focus = 40 points (distracted)
     * 0-39% focus = 0 points (tab was open but not watching)
   
   - **Attendance % (30% weight)** - How much did they watch?
     * 90-100% attendance = 100 points
     * 75-89% attendance = 70 points
     * 50-74% attendance = 40 points
     * 0-49% attendance = 0 points
   
   - **Chat Engagement (20% weight)** - Did they participate?
     * 5+ messages = 100 points
     * 3-4 messages = 70 points
     * 1-2 messages = 40 points
     * 0 messages = 0 points
   
   - **Question Bonus (10% weight)** - Did they ask questions?
     * 2+ questions = 100 points
     * 1 question = 70 points
     * 0 questions = 0 points

   **Final Tiers:**
   - **Hot Lead (80-100 points)** - High focus + high engagement = Ready to buy!
   - **Warm Lead (60-79 points)** - Good engagement but some distraction
   - **Cool Lead (40-59 points)** - Interested but not fully engaged
   - **Cold Lead (0-39 points)** - Attended but not engaged
   - **No-Show** - Registered but didn't attend (separate strategy)

3. **5-Tier Personalized Email Generation**
   
   **A. Hot Lead Emails (80-100 points)**
   - Reference their specific question/comment from chat
   - Acknowledge their high engagement: "I noticed you were fully engaged throughout"
   - Create urgency: "Based on your focus and questions, you're ready for this"
   - Direct call-to-action with special incentive for immediate action
   - Personal tone: "I want to personally reach out to YOU"
   
   **B. Warm Lead Emails (60-79 points)**
   - Acknowledge their participation and questions
   - Address any concerns they raised
   - Provide additional value/content related to their interests
   - Clear call-to-action with deadline
   - Encouraging tone: "You're almost there"
   
   **C. Cool Lead Emails (40-59 points)**
   - Recap key points from the section they attended
   - Provide replay link for what they missed
   - Address common objections
   - Softer call-to-action with extended deadline
   - Helpful tone: "Let me help you get the full picture"
   
   **D. Cold Lead Emails (0-39 points)**
   - Acknowledge they may have been multitasking
   - Provide replay with specific timestamp to most valuable section
   - Ask if timing was wrong or if they have questions
   - Very soft call-to-action, focus on re-engagement
   - Understanding tone: "I know you were busy"
   
   **E. No-Show Emails (Didn't attend)**
   - Acknowledge they couldn't make it (no guilt)
   - Provide replay link with compelling reason to watch
   - Highlight what they missed (FOMO)
   - Special incentive for watching replay
   - Include survey: "What happened? Wrong time? Topic not interesting?"
   - Second-chance tone: "I saved you a spot"

4. **Smart Insights Dashboard**
   - Show all attendees sorted by engagement score
   - Highlight "Hot Leads" that need immediate follow-up
   - Flag attendees who asked questions (show the questions)
   - Show focus % distribution (identify your super fans)
   - Identify patterns: "5 people had high focus but didn't buy - what objection did you miss?"

5. **Review & Export**
   - Preview all generated emails with ability to edit
   - See engagement score breakdown for each person
   - Add personal notes to any email
   - Export as CSV (name, email, subject, body, engagement_tier, personal_notes)
   - Copy to clipboard for email tool import
   - **Bonus:** Generate "Priority Follow-Up List" - Top 5 people to call personally

### What's OUT of the MVP

**Explicitly Excluded (Build Later):**
- No direct API integrations with webinar platforms (manual CSV upload only)
- No automatic email sending (export to email tool)
- No multi-channel (LinkedIn, SMS) - Email only
- No CRM integration
- No multi-touch campaign sequences (single email per person)
- No A/B testing
- No analytics/tracking after emails are sent
- No replay page creation
- No payment processing

---

## 4. User Journey (MVP)

### Current State (Manual Process)
**Looking at your Oct 1st webinar:**
1. Export attendee list from Demio (2 min)
2. Export chat log from Demio (2 min)
3. Open both files and try to match emails (5 min)
4. Manually review chat to identify who asked questions (20 min)
   - "Laura asked about imposter syndrome multiple times"
   - "Rachel asked about GPT monetization"
   - "Glen asked about Claude vs ChatGPT"
5. Try to remember who seemed engaged during webinar (impossible - 60 min)
6. Notice attendance % but ignore Focus % data (don't understand it) (0 min)
7. Write personalized emails for 2-3 most active chatters (45 min)
8. Write semi-personalized for 3-4 others (30 min)
9. Write generic email for everyone else (20 min)
10. Realize you haven't followed up with 31 no-shows (feel guilty) (10 min)
11. Write separate no-show email (15 min)
12. Copy/paste all into email tool (15 min)

**Total: 3.5-4 hours, usually done the next day**  
**Result:** Only top 3-5 people get personalized attention. Miss that Lori had 97% focus and is ready to buy!

### New State (With WebinarWins MVP)

**Immediately after webinar:**
1. Export attendance CSV from Demio (1 min)
2. Export chat CSV from Demio (1 min)
3. Upload both to WebinarWins (1 min)
4. Fill in webinar details form: 
   - Topic: "Building Custom GPTs for Your Business"
   - Offer: "AI Evolution Lab membership"
   - Price: $97/month
   - Deadline: "48 hours" (2 min)
5. Click "Analyze & Generate"
6. **WebinarWins processes data:**
   - Matches attendees with chat mes
## 6. Technical Requirements (MVP)

### 6.1 Simple Technology Stack

**Frontend:**
- React.js (Create React App or Vite)
- Tailwind CSS for styling
- React Router for navigation
- CSV parsing: PapaParse library
- No complex state management needed for MVP

**Backend:**
- Python with FastAPI (simple REST API)
- OpenAI GPT-4 API for email generation
- PostgreSQL for data storage (or SQLite for ultra-MVP)
- Deployed on Railway or Render

**Hosting:**
- Frontend: Vercel (free tier sufficient)
- Backend + DB: Railway (starts at $5/month)
- Total infrastructure cost: ~$20-30/month for first 100 users

**External Services:**
- OpenAI API ($20-50/month estimated for MVP usage)
- SendGrid for transactional emails (account notifications, etc.)

### 6.2 Data Model (Simplified)

**Tables:**

1. **users**
   - id, email, name, created_at
   - subscription_tier, api_credits_remaining

2. **webinars**
   - id, user_id, title, topic, date_hosted
   - offer_name, offer_description, price, deadline
   - replay_url
   - created_at

3. **attendees**
   - id, webinar_id, name, email
   - attended (boolean)
   - attendance_percent, focus_percent, attendance_minutes
   - join_time, exit_time, location
   - created_at

4. **chat_messages**
   - id, attendee_id, message_text, timestamp
   - is_question (boolean)

5. **generated_emails**
   - id, attendee_id, subject_line, email_body_text, email_body_html
   - engagement_score, engagement_tier
   - personalization_elements (JSON)
   - user_edited (boolean), user_notes
   - created_at

### 6.3 API Endpoints (Essential Only)

```
POST /api/webinars/create
- Upload CSVs and create webinar session

GET /api/webinars/{id}
- Get webinar details and all attendees

POST /api/webinars/{id}/generate-emails
- Trigger AI email generation

GET /api/webinars/{id}/attendees
- Get list of attendees with engagement scores

PUT /api/emails/{id}
- Update/edit a generated email

POST /api/webinars/{id}/export
- Generate CSV export file

GET /api/webinars/{id}/insights
- Get dashboard insights and stats
```

### 6.4 MVP Performance Targets

**Speed:**
- CSV upload & processing: < 5 seconds for 100 attendees
- Email generation (all attendees): < 30 seconds for 50 attendees
- Dashboard load: < 2 seconds
- CSV export: < 3 seconds

**Capacity:**
- Support up to 100 attendees per webinar
- Support up to 500 chat messages per webinar
- 10 concurrent webinar processing sessions

**AI Token Usage (Cost Management):**
- ~500-1000 tokens per generated email
- Batch processing to optimize API calls
- Cache common responses for similar engagement patterns

### 6.5 Security & Privacy (MVP Essentials)

- Email addresses encrypted at rest
- HTTPS for all connections
- Basic rate limiting (10 requests/min per user)
- No storage of raw webinar video/audio
- Users can delete their data anytime
- OAuth for user authentication (Google sign-in)

**GDPR/Privacy:**
- Clear data usage policy
- 30-day data retention (then auto-delete)
- Export your data feature
- One-click delete account

---

## 7. Success Metrics (MVP)

### Primary Metrics (Must Track)

1. **Customer Acquisition**
   - Goal: 10 paying customers by day 90
   - Track: Trial starts, trial-to-paid conversion (target 30%)

2. **Customer-Reported Conversion Improvement**
   - Goal: 1.5x-2x improvement in post-webinar conversion rates
   - Track: Survey results, before/after comparison
   - Measure: "My conversion rate was X%, now it's Y%"

3. **Time Saved**
   - Goal: 80% reduction in follow-up time
   - Track: User time logs, self-reported savings
   - Measure: "I used to spend X hours, now I spend Y minutes"

4. **User Satisfaction**
   - Goal: 4.5+ stars average rating
   - Track: In-app rating prompts, NPS surveys
   - Target NPS: 50+

### Secondary Metrics (Nice to Have)

1. **Feature Usage**
   - % of users who edit AI-generated emails (target < 30%)
   - % of users who export within 24 hours (target > 70%)
   - % of users who process multiple webinars (retention indicator)

2. **Email Quality Score**
   - Track internal quality metrics:
     * Personalization element count per email
     * Question references per email
     * User edit rate (lower = better AI)

3. **Engagement Score Distribution**
   - Track how webinars perform overall
   - Identify patterns in successful vs unsuccessful webinars

### Data Collection

**In-App Analytics:**
- Track user journey (upload → generate → review → export)
- Identify drop-off points
- Monitor time spent in each phase

**User Feedback:**
- Post-export survey: "How did it go?"
- 30-day check-in: "What were your results?"
- Feature request form

**Success Stories:**
- Collect testimonials from users who see improvement
- Document case studies (with permission)
- Track revenue generated by users (self-reported)

---

## 8. MVP Pricing & Business Model

### Pricing Tiers

**Free Trial (14 days)**
- Process 1 webinar
- Up to 50 attendees
- All features unlocked
- No credit card required

**Starter Plan: $29/month**
- 4 webinars per month
- Up to 100 attendees per webinar
- Unlimited email edits
- CSV export
- Email support

**Pro Plan: $79/month**
- Unlimited webinars
- Up to 500 attendees per webinar
- Priority email generation (faster AI)
- Priority support
- Advanced analytics (coming soon)

**Annual Discount: 2 months free**
- Starter: $290/year (save $58)
- Pro: $790/year (save $158)

### Revenue Projections (Conservative)

**Month 1-3 (MVP Launch):**
- 5 paying customers × $29 = $145 MRR
- 3 paying customers × $79 = $237 MRR
- **Total: $382 MRR**

**Month 4-6 (Early Growth):**
- 15 paying customers × $29 = $435 MRR
- 8 paying customers × $79 = $632 MRR
- **Total: $1,067 MRR**

**Month 7-12 (Finding Product-Market Fit):**
- 40 paying customers × $29 = $1,160 MRR
- 20 paying customers × $79 = $1,580 MRR
- **Total: $2,740 MRR ($32,880 ARR)**

### Cost Structure

**Fixed Costs (Monthly):**
- Infrastructure: $30
- OpenAI API: $100 (assuming 60 webinars/month across all users)
- Email service: $15
- Domain, SSL, misc: $10
- **Total: $155/month**

**Break-Even:**
- Need ~6 paying customers to break even on infrastructure
- Everything beyond that is contribution margin

### Positioning

**Target Customer Profile:**
- Solo entrepreneurs or small teams
- Running 2-8 webinars per month
- Selling products/services in the $100-$1000 range
- Currently doing follow-ups manually
- Typical customer value: $300-500 per webinar

**Value Proposition:**
If you sell a $500 product and convert just ONE additional person per webinar due to better follow-up, the tool pays for itself 10x over.

Example: 
- 4 webinars/month × 1 additional sale × $500 = $2,000 extra revenue
- Tool cost: $29-79/month
- ROI: 25-68x

---

## 9. MVP Development Plan

### Phase 1: Core Infrastructure (Week 1-2)
- Set up frontend and backend scaffolding
- Implement CSV upload and parsing
- Build data model and database
- Create basic authentication

### Phase 2: Engagement Scoring (Week 3)
- Implement scoring algorithm
- Build attendee matching logic (chat to attendance)
- Create engagement tier calculation
- Unit tests for scoring accuracy

### Phase 3: AI Email Generation (Week 4-5)
- Integrate OpenAI GPT-4 API
- Build prompt templates for each tier
- Implement batch generation
- Test output quality across scenarios

### Phase 4: Dashboard & Review (Week 6)
- Build main dashboard UI
- Create email preview and edit functionality
- Implement priority ranking view
- Add export functionality

### Phase 5: Polish & Testing (Week 7-8)
- End-to-end testing
- User acceptance testing with 3-5 beta users
- Bug fixes and refinements
- Documentation and onboarding flow

### Phase 6: Launch (Week 9)
- Soft launch to initial customers
- Gather feedback
- Iterate quickly on issues
- Begin marketing push

**Total MVP Timeline: 9 weeks (2 months + 1 week buffer)**

### Team Requirements

**Essential:**
- 1 Full-Stack Developer (primary builder)
- 1 Product Manager (you - defining requirements, testing, customer feedback)

**Nice to Have:**
- 1 Designer (for polish, can use Tailwind templates initially)
- 1 AI/Prompt Engineer (or learn as you go)

**Budget (9 weeks):**
- Developer: $8,000-12,000 (freelance or part-time)
- Infrastructure: $200
- OpenAI API testing: $100
- **Total: $8,300-12,300**

---

## 10. Risks & Mitigations

### Technical Risks

**Risk: OpenAI API unreliability or cost increases**
- Mitigation: Build with pluggable AI providers (can switch to Anthropic Claude, local models)
- Monitor token usage closely

**Risk: Email generation quality is poor**
- Mitigation: Extensive prompt engineering and testing before launch
- Allow users to provide feedback on email quality
- Manual review option for all emails

**Risk: CSV parsing fails with different formats**
- Mitigation: Support multiple common formats
- Provide clear upload requirements
- Show preview before processing

### Business Risks

**Risk: Market doesn't want to pay for this**
- Mitigation: Extensive pre-launch validation (talk to 20+ potential customers)
- Generous free trial to prove value
- Collect testimonials early

**Risk: Competitors launch similar tool**
- Mitigation: Focus on quality and customer service
- Build moat through better AI and insights
- Move fast and iterate based on feedback

**Risk: Users don't see improved conversions**
- Mitigation: Ensure realistic expectations in marketing
- Provide guidance on email best practices
- Offer to review their webinar strategy

### Mitigation Strategy

- Beta test with 5-10 friendly users before public launch
- Collect extensive feedback during beta
- Don't over-promise on conversion improvements
- Focus on time savings as primary benefit (conversion boost is bonus)
- Build in public, share progress, gather interest

---

## 11. Post-MVP Roadmap (Future)

Once MVP is validated and has 10+ paying customers:

**Version 2.0 Features:**
- Direct integration with Zoom, Demio, WebinarJam APIs (no more CSV uploads)
- Automatic email sending (no need for export)
- Multi-touch campaign sequences (not just single email)
- LinkedIn and SMS channels
- A/B testing of email variations
- Analytics dashboard showing email opens, clicks, conversions

**Version 3.0 Features:**
- CRM integrations (HubSpot, Salesforce, Pipedrive)
- Custom email templates and branding
- Team collaboration features
- White-label for agencies
- Advanced AI training on your past webinars
- Predictive analytics ("This person is 85% likely to buy")

**But for now: Focus ruthlessly on the MVP and prove the core value proposition works.**

---

## Appendix: Real Data Example

Here's what WebinarWins MVP would have generated for your October 1st webinar:

**Input Data:**
- 45 registrants, 14 attended, 31 no-shows
- 79 chat messages from 10 participants
- Rich engagement data (Focus %, Attendance %)

**Output:**
- 3 Hot Lead emails (Lori, Rachel, Laura) - personalized with their questions and high engagement
- 3 Warm Lead emails (Glen, ka yee, Simone) - acknowledged good engagement, answered questions
- 3 Cool Lead emails (Raquel, Matthew, Gabriel) - provided replay, highlighted missed content
- 5 Cold Lead emails (Tim + others) - understanding tone, emphasized replay
- 31 No-Show emails - re-engagement with replay link

**Time Investment:**
- Upload: 3 minutes
- Review: 10 minutes
- Edit: 5 minutes
- Export: 2 minutes
**Total: 20 minutes vs. 4 hours manual**

**Estimated Additional Revenue:**
If even 1 out of the 3 Hot Leads converts (33% close rate on hot leads is reasonable):
- 1 customer × $97/month × 12 months = $1,164 additional annual revenue
- Tool cost: $29/month × 12 = $348/year
- **Net gain: $816 per year from ONE webinar's improved follow-up**

Run 4 webinars/month = $3,264 additional annual revenue.

**This is the story you'll tell to sell the MVP.**

---

*End of MVP PRD*

---

**Next Steps:**
1. Validate this MVP concept with 10-20 potential customers
2. Build a simple landing page to collect email signups
3. Find a developer to build the MVP
4. Beta test with first 5 users
5. Launch publicly and iterate based on feedback

**The key insight:** You have incredibly rich data from your webinars that you're not fully leveraging. Focus % alone is a game-changer that most people ignore. Build the simplest possible tool that helps you (and others like you) turn that data into personalized, high-converting follow-up emails.

ure you didn't miss what I shared in the final section.

**Here's What You Missed:**

I introduced the AI Evolution Lab, a new community and training program where you can:

- Learn to build Custom GPTs step-by-step (like the coaching GPT I demoed)
- Get weekly hands-on workshops where we build together
- Access a private Skool community with other coaches and entrepreneurs
- Use our custom tools like the Vibe Coding platform

**Special Replay Offer:**

Since you were registered and interested enough to join live, I'm extending the founding member pricing to you:

**$9/month** for your first 3 months (then $97/month, cancel anytime)

Here's the replay link if you want to see what I covered at the end: [REPLAY LINK]

The best part? This is perfect for someone who's exploring AI but doesn't have tons of time to figure it all out. We do the heavy lifting, you get the results.

No pressure at all - just didn't want you to miss out if this is something you're interested in.

[YES, I'M INTERESTED - SHOW ME MORE →]

Questions? Just reply to this email.

Gabriel

P.S. - If the timing wasn't right today, no problem. But watch the last 15 minutes of the replay - that's where I show the real value.
```

**Template Rules for Cool Leads:**
- No guilt about leaving early
- Tell them specifically what they missed
- Provide replay link prominently  
- Softer pitch, focus on "no pressure"
- Extended deadline/special consideration
- Acknowledge they may need more information
- Helpful, understanding tone

---

**TIER 4: COLD LEAD TEMPLATE (1-39 points)**

**Use Case:** Tim - 11% focus, 97% attendance, 0 chat messages

**Generated Email Example:**

```
Subject: Tim - were you able to follow along today?

Hi Tim,

I noticed you had the webinar on for the full hour today (awesome!), but I'm guessing you might have been multitasking - totally understandable.

I know the feeling of having the webinar playing while you're answering emails or working on something else. The content is there, but you can't give it full attention.

So I wanted to reach out with the replay link in case you want to actually WATCH it when you have dedicated time:

[WATCH THE REPLAY - FULL FOCUS THIS TIME →]

**What You'll Want to Pay Attention To:**

- **Minute 15-30:** Where I walk through building a Custom GPT from scratch
- **Minute 40-50:** The demo of turning it into a voice-based coaching tool
- **Minute 52-60:** The special offer for the AI Evolution Lab

Speaking of which - I introduced a new community and training program at the end. If you're interested in actually IMPLEMENTING AI in your business (not just learning about it), this might be exactly what you need.

**Quick Overview:**
- $9/month founding member pricing (48 hours only)
- Step-by-step Custom GPT training
- Weekly hands-on workshops
- Private community + tools

But honestly? Watch the replay first when you can give it your full attention. Then decide if it's right for you.

[WATCH REPLAY & LEARN MORE →]

No hard feelings if it's not your thing - just wanted to make sure you got the full picture.

Gabriel

P.S. - Sometimes the best webinars are the ones you watch on replay anyway. You can pause, take notes, and actually process the information. Give it a shot!
```

**Template Rules for Cold Leads:**
- Acknowledge they were likely multitasking (no judgment)
- Emphasize replay over pitch
- Give specific timestamps to watch
- Very soft CTA
- Understanding, empathetic tone
- Qualify them ("if you're interested in IMPLEMENTING")
- Give them permission to not buy

---

**TIER 5: NO-SHOW TEMPLATE (0 points)**

**Use Case:** Laura S., Tammy, Kenya, and 28 others who registered but didn't attend

**Generated Email Example:**

```
Subject: Laura - I saved your spot (webinar replay inside)

Hi Laura,

I noticed you weren't able to make it to today's live webinar on building Custom GPTs for your business. No worries - I know things come up!

But I didn't want you to miss out completely, so I've saved your spot and here's the full replay:

[WATCH THE FULL WEBINAR REPLAY →]

**What You'll Learn:**

In this 60-minute training, I show you:

- How to build a Custom GPT in under 10 minutes (even if you're not technical)
- The secret to making your GPT sound like YOU, not a robot
- How coaches and consultants are using GPTs to scale their expertise
- A live demo of turning a GPT into a voice-based tool
- The #1 mistake people make when building GPTs (and how to avoid it)

**Why You'll Want to Watch This:**

If you're a coach, consultant, or expert of any kind, Custom GPTs are going to transform how you deliver value to clients. The people who learn this NOW will have a massive advantage.

Plus, at the end I introduce a special offer that's only available for 48 hours - so you'll want to watch sooner rather than later.

**Quick Question:** What happened? Wrong time? Topic not what you expected?

Hit reply and let me know - it helps me schedule future sessions better. And if there's something specific you want to learn about AI, I'm all ears.

[WATCH THE REPLAY NOW →]

Hope to see you at the next one!

Gabriel

P.S. - The replay is only available for 7 days, so don't wait too long. Block 60 minutes on your calendar and give it your full attention - it'll be worth it.
```

**Template Rules for No-Shows:**
- Zero guilt or pressure
- Make them feel included ("I saved your spot")
- Clear value proposition for watching replay
- Ask why they didn't attend (engagement tactic)
- Soft CTA about offer at end
- Create light urgency (replay expires, offer expires)
- Friendly, inviting tone
- P.S. reinforces urgency without being pushy

---

**AI Generation Prompts:**

For each tier, use a specific GPT-4 prompt that includes:
1. The tier template and rules above
2. All attendee engagement data
3. Their actual chat messages/questions (if any)
4. Webinar details (topic, offer, price, deadline)
5. Instruction to personalize while maintaining the tier's tone

Example prompt structure:
```
You are writing a follow-up email for a {tier} lead from a webinar.

ATTENDEE DATA:
- Name: {name}
- Engagement Score: {score}/100
- Focus: {focus}%
- Attendance: {attendance}%
- Messages sent: {message_count}
- Questions asked: {question_count}
- Actual messages: {message_list}

WEBINAR DETAILS:
- Topic: {topic}
- Offer: {offer_name}
- Description: {offer_description}
- Price: {price}
- Deadline: {deadline}
- Replay URL: {replay_url}

Write a personalized email following the {tier} template rules. Reference specific things they said or did. Maintain the appropriate tone for their engagement level.
```

---

### 5.4 Review Dashboard & Email Management

**Dashboard Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  WEBINAR: Building Custom GPTs for Your Business                │
│  DATE: October 1, 2025  │  TOTAL REGISTRANTS: 45                │
│                                                                   │
│  📊 ENGAGEMENT BREAKDOWN:                                        │
│  🔥 Hot Leads (80-100): 3 people  │  Time Saved: 3.5 hours      │
│  🌡️ Warm Leads (60-79): 3 people  │  Estimated Value: $2,250    │
│  ❄️ Cool Leads (40-59): 3 people  │                             │
│  🧊 Cold Leads (1-39): 5 people    │  [Export All Emails]       │
│  👻 No-Shows: 31 people            │  [Copy Priority List]      │
└─────────────────────────────────────────────────────────────────┘

PRIORITY FOLLOW-UP LIST (Call These People Personally):

Rank  Name           Score  Tier       Key Signals                      Preview Email
────────────────────────────────────────────────────────────────────────────────────
1   🔥 Rachel       91    Hot Lead   📞 6 questions about monetization  [Preview] [Edit]
                                     💬 Super engaged in chat
                                     🎯 Asked "Can you limit sharing?"

2   🔥 Lori         93    Hot Lead   💬 8 messages, very positive      [Preview] [Edit]
                                     👀 97% focus, 100% attendance
                                     🎯 Said "I need a course like that"

3   🔥 Laura        89    Hot Lead   💬 13 messages                     [Preview] [Edit]
                                     🎯 Mentioned "imposter syndrome"
                                     👀 100% attendance, 89% focus

────────────────────────────────────────────────────────────────────────────────────

ALL ATTENDEES (sortable):

Search: [________]  Filter: [All Tiers ▼]  Sort By: [Score (High to Low) ▼]

Name          Email                        Score Tier      Focus% Attend% Messages Questions Actions
────────────────────────────────────────────────────────────────────────────────────────────────────
Lori          lori@theblessedsolution.com   93  🔥 Hot    97%   100%    8        2        [Preview] [Edit] [☑]
Rachel        racheljbellamy@me.com         91  🔥 Hot    93%   81%     6        6        [Preview] [Edit] [☑]
Laura         CairnGlenPress@gmail.com      89  🔥 Hot    89%   100%    13       0        [Preview] [Edit] [☑]
Glen Wagner   gjwagner@finishstrong.org     78  🌡️ Warm   86%   93%     3        2        [Preview] [Edit] [☑]
Simone        simonepierce@hotmail.com      75  🌡️ Warm   100%  75%     0        0        [Preview] [Edit] [☑]
ka yee        kayee.lok@gmail.com           63  🌡️ Warm   65%   93%     1        1        [Preview] [Edit] [☑]
Raquel        r.martinez1961@gmail.com      52  ❄️ Cool   54%   74%     1        0        [Preview] [Edit] [☑]
Matthew       matthew@matthewcurran.net     48  ❄️ Cool   45%   80%     3        0        [Preview] [Edit] [☑]
Gabriel Omat  coachme@gabrielomat.com       45  ❄️ Cool   50%   75%     2        0        [Preview] [Edit] [☑]
Tim Koz       timkozdm@gmail.com            32  🧊 Cold   11%   97%     0        0        [Preview] [Edit] [☑]

[Load More Attendees] (4 more)

NO-SHOWS (31 people) - [Expand List ▼]

────────────────────────────────────────────────────────────────────────────────────

BULK ACTIONS:

[☑] Select All Hot Leads  [☑] Select All Warm Leads  [☑] Select All No-Shows

[Export Selected (14 selected)]  [Send Test Email]  [Preview All]
```

**Email Preview Modal:**

```
┌────────────────────────────────────────────────────────────┐
│  EMAIL PREVIEW: Lori                                       │
│                                                            │
│  From: Gabriel Omat <gabriel@youremail.com>               │
│  To: lori@theblessedsolution.com                          │
│  Subject: Lori, your question about AI + human...         │
│  ─────────────────────────────────────────────────────    │
│                                                            │
│  Hi Lori,                                                  │
│                                                            │
│  I couldn't help but notice how engaged you were during   │
│  today's webinar on building Custom GPTs - you were...    │
│                                                            │
│  [Full email content displayed with formatting]           │
│                                                            │
│  ─────────────────────────────────────────────────────    │
│                                                            │
│  ENGAGEMENT DATA:                                          │
│  Score: 93/100 (Hot Lead 🔥)                              │
│  Focus: 97% | Attendance: 100% | Messages: 8 | Questions: 2│
│                                                            │
│  PERSONALIZATION ELEMENTS:                                 │
│  ✓ References her comment: "They still need your human..." │
│  ✓ Acknowledges 97% focus level                           │
│  ✓ Mentions her 100% attendance                           │
│  ✓ References her being a life coach                      │
│                                                            │
│  [Edit Email]  [Use Different Template]  [Approve ✓]      │
└────────────────────────────────────────────────────────────┘
```

**Email Editor (for customization):**

```
┌────────────────────────────────────────────────────────────┐
│  EDIT EMAIL: Lori                                          │
│                                                            │
│  Subject: [Lori, your question about AI + human...    ]   │
│                                                            │
│  Email Body:                                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Hi Lori,                                             │ │
│  │                                                      │ │
│  │ I couldn't help but notice how engaged you were... │ │
│  │ [Editable text area with formatting toolbar]       │ │
│  │                                                      │ │
│  │ ▼ Insert Token: [Name▼] [Question▼] [Focus%▼]      │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Add Personal Note (optional):                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ P.P.S. - [Your additional personal message here]    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [Preview Changes]  [Save]  [Cancel]  [Revert to AI Version]│
└────────────────────────────────────────────────────────────┘
```

**Key Features:**

1. **Priority Ranking**
   - Automatically surfaces top 3-5 people to call or give extra attention
   - Shows their key buying signals and questions
   - One-click to preview their personalized email

2. **Smart Filtering**
   - Filter by tier (Hot/Warm/Cool/Cold/No-Show)
   - Filter by "Asked Questions" checkbox
   - Filter by focus % range
   - Search by name or email

3. **Bulk Actions**
   - Select all in a tier for batch review
   - Apply same edit to multiple emails (e.g., change deadline)
   - Preview all Hot Leads in sequence

4. **Email Quality Indicators**
   - Green checkmark: "High personalization, ready to send"
   - Yellow warning: "Low personalization, consider editing"
   - Red flag: "Generic content, needs review"

5. **Quick Stats**
   - Time saved calculator: "You would have spent 3.5 hours doing this manually"
   - Revenue opportunity: "5 Hot Leads × $97/mo × 50% conversion = $242.50/month potential"
   - Engagement insights: "Your webinar had 3x more Hot Leads than average!"

### 5.5 Export Functionality

**Export Options:**

**1. CSV Export (for email tools like Mailchimp, ConvertKit, etc.)**

Columns:
- first_name
- last_name  
- email
- engagement_tier (Hot Lead, Warm Lead, etc.)
- engagement_score (0-100)
- subject_line
- email_body (plain text)
- email_body_html (HTML formatted)
- personal_notes (any notes you added)
- has_questions (TRUE/FALSE)
- focus_percent
- attendance_percent
- priority_rank (1-45, for sorting)

**2. Mailchimp-Ready Format**
- Pre-formatted with Mailchimp merge tags
- Includes segmentation tags for automation
- One-click import instructions

**3. Copy to Clipboard**
- Formatted as tab-separated values
- Can paste directly into Google Sheets or Excel
- Preserves formatting

**4. Priority Follow-Up List (PDF)**
- Top 10 people ranked by engagement score
- Shows their questions, comments, and buying signals
- Print-friendly format for sales team
- Includes talking points for phone calls

**5. Individual Email Files**
- Option to download each email as separate .txt or .html file
- Useful for manual sending or CRM upload
- Organized in folders by tier

**Pre-Send Checklist:**

Before exporting, system shows:
```
┌─────────────────────────────────────────────────────────┐
│  READY TO EXPORT?                                       │
│                                                         │
│  ✓ 14 emails generated for attendees                   │
│  ✓ 31 emails generated for no-shows                    │
│  ✓ All emails reviewed (or [Review Now])               │
│                                                         │
│  ⚠️ 3 emails flagged for review (low personalization)  │
│     [Review Flagged Emails]                            │
│                                                         │
│  ☐ I have reviewed the hot leads personally            │
│  ☐ I have added personal notes where needed            │
│  ☐ I have double-checked the offer details             │
│  ☐ I have verified the deadline is correct             │
│                                                         │
│  [Export All to CSV]  [Export Priority List Only]      │
└─────────────────────────────────────────────────────────┘
```

**Post-Export Actions:**

After export, provide:
- Import instructions for top 5 email platforms
- Sample automation workflows
- Best practices for send timing:
  * Hot Leads: Send within 2 hours
  * Warm Leads: Send within 6 hours  
  * Cool/Cold Leads: Send within 24 hours
  * No-Shows: Send next day morning

---

## 6. Technical Requirements (MVP)

### 6.1 Architecture

**Simple Stack:**
- Frontend: React (single-page application)
- Backend: Python FastAPI (lightweight REST API)
- Database: PostgreSQL (stores user data, webinars, generated emails)
- AI: OpenAI GPT-4 API for email generation
- Hosting: Vercel (frontend) + Railway (backend + DB)

**No Complex Infrastructure:**
- No micro