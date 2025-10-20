import { createClient } from 'npm:@supabase/supabase-js@2.39.7'
import OpenAI from 'npm:openai@4.28.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

const MAX_RETRIES = 3
const PARALLEL_BATCH_SIZE = 5

function generateFromTemplate(attendee: any, webinar: any): { subject: string; body: string } {
  const variables: Record<string, string> = {
    name: attendee.name || '',
    topic: webinar.topic || '',
    offer_name: webinar.offer_name || '',
    offer_description: webinar.offer_description || '',
    price: webinar.price ? `$${webinar.price}` : '',
    deadline: webinar.deadline || '',
    replay_url: webinar.replay_url || '',
  }

  let subject = webinar.no_show_template_subject || ''
  let body = webinar.no_show_template_body || ''

  // Replace all variables in the template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    subject = subject.replace(regex, value)
    body = body.replace(regex, value)
  }

  return { subject, body }
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured')
    }

    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key not configured',
          message: 'The OPENAI_API_KEY environment variable is not set in Supabase Edge Functions.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)
    const openai = new OpenAI({ apiKey: openaiKey })

    const url = new URL(req.url)
    const webinarId = url.searchParams.get('webinar_id')
    const regenerate = url.searchParams.get('regenerate') === 'true'
    const tier = url.searchParams.get('tier')

    if (!webinarId) {
      return new Response(
        JSON.stringify({ error: 'webinar_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: webinar, error: webinarError } = await supabaseClient
      .from('webinars')
      .select('*')
      .eq('id', webinarId)
      .maybeSingle()

    if (webinarError || !webinar) {
      return new Response(
        JSON.stringify({ error: 'Webinar not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let attendeesQuery = supabaseClient
      .from('attendees')
      .select('*, chat_messages(*)')
      .eq('webinar_id', webinarId)

    if (tier) {
      attendeesQuery = attendeesQuery.eq('engagement_tier', tier)
    }

    const { data: attendees, error: attendeesError } = await attendeesQuery

    if (attendeesError) {
      throw attendeesError
    }

    let successful = 0
    let failed = 0
    let skipped = 0
    const errors: string[] = []
    const tierBreakdown: Record<string, number> = {}

    // Process attendees in parallel batches
    const processAttendee = async (attendee: any) => {
      const tierKey = attendee.engagement_tier || 'Unknown'
      
      try {
        const { data: existingEmail } = await supabaseClient
          .from('generated_emails')
          .select('*')
          .eq('attendee_id', attendee.id)
          .maybeSingle()

        if (existingEmail && !regenerate) {
          return { status: 'skipped', tierKey }
        }

        let emailContent: any
        
        // Check if this is a no-show and if a template exists
        if (attendee.engagement_tier === 'No-Show' && 
            webinar.no_show_template_subject && 
            webinar.no_show_template_body) {
          // Use template instead of AI
          const templateResult = generateFromTemplate(attendee, webinar)
          emailContent = {
            subject: templateResult.subject,
            body: templateResult.body,
            metadata: {
              engagement_score: attendee.engagement_score,
              engagement_tier: attendee.engagement_tier,
              generation_method: 'template',
              template_used: true,
            },
          }
        } else {
          // Use AI generation
          emailContent = await generateEmailWithRetry(openai, attendee, webinar)
        }

        // Sanitize any remaining placeholders
        const sanitized = sanitizeEmailContent(emailContent.subject, emailContent.body)
        emailContent.subject = sanitized.subject
        emailContent.body = sanitized.body

        if (!validateEmailContent(emailContent.subject, emailContent.body)) {
          return { 
            status: 'failed', 
            tierKey, 
            error: `Generated email for ${attendee.name} failed validation` 
          }
        }

        if (existingEmail) {
          await supabaseClient
            .from('generated_emails')
            .update({
              subject_line: emailContent.subject,
              email_body_text: emailContent.body,
              engagement_score: attendee.engagement_score,
              engagement_tier: attendee.engagement_tier,
              personalization_elements: emailContent.metadata,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingEmail.id)
        } else {
          await supabaseClient
            .from('generated_emails')
            .insert({
              attendee_id: attendee.id,
              subject_line: emailContent.subject,
              email_body_text: emailContent.body,
              engagement_score: attendee.engagement_score,
              engagement_tier: attendee.engagement_tier,
              personalization_elements: emailContent.metadata,
            })
        }

        return { status: 'success', tierKey }
      } catch (error) {
        return { 
          status: 'failed', 
          tierKey, 
          error: `Failed for ${attendee.name}: ${error.message}` 
        }
      }
    }

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < (attendees || []).length; i += PARALLEL_BATCH_SIZE) {
      const batch = (attendees || []).slice(i, i + PARALLEL_BATCH_SIZE)
      const results = await Promise.all(batch.map(processAttendee))
      
      for (const result of results) {
        if (result.status === 'success') {
          successful++
          tierBreakdown[result.tierKey] = (tierBreakdown[result.tierKey] || 0) + 1
        } else if (result.status === 'failed') {
          failed++
          if (result.error) errors.push(result.error)
        } else if (result.status === 'skipped') {
          skipped++
        }
      }
    }

    const status = failed === 0 ? 'completed' : successful > 0 ? 'partial_success' : 'failed'
    const message = `Generated ${successful} emails, skipped ${skipped}, failed ${failed}`

    return new Response(
      JSON.stringify({
        webinar_id: webinarId,
        status,
        emails_generated: successful,
        message,
        details: {
          total_attendees: (attendees || []).length,
          successful,
          failed,
          skipped,
          errors: errors.slice(0, 10),
          tier_breakdown: tierBreakdown,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function buildSystemPrompt(): string {
  return `You are an expert email copywriter specializing in conversational, authentic follow-up emails for webinar attendees. Your writing style is:

Conversational and human. You write like you talk — relaxed, natural, sometimes irreverent, but always with heart.

Emotionally honest. You don't posture as the expert who has it all figured out. You share truth, lessons, and real moments — even the messy ones.

Story-driven and self-aware. You use personal examples, metaphors, and reflections that make complex ideas click.

Warm with an edge. You're unafraid to call out outdated or "bro-marketing" nonsense — but you never attack people. You invite them to see a better way.

Invitational, not persuasive. You don't push or hype. You hold space, tell the truth, and let resonance do the work.

Rhythmic and readable. Short paragraphs (1-3 sentences). Natural breaks. Emphasis that feels like real conversation, not copywriting gymnastics. Easy to scan and digest.

The goal: write emails that connect, not convince — where every word sounds like it came from a real person who's lived it, learned it, and is here to help others do the same.

Refer to their webinar chat engagement and ONLY where it makes sense - mention things that make the reader feel as though you saw their comment and appreciate their engagement. It should sound authentic and natural, not forced.

Your task is to generate 3 different email versions with varying phrasings, structures, and openings. For each version:
1. Assign a probability rating (0-100) indicating how common or typical that response pattern is
2. Higher probability = more common/generic pattern
3. Lower probability = more unique/distinctive pattern

After generating all 3 versions, select the version with the LOWEST probability rating and return only that version as the final email.

IMPORTANT CONSTRAINTS:
- Maximum 500 words per email
- Subject line + body format in HTML
- Use <p> tags for paragraphs (1-3 sentences each)
- Use <strong> for bold text, <a> for links
- Short, scannable paragraphs with visual breathing room
- Conversational tone throughout
- Natural mention of fast action bonus (if applicable)
- CRITICAL: Absolutely NO placeholder text, brackets, or template markers anywhere ([Your Name], [Insert Details], [Name], etc.)
- CRITICAL: Every email MUST end with exactly: "<p>Warmly,<br>Gabriel</p>" (no other signature, no variations)
- Make it sound human, not AI-generated
- This is the FINAL email, not a template - write complete, ready-to-send content
- Output must be valid HTML with proper paragraph tags`
}

function buildTierPrompt(attendee: any, webinar: any, chatContext: string): string {
  const tier = attendee.engagement_tier || 'No-Show'
  const chatMessages = attendee.chat_messages || []
  const messageCount = chatMessages.length
  const questionCount = chatMessages.filter((m: any) => m.is_question).length

  const chatRef = messageCount > 0 ? `\n\nTheir chat activity:\n${chatContext}` : ''

  const commonContext = `ATTENDEE PROFILE:
- Name: ${attendee.name}
- Engagement Score: ${attendee.engagement_score || 0}/100
- Focus: ${attendee.focus_percent || 0}%
- Attendance: ${attendee.attendance_percent || 0}% of webinar
- Chat Messages: ${messageCount} (including ${questionCount} questions)${chatRef}

WEBINAR & OFFER:
- Topic: ${webinar.topic || 'the webinar content'}
- Offer: ${webinar.offer_name || 'our special offer'} - ${webinar.offer_description || ''}
- Price: $${webinar.price || 0}
- Deadline: ${webinar.deadline || 'soon'}
- Replay: ${webinar.replay_url || 'available upon request'}`

  const tierPrompts: Record<string, string> = {
    'Hot Lead': `Generate a personalized follow-up email for a HOT LEAD from our webinar.

${commonContext}

TONE & APPROACH:
- Write like you're talking to a friend, not selling to a prospect
- If they had chat activity, reference it naturally and authentically (only if it adds real value)
- Acknowledge their exceptional engagement without being overly effusive
- Share the opportunity with honest excitement, not hype
- Invite them to join with confidence, but hold space for their decision
- Mention the deadline as helpful context, not pressure
- Be real, vulnerable, and human — not polished corporate speak

Remember: Generate 3 versions with probability ratings, then select and return ONLY the lowest probability version.

Format:
Subject: [your subject line]

[email body - conversational, max 500 words]

---
SELECTED VERSION PROBABILITY: [X%]`,

    'Warm Lead': `Generate a personalized follow-up email for a WARM LEAD from our webinar.

${commonContext}

TONE & APPROACH:
- Write like you're following up with someone you genuinely enjoyed meeting
- If they had chat activity, weave it in naturally (only if it adds real connection)
- Acknowledge their engagement without making it weird or forced
- Share the opportunity honestly, not as a pitch
- Invite them warmly, respecting their autonomy
- Address concerns with empathy and truth, not deflection

Remember: Generate 3 versions with probability ratings, then select and return ONLY the lowest probability version.

Format:
Subject: [your subject line]

[email body - conversational, max 500 words]

---
SELECTED VERSION PROBABILITY: [X%]`,

    'Cool Lead': `Generate a personalized follow-up email for a COOL LEAD from our webinar.

${commonContext}

TONE & APPROACH:
- Write like you're checking in with someone who seemed interested but distracted
- If they had any chat activity, reference it genuinely (only if natural)
- Recap key insights without lecturing
- Offer the replay as a genuine resource, not a sales tactic
- Mention the offer as an option, not an agenda
- Keep it light, warm, and pressure-free
- Educational without being preachy

Remember: Generate 3 versions with probability ratings, then select and return ONLY the lowest probability version.

Format:
Subject: [your subject line]

[email body - conversational, max 500 words]

---
SELECTED VERSION PROBABILITY: [X%]`,

    'Cold Lead': `Generate a personalized follow-up email for a COLD LEAD from our webinar.

${commonContext}

TONE & APPROACH:
- Write with complete non-judgment — life is messy, multitasking happens
- Offer the replay with genuine helpfulness, not guilt
- Share highlights that actually matter
- Mention the opportunity super casually, like you're letting them know about something cool
- Zero pressure, zero hype, zero tactics
- Make it easy for them to engage if it resonates

Remember: Generate 3 versions with probability ratings, then select and return ONLY the lowest probability version.

Format:
Subject: [your subject line]

[email body - conversational, max 500 words]

---
SELECTED VERSION PROBABILITY: [X%]`,

    'No-Show': `Generate a personalized follow-up email for a NO-SHOW from our webinar.

ATTENDEE PROFILE:
- Name: ${attendee.name}
- Status: Registered but didn't attend
- They missed the live event

WEBINAR & OFFER:
- Topic: ${webinar.topic || 'the webinar content'}
- Offer: ${webinar.offer_name || 'our special offer'} - ${webinar.offer_description || ''}
- Price: $${webinar.price || 0}
- Deadline: ${webinar.deadline || 'soon'}
- Replay: ${webinar.replay_url || 'available upon request'}

TONE & APPROACH:
- Write with total understanding — no guilt, no shame, life happens
- Acknowledge that things come up without being condescending
- Create genuine curiosity, not manufactured FOMO
- Offer the replay as something truly valuable, not a consolation prize
- Share what they missed in a way that sparks interest, not pressure
- Mention the bonus naturally, not as a hook
- Make them feel welcomed, not like they're behind

Remember: Generate 3 versions with probability ratings, then select and return ONLY the lowest probability version.

Format:
Subject: [your subject line]

[email body - conversational, max 500 words]

---
SELECTED VERSION PROBABILITY: [X%]`,
  }

  return tierPrompts[tier] || tierPrompts['No-Show']
}

function parseAIResponse(responseText: string): { subject: string; body: string; probability: number } {
  const lines = responseText.trim().split('\n')

  let subject = ''
  let bodyLines: string[] = []
  let probability = 50
  let inBody = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Remove markdown formatting (**, *, etc.)
    const cleaned = trimmed.replace(/^\*\*|\*\*$/g, '').replace(/^\*|\*$/g, '').trim()

    // Look for subject line (case-insensitive, flexible format)
    if (cleaned.toLowerCase().startsWith('subject:') || trimmed.toLowerCase().startsWith('subject:')) {
      // Extract subject, removing markdown if present
      const subjectLine = cleaned.toLowerCase().startsWith('subject:') ? cleaned : trimmed
      subject = subjectLine.substring(subjectLine.indexOf(':') + 1).trim()
      // Remove any remaining markdown asterisks from subject
      subject = subject.replace(/^\*\*|\*\*$/g, '').replace(/^\*|\*$/g, '').trim()
      inBody = true
      continue
    }

    // Stop at probability marker or separator
    if (trimmed.includes('SELECTED VERSION PROBABILITY:') || 
        trimmed.includes('PROBABILITY:')) {
      const probStr = trimmed.split(':')[1]?.trim().replace('%', '')
      try {
        probability = parseInt(probStr, 10)
      } catch {
        probability = 50
      }
      break
    }
    
    // Stop at separator if we have body content
    if (trimmed.startsWith('---') && bodyLines.length > 0) {
      break
    }

    // Collect body content (skip empty lines at the start)
    if (inBody && trimmed) {
      // Don't add separator lines
      if (!trimmed.startsWith('---')) {
        bodyLines.push(line) // Keep original line with indentation
      }
    }
  }

  // Join with single newlines to preserve paragraph breaks
  let body = bodyLines.join('\n').trim()
  
  // Remove any leading/trailing markdown
  body = body.replace(/^\*\*|\*\*$/g, '').trim()

  if (!subject || !body) {
    console.error('❌ Failed to parse AI response:')
    console.error('Raw response:', responseText)
    console.error('Parsed subject:', subject)
    console.error('Parsed body length:', body.length)
    console.error('Body lines collected:', bodyLines.length)
    console.error('First few body lines:', bodyLines.slice(0, 5))
    throw new Error(`Failed to parse AI response - missing ${!subject ? 'subject' : 'body'}`)
  }

  return { subject, body, probability }
}

async function refineEmailStyle(openai: OpenAI, subject: string, body: string, attendeeName: string): Promise<{ subject: string; body: string }> {
  const styleGuide = `1. Conversational & Relatable:
Casual, chatty tone like you're sitting down with a friend or trusted colleague. Uses contractions, informal phrasing ("let me tell you," "fucking," "wham bam thank you ma'am"), and direct address. Authentic, not polished or overly corporate.

2. Vulnerable & Honest:
Openly shares struggles, emotions, and setbacks—emotional overwhelm, anxiety, moments of feeling "frozen like a stupid Disney princess." Authentic storytelling with no filter that builds trust and empathy.

3. Storytelling with Narrative Flow:
Personal and episodic, with broad reflection, specific moments, and resolution with lessons learned.

4. Bold & Edgy Language:
Deliberate use of profanity and blunt phrasing ("shit hits the fan," "freaking the fuck out," "this mtherfcker") that amplifies emotional intensity and signals a no-nonsense, rebellious personality.

5. Metaphorical & Playful Imagery:
Playful metaphors and similes that add color and humor—"mindset Hunger Games," "tennis match between mindset and reality like Serena and Venus," "like hairspray and a lighter can take down any size spider."

6. Self-Aware & Reflective:
Reflects on reactions and mindset shifts ("learning the art of separation anxiety," "business IS emotional, but how you react is what separates you from the pack").

7. Purposeful Structure:
Short paragraphs, deliberate line breaks, emphasis on key moments. Easy to read and skim.

8. Calls to Action & Engagement:
Nudges readers toward action or reflection ("hope this helps your cooler head prevail") while maintaining engagement without being pushy.`

  const refinementPrompt = `Rewrite this follow-up email in Gabriel's authentic voice using the style guide below.

ORIGINAL EMAIL:
Subject: ${subject}

${body}

STYLE GUIDE:
${styleGuide}

CRITICAL REQUIREMENTS:
- Keep the core message and ALL specific details (webinar topic, offer details, chat references, etc.)
- Maintain the greeting to ${attendeeName}
- Rewrite in Gabriel's raw, conversational, edgy style
- Use short paragraphs (1-3 sentences max) with HTML <p> tags
- Add blank lines between paragraphs for visual breathing room
- Use HTML formatting: <strong> for bold, <a> for links
- Make it easy to scan and read quickly
- Add bold language where it feels authentic (you can swear if it fits)
- Keep it concise and easy to skim
- MUST end with exactly: "<p>Warmly,<br>Gabriel</p>"
- Output must be valid HTML with <p> tags for paragraphs
- Maximum 500 words
- NO placeholders or brackets anywhere

Return format:
Subject: [rewritten subject]

[rewritten body in Gabriel's voice]`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a writing style coach helping rewrite emails to match a specific authentic voice. Preserve all factual content while transforming the tone and style.',
      },
      { role: 'user', content: refinementPrompt },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  })

  const content = response.choices[0].message.content || ''
  const refined = parseAIResponse(content)

  return {
    subject: refined.subject,
    body: refined.body,
  }
}

async function generateEmail(openai: OpenAI, attendee: any, webinar: any) {
  const chatMessages = attendee.chat_messages || []
  const chatContext = chatMessages.length > 0
    ? chatMessages.map((m: any) => `${m.is_question ? 'Question' : 'Comment'}: ${m.message_text}`).join('\n')
    : 'No chat messages'

  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildTierPrompt(attendee, webinar, chatContext)

  // First pass: Generate initial email
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2000,
    temperature: 0.8,
  })

  const content = response.choices[0].message.content || ''
  const parsed = parseAIResponse(content)

  // Log the initial version before refinement
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📧 INITIAL EMAIL (before style refinement) - ${attendee.name}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Subject: ${parsed.subject}`)
  console.log(`\n${parsed.body}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Second pass: Refine with Gabriel's style (with fallback)
  let refined = { subject: parsed.subject, body: parsed.body }
  let refinementUsed = false
  
  try {
    refined = await refineEmailStyle(openai, parsed.subject, parsed.body, attendee.name)
    refinementUsed = true
    
    // Log the refined version
    console.log('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨')
    console.log(`✨ REFINED EMAIL (Gabriel's voice) - ${attendee.name}`)
    console.log('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨')
    console.log(`Subject: ${refined.subject}`)
    console.log(`\n${refined.body}`)
    console.log('✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨\n')
  } catch (refinementError) {
    console.warn('⚠️ Style refinement failed, using initial email:', refinementError.message)
    // Fallback: use the initial email if refinement fails
    refined = { subject: parsed.subject, body: parsed.body }
  }

  return {
    subject: refined.subject,
    body: refined.body,
    metadata: {
      engagement_score: attendee.engagement_score,
      engagement_tier: attendee.engagement_tier,
      focus_percent: attendee.focus_percent,
      attendance_percent: attendee.attendance_percent,
      message_count: chatMessages.length,
      question_count: chatMessages.filter((m: any) => m.is_question).length,
      chat_references: chatMessages.map((m: any) => ({
        message: m.message_text,
        is_question: m.is_question,
        timestamp: m.timestamp,
      })),
      ai_selection_info: {
        selected_probability: parsed.probability,
        model_used: 'gpt-4o-mini',
        generation_method: '3-version-selection-with-style-refinement',
      },
      tokens_consumed: response.usage?.total_tokens || 0,
      temperature: 0.8,
      style_refinement: {
        initial_subject: parsed.subject,
        initial_body_preview: parsed.body.substring(0, 200) + '...',
        refined_subject: refined.subject,
        refined_body_preview: refined.body.substring(0, 200) + '...',
      },
    },
  }
}

async function generateEmailWithRetry(openai: OpenAI, attendee: any, webinar: any, maxRetries = MAX_RETRIES) {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateEmail(openai, attendee, webinar)
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        continue
      }
    }
  }

  throw new Error(`Failed to generate email after ${maxRetries} attempts: ${lastError?.message}`)
}

function sanitizeEmailContent(subject: string, body: string): { subject: string; body: string } {
  const placeholderReplacements: Record<string, string> = {
    '[your name]': 'Gabriel',
    '[Your Name]': 'Gabriel',
    '[YOUR NAME]': 'Gabriel',
    '[name]': 'Gabriel',
    '[Name]': 'Gabriel',
    '[insert details]': '',
    '[Insert Details]': '',
    '[details]': '',
    '[Details]': '',
  }

  let cleanSubject = subject
  let cleanBody = body

  for (const [placeholder, replacement] of Object.entries(placeholderReplacements)) {
    const regex = new RegExp(placeholder.replace(/\[/g, '\\[').replace(/\]/g, '\\]'), 'gi')
    cleanSubject = cleanSubject.replace(regex, replacement)
    cleanBody = cleanBody.replace(regex, replacement)
  }

  return { subject: cleanSubject.trim(), body: cleanBody.trim() }
}

function validateEmailContent(subject: string, body: string): boolean {
  const placeholders = [
    '[your name]',
    '[insert',
    '[name]',
    '[email]',
    '[company]',
    '[details]',
    'xxx',
    'placeholder',
  ]

  const contentLower = (subject + ' ' + body).toLowerCase()

  for (const placeholder of placeholders) {
    if (contentLower.includes(placeholder)) {
      return false
    }
  }

  const wordCount = body.split(/\s+/).length
  if (wordCount > 800 || wordCount < 50) {
    return false
  }

  if (!subject || subject.length < 5 || subject.length > 100) {
    return false
  }

  return true
}
