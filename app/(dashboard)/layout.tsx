import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { AttendanceProvider } from '@/components/providers/AttendanceProvider'
import type { UserRole } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — RME Praktek Dr. Sudiman',
  description: 'Dashboard Sistem Rekam Medis Elektronik',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile from users table
  const { data } = await supabase
    .from('users')
    .select('nama, role, aktif')
    .eq('id', user.id)
    .single()

  const userData = data as { nama: string; role: string; aktif: boolean } | null

  if (!userData || !userData.aktif) {
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <AttendanceProvider>
      <DashboardShell
        userName={userData.nama}
        userRole={userData.role as UserRole}
      >
        {children}
      </DashboardShell>
    </AttendanceProvider>
  )
}
