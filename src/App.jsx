import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import Navbar from './components/Navbar'
import ColumnsLayout from './components/ColumnsLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import InviteRedeem from './pages/InviteRedeem'
import { checkRedditProxyHealth } from './services/redditService'

function AppContent() {
  const { user } = useAuth()

  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/invite/:code" element={<InviteRedeem />} />
        {user ? (
          <Route path="*" element={<ColumnsLayout />} />
        ) : (
          <>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </>
        )}
      </Routes>
    </div>
  )
}

function App() {
  useEffect(() => {
    // Check Reddit proxy health on startup
    checkRedditProxyHealth().then(({ healthy, message }) => {
      console.log('🔍 Reddit Proxy Health Check:', message)
      if (!healthy) {
        console.warn('⚠️ Reddit integration may not work properly. Check the console for details.')
      }
    })
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <Router basename={import.meta.env.BASE_URL}>
            <AppContent />
          </Router>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
