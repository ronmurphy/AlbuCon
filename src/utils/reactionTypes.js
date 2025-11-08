// Post reaction types for AlbuCon
// Focused on positive, supportive, and thoughtful reactions

export const reactionTypes = {
  heart: {
    id: 'heart',
    emoji: '❤️',
    label: 'Heart',
    description: 'Love it'
  },
  smile: {
    id: 'smile',
    emoji: '😊',
    label: 'Smile',
    description: 'Like it'
  },
  sparkles: {
    id: 'sparkles',
    emoji: '✨',
    label: 'Sparkles',
    description: 'Inspiring'
  },
  hug: {
    id: 'hug',
    emoji: '🤗',
    label: 'Hug',
    description: 'Support'
  },
  thinking: {
    id: 'thinking',
    emoji: '🤔',
    label: 'Thinking',
    description: 'Interesting'
  }
}

// Array of reaction types for easy iteration
export const reactionTypesArray = Object.values(reactionTypes)

// Get reaction emoji by type
export function getReactionEmoji(type) {
  return reactionTypes[type]?.emoji || '❤️'
}

// Get reaction label by type
export function getReactionLabel(type) {
  return reactionTypes[type]?.label || 'Heart'
}

// Count reactions by type from a likes array
export function countReactionsByType(likes) {
  const counts = {
    heart: 0,
    smile: 0,
    sparkles: 0,
    hug: 0,
    thinking: 0
  }

  likes?.forEach(like => {
    const type = like.reaction_type || 'heart'
    if (counts.hasOwnProperty(type)) {
      counts[type]++
    }
  })

  return counts
}

// Get total reaction count
export function getTotalReactionCount(likes) {
  return likes?.length || 0
}

// Check if user has reacted and with what type
export function getUserReaction(likes, userId) {
  const userLike = likes?.find(like => like.user_id === userId)
  return userLike ? (userLike.reaction_type || 'heart') : null
}
