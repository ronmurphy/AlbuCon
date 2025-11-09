import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getFriends } from '../lib/friendsUtils'
import './Messages.css'

export default function Messages({ onOpenDM }) {
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadFriends()
  }, [user])

  const loadFriends = async () => {
    if (!user) return

    try {
      setLoading(true)
      const friendsList = await getFriends(user.id)
      setFriends(friendsList)
    } catch (err) {
      console.error('Error loading friends:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDM = (friend) => {
    onOpenDM(friend.id, friend.username, friend.profile_picture_url)
  }

  // Filter friends by search query
  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <div className="messages-friends-list">
          {/* Self (Personal Notes) */}
          <div
            className="messages-friend-item messages-self-item"
            onClick={() => handleOpenDM({
              id: user.id,
              username: user.user_metadata?.username || 'You',
              profile_picture_url: user.user_metadata?.profile_picture_url
            })}
          >
            <div className="messages-friend-avatar">
              {user.user_metadata?.profile_picture_url ? (
                <img
                  src={user.user_metadata.profile_picture_url}
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
          {filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className="messages-friend-item"
              onClick={() => handleOpenDM(friend)}
            >
              <div className="messages-friend-avatar">
                {friend.profile_picture_url ? (
                  <img
                    src={friend.profile_picture_url}
                    alt={friend.username}
                    className="messages-friend-pic"
                  />
                ) : (
                  <div className="messages-friend-initial">
                    {friend.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="messages-friend-info">
                <div className="messages-friend-name">{friend.username}</div>
                <div className="messages-friend-hint">Click to message</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
