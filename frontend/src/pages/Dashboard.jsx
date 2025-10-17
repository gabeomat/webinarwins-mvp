import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [webinars, setWebinars] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchWebinars()
  }, [])

  const fetchWebinars = async () => {
    try {
      const { data, error } = await supabase
        .from('webinars')
        .select('*, attendees(count)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setWebinars(data || [])
    } catch (error) {
      console.error('Error fetching webinars:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e, webinarId, webinarTitle) => {
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to delete "${webinarTitle}"? This will permanently delete all attendee data, chat messages, and generated emails.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('webinars')
        .delete()
        .eq('id', webinarId)

      if (error) throw error

      setWebinars(webinars.filter(w => w.id !== webinarId))
    } catch (error) {
      console.error('Error deleting webinar:', error)
      alert('Failed to delete webinar. Please try again.')
    }
  }

  const handleSignOut = async () => {
    await signOut()
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
      <header className="bg-white border-b-brutal border-brutal-black shadow-brutal-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-brutal-black uppercase" style={{ fontFamily: 'monospace' }}>
                WebinarWins
              </h1>
              <p className="text-sm font-bold mt-1">Welcome back, {user?.email}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => navigate('/upload')}
              >
                + NEW WEBINAR
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
              >
                SIGN OUT
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="bg-brutal-black text-brutal-yellow px-6 py-3 inline-block border-brutal border-brutal-black shadow-brutal">
            <h2 className="text-2xl font-black uppercase">YOUR WEBINARS</h2>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border-brutal border-brutal-black shadow-brutal p-12 text-center">
            <div className="inline-block animate-spin h-12 w-12 border-4 border-brutal-black border-t-brutal-cyan rounded-full"></div>
            <p className="mt-4 font-bold">LOADING...</p>
          </div>
        ) : webinars.length === 0 ? (
          <div className="bg-white border-brutal border-brutal-black shadow-brutal p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-black mb-4">NO WEBINARS YET</h3>
            <p className="text-lg font-bold mb-6 text-gray-600">
              Upload your first webinar to get started!
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/upload')}
            >
              UPLOAD WEBINAR DATA
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {webinars.map((webinar) => (
              <div
                key={webinar.id}
                className="bg-white border-brutal border-brutal-black shadow-brutal hover:shadow-brutal-lg transition-all cursor-pointer"
                onClick={() => navigate(`/webinar/${webinar.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-black uppercase flex-1">
                      {webinar.title}
                    </h3>
                    <div className="bg-brutal-cyan px-3 py-1 text-xs font-black ml-2">
                      {webinar.attendees?.[0]?.count || 0} ATTENDEES
                    </div>
                  </div>

                  {webinar.topic && (
                    <p className="text-sm font-bold text-gray-600 mb-4">
                      {webinar.topic}
                    </p>
                  )}

                  {webinar.offer_name && (
                    <div className="bg-brutal-pink text-white px-3 py-2 text-sm font-bold mb-4">
                      OFFER: {webinar.offer_name} ${webinar.price}
                    </div>
                  )}

                  <div className="text-xs font-bold text-gray-500">
                    {new Date(webinar.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="border-t-brutal border-brutal-black bg-gray-50 px-6 py-3 flex justify-between items-center">
                  <div className="font-black uppercase text-sm">
                    VIEW DETAILS →
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, webinar.id, webinar.title)}
                    className="bg-brutal-pink text-white px-3 py-1 text-xs font-black border-brutal border-brutal-black shadow-brutal hover:shadow-brutal-lg transition-all uppercase"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-brutal-black text-white border-brutal border-brutal-black shadow-brutal p-6 text-center">
            <p className="font-black uppercase text-lg mb-2">WebinarWins</p>
            <p className="text-sm font-bold text-brutal-cyan">
              Transform 3-5 hours into 15 minutes
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
