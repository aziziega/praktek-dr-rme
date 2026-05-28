import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Klien khusus ini memiliki hak akses ADMIN (bypass RLS).
// HANYA BOLEH DIGUNAKAN DI SERVER ACTIONS ATAU ROUTE HANDLERS.
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL atau Service Role Key tidak ditemukan di environment variables.')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
