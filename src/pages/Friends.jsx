import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriendship,
  getFriendshipStatus
} from '../lib/friendsUtils'
import './Friends.css'

export default function Friends() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('friends') // friends, find, pending, sent
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState(null)
  const [friendshipStatuses, setFriendshipStatuses] = useState({})

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [friendsData, pendingData, sentData] = await Promise.all([
        getFriends(user.id),
        getPendingRequests(user.id),
        getSentRequests(user.id)
      ])
      setFriends(friendsData)
      setPendingRequests(pendingData)
      setSentRequests(sentData)
    } catch (err) {
      console.error('Error loading friends data:', err)
      setError('Failed to load friends data')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (term) => {
    setSearchTerm(term)
    if (term.trim().length < 2) {
      setSearchResults([])
      setFriendshipStatuses({})
      return
    }

    try {
      const results = await searchUsers(term)
      setSearchResults(results)

      // Check friendship status for each result
      const statuses = {}
      await Promise.all(
        results.map(async (result) => {
          const status = await getFriendshipStatus(user.id, result.id)
          statuses[result.id] = status
        })
      )
      setFriendshipStatuses(statuses)
    } catch (err) {
      console.error('Error searching users:', err)
      setError('Failed to search users')
    }
  }

  const handleSendRequest = async (friendId) => {
    try {
      setActionLoading(friendId)
      setError(null)
      await sendFriendRequest(friendId)
      // Refresh data
      await loadData()
      // Update friendship status
      const status = await getFriendshipStatus(user.id, friendId)
      setFriendshipStatuses(prev => ({ ...prev, [friendId]: status }))
    } catch (err) {
      console.error('Error sending friend request:', err)
      setError(err.message || 'Failed to send friend request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleAcceptRequest = async (friendshipId) => {
    try {
      setActionLoading(friendshipId)
      setError(null)
      await acceptFriendRequest(friendshipId)
      await loadData()
    } catch (err) {
      console.error('Error accepting friend request:', err)
      setError('Failed to accept friend request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeclineRequest = async (friendshipId) => {
    try {
      setActionLoading(friendshipId)
      setError(null)
      await declineFriendRequest(friendshipId)
      await loadData()
    } catch (err) {
      console.error('Error declining friend request:', err)
      setError('Failed to decline friend request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveFriend = async (friendshipId, friendUsername) => {
    if (!confirm(`Are you sure you want to unfriend ${friendUsername}?`)) {
      return
    }

    try {
      setActionLoading(friendshipId)
      setError(null)
      await removeFriendship(friendshipId)
      await loadData()
    } catch (err) {
      console.error('Error removing friend:', err)
      setError('Failed to remove friend')
    } finally {
      setActionLoading(null)
    }
  }

  const getFriendButtonState = (userId) => {
    const status = friendshipStatuses[userId]
    if (!status) {
      return { text: '➕ Add Friend', action: () => handleSendRequest(userId), disabled: false }
    }

    if (status.status === 'pending') {
      if (status.user_id === user.id) {
        return { text: '⏳ Request Sent', action: null, disabled: true }
      } else {
        return { text: '✅ Accept Request', action: () => handleAcceptRequest(status.id), disabled: false }
      }
    }

    if (status.status === 'accepted') {
      return { text: '✓ Friends', action: null, disabled: true }
    }

    return { text: '➕ Add Friend', action: () => handleSendRequest(userId), disabled: false }
  }

  if (!user) {
    return (
      <div className="container friends-page">
        <div className="card">
          <p className="login-prompt">Please log in to view your friends.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container friends-page">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="container friends-page">
      <div className="page-header">
        <h1 className="page-title">Friends</h1>
        <p className="page-subtitle">Connect with friends and share positive vibes!</p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends {friends.length > 0 && `(${friends.length})`}
        </button>
        <button
          className={`tab ${activeTab === 'find' ? 'active' : ''}`}
          onClick={() => setActiveTab('find')}
        >
          Find Friends
        </button>
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
        </button>
        <button
          className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
        </button>
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="tab-content">
          {friends.length === 0 ? (
            <div className="empty-state card">
              <p className="empty-icon">👥</p>
              <p className="empty-text">You don't have any friends yet.</p>
              <p className="empty-hint">Search for users and send friend requests!</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('find')}>
                Find Friends
              </button>
            </div>
          ) : (
            <div className="friends-list">
              {friends.map((friendship) => (
                <div key={friendship.id} className="friend-card card">
                  <div className="friend-avatar">
                    {friendship.friend_profile_picture ? (
                      <img
                        src={friendship.friend_profile_picture}
                        alt={friendship.friend_username}
                        className="friend-profile-pic"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className="friend-initial" style={friendship.friend_profile_picture ? { display: 'none' } : {}}>
                      {friendship.friend_username?.[0]?.toUpperCase() || '?'}
                    </div>
                  </div>
                  <div className="friend-info">
                    <h3 className="friend-username">{friendship.friend_username || 'Unknown User'}</h3>
                    <p className="friend-since">
                      Friends since {new Date(friendship.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    className="btn btn-remove"
                    onClick={() => handleRemoveFriend(friendship.id, friendship.friend_username)}
                    disabled={actionLoading === friendship.id}
                  >
                    {actionLoading === friendship.id ? 'Removing...' : 'Unfriend'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Find Friends Tab */}
      {activeTab === 'find' && (
        <div className="tab-content">
          <div className="search-section card">
            <h3>Search for Users</h3>
            <input
              type="text"
              className="search-input"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchTerm.length > 0 && searchTerm.length < 2 && (
              <p className="search-hint">Type at least 2 characters to search</p>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => {
                const buttonState = getFriendButtonState(result.id)
                return (
                  <div key={result.id} className="friend-card card">
                    <div className="friend-avatar">
                      {result.profile_picture_url ? (
                        <img
                          src={result.profile_picture_url}
                          alt={result.username}
                          className="friend-profile-pic"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className="friend-initial" style={result.profile_picture_url ? { display: 'none' } : {}}>
                        {result.username?.[0]?.toUpperCase() || '?'}
                      </div>
                    </div>
                    <div className="friend-info">
                      <h3 className="friend-username">{result.username}</h3>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={buttonState.action}
                      disabled={buttonState.disabled || actionLoading === result.id}
                    >
                      {actionLoading === result.id ? 'Loading...' : buttonState.text}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {searchTerm.length >= 2 && searchResults.length === 0 && (
            <div className="empty-state card">
              <p className="empty-icon">🔍</p>
              <p className="empty-text">No users found</p>
              <p className="empty-hint">Try a different search term</p>
            </div>
          )}
        </div>
      )}

      {/* Pending Requests Tab */}
      {activeTab === 'pending' && (
        <div className="tab-content">
          {pendingRequests.length === 0 ? (
            <div className="empty-state card">
              <p className="empty-icon">📬</p>
              <p className="empty-text">No pending friend requests</p>
            </div>
          ) : (
            <div className="requests-list">
              {pendingRequests.map((request) => (
                <div key={request.id} className="friend-card card">
                  <div className="friend-avatar">
                    {request.requester_profile_picture ? (
                      <img
                        src={request.requester_profile_picture}
                        alt={request.requester_username}
                        className="friend-profile-pic"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className="friend-initial" style={request.requester_profile_picture ? { display: 'none' } : {}}>
                      {request.requester_username?.[0]?.toUpperCase() || '?'}
                    </div>
                  </div>
                  <div className="friend-info">
                    <h3 className="friend-username">{request.requester_username || 'Unknown User'}</h3>
                    <p className="request-date">
                      Sent {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="request-actions">
                    <button
                      className="btn btn-accept"
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={actionLoading === request.id}
                    >
                      {actionLoading === request.id ? 'Accepting...' : '✓ Accept'}
                    </button>
                    <button
                      className="btn btn-decline"
                      onClick={() => handleDeclineRequest(request.id)}
                      disabled={actionLoading === request.id}
                    >
                      {actionLoading === request.id ? 'Declining...' : '✗ Decline'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sent Requests Tab */}
      {activeTab === 'sent' && (
        <div className="tab-content">
          {sentRequests.length === 0 ? (
            <div className="empty-state card">
              <p className="empty-icon">📤</p>
              <p className="empty-text">No sent friend requests</p>
            </div>
          ) : (
            <div className="requests-list">
              {sentRequests.map((request) => (
                <div key={request.id} className="friend-card card">
                  <div className="friend-avatar">
                    {request.recipient_profile_picture ? (
                      <img
                        src={request.recipient_profile_picture}
                        alt={request.recipient_username}
                        className="friend-profile-pic"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className="friend-initial" style={request.recipient_profile_picture ? { display: 'none' } : {}}>
                      {request.recipient_username?.[0]?.toUpperCase() || '?'}
                    </div>
                  </div>
                  <div className="friend-info">
                    <h3 className="friend-username">{request.recipient_username || 'Unknown User'}</h3>
                    <p className="request-date">
                      Sent {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="request-status">
                    <span className="status-badge pending">⏳ Pending</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
