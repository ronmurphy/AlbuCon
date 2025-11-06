import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './CreatePost.css'

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content.trim()) {
      setError('Please write something positive to share!')
      return
    }

    if (content.length > 500) {
      setError('Posts must be 500 characters or less')
      return
    }

    setIsPosting(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          content: content.trim(),
          user_id: user.id,
        })

      if (error) throw error

      // Clear the form
      setContent('')

      // Notify parent component to refresh the feed
      if (onPostCreated) onPostCreated()
    } catch (err) {
      console.error('Error creating post:', err)
      setError('Failed to create post. Please try again.')
    } finally {
      setIsPosting(false)
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
          disabled={isPosting}
        />

        <div className="create-post-footer">
          <span className="char-count">
            {content.length}/500
          </span>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPosting || !content.trim()}
          >
            {isPosting ? 'Posting...' : 'Post ✨'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  )
}
