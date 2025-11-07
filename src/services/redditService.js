import { supabase } from '../lib/supabase'

/**
 * Check if the Reddit proxy Edge Function is deployed and working
 * @returns {Promise<{healthy: boolean, message: string}>}
 */
export async function checkRedditProxyHealth() {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

    if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
      return {
        healthy: false,
        message: '❌ Supabase URL not configured. Set VITE_SUPABASE_URL in your .env file'
      }
    }

    // Test with a minimal Reddit API call
    const testUrl = 'https://www.reddit.com/r/programming.json?limit=1'
    const proxyUrl = `${supabaseUrl}/functions/v1/reddit-proxy?url=${encodeURIComponent(testUrl)}`

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return {
          healthy: false,
          message: '❌ Reddit proxy Edge Function not deployed. Run: supabase functions deploy reddit-proxy'
        }
      }
      const errorData = await response.json().catch(() => ({}))
      return {
        healthy: false,
        message: `⚠️ Reddit proxy returned error ${response.status}: ${errorData.error || response.statusText}`
      }
    }

    const data = await response.json()
    if (data.data?.children?.length > 0) {
      return {
        healthy: true,
        message: '✅ Reddit proxy Edge Function is working!'
      }
    }

    return {
      healthy: false,
      message: '⚠️ Reddit proxy responded but returned no data'
    }
  } catch (error) {
    return {
      healthy: false,
      message: `❌ Error checking Reddit proxy: ${error.message}`
    }
  }
}

/**
 * Fetch data from Reddit via Supabase Edge Function proxy
 * This bypasses CORS restrictions by using a server-side proxy
 * @param {string} redditUrl - Full Reddit JSON URL to fetch
 * @returns {Promise<object>} Reddit API response
 */
async function fetchViaProxy(redditUrl) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
    throw new Error('Supabase URL not configured. Please set VITE_SUPABASE_URL in your .env file')
  }

  const proxyUrl = `${supabaseUrl}/functions/v1/reddit-proxy?url=${encodeURIComponent(redditUrl)}`

  const response = await fetch(proxyUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`Proxy error: ${response.status} - ${errorData.error || response.statusText}`)
  }

  return await response.json()
}

/**
 * Fetch posts from a Reddit subreddit
 * @param {string} subreddit - Subreddit name (without r/)
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Array>} Array of posts
 */
export async function fetchRedditSubreddit(subreddit, limit = 25) {
  try {
    // Reddit's public JSON API - fetched via Supabase Edge Function to avoid CORS
    const url = `https://www.reddit.com/r/${subreddit}.json?limit=${limit}`
    const data = await fetchViaProxy(url)
    return data.data?.children || []
  } catch (error) {
    console.error(`Error fetching Reddit subreddit r/${subreddit}:`, error)
    return []
  }
}

/**
 * Fetch posts from a Reddit user
 * @param {string} username - Reddit username (without u/)
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Array>} Array of posts
 */
export async function fetchRedditUser(username, limit = 25) {
  try {
    // Reddit's public JSON API - fetched via Supabase Edge Function to avoid CORS
    const url = `https://www.reddit.com/user/${username}.json?limit=${limit}`
    const data = await fetchViaProxy(url)
    return data.data?.children || []
  } catch (error) {
    console.error(`Error fetching Reddit user u/${username}:`, error)
    return []
  }
}

/**
 * Detect content type based on post content
 * @param {string} title - Post title
 * @param {string} selftext - Post text content
 * @param {string} subreddit - Subreddit name
 * @returns {string} Content type
 */
