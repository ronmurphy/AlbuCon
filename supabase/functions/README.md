# Supabase Edge Functions

This directory contains Supabase Edge Functions for AlbuCon.

## Reddit Proxy Function

The `reddit-proxy` function acts as a server-side proxy to fetch data from Reddit's JSON API, bypassing CORS restrictions that prevent direct browser access.

### Why is this needed?

Reddit's JSON API doesn't allow CORS requests from browsers. By using a Supabase Edge Function, we can:
- Fetch Reddit data server-side (no CORS restrictions)
- Return the data to the browser with proper CORS headers

### Deploying the Edge Function

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project (you'll need your project ref ID from Supabase dashboard):
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy reddit-proxy
   ```

5. Verify the function is deployed:
   ```bash
   supabase functions list
   ```

### Testing the Function

You can test the function using curl:

```bash
curl "https://your-project-ref.supabase.co/functions/v1/reddit-proxy?url=https://www.reddit.com/r/programming.json?limit=5"
```

Replace `your-project-ref` with your actual Supabase project reference ID.

### Function URL

Once deployed, the function will be available at:
```
https://your-project-ref.supabase.co/functions/v1/reddit-proxy
```

The application automatically uses this URL based on your `VITE_SUPABASE_URL` environment variable.
