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

export const defaultPreferences = {
  general: true,
  venting: true,
  political: true,
  nsfw: false
}

export const getContentType = (typeId) => {
  return contentTypes.find(t => t.id === typeId) || contentTypes[0]
}
