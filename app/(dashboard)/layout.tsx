import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
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

  // Ambil headers untuk mengecek URL path dari middleware
  const headerList = await headers()
  const pathname = headerList.get('x-pathname') || ''

  // Mencegah akses silang peran (staf tidak bisa masuk URL admin, dokter tidak bisa ke staf, dsb)
  if (pathname.startsWith('/dashboard/admin') && userData.role !== 'admin') {
    const defaultHomes: Record<string, string> = {
      staf: '/dashboard/staf/pendaftaran',
      dokter: '/dashboard/dokter/antrian'
    }
    redirect(defaultHomes[userData.role] || '/login')
  }

  if (pathname.startsWith('/dashboard/staf') && userData.role !== 'staf') {
    const defaultHomes: Record<string, string> = {
      admin: '/dashboard/admin/overview',
      dokter: '/dashboard/dokter/antrian'
    }
    redirect(defaultHomes[userData.role] || '/login')
  }

  if (pathname.startsWith('/dashboard/dokter') && userData.role !== 'dokter') {
    const defaultHomes: Record<string, string> = {
      admin: '/dashboard/admin/overview',
      staf: '/dashboard/staf/pendaftaran'
    }
    redirect(defaultHomes[userData.role] || '/login')
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
