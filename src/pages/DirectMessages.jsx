import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { convertEmoticons } from '../utils/emojiUtils'
import { uploadImage, getUserImageCount } from '../lib/imageUtils'
import VideoEmbed from '../components/VideoEmbed'
import ImageCarousel from '../components/ImageCarousel'
import MyImagesPicker from '../components/MyImagesPicker'
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
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const [showImagePicker, setShowImagePicker] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const typingStatusRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Helper function to format date separators
  const formatDateSeparator = (date) => {
    const messageDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Reset time for comparison
    const resetTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const msgDay = resetTime(messageDate)
    const todayDay = resetTime(today)
    const yesterdayDay = resetTime(yesterday)

    if (msgDay.getTime() === todayDay.getTime()) {
      return 'Today'
    } else if (msgDay.getTime() === yesterdayDay.getTime()) {
      return 'Yesterday'
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  // Check if messages should be grouped (same sender, within 3 minutes)
  const shouldGroupWithPrevious = (currentMsg, prevMsg) => {
    if (!prevMsg) return false
    if (currentMsg.sender_id !== prevMsg.sender_id) return false

    const currentTime = new Date(currentMsg.created_at).getTime()
    const prevTime = new Date(prevMsg.created_at).getTime()
    const diffMinutes = (currentTime - prevTime) / (1000 * 60)

    return diffMinutes <= 3
  }

  // Check if we should show timestamp (first of group or 5+ min gap)
  const shouldShowTimestamp = (currentMsg, prevMsg) => {
    if (!prevMsg) return true

    const currentTime = new Date(currentMsg.created_at).getTime()
    const prevTime = new Date(prevMsg.created_at).getTime()
    const diffMinutes = (currentTime - prevTime) / (1000 * 60)

    return diffMinutes >= 5 || currentMsg.sender_id !== prevMsg.sender_id
  }

  // Check if date changed between messages
  const shouldShowDateSeparator = (currentMsg, prevMsg) => {
    if (!prevMsg) return true

    const currentDate = new Date(currentMsg.created_at).setHours(0, 0, 0, 0)
    const prevDate = new Date(prevMsg.created_at).setHours(0, 0, 0, 0)

    return currentDate !== prevDate
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

  // Start editing a message
  const startEditingMessage = (message) => {
    setEditingMessageId(message.id)
    setEditingContent(message.content)
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditingContent('')
  }

  // Save edited message
  const saveEditedMessage = async (messageId) => {
    if (!editingContent.trim()) {
      setError('Message cannot be empty')
      return
    }

    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({ content: convertEmoticons(editingContent.trim()) })
        .eq('id', messageId)

      if (error) throw error

      setEditingMessageId(null)
      setEditingContent('')
      await fetchMessages()
    } catch (error) {
      console.error('Error editing message:', error)
      setError('Failed to edit message. Please try again.')
    }
  }

  // Delete message (soft delete)
  const deleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({
          deleted_at: new Date().toISOString(),
          content: '' // Clear content for privacy
        })
        .eq('id', messageId)

      if (error) throw error

      await fetchMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
      setError('Failed to delete message. Please try again.')
    }
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

  // Handle selecting images from My Images
  const handleSelectFromMyImages = (selectedUrls) => {
    // Convert URLs to preview format
    const newPreviews = selectedUrls.map(url => url) // URLs are already usable
    setImagePreviews(prev => [...prev, ...newPreviews].slice(0, 4))
    // Store URLs directly instead of file objects
    setImageFiles(prev => [...prev, ...selectedUrls].slice(0, 4))
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

      // Handle images (both new uploads and shared from My Images)
      if (imageFiles.length > 0) {
        setIsUploading(true)

        // Separate new uploads from shared URLs
        const newUploads = imageFiles.filter(item => typeof item !== 'string')
        const sharedUrls = imageFiles.filter(item => typeof item === 'string')

        // Check image limit for new uploads only
        if (newUploads.length > 0) {
          const count = await getUserImageCount(user.id)
          if (count + newUploads.length > 20) {
            throw new Error(`You can only upload ${20 - count} more images. You have ${count}/20 images uploaded.`)
          }

          // Upload each new image
          for (const file of newUploads) {
            const url = await uploadImage(file, user.id)
            imageUrls.push(url)
          }
        }

        // Add shared URLs directly
        imageUrls.push(...sharedUrls)

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
          messages.map((message, index) => {
            const isOwn = message.sender_id === user.id
            const images = message.image_urls && message.image_urls.length > 0
              ? message.image_urls
              : []
            const isDeleted = message.deleted_at !== null
            const isEdited = message.edited_at !== null
            const isEditing = editingMessageId === message.id
            const prevMsg = index > 0 ? messages[index - 1] : null
            const nextMsg = index < messages.length - 1 ? messages[index + 1] : null

            const isGrouped = shouldGroupWithPrevious(message, prevMsg)
            const isLastInGroup = !shouldGroupWithPrevious(nextMsg, message)
            const showTimestamp = shouldShowTimestamp(message, prevMsg)
            const showDateSeparator = shouldShowDateSeparator(message, prevMsg)

            return (
              <div key={message.id}>
                {/* Day Separator */}
                {showDateSeparator && (
                  <div className="dm-date-separator">
                    <span className="dm-date-separator-text">
                      {formatDateSeparator(message.created_at)}
                    </span>
                  </div>
                )}

                {/* Message */}
                <div
                  className={`dm-message ${isOwn ? 'dm-message-own' : 'dm-message-other'} ${isDeleted ? 'dm-message-deleted' : ''} ${isGrouped ? 'dm-message-grouped' : ''} ${isLastInGroup ? 'dm-message-last-in-group' : ''}`}
                >
                {isDeleted ? (
                  // Deleted message
                  <div className="dm-message-content dm-message-removed">
                    <em>This message was removed</em>
                  </div>
                ) : isEditing ? (
                  // Edit mode
                  <div className="dm-message-edit">
                    <textarea
                      className="dm-edit-input"
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      autoFocus
                    />
                    <div className="dm-edit-actions">
                      <button
                        className="btn-small btn-primary"
                        onClick={() => saveEditedMessage(message.id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn-small"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal message
                  <>
                    {message.content && (
                      <div className="dm-message-content">
                        {message.content}
                        {isEdited && <span className="dm-edited-indicator"> (edited)</span>}
                      </div>
                    )}
                    {/* Display images if present */}
                    {images.length > 0 && <ImageCarousel images={images} />}
                    {/* Display video embed if URL detected in message */}
                    <VideoEmbed content={message.content} />
                    {isOwn && !isDeleted && (
                      <div className="dm-message-actions">
                        <button
                          className="dm-action-btn"
                          onClick={() => startEditingMessage(message)}
                          title="Edit message"
                        >
                          ✏️
                        </button>
                        <button
                          className="dm-action-btn"
                          onClick={() => deleteMessage(message.id)}
                          title="Delete message"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </>
                )}
                {showTimestamp && (
                  <div className="dm-message-time">
                    {new Date(message.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                    {isOwn && message.read_at && <span className="dm-read-indicator"> ✓✓</span>}
                  </div>
                )}
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
            title="Upload new images"
          >
            📷
          </button>
          <button
            type="button"
            className="dm-image-btn dm-myimages-btn"
            onClick={() => setShowImagePicker(true)}
            disabled={sending || isUploading || imageFiles.length >= 4}
            title="Share from My Images"
          >
            🖼️
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

      {/* My Images Picker Modal */}
      {showImagePicker && (
        <MyImagesPicker
          onSelectImages={handleSelectFromMyImages}
          maxImages={4 - imageFiles.length}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  )
}
