import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let supabaseClient: any = null

export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Filter out literal string replacements from Next.js bundler
  if (!url || url === 'undefined' || url === 'null' || !url.startsWith('http')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set or invalid')
  }
  if (!anonKey || anonKey === 'undefined' || anonKey === 'null') {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or invalid')
  }

  if (!supabaseClient) {
    supabaseClient = createBrowserClient<Database>(url, anonKey)
  }
  
  return supabaseClient
}
