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

  const handleSignOut = async () => {
    await signOut()
  }

  const renderView = () => {
    switch (activeView) {
      case 'feed':
        return (
          <Columns title="Feed">
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
        onViewChange={setActiveView}
        onSignOut={handleSignOut}
      />
    </div>
  )
}
