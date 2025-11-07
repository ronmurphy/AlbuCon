import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './FollowStats.css'

export default function FollowStats({ userId }) {
  const [stats, setStats] = useState({ followerCount: 0, followingCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        // Get follower count
        const { count: followerCount, error: followerError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId)

        if (followerError) throw followerError

        // Get following count
        const { count: followingCount, error: followingError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId)

        if (followingError) throw followingError

        setStats({
          followerCount: followerCount || 0,
          followingCount: followingCount || 0
        })
      } catch (error) {
        console.error('Error fetching follow stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId])

  if (loading) {
    return <div className="follow-stats loading">Loading stats...</div>
  }

  return (
    <div className="follow-stats">
      <div className="stat-item">
        <span className="stat-count">{stats.followerCount}</span>
        <span className="stat-label">Followers</span>
      </div>
      <div className="stat-divider"></div>
      <div className="stat-item">
        <span className="stat-count">{stats.followingCount}</span>
        <span className="stat-label">Following</span>
      </div>
    </div>
  )
}
