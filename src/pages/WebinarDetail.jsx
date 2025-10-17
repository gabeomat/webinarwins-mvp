import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Alert from '../components/ui/Alert'

export default function WebinarDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [webinar, setWebinar] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchWebinarData()
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

  const exportToCSV = () => {
    const csvData = [
      ['Name', 'Email', 'Tier', 'Score', 'Focus %', 'Attendance %', 'Messages', 'Attended'],
      ...filteredAttendees.map(a => [
        a.name,
        a.email,
        a.engagement_tier,
        a.engagement_score.toFixed(2),
        a.focus_percent,
        a.attendance_percent,
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
    if (!confirm('Are you sure you want to delete this webinar? This will also delete all attendees and chat messages.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('webinars')
        .delete()
        .eq('id', id)

      if (error) throw error

      navigate('/dashboard')
    } catch (error) {
      console.error('Error deleting webinar:', error)
      alert('Failed to delete webinar')
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
            <div className="flex gap-2 flex-wrap">
              <Button variant="primary" onClick={() => navigate(`/webinar/${id}/emails`)}>
                📧 GENERATE EMAILS
              </Button>
              <Button variant="secondary" onClick={exportToCSV}>
                EXPORT CSV
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                DELETE
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                BACK
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
                      {attendee.engagement_score.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {attendee.focus_percent}%
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {attendee.attendance_percent}%
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
      </main>
    </div>
  )
}
