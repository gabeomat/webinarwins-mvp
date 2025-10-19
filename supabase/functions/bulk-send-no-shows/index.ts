import { createClient } from 'npm:@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    result = result.replace(regex, value)
  }
  return result
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

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const { webinar_id } = await req.json()

    if (!webinar_id) {
      return new Response(
        JSON.stringify({ error: 'webinar_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get webinar with template and verify ownership
    const { data: webinar, error: webinarError } = await supabaseClient
      .from('webinars')
      .select('*')
      .eq('id', webinar_id)
      .eq('user_id', user.id)
      .single()

    if (webinarError || !webinar) {
      return new Response(
        JSON.stringify({ error: 'Webinar not found or you do not have permission to access it' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if template exists
    if (!webinar.no_show_template_subject || !webinar.no_show_template_body) {
      return new Response(
        JSON.stringify({ error: 'No template configured for this webinar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all no-show attendees
    const { data: noShows, error: noShowsError } = await supabaseClient
      .from('attendees')
      .select('*')
      .eq('webinar_id', webinar_id)
      .eq('engagement_tier', 'No-Show')

    if (noShowsError) {
      throw noShowsError
    }

    if (!noShows || noShows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No no-show attendees found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured. Please add RESEND_API_KEY to Edge Function secrets.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Send emails to all no-shows
    for (const attendee of noShows) {
      try {
        const variables = {
          name: attendee.name || '',
          topic: webinar.topic || '',
          offer_name: webinar.offer_name || '',
          offer_description: webinar.offer_description || '',
          price: webinar.price ? `$${webinar.price}` : '',
          deadline: webinar.deadline || '',
          replay_url: webinar.replay_url || '',
        }

        const subject = replaceTemplateVariables(webinar.no_show_template_subject, variables)
        const body = replaceTemplateVariables(webinar.no_show_template_body, variables)

        // Send via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [attendee.email],
            subject: subject,
            text: body
          })
        })

        if (!resendResponse.ok) {
          const error = await resendResponse.text()
          throw new Error(`Resend API error: ${error}`)
        }

        // Store in database for tracking
        await supabaseClient
          .from('generated_emails')
          .insert({
            attendee_id: attendee.id,
            subject_line: subject,
            email_body_text: body,
            engagement_score: attendee.engagement_score,
            engagement_tier: attendee.engagement_tier,
            personalization_elements: {
              generation_method: 'template_bulk_send',
              template_used: true,
            },
            sent_status: 'sent',
            sent_at: new Date().toISOString(),
          })

        sent++
      } catch (error) {
        failed++
        errors.push(`Failed for ${attendee.name}: ${error.message}`)
        console.error(`Failed to send to ${attendee.email}:`, error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        total: noShows.length,
        errors: failed > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Bulk send error:', error)
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
