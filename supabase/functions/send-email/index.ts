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
    
    const { email_id } = await req.json()

    if (!email_id) {
      return new Response(
        JSON.stringify({ error: 'email_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the email from database
    const { data: emailData, error: emailError } = await supabaseClient
      .from('generated_emails')
      .select('*, attendees(email, name)')
      .eq('id', email_id)
      .single()

    if (emailError || !emailData) {
      return new Response(
        JSON.stringify({ error: 'Email not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already sent
    if (emailData.sent_status === 'sent') {
      return new Response(
        JSON.stringify({ error: 'Email already sent' }),
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

    const toEmail = emailData.attendees.email
    const subject = emailData.subject_line
    const body = emailData.email_body_text

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
        text: body
      })
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      throw new Error(`Resend API error: ${error}`)
    }

    const resendResult = await resendResponse.json()

    // Update email status in database
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

    return new Response(
      JSON.stringify({
        success: true,
        message_id: resendResult.id,
        sent_to: toEmail
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
