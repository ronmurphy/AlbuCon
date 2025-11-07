import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import PostCard from '../components/PostCard'
import FilteredPostCard from '../components/FilteredPostCard'
import { defaultPreferences } from '../lib/contentTypes'
import './UserTimeline.css'

export default function UserTimeline({ userId, username, profilePicture, onClose, onImageClick, onOpenGallery, onOpenDirectMessage }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [contentPreferences, setContentPreferences] = useState(defaultPreferences)

  const fetchUserPosts = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError
      setUserProfile(profileData)

      // Fetch user's posts with profiles and likes
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      // Fetch likes separately
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('post_id, user_id')

      if (likesError) throw likesError

      // Combine the data
      const postsWithData = postsData.map(post => ({
        ...post,
        profiles: profileData,
        likes: likesData.filter(l => l.post_id === post.id)
      }))

      setPosts(postsWithData || [])
    } catch (error) {
      console.error('Error fetching user posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const loadUserPreferences = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('content_preferences')
        .eq('id', user.id)
        .single()

      if (!error && data?.content_preferences) {
        setContentPreferences(data.content_preferences)
      }
    } catch (error) {
      console.error('Error loading content preferences:', error)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUserPosts()
    }
    loadUserPreferences()
  }, [userId, user])

  if (loading) {
    return (
      <div className="container user-timeline-page">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="container user-timeline-page">
      {onClose && (
        <button
          className="close-column-btn"
          onClick={onClose}
          title="Close column"
        >
          ✕
        </button>
      )}

      {/* User Header */}
      <div className="user-header">
        <div className="user-avatar">
          {profilePicture || userProfile?.profile_picture_url ? (
            <img
              src={profilePicture || userProfile?.profile_picture_url}
              alt={username || userProfile?.username}
              className="user-profile-pic"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div className="user-initial" style={(profilePicture || userProfile?.profile_picture_url) ? { display: 'none' } : {}}>
            {(username || userProfile?.username)?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
        <h2 className="user-display-name">{username || userProfile?.username || 'Unknown User'}</h2>
        <p className="user-post-count">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>
        <div className="user-actions">
          {onOpenGallery && (
            <button
              className="btn btn-primary"
              onClick={() => onOpenGallery(userId, username || userProfile?.username)}
            >
              📷 Gallery
            </button>
          )}
          {onOpenDirectMessage && (
            <button
              className="btn btn-secondary"
              onClick={() => onOpenDirectMessage(userId, username || userProfile?.username, profilePicture || userProfile?.profile_picture_url)}
            >
              💬 Message
            </button>
          )}
        </div>
      </div>

      {/* User's Posts */}
      <div className="user-feed">
        {posts.length === 0 ? (
          <div className="empty-feed card">
            <p>No posts yet from this user.</p>
          </div>
        ) : (
          posts.map((post) => {
            const contentType = post.content_type || 'general'
            const isVisible = contentPreferences[contentType]

            if (!isVisible) {
              return <FilteredPostCard key={post.id} contentType={contentType} />
            }

            return (
              <PostCard
                key={post.id}
                post={post}
                onLikeUpdate={fetchUserPosts}
                onImageClick={onImageClick}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
