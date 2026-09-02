import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboardClient } from '@/components/dashboard/admin/AdminDashboardClient'

export const metadata: Metadata = {
  title: 'Overview â€” Dashboard Admin | RME Dr. Sudiman',
  description: 'Ringkasan operasional klinik hari ini untuk admin.',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const LOW_STOCK_THRESHOLD = 10

  const [
    { count: antreanCount },
    { count: selesaiCount },
    { count: activityCount },
    { data: recentActivities },
    { data: pendapatanData },
    { data: lowStockData, count: lowStockCount },
  ] = await Promise.all([
    supabase
      .from('kunjungan')
      .select('*', { count: 'exact', head: true })
      .eq('tanggal', today),

    supabase
      .from('kunjungan')
      .select('*', { count: 'exact', head: true })
      .eq('tanggal', today)
      .eq('status', 'selesai'),

    supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`),

    (supabase
      .from('activity_logs') as any)
      .select('id, aksi, created_at, users(nama, role)')
      .order('created_at', { ascending: false })
      .limit(5),

    (supabase
      .from('pembayaran') as any)
      .select('tarif_periksa, total_obat, total_bayar')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .eq('status', 'lunas'),

    (supabase
      .from('obat') as any)
      .select('id, nama, stok, satuan', { count: 'exact' })
      .eq('aktif', true)
      .lt('stok', LOW_STOCK_THRESHOLD)
      .order('stok', { ascending: true })
      .limit(5),
  ])

  const payments = (pendapatanData ?? []) as { tarif_periksa: number; total_obat: number; total_bayar: number }[]

  const totalPendapatan = payments.reduce(
    (sum, row) => sum + Number(row.total_bayar ?? 0),
    0
  )
  const totalPeriksa = payments.reduce(
    (sum, row) => sum + Number(row.tarif_periksa ?? 0),
    0
  )
  const totalObat = payments.reduce(
    (sum, row) => sum + Number(row.total_obat ?? 0),
    0
  )

  const activities = (recentActivities ?? []).map((a: any) => ({
    id: a.id as string,
    aksi: a.aksi as string,
    created_at: a.created_at as string,
    userName: (a.users?.nama as string) ?? 'System',
    userRole: (a.users?.role as string) ?? 'system',
  }))

  const lowStockItems = ((lowStockData ?? []) as { id: string; nama: string; stok: number; satuan: string }[])

  return (
    <AdminDashboardClient
      antrean={antreanCount ?? 0}
      selesai={selesaiCount ?? 0}
      activityCount={activityCount ?? 0}
      recentActivities={activities}
      pendapatan={totalPendapatan}
      pendapatanPeriksa={totalPeriksa}
      pendapatanObat={totalObat}
      jumlahTransaksi={payments.length}
      lowStockCount={lowStockCount ?? 0}
      lowStockItems={lowStockItems}
    />
  )
}


