import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../contexts/NotificationsContext'
import NotificationsList from './NotificationsList'
import './NotificationBell.css'

export default function NotificationBell() {
  const { unreadCount } = useNotifications()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const [uiStyle, setUiStyle] = useState(() => {
    return localStorage.getItem('albucon-ui-style') || 'glass'
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Listen for UI style changes
  useEffect(() => {
    const handleStyleChange = (event) => {
      setUiStyle(event.detail.style)
    }
    window.addEventListener('albucon-ui-style-change', handleStyleChange)
    return () => window.removeEventListener('albucon-ui-style-change', handleStyleChange)
  }, [])

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        title="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className={`notifications-dropdown notifications-${uiStyle}`}>
          <NotificationsList onClose={() => setShowDropdown(false)} />
        </div>
      )}
    </div>
  )
}
