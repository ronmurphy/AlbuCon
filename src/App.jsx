import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import Navbar from './components/Navbar'
import ColumnsLayout from './components/ColumnsLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import InviteRedeem from './pages/InviteRedeem'

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
