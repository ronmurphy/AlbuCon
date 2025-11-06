import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { siteName, logoEmoji } from '../config/naming'
import './Navbar.css'

export default function Navbar() {
  const { user } = useAuth()

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-brand">
          <span className="logo">{logoEmoji}</span>
          <span className="brand-name">{siteName}</span>
        </Link>

        <div className="nav-links">
          {user ? (
            <span className="nav-user">Hey, {user.user_metadata?.username || 'Friend'}! 👋</span>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
