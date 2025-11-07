import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import ConnectedServices from '../components/ConnectedServices'
import FollowStats from '../components/FollowStats'
import InviteCodeGenerator from '../components/InviteCodeGenerator'
import PWAInstall from '../components/PWAInstall'
import { contentTypes, platformTypes, defaultPreferences } from '../lib/contentTypes'
import './Profile.css'

export default function Profile({ onOpenGallery }) {
  const { user } = useAuth()
  const { currentTheme, openPreview, themes } = useTheme()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalPosts: 0, totalLikes: 0 })
  const [profilePicture, setProfilePicture] = useState(null)
  const [contentPreferences, setContentPreferences] = useState(defaultPreferences)
  const [savingPreferences, setSavingPreferences] = useState(false)

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
        .select('id, username, profile_picture_url, content_preferences')
        .eq('id', user.id)
        .single()

      if (profileError) console.error('Profile fetch error:', profileError)

      setProfilePicture(profileData?.profile_picture_url)

      // Load content preferences
      if (profileData?.content_preferences) {
        setContentPreferences(profileData.content_preferences)
      }

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
      const totalLikes = postsWithData.reduce((sum, post) => sum + (post.likes?.length || 0), 0)
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

  const saveContentPreferences = async (newPreferences) => {
    setSavingPreferences(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ content_preferences: newPreferences })
        .eq('id', user.id)

      if (error) throw error

      setContentPreferences(newPreferences)
    } catch (error) {
      console.error('Error saving content preferences:', error)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setSavingPreferences(false)
    }
  }

  const toggleContentType = (typeId) => {
    const newPreferences = {
      ...contentPreferences,
      [typeId]: !contentPreferences[typeId]
    }
    saveContentPreferences(newPreferences)
  }

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

        {/* View Gallery Button */}
        {onOpenGallery && (
          <button
            className="btn btn-primary view-gallery-btn"
            onClick={() => onOpenGallery(user?.id, user?.user_metadata?.username)}
          >
            📷 View Gallery
          </button>
        )}

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

      {/* Theme Selector */}
      <div className="theme-section card">
        <h2 className="section-title">Theme</h2>
        <p className="section-description">Choose your preferred color theme</p>
        <div className="theme-grid">
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
              onClick={() => openPreview(theme.id)}
              title={`Preview ${theme.description}`}
            >
              <div className="theme-preview" style={{
                background: `linear-gradient(135deg, ${theme.preview.bg} 0%, ${theme.preview.accent} 100%)`
              }}>
                <span className="theme-icon">{theme.icon}</span>
              </div>
              <div className="theme-info">
                <div className="theme-name">{theme.name}</div>
                <div className="theme-description">{theme.description}</div>
              </div>
              {currentTheme === theme.id && (
                <div className="theme-check">✓</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* PWA Install */}
      <PWAInstall />

      {/* Content Preferences */}
      <div className="content-preferences-section card">
        <h2 className="section-title">Content Preferences</h2>
        <p className="section-description">Choose what types of content you want to see in your feed</p>
        <div className="preferences-grid">
          {contentTypes.map((type) => (
            <button
              key={type.id}
              className={`preference-option ${contentPreferences[type.id] ? 'enabled' : 'disabled'}`}
              onClick={() => toggleContentType(type.id)}
              disabled={savingPreferences}
              title={type.description}
            >
              <div className="preference-icon" style={{ color: type.color }}>
                {type.icon}
              </div>
              <div className="preference-info">
                <div className="preference-name">{type.name}</div>
                <div className="preference-description">{type.description}</div>
              </div>
              <div className="preference-toggle">
                {contentPreferences[type.id] ? '✓ Visible' : '✕ Hidden'}
              </div>
            </button>
          ))}
        </div>
        <p className="preferences-note">
          💡 Hidden content will show as placeholders like "A post was shared (Political)"
        </p>
      </div>

      {/* Platform Preferences */}
      <div className="content-preferences-section card">
        <h2 className="section-title">Platform Filtering</h2>
        <p className="section-description">Choose which external platforms you want to see posts from</p>
        <div className="preferences-grid">
          {platformTypes.map((type) => (
            <button
              key={type.id}
              className={`preference-option ${contentPreferences[type.id] ? 'enabled' : 'disabled'}`}
              onClick={() => toggleContentType(type.id)}
              disabled={savingPreferences}
              title={type.description}
            >
              <div className="preference-icon" style={{ color: type.color }}>
                {type.icon}
              </div>
              <div className="preference-info">
                <div className="preference-name">{type.name}</div>
                <div className="preference-description">{type.description}</div>
              </div>
              <div className="preference-toggle">
                {contentPreferences[type.id] ? '✓ Visible' : '✕ Hidden'}
              </div>
            </button>
          ))}
        </div>
        <p className="preferences-note">
          💡 Hide posts from specific platforms. You can still follow accounts, but won't see their posts.
        </p>
      </div>

      {/* Connected Services */}
      <ConnectedServices />

      {/* Invite Friends */}
      <InviteCodeGenerator />

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
