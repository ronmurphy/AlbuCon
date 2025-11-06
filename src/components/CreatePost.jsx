import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { uploadImage, isValidImageUrl, getUserImageCount } from '../lib/imageUtils'
import './CreatePost.css'

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const [imageCount, setImageCount] = useState(0)
  const fileInputRef = useRef(null)

  // Load user image count on mount
  useEffect(() => {
    if (user) {
      getUserImageCount(user.id).then(count => setImageCount(count))
    }
  }, [user])

  const handleImageUrlChange = (url) => {
    setImageUrl(url)
    if (isValidImageUrl(url)) {
      setImagePreview(url)
      setImageFile(null) // Clear file if URL is set
    } else {
      if (url.trim()) {
        setImagePreview('')
      }
    }
  }

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
    setImageUrl('') // Clear URL if file is selected
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageUrl('')
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content.trim() && !imageUrl && !imageFile) {
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
      let finalImageUrl = imageUrl

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

      // Create post
      const { error } = await supabase
        .from('posts')
        .insert({
          content: content.trim(),
          user_id: user.id,
          image_url: finalImageUrl || null
        })

      if (error) throw error

      // Clear the form
      setContent('')
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

  return (
    <div className="create-post card">
      <h2 className="create-post-title">Share Something Positive! ✨</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          className="post-input"
          placeholder="What made you smile today? Share your joy, gratitude, or positive thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          disabled={isPosting || isUploading}
        />

        {/* Image Options */}
        <div className="image-options">
          <div className="image-input-group">
            <label htmlFor="image-url" className="image-label">
              🔗 Image URL:
            </label>
            <input
              id="image-url"
              type="url"
              className="image-url-input"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              disabled={isPosting || isUploading || imageFile}
            />
          </div>

          <div className="image-divider">OR</div>

          <div className="image-upload-group">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              disabled={isPosting || isUploading || imageUrl}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload" className="btn btn-secondary btn-sm upload-btn">
              📷 Upload Image ({imageCount}/20)
            </label>
            {imageCount >= 20 && (
              <span className="limit-warning">Limit reached!</span>
            )}
          </div>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="image-preview-container">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            <button
              type="button"
              className="clear-image-btn"
              onClick={clearImage}
              disabled={isPosting || isUploading}
            >
              ✕
            </button>
          </div>
        )}

        <div className="create-post-footer">
          <span className="char-count">
            {content.length}/500
          </span>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPosting || isUploading || (!content.trim() && !imageUrl && !imageFile)}
          >
            {isUploading ? 'Uploading...' : isPosting ? 'Posting...' : 'Post ✨'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  )
}
