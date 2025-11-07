import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './Conversations.css'

export default function Conversations({ onOpenConversation }) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [user])

  const fetchConversations = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .rpc('get_conversation_partners', { user_id: user.id })

      if (error) throw error

      setConversations(data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="conversations-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="conversations-container">
      <div className="conversations-header">
        <h2>Messages</h2>
        <button
          className="btn btn-sm btn-primary"
          onClick={fetchConversations}
          title="Refresh conversations"
        >
          🔄
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className="conversations-empty">
          <p>💬 No conversations yet</p>
          <p className="conversations-empty-hint">
            Start a conversation by clicking "Message" on someone's profile!
          </p>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map((conv) => (
            <div
              key={conv.partner_id}
              className="conversation-item"
              onClick={() => onOpenConversation(
                conv.partner_id,
                conv.partner_username,
                conv.partner_profile_picture
              )}
            >
              <div className="conversation-avatar">
                {conv.partner_profile_picture ? (
                  <img
                    src={conv.partner_profile_picture}
                    alt={conv.partner_username}
                    className="conversation-pic"
                  />
                ) : (
                  <div className="conversation-initial">
                    {conv.partner_username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>

              <div className="conversation-info">
                <div className="conversation-top">
                  <span className="conversation-username">
                    {conv.partner_username}
                  </span>
                  <span className="conversation-time">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                {parseInt(conv.unread_count) > 0 && (
                  <div className="conversation-unread">
                    {conv.unread_count} unread
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
