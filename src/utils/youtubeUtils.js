/**
 * Detect if text contains a YouTube URL and extract video ID
 * @param {string} text - Text to search for YouTube links
 * @returns {string|null} YouTube video ID or null if not found
 */
export function extractYouTubeVideoId(text) {
  if (!text) return null

  // YouTube URL patterns
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Get all YouTube video IDs from text
 * @param {string} text - Text to search
 * @returns {Array<string>} Array of video IDs
 */
export function extractAllYouTubeVideoIds(text) {
  if (!text) return []

  const videoIds = []
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/g,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/g,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/g,
    /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/g,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/g,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/g
  ]

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)]
    for (const match of matches) {
      if (match[1] && !videoIds.includes(match[1])) {
        videoIds.push(match[1])
      }
    }
  }

  return videoIds
}

/**
 * Check if text contains a YouTube URL
 * @param {string} text - Text to check
 * @returns {boolean} True if YouTube URL found
 */
export function containsYouTubeUrl(text) {
  return extractYouTubeVideoId(text) !== null
}

/**
 * Get YouTube embed URL for a video ID
 * @param {string} videoId - YouTube video ID
 * @returns {string} YouTube embed URL
 */
export function getYouTubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}`
}