export function detectContentType(title, selftext, subreddit) {
  const text = `${title} ${selftext}`.toLowerCase()
  const lowerSubreddit = subreddit.toLowerCase()

  // NSFW detection
  const nsfwKeywords = ['nsfw', '18+', 'adult', 'explicit']
  const nsfwSubreddits = ['nsfw', 'gonewild', 'nsfw_gif', 'realgirls', 'celebnsfw']

  if (nsfwKeywords.some(kw => text.includes(kw)) ||
      nsfwSubreddits.some(sub => lowerSubreddit.includes(sub))) {
    return 'nsfw'
  }

  // Political detection
  const politicalKeywords = [
    'trump', 'biden', 'harris', 'election', 'congress', 'senate',
    'politics', 'political', 'government', 'democrat', 'republican',
    'vote', 'voting', 'campaign', 'president', 'legislation'
  ]
  const politicalSubreddits = ['politics', 'worldnews', 'news', 'politicalhumor', 'conservative', 'liberal']

  if (politicalKeywords.some(kw => text.includes(kw)) ||
      politicalSubreddits.some(sub => lowerSubreddit === sub)) {
    return 'political'
  }

  // Venting detection
  const ventingKeywords = [
    'rant', 'ugh', 'angry', 'frustrated', 'hate', 'terrible', 'awful',
    'annoying', 'sick of', 'tired of', 'complaint'
  ]
  const ventingSubreddits = ['rant', 'offmychest', 'trueoffmychest', 'vent', 'complaints']

  if (ventingKeywords.some(kw => text.includes(kw)) ||
      ventingSubreddits.some(sub => lowerSubreddit === sub)) {
    return 'venting'
  }

  return 'general'
}

/**
 * Extract media URLs from Reddit post
 * @param {object} postData - Reddit post data
 * @returns {object} Object with imageUrl and videoUrl
 */
function extractMediaUrls(postData) {
  let imageUrl = null
  let videoUrl = null

  // Handle video posts (v.redd.it)
  if (postData.is_video && postData.media?.reddit_video) {
    videoUrl = postData.media.reddit_video.fallback_url
    // Also get thumbnail as image
    if (postData.preview?.images?.[0]?.source?.url) {
      imageUrl = postData.preview.images[0].source.url.replace(/&amp;/g, '&')
    }
    return { imageUrl, videoUrl }
  }

  // Handle image posts
  if (postData.post_hint === 'image') {
    imageUrl = postData.url
    return { imageUrl, videoUrl }
  }

  // Handle gallery posts (take first image)
  if (postData.is_gallery && postData.gallery_data?.items) {
    const firstImageId = postData.gallery_data.items[0].media_id
    if (postData.media_metadata?.[firstImageId]) {
      const mediaItem = postData.media_metadata[firstImageId]
      imageUrl = mediaItem.s?.u?.replace(/&amp;/g, '&') || mediaItem.s?.gif?.replace(/&amp;/g, '&')
    }
    return { imageUrl, videoUrl }
  }

  // Handle preview images (for link posts with previews)
  if (postData.preview?.images?.[0]?.source?.url) {
    imageUrl = postData.preview.images[0].source.url.replace(/&amp;/g, '&')
    return { imageUrl, videoUrl }
  }

  // Handle direct image links (i.redd.it, imgur, etc.)
  if (postData.url && (
    postData.url.includes('i.redd.it') ||
    postData.url.includes('i.imgur.com') ||
    postData.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  )) {
    imageUrl = postData.url
    return { imageUrl, videoUrl }
  }

  return { imageUrl, videoUrl }
}

/**
 * Transform Reddit post to AlbuCon format
 * @param {object} redditPost - Raw Reddit post (from .data.children[])
 * @param {string} userId - AlbuCon user ID
 * @param {string} followedAccountId - Followed account ID
 * @param {string} sourceType - 'subreddit' or 'user'
 * @returns {object} Transformed post for AlbuCon
 */
