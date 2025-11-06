import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import './UserTimeline.css'

export default function UserTimeline({ userId, username, profilePicture, onClose, onImageClick }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)

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

  useEffect(() => {
    if (userId) {
      fetchUserPosts()
    }
  }, [userId])

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
      </div>

      {/* User's Posts */}
      <div className="user-feed">
        {posts.length === 0 ? (
          <div className="empty-feed card">
            <p>No posts yet from this user.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeUpdate={fetchUserPosts} onImageClick={onImageClick} />
          ))
        )}
      </div>
    </div>
  )
}
