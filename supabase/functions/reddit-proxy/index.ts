import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const redditUrl = url.searchParams.get('url')

    if (!redditUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate that it's a Reddit URL
    if (!redditUrl.startsWith('https://www.reddit.com/') &&
        !redditUrl.startsWith('https://reddit.com/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid Reddit URL' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch from Reddit with proper headers
    const response = await fetch(redditUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AlbuCon:v1.0.0 (by /u/sphere_social_app)',
      },
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `Reddit API error: ${response.status} ${response.statusText}`
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
