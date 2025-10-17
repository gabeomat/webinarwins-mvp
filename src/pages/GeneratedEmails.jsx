import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'

export default function GeneratedEmails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [webinar, setWebinar] = useState(null)
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState(null)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const { data: webinarData, error: webinarError } = await supabase
        .from('webinars')
        .select('*')
        .eq('id', id)
        .single()

      if (webinarError) throw webinarError
      setWebinar(webinarData)

      await fetchEmails()
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_emails')
        .select(`
          *,
          attendees!inner(
            name,
            email,
            webinar_id
          )
        `)
        .eq('attendees.webinar_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmails(data || [])
    } catch (error) {
      console.error('Error fetching emails:', error)
    }
  }

  const handleGenerateEmails = async (regenerate = false) => {
    if (!confirm(regenerate
      ? 'This will regenerate ALL emails. Continue?'
      : 'Generate personalized emails for all attendees?')) {
      return
    }

    setGenerating(true)
    setGenerationStatus(null)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-emails?webinar_id=${id}&regenerate=${regenerate}`

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        }
      })

      const result = await response.json()

      console.log('=== EDGE FUNCTION RESPONSE ===')
      console.log('Status Code:', response.status)
      console.log('Response:', result)
      console.log('============================')

      if (!response.ok) {
        if (result.error && result.error.includes('OpenAI API key')) {
          throw new Error('OpenAI API key not configured in Supabase Edge Functions. Please add OPENAI_API_KEY to your Supabase project settings.')
        }
        throw new Error(result.error || result.message || `Server error: ${response.status}`)
      }

      setGenerationStatus({
        ...result,
        status: result.status || 'completed'
      })

      console.log('=== EMAIL GENERATION RESULT ===')
      console.log('Status:', result.status)
      console.log('Message:', result.message)
      console.log('Details:', result.details)
      console.log('==============================')

      if (result.status === 'completed' || result.status === 'partial_success') {
        await fetchEmails()
      }
    } catch (error) {
      console.error('Error generating emails:', error)
      setGenerationStatus({
        status: 'error',
        message: 'Failed to generate emails: ' + error.message,
      })
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const setSelectedEmailWithLogging = (email) => {
    if (email) {
      console.log('=== EMAIL DIAGNOSTIC DATA ===')
      console.log('Full Email Object:', email)
      console.log('Personalization Elements:', email.personalization_elements)
      if (email.personalization_elements?.ai_selection_info) {
        console.log('AI Selection Info:', email.personalization_elements.ai_selection_info)
        console.log('Tokens Consumed:', email.personalization_elements.tokens_consumed)
        console.log('Model Used:', email.personalization_elements.ai_selection_info.model_used)
      } else {
        console.warn('⚠️ NO AI METADATA FOUND - OpenAI may not have been called!')
      }
      console.log('===========================')
    }
    setSelectedEmail(email)
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

  const filteredEmails = emails
    .filter(email => {
      if (filter !== 'all' && email.engagement_tier !== filter) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        return email.attendees.name.toLowerCase().includes(search) ||
               email.attendees.email.toLowerCase().includes(search)
      }
      return true
    })

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

  const stats = {
    total: emails.length,
    hot: emails.filter(e => e.engagement_tier === 'Hot Lead').length,
    warm: emails.filter(e => e.engagement_tier === 'Warm Lead').length,
    cool: emails.filter(e => e.engagement_tier === 'Cool Lead').length,
    cold: emails.filter(e => e.engagement_tier === 'Cold Lead').length,
    noShow: emails.filter(e => e.engagement_tier === 'No-Show').length,
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
                Generated Emails
              </h1>
              <p className="text-sm font-bold text-gray-600">{webinar?.title}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {emails.length === 0 ? (
                <Button
                  variant="primary"
                  onClick={() => handleGenerateEmails(false)}
                  disabled={generating}
                >
                  {generating ? 'GENERATING...' : 'GENERATE EMAILS'}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => handleGenerateEmails(true)}
                  disabled={generating}
                >
                  {generating ? 'REGENERATING...' : 'REGENERATE ALL'}
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate(`/webinar/${id}`)}>
                BACK TO WEBINAR
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-12">
        {generationStatus && (
          <div className="mb-6">
            <Alert type={generationStatus.status === 'completed' ? 'success' : generationStatus.status === 'error' ? 'error' : 'info'}>
              <div>
                <div className="font-black mb-2">{generationStatus.message}</div>
                {generationStatus.details && (
                  <div className="text-sm">
                    <div>Total: {generationStatus.details.total_attendees}</div>
                    <div>Successful: {generationStatus.details.successful}</div>
                    <div>Skipped: {generationStatus.details.skipped}</div>
                    <div>Failed: {generationStatus.details.failed}</div>
                  </div>
                )}
              </div>
            </Alert>
          </div>
        )}

        {emails.length === 0 && !generating ? (
          <div className="bg-white border-brutal border-brutal-black shadow-brutal p-12 text-center">
            <div className="text-6xl mb-4">✉️</div>
            <h3 className="text-2xl font-black mb-4">NO EMAILS GENERATED YET</h3>
            <p className="text-lg font-bold mb-6 text-gray-600">
              Click the button above to generate personalized follow-up emails for all attendees.
            </p>
          </div>
        ) : (
          <>
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

            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-brutal border-brutal-black font-bold focus:outline-none focus:ring-4 focus:ring-brutal-cyan"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className="bg-white border-brutal border-brutal-black shadow-brutal hover:shadow-brutal-lg transition-all cursor-pointer"
                  onClick={() => setSelectedEmailWithLogging(email)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-black uppercase mb-1">
                          {email.attendees.name}
                        </h3>
                        <p className="text-xs font-mono text-gray-600">{email.attendees.email}</p>
                      </div>
                      <span className={`inline-block px-2 py-1 text-xs font-black ${getTierColor(email.engagement_tier)}`}>
                        {email.engagement_tier}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm font-black mb-1">SUBJECT:</div>
                      <div className="text-sm font-bold text-gray-700 line-clamp-2">
                        {email.subject_line}
                      </div>
                    </div>

                    <div className="text-xs font-bold text-gray-500">
                      {email.engagement_score ? `Score: ${email.engagement_score}` : ''}
                    </div>
                  </div>

                  <div className="border-t-brutal border-brutal-black bg-brutal-yellow px-6 py-3">
                    <div className="font-black uppercase text-sm">
                      VIEW FULL EMAIL →
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredEmails.length === 0 && (
              <div className="bg-white border-brutal border-brutal-black shadow-brutal p-12 text-center mt-8">
                <p className="font-black text-xl">NO EMAILS MATCH YOUR FILTER</p>
              </div>
            )}
          </>
        )}
      </main>

      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedEmail(null)}>
          <div className="bg-white border-brutal border-brutal-black shadow-brutal-lg max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-brutal-black text-brutal-yellow px-6 py-4 flex items-center justify-between sticky top-0">
              <h2 className="text-xl font-black uppercase">EMAIL PREVIEW</h2>
              <button
                onClick={() => setSelectedEmail(null)}
                className="text-brutal-yellow hover:text-white font-black text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-bold text-gray-600">TO:</div>
                    <div className="font-black">{selectedEmail.attendees.name}</div>
                    <div className="text-sm font-mono text-gray-600">{selectedEmail.attendees.email}</div>
                  </div>
                  <span className={`inline-block px-3 py-2 text-sm font-black ${getTierColor(selectedEmail.engagement_tier)}`}>
                    {selectedEmail.engagement_tier}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm font-bold text-gray-600 mb-1">SUBJECT:</div>
                <div className="bg-gray-100 p-4 border-brutal border-brutal-black">
                  <div className="font-black text-lg">{selectedEmail.subject_line}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedEmail.subject_line)}
                  className="mt-2 text-sm font-bold text-brutal-cyan hover:underline"
                >
                  Copy Subject
                </button>
              </div>

              <div className="mb-6">
                <div className="text-sm font-bold text-gray-600 mb-1">EMAIL BODY:</div>
                <div className="bg-gray-50 p-6 border-brutal border-brutal-black whitespace-pre-wrap font-sans">
                  {selectedEmail.email_body_text}
                </div>
                <button
                  onClick={() => copyToClipboard(selectedEmail.email_body_text)}
                  className="mt-2 text-sm font-bold text-brutal-cyan hover:underline"
                >
                  Copy Body
                </button>
              </div>

              {selectedEmail.personalization_elements && (
                <div className="border-t-brutal border-brutal-black pt-6">
                  <div className="text-sm font-bold text-gray-600 mb-3">PERSONALIZATION DATA:</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-bold">Engagement Score:</span> {selectedEmail.personalization_elements.engagement_score}
                    </div>
                    <div>
                      <span className="font-bold">Focus:</span> {selectedEmail.personalization_elements.focus_percent}%
                    </div>
                    <div>
                      <span className="font-bold">Attendance:</span> {selectedEmail.personalization_elements.attendance_percent}%
                    </div>
                    <div>
                      <span className="font-bold">Messages:</span> {selectedEmail.personalization_elements.message_count}
                    </div>
                    {selectedEmail.personalization_elements.chat_references?.length > 0 && (
                      <div className="col-span-2">
                        <div className="font-bold mb-2">Chat References:</div>
                        <ul className="list-disc list-inside text-xs">
                          {selectedEmail.personalization_elements.chat_references.map((ref, idx) => (
                            <li key={idx} className="mb-1">
                              {ref.is_question ? '❓' : '💬'} {ref.message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedEmail.personalization_elements?.ai_selection_info && (
                <div className="border-t-brutal border-brutal-black pt-6 mt-6">
                  <div className="text-sm font-bold text-gray-600 mb-3">AI GENERATION DIAGNOSTICS:</div>
                  <div className="bg-brutal-yellow border-brutal border-brutal-black p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-bold">Tokens Consumed:</span>
                        <span className={`ml-2 ${selectedEmail.personalization_elements.tokens_consumed > 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {selectedEmail.personalization_elements.tokens_consumed || 0}
                          {selectedEmail.personalization_elements.tokens_consumed === 0 && ' ⚠️'}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold">Model:</span> {selectedEmail.personalization_elements.ai_selection_info.model_used}
                      </div>
                      <div>
                        <span className="font-bold">Probability:</span> {selectedEmail.personalization_elements.ai_selection_info.selected_probability}%
                      </div>
                      <div>
                        <span className="font-bold">Temperature:</span> {selectedEmail.personalization_elements.temperature}
                      </div>
                      <div className="col-span-2">
                        <span className="font-bold">Method:</span> {selectedEmail.personalization_elements.ai_selection_info.generation_method}
                      </div>
                    </div>
                    {selectedEmail.personalization_elements.tokens_consumed === 0 && (
                      <div className="mt-4 p-3 bg-red-100 border-2 border-red-600 text-red-900 font-bold text-xs">
                        ⚠️ WARNING: No tokens consumed! OpenAI API may not be configured or called.
                      </div>
                    )}
                    {selectedEmail.personalization_elements.tokens_consumed > 0 && (
                      <div className="mt-4 p-3 bg-green-100 border-2 border-green-600 text-green-900 font-bold text-xs">
                        ✓ OpenAI API is working! {selectedEmail.personalization_elements.tokens_consumed} tokens used.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!selectedEmail.personalization_elements?.ai_selection_info && (
                <div className="border-t-brutal border-brutal-black pt-6 mt-6">
                  <div className="bg-red-100 border-brutal border-red-600 p-4">
                    <div className="font-bold text-red-900 mb-2">⚠️ NO AI METADATA FOUND</div>
                    <div className="text-sm text-red-800">
                      This email may have been generated without OpenAI. Check Supabase Edge Function logs.
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => copyToClipboard(`Subject: ${selectedEmail.subject_line}\n\n${selectedEmail.email_body_text}`)}
                  className="flex-1"
                >
                  COPY FULL EMAIL
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedEmail(null)}
                  className="flex-1"
                >
                  CLOSE
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
