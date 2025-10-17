import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthForm from './components/auth/AuthForm'
import Dashboard from './pages/Dashboard'
import UploadWebinar from './pages/UploadWebinar'
import WebinarDetail from './pages/WebinarDetail'
import GeneratedEmails from './pages/GeneratedEmails'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

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

  if (!user) {
    return <Navigate to="/" />
  }

  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()

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

  if (user) {
    return <Navigate to="/dashboard" />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={
            <PublicRoute>
              <AuthForm />
            </PublicRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute>
              <UploadWebinar />
            </ProtectedRoute>
          } />
          <Route path="/webinar/:id" element={
            <ProtectedRoute>
              <WebinarDetail />
            </ProtectedRoute>
          } />
          <Route path="/webinar/:id/emails" element={
            <ProtectedRoute>
              <GeneratedEmails />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
