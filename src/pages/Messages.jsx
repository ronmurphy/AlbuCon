import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getFriends } from '../lib/friendsUtils'
import { supabase } from '../lib/supabase'
import './Messages.css'

export default function Messages({ onOpenDM }) {
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)

  useEffect(() => {
    loadFriends()
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('profile_picture_url')
        .eq('id', user.id)
        .single()

      setProfilePicture(profileData?.profile_picture_url)
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }

  const loadFriends = async () => {
    if (!user) return

    try {
      setLoading(true)
      const friendsList = await getFriends(user.id)
      console.log('Messages - Loaded friends:', friendsList)
      setFriends(friendsList || [])
    } catch (err) {
      console.error('Error loading friends:', err)
      setFriends([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDM = (friend) => {
    onOpenDM(friend.id, friend.username, friend.profile_picture_url)
  }

  // Filter friends by search query - getFriends returns friend_username not username
  const filteredFriends = friends.filter(friend => {
    if (!friend || !friend.friend_username) return false
    return friend.friend_username.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <div className="messages-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h2>💬 Start a Conversation</h2>
        <p className="messages-subtitle">Select a friend to send a message</p>
      </div>

      {/* Search Bar */}
      {friends.length > 0 && (
        <div className="messages-search">
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="messages-search-input"
          />
        </div>
      )}

      {/* Friends List */}
      <div className="messages-friends-list">
        {/* Self (Personal Notes) - Always shown */}
        <div
          className="messages-friend-item messages-self-item"
          onClick={() => handleOpenDM({
            id: user.id,
            username: user.user_metadata?.username || 'You',
            profile_picture_url: profilePicture
          })}
        >
          <div className="messages-friend-avatar">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="You"
                className="messages-friend-pic"
              />
            ) : (
              <div className="messages-friend-initial">
                {user.user_metadata?.username?.[0]?.toUpperCase() || 'Y'}
              </div>
            )}
          </div>
          <div className="messages-friend-info">
            <div className="messages-friend-name">
              {user.user_metadata?.username || 'You'} (Personal Notes)
            </div>
            <div className="messages-friend-hint">
              Send messages to yourself
            </div>
          </div>
        </div>

        {/* Friends */}
        {friends.length === 0 ? (
          <div className="messages-empty">
            <p className="messages-empty-icon">👥</p>
            <p className="messages-empty-title">No friends yet</p>
            <p className="messages-empty-subtitle">
              Add some friends to start messaging!
            </p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="messages-empty">
            <p className="messages-empty-icon">🔍</p>
            <p className="messages-empty-title">No results</p>
            <p className="messages-empty-subtitle">
              No friends found matching "{searchQuery}"
            </p>
          </div>
        ) : (
          filteredFriends.map((friend) => (
            <div
              key={friend.friend_id}
              className="messages-friend-item"
              onClick={() => handleOpenDM({
                id: friend.friend_id,
                username: friend.friend_username,
                profile_picture_url: friend.friend_profile_picture
              })}
            >
              <div className="messages-friend-avatar">
                {friend.friend_profile_picture ? (
                  <img
                    src={friend.friend_profile_picture}
                    alt={friend.friend_username || 'Friend'}
                    className="messages-friend-pic"
                  />
                ) : (
                  <div className="messages-friend-initial">
                    {friend.friend_username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="messages-friend-info">
                <div className="messages-friend-name">{friend.friend_username || 'Unknown User'}</div>
                <div className="messages-friend-hint">Click to message</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
