import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getPendingRequests } from '../lib/friendsUtils'
import './Navbar.css'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadPendingRequests()
      // Poll for new requests every 30 seconds
      const interval = setInterval(loadPendingRequests, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const loadPendingRequests = async () => {
    try {
      const requests = await getPendingRequests(user.id)
      setPendingCount(requests.length)
    } catch (err) {
      console.error('Error loading pending requests:', err)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-brand">
          <span className="logo">✨</span>
          <span className="brand-name">AlbuCon</span>
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              <Link to="/" className="nav-link">Feed</Link>
              <Link to="/friends" className="nav-link">
                Friends
                {pendingCount > 0 && (
                  <span className="notification-badge">{pendingCount}</span>
                )}
              </Link>
              <Link to="/profile" className="nav-link">Profile</Link>
              <Link to="/my-images" className="nav-link">My Images</Link>
              <span className="nav-user">Hey, {user.user_metadata?.username || 'Friend'}!</span>
              <button onClick={handleSignOut} className="btn btn-outline btn-sm">
                Sign Out
              </button>
            </>
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
