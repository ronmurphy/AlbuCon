import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './PostCard.css'

export default function PostCard({ post, onLikeUpdate }) {
  const { user } = useAuth()
  const [isLiking, setIsLiking] = useState(false)

  // Check if current user has liked this post
  const hasLiked = post.likes?.some(like => like.user_id === user?.id)
  const likeCount = post.likes?.length || 0

  const handleLike = async () => {
    if (!user || isLiking) return

    setIsLiking(true)

    try {
      if (hasLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ post_id: post.id, user_id: user.id })

        if (error) throw error
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: user.id })

        if (error) throw error
      }

      // Refresh the post data
      if (onLikeUpdate) onLikeUpdate()
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setIsLiking(false)
    }
  }

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

  return (
    <div className="post-card card fade-in">
      <div className="post-header">
        <div className="post-author">
          <div className="author-avatar">
            {post.profiles?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="author-info">
            <div className="author-name">
              {post.profiles?.username || 'Anonymous'}
            </div>
            <div className="post-time">{formatDate(post.created_at)}</div>
          </div>
        </div>
      </div>

      <div className="post-content">
        {post.content}
      </div>

      <div className="post-footer">
        <button
          className={`like-button ${hasLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={!user || isLiking}
        >
          <span className="like-icon">{hasLiked ? '❤️' : '🤍'}</span>
          <span className="like-count">{likeCount}</span>
        </button>
      </div>
    </div>
  )
}
