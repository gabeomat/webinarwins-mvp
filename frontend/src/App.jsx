import { useState } from 'react'
import UploadForm from './app/components/upload/UploadForm'
import Alert from './app/components/ui/Alert'

function App() {
  const [webinar, setWebinar] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleUploadSuccess = (result) => {
    console.log('Webinar created:', result)
    setWebinar(result)
    setShowSuccess(true)
    // Auto-hide success message after 5 seconds
    setTimeout(() => setShowSuccess(false), 5000)
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
      {/* Header */}
      <header className="bg-white border-b-brutal border-brutal-black shadow-brutal-lg mb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-brutal-black uppercase" style={{ fontFamily: 'monospace' }}>
                ⚡ WebinarWins
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="bg-brutal-black text-brutal-cyan px-3 py-1 text-xs font-bold uppercase">
                  MVP
                </div>
                <div className="bg-brutal-pink text-white px-3 py-1 text-xs font-bold uppercase">
                  Neo-Brutal
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-brutal-lime border-brutal border-brutal-black px-4 py-2 shadow-brutal inline-block">
                <p className="text-xs font-black uppercase text-brutal-black">Phase 3 ✓</p>
                <p className="text-lg font-black text-brutal-black">SCORING COMPLETE</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && webinar && (
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <Alert type="success">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-3xl mr-3">🎉</span>
                <div>
                  <p className="font-black text-lg">SUCCESS!</p>
                  <p className="text-sm">Webinar "{webinar.title}" created with ID: {webinar.id}</p>
                  {webinar.stats && (
                    <p className="text-xs mt-1">
                      {webinar.stats.total_attendees} attendees analyzed | 
                      {webinar.stats.hot_leads} Hot Leads found!
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setShowSuccess(false)}
                className="text-2xl hover:scale-110 transition-transform"
              >
                ✕
              </button>
            </div>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main>
        <UploadForm onSuccess={handleUploadSuccess} />
      </main>

      {/* Footer */}
      <footer className="mt-16 pb-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-brutal-black text-white border-brutal border-brutal-black shadow-brutal p-6 text-center">
            <p className="font-black uppercase text-lg mb-2">WebinarWins MVP</p>
            <p className="text-sm font-bold text-brutal-cyan">
              Vertical Slice Development • Neo-Brutalist Edition
            </p>
            <div className="mt-4 flex justify-center gap-2 flex-wrap">
              <span className="bg-brutal-pink px-3 py-1 text-xs font-bold">PHASE 0 ✓</span>
              <span className="bg-brutal-cyan text-brutal-black px-3 py-1 text-xs font-bold">PHASE 1 ✓</span>
              <span className="bg-brutal-lime text-brutal-black px-3 py-1 text-xs font-bold">PHASE 2 ✓</span>
              <span className="bg-brutal-yellow text-brutal-black px-3 py-1 text-xs font-bold">PHASE 3 ✓</span>
              <span className="bg-brutal-purple px-3 py-1 text-xs font-bold">PHASE 4-6 →</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

