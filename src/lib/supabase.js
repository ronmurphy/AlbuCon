import { createClient } from '@supabase/supabase-js'

// These values come from your Supabase project settings
// 1. Go to https://supabase.com and create a free account
// 2. Create a new project
// 3. Go to Settings > API to find these values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Configure auth redirect for GitHub Pages with base path
const getRedirectUrl = () => {
  // For local development
  if (window.location.hostname === 'localhost') {
    return window.location.origin
  }
  // For GitHub Pages with /AlbuCon/ base path
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: getRedirectUrl(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
