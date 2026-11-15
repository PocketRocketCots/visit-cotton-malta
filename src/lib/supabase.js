import { createClient } from '@supabase/supabase-js'

// Publishable (public) key: safe to ship in the browser. Access is controlled by Supabase row-level security.
const SB_URL = 'https://wsfudajrdlimgtrymhdz.supabase.co'
const SB_KEY = 'sb_publishable_rwanDyifL3-2FHFFyqdMdQ_KIm-ytH3'

export const supabase = createClient(SB_URL, SB_KEY)
