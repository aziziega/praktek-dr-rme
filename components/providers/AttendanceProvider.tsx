'use client'

import { useEffect } from 'react'
import { initAttendanceTracking } from '@/lib/attendance'

/**
 * Client component wrapper that initializes attendance tracking
 * via Supabase auth state change listener.
 * Place this inside the dashboard layout.
 */
export function AttendanceProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const unsubscribe = initAttendanceTracking()
    return () => {
      unsubscribe()
    }
  }, [])

  return <>{children}</>
}
