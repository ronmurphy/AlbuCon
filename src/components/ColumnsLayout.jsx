import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Dock from './Dock'
import Columns from './Columns'
import Home from '../pages/Home'
import Friends from '../pages/Friends'
import Profile from '../pages/Profile'
import MyImages from '../pages/MyImages'
import './ColumnsLayout.css'

export default function ColumnsLayout() {
  const { user, signOut } = useAuth()
  const [activeView, setActiveView] = useState('feed')
  const [feedMinimized, setFeedMinimized] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const handleMinimizeFeed = () => {
    setFeedMinimized(true)
    // Switch to another view when minimizing
    if (activeView === 'feed') {
      setActiveView('friends')
    }
  }

  const handleViewChange = (view) => {
    setActiveView(view)
    // If navigating to feed, make sure it's not minimized
    if (view === 'feed') {
      setFeedMinimized(false)
    }
  }

  const renderView = () => {
    switch (activeView) {
      case 'feed':
        return feedMinimized ? null : (
          <Columns title="Feed" onMinimize={handleMinimizeFeed}>
            <Home />
          </Columns>
        )

      case 'friends':
        return (
          <Columns title="Friends">
            <Friends />
          </Columns>
        )

      case 'profile':
        return (
          <Columns title="My Profile">
            <Profile />
          </Columns>
        )

      case 'images':
        return (
          <Columns title="My Images">
            <MyImages />
          </Columns>
        )

      case 'settings':
        return (
          <div className="settings-view">
            <div className="settings-card card">
              <h2>Settings</h2>
              <div className="settings-section">
                <h3>Account</h3>
                <p className="settings-info">
                  <strong>Username:</strong> {user?.user_metadata?.username || 'Unknown'}
                </p>
                <p className="settings-info">
                  <strong>Email:</strong> {user?.email || 'Unknown'}
                </p>
              </div>
              <div className="settings-section">
                <button onClick={handleSignOut} className="btn btn-danger">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <Columns title="Feed">
            <Home />
          </Columns>
        )
    }
  }

  return (
    <div className="columns-layout">
      <div className="main-content">
        {renderView()}
      </div>
      <Dock
        activeView={activeView}
        onViewChange={handleViewChange}
        onSignOut={handleSignOut}
        feedMinimized={feedMinimized}
      />
    </div>
  )
}
