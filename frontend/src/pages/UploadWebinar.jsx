import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Papa from 'papaparse'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Alert from '../components/ui/Alert'

export default function UploadWebinar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    offerName: '',
    offerDescription: '',
    price: '',
    deadline: '',
    replayUrl: '',
    noShowTemplateSubject: '',
    noShowTemplateBody: '',
  })
  const [attendanceFile, setAttendanceFile] = useState(null)
  const [chatFile, setChatFile] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (file && file.type === 'text/csv') {
      if (type === 'attendance') {
        setAttendanceFile(file)
      } else {
        setChatFile(file)
      }
      setError('')
    } else {
      setError('Please select a valid CSV file')
    }
  }

  const parsePercentage = (value) => {
    if (!value) return 0
    const cleaned = String(value).replace(/[^0-9.]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  const calculateEngagementScore = (attendee, messageCount, questionCount) => {
    const focusPercent = isNaN(attendee.focus_percent) ? 0 : attendee.focus_percent
    const attendancePercent = isNaN(attendee.attendance_percent) ? 0 : attendee.attendance_percent
    
    const focusScore = (focusPercent / 100) * 40
    const attendanceScore = (attendancePercent / 100) * 30

    let chatScore = 0
    if (messageCount >= 5) chatScore = 20
    else if (messageCount >= 3) chatScore = 14
    else if (messageCount >= 1) chatScore = 8

    let questionScore = 0
    if (questionCount >= 2) questionScore = 10
    else if (questionCount === 1) questionScore = 7

    return focusScore + attendanceScore + chatScore + questionScore
  }

  const getEngagementTier = (score) => {
    if (score >= 80) return 'Hot Lead'
    if (score >= 60) return 'Warm Lead'
    if (score >= 40) return 'Cool Lead'
    if (score > 0) return 'Cold Lead'
    return 'No-Show'
  }

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error)
      })
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.title) {
      setError('Webinar title is required')
      return
    }

    if (!attendanceFile || !chatFile) {
      setError('Both CSV files are required')
      return
    }

    setLoading(true)

    try {
      const attendanceData = await parseCSV(attendanceFile)
      const chatData = await parseCSV(chatFile)

      const { data: webinar, error: webinarError } = await supabase
        .from('webinars')
        .insert([{
          user_id: user.id,
          title: formData.title,
          topic: formData.topic || '',
          offer_name: formData.offerName || '',
          offer_description: formData.offerDescription || '',
          price: parseFloat(formData.price) || 0,
          deadline: formData.deadline || '',
          replay_url: formData.replayUrl || '',
          no_show_template_subject: formData.noShowTemplateSubject || null,
          no_show_template_body: formData.noShowTemplateBody || null,
        }])
        .select()
        .single()

      if (webinarError) throw webinarError

      const attendeeMap = new Map()

      for (const row of attendanceData) {
        const email = row.Email?.toLowerCase().trim()
        if (!email) continue

        const attendee = {
          webinar_id: webinar.id,
          name: row.Name || row['Full Name'] || 'Unknown',
          email: email,
          attended: row['Attended?']?.toUpperCase() === 'TRUE' || row.Attended?.toLowerCase() === 'yes' || row.Status?.toLowerCase() === 'attended',
          attendance_percent: parsePercentage(row['Attendance (%)'] || row['Attendance %'] || row['Attendance']),
          focus_percent: parsePercentage(row['Focus (%)'] || row['Focus %'] || row['Focus']),
          attendance_minutes: parsePercentage(row['Attendance (Minutes)'] || row['Minutes']),
          join_time: row['Join Timestamp'] || row['Join Time'] || null,
          exit_time: row['Exit Timestamp'] || row['Exit Time'] || null,
          location: row.Location || '',
        }

        attendeeMap.set(email, attendee)
      }

      const { data: insertedAttendees, error: attendeeError } = await supabase
        .from('attendees')
        .insert(Array.from(attendeeMap.values()))
        .select()

      if (attendeeError) throw attendeeError

      const emailToIdMap = new Map(
        insertedAttendees.map(a => [a.email.toLowerCase(), a.id])
      )

      const messageCounts = new Map()
      const questionCounts = new Map()
      const chatMessages = []

      for (const row of chatData) {
        const email = (row.Email || row.email)?.toLowerCase().trim()
        if (!email || !emailToIdMap.has(email)) continue

        const attendeeId = emailToIdMap.get(email)
        const message = row.Message || row.Chat || ''
        const isQuestion = message.includes('?')

        messageCounts.set(attendeeId, (messageCounts.get(attendeeId) || 0) + 1)
        if (isQuestion) {
          questionCounts.set(attendeeId, (questionCounts.get(attendeeId) || 0) + 1)
        }

        chatMessages.push({
          attendee_id: attendeeId,
          message_text: message,
          timestamp: (row.Timestamp || row['date & time']) ? new Date(row.Timestamp || row['date & time']) : new Date(),
          is_question: isQuestion,
        })
      }

      if (chatMessages.length > 0) {
        const { error: chatError } = await supabase
          .from('chat_messages')
          .insert(chatMessages)

        if (chatError) throw chatError
      }

      const attendeeUpdates = insertedAttendees.map(attendee => {
        const messageCount = messageCounts.get(attendee.id) || 0
        const questionCount = questionCounts.get(attendee.id) || 0
        const score = calculateEngagementScore(
          { focus_percent: attendee.focus_percent, attendance_percent: attendee.attendance_percent },
          messageCount,
          questionCount
        )
        const tier = getEngagementTier(score)

        return {
          id: attendee.id,
          engagement_score: score,
          engagement_tier: tier,
        }
      })

      for (const update of attendeeUpdates) {
        await supabase
          .from('attendees')
          .update({
            engagement_score: update.engagement_score,
            engagement_tier: update.engagement_tier,
          })
          .eq('id', update.id)
      }

      navigate(`/webinar/${webinar.id}`)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload and process data')
    } finally {
      setLoading(false)
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black uppercase">UPLOAD WEBINAR</h1>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              BACK
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-12">
        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="bg-white border-brutal border-brutal-black shadow-brutal p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <div className="bg-brutal-black text-brutal-yellow px-4 py-2 mb-4 inline-block">
                <h3 className="text-xl font-black uppercase">WEBINAR DETAILS</h3>
              </div>
              <div className="space-y-4">
                <Input
                  label="Webinar Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Building Custom GPTs for Your Business"
                  required
                />
                <div>
                  <label className="block text-sm font-black uppercase text-brutal-black mb-2">
                    Topic / Description
                  </label>
                  <textarea
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Brief description of what the webinar covered..."
                    className="w-full px-4 py-3 border-brutal border-brutal-black bg-white text-brutal-black font-bold placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-brutal-cyan"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="bg-brutal-black text-brutal-pink px-4 py-2 mb-4 inline-block">
                <h3 className="text-xl font-black uppercase">OFFER DETAILS</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Offer Name"
                  name="offerName"
                  value={formData.offerName}
                  onChange={handleInputChange}
                  placeholder="e.g., AI Evolution Lab"
                />
                <Input
                  label="Price ($)"
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="97.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-black uppercase text-brutal-black mb-2">
                  Offer Description
                </label>
                <textarea
                  name="offerDescription"
                  value={formData.offerDescription}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="What's included in the offer..."
                  className="w-full px-4 py-3 border-brutal border-brutal-black bg-white text-brutal-black font-bold placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-brutal-cyan"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  placeholder="e.g., 48 hours, 3 days"
                />
                <Input
                  label="Replay URL"
                  type="url"
                  name="replayUrl"
                  value={formData.replayUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <div className="bg-brutal-black text-brutal-lime px-4 py-2 mb-4 inline-block">
                <h3 className="text-xl font-black uppercase">NO-SHOW EMAIL TEMPLATE</h3>
              </div>
              <div className="bg-brutal-lime/10 border-brutal border-brutal-black p-4 mb-4">
                <p className="text-xs text-gray-700 mb-4">
                  <strong>💡 Skip AI for no-shows!</strong> Create a template that will be used for all no-show emails. 
                  No AI cost, instant generation. Variables you can use: <code className="bg-white px-1">{'{name}'}</code>, <code className="bg-white px-1">{'{topic}'}</code>, <code className="bg-white px-1">{'{offer_name}'}</code>, <code className="bg-white px-1">{'{replay_url}'}</code>
                </p>
              </div>
              <div className="space-y-4">
                <Input
                  label="Subject Line Template"
                  name="noShowTemplateSubject"
                  value={formData.noShowTemplateSubject}
                  onChange={handleInputChange}
                  placeholder="{name}, catch the replay + a special bonus (today only)"
                />
                <div>
                  <label className="block text-sm font-black uppercase text-brutal-black mb-2">
                    Email Body Template
                  </label>
                  <textarea
                    name="noShowTemplateBody"
                    value={formData.noShowTemplateBody}
                    onChange={handleInputChange}
                    rows={10}
                    placeholder={`Hey {name},\n\nI noticed you registered for the training today, "How to Build a Client-Facing GPT - The Right Way" but you weren't able to make it live.\n\nIf you're anything like me, your attention is being pulled in a million different directions so I totally get it. Thought you might appreciate the replay instead so you can watch at your convenience.\n\nI go into much more detail than the PDF guide you got, and I think what we cover in this is SUPER IMPORTANT when it comes to building custom GPTs that really feel like an extension of you, for your clients.\n\nYou can catch the replay HERE {replay_url}\n\nOh and I want to be sure you at least know about a special bonus if you decide to join us in our Skool community, Futureproof - The Evolution Lab **today only**... Access to the How to Build Your AI CMO (Chief Marketing Officer) trained on YOUR business intelligence bundle. This one alone has saved me sooooo much time in my own business so I'm sharing the instructions and the knowledge base docs with you.\n\nYou can check out Futureproof HERE: https://www.skool.com/futureproof-the-evolution-lab\n\nHere's to building the future ~\n\n~ G`}
                    className="w-full px-4 py-3 border-brutal border-brutal-black bg-white text-brutal-black font-bold placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-brutal-cyan font-mono text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Leave blank to use AI generation for no-shows (costs more, takes longer)
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-brutal-black text-brutal-cyan px-4 py-2 mb-4 inline-block">
                <h3 className="text-xl font-black uppercase">UPLOAD CSV FILES</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black uppercase text-brutal-black mb-2">
                    Attendance CSV <span className="text-brutal-pink">*</span>
                  </label>
                  <div className={`border-brutal border-brutal-black p-6 text-center transition-all ${
                    attendanceFile ? 'bg-brutal-lime' : 'bg-white'
                  }`}>
                    <div className="text-4xl mb-2">📊</div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileChange(e, 'attendance')}
                      className="hidden"
                      id="attendance-upload"
                      required
                    />
                    <label
                      htmlFor="attendance-upload"
                      className="cursor-pointer font-bold hover:underline"
                    >
                      {attendanceFile ? attendanceFile.name : 'CLICK TO UPLOAD'}
                    </label>
                    <p className="text-xs mt-2 text-gray-600">
                      Required: Name, Email, Attendance %, Focus %
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black uppercase text-brutal-black mb-2">
                    Chat CSV <span className="text-brutal-pink">*</span>
                  </label>
                  <div className={`border-brutal border-brutal-black p-6 text-center transition-all ${
                    chatFile ? 'bg-brutal-cyan' : 'bg-white'
                  }`}>
                    <div className="text-4xl mb-2">💬</div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileChange(e, 'chat')}
                      className="hidden"
                      id="chat-upload"
                      required
                    />
                    <label
                      htmlFor="chat-upload"
                      className="cursor-pointer font-bold hover:underline"
                    >
                      {chatFile ? chatFile.name : 'CLICK TO UPLOAD'}
                    </label>
                    <p className="text-xs mt-2 text-gray-600">
                      Required: Timestamp, Name, Email, Message
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                variant="primary"
                size="lg"
              >
                {loading ? 'ANALYZING DATA...' : 'UPLOAD & ANALYZE'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
