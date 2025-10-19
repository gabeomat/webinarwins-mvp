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

    // Get Gmail access token from Replit Connectors
    const hostname = Deno.env.get('CONNECTORS_HOSTNAME') || 'connectors.replit.com'
    const xReplitToken = Deno.env.get('REPL_IDENTITY')

    if (!xReplitToken) {
      return new Response(
        JSON.stringify({ error: 'Gmail integration not available' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const connectorResponse = await fetch(
      `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=google-mail`,
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    )

    const connectorData = await connectorResponse.json()
    const connectionSettings = connectorData.items?.[0]
    const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Gmail not connected' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send email via Gmail API
    const toEmail = emailData.attendees.email
    const subject = emailData.subject_line
    const body = emailData.email_body_text

    const emailLines = [
      `To: ${toEmail}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
      '',
      body
    ]
    
    const rawEmail = emailLines.join('\r\n')
    const encodedEmail = btoa(rawEmail).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const gmailResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedEmail
        })
      }
    )

    if (!gmailResponse.ok) {
      const error = await gmailResponse.text()
      throw new Error(`Gmail API error: ${error}`)
    }

    const gmailResult = await gmailResponse.json()

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
    }

    return new Response(
      JSON.stringify({
        success: true,
        message_id: gmailResult.id,
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
