import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Comment from './Comment'
import CommentForm from './CommentForm'
import './CommentsSection.css'

export default function CommentsSection({ postId, initialCommentCount = 0 }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(initialCommentCount)

  useEffect(() => {
    if (showComments) {
      fetchComments()
    }
  }, [showComments, postId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            profile_picture_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Organize comments into threaded structure
      const commentMap = {}
      const rootComments = []

      // First pass: create map of all comments
      data.forEach(comment => {
        commentMap[comment.id] = { ...comment, replies: [] }
      })

      // Second pass: organize into tree
      data.forEach(comment => {
        if (comment.parent_comment_id) {
          // This is a reply
          const parent = commentMap[comment.parent_comment_id]
          if (parent) {
            parent.replies.push(commentMap[comment.id])
          }
        } else {
          // This is a top-level comment
          rootComments.push(commentMap[comment.id])
        }
      })

      setComments(rootComments)
      setCommentCount(data.length)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCommentAdded = (newComment) => {
    // Refresh comments to get updated counts and nested structure
    fetchComments()
  }

  const handleCommentDeleted = (commentId) => {
    // Refresh comments to get updated counts
    fetchComments()
  }

  const toggleComments = () => {
    setShowComments(!showComments)
  }

  return (
    <div className="comments-section">
      <button className="comments-toggle" onClick={toggleComments}>
        💬 {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
        <span className="comments-toggle-icon">{showComments ? '▼' : '▶'}</span>
      </button>

      {showComments && (
        <div className="comments-content">
          <div className="comments-form-section">
            <CommentForm
              postId={postId}
              onCommentAdded={handleCommentAdded}
            />
          </div>

          {loading ? (
            <div className="comments-loading">
              <div className="spinner"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="comments-list">
              {comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  onCommentAdded={handleCommentAdded}
                  onCommentDeleted={handleCommentDeleted}
                  depth={0}
                />
              ))}
            </div>
          ) : (
            <div className="comments-empty">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
