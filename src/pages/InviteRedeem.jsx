import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './InviteRedeem.css'

export default function InviteRedeem() {
  const { code } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)
  const [inviteData, setInviteData] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Fetch invite code details
  useEffect(() => {
    if (!code) {
      setError('Invalid invite code')
      setLoading(false)
      return
    }

    const fetchInviteCode = async () => {
      try {
        const { data, error } = await supabase
          .from('invite_codes')
          .select(`
            *,
            profile:user_id (id, username, profile_picture_url)
          `)
          .eq('code', code.toUpperCase())
          .maybeSingle()

        if (error) throw error

        if (!data) {
          setError('Invite code not found')
          return
        }

        // Check if expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setError('This invite code has expired')
          return
        }

        // Check if max uses reached
        if (data.max_uses && data.uses_count >= data.max_uses) {
          setError('This invite code has reached its maximum uses')
          return
        }

        setInviteData(data)
      } catch (error) {
        console.error('Error fetching invite code:', error)
        setError('Failed to load invite code')
      } finally {
        setLoading(false)
      }
    }

    fetchInviteCode()
  }, [code])

  // Redeem invite code
  const handleRedeem = async () => {
    if (!user) {
      // Redirect to signup with invite code in state
      navigate('/signup', { state: { inviteCode: code } })
      return
    }

    if (!inviteData || redeeming) return

    // Can't use own invite code
    if (user.id === inviteData.user_id) {
      setError("You can't use your own invite code!")
      return
    }

    setRedeeming(true)
    try {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', inviteData.user_id)
        .maybeSingle()

      if (existingFollow) {
        setError('You are already following this user')
        setRedeeming(false)
        return
      }

      // Create mutual follows
      const { error: followError } = await supabase
        .from('follows')
        .insert([
          { follower_id: user.id, following_id: inviteData.user_id },
          { follower_id: inviteData.user_id, following_id: user.id }
        ])

      if (followError) throw followError

      // Increment invite code usage
      const { error: updateError } = await supabase
        .from('invite_codes')
        .update({ uses_count: inviteData.uses_count + 1 })
        .eq('id', inviteData.id)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error) {
      console.error('Error redeeming invite:', error)
      setError('Failed to redeem invite code. Please try again.')
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return (
      <div className="container invite-redeem-page">
        <div className="invite-redeem-card card">
          <div className="loading-spinner">Loading invite...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container invite-redeem-page">
        <div className="invite-redeem-card card error">
          <div className="error-icon">⚠️</div>
          <h2>Oops!</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container invite-redeem-page">
        <div className="invite-redeem-card card success">
          <div className="success-icon">✓</div>
          <h2>Welcome!</h2>
          <p>You and {inviteData.profile?.username} are now following each other!</p>
          <p className="redirect-message">Redirecting to home...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container invite-redeem-page">
      <div className="invite-redeem-card card">
        <div className="invite-header">
          <div className="inviter-avatar">
            {inviteData.profile?.profile_picture_url ? (
              <img src={inviteData.profile.profile_picture_url} alt="Profile" />
            ) : (
              <div className="avatar-initial">
                {inviteData.profile?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <h2>{inviteData.profile?.username} invited you!</h2>
          <p className="invite-message">
            Join The Sphere and follow each other to stay connected
          </p>
        </div>

        <div className="invite-code-display">
          <span className="invite-code">{inviteData.code}</span>
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={handleRedeem}
          disabled={redeeming}
        >
          {!user
            ? 'Sign Up & Accept Invite'
            : redeeming
            ? 'Accepting...'
            : 'Accept Invite'}
        </button>

        {!user && (
          <p className="login-prompt">
            Already have an account?{' '}
            <a href="/login" onClick={(e) => {
              e.preventDefault()
              navigate('/login', { state: { inviteCode: code } })
            }}>
              Log in here
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
