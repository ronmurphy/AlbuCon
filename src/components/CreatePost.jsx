import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { uploadImage, isValidImageUrl, getUserImageCount } from '../lib/imageUtils'
import { contentTypes } from '../lib/contentTypes'
import { convertEmoticons } from '../utils/emojiUtils'
import { autoTag } from '../utils/contentDetection'
import './CreatePost.css'

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState('general')
  const [imageFiles, setImageFiles] = useState([]) // Changed to array for multiple images
  const [imagePreviews, setImagePreviews] = useState([]) // Changed to array
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    // Check if adding these files would exceed 4 images
    if (imageFiles.length + files.length > 4) {
      setError('You can only upload up to 4 images per post')
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content.trim() && imageFiles.length === 0) {
      setError('Please write something or add images!')
      return
    }

    if (content.length > 500) {
      setError('Posts must be 500 characters or less')
      return
    }

    setIsPosting(true)
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
        setImageCount(count + imageFiles.length)
      }

      // Create post (convert emoticons to emojis and auto-tag content)
      // Use auto-detection if user kept it as 'general', otherwise respect their choice
      const finalContentType = autoTag(content.trim(), contentType)

      const { error } = await supabase
        .from('posts')
        .insert({
          content: convertEmoticons(content.trim()),
          user_id: user.id,
          image_urls: imageUrls, // Store as JSON array
          image_url: imageUrls[0] || null, // Keep first image in old column for backward compatibility
          content_type: finalContentType
        })

      if (error) throw error

      // Clear the form
      setContent('')
      setContentType('general')
      clearAllImages()

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

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="image-previews-container">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="image-preview-item">
                <img src={preview} alt={`Preview ${index + 1}`} className="image-preview" />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => removeImage(index)}
                  disabled={isPosting || isUploading}
                  title="Remove this image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="create-post-footer">
          <div className="post-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileSelect}
              disabled={isPosting || isUploading}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <button
              type="button"
              className="icon-btn camera-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPosting || isUploading || imageCount >= 20 || imageFiles.length >= 4}
              title={`Upload Images (${imageFiles.length}/4 selected) • ${imageCount}/20 total`}
            >
              📷 {imageFiles.length > 0 && `(${imageFiles.length})`}
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
            disabled={isPosting || isUploading || (!content.trim() && imageFiles.length === 0)}
          >
            {isUploading ? 'Uploading...' : isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  )
}
