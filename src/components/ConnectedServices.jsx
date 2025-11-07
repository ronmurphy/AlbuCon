import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './ConnectedServices.css'

export default function ConnectedServices() {
  const { user } = useAuth()
  const [followedAccounts, setFollowedAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingAccount, setAddingAccount] = useState(false)
  const [newHandle, setNewHandle] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('bluesky')

  const platforms = [
    {
      id: 'bluesky',
      name: 'Bluesky',
      icon: '🦋',
      description: 'Follow Bluesky users (no login required)',
      placeholder: 'user.bsky.social',
      enabled: true
    },
    {
      id: 'mastodon',
      name: 'Mastodon',
      icon: '🐘',
      description: 'Follow Mastodon users (no login required)',
      placeholder: 'user@mastodon.social',
      enabled: true
    },
    {
      id: 'reddit',
      name: 'Reddit',
      icon: '🤖',
      description: 'Follow Reddit users or subreddits (no login required)',
      placeholder: 'u/username or r/subreddit',
      enabled: true
    }
  ]

  useEffect(() => {
    loadFollowedAccounts()
  }, [user])

  const loadFollowedAccounts = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('followed_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFollowedAccounts(data || [])
    } catch (error) {
      console.error('Error loading followed accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const addFollowedAccount = async (e) => {
    e.preventDefault()
    if (!newHandle.trim()) return

    setAddingAccount(true)
    try {
      // Format handle based on platform
      let formattedHandle = newHandle.trim()

      if (selectedPlatform === 'bluesky' && !formattedHandle.includes('.')) {
        // For Bluesky, ensure handle ends with .bsky.social if no domain provided
        formattedHandle = `${formattedHandle}.bsky.social`
      } else if (selectedPlatform === 'mastodon') {
        // For Mastodon, ensure format is username@instance.social
        if (!formattedHandle.includes('@')) {
          formattedHandle = `${formattedHandle}@mastodon.social`
        } else if (formattedHandle.startsWith('@')) {
          formattedHandle = formattedHandle.substring(1) // Remove leading @
        }
      } else if (selectedPlatform === 'reddit') {
        // For Reddit, ensure format is u/username or r/subreddit
        if (!formattedHandle.startsWith('u/') && !formattedHandle.startsWith('r/')) {
          // Default to user if no prefix
          formattedHandle = `u/${formattedHandle}`
        }
      }

      const { data, error } = await supabase
        .from('followed_accounts')
        .insert({
          user_id: user.id,
          platform: selectedPlatform,
          handle: formattedHandle,
          enabled: true
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          alert('You are already following this account!')
        } else {
          throw error
        }
        return
      }

      setFollowedAccounts([data, ...followedAccounts])
      setNewHandle('')
      alert('Account added! Posts will appear in your feed shortly.')
    } catch (error) {
      console.error('Error adding account:', error)
      alert('Failed to add account. Please try again.')
    } finally {
      setAddingAccount(false)
    }
  }

  const toggleAccount = async (accountId, currentEnabled) => {
    try {
      const { error } = await supabase
        .from('followed_accounts')
        .update({ enabled: !currentEnabled })
        .eq('id', accountId)
        .eq('user_id', user.id)

      if (error) throw error

      setFollowedAccounts(followedAccounts.map(acc =>
        acc.id === accountId ? { ...acc, enabled: !currentEnabled } : acc
      ))
    } catch (error) {
      console.error('Error toggling account:', error)
      alert('Failed to update account status.')
    }
  }

  const removeAccount = async (accountId) => {
    if (!confirm('Are you sure you want to unfollow this account? Their posts will be removed from your feed.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('followed_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id)

      if (error) throw error

      setFollowedAccounts(followedAccounts.filter(acc => acc.id !== accountId))
    } catch (error) {
      console.error('Error removing account:', error)
      alert('Failed to remove account.')
    }
  }

  const getPlatformInfo = (platformId) => {
    return platforms.find(p => p.id === platformId) || {}
  }

  if (loading) {
    return (
      <div className="connected-services-section card">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="connected-services-section card">
      <h2 className="section-title">🔗 Connected Services</h2>
      <p className="section-description">
        Follow users from other social media platforms and see their posts in your feed
      </p>

      {/* Platform Selection */}
      <div className="platform-selector">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            className={`platform-btn ${selectedPlatform === platform.id ? 'active' : ''} ${!platform.enabled ? 'disabled' : ''}`}
            onClick={() => platform.enabled && setSelectedPlatform(platform.id)}
            disabled={!platform.enabled}
            title={platform.description}
          >
            <span className="platform-icon">{platform.icon}</span>
            <span className="platform-name">{platform.name}</span>
            {!platform.enabled && <span className="coming-soon">Soon</span>}
          </button>
        ))}
      </div>

      {/* Add Account Form */}
      <form onSubmit={addFollowedAccount} className="add-account-form">
        <div className="input-group">
          <span className="input-icon">
            {getPlatformInfo(selectedPlatform).icon}
          </span>
          <input
            type="text"
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            placeholder={getPlatformInfo(selectedPlatform).placeholder}
            disabled={!getPlatformInfo(selectedPlatform).enabled || addingAccount}
            className="account-input"
          />
          <button
            type="submit"
            disabled={!newHandle.trim() || addingAccount || !getPlatformInfo(selectedPlatform).enabled}
            className="btn-add-account"
          >
            {addingAccount ? '...' : '+ Follow'}
          </button>
        </div>
      </form>

      {/* Followed Accounts List */}
      {followedAccounts.length > 0 && (
        <div className="followed-accounts-list">
          <h3 className="list-title">Following ({followedAccounts.length})</h3>
          {followedAccounts.map((account) => {
            const platformInfo = getPlatformInfo(account.platform)
            return (
              <div key={account.id} className={`followed-account-item ${!account.enabled ? 'disabled' : ''}`}>
                <span className="account-platform-icon">{platformInfo.icon}</span>
                <div className="account-info">
                  <div className="account-handle">{account.handle}</div>
                  <div className="account-platform">{platformInfo.name}</div>
                </div>
                <div className="account-actions">
                  <button
                    onClick={() => toggleAccount(account.id, account.enabled)}
                    className="btn-toggle"
                    title={account.enabled ? 'Disable' : 'Enable'}
                  >
                    {account.enabled ? '👁️' : '👁️‍🗨️'}
                  </button>
                  <button
                    onClick={() => removeAccount(account.id)}
                    className="btn-remove"
                    title="Unfollow"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {followedAccounts.length === 0 && (
        <div className="empty-state">
          <p>No accounts followed yet. Add a Bluesky user above to see their posts in your feed!</p>
        </div>
      )}
    </div>
  )
}
