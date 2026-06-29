'use client'

import Link from 'next/link'
import { Users, Banknote, Activity, Pill, CheckCircle2, Timer, ArrowRight, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface RecentActivity {
  id: string
  aksi: string
  created_at: string
  userName: string
  userRole: string
}

interface LowStockItem {
  id: string
  nama: string
  stok: number
  satuan: string
}

interface AdminDashboardClientProps {
  antrean: number
  selesai: number
  activityCount: number
  recentActivities: RecentActivity[]
  pendapatan: number
  pendapatanPeriksa: number
  pendapatanObat: number
  jumlahTransaksi: number
  lowStockCount: number
  lowStockItems: LowStockItem[]
}

interface MetricCardProps {
  icon: React.ElementType
  label: string
  value?: string | number
  subtext?: string
  trend?: string
  iconBg: string
  iconColor: string
  cardBg: string
  borderColor: string
  valueColor: string
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  iconBg,
  iconColor,
  cardBg,
  borderColor,
  valueColor,
}: MetricCardProps) {
  return (
    <div className={`relative flex flex-col gap-4 rounded-2xl border p-5 transition-all shadow-sm ${cardBg} ${borderColor}`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
          {label}
        </p>
        <p className={`text-3xl font-extrabold leading-none tracking-tight ${valueColor}`}>
          {value}
        </p>
        {subtext && (
          <p className="mt-1 text-xs text-gray-400">{subtext}</p>
        )}
        {trend && (
          <p className="mt-2 text-xs font-medium text-gray-500">{trend}</p>
        )}
      </div>
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} jam lalu`

  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay} hari lalu`
}

function getActionLabel(aksi: string): string {
  const map: Record<string, string> = {
    TAMBAH_USER: 'Menambah user baru',
    EDIT_USER: 'Mengedit data user',
    AKTIF_USER: 'Mengaktifkan user',
    NONAKTIF_USER: 'Menonaktifkan user',
    GANTI_PASSWORD_USER: 'Mengubah password user',
    TAMBAH_OBAT: 'Menambah obat baru',
    EDIT_OBAT: 'Mengedit data obat',
    TAMBAH_STOK: 'Menambah stok obat',
    AKTIF_OBAT: 'Mengaktifkan obat',
    NONAKTIF_OBAT: 'Menonaktifkan obat',
    HAPUS_OBAT: 'Menghapus obat',
    TAMBAH_PASIEN: 'Mendaftarkan pasien baru',
    EDIT_PASIEN: 'Mengedit data pasien',
    EDIT_PASIEN_STAF: 'Mengedit data pasien',
    EDIT_PASIEN_ALERGI: 'Memperbarui alergi obat pasien',
    IMPORT_PASIEN: 'Mengimpor data pasien',
    HAPUS_PASIEN: 'Menghapus data pasien',
    DAFTAR_KUNJUNGAN: 'Mendaftarkan kunjungan pasien',
    SIMPAN_REKAM_MEDIS: 'Menyimpan rekam medis',
    CATAT_BAYAR: 'Mencatat pembayaran',
  }
  return map[aksi] ?? aksi.replace(/_/g, ' ').toLowerCase()
}

function getActionColor(aksi: string): string {
  const act = aksi.toUpperCase()
  if (act.startsWith('TAMBAH_') || act.startsWith('AKTIF_') || act.includes('IMPORT_') || act.startsWith('DAFTAR_'))
    return 'bg-emerald-400'
  if (act.startsWith('EDIT_') || act.startsWith('GANTI_'))
    return 'bg-amber-400'
  if (act.startsWith('NONAKTIF_') || act.startsWith('HAPUS_') || act.startsWith('BATAL_'))
    return 'bg-rose-400'
  if (act.includes('SIMPAN_') || act.includes('CATAT_'))
    return 'bg-sky-400'
  return 'bg-slate-400'
}

const roleColors: Record<string, string> = {
  admin: 'bg-amber-100 text-amber-700 border-amber-200',
  dokter: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  staf: 'bg-sky-100 text-sky-700 border-sky-200',
}

export function AdminDashboardClient({
  antrean,
  selesai,
  activityCount,
  recentActivities,
  pendapatan,
  pendapatanPeriksa,
  pendapatanObat,
  jumlahTransaksi,
  lowStockCount,
  lowStockItems,
}: AdminDashboardClientProps) {
  const menunggu = Math.max(0, antrean - selesai)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ringkasan operasional klinik hari ini — data diperbarui setiap kunjungan halaman.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Antrean */}
        <MetricCard
          icon={Users}
          label="Total Antrean"
          value={antrean}
          subtext={`${selesai} selesai · ${menunggu} menunggu`}
          trend="Pasien terdaftar hari ini"
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
          cardBg="bg-white"
          borderColor="border-sky-100"
          valueColor="text-sky-700"
        />

        {/* Pendapatan */}
        <MetricCard
          icon={Banknote}
          label="Pendapatan Hari Ini"
          value={formatCurrency(pendapatan)}
          subtext={`${jumlahTransaksi} transaksi lunas`}
          trend={`Periksa ${formatCurrency(pendapatanPeriksa)} · Obat ${formatCurrency(pendapatanObat)}`}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          cardBg="bg-white"
          borderColor="border-emerald-100"
          valueColor="text-emerald-700"
        />

        {/* Activity Log */}
        <MetricCard
          icon={Activity}
          label="Activity Log"
          value={activityCount}
          subtext="Aktivitas tercatat hari ini"
          trend="Audit trail sistem"
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          cardBg="bg-white"
          borderColor="border-violet-100"
          valueColor="text-violet-700"
        />

        {/* Stok Obat Menipis */}
        <MetricCard
          icon={Pill}
          label="Stok Obat Menipis"
          value={lowStockCount}
          subtext={lowStockCount > 0 ? 'Jenis obat perlu restock' : 'Semua stok aman'}
          trend={lowStockCount > 0 ? 'Stok di bawah 10 unit' : undefined}
          iconBg={lowStockCount > 0 ? 'bg-rose-100' : 'bg-emerald-100'}
          iconColor={lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}
          cardBg="bg-white"
          borderColor={lowStockCount > 0 ? 'border-rose-100' : 'border-emerald-100'}
          valueColor={lowStockCount > 0 ? 'text-rose-700' : 'text-emerald-700'}
        />
      </div>

      {/* Sub-stats for Antrean */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="text-xs font-medium text-emerald-700">Selesai</p>
            <p className="text-xl font-bold text-emerald-700">{selesai}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
          <Timer className="h-5 w-5 shrink-0 text-sky-500" />
          <div>
            <p className="text-xs font-medium text-sky-700">Menunggu / Proses</p>
            <p className="text-xl font-bold text-sky-700">{menunggu}</p>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-rose-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Peringatan Stok Menipis</h3>
                <p className="text-[11px] text-gray-400">Obat aktif dengan stok di bawah 10 unit</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <Link href="/dashboard/admin/obat">
                Kelola Stok
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-gray-50">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Pill className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-800">{item.nama}</span>
                </div>
                <Badge
                  variant="outline"
                  className={`font-bold text-xs tabular-nums ${
                    item.stok === 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : item.stok <= 3
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                  }`}
                >
                  {item.stok} {item.satuan}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Timeline */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
              <Activity className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Aktivitas Terbaru</h3>
              <p className="text-[11px] text-gray-400">Timeline ringkas seluruh aksi dalam sistem</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1.5 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50"
          >
            <Link href="/dashboard/admin/activity">
              Lihat Semua
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="divide-y divide-gray-50">
          {recentActivities.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Belum ada aktivitas tercatat.
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3.5 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
              >
                <div className="mt-1.5 flex flex-col items-center">
                  <div className={`h-2.5 w-2.5 rounded-full ${getActionColor(activity.aksi)} ring-4 ring-white`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-snug">
                    <span className="font-semibold">{activity.userName}</span>
                    {' '}
                    <span className="text-gray-500">{getActionLabel(activity.aksi)}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold px-1.5 py-0 rounded ${roleColors[activity.userRole] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                    >
                      {activity.userRole}
                    </Badge>
                    <span className="text-[11px] text-gray-400">
                      {formatTimeAgo(activity.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
