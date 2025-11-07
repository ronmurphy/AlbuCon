// Content Type Definitions
export const contentTypes = [
  {
    id: 'general',
    name: 'General',
    icon: '🌟',
    description: 'Positive, safe for everyone',
    color: '#10b981'
  },
  {
    id: 'venting',
    name: 'Venting',
    icon: '💭',
    description: 'Complaints, frustrations',
    color: '#f59e0b'
  },
  {
    id: 'political',
    name: 'Political',
    icon: '🗳️',
    description: 'Politics, debates, news',
    color: '#ef4444'
  },
  {
    id: 'nsfw',
    name: 'NSFW',
    icon: '🔞',
    description: 'Adult/mature content',
    color: '#dc2626'
  }
]

// Platform/source filtering
export const platformTypes = [
  {
    id: 'platform_bluesky',
    name: 'Bluesky',
    icon: '🦋',
    description: 'Posts from Bluesky users',
    color: '#1185fe'
  },
  {
    id: 'platform_mastodon',
    name: 'Mastodon',
    icon: '🐘',
    description: 'Posts from Mastodon users',
    color: '#6364ff'
  },
  // Reddit integration disabled due to API blocking
  // {
  //   id: 'platform_reddit',
  //   name: 'Reddit',
  //   icon: '🤖',
  //   description: 'Posts from Reddit',
  //   color: '#ff4500'
  // }
]

export const defaultPreferences = {
  general: true,
  venting: true,
  political: true,
  nsfw: false,
  // Platform preferences (show external posts by default)
  platform_bluesky: true,
  platform_mastodon: true,
  // platform_reddit: true // Reddit integration disabled
}

export const getContentType = (typeId) => {
  return contentTypes.find(t => t.id === typeId) || contentTypes[0]
}

export const getPlatformType = (platformId) => {
  return platformTypes.find(type => type.id === platformId)
}
