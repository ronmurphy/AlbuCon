import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './CommentForm.css'

export default function CommentForm({
  postId,
  parentCommentId = null,
  onCommentAdded,
  onCancel,
  placeholder = 'Write a comment...',
  autoFocus = false
}) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!content.trim() || !user) return

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          parent_comment_id: parentCommentId,
          content: content.trim()
        })
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            profile_picture_url
          )
        `)
        .single()

      if (error) throw error

      setContent('')
      if (onCommentAdded) onCommentAdded({ ...data, replies: [] })
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  if (!user) {
    return (
      <div className="comment-form-login-prompt">
        <p>Please sign in to comment</p>
      </div>
    )
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="comment-form-input">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={submitting}
          maxLength={2000}
          rows={parentCommentId ? 2 : 3}
        />
      </div>
      <div className="comment-form-actions">
        <div className="comment-form-hint">
          {content.length > 0 && (
            <span className={content.length >= 2000 ? 'text-warning' : ''}>
              {content.length}/2000
            </span>
          )}
        </div>
        <div className="comment-form-buttons">
          {onCancel && (
            <button
              type="button"
              className="btn-comment-cancel"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-comment-submit"
            disabled={!content.trim() || submitting}
          >
            {submitting ? 'Posting...' : (parentCommentId ? 'Reply' : 'Comment')}
          </button>
        </div>
      </div>
    </form>
  )
}
