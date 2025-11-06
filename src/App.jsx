import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ColumnsLayout from './components/ColumnsLayout'
import Login from './pages/Login'
import Signup from './pages/Signup'

function AppContent() {
  const { user } = useAuth()

  return (
    <div className="app">
      <Navbar />
      {user ? (
        <ColumnsLayout />
      ) : (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
