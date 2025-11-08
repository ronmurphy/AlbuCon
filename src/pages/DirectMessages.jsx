import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { convertEmoticons } from '../utils/emojiUtils'
import './DirectMessages.css'

export default function DirectMessages({ recipientId, recipientUsername, recipientProfilePicture }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    fetchMessages()
  }, [recipientId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    if (!user || !recipientId) return

    try {
      // Fetch messages between current user and recipient
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])

      // Mark unread messages as read
      const unreadIds = data
        ?.filter(m => m.recipient_id === user.id && !m.read_at)
        .map(m => m.id)

      if (unreadIds?.length > 0) {
        await supabase
          .from('direct_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: convertEmoticons(newMessage.trim())
        })

      if (error) throw error

      setNewMessage('')
      await fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="dm-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="dm-container">
      {/* DM Header */}
      <div className="dm-header">
        <div className="dm-recipient-info">
          <div className="dm-recipient-avatar">
            {recipientProfilePicture ? (
              <img
                src={recipientProfilePicture}
                alt={recipientUsername}
                className="dm-recipient-pic"
              />
            ) : (
              <div className="dm-recipient-initial">
                {recipientUsername?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <h3 className="dm-recipient-name">{recipientUsername || 'User'}</h3>
        </div>
      </div>

      {/* Messages List */}
      <div className="dm-messages">
        {messages.length === 0 ? (
          <div className="dm-empty">
            <p>💬 No messages yet</p>
            <p className="dm-empty-hint">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user.id
            return (
              <div
                key={message.id}
                className={`dm-message ${isOwn ? 'dm-message-own' : 'dm-message-other'}`}
              >
                <div className="dm-message-content">
                  {message.content}
                </div>
                <div className="dm-message-time">
                  {new Date(message.created_at).toLocaleString()}
                  {isOwn && message.read_at && <span className="dm-read-indicator"> ✓✓</span>}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Message Form */}
      <form className="dm-input-form" onSubmit={sendMessage}>
        <textarea
          className="dm-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage(e)
            }
          }}
          rows={2}
          disabled={sending}
        />
        <button
          type="submit"
          className="btn btn-primary dm-send-btn"
          disabled={!newMessage.trim() || sending}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
