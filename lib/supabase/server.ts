import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Filter out literal string replacements from Next.js bundler
  if (!url || url === 'undefined' || url === 'null' || !url.startsWith('http')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set or invalid')
  }
  if (!anonKey || anonKey === 'undefined' || anonKey === 'null') {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or invalid')
  }

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have proxy (middleware) refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
