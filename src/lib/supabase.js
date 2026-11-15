import { createClient } from '@supabase/supabase-js'

// Set in .env.local (see .env.example). The publishable key is meant for browsers;
// access is controlled by Supabase row-level security.
const SB_URL = import.meta.env.VITE_SUPABASE_URL
const SB_KEY = import.meta.env.VITE_SUPABASE_KEY

if (!SB_URL || !SB_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY. Copy .env.example to .env.local and fill them in.')
}

export const supabase = createClient(SB_URL, SB_KEY)
