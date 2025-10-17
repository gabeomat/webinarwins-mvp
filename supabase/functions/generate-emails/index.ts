import { createClient } from 'npm:@supabase/supabase-js@2.39.7'
import OpenAI from 'npm:openai@4.28.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
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
      throw new Error('OpenAI API key not configured')
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
    'Hot Lead': `Generate a personalized follow-up email for a HOT LEAD who was highly engaged. Score: ${attendee.engagement_score}/100. Focus: ${attendee.focus_percent}%. Messages: ${chatMessages.length}.\n\nChat activity:\n${chatContext}\n\nOffer: ${webinar.offer_name} - ${webinar.offer_description || ''} ($${webinar.price || 0})\nDeadline: ${webinar.deadline || 'soon'}\n\nTone: Confident, enthusiastic, reference their engagement. Natural mention of fast action bonus. Max 500 words.`,
    'Warm Lead': `Generate a personalized follow-up email for a WARM LEAD with good engagement. Score: ${attendee.engagement_score}/100. Focus: ${attendee.focus_percent}%. Messages: ${chatMessages.length}.\n\nChat activity:\n${chatContext}\n\nOffer: ${webinar.offer_name} - ${webinar.offer_description || ''} ($${webinar.price || 0})\nDeadline: ${webinar.deadline || 'soon'}\n\nTone: Friendly, encouraging, acknowledge their participation. Gentle reminder about fast action bonus. Max 500 words.`,
    'Cool Lead': `Generate a personalized follow-up email for a COOL LEAD with moderate engagement. Score: ${attendee.engagement_score}/100. Focus: ${attendee.focus_percent}%. Messages: ${chatMessages.length}.\n\nChat activity:\n${chatContext}\n\nOffer: ${webinar.offer_name} - ${webinar.offer_description || ''} ($${webinar.price || 0})\nReplay: ${webinar.replay_url || 'available'}\nDeadline: ${webinar.deadline || 'soon'}\n\nTone: Warm, educational, provide replay, soft mention of offer and fast action bonus. Max 500 words.`,
    'Cold Lead': `Generate a personalized follow-up email for a COLD LEAD with limited engagement. Score: ${attendee.engagement_score}/100. Focus: ${attendee.focus_percent}%.\n\nOffer: ${webinar.offer_name} - ${webinar.offer_description || ''} ($${webinar.price || 0})\nReplay: ${webinar.replay_url || 'available'}\n\nTone: No judgment, offer replay with highlights, very soft mention of opportunity and fast action bonus. Max 500 words.`,
    'No-Show': `Generate a personalized follow-up email for a NO-SHOW registrant.\n\nOffer: ${webinar.offer_name} - ${webinar.offer_description || ''} ($${webinar.price || 0})\nReplay: ${webinar.replay_url || 'available'}\nDeadline: ${webinar.deadline || 'soon'}\n\nTone: Zero guilt, empathetic, create curiosity about what they missed, offer replay, natural FOMO, mention fast action bonus. Max 500 words.`,
  }

  const tier = attendee.engagement_tier || 'No-Show'
  const prompt = tierPrompts[tier] || tierPrompts['No-Show']

  const systemPrompt = `You are an expert email copywriter. Write conversational, authentic follow-up emails. Format:\n\nSubject: [subject line]\n\n[email body]\n\nAvoid placeholders, corporate jargon, and salesy language. Sound human and friendly.`

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
