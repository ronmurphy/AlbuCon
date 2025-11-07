import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './FollowButton.css'

export default function FollowButton({ userId, username, onFollowChange }) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingFollow, setCheckingFollow] = useState(true)

  // Check if current user is following this user
  useEffect(() => {
    if (!user || !userId || user.id === userId) {
      setCheckingFollow(false)
      return
    }

    const checkFollowStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .maybeSingle()

        if (error) throw error
        setIsFollowing(!!data)
      } catch (error) {
        console.error('Error checking follow status:', error)
      } finally {
        setCheckingFollow(false)
      }
    }

    checkFollowStatus()
  }, [user, userId])

  const handleFollowToggle = async () => {
    if (!user || loading) return

    setLoading(true)
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId)

        if (error) throw error
        setIsFollowing(false)
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          })

        if (error) throw error
        setIsFollowing(true)
      }

      if (onFollowChange) onFollowChange()
    } catch (error) {
      console.error('Error toggling follow:', error)
      alert('Failed to update follow status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Don't show button if not logged in, checking status, or viewing own profile
  if (!user || checkingFollow || user.id === userId) {
    return null
  }

  return (
    <button
      className={`follow-button ${isFollowing ? 'following' : ''}`}
      onClick={handleFollowToggle}
      disabled={loading}
      title={isFollowing ? `Unfollow ${username}` : `Follow ${username}`}
    >
      {loading ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
    </button>
  )
}
