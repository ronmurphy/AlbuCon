import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CommentsSection from './CommentsSection'
import FollowButton from './FollowButton'
import VideoEmbed from './VideoEmbed'
import ImageCarousel from './ImageCarousel'
import { reactionTypesArray, countReactionsByType, getUserReaction, getTotalReactionCount } from '../utils/reactionTypes'
import './PostCard.css'

export default function PostCard({ post, onLikeUpdate, onImageClick, onPostDeleted, onOpenUserTimeline }) {
  const { user } = useAuth()
  const [isLiking, setIsLiking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(post.content)
  const [isSaving, setIsSaving] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  // Check if current user has reacted and get reaction counts
  const userReaction = getUserReaction(post.likes, user?.id)
  const hasReacted = userReaction !== null
  const reactionCounts = countReactionsByType(post.likes)
  const totalReactions = getTotalReactionCount(post.likes)
  const isOwnPost = user?.id === post.user_id

  // Check if post is editable (within 15 minutes of creation)
  const canEdit = () => {
    if (!isOwnPost) return false
    const postTime = new Date(post.created_at)
    const now = new Date()
    const minutesSincePost = (now - postTime) / (1000 * 60)
    return minutesSincePost <= 15
  }

  const handleReaction = async (reactionType) => {
    if (!user || isLiking) return

    setIsLiking(true)
    setShowReactionPicker(false)

    try {
      // If user already reacted with this type, remove the reaction
      if (userReaction === reactionType) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ post_id: post.id, user_id: user.id })

        if (error) throw error
      } else {
        // If user has a different reaction, delete old one first
        if (hasReacted) {
          const { error: deleteError } = await supabase
            .from('likes')
            .delete()
            .match({ post_id: post.id, user_id: user.id })

          if (deleteError) throw deleteError
        }

        // Insert new reaction
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
            reaction_type: reactionType
          })

        if (error) throw error
      }

      // Refresh the post data
      if (onLikeUpdate) onLikeUpdate()
    } catch (error) {
      console.error('Error toggling reaction:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditedContent(post.content)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedContent(post.content)
  }

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) {
      alert('Post content cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: editedContent.trim(),
          edited_at: new Date().toISOString()
        })
        .eq('id', post.id)
        .eq('user_id', user.id)

      if (error) throw error

      setIsEditing(false)
      if (onLikeUpdate) onLikeUpdate() // Refresh to show updated content
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Failed to update post. Please try again.')
    } finally {
      setIsSaving(false)
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
          <div
            className="author-avatar"
            onClick={() => onOpenUserTimeline?.(post.user_id, post.profiles?.username, post.profiles?.profile_picture_url)}
            style={{ cursor: onOpenUserTimeline ? 'pointer' : 'default' }}
            title={`View ${post.profiles?.username}'s profile`}
          >
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
            <div
              className="author-name"
              onClick={() => onOpenUserTimeline?.(post.user_id, post.profiles?.username, post.profiles?.profile_picture_url)}
              style={{ cursor: onOpenUserTimeline ? 'pointer' : 'default' }}
              title={`View ${post.profiles?.username}'s profile`}
            >
              {post.profiles?.username || 'Anonymous'}
            </div>
            <div className="post-time">
              {formatDate(post.created_at)}
              {post.edited_at && <span className="edited-indicator"> (edited)</span>}
            </div>
          </div>
          {!isOwnPost && (
            <FollowButton
              userId={post.user_id}
              username={post.profiles?.username}
            />
          )}
        </div>
        {isOwnPost && (
          <div className="post-actions">
            {canEdit() && !isEditing && (
              <button
                className="post-edit-btn"
                onClick={handleEdit}
                title="Edit post (within 15 minutes)"
              >
                ✏️
              </button>
            )}
            <button
              className="post-delete-btn"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete post"
            >
              {isDeleting ? '...' : '🗑️'}
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="post-edit-form">
          <textarea
            className="post-edit-textarea"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            disabled={isSaving}
            placeholder="Edit your post..."
          />
          <div className="post-edit-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveEdit}
              disabled={isSaving || !editedContent.trim()}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="post-content">
          {post.content}
        </div>
      )}

      {/* Display images if present (supports both new array and legacy single image) */}
      {(() => {
        // Get images from new array format or fall back to old single image
        const images = post.image_urls && post.image_urls.length > 0
          ? post.image_urls
          : post.image_url
            ? [post.image_url]
            : []

        return images.length > 0 ? (
          <ImageCarousel images={images} onImageClick={onImageClick} />
        ) : null
      })()}

      {/* Display video embed if URL detected in content (YouTube, TikTok, Vimeo) */}
      <VideoEmbed content={post.content} />

      <div className="post-footer">
        <div className="reactions-container">
          {/* Main reaction button */}
          <button
            className={`reaction-button ${hasReacted ? 'reacted' : ''}`}
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            disabled={!user || isLiking}
            title={hasReacted ? 'Change your reaction' : 'Add a reaction'}
          >
            <span className="reaction-icon">
              {hasReacted
                ? reactionTypesArray.find(r => r.id === userReaction)?.emoji
                : '🤍'}
            </span>
            <span className="reaction-count">{totalReactions}</span>
          </button>

          {/* Reaction picker */}
          {showReactionPicker && (
            <div className="reaction-picker">
              {reactionTypesArray.map((reaction) => (
                <button
                  key={reaction.id}
                  className={`reaction-option ${userReaction === reaction.id ? 'active' : ''}`}
                  onClick={() => handleReaction(reaction.id)}
                  disabled={isLiking}
                  title={reaction.description}
                >
                  <span className="reaction-emoji">{reaction.emoji}</span>
                  {reactionCounts[reaction.id] > 0 && (
                    <span className="reaction-option-count">{reactionCounts[reaction.id]}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Reaction breakdown - show if there are reactions */}
          {totalReactions > 0 && (
            <div className="reaction-breakdown">
              {reactionTypesArray.map((reaction) => {
                const count = reactionCounts[reaction.id]
                if (count === 0) return null
                return (
                  <span key={reaction.id} className="reaction-summary" title={`${count} ${reaction.label}`}>
                    {reaction.emoji} {count}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <CommentsSection postId={post.id} />
    </div>
  )
}
