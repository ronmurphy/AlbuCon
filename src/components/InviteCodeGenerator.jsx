import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './InviteCodeGenerator.css'

export default function InviteCodeGenerator() {
  const { user } = useAuth()
  const [inviteCode, setInviteCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Generate a random code
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed ambiguous chars
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }

  // Fetch existing invite code
  useEffect(() => {
    if (!user) return

    const fetchInviteCode = async () => {
      try {
        const { data, error } = await supabase
          .from('invite_codes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') throw error
        setInviteCode(data)
      } catch (error) {
        console.error('Error fetching invite code:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInviteCode()
  }, [user])

  // Generate new invite code
  const handleGenerate = async () => {
    if (!user || generating) return

    setGenerating(true)
    try {
      const code = generateRandomCode()
      const { data, error } = await supabase
        .from('invite_codes')
        .insert({
          user_id: user.id,
          code: code,
          uses_count: 0,
          max_uses: null, // Unlimited
          expires_at: null // Never expires
        })
        .select()
        .single()

      if (error) throw error
      setInviteCode(data)
    } catch (error) {
      console.error('Error generating invite code:', error)
      alert('Failed to generate invite code. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Copy invite link to clipboard
  const handleCopy = async () => {
    if (!inviteCode) return

    const inviteLink = `${window.location.origin}${import.meta.env.BASE_URL}invite/${inviteCode.code}`
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      alert('Failed to copy link. Please copy it manually.')
    }
  }

  if (loading) {
    return <div className="invite-code-generator loading">Loading...</div>
  }

  return (
    <div className="invite-code-generator card">
      <h3 className="invite-title">Invite Friends</h3>
      <p className="invite-description">
        Share your invite link with friends. When they use it, you'll both follow each other automatically!
      </p>

      {inviteCode ? (
        <div className="invite-code-display">
          <div className="invite-code-box">
            <span className="invite-code">{inviteCode.code}</span>
            <span className="invite-uses">{inviteCode.uses_count} uses</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCopy}
            disabled={generating}
          >
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
        </div>
      ) : (
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Generating...' : '+ Generate Invite Code'}
        </button>
      )}

      {inviteCode && (
        <div className="invite-link-preview">
          <small>
            {`${window.location.origin}${import.meta.env.BASE_URL}invite/${inviteCode.code}`}
          </small>
        </div>
      )}
    </div>
  )
}
