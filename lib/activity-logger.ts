import { createClient } from '@/lib/supabase/server'

export interface ActivityLogParams {
  userId: string
  aksi: string
  targetTabel?: string
  targetId?: string
  detail?: Record<string, unknown>
}

/**
 * Log an activity to the activity_logs table.
 * Should be called from server actions or route handlers.
 *
 * @example
 * await logActivity({
 *   userId: user.id,
 *   aksi: 'TAMBAH_PASIEN',
 *   targetTabel: 'pasien',
 *   targetId: pasien.id,
 *   detail: { nama: pasien.nama, nrm: pasien.nrm },
 * })
 */
export async function logActivity({
  userId,
  aksi,
  targetTabel,
  targetId,
  detail,
}: ActivityLogParams): Promise<void> {
  try {
    const supabase = await createClient()

    // Attempt to get IP address from headers
    let ipAddress: string | null = null
    try {
      const { headers } = await import('next/headers')
      const headerStore = await headers()
      ipAddress =
        headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        headerStore.get('x-real-ip') ??
        null
    } catch {
      // Headers may not be available in all contexts
    }

    await (supabase.from('activity_logs') as any).insert({
      user_id: userId,
      aksi,
      target_tabel: targetTabel ?? null,
      target_id: targetId ?? null,
      detail: detail ?? null,
      ip_address: ipAddress,
    })
  } catch (err) {
    // Activity logging should not throw or block operations
    console.error('[ActivityLogger] Failed to log activity:', err)
  }
}
