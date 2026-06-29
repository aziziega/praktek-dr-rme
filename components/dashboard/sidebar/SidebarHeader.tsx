'use client'

import { useEffect, useState } from 'react'
import { Stethoscope } from 'lucide-react'

// ─── Live Clock ──────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  function formatDate(date: Date): string {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des',
    ]
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
  }

  function formatTime(date: Date): string {
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    const s = String(date.getSeconds()).padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  return (
    <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-emerald-50 px-3 py-2.5 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Date & Time */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Waktu Lokal
          </p>
          <p className="text-lg font-bold font-mono text-gray-800 leading-tight">
            {time ? formatTime(time) : '--:--:--'}
          </p>
          <p className="text-[10px] text-gray-400">
            {time ? formatDate(time) : 'Memuat...'}
          </p>
        </div>

        {/* Online Status Indicator */}
        <div className="flex flex-col items-center gap-1">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 whitespace-nowrap">
            Online
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Exported SidebarHeader ───────────────────────────────────────────────────

export function SidebarHeader() {
  return (
    <div className="px-4 pt-5 pb-4 space-y-3">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-md shadow-sky-500/20">
          <Stethoscope className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-gray-900 leading-tight">
            Dr. Sudiman
          </h2>
          <p className="text-[11px] text-gray-400">Rekam Medis Elektronik</p>
        </div>
      </div>

      {/* Live Clock + Status Online */}
      <LiveClock />
    </div>
  )
}
