import { supabase } from '../lib/supabase'

/**
 * Lookup a Mastodon account by username and instance
 * @param {string} username - Username (e.g., 'user')
 * @param {string} instance - Instance domain (e.g., 'mastodon.social')
 * @returns {Promise<object|null>} Account object or null
 */
export async function lookupMastodonAccount(username, instance) {
  try {
    const url = `https://${instance}/api/v1/accounts/lookup?acct=${username}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Mastodon API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error looking up Mastodon account ${username}@${instance}:`, error)
    return null
  }
}

/**
 * Fetch posts from a Mastodon account
 * @param {string} accountId - Mastodon account ID
 * @param {string} instance - Instance domain (e.g., 'mastodon.social')
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Array>} Array of posts
 */
export async function fetchMastodonAccountPosts(accountId, instance, limit = 20) {
  try {
    const url = `https://${instance}/api/v1/accounts/${accountId}/statuses?limit=${limit}&exclude_replies=true&exclude_reblogs=true`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Mastodon API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data || []
  } catch (error) {
    console.error(`Error fetching Mastodon posts for ${accountId} on ${instance}:`, error)
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

  // NSFW detection
  const nsfwKeywords = ['nsfw', '18+', 'adult content', 'explicit', '#nsfw']
  if (nsfwKeywords.some(kw => lowerText.includes(kw))) {
    return 'nsfw'
  }

  // Political detection
  const politicalKeywords = [
    'trump', 'biden', 'harris', 'election', 'congress', 'senate',
    'politics', 'political', 'government', 'democrat', 'republican',
    'vote', 'voting', 'campaign', 'president', 'legislation'
  ]
  const politicalHashtags = ['#politics', '#election', '#vote']

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
 * Strip HTML tags from Mastodon content
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
function stripHtml(html) {
  if (!html) return ''

  // Replace <br> and <p> tags with newlines
  let text = html.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n')

  // Remove all other HTML tags
  text = text.replace(/<[^>]*>/g, '')

  // Decode HTML entities
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  text = textarea.value

  return text.trim()
}

/**
 * Transform Mastodon post to AlbuCon format
 * @param {object} mastodonPost - Raw Mastodon post
 * @param {string} userId - AlbuCon user ID
 * @param {string} followedAccountId - Followed account ID
 * @param {string} instance - Mastodon instance domain
 * @returns {object} Transformed post for AlbuCon
 */
function transformMastodonPost(mastodonPost, userId, followedAccountId, instance) {
  const account = mastodonPost.account

  // Extract media (images and videos)
  let imageUrl = null
  let videoUrl = null

  if (mastodonPost.media_attachments && mastodonPost.media_attachments.length > 0) {
    const firstMedia = mastodonPost.media_attachments[0]

    if (firstMedia.type === 'image') {
      imageUrl = firstMedia.url || firstMedia.preview_url
    } else if (firstMedia.type === 'video' || firstMedia.type === 'gifv') {
      videoUrl = firstMedia.url
    }
  }

  // Strip HTML from content
  const plainTextContent = stripHtml(mastodonPost.content)

  // Build post URL
  const originalUrl = mastodonPost.url || mastodonPost.uri

  return {
    user_id: userId,
    followed_account_id: followedAccountId,
    platform: 'mastodon',
    external_id: mastodonPost.id,
    author_name: account.display_name || account.username,
    author_handle: `${account.username}@${instance}`,
    author_avatar: account.avatar || null,
    content: plainTextContent,
    image_url: imageUrl,
    video_url: videoUrl,
    original_url: originalUrl,
    content_type: detectContentType(plainTextContent),
    posted_at: mastodonPost.created_at,
    fetched_at: new Date().toISOString()
  }
}

/**
 * Fetch and store posts for a specific followed Mastodon account
 * @param {string} userId - AlbuCon user ID
 * @param {object} followedAccount - Followed account object with handle format 'username@instance.social'
 * @returns {Promise<number>} Number of new posts fetched
 */
export async function fetchAndStoreMastodonPosts(userId, followedAccount) {
  try {
    // Parse handle to get username and instance
    const handleParts = followedAccount.handle.split('@')
    if (handleParts.length !== 2) {
      console.error(`Invalid Mastodon handle format: ${followedAccount.handle}. Expected format: username@instance.social`)
      return 0
    }

    const [username, instance] = handleParts

    // Lookup account to get account ID
    const accountInfo = await lookupMastodonAccount(username, instance)
    if (!accountInfo) {
      console.error(`Could not find Mastodon account: ${followedAccount.handle}`)
      return 0
    }

    // Fetch posts
    const posts = await fetchMastodonAccountPosts(accountInfo.id, instance, 20)

    if (posts.length === 0) {
      console.log(`No posts found for ${followedAccount.handle}`)
      return 0
    }

    // Transform posts to AlbuCon format
    const transformedPosts = posts.map(post =>
      transformMastodonPost(post, userId, followedAccount.id, instance)
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
      console.error('Error storing Mastodon posts:', error)
      return 0
    }

    console.log(`Fetched ${data?.length || 0} new posts from ${followedAccount.handle}`)
    return data?.length || 0
  } catch (error) {
    console.error(`Error in fetchAndStoreMastodonPosts for ${followedAccount.handle}:`, error)
    return 0
  }
}

/**
 * Fetch posts for all enabled followed Mastodon accounts for a user
 * @param {string} userId - AlbuCon user ID
 * @returns {Promise<number>} Total number of new posts fetched
 */
export async function fetchAllMastodonFeeds(userId) {
  try {
    // Get all enabled followed accounts
    const { data: followedAccounts, error } = await supabase
      .from('followed_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'mastodon')
      .eq('enabled', true)

    if (error) throw error

    if (!followedAccounts || followedAccounts.length === 0) {
      console.log('No Mastodon accounts to fetch')
      return 0
    }

    console.log(`Fetching posts from ${followedAccounts.length} Mastodon accounts...`)

    // Fetch posts for each account
    let totalNewPosts = 0
    for (const account of followedAccounts) {
      const newPosts = await fetchAndStoreMastodonPosts(userId, account)
      totalNewPosts += newPosts

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`Total new posts fetched: ${totalNewPosts}`)
    return totalNewPosts
  } catch (error) {
    console.error('Error in fetchAllMastodonFeeds:', error)
    return 0
  }
}
