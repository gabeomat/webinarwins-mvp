# No-Show Email Templates Feature

## Overview
No-show attendees have zero engagement data (no chat messages, no attendance, no focus metrics), which means AI-generated emails for them are essentially identical with minor variations. The template feature lets you write one email once and reuse it for all no-shows, saving time and money.

## Benefits

**Speed**: Instant generation instead of 5-10 seconds per email
**Cost**: $0 instead of ~$0.0003 per email (2 AI calls)
**Scale**: Handle 100+ no-shows in seconds instead of minutes
**Control**: You write it once in your voice, no AI variations

## How It Works

### 1. Create Template (One-Time Setup)

When creating or editing a webinar, fill in the "No-Show Email Template" section:

**Subject Line Template**:
```
{name}, you missed something special! Here's the replay
```

**Email Body Template**:
```
Hey {name},

I noticed you signed up for our webinar on {topic} but couldn't make it. Life gets busy — I totally get it!

The good news? You haven't missed out. I've got the full replay ready for you:
{replay_url}

In this session, we covered [key takeaways]. If this resonates with you, I'd love to have you join {offer_name}.

Warmly,
Gabriel
```

### 2. Available Variables

Use these variables in your templates (they'll be automatically replaced):

- `{name}` - Attendee's name
- `{topic}` - Webinar topic/description
- `{offer_name}` - Your offer name
- `{offer_description}` - Full offer description
- `{price}` - Formatted price (e.g., "$97")
- `{deadline}` - Offer deadline
- `{replay_url}` - Replay URL

### 3. Generation

When you click "GENERATE NO-SHOWS" or "NO-SHOWS":
- If template exists → instant generation using template
- If no template → falls back to AI generation

The system automatically:
1. Takes your template
2. Replaces all `{variables}` with actual data
3. Creates emails in database
4. Ready to review/send via Resend

### 4. Review & Send

Templates work exactly like AI-generated emails:
- Appear in the emails list
- Can be edited before sending
- Send via Resend integration
- Track sent status

## Example Comparison

### With AI (Current):
- 100 no-shows × 6 seconds = 10 minutes
- 100 no-shows × $0.0003 = $0.03
- Variations in tone/style between emails

### With Template:
- 100 no-shows × 0.1 seconds = 10 seconds  
- 100 no-shows × $0 = $0
- Consistent message for all no-shows

## Setup Instructions

### 1. Run Database Migration

Go to Supabase Dashboard → SQL Editor and run:
```sql
-- From: database-migrations/add-no-show-templates.sql
ALTER TABLE webinars 
ADD COLUMN IF NOT EXISTS no_show_template_subject VARCHAR(500),
ADD COLUMN IF NOT EXISTS no_show_template_body TEXT;
```

### 2. Deploy Updated Edge Function

Copy the updated code from `supabase/functions/generate-emails/index.ts` to your Supabase Edge Functions dashboard and deploy.

### 3. Create Templates

When uploading a new webinar, fill in the "No-Show Email Template" section. You can also leave it blank to use AI generation for no-shows.

## Technical Details

**Template Processing**:
- Simple string replacement using regex
- Processes in milliseconds
- No API calls, no AI models
- Stored in `webinars` table

**Fallback Behavior**:
- If template is empty/missing → uses AI generation
- Graceful degradation, no errors
- Can mix: use templates for some webinars, AI for others

**Metadata Tracking**:
- Template-generated emails marked with `generation_method: 'template'`
- AI-generated emails marked with `generation_method: '3-version-selection-with-style-refinement'`
- Easy to identify which method was used

## Best Practices

1. **Write it in your voice** - This is your authentic message, not AI's
2. **Test variables** - Make sure all `{variables}` have values in your webinar data
3. **Keep it consistent** - Use the same template across webinars for brand consistency
4. **Edit if needed** - You can still manually edit template-generated emails before sending
5. **Leave blank for AI** - If you want AI variation for a specific webinar, just don't fill in the template

## Status

✅ Database schema updated
✅ UI added to UploadWebinar page  
✅ Edge Function updated with template logic
✅ Tested and ready to use
