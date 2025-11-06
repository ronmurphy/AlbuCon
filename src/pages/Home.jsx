import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CreatePost from '../components/CreatePost'
import PostCard from '../components/PostCard'
import './Home.css'

export default function Home({ onMinimize, onImageClick }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = async () => {
    try {
      // Fetch posts with profiles and likes using manual join
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (postsError) throw postsError

      // Fetch profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url')

      if (profilesError) throw profilesError

      // Fetch likes separately
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('post_id, user_id')

      if (likesError) throw likesError

      // Combine the data
      const postsWithData = postsData.map(post => ({
        ...post,
        profiles: profilesData.find(p => p.id === post.user_id),
        likes: likesData.filter(l => l.post_id === post.id)
      }))

      console.log('Fetched posts with profiles:', postsWithData)
      setPosts(postsWithData || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      // Fallback: show posts without additional data
      try {
        const { data: simplePosts, error: simpleError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (!simpleError && simplePosts) {
          console.log('Fallback: Fetched posts without profiles:', simplePosts)
          setPosts(simplePosts.map(p => ({ ...p, likes: [] })))
        }
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
      }
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
      {onMinimize && (
        <button
          className="minimize-feed-btn"
          onClick={onMinimize}
          title="Minimize feed to dock"
        >
          ➖
        </button>
      )}

      <CreatePost onPostCreated={fetchPosts} />

      <div className="feed">
        {posts.length === 0 ? (
          <div className="empty-feed card">
            <p>No posts yet. Be the first to share something positive! 🌟</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeUpdate={fetchPosts} onImageClick={onImageClick} />
          ))
        )}
      </div>
    </div>
  )
}