function transformRedditPost(redditPost, userId, followedAccountId, sourceType) {
  const post = redditPost.data

  // Extract media
  const { imageUrl, videoUrl } = extractMediaUrls(post)

  // Build content (title + selftext for text posts)
  let content = post.title
  if (post.selftext && post.selftext.trim()) {
    content += '\n\n' + post.selftext.substring(0, 500) // Limit selftext to 500 chars
    if (post.selftext.length > 500) {
      content += '...'
    }
  }

  // Build Reddit URL
  const originalUrl = `https://www.reddit.com${post.permalink}`

  return {
    user_id: userId,
    followed_account_id: followedAccountId,
    platform: 'reddit',
    external_id: post.id,
    author_name: post.author,
    author_handle: `u/${post.author}`,
    author_avatar: null, // Reddit JSON API doesn't provide user avatars
    content: content,
    image_url: imageUrl,
    video_url: videoUrl,
    original_url: originalUrl,
    content_type: detectContentType(post.title, post.selftext || '', post.subreddit),
    posted_at: new Date(post.created_utc * 1000).toISOString(),
    fetched_at: new Date().toISOString()
  }
}

/**
 * Fetch and store posts for a specific followed Reddit account
 * @param {string} userId - AlbuCon user ID
 * @param {object} followedAccount - Followed account object
 * @returns {Promise<number>} Number of new posts fetched
 */
export async function fetchAndStoreRedditPosts(userId, followedAccount) {
  try {
    let posts = []
    let sourceType = 'subreddit'

    // Determine if it's a subreddit (r/...) or user (u/...)
    if (followedAccount.handle.startsWith('r/')) {
      const subreddit = followedAccount.handle.substring(2) // Remove 'r/'
      posts = await fetchRedditSubreddit(subreddit, 20)
      sourceType = 'subreddit'
    } else if (followedAccount.handle.startsWith('u/')) {
      const username = followedAccount.handle.substring(2) // Remove 'u/'
      posts = await fetchRedditUser(username, 20)
      sourceType = 'user'
    } else {
      console.error(`Invalid Reddit handle format: ${followedAccount.handle}`)
      return 0
    }

    if (posts.length === 0) {
      console.log(`No posts found for ${followedAccount.handle}`)
      return 0
    }

    // Filter out removed/deleted posts and stickied posts
    const validPosts = posts.filter(p =>
      p.data &&
      !p.data.removed &&
      !p.data.removed_by_category &&
      !p.data.stickied &&
      p.data.author !== '[deleted]'
    )

    if (validPosts.length === 0) {
      console.log(`No valid posts found for ${followedAccount.handle}`)
      return 0
    }

    // Transform posts to AlbuCon format
    const transformedPosts = validPosts.map(post =>
      transformRedditPost(post, userId, followedAccount.id, sourceType)
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
      console.error('Error storing Reddit posts:', error)
      return 0
    }

    console.log(`Fetched ${data?.length || 0} new posts from ${followedAccount.handle}`)
    return data?.length || 0
  } catch (error) {
    console.error(`Error in fetchAndStoreRedditPosts for ${followedAccount.handle}:`, error)
    return 0
  }
}

/**
 * Fetch posts for all enabled followed Reddit accounts for a user
 * @param {string} userId - AlbuCon user ID
 * @returns {Promise<number>} Total number of new posts fetched
 */
export async function fetchAllRedditFeeds(userId) {
  try {
    // Get all enabled followed accounts
    const { data: followedAccounts, error } = await supabase
      .from('followed_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'reddit')
      .eq('enabled', true)

    if (error) throw error

    if (!followedAccounts || followedAccounts.length === 0) {
      console.log('No Reddit accounts to fetch')
      return 0
    }

    console.log(`Fetching posts from ${followedAccounts.length} Reddit sources...`)

    // Fetch posts for each account
    let totalNewPosts = 0
    for (const account of followedAccounts) {
      const newPosts = await fetchAndStoreRedditPosts(userId, account)
      totalNewPosts += newPosts

      // Add delay to respect rate limiting (Reddit is strict about this)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`Total new posts fetched: ${totalNewPosts}`)
    return totalNewPosts
  } catch (error) {
    console.error('Error in fetchAllRedditFeeds:', error)
    return 0
  }
}
