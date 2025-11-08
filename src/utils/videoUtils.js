/**
 * Unified video platform detection and extraction utilities
 * Supports: YouTube, TikTok, Vimeo, and more
 */

// Video platform types
export const VideoPlatform = {
  YOUTUBE: 'youtube',
  TIKTOK: 'tiktok',
  VIMEO: 'vimeo',
  UNKNOWN: 'unknown'
}

/**
 * Extract YouTube video ID from text
 */
export function extractYouTubeVideoId(text) {
  if (!text) return null

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
 * Extract TikTok video ID from text
 */
export function extractTikTokVideoId(text) {
  if (!text) return null

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/.*\/video\/(\d+)/,
    /(?:https?:\/\/)?(?:vm\.)?tiktok\.com\/([a-zA-Z0-9]+)/,
    /(?:https?:\/\/)?(?:vt\.)?tiktok\.com\/([a-zA-Z0-9]+)/
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
 * Extract Vimeo video ID from text
 */
export function extractVimeoVideoId(text) {
  if (!text) return null

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/,
    /(?:https?:\/\/)?(?:player\.)?vimeo\.com\/video\/(\d+)/
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
 * Detect video platform and extract video ID/URL
 * @param {string} text - Text containing video URL
 * @returns {Object|null} { platform, videoId } or null if no video found
 */
export function detectVideo(text) {
  if (!text) return null

  // Check YouTube
  const youtubeId = extractYouTubeVideoId(text)
  if (youtubeId) {
    return {
      platform: VideoPlatform.YOUTUBE,
      videoId: youtubeId
    }
  }

  // Check TikTok
  const tiktokId = extractTikTokVideoId(text)
  if (tiktokId) {
    return {
      platform: VideoPlatform.TIKTOK,
      videoId: tiktokId
    }
  }

  // Check Vimeo
  const vimeoId = extractVimeoVideoId(text)
  if (vimeoId) {
    return {
      platform: VideoPlatform.VIMEO,
      videoId: vimeoId
    }
  }

  return null
}

/**
 * Get embed URL for YouTube video
 */
export function getYouTubeEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}`
}

/**
 * Get embed URL for TikTok video
 */
export function getTikTokEmbedUrl(videoId) {
  return `https://www.tiktok.com/embed/v2/${videoId}`
}

/**
 * Get embed URL for Vimeo video
 */
export function getVimeoEmbedUrl(videoId) {
  return `https://player.vimeo.com/video/${videoId}`
}

/**
 * Check if text contains any supported video URL
 */
export function containsVideoUrl(text) {
  return detectVideo(text) !== null
}

/**
 * Get all videos from text (supports multiple videos)
 * @param {string} text - Text to search
 * @returns {Array<Object>} Array of { platform, videoId }
 */
export function extractAllVideos(text) {
  if (!text) return []

  const videos = []

  // Extract all YouTube videos
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/g,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/g,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/g
  ]

  youtubePatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)]
    matches.forEach(match => {
      if (match[1]) {
        videos.push({
          platform: VideoPlatform.YOUTUBE,
          videoId: match[1]
        })
      }
    })
  })

  // Extract all TikTok videos
  const tiktokPatterns = [
    /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)/g,
    /(?:https?:\/\/)?(?:vm\.)?tiktok\.com\/([a-zA-Z0-9]+)/g
  ]

  tiktokPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)]
    matches.forEach(match => {
      if (match[1]) {
        videos.push({
          platform: VideoPlatform.TIKTOK,
          videoId: match[1]
        })
      }
    })
  })

  // Extract all Vimeo videos
  const vimeoPatterns = [
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/g
  ]

  vimeoPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)]
    matches.forEach(match => {
      if (match[1]) {
        videos.push({
          platform: VideoPlatform.VIMEO,
          videoId: match[1]
        })
      }
    })
  })

  return videos
}
