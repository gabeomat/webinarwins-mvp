import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Alert from '../ui/Alert'

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) throw error
        setSuccess('Account created! You can now sign in.')
        setIsSignUp(false)
        setEmail('')
        setPassword('')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brutal-yellow flex items-center justify-center p-4" style={{
      backgroundImage: `repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        rgba(0,0,0,.03) 10px,
        rgba(0,0,0,.03) 20px
      )`
    }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-brutal-black mb-4 uppercase" style={{ fontFamily: 'monospace' }}>
            WebinarWins
          </h1>
          <div className="inline-block bg-brutal-black text-brutal-cyan px-6 py-2 border-brutal border-brutal-black shadow-brutal">
            <p className="font-black text-lg">TRANSFORM WEBINAR DATA INTO SALES</p>
          </div>
        </div>

        <div className="bg-white border-brutal border-brutal-black shadow-brutal-lg p-8">
          <div className="mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 px-4 py-3 font-black uppercase border-brutal border-brutal-black transition-all ${
                  !isSignUp
                    ? 'bg-brutal-cyan text-brutal-black shadow-brutal'
                    : 'bg-white text-brutal-black hover:bg-gray-50'
                }`}
              >
                SIGN IN
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 px-4 py-3 font-black uppercase border-brutal border-brutal-black transition-all ${
                  isSignUp
                    ? 'bg-brutal-pink text-white shadow-brutal'
                    : 'bg-white text-brutal-black hover:bg-gray-50'
                }`}
              >
                SIGN UP
              </button>
            </div>
          </div>

          {error && (
            <Alert type="error" className="mb-4">
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" className="mb-4">
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? 'LOADING...' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </Button>
          </form>

          {!isSignUp && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Demo: Use any email/password to create an account
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <div className="inline-block bg-white border-brutal border-brutal-black px-4 py-2 shadow-brutal">
            <p className="text-xs font-bold">
              Save 3-5 hours per webinar • 2x conversion rates
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
