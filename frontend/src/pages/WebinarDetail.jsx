import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'
import RichTextEditor from '../components/ui/RichTextEditor'

export default function WebinarDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [webinar, setWebinar] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [filter, setFilter] = useState('all')
  const [emails, setEmails] = useState([])
  const [generatingEmails, setGeneratingEmails] = useState(false)
  const [emailFilter, setEmailFilter] = useState('all')
  const [editingEmail, setEditingEmail] = useState(null)
  const [editingRecipient, setEditingRecipient] = useState('')
  const [editingSubject, setEditingSubject] = useState('')
  const [editingBody, setEditingBody] = useState('')
  const [showEmailSection, setShowEmailSection] = useState(false)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [bulkSending, setBulkSending] = useState(false)

  useEffect(() => {
    fetchWebinarData()
    fetchEmails()
  }, [id])

  const fetchWebinarData = async () => {
    try {
      const { data: webinarData, error: webinarError } = await supabase
        .from('webinars')
        .select('*')
        .eq('id', id)
        .single()

      if (webinarError) throw webinarError

      const { data: attendeesData, error: attendeesError } = await supabase
        .from('attendees')
        .select(`
          *,
          chat_messages(count)
        `)
        .eq('webinar_id', id)
        .order('engagement_score', { ascending: false })

      if (attendeesError) throw attendeesError

      setWebinar(webinarData)
      setAttendees(attendeesData || [])
    } catch (error) {
      console.error('Error fetching webinar:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmails = async () => {
    try {
      const { data: emailsData, error: emailsError } = await supabase
        .from('generated_emails')
        .select(`
          *,
          attendees!inner(
            name,
            email,
            engagement_tier,
            engagement_score,
            webinar_id
          )
        `)
        .eq('attendees.webinar_id', id)
        .order('generated_at', { ascending: false })

      if (emailsError) throw emailsError
      setEmails(emailsData || [])
      if (emailsData && emailsData.length > 0) {
        setShowEmailSection(true)
      }
    } catch (error) {
      console.error('Error fetching emails:', error)
    }
  }

  const generateEmails = async (tier = null, regenerate = false) => {
    setGeneratingEmails(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      let url = `${supabaseUrl}/functions/v1/generate-emails?webinar_id=${id}`
      if (tier) url += `&tier=${encodeURIComponent(tier)}`
      if (regenerate) url += `&regenerate=true`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(180000), // 3 minute timeout
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(result.error || `Server error: ${response.status}`)
      }

      const result = await response.json()
      console.log('Email generation result:', result)
      
      const { emails_generated, details } = result
      
      if (details?.failed > 0) {
        console.error('Email generation errors:', details.errors)
      }
      
      const message = details?.skipped > 0 
        ? `✅ Generated ${emails_generated} new emails! (Skipped ${details.skipped} existing emails${details.failed > 0 ? `, ${details.failed} failed` : ''})`
        : details?.failed > 0
        ? `⚠️ Generated ${emails_generated} emails successfully, but ${details.failed} failed. Check console for details.`
        : `✅ Generated ${emails_generated} emails successfully!`
      
      alert(message)
      await fetchEmails()
      setShowEmailSection(true)
    } catch (error) {
      console.error('Error generating emails:', error)
      if (error.name === 'TimeoutError') {
        alert(`❌ Request timed out. Try generating for fewer attendees at once (e.g., just Hot or Warm leads).`)
      } else {
        alert(`❌ Error: ${error.message}`)
      }
    } finally {
      setGeneratingEmails(false)
    }
  }

  const saveEmail = async (emailId, updates) => {
    try {
      const { error } = await supabase
        .from('generated_emails')
        .update({
          ...updates,
          user_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', emailId)

      if (error) throw error
      await fetchEmails()
      setEditingEmail(null)
      alert('✅ Email updated successfully!')
    } catch (error) {
      console.error('Error saving email:', error)
      alert('❌ Failed to save email')
    }
  }

  const sendEmail = async (emailId, recipientName, overrideEmail = null, overrideSubject = null, overrideBody = null) => {
    // For confirmation, show override email if provided, otherwise show recipient name
    const confirmMessage = overrideEmail 
      ? `Send this email to ${overrideEmail}? (TEST MODE - won't mark as sent in database)`
      : `Send this email to ${recipientName}?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const requestBody = { email_id: emailId }
      
      // Add override parameters if provided
      if (overrideEmail) requestBody.override_email = overrideEmail
      if (overrideSubject) requestBody.override_subject = overrideSubject
      if (overrideBody) requestBody.override_body = overrideBody
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: requestBody
      })

      if (error) throw error

      const successMessage = data?.test_mode 
        ? `✅ TEST email sent to ${overrideEmail}! (Original email status unchanged)`
        : `✅ Email sent successfully!`
      
      alert(successMessage)
      await fetchEmails()
      setEditingEmail(null)
    } catch (error) {
      console.error('Error sending email:', error)
      alert(`❌ Failed to send email: ${error.message}`)
    }
  }

  const exportEmailsToCSV = () => {
    const filteredEmails = emailFilter === 'all'
      ? emails
      : emails.filter(e => e.attendees.engagement_tier === emailFilter)

    const csvData = [
      ['Name', 'Email', 'Tier', 'Subject', 'Body'],
      ...filteredEmails.map(e => [
        e.attendees.name,
        e.attendees.email,
        e.attendees.engagement_tier,
        e.subject_line,
        e.email_body_text.replace(/\n/g, ' '),
      ])
    ]

    const csv = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${webinar.title}-emails.csv`
    a.click()
  }

  const exportToCSV = () => {
    const csvData = [
      ['Name', 'Email', 'Tier', 'Score', 'Focus %', 'Attendance %', 'Messages', 'Attended'],
      ...filteredAttendees.map(a => [
        a.name,
        a.email,
        a.engagement_tier || 'No-Show',
        a.engagement_score ? a.engagement_score.toFixed(2) : '0',
        a.focus_percent || 0,
        a.attendance_percent || 0,
        a.chat_messages[0]?.count || 0,
        a.attended ? 'Yes' : 'No'
      ])
    ]

    const csv = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${webinar.title}-attendees.csv`
    a.click()
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${webinar.title}"? This will permanently delete all attendee data, chat messages, and generated emails.`)) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('webinars')
        .delete()
        .eq('id', id)

      if (error) throw error

      navigate('/dashboard')
    } catch (error) {
      console.error('Error deleting webinar:', error)
      alert('Failed to delete webinar. Please try again.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-yellow flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin h-16 w-16 border-4 border-brutal-black border-t-brutal-cyan rounded-full"></div>
          <p className="mt-4 font-black text-xl">LOADING...</p>
        </div>
      </div>
    )
  }

  if (!webinar) {
    return (
      <div className="min-h-screen bg-brutal-yellow flex items-center justify-center">
        <Alert type="error">Webinar not found</Alert>
      </div>
    )
  }

  const stats = {
    total: attendees.length,
    hot: attendees.filter(a => a.engagement_tier === 'Hot Lead').length,
    warm: attendees.filter(a => a.engagement_tier === 'Warm Lead').length,
    cool: attendees.filter(a => a.engagement_tier === 'Cool Lead').length,
    cold: attendees.filter(a => a.engagement_tier === 'Cold Lead').length,
    noShow: attendees.filter(a => a.engagement_tier === 'No-Show').length,
  }

  const filteredAttendees = filter === 'all'
    ? attendees
    : attendees.filter(a => a.engagement_tier === filter)

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Hot Lead': return 'bg-brutal-pink text-white'
      case 'Warm Lead': return 'bg-brutal-orange text-white'
      case 'Cool Lead': return 'bg-brutal-cyan text-brutal-black'
      case 'Cold Lead': return 'bg-gray-300 text-brutal-black'
      case 'No-Show': return 'bg-gray-500 text-white'
      default: return 'bg-white text-brutal-black'
    }
  }

  const replaceTemplateVariables = (template, attendee) => {
    const variables = {
      name: attendee.name || '',
      topic: webinar.topic || '',
      offer_name: webinar.offer_name || '',
      offer_description: webinar.offer_description || '',
      price: webinar.price ? `$${webinar.price}` : '',
      deadline: webinar.deadline || '',
      replay_url: webinar.replay_url || '',
    }

    let result = template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      result = result.replace(regex, value)
    }
    return result
  }

  const getTemplatePreview = () => {
    if (!webinar.no_show_template_subject || !webinar.no_show_template_body) {
      return null
    }

    const noShows = attendees.filter(a => a.engagement_tier === 'No-Show')
    if (noShows.length === 0) {
      return null
    }

    const sampleAttendee = noShows[0]
    return {
      attendee: sampleAttendee,
      subject: replaceTemplateVariables(webinar.no_show_template_subject, sampleAttendee),
      body: replaceTemplateVariables(webinar.no_show_template_body, sampleAttendee),
      totalNoShows: noShows.length,
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Please enter a valid email address')
      return
    }

    const preview = getTemplatePreview()
    if (!preview) return

    setSendingTest(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          override_email: testEmail,
          override_subject: preview.subject,
          override_body: preview.body,
          attendee_id: preview.attendee.id,
        },
      })

      if (error) throw error
      if (data.error) throw new Error(data.error)

      alert(`✅ Test email sent to ${testEmail}!`)
      setTestEmail('')
    } catch (error) {
      console.error('Error sending test email:', error)
      alert(`Failed to send test email: ${error.message}`)
    } finally {
      setSendingTest(false)
    }
  }

  const bulkSendNoShows = async () => {
    const preview = getTemplatePreview()
    if (!preview) return

    if (!confirm(`Send no-show emails to ${preview.totalNoShows} attendees? This will use your template and send via Resend.`)) {
      return
    }

    setBulkSending(true)
    try {
      const { data, error } = await supabase.functions.invoke('bulk-send-no-shows', {
        body: {
          webinar_id: id,
        },
      })

      if (error) throw error
      if (data.error) throw new Error(data.error)

      alert(`✅ Successfully sent ${data.sent} emails to no-shows!${data.failed > 0 ? ` (${data.failed} failed)` : ''}`)
      await fetchEmails()
    } catch (error) {
      console.error('Error bulk sending:', error)
      alert(`Failed to send emails: ${error.message}`)
    } finally {
      setBulkSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-brutal-yellow" style={{
      backgroundImage: `repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(0,0,0,.03) 10px,
        rgba(0,0,0,.03) 20px
      )`
    }}>
      <header className="bg-white border-b-brutal border-brutal-black shadow-brutal-lg mb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black uppercase mb-2">
                {webinar.title}
              </h1>
              {webinar.topic && (
                <p className="text-sm font-bold text-gray-600">{webinar.topic}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={exportToCSV}>
                EXPORT CSV
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                BACK
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting} loading={deleting}>
                DELETE
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white border-brutal border-brutal-black shadow-brutal p-4 text-center">
            <div className="text-3xl font-black">{stats.total}</div>
            <div className="text-xs font-bold uppercase mt-1">Total</div>
          </div>
          <div className="bg-brutal-pink text-white border-brutal border-brutal-black shadow-brutal p-4 text-center cursor-pointer hover:shadow-brutal-lg transition-all"
            onClick={() => setFilter(filter === 'Hot Lead' ? 'all' : 'Hot Lead')}>
            <div className="text-3xl font-black">{stats.hot}</div>
            <div className="text-xs font-bold uppercase mt-1">Hot Leads</div>
          </div>
          <div className="bg-brutal-orange text-white border-brutal border-brutal-black shadow-brutal p-4 text-center cursor-pointer hover:shadow-brutal-lg transition-all"
            onClick={() => setFilter(filter === 'Warm Lead' ? 'all' : 'Warm Lead')}>
            <div className="text-3xl font-black">{stats.warm}</div>
            <div className="text-xs font-bold uppercase mt-1">Warm Leads</div>
          </div>
          <div className="bg-brutal-cyan border-brutal border-brutal-black shadow-brutal p-4 text-center cursor-pointer hover:shadow-brutal-lg transition-all"
            onClick={() => setFilter(filter === 'Cool Lead' ? 'all' : 'Cool Lead')}>
            <div className="text-3xl font-black">{stats.cool}</div>
            <div className="text-xs font-bold uppercase mt-1">Cool Leads</div>
          </div>
          <div className="bg-gray-300 border-brutal border-brutal-black shadow-brutal p-4 text-center cursor-pointer hover:shadow-brutal-lg transition-all"
            onClick={() => setFilter(filter === 'Cold Lead' ? 'all' : 'Cold Lead')}>
            <div className="text-3xl font-black">{stats.cold}</div>
            <div className="text-xs font-bold uppercase mt-1">Cold Leads</div>
          </div>
          <div className="bg-gray-500 text-white border-brutal border-brutal-black shadow-brutal p-4 text-center cursor-pointer hover:shadow-brutal-lg transition-all"
            onClick={() => setFilter(filter === 'No-Show' ? 'all' : 'No-Show')}>
            <div className="text-3xl font-black">{stats.noShow}</div>
            <div className="text-xs font-bold uppercase mt-1">No-Shows</div>
          </div>
        </div>

        {filter !== 'all' && (
          <div className="mb-4">
            <Alert type="info">
              <div className="flex items-center justify-between">
                <span>Filtered by: <strong>{filter}</strong></span>
                <button onClick={() => setFilter('all')} className="font-black hover:underline">
                  CLEAR FILTER
                </button>
              </div>
            </Alert>
          </div>
        )}

        <div className="bg-white border-brutal border-brutal-black shadow-brutal overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brutal-black text-brutal-yellow">
                  <th className="px-4 py-3 text-left font-black uppercase text-sm">Name</th>
                  <th className="px-4 py-3 text-left font-black uppercase text-sm">Email</th>
                  <th className="px-4 py-3 text-center font-black uppercase text-sm">Tier</th>
                  <th className="px-4 py-3 text-center font-black uppercase text-sm">Score</th>
                  <th className="px-4 py-3 text-center font-black uppercase text-sm">Focus %</th>
                  <th className="px-4 py-3 text-center font-black uppercase text-sm">Attend %</th>
                  <th className="px-4 py-3 text-center font-black uppercase text-sm">Messages</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.map((attendee, index) => (
                  <tr
                    key={attendee.id}
                    className={`border-t-brutal border-brutal-black ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-brutal-yellow transition-colors`}
                  >
                    <td className="px-4 py-3 font-bold">{attendee.name}</td>
                    <td className="px-4 py-3 font-mono text-sm">{attendee.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-3 py-1 text-xs font-black ${getTierColor(attendee.engagement_tier)}`}>
                        {attendee.engagement_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-black text-lg">
                      {attendee.engagement_score ? attendee.engagement_score.toFixed(0) : 0}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {attendee.focus_percent || 0}%
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {attendee.attendance_percent || 0}%
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {attendee.chat_messages[0]?.count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredAttendees.length === 0 && (
          <div className="bg-white border-brutal border-brutal-black shadow-brutal p-12 text-center mt-8">
            <p className="font-black text-xl">NO ATTENDEES MATCH THIS FILTER</p>
          </div>
        )}

        {/* No-Show Template Preview & Bulk Send */}
        {getTemplatePreview() && (
          <div className="mt-12">
            <div className="bg-brutal-lime border-brutal border-brutal-black shadow-brutal p-6 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase">No-Show Email Template</h2>
                  <p className="text-sm font-bold mt-1">{getTemplatePreview().totalNoShows} no-shows ready to contact</p>
                </div>
                <Button
                  onClick={() => setShowTemplatePreview(!showTemplatePreview)}
                  variant="outline"
                >
                  {showTemplatePreview ? 'HIDE' : 'PREVIEW'} TEMPLATE
                </Button>
              </div>

              {showTemplatePreview && (
                <>
                  <div className="border-t-brutal border-brutal-black pt-4 mb-4">
                    <div className="bg-white border-brutal border-brutal-black p-4 mb-4">
                      <p className="text-xs text-gray-600 mb-3">
                        <strong>Preview using:</strong> {getTemplatePreview().attendee.name} ({getTemplatePreview().attendee.email})
                      </p>
                      <div className="mb-4">
                        <label className="block text-xs font-black uppercase text-gray-700 mb-1">Subject Line:</label>
                        <div className="bg-gray-50 border border-gray-300 p-3 font-bold">
                          {getTemplatePreview().subject}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase text-gray-700 mb-1">Email Body:</label>
                        <div 
                          className="bg-gray-50 border border-gray-300 p-3 text-sm email-content"
                          dangerouslySetInnerHTML={{ __html: getTemplatePreview().body }}
                        />
                      </div>
                    </div>

                    {/* Test Email Section */}
                    <div className="bg-brutal-cyan/20 border-brutal border-brutal-black p-4 mb-4">
                      <h3 className="font-black text-sm uppercase mb-3">📧 Send Test Email</h3>
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="email"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="flex-1 min-w-[200px] px-4 py-2 border-brutal border-brutal-black bg-white font-bold focus:outline-none focus:ring-2 focus:ring-brutal-cyan"
                        />
                        <Button
                          onClick={sendTestEmail}
                          disabled={sendingTest || !testEmail}
                          loading={sendingTest}
                          variant="secondary"
                        >
                          SEND TEST
                        </Button>
                      </div>
                      <p className="text-xs text-gray-700 mt-2">
                        Send this preview email to yourself to see exactly what it looks like
                      </p>
                    </div>

                    {/* Bulk Send Section */}
                    <div className="bg-brutal-pink/20 border-brutal border-brutal-black p-4">
                      <h3 className="font-black text-sm uppercase mb-3">🚀 Bulk Send to All No-Shows</h3>
                      <Button
                        onClick={bulkSendNoShows}
                        disabled={bulkSending}
                        loading={bulkSending}
                        size="lg"
                      >
                        SEND TO ALL {getTemplatePreview().totalNoShows} NO-SHOWS
                      </Button>
                      <p className="text-xs text-gray-700 mt-2">
                        ✨ Instant generation + sending via Resend. No AI cost, no database clutter!
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Email Generation Section */}
        <div className="mt-12">
          <div className="bg-white border-brutal border-brutal-black shadow-brutal p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <h2 className="text-2xl font-black uppercase">AI-Generated Follow-Up Emails</h2>
              <Button
                onClick={() => setShowEmailSection(!showEmailSection)}
                variant="outline"
              >
                {showEmailSection ? 'HIDE' : 'SHOW'} EMAILS
              </Button>
            </div>

            {showEmailSection && (
              <>
                <div className="border-t-brutal border-brutal-black pt-4 mb-4">
                  <p className="text-sm font-bold mb-4">Generate personalized follow-up emails for attendees:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => generateEmails()}
                      disabled={generatingEmails}
                      loading={generatingEmails}
                    >
                      GENERATE FOR ALL
                    </Button>
                    <Button
                      onClick={() => generateEmails('Hot Lead')}
                      disabled={generatingEmails}
                      variant="secondary"
                    >
                      HOT LEADS
                    </Button>
                    <Button
                      onClick={() => generateEmails('Warm Lead')}
                      disabled={generatingEmails}
                      variant="secondary"
                    >
                      WARM LEADS
                    </Button>
                    <Button
                      onClick={() => generateEmails('Cool Lead')}
                      disabled={generatingEmails}
                      variant="secondary"
                    >
                      COOL LEADS
                    </Button>
                    <Button
                      onClick={() => generateEmails('Cold Lead')}
                      disabled={generatingEmails}
                      variant="secondary"
                    >
                      COLD LEADS
                    </Button>
                    <Button
                      onClick={() => generateEmails('No-Show')}
                      disabled={generatingEmails}
                      variant="secondary"
                    >
                      NO-SHOWS
                    </Button>
                  </div>
                  {emails.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-brutal-black/20">
                      <p className="text-xs text-gray-600 mb-2">Re-generate emails (replaces existing):</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => generateEmails(null, true)}
                          disabled={generatingEmails}
                          variant="outline"
                          className="text-xs"
                        >
                          🔄 REGENERATE ALL
                        </Button>
                        <Button
                          onClick={() => generateEmails('Hot Lead', true)}
                          disabled={generatingEmails}
                          variant="outline"
                          className="text-xs"
                        >
                          🔄 REGENERATE HOT
                        </Button>
                        <Button
                          onClick={() => generateEmails('Warm Lead', true)}
                          disabled={generatingEmails}
                          variant="outline"
                          className="text-xs"
                        >
                          🔄 REGENERATE WARM
                        </Button>
                        <Button
                          onClick={() => generateEmails('Cool Lead', true)}
                          disabled={generatingEmails}
                          variant="outline"
                          className="text-xs"
                        >
                          🔄 REGENERATE COOL
                        </Button>
                        <Button
                          onClick={() => generateEmails('Cold Lead', true)}
                          disabled={generatingEmails}
                          variant="outline"
                          className="text-xs"
                        >
                          🔄 REGENERATE COLD
                        </Button>
                        <Button
                          onClick={() => generateEmails('No-Show', true)}
                          disabled={generatingEmails}
                          variant="outline"
                          className="text-xs"
                        >
                          🔄 REGENERATE NO-SHOWS
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {emails.length > 0 && (
                  <>
                    <div className="border-t-brutal border-brutal-black pt-4 mb-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setEmailFilter('all')}
                            className={`px-3 py-1 text-xs font-black border-brutal border-brutal-black ${
                              emailFilter === 'all' ? 'bg-brutal-black text-white' : 'bg-white'
                            }`}
                          >
                            ALL ({emails.length})
                          </button>
                          {['Hot Lead', 'Warm Lead', 'Cool Lead', 'Cold Lead', 'No-Show'].map((tier) => {
                            const count = emails.filter(e => e.attendees.engagement_tier === tier).length
                            if (count === 0) return null
                            return (
                              <button
                                key={tier}
                                onClick={() => setEmailFilter(tier)}
                                className={`px-3 py-1 text-xs font-black border-brutal border-brutal-black ${
                                  emailFilter === tier ? getTierColor(tier) : 'bg-white'
                                }`}
                              >
                                {tier.toUpperCase()} ({count})
                              </button>
                            )
                          })}
                        </div>
                        <Button onClick={exportEmailsToCSV} variant="secondary" size="sm">
                          EXPORT EMAILS CSV
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {emails
                        .filter(e => emailFilter === 'all' || e.attendees.engagement_tier === emailFilter)
                        .map((email) => (
                          <div
                            key={email.id}
                            className="border-brutal border-brutal-black bg-gray-50 p-4"
                          >
                            {editingEmail === email.id ? (
                              <div>
                                <div className="mb-3">
                                  <label className="block text-xs font-black mb-1">
                                    RECIPIENT EMAIL: 
                                    <span className="ml-2 text-xs font-normal text-gray-600">(Change to your email for testing)</span>
                                  </label>
                                  <input
                                    type="email"
                                    value={editingRecipient}
                                    onChange={(e) => setEditingRecipient(e.target.value)}
                                    className="w-full border-brutal border-brutal-black p-2 font-mono text-sm"
                                    placeholder="test@example.com"
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="block text-xs font-black mb-1">SUBJECT:</label>
                                  <input
                                    type="text"
                                    value={editingSubject}
                                    onChange={(e) => setEditingSubject(e.target.value)}
                                    className="w-full border-brutal border-brutal-black p-2 font-bold"
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="block text-xs font-black mb-1">BODY:</label>
                                  <RichTextEditor
                                    value={editingBody}
                                    onChange={setEditingBody}
                                    placeholder="Email body..."
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => {
                                      saveEmail(email.id, {
                                        subject_line: editingSubject,
                                        email_body_text: editingBody,
                                      })
                                    }}
                                    size="sm"
                                  >
                                    SAVE
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      sendEmail(email.id, email.attendees.name, editingRecipient, editingSubject, editingBody)
                                    }}
                                    size="sm"
                                    variant="secondary"
                                  >
                                    SEND NOW
                                  </Button>
                                  <Button
                                    onClick={() => setEditingEmail(null)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    CANCEL
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-black text-sm">{email.attendees.name}</span>
                                      <span className="text-xs font-mono text-gray-600">{email.attendees.email}</span>
                                      <span className={`px-2 py-1 text-xs font-black ${getTierColor(email.attendees.engagement_tier)}`}>
                                        {email.attendees.engagement_tier}
                                      </span>
                                      {email.user_edited && (
                                        <span className="px-2 py-1 text-xs font-black bg-brutal-cyan">EDITED</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {email.sent_status === 'sent' ? (
                                      <span className="px-3 py-1 text-xs font-black bg-green-200 border-brutal border-brutal-black">
                                        ✓ SENT {email.sent_at ? new Date(email.sent_at).toLocaleDateString() : ''}
                                      </span>
                                    ) : (
                                      <Button
                                        onClick={() => sendEmail(email.id, email.attendees.name)}
                                        size="sm"
                                      >
                                        SEND
                                      </Button>
                                    )}
                                    <Button
                                      onClick={() => {
                                        setEditingEmail(email.id)
                                        setEditingRecipient(email.attendees.email)
                                        setEditingSubject(email.subject_line)
                                        setEditingBody(email.email_body_text)
                                      }}
                                      variant="outline"
                                      size="sm"
                                    >
                                      EDIT
                                    </Button>
                                  </div>
                                </div>
                                <div className="mb-2">
                                  <span className="text-xs font-black text-gray-600">SUBJECT: </span>
                                  <span className="font-bold">{email.subject_line}</span>
                                </div>
                                <div className="bg-white border-brutal border-brutal-black p-3">
                                  <div 
                                    className="text-sm email-content"
                                    dangerouslySetInnerHTML={{ __html: email.email_body_text }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                    </div>
                  </>
                )}

                {emails.length === 0 && (
                  <Alert type="info">
                    No emails generated yet. Click a button above to generate personalized follow-up emails using AI.
                  </Alert>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
