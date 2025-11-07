import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CreatePost from '../components/CreatePost'
import PostCard from '../components/PostCard'
import ExternalPostCard from '../components/ExternalPostCard'
import FilteredPostCard from '../components/FilteredPostCard'
import { defaultPreferences } from '../lib/contentTypes'
import { fetchAllBlueskyFeeds, getExternalPosts } from '../services/blueskyService'
import './Home.css'

export default function Home({ onMinimize, onImageClick }) {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [externalPosts, setExternalPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [contentPreferences, setContentPreferences] = useState(defaultPreferences)

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

  const fetchExternalPosts = async () => {
    if (!user) return

    try {
      const data = await getExternalPosts(user.id, 50)
      setExternalPosts(data || [])
    } catch (error) {
      console.error('Error fetching external posts:', error)
    }
  }

  const refreshFeeds = async () => {
    if (!user || refreshing) return

    setRefreshing(true)
    try {
      const newPostsCount = await fetchAllBlueskyFeeds(user.id)
      if (newPostsCount > 0) {
        await fetchExternalPosts()
        alert(`✓ Fetched ${newPostsCount} new posts from Bluesky!`)
      } else {
        alert('No new posts found')
      }
    } catch (error) {
      console.error('Error refreshing feeds:', error)
      alert('Failed to refresh feeds. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  // Merge and sort all posts by date
  const getAllPosts = () => {
    const internalPosts = posts.map(p => ({ ...p, type: 'internal' }))
    const external = externalPosts.map(p => ({ ...p, type: 'external' }))

    const combined = [...internalPosts, ...external]

    // Sort by date (newest first)
    combined.sort((a, b) => {
      const dateA = new Date(a.type === 'internal' ? a.created_at : a.posted_at)
      const dateB = new Date(b.type === 'internal' ? b.created_at : b.posted_at)
      return dateB - dateA
    })

    return combined
  }

  useEffect(() => {
    fetchPosts()
    fetchExternalPosts()
    loadUserPreferences()
  }, [user])

  if (loading) {
    return (
      <div className="container home-page">
        <div className="spinner"></div>
      </div>
    )
  }

  const allPosts = getAllPosts()

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

      {/* Refresh Feeds Button */}
      <div className="feed-controls">
        <button
          className="refresh-feeds-btn"
          onClick={refreshFeeds}
          disabled={refreshing}
          title="Fetch latest posts from connected services"
        >
          {refreshing ? '🔄 Refreshing...' : '🔄 Refresh Feeds'}
        </button>
        {externalPosts.length > 0 && (
          <span className="external-posts-count">
            {externalPosts.length} post{externalPosts.length !== 1 ? 's' : ''} from external services
          </span>
        )}
      </div>

      <div className="feed">
        {allPosts.length === 0 ? (
          <div className="empty-feed card">
            <p>No posts yet. Be the first to share something positive! 🌟</p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Or add a Bluesky user in your Profile → Connected Services
            </p>
          </div>
        ) : (
          allPosts.map((post) => {
            const contentType = post.content_type || 'general'
            const isContentVisible = contentPreferences[contentType]

            // Check content type visibility
            if (!isContentVisible) {
              return <FilteredPostCard key={`${post.type}-${post.id}`} contentType={contentType} />
            }

            // For external posts, also check platform filtering
            if (post.type === 'external') {
              const platformKey = `platform_${post.platform}`
              const isPlatformVisible = contentPreferences[platformKey] !== false

              // If platform is hidden, show filtered card
              if (!isPlatformVisible) {
                return (
                  <div key={`filtered-platform-${post.id}`} className="filtered-post-card card">
                    <div className="filtered-content">
                      <span className="filtered-icon">🔇</span>
                      <div className="filtered-text">
                        <p className="filtered-message">
                          Post from {post.platform} hidden
                        </p>
                        <p className="filtered-hint">
                          You've chosen not to see posts from {post.platform}.
                          <br />
                          Change this in your Profile → Platform Filtering.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <ExternalPostCard
                  key={`external-${post.id}`}
                  post={post}
                  onImageClick={onImageClick}
                />
              )
            }

            // Render internal posts normally
            return (
              <PostCard
                key={`internal-${post.id}`}
                post={post}
                onLikeUpdate={fetchPosts}
                onImageClick={onImageClick}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
