import { createClient } from '@/lib/supabase/client'

/**
 * Initialize attendance tracking via Supabase auth state changes.
 * - SIGNED_IN: insert attendance_logs if no record exists for today (jam_masuk = now())
 * - SIGNED_OUT: update jam_keluar = now() for today's record
 *
 * Call this once in a client component (e.g., AttendanceProvider).
 * Returns an unsubscribe function.
 */
export function initAttendanceTracking(): () => void {
  const supabase = createClient()

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
      try {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

        // Check if attendance record already exists for today
        const { data: existing } = await supabase
          .from('attendance_logs')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('tanggal', today)
          .single()

        // Only insert if no record exists (first login of the day)
        if (!existing) {
          await (supabase.from('attendance_logs') as any).insert({
            user_id: session.user.id,
            tanggal: today,
            jam_masuk: new Date().toISOString(),
          })
        }
      } catch (err) {
        // Silently fail — attendance tracking should not block user flow
        console.error('[Attendance] Error recording sign-in:', err)
      }
    }

    if (event === 'SIGNED_OUT') {
      try {
        // We need the user ID from the session that just ended.
        // On SIGNED_OUT, session may be null in newer Supabase versions,
        // so we need to handle this gracefully.
        if (session?.user?.id) {
          const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

          await (supabase.from('attendance_logs') as any)
            .update({ jam_keluar: new Date().toISOString() })
            .eq('user_id', session.user.id)
            .eq('tanggal', today)
            .is('jam_keluar', null)
        }
      } catch (err) {
        console.error('[Attendance] Error recording sign-out:', err)
      }
    }
  })

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
}
