import { createClient } from 'npm:@supabase/supabase-js@2.39.7'
import OpenAI from 'npm:openai@4.28.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      })
    }
    console.log('Edge function called:', req.method, req.url)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasOpenAIKey: !!openaiKey,
    })

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured')
    }

    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API key not configured',
          message: 'The OPENAI_API_KEY environment variable is not set in Supabase Edge Functions. Please configure it in your Supabase project settings under Edge Functions > Secrets.',
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

    console.log('Request params:', { webinarId, regenerate, tier })

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

    for (const attendee of attendees || []) {
      const tierKey = attendee.engagement_tier || 'Unknown'
      tierBreakdown[tierKey] = (tierBreakdown[tierKey] || 0)

      try {
        const { data: existingEmail } = await supabaseClient
          .from('generated_emails')
          .select('*')
          .eq('attendee_id', attendee.id)
          .maybeSingle()

        if (existingEmail && !regenerate) {
          skipped++
          continue
        }

        const emailContent = await generateEmail(openai, attendee, webinar)

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

        successful++
        tierBreakdown[tierKey] = (tierBreakdown[tierKey] || 0) + 1
      } catch (error) {
        failed++
        errors.push(`Failed for ${attendee.name}: ${error.message}`)
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

async function generateEmail(openai: OpenAI, attendee: any, webinar: any) {
  const chatMessages = attendee.chat_messages || []
  const chatContext = chatMessages.length > 0
    ? chatMessages.map((m: any) => `${m.is_question ? 'Question' : 'Comment'}: ${m.message_text}`).join('\n')
    : 'No chat messages'

  const tierPrompts: Record<string, string> = {
    'Hot Lead': `Generate a personalized follow-up email for a HOT LEAD who was highly engaged. Score: ${attendee.engagement_score}/100. Focus: ${attendee.focus_percent}%. Messages: ${chatMessages.length}.\n\nChat activity:\n${chatContext}\n\nOffer: ${webinar.offer_name} - ${webinar.offer_description || ''} ($${webinar.price || 0})\nDeadline: ${webinar.deadline || 'soon'}\n\nTone: Write like you're talking to a friend, not selling to a prospect. If they had chat activity, reference it naturally and authentically (only if it adds real value). Acknowledge their exceptional engagement without being overly effusive. Share the opportunity with honest excitement, not hype. Invite them to join with confidence, but hold space for their decision. Mention the deadline as helpful context, not pressure. Be real, vulnerable, and human \u2014 not polished corporate speak. Max 500 words.`,
    'Warm Lead': `Generate a personalized follow-up email for a WARM LEAD with good engagement. Score: ${attendee.engagement_score}/100. Focus: ${attendee.focus_percent}%. Messages: ${chatMessages.length}.\n\nChat activity:\n${chatContext}\n\nOffer: ${webinar.offer_name} - ${webinar.offer_description || ''} ($${webinar.price || 0})\nDeadline: ${webinar.deadline || 'soon'}\n\nTone: Write like you're following up with someone you genuinely enjoyed meeting. If they had chat activity, weave it in naturally (only if it adds real connection). Acknowledge their engagement without making it weird or forced. Share the opportunity honestly, not as a pitch. Invite them warmly, respecting their autonomy. Address concerns with empathy and truth, not deflection. Max 500 words.`,
    'Cool Lead': `Generate a personalized follow-up email for a COOL LEAD with moderate engagement. Score: ${attendee.engagement_score}/100. Focus: ${attendee.focus_percent}%. Messages: ${chatMessages.length}.\n\nChat activity:\n${chatContext}\n\nOffer: ${webinar.offer_name} - ${webinar.offer_description || ''} ($${webinar.price || 0})\nReplay: ${webinar.replay_url || 'available'}\nDeadline: ${webinar.deadline || 'soon'}\n\nTone: Write like you're checking in with someone who seemed interested but distracted. If they had any chat activity, reference it genuinely (only if natural). Recap key insights without lecturing. Offer the replay as a genuine resource, not a sales tactic. Mention the offer as an option, not an agenda. Keep it light, warm, and pressure-free. Educational without being preachy. Max 500 words.`,
    'Cold Lead': `Generate a personalized follow-up email for a COLD LEAD with limited engagement. Score: ${attendee.engagement_score}/100. Focus: ${attendee.focus_percent}%.\n\nOffer: ${webinar.offer_name} - ${webinar.offer_description || ''} ($${webinar.price || 0})\nReplay: ${webinar.replay_url || 'available'}\n\nTone: Write with complete non-judgment \u2014 life is messy, multitasking happens. Offer the replay with genuine helpfulness, not guilt. Share highlights that actually matter. Mention the opportunity super casually, like you're letting them know about something cool. Zero pressure, zero hype, zero tactics. Make it easy for them to engage if it resonates. Max 500 words.`,
    'No-Show': `Generate a personalized follow-up email for a NO-SHOW registrant.\n\nOffer: ${webinar.offer_name} - ${webinar.offer_description || ''} ($${webinar.price || 0})\nReplay: ${webinar.replay_url || 'available'}\nDeadline: ${webinar.deadline || 'soon'}\n\nTone: Write with total understanding \u2014 no guilt, no shame, life happens. Acknowledge that things come up without being condescending. Create genuine curiosity, not manufactured FOMO. Offer the replay as something truly valuable, not a consolation prize. Share what they missed in a way that sparks interest, not pressure. Mention the bonus naturally, not as a hook. Make them feel welcomed, not like they're behind. Max 500 words.`,
  }

  const tier = attendee.engagement_tier || 'No-Show'
  const prompt = tierPrompts[tier] || tierPrompts['No-Show']

  const systemPrompt = `You are an expert email copywriter specializing in conversational, authentic follow-up emails for webinar attendees. Your writing style is:

Conversational and human. You write like you talk — relaxed, natural, sometimes irreverent, but always with heart.

Emotionally honest. You don't posture as the expert who has it all figured out. You share truth, lessons, and real moments — even the messy ones.

Story-driven and self-aware. You use personal examples, metaphors, and reflections that make complex ideas click.

Warm with an edge. You're unafraid to call out outdated or "bro-marketing" nonsense — but you never attack people. You invite them to see a better way.

Invitational, not persuasive. You don't push or hype. You hold space, tell the truth, and let resonance do the work.

Rhythmic and readable. Short lines. Natural breaks. Emphasis that feels like real conversation, not copywriting gymnastics.

The goal: write emails that connect, not convince — where every word sounds like it came from a real person who's lived it, learned it, and is here to help others do the same.

Refer to their webinar chat engagement and ONLY where it makes sense - mention things that make the reader feel as though you saw their comment and appreciate their engagement. It should sound authentic and natural, not forced.

Format:

Subject: [subject line]

[email body]

Avoid placeholders, corporate jargon, and salesy language. Sound human and friendly.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: 2000,
    temperature: 0.8,
  })

  const content = response.choices[0].message.content || ''
  const lines = content.split('\n')
  let subject = ''
  let body = ''
  let inBody = false

  for (const line of lines) {
    if (line.startsWith('Subject:')) {
      subject = line.replace('Subject:', '').trim()
      inBody = true
    } else if (inBody && line.trim()) {
      body += line + '\n\n'
    }
  }

  return {
    subject: subject || 'Following up from the webinar',
    body: body.trim(),
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
    },
  }
}