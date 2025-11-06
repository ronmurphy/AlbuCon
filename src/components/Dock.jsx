import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getPendingRequests } from '../lib/friendsUtils'
import './Dock.css'

export default function Dock({ activeView, onViewChange, onSignOut, feedMinimized }) {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadPendingRequests()
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

  const dockItems = [
    { id: 'feed', icon: '🏠', label: 'Feed', views: ['feed'] },
    { id: 'friends', icon: '👥', label: 'Friends', badge: pendingCount, views: ['friends'] },
    { id: 'profile', icon: '👤', label: 'Profile', views: ['profile'] },
    { id: 'images', icon: '🖼️', label: 'My Images', views: ['images'] },
    { id: 'divider', type: 'divider' },
    { id: 'settings', icon: '⚙️', label: 'Settings', views: ['settings'] },
  ]

  const handleDockClick = (item) => {
    if (item.id === 'settings') {
      // Settings will show sign out option
      onViewChange('settings')
    } else if (item.views) {
      onViewChange(item.views[0])
    }
  }

  return (
    <div className="dock-container">
      <div className="dock">
        {dockItems.map((item) => {
          if (item.type === 'divider') {
            return <div key={item.id} className="dock-divider" />
          }

          const isActive = item.views && item.views.includes(activeView)

          const isMinimized = item.id === 'feed' && feedMinimized

          return (
            <button
              key={item.id}
              className={`dock-item ${isActive ? 'active' : ''} ${isMinimized ? 'minimized' : ''}`}
              onClick={() => handleDockClick(item)}
              title={isMinimized ? `${item.label} (Minimized)` : item.label}
            >
              <div className="dock-icon-wrapper">
                <span className="dock-icon">{item.icon}</span>
                {item.badge > 0 && (
                  <span className="dock-badge">{item.badge}</span>
                )}
                {isMinimized && (
                  <span className="minimized-indicator">➖</span>
                )}
              </div>
              <span className="dock-label">{item.label}</span>
              {isActive && <div className="dock-indicator" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
