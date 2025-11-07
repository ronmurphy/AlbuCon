import VideoPlayer from './VideoPlayer'
import YouTubeEmbed from './YouTubeEmbed'
import { extractYouTubeVideoId } from '../utils/youtubeUtils'
import './ExternalPostCard.css'

const PLATFORM_INFO = {
  bluesky: {
    name: 'Bluesky',
    icon: '🦋',
    color: '#1185fe'
  },
  mastodon: {
    name: 'Mastodon',
    icon: '🐘',
    color: '#6364ff'
  },
  reddit: {
    name: 'Reddit',
    icon: '🤖',
    color: '#ff4500'
  }
}

export default function ExternalPostCard({ post, onImageClick }) {
  const platform = PLATFORM_INFO[post.platform] || {}

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
    <div className="external-post-card card fade-in">
      {/* Platform Badge */}
      <div className="platform-badge" style={{ borderColor: platform.color }}>
        <span className="platform-icon">{platform.icon}</span>
        <span className="platform-name">from {platform.name}</span>
      </div>

      <div className="post-header">
        <div className="post-author">
          <div className="author-avatar">
            {post.author_avatar ? (
              <img
                src={post.author_avatar}
                alt={`${post.author_name}'s avatar`}
                className="author-profile-pic"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div className="author-initial" style={{ display: post.author_avatar ? 'none' : 'flex' }}>
              {post.author_name?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
          <div className="author-info">
            <div className="author-name">{post.author_name}</div>
            <div className="author-handle">@{post.author_handle}</div>
            <div className="post-time">{formatDate(post.posted_at)}</div>
          </div>
        </div>
      </div>

      <div className="post-content">
        {post.content}
      </div>

      {/* Display image if present */}
      {post.image_url && (
        <div
          className="post-image-container"
          onClick={() => onImageClick?.(post.image_url, 'External post image')}
          style={{ cursor: onImageClick ? 'pointer' : 'default' }}
        >
          <img
            src={post.image_url}
            alt="Post image"
            className="post-image"
            onError={(e) => {
              e.target.style.display = 'none'
              console.error('Failed to load external image:', post.image_url)
            }}
          />
        </div>
      )}

      {/* Display video if present */}
      {post.video_url && (
        <div className="post-video-container">
          <VideoPlayer src={post.video_url} className="post-video" />
        </div>
      )}

      {/* Display YouTube embed if URL detected in content */}
      {(() => {
        const youtubeVideoId = extractYouTubeVideoId(post.content)
        return youtubeVideoId ? <YouTubeEmbed videoId={youtubeVideoId} /> : null
      })()}

      <div className="post-footer">
        <a
          href={post.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="view-original-link"
          style={{ color: platform.color }}
        >
          View original on {platform.name} →
        </a>
      </div>
    </div>
  )
}
