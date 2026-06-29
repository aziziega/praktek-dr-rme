import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from '@/components/dashboard/admin/AdminDashboardClient'

export const metadata: Metadata = {
  title: 'Overview — Dashboard Admin | RME Dr. Sudiman',
  description: 'Ringkasan operasional klinik hari ini untuk admin.',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Ambil jumlah kunjungan hari ini (antrian)
  const today = new Date().toISOString().split('T')[0]
  const { count: antreanCount } = await supabase
    .from('kunjungan')
    .select('*', { count: 'exact', head: true })
    .eq('tanggal', today)

  // Jumlah pasien selesai hari ini
  const { count: selesaiCount } = await supabase
    .from('kunjungan')
    .select('*', { count: 'exact', head: true })
    .eq('tanggal', today)
    .eq('status', 'selesai')

  return (
    <AdminDashboardClient
      antrean={antreanCount ?? 0}
      selesai={selesaiCount ?? 0}
    />
  )
}
