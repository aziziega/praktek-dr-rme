import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let supabaseClient: any = null

export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Filter out literal string replacements from Next.js bundler
  if (!url || url === 'undefined' || url === 'null' || !url.startsWith('http')) {
    url = 'https://wgyndrneovhawabxuwfh.supabase.co'
  }
  if (!anonKey || anonKey === 'undefined' || anonKey === 'null') {
    anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneW5kcm5lb3ZoYXdhYnh1d2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MzQ4NjMsImV4cCI6MjA5NTQxMDg2M30.QoddsS0UcwAoHrMkEnwgQrhlgFXwcSQqvHXFl4fJ354'
  }

  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(url, anonKey)
  }
  
  return supabaseClient
}
