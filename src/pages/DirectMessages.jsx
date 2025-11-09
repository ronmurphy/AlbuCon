import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { convertEmoticons } from '../utils/emojiUtils'
import { uploadImage, getUserImageCount } from '../lib/imageUtils'
import VideoEmbed from '../components/VideoEmbed'
import ImageCarousel from '../components/ImageCarousel'
import './DirectMessages.css'

export default function DirectMessages({ recipientId, recipientUsername, recipientProfilePicture }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const [recipientTyping, setRecipientTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const typingStatusRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    fetchMessages()
    setupTypingSubscription()
    return () => {
      clearTypingStatus()
      if (typingStatusRef.current) {
        typingStatusRef.current.unsubscribe()
      }
    }
  }, [recipientId])

  // Set up typing status subscription
  const setupTypingSubscription = async () => {
    if (!user || !recipientId) return

    // Subscribe to typing status changes
    const subscription = supabase
      .channel(`typing:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_status',
        filter: `recipient_id=eq.${user.id}`
      }, (payload) => {
        if (payload.new?.user_id === recipientId) {
          setRecipientTyping(true)
          // Auto-clear after 3 seconds of no updates
          setTimeout(() => setRecipientTyping(false), 3000)
        } else if (payload.eventType === 'DELETE' && payload.old?.user_id === recipientId) {
          setRecipientTyping(false)
        }
      })
      .subscribe()

    typingStatusRef.current = subscription
  }

  // Send typing status
  const sendTypingStatus = async () => {
    if (!user || !recipientId) return

    try {
      await supabase
        .from('typing_status')
        .upsert({
          user_id: user.id,
          recipient_id: recipientId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,recipient_id'
        })
    } catch (error) {
      console.error('Error sending typing status:', error)
    }
  }

  // Clear typing status
  const clearTypingStatus = async () => {
    if (!user || !recipientId) return

    try {
      await supabase
        .from('typing_status')
        .delete()
        .eq('user_id', user.id)
        .eq('recipient_id', recipientId)
    } catch (error) {
      console.error('Error clearing typing status:', error)
    }
  }

  // Handle typing with debounce
  const handleTyping = () => {
    sendTypingStatus()

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to clear typing status after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      clearTypingStatus()
    }, 3000)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Check if adding these files would exceed 4 images
    if (imageFiles.length + files.length > 4) {
      setError('You can only upload up to 4 images per message')
      return
    }

    // Validate each file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const validFiles = []
    const newPreviews = []

    for (const file of files) {
      // Validate file type
      if (!validTypes.includes(file.type)) {
        setError('Please select valid image files (JPG, PNG, GIF, or WEBP)')
        continue
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('Each image must be less than 10MB')
        continue
      }

      validFiles.push(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target.result)
        if (newPreviews.length === validFiles.length) {
          setImagePreviews(prev => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    }

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles])
      setError(null)
    }
  }

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllImages = () => {
    setImageFiles([])
    setImagePreviews([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
    if ((!newMessage.trim() && imageFiles.length === 0) || sending) return

    setSending(true)
    setError(null)
    try {
      const imageUrls = []

      // Upload all selected images
      if (imageFiles.length > 0) {
        // Check image limit
        const count = await getUserImageCount(user.id)
        if (count + imageFiles.length > 20) {
          throw new Error(`You can only upload ${20 - count} more images. You have ${count}/20 images uploaded.`)
        }

        setIsUploading(true)

        // Upload each image
        for (const file of imageFiles) {
          const url = await uploadImage(file, user.id)
          imageUrls.push(url)
        }

        setIsUploading(false)
      }

      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: newMessage.trim() ? convertEmoticons(newMessage.trim()) : '',
          image_urls: imageUrls
        })

      if (error) throw error

      setNewMessage('')
      clearAllImages()
      clearTypingStatus()
      await fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      setError(error.message || 'Failed to send message. Please try again.')
    } finally {
      setSending(false)
      setIsUploading(false)
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
            const images = message.image_urls && message.image_urls.length > 0
              ? message.image_urls
              : []
            return (
              <div
                key={message.id}
                className={`dm-message ${isOwn ? 'dm-message-own' : 'dm-message-other'}`}
              >
                {message.content && (
                  <div className="dm-message-content">
                    {message.content}
                  </div>
                )}
                {/* Display images if present */}
                {images.length > 0 && <ImageCarousel images={images} />}
                {/* Display video embed if URL detected in message */}
                <VideoEmbed content={message.content} />
                <div className="dm-message-time">
                  {new Date(message.created_at).toLocaleString()}
                  {isOwn && message.read_at && <span className="dm-read-indicator"> ✓✓</span>}
                </div>
              </div>
            )
          })
        )}
        {recipientTyping && (
          <div className="dm-typing-indicator">
            <div className="dm-typing-bubble">
              <span className="dm-typing-dot"></span>
              <span className="dm-typing-dot"></span>
              <span className="dm-typing-dot"></span>
            </div>
            <div className="dm-typing-text">{recipientUsername} is typing...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Message Form */}
      <form className="dm-input-form" onSubmit={sendMessage}>
        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="dm-image-previews">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="dm-image-preview-item">
                <img src={preview} alt={`Preview ${index + 1}`} className="dm-image-preview" />
                <button
                  type="button"
                  className="dm-remove-image-btn"
                  onClick={() => removeImage(index)}
                  disabled={sending || isUploading}
                  title="Remove this image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <div className="dm-error-message">{error}</div>}

        <div className="dm-input-wrapper">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileSelect}
            disabled={sending || isUploading}
            style={{ display: 'none' }}
            id="dm-file-upload"
          />
          <button
            type="button"
            className="dm-image-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || isUploading || imageFiles.length >= 4}
            title={`Upload Images (${imageFiles.length}/4 selected)`}
          >
            📷
          </button>
          <textarea
            className="dm-input"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              handleTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(e)
              }
            }}
            rows={2}
            disabled={sending || isUploading}
          />
          <button
            type="submit"
            className="btn btn-primary dm-send-btn"
            disabled={(!newMessage.trim() && imageFiles.length === 0) || sending || isUploading}
          >
            {isUploading ? 'Uploading...' : sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
