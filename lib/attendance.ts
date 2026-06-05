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

    // Note: SIGNED_OUT event check-out is handled server-side in the logout action (app/actions/auth.ts) to avoid session null issues.
  })

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
}
