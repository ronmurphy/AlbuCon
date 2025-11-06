import { createClient } from '@supabase/supabase-js'

// These values come from your Supabase project settings
// 1. Go to https://supabase.com and create a free account
// 2. Create a new project
// 3. Go to Settings > API to find these values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
