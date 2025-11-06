import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CreatePost from '../components/CreatePost'
import PostCard from '../components/PostCard'
import './Home.css'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username),
          likes (user_id)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  if (loading) {
    return (
      <div className="container home-page">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="container home-page">
      <div className="welcome-banner">
        <h1 className="welcome-title">Welcome to AlbuCon ✨</h1>
        <p className="welcome-subtitle">
          A space for sharing positive vibes, gratitude, and joy!
        </p>
      </div>

      <CreatePost onPostCreated={fetchPosts} />

      <div className="feed">
        {posts.length === 0 ? (
          <div className="empty-feed card">
            <p>No posts yet. Be the first to share something positive! 🌟</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeUpdate={fetchPosts} />
          ))
        )}
      </div>
    </div>
  )
}
