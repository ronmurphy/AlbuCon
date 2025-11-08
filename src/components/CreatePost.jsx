import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { uploadImage, isValidImageUrl, getUserImageCount } from '../lib/imageUtils'
import { contentTypes } from '../lib/contentTypes'
import { convertEmoticons } from '../utils/emojiUtils'
import './CreatePost.css'

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState('general')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const [imageCount, setImageCount] = useState(0)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const fileInputRef = useRef(null)

  // Load user image count on mount
  useEffect(() => {
    if (user) {
      getUserImageCount(user.id).then(count => setImageCount(count))
    }
  }, [user])

  // Auto-detect image URLs in content
  useEffect(() => {
    if (!imageFile) {
      const urlPattern = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?/i
      const match = content.match(urlPattern)
      if (match && isValidImageUrl(match[0])) {
        setImagePreview(match[0])
      } else {
        setImagePreview('')
      }
    }
  }, [content, imageFile])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, GIF, or WEBP)')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setImageFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content.trim() && !imageFile) {
      setError('Please write something or add an image!')
      return
    }

    if (content.length > 500) {
      setError('Posts must be 500 characters or less')
      return
    }

    setIsPosting(true)
    setError(null)

    try {
      let finalImageUrl = null

      // Check for image URL in content (don't count it against char limit)
      const urlPattern = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?/i
      const match = content.match(urlPattern)
      if (match && isValidImageUrl(match[0])) {
        finalImageUrl = match[0]
      }

      // Upload file if selected
      if (imageFile) {
        // Check image limit
        const count = await getUserImageCount(user.id)
        if (count >= 20) {
          throw new Error('You have reached the limit of 20 uploaded images. Please delete some images first.')
        }

        setIsUploading(true)
        finalImageUrl = await uploadImage(imageFile, user.id)
        setIsUploading(false)
        setImageCount(count + 1)
      }

      // Create post (convert emoticons to emojis)
      const { error } = await supabase
        .from('posts')
        .insert({
          content: convertEmoticons(content.trim()),
          user_id: user.id,
          image_url: finalImageUrl || null,
          content_type: contentType
        })

      if (error) throw error

      // Clear the form
      setContent('')
      setContentType('general')
      clearImage()

      // Notify parent component to refresh the feed
      if (onPostCreated) onPostCreated()
    } catch (err) {
      console.error('Error creating post:', err)
      setError(err.message || 'Failed to create post. Please try again.')
    } finally {
      setIsPosting(false)
      setIsUploading(false)
    }
  }

  if (!user) {
    return (
      <div className="create-post card">
        <p className="login-prompt">Please log in to share your positive vibes! ✨</p>
      </div>
    )
  }

  const charsRemaining = 500 - content.length
  const showCharCount = charsRemaining < 50

  return (
    <div className="create-post card">
      <form onSubmit={handleSubmit}>
        <div className="post-input-wrapper">
          <textarea
            className="post-input compact"
            placeholder="What made you smile today? 😊"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            disabled={isPosting || isUploading}
            rows={3}
          />
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="image-preview-container">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            {imageFile && (
              <button
                type="button"
                className="clear-image-btn"
                onClick={clearImage}
                disabled={isPosting || isUploading}
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="create-post-footer">
          <div className="post-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              disabled={isPosting || isUploading}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <button
              type="button"
              className="icon-btn camera-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPosting || isUploading || imageCount >= 20}
              title={`Upload Image • ${imageCount}/20 images`}
            >
              📷
            </button>

            <select
              className="content-type-select"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              disabled={isPosting || isUploading}
              title="Content Type"
            >
              {contentTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.name}
                </option>
              ))}
            </select>

            {showCharCount && (
              <span className={`char-count ${charsRemaining < 20 ? 'warning' : ''}`}>
                {charsRemaining}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={isPosting || isUploading || (!content.trim() && !imageFile)}
          >
            {isUploading ? 'Uploading...' : isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  )
}
