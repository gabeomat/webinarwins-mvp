import { google } from 'googleapis'

let connectionSettings = null

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token
  }
  
  const hostname = import.meta.env.VITE_REPLIT_CONNECTORS_HOSTNAME || 'connectors.replit.com'
  const xReplitToken = import.meta.env.VITE_REPL_IDENTITY 
    ? 'repl ' + import.meta.env.VITE_REPL_IDENTITY 
    : import.meta.env.VITE_WEB_REPL_RENEWAL 
    ? 'depl ' + import.meta.env.VITE_WEB_REPL_RENEWAL 
    : null

  if (!xReplitToken) {
    throw new Error('Gmail connection not available. Please check your environment.')
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  )
  
  const data = await response.json()
  connectionSettings = data.items?.[0]

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected')
  }
  
  return accessToken
}

async function getGmailClient() {
  const accessToken = await getAccessToken()

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({
    access_token: accessToken
  })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

function createEmailMessage(to, subject, body) {
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    body
  ]
  
  const email = emailLines.join('\r\n')
  const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  
  return encodedEmail
}

export async function sendEmail({ to, subject, body }) {
  try {
    const gmail = await getGmailClient()
    const encodedMessage = createEmailMessage(to, subject, body)
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    })
    
    return {
      success: true,
      messageId: result.data.id
    }
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}
