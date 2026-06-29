'use client'

import { Users, Banknote, Activity, Clock, Construction, CheckCircle2, Timer } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminDashboardClientProps {
  antrean: number
  selesai: number
}

// ─── Under Construction Badge ──────────────────────────────────────────────────

function UnderConstructionBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 border border-amber-200">
      <Construction className="h-3 w-3" />
      Coming Soon
    </span>
  )
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

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
  isComingSoon?: boolean
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
  isComingSoon = false,
}: MetricCardProps) {
  return (
    <div
      className={`relative flex flex-col gap-4 rounded-2xl border p-5 transition-all shadow-sm ${
        isComingSoon
          ? 'border-gray-100 bg-gray-50/70 opacity-60'
          : `${cardBg} ${borderColor}`
      }`}
    >
      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        {isComingSoon && <UnderConstructionBadge />}
      </div>

      {/* Value */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
          {label}
        </p>
        <p className={`text-3xl font-extrabold leading-none tracking-tight ${isComingSoon ? 'text-gray-200' : valueColor}`}>
          {isComingSoon ? '—' : value}
        </p>
        {!isComingSoon && subtext && (
          <p className="mt-1 text-xs text-gray-400">{subtext}</p>
        )}
        {!isComingSoon && trend && (
          <p className="mt-2 text-xs font-medium text-gray-500">{trend}</p>
        )}
      </div>
    </div>
  )
}

// ─── Exported Component ───────────────────────────────────────────────────────

export function AdminDashboardClient({
  antrean,
  selesai,
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

        {/* ── Antrean ── LIVE */}
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

        {/* ── Keuangan ── COMING SOON */}
        <MetricCard
          icon={Banknote}
          label="Pendapatan Hari Ini"
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          cardBg="bg-white"
          borderColor="border-emerald-100"
          valueColor="text-emerald-700"
          isComingSoon
        />

        {/* ── Activity Log ── COMING SOON */}
        <MetricCard
          icon={Activity}
          label="Activity Log"
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
          cardBg="bg-white"
          borderColor="border-violet-100"
          valueColor="text-violet-700"
          isComingSoon
        />

        {/* ── Attendance ── COMING SOON */}
        <MetricCard
          icon={Clock}
          label="Kehadiran Staf"
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          cardBg="bg-white"
          borderColor="border-amber-100"
          valueColor="text-amber-700"
          isComingSoon
        />
      </div>

      {/* Sub-stats for Antrean (live) */}
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

      {/* Coming Soon notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
        <Construction className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-sm text-amber-700">
          <span className="font-semibold">3 metrik lainnya</span> (Pendapatan, Activity Log, Kehadiran Staf) akan tersedia setelah fitur terkait selesai dikembangkan.
        </p>
      </div>
    </div>
  )
}
