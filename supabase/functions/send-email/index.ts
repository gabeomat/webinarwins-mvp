import { createClient } from 'npm:@supabase/supabase-js@2.39.7'

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey)
    
    const { email_id, attendee_id, override_email, override_subject, override_body } = await req.json()

    let emailData = null
    let attendeeData = null

    // If email_id provided, get from generated_emails table
    if (email_id) {
      const { data, error: emailError } = await supabaseClient
        .from('generated_emails')
        .select('*, attendees(email, name)')
        .eq('id', email_id)
        .single()

      if (emailError || !data) {
        return new Response(
          JSON.stringify({ error: 'Email not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      emailData = data

      // Check if already sent (skip check if using override email for testing)
      if (emailData.sent_status === 'sent' && !override_email) {
        return new Response(
          JSON.stringify({ error: 'Email already sent' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } 
    // If attendee_id provided (for template test emails)
    else if (attendee_id) {
      const { data, error: attendeeError } = await supabaseClient
        .from('attendees')
        .select('email, name')
        .eq('id', attendee_id)
        .single()

      if (attendeeError || !data) {
        return new Response(
          JSON.stringify({ error: 'Attendee not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      attendeeData = data
    } 
    else {
      return new Response(
        JSON.stringify({ error: 'email_id or attendee_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Resend API
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured. Please add RESEND_API_KEY to Edge Function secrets.',
          instructions: 'See EMAIL-SENDING-SETUP.md for setup instructions'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use override values if provided (for testing), otherwise use database values
    const toEmail = override_email || (emailData ? emailData.attendees.email : attendeeData.email)
    const subject = override_subject || (emailData ? emailData.subject_line : '')
    const body = override_body || (emailData ? emailData.email_body_text : '')

    // Validate required fields
    if (!toEmail || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required email fields (to, subject, or body)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: subject,
        html: body
      })
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      throw new Error(`Resend API error: ${error}`)
    }

    const resendResult = await resendResponse.json()

    // Update email status in database (only if not using override email for testing and email_id exists)
    if (!override_email && email_id) {
      const { error: updateError } = await supabaseClient
        .from('generated_emails')
        .update({
          sent_status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', email_id)

      if (updateError) {
        console.error('Failed to update email status:', updateError)
        throw new Error(`Database update failed: ${updateError.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message_id: resendResult.id,
        sent_to: toEmail,
        test_mode: !!override_email
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Send email error:', error)
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
