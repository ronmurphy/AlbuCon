import { supabase } from './supabase'

// Send a friend request
export async function sendFriendRequest(friendId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if a friendship already exists
  const { data: existing } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
    .single()

  if (existing) {
    if (existing.status === 'pending') {
      throw new Error('Friend request already pending')
    }
    if (existing.status === 'accepted') {
      throw new Error('Already friends')
    }
  }

  const { data, error } = await supabase
    .from('friendships')
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Accept a friend request
export async function acceptFriendRequest(friendshipId) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)

  if (error) throw error
  return true
}

// Decline a friend request
export async function declineFriendRequest(friendshipId) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'declined' })
    .eq('id', friendshipId)

  if (error) throw error
  return true
}

// Unfriend / Remove friendship
export async function removeFriendship(friendshipId) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)

  if (error) throw error
  return true
}

// Get all friends (accepted)
export async function getFriends(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      user_id,
      friend_id,
      status,
      created_at
    `)
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted')

  if (error) throw error

  // Get profile info for all friends
  const friendIds = data.map(f => f.user_id === userId ? f.friend_id : f.user_id)

  if (friendIds.length === 0) return []

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, profile_picture_url')
    .in('id', friendIds)

  if (profileError) throw profileError

  // Combine friendship data with profile data
  return data.map(friendship => {
    const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id
    const profile = profiles.find(p => p.id === friendId)
    return {
      ...friendship,
      friend_id: friendId,
      friend_username: profile?.username,
      friend_profile_picture: profile?.profile_picture_url
    }
  })
}

// Get pending friend requests (received)
export async function getPendingRequests(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      user_id,
      friend_id,
      status,
      created_at
    `)
    .eq('friend_id', userId)
    .eq('status', 'pending')

  if (error) throw error

  if (data.length === 0) return []

  // Get profile info for requesters
  const requesterIds = data.map(f => f.user_id)

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, profile_picture_url')
    .in('id', requesterIds)

  if (profileError) throw profileError

  // Combine data
  return data.map(request => {
    const profile = profiles.find(p => p.id === request.user_id)
    return {
      ...request,
      requester_username: profile?.username,
      requester_profile_picture: profile?.profile_picture_url
    }
  })
}

// Get sent friend requests (pending)
export async function getSentRequests(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select(`
      id,
      user_id,
      friend_id,
      status,
      created_at
    `)
    .eq('user_id', userId)
    .eq('status', 'pending')

  if (error) throw error

  if (data.length === 0) return []

  // Get profile info for recipients
  const recipientIds = data.map(f => f.friend_id)

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, profile_picture_url')
    .in('id', recipientIds)

  if (profileError) throw profileError

  return data.map(request => {
    const profile = profiles.find(p => p.id === request.friend_id)
    return {
      ...request,
      recipient_username: profile?.username,
      recipient_profile_picture: profile?.profile_picture_url
    }
  })
}

// Search users by username
export async function searchUsers(searchTerm) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, profile_picture_url')
    .ilike('username', `%${searchTerm}%`)
    .neq('id', user?.id || '') // Exclude current user
    .limit(20)

  if (error) throw error
  return data || []
}

// Get friendship status with a specific user
export async function getFriendshipStatus(userId, targetUserId) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(user_id.eq.${userId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${userId})`)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
  return data || null
}

// Check if users are friends
export async function areFriends(userId, targetUserId) {
  const friendship = await getFriendshipStatus(userId, targetUserId)
  return friendship?.status === 'accepted'
}

// Get friend count
export async function getFriendCount(userId) {
  const { data, error } = await supabase
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted')

  if (error) throw error
  return data || 0
}
