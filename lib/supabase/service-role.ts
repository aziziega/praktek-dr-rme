import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import fs from 'fs'
import path from 'path'

// Klien khusus ini memiliki hak akses ADMIN (bypass RLS).
// HANYA BOLEH DIGUNAKAN DI SERVER ACTIONS ATAU ROUTE HANDLERS.
export function createServiceRoleClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  let supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    try {
      const envPath = path.join(process.cwd(), '.env')
      if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8')
        envFile.split('\n').forEach(line => {
          const parts = line.split('=')
          if (parts.length >= 2) {
            const key = parts[0].trim()
            const val = parts.slice(1).join('=').trim()
            if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
              supabaseUrl = val
            } else if (key === 'SUPABASE_SERVICE_ROLE_KEY') {
              supabaseServiceRoleKey = val
            }
          }
        })
      }
    } catch (err: any) {
      console.error('[service-role] Failed to read .env file fallback:', err.message)
    }
  }

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

