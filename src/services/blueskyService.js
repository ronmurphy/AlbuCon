import { supabase } from '../lib/supabase'

const BLUESKY_API_BASE = 'https://public.api.bsky.app'

/**
 * Fetch author feed from Bluesky
 * @param {string} handle - Bluesky handle (e.g., 'user.bsky.social')
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Array>} Array of posts
 */
export async function fetchBlueskyAuthorFeed(handle, limit = 20) {
  try {
    const url = `${BLUESKY_API_BASE}/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=${limit}&filter=posts_no_replies`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Bluesky API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.feed || []
  } catch (error) {
    console.error(`Error fetching Bluesky feed for ${handle}:`, error)
    return []
  }
}

/**
 * Detect content type based on post text
 * @param {string} text - Post content
 * @returns {string} Content type: 'general', 'venting', 'political', 'nsfw'
 */
export function detectContentType(text) {
  if (!text) return 'general'

  const lowerText = text.toLowerCase()

  // NSFW detection (basic keyword matching)
  const nsfwKeywords = ['nsfw', '18+', 'adult content', 'explicit']
  if (nsfwKeywords.some(kw => lowerText.includes(kw))) {
    return 'nsfw'
  }

  // Political detection
  const politicalKeywords = [
    'trump', 'biden', 'harris', 'election', 'congress', 'senate',
    'politics', 'political', 'government', 'democrat', 'republican',
    'vote', 'voting', 'campaign', 'president', 'legislation'
  ]
  const politicalHashtags = ['#politics', '#election', '#vote', '#maga', '#resist']

  if (politicalKeywords.some(kw => lowerText.includes(kw)) ||
      politicalHashtags.some(tag => lowerText.includes(tag))) {
    return 'political'
  }

  // Venting detection
  const ventingKeywords = [
    'ugh', 'angry', 'frustrated', 'hate', 'terrible', 'awful',
    'annoying', 'sick of', 'tired of', 'mad', 'furious', 'pissed',
    'irritated', 'annoyed', 'upset', 'disappointed'
  ]
  const ventingEmoji = ['😠', '😡', '🤬', '😤', '😣', '😫', '😩']

  if (ventingKeywords.some(kw => lowerText.includes(kw)) ||
      ventingEmoji.some(emoji => text.includes(emoji))) {
    return 'venting'
  }

  return 'general'
}

/**
 * Transform Bluesky post to AlbuCon format
 * @param {object} blueskPost - Raw Bluesky post
 * @param {string} userId - AlbuCon user ID
 * @param {string} followedAccountId - Followed account ID
 * @returns {object} Transformed post for AlbuCon
 */
function transformBlueskyPost(blueskyPost, userId, followedAccountId) {
  const post = blueskyPost.post
  const author = post.author

  // Extract image if available
  let imageUrl = null
  if (post.embed?.images && post.embed.images.length > 0) {
    imageUrl = post.embed.images[0].fullsize || post.embed.images[0].thumb
  }

  // Build AT Protocol URI for the post
  const atUri = post.uri
  const originalUrl = `https://bsky.app/profile/${author.handle}/post/${atUri.split('/').pop()}`

  return {
    user_id: userId,
    followed_account_id: followedAccountId,
    platform: 'bluesky',
    external_id: atUri,
    author_name: author.displayName || author.handle,
    author_handle: author.handle,
    author_avatar: author.avatar || null,
    content: post.record?.text || '',
    image_url: imageUrl,
    original_url: originalUrl,
    content_type: detectContentType(post.record?.text || ''),
    posted_at: post.record?.createdAt || post.indexedAt,
    fetched_at: new Date().toISOString()
  }
}

/**
 * Fetch and store posts for a specific followed account
 * @param {string} userId - AlbuCon user ID
 * @param {object} followedAccount - Followed account object
 * @returns {Promise<number>} Number of new posts fetched
 */
export async function fetchAndStoreBlueskyPosts(userId, followedAccount) {
  try {
    // Fetch posts from Bluesky
    const feed = await fetchBlueskyAuthorFeed(followedAccount.handle, 20)

    if (feed.length === 0) {
      console.log(`No posts found for ${followedAccount.handle}`)
      return 0
    }

    // Transform posts to AlbuCon format
    const transformedPosts = feed.map(item =>
      transformBlueskyPost(item, userId, followedAccount.id)
    )

    // Insert posts into database (using upsert to avoid duplicates)
    const { data, error } = await supabase
      .from('external_posts')
      .upsert(transformedPosts, {
        onConflict: 'platform,external_id,user_id',
        ignoreDuplicates: true
      })
      .select()

    if (error) {
      console.error('Error storing Bluesky posts:', error)
      return 0
    }

    console.log(`Fetched ${data?.length || 0} new posts from ${followedAccount.handle}`)
    return data?.length || 0
  } catch (error) {
    console.error(`Error in fetchAndStoreBlueskyPosts for ${followedAccount.handle}:`, error)
    return 0
  }
}

/**
 * Fetch posts for all enabled followed accounts for a user
 * @param {string} userId - AlbuCon user ID
 * @returns {Promise<number>} Total number of new posts fetched
 */
export async function fetchAllBlueskyFeeds(userId) {
  try {
    // Get all enabled followed accounts
    const { data: followedAccounts, error } = await supabase
      .from('followed_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'bluesky')
      .eq('enabled', true)

    if (error) throw error

    if (!followedAccounts || followedAccounts.length === 0) {
      console.log('No Bluesky accounts to fetch')
      return 0
    }

    console.log(`Fetching posts from ${followedAccounts.length} Bluesky accounts...`)

    // Fetch posts for each account
    let totalNewPosts = 0
    for (const account of followedAccounts) {
      const newPosts = await fetchAndStoreBlueskyPosts(userId, account)
      totalNewPosts += newPosts

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`Total new posts fetched: ${totalNewPosts}`)
    return totalNewPosts
  } catch (error) {
    console.error('Error in fetchAllBlueskyFeeds:', error)
    return 0
  }
}

/**
 * Get external posts for a user's feed
 * @param {string} userId - AlbuCon user ID
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Array>} Array of external posts
 */
export async function getExternalPosts(userId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('external_posts')
      .select('*')
      .eq('user_id', userId)
      .order('posted_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching external posts:', error)
    return []
  }
}
