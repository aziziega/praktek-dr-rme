import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Filter out literal string replacements from Next.js bundler
  if (!url || url === 'undefined' || url === 'null' || !url.startsWith('http')) {
    url = 'https://wgyndrneovhawabxuwfh.supabase.co'
  }
  if (!anonKey || anonKey === 'undefined' || anonKey === 'null') {
    anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneW5kcm5lb3ZoYXdhYnh1d2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MzQ4NjMsImV4cCI6MjA5NTQxMDg2M30.QoddsS0UcwAoHrMkEnwgQrhlgFXwcSQqvHXFl4fJ354'
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
