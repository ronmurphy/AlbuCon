import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, signOut } = useAuth()

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
