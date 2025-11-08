/**
 * Automatic content type detection based on keywords
 * Implements Brittany's suggestion for auto-tagging posts
 */

// Keywords for each content type
const contentKeywords = {
  venting: [
    // Explicit rant indicators
    'rant', 'venting', 'frustrated', 'frustrating', 'annoyed', 'annoying', 'irritated',
    'pissed off', 'pissed', 'angry', 'upset', 'mad about', 'sick of', 'tired of',
    'fed up', 'had enough', 'cant stand', 'can\'t stand', 'hate when', 'hate it when',
    // Common rant phrases
    'i need to rant', 'need to vent', 'seriously annoyed', 'really annoyed',
    'drives me crazy', 'drives me nuts', 'getting on my nerves', 'on my nerves',
    'so frustrated', 'really frustrated', 'extremely frustrated',
    'complaint', 'complaining', 'why do people', 'why does', 'what is wrong with'
  ],

  political: [
    // Political terms
    'politics', 'political', 'politician', 'politicians', 'government', 'congress',
    'senate', 'senator', 'representative', 'president', 'presidential', 'election',
    'vote', 'voting', 'ballot', 'campaign', 'democrat', 'republican', 'liberal',
    'conservative', 'left wing', 'right wing', 'policy', 'legislation', 'bill',
    // Current events/debate
    'debate', 'political debate', 'news', 'breaking news', 'current events',
    'controversy', 'controversial', 'protest', 'rally', 'activism', 'activist',
    // Specific issues often political
    'immigration', 'healthcare', 'climate change', 'gun control', 'abortion',
    'taxes', 'economy', 'foreign policy', 'supreme court', 'impeachment'
  ],

  nsfw: [
    // Adult content indicators
    'nsfw', 'not safe for work', 'adult content', 'mature content', '18+', 'adults only',
    'explicit', 'graphic', 'sexual', 'sexuality', 'nude', 'nudity', 'porn',
    // Common NSFW warnings
    'trigger warning', 'content warning', 'tw:', 'cw:', 'nsfw warning'
  ]
}

/**
 * Detect content type based on keywords in text
 * @param {string} content - Post content to analyze
 * @returns {string|null} Detected content type ID or null if general/unclear
 */
export function detectContentType(content) {
  if (!content || typeof content !== 'string') return null

  // Normalize content for matching (lowercase, preserve spaces)
  const normalizedContent = content.toLowerCase()

  // Check each content type for keyword matches
  // Check NSFW first (highest priority)
  if (hasKeywordMatch(normalizedContent, contentKeywords.nsfw)) {
    return 'nsfw'
  }

  // Check political
  if (hasKeywordMatch(normalizedContent, contentKeywords.political)) {
    return 'political'
  }

  // Check venting/rant
  if (hasKeywordMatch(normalizedContent, contentKeywords.venting)) {
    return 'venting'
  }

  // Default to general if no keywords matched
  return null // null means general/no specific tag needed
}

/**
 * Check if content matches any keyword in the list
 * @param {string} normalizedContent - Lowercase content
 * @param {Array<string>} keywords - List of keywords to check
 * @returns {boolean} True if any keyword found
 */
function hasKeywordMatch(normalizedContent, keywords) {
  return keywords.some(keyword => {
    // Use word boundary matching to avoid partial matches
    // e.g., "political" shouldn't match "apolitical"
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i')
    return regex.test(normalizedContent)
  })
}

/**
 * Escape special regex characters in keyword
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Get all matching content types (for debugging/analysis)
 * @param {string} content - Post content
 * @returns {Array<string>} Array of matching content type IDs
 */
export function getAllMatchingTypes(content) {
  if (!content || typeof content !== 'string') return []

  const normalizedContent = content.toLowerCase()
  const matches = []

  if (hasKeywordMatch(normalizedContent, contentKeywords.nsfw)) {
    matches.push('nsfw')
  }
  if (hasKeywordMatch(normalizedContent, contentKeywords.political)) {
    matches.push('political')
  }
  if (hasKeywordMatch(normalizedContent, contentKeywords.venting)) {
    matches.push('venting')
  }

  return matches
}

/**
 * Auto-tag content: Use manual tag if provided, otherwise auto-detect
 * @param {string} content - Post content
 * @param {string|null} manualTag - User's manual tag selection
 * @returns {string} Final content type to use
 */
export function autoTag(content, manualTag) {
  // If user manually selected a tag, always use that
  if (manualTag && manualTag !== 'general') {
    return manualTag
  }

  // Otherwise, try to auto-detect
  const detected = detectContentType(content)
  return detected || 'general'
}
