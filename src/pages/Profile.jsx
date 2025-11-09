import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import FollowStats from '../components/FollowStats'
import './Profile.css'

export default function Profile({ onOpenSettings, onOpenGallery, onOpenDirectMessage }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalPosts: 0, totalReactions: 0 })
  const [profilePicture, setProfilePicture] = useState(null)

  const fetchUserPosts = async () => {
    if (!user) return

    try {
      // Fetch user's posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url')
        .eq('id', user.id)
        .single()

      if (profileError) console.error('Profile fetch error:', profileError)

      setProfilePicture(profileData?.profile_picture_url)

      // Fetch all likes for these posts
      const postIds = postsData.map(p => p.id)
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('post_id, user_id')
        .in('post_id', postIds)

      if (likesError) console.error('Likes fetch error:', likesError)

      // Combine the data
      const postsWithData = postsData.map(post => ({
        ...post,
        profiles: profileData,
        likes: likesData?.filter(l => l.post_id === post.id) || []
      }))

      setPosts(postsWithData || [])

      // Calculate stats
      const totalPosts = postsWithData.length
      const totalReactions = postsWithData.reduce((sum, post) => sum + (post.likes?.length || 0), 0)
      setStats({ totalPosts, totalReactions })
    } catch (error) {
      console.error('Error fetching profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserPosts()
  }, [user])

  if (loading) {
    return (
      <div className="container profile-page">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="container profile-page">
      <div className="profile-header card">
        <div className="profile-avatar-large">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile picture"
              className="profile-picture-img"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div className="profile-initial" style={{ display: profilePicture ? 'none' : 'flex' }}>
            {user?.user_metadata?.username?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
        <h1 className="profile-username">
          {user?.user_metadata?.username || 'Anonymous'}
        </h1>
        <p className="profile-email">{user?.email}</p>

        {/* Follow Stats */}
        <FollowStats userId={user?.id} />

        {/* Action Buttons */}
        <div className="profile-action-buttons">
          {onOpenGallery && (
            <button className="btn btn-primary" onClick={() => onOpenGallery(user?.id, user?.user_metadata?.username)}>
              📷 My Images
            </button>
          )}
          {onOpenDirectMessage && (
            <button className="btn btn-secondary" onClick={() => onOpenDirectMessage(user?.id, user?.user_metadata?.username, profilePicture)}>
              💬 Message Myself
            </button>
          )}
          {onOpenSettings && (
            <button className="btn btn-secondary" onClick={onOpenSettings}>
              ⚙️ Settings
            </button>
          )}
        </div>

        <div className="profile-stats">
          <div className="stat">
            <div className="stat-value">{stats.totalPosts}</div>
            <div className="stat-label">Posts</div>
          </div>
          <div className="stat">
            <div className="stat-value">{stats.totalReactions}</div>
            <div className="stat-label">Reactions Received</div>
          </div>
        </div>
      </div>

      <div className="profile-posts">
        <h2 className="section-title">Your Posts</h2>
        {posts.length === 0 ? (
          <div className="empty-posts card">
            <p>You haven't posted anything yet. Share your first positive thought! ✨</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeUpdate={fetchUserPosts} />
          ))
        )}
      </div>
    </div>
  )
}
