import { useNotifications } from '../contexts/NotificationsContext'
import { useNavigate } from 'react-router-dom'
import './NotificationsList.css'

export default function NotificationsList({ onClose }) {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const navigate = useNavigate()

  const getNotificationMessage = (notification) => {
    const actorName = notification.actor?.username || 'Someone'

    switch (notification.type) {
      case 'like':
        return `${actorName} liked your post`
      case 'comment':
        return `${actorName} commented on your post`
      case 'reply':
        return `${actorName} replied to your comment`
      case 'follow':
        return `${actorName} started following you`
      case 'external_post':
        return `New post from ${actorName}`
      default:
        return 'New notification'
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️'
      case 'comment':
      case 'reply':
        return '💬'
      case 'follow':
        return '👤'
      case 'external_post':
        return '📢'
      default:
        return '🔔'
    }
  }

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.type === 'follow') {
      // Could navigate to the follower's profile in the future
      onClose?.()
    } else if (notification.post_id) {
      // Navigate to home and scroll to post (simplified for now)
      navigate('/')
      onClose?.()
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="notifications-list">
        <div className="notifications-header">
          <h3>Notifications</h3>
        </div>
        <div className="notifications-loading">Loading...</div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="notifications-list">
        <div className="notifications-header">
          <h3>Notifications</h3>
        </div>
        <div className="notifications-empty">
          <span className="empty-icon">🔔</span>
          <p>No notifications yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="notifications-list">
      <div className="notifications-header">
        <h3>Notifications</h3>
        {notifications.some(n => !n.read) && (
          <button className="mark-all-read-btn" onClick={markAllAsRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className="notifications-items">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item ${!notification.read ? 'unread' : ''}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="notification-icon">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="notification-content">
              <div className="notification-message">
                {getNotificationMessage(notification)}
              </div>
              <div className="notification-time">
                {formatDate(notification.created_at)}
              </div>
            </div>
            <button
              className="notification-delete-btn"
              onClick={(e) => {
                e.stopPropagation()
                deleteNotification(notification.id)
              }}
              title="Delete notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
