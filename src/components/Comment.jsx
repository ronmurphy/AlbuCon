import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import CommentForm from './CommentForm'
import './Comment.css'

export default function Comment({ comment, onCommentAdded, onCommentDeleted, depth = 0 }) {
  const { user } = useAuth()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [replies, setReplies] = useState(comment.replies || [])

  const isOwnComment = user?.id === comment.user_id

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

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id)
        .eq('user_id', user.id)

      if (error) throw error

      if (onCommentDeleted) onCommentDeleted(comment.id)
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReplyAdded = (newReply) => {
    setReplies([...replies, newReply])
    setShowReplyForm(false)
    if (onCommentAdded) onCommentAdded(newReply)
  }

  const handleReplyDeleted = (replyId) => {
    setReplies(replies.filter(r => r.id !== replyId))
    if (onCommentDeleted) onCommentDeleted(replyId)
  }

  // Limit nesting depth to prevent excessive indentation
  const maxDepth = 5
  const isMaxDepth = depth >= maxDepth

  return (
    <div className={`comment ${depth > 0 ? 'comment-reply' : ''}`} style={{ marginLeft: depth > 0 ? '2rem' : '0' }}>
      <div className="comment-header">
        <div className="comment-author">
          <div className="comment-avatar">
            {comment.profiles?.profile_picture_url ? (
              <img
                src={comment.profiles.profile_picture_url}
                alt={`${comment.profiles.username}'s avatar`}
                className="comment-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div className="comment-avatar-initial" style={{ display: comment.profiles?.profile_picture_url ? 'none' : 'flex' }}>
              {comment.profiles?.username?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
          <div className="comment-author-info">
            <span className="comment-username">{comment.profiles?.username || 'Anonymous'}</span>
            <span className="comment-time">{formatDate(comment.created_at)}</span>
          </div>
        </div>
        {isOwnComment && (
          <button
            className="comment-delete-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete comment"
          >
            {isDeleting ? '...' : '×'}
          </button>
        )}
      </div>

      <div className="comment-content">
        {comment.content}
      </div>

      <div className="comment-actions">
        {!isMaxDepth && (
          <button
            className="comment-reply-btn"
            onClick={() => setShowReplyForm(!showReplyForm)}
          >
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        )}
      </div>

      {showReplyForm && (
        <div className="comment-reply-form">
          <CommentForm
            postId={comment.post_id}
            parentCommentId={comment.id}
            onCommentAdded={handleReplyAdded}
            onCancel={() => setShowReplyForm(false)}
            placeholder={`Reply to ${comment.profiles?.username}...`}
            autoFocus
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="comment-replies">
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onCommentAdded={onCommentAdded}
              onCommentDeleted={handleReplyDeleted}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
