import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CommentsSection from './CommentsSection'
import FollowButton from './FollowButton'
import YouTubeEmbed from './YouTubeEmbed'
import { extractYouTubeVideoId } from '../utils/youtubeUtils'
import './PostCard.css'

export default function PostCard({ post, onLikeUpdate, onImageClick, onPostDeleted }) {
  const { user } = useAuth()
  const [isLiking, setIsLiking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Check if current user has liked this post
  const hasLiked = post.likes?.some(like => like.user_id === user?.id)
  const likeCount = post.likes?.length || 0
  const isOwnPost = user?.id === post.user_id

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

  const handleDelete = async () => {
    if (!confirm('Delete this post? This will also delete all comments and likes.')) return

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user.id)

      if (error) throw error

      if (onPostDeleted) onPostDeleted(post.id)
      if (onLikeUpdate) onLikeUpdate()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post. Please try again.')
    } finally {
      setIsDeleting(false)
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
            {post.profiles?.profile_picture_url ? (
              <img
                src={post.profiles.profile_picture_url}
                alt={`${post.profiles?.username}'s profile`}
                className="author-profile-pic"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div className="author-initial" style={{ display: post.profiles?.profile_picture_url ? 'none' : 'flex' }}>
              {post.profiles?.username?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
          <div className="author-info">
            <div className="author-name">
              {post.profiles?.username || 'Anonymous'}
            </div>
            <div className="post-time">{formatDate(post.created_at)}</div>
          </div>
          {!isOwnPost && (
            <FollowButton
              userId={post.user_id}
              username={post.profiles?.username}
            />
          )}
        </div>
        {isOwnPost && (
          <button
            className="post-delete-btn"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete post"
          >
            {isDeleting ? '...' : '🗑️'}
          </button>
        )}
      </div>

      <div className="post-content">
        {post.content}
      </div>

      {/* Display image if present */}
      {post.image_url && (
        <div
          className="post-image-container"
          onClick={() => onImageClick?.(post.image_url, 'Post image')}
          style={{ cursor: onImageClick ? 'pointer' : 'default' }}
        >
          <img
            src={post.image_url}
            alt="Post image"
            className="post-image"
            onError={(e) => {
              e.target.style.display = 'none'
              console.error('Failed to load image:', post.image_url)
            }}
          />
        </div>
      )}

      {/* Display YouTube embed if URL detected in content */}
      {(() => {
        const youtubeVideoId = extractYouTubeVideoId(post.content)
        return youtubeVideoId ? <YouTubeEmbed videoId={youtubeVideoId} /> : null
      })()}

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

      {/* Comments Section */}
      <CommentsSection postId={post.id} />
    </div>
  )
}
