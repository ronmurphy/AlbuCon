import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getPendingRequests } from '../lib/friendsUtils'
import './Dock.css'

export default function Dock({ openColumns, onToggleColumn, onCloseColumn, onSignOut, onOpenLauncher }) {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [hoveredItem, setHoveredItem] = useState(null)
  const [uiStyle, setUiStyle] = useState(() => {
    return localStorage.getItem('albucon-ui-style') || 'glass'
  })

  useEffect(() => {
    if (user) {
      loadPendingRequests()
      const interval = setInterval(loadPendingRequests, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Listen for UI style changes
  useEffect(() => {
    const handleStyleChange = (event) => {
      setUiStyle(event.detail.style)
    }
    window.addEventListener('albucon-ui-style-change', handleStyleChange)
    return () => window.removeEventListener('albucon-ui-style-change', handleStyleChange)
  }, [])

  const loadPendingRequests = async () => {
    try {
      const requests = await getPendingRequests(user.id)
      setPendingCount(requests.length)
    } catch (err) {
      console.error('Error loading pending requests:', err)
    }
  }

  // Static dock items
  const staticItems = [
    { id: 'feed', icon: '🏠', label: 'Feed', type: 'feed' },
    { id: 'messages', icon: '💬', label: 'Messages', type: 'messages' },
    { id: 'friends', icon: '👥', label: 'Friends', badge: pendingCount, type: 'friends' },
    { id: 'profile', icon: '👤', label: 'Profile', type: 'profile' },
    { id: 'images', icon: '🖼️', label: 'My Images', type: 'images' },
  ]

  // Get user timeline columns
  const userTimelineColumns = openColumns.filter(col => col.type === 'user' && !col.minimized)

  // Check if a column is open
  const isColumnOpen = (type) => {
    return openColumns.some(col => col.type === type && !col.minimized)
  }

  // Check if feed is minimized
  const feedColumn = openColumns.find(col => col.id === 'feed')
  const feedMinimized = feedColumn?.minimized

  const handleItemClick = (item) => {
    if (item.type === 'user') {
      // User timeline - close it
      onCloseColumn(item.columnId)
    } else {
      // Static items - toggle
      onToggleColumn(item.type, item.data)
    }
  }

  return (
    <div className="dock-container">
      <div className={`dock dock-${uiStyle}`}>
        {/* Static Items */}
        {staticItems.map((item) => {
          const isOpen = isColumnOpen(item.type)
          const isMinimized = item.id === 'feed' && feedMinimized

          return (
            <button
              key={item.id}
              className={`dock-item ${isOpen ? 'active' : ''} ${isMinimized ? 'minimized' : ''}`}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
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
              {isOpen && !isMinimized && <div className="dock-indicator" />}
            </button>
          )
        })}

        {/* Divider before user timelines */}
        {userTimelineColumns.length > 0 && (
          <div className="dock-divider" />
        )}

        {/* Dynamic User Timeline Icons */}
        {userTimelineColumns.map((column) => {
          const { userId, username, profilePicture } = column.data
          const isHovered = hoveredItem === column.id

          return (
            <button
              key={column.id}
              className="dock-item user-timeline active"
              onClick={() => handleItemClick({ type: 'user', columnId: column.id })}
              onMouseEnter={() => setHoveredItem(column.id)}
              onMouseLeave={() => setHoveredItem(null)}
              title={`${username}'s Timeline`}
            >
              <div className="dock-icon-wrapper user-icon">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={username}
                    className="dock-user-pic"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div
                  className="dock-user-initial"
                  style={profilePicture ? { display: 'none' } : {}}
                >
                  {username?.[0]?.toUpperCase() || '?'}
                </div>
                {isHovered && (
                  <div
                    className="dock-close-overlay"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCloseColumn(column.id)
                    }}
                  >
                    ✕
                  </div>
                )}
              </div>
              <span className="dock-label">{username}</span>
              <div className="dock-indicator" />
            </button>
          )
        })}

        {/* Divider before apps */}
        <div className="dock-divider" />

        {/* Apps Launcher */}
        <button
          className="dock-item"
          onClick={onOpenLauncher}
          onMouseEnter={() => setHoveredItem('apps')}
          onMouseLeave={() => setHoveredItem(null)}
          title="Apps"
        >
          <div className="dock-icon-wrapper">
            <span className="dock-icon">🎮</span>
          </div>
          <span className="dock-label">Apps</span>
        </button>
      </div>
    </div>
  )
}
