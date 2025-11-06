import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import './Profile.css'

export default function Profile() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalPosts: 0, totalLikes: 0 })

  const fetchUserPosts = async () => {
    if (!user) return

    try {
      // Fetch user's posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (username),
          likes (user_id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      setPosts(postsData || [])

      // Calculate stats
      const totalPosts = postsData?.length || 0
      const totalLikes = postsData?.reduce((sum, post) => sum + (post.likes?.length || 0), 0) || 0
      setStats({ totalPosts, totalLikes })
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
          {user?.user_metadata?.username?.[0]?.toUpperCase() || '?'}
        </div>
        <h1 className="profile-username">
          {user?.user_metadata?.username || 'Anonymous'}
        </h1>
        <p className="profile-email">{user?.email}</p>

        <div className="profile-stats">
          <div className="stat">
            <div className="stat-value">{stats.totalPosts}</div>
            <div className="stat-label">Posts</div>
          </div>
          <div className="stat">
            <div className="stat-value">{stats.totalLikes}</div>
            <div className="stat-label">Likes Received</div>
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
