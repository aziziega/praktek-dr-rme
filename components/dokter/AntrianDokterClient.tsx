'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getAntrianDokter,
  updateStatusKunjungan,
  type AntrianDokterItem,
} from '@/app/actions/dokter'
import { createClient } from '@/lib/supabase/client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Stethoscope,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Activity,
  Thermometer,
  Users,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'

interface AntrianDokterClientProps {
  dokterId: string
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  menunggu: {
    label: 'Menunggu',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  diperiksa: {
    label: 'Diperiksa',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Stethoscope,
  },
  selesai: {
    label: 'Selesai',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
}

// Simple beep sound using Web Audio API (no external file needed)
function playNotificationBeep() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime) // A5 note
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
    // Play a second beep after a short pause
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1100, ctx.currentTime + 0.15) // C#6 note
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65)
    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.65)
  } catch {
    // Audio not available, silently ignore
  }
}

export function AntrianDokterClient({ dokterId }: AntrianDokterClientProps) {
  const [antrian, setAntrian] = useState<AntrianDokterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set())
  const prevAntrianIdsRef = useRef<Set<string>>(new Set())
  const hasInitialLoadRef = useRef(false)

  // Get local timezone-safe date string YYYY-MM-DD (Asia/Jakarta)
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  const [selectedDate, setSelectedDate] = useState<string>(todayStr)

  // Reset loading and initial load ref when selectedDate changes to prevent false positive notifications
  useEffect(() => {
    setLoading(true)
    hasInitialLoadRef.current = false
  }, [selectedDate])

  const fetchAntrian = useCallback(async () => {
    try {
      const data = await getAntrianDokter(selectedDate)
      setAntrian(data)
    } catch {
      console.error('[AntrianDokter] Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  // Initial fetch
  useEffect(() => {
    fetchAntrian()
  }, [fetchAntrian])

  // Track previous antrian IDs to detect newly inserted items
  useEffect(() => {
    if (!loading) {
      const currentIds = new Set(antrian.map((a) => a.id))
      const freshIds = new Set<string>()

      if (hasInitialLoadRef.current) {
        currentIds.forEach((id) => {
          if (!prevAntrianIdsRef.current.has(id)) {
            freshIds.add(id)
          }
        })
      } else {
        hasInitialLoadRef.current = true
      }

      if (freshIds.size > 0) {
        setNewItemIds(freshIds)
        // Clear the flash after 3 seconds
        const timer = setTimeout(() => setNewItemIds(new Set()), 3000)
        return () => clearTimeout(timer)
      }
      prevAntrianIdsRef.current = currentIds
    }
  }, [antrian, loading])

  // Supabase Realtime: listen for new patients assigned to this doctor for selectedDate
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let pollInterval: ReturnType<typeof setInterval> | null = null
    let active = true

    async function connect() {
      if (!active) return

      // Remove old channel if exists
      if (channel) {
        await supabase.removeChannel(channel)
        channel = null
      }

      channel = supabase
        .channel(`antrian-dokter-${dokterId}-${selectedDate}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'kunjungan',
          },
          (payload: any) => {
            if (!active) return
            console.log('[Realtime Dokter] Received change:', payload)
            const newRow = payload.new as any
            const oldRow = payload.old as any

            if (payload.eventType === 'INSERT') {
              // Filter client-side: only react to rows assigned to this doctor today
              if (newRow && newRow.dokter_id === dokterId && newRow.tanggal === selectedDate) {
                console.log('[Realtime Dokter] ✅ New patient assigned to me!')
                playNotificationBeep()
                toast.info('🔔 Pasien baru masuk antrian Anda!', {
                  description: 'Berkas kunjungan telah dikirim oleh staf. Silakan periksa daftar antrian.',
                  duration: 8000,
                })
                fetchAntrian()
              }
            } else if (payload.eventType === 'UPDATE') {
              if (
                (newRow && newRow.dokter_id === dokterId && newRow.tanggal === selectedDate) ||
                (oldRow && oldRow.dokter_id === dokterId && oldRow.tanggal === selectedDate)
              ) {
                console.log('[Realtime Dokter] Visit updated')
                fetchAntrian()
              }
            } else if (payload.eventType === 'DELETE') {
              fetchAntrian()
            }
          }
        )
        .subscribe((status: string, err?: Error) => {
          console.log(`[Realtime Dokter] Status: ${status}`, err ?? '')
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime Dokter] ✅ Connected and listening')
            // Clear polling fallback once realtime is confirmed working
            if (pollInterval) {
              clearInterval(pollInterval)
              pollInterval = null
            }
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[Realtime Dokter] ⚠️ Channel error, will use polling fallback')
          }
        })

      // Polling fallback: refresh every 15s in case realtime is blocked/slow
      pollInterval = setInterval(() => {
        if (active) {
          console.log('[Realtime Dokter] 🔄 Polling fallback refresh')
          fetchAntrian()
        }
      }, 15000)
    }

    connect()

    return () => {
      active = false
      if (pollInterval) clearInterval(pollInterval)
      if (channel) supabase.removeChannel(channel)
    }
  }, [dokterId, selectedDate, fetchAntrian])



  const handlePrevDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() - 1)
    
    const yStr = d.getFullYear()
    const mStr = String(d.getMonth() + 1).padStart(2, '0')
    const dStr = String(d.getDate()).padStart(2, '0')
    setSelectedDate(`${yStr}-${mStr}-${dStr}`)
  }

  const handleNextDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    d.setDate(d.getDate() + 1)
    
    const yStr = d.getFullYear()
    const mStr = String(d.getMonth() + 1).padStart(2, '0')
    const dStr = String(d.getDate()).padStart(2, '0')
    setSelectedDate(`${yStr}-${mStr}-${dStr}`)
  }

  const handleToday = () => {
    setSelectedDate(todayStr)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedDate(e.target.value)
    }
  }

  const formatDateDisplay = (dateStr: string): string => {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  async function handlePeriksa(kunjunganId: string) {
    setProcessingId(kunjunganId)
    setIsNavigating(true)
    try {
      const result = await updateStatusKunjungan(kunjunganId, 'diperiksa')
      if (!result.success) {
        toast.error(result.error ?? 'Gagal memperbarui status')
        setProcessingId(null)
        setIsNavigating(false)
        return
      }
      // Use hard navigation to avoid App Router race condition with router.refresh()
      // that was causing the page to briefly flash back to antrian before navigating
      window.location.href = `/dashboard/dokter/periksa/${kunjunganId}`
    } catch {
      toast.error('Terjadi kesalahan')
      setProcessingId(null)
      setIsNavigating(false)
    }
  }

  function handleLihat(kunjunganId: string) {
    setIsNavigating(true)
    window.location.href = `/dashboard/dokter/periksa/${kunjunganId}`
  }

  function formatTime(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return '-'
    }
  }

  function calculateAge(dateStr: string | null): string {
    if (!dateStr) return '-'
    try {
      const birth = new Date(dateStr)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return `${age} thn`
    } catch {
      return '-'
    }
  }

  // Counters
  const total = antrian.length
  const menunggu = antrian.filter((a) => a.status === 'menunggu').length
  const diperiksa = antrian.filter((a) => a.status === 'diperiksa').length
  const selesai = antrian.filter((a) => a.status === 'selesai').length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/85 backdrop-blur-md transition-all duration-300">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-sky-100 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-sky-500 animate-spin"></div>
            </div>
            <div className="space-y-1 text-center">
              <h3 className="text-base font-bold text-slate-800 animate-pulse">
                Menyiapkan Lembar Pemeriksaan
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Mohon tunggu, memuat rekam medis pasien...
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Date Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-sm mb-1">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Antrian Dokter
          </p>
          <h2 className="text-lg font-bold text-gray-800 mt-0.5">
            {selectedDate === todayStr
              ? 'Hari Ini'
              : new Date(selectedDate).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
          </h2>
        </div>

        {/* Navigation Controls in Soft Light Theme */}
        <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-150">
          {/* Prev Button */}
          <button
            type="button"
            onClick={handlePrevDay}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm active:scale-95"
            title="Hari Sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Hari Ini Button */}
          <button
            type="button"
            onClick={handleToday}
            className="px-3 h-9 flex items-center justify-center font-semibold text-gray-600 hover:text-gray-900 transition-colors text-xs active:scale-95"
          >
            Hari Ini
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={handleNextDay}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm active:scale-95"
            title="Hari Berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Date Pill Capsule (Soft light palette) */}
          <div className="h-9 px-3 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center gap-2 select-none relative hover:bg-gray-50 transition-colors ml-1">
            {/* Left Soft Red Calendar Icon */}
            <Calendar className="h-4 w-4 text-rose-500 shrink-0" />
            
            {/* Date Display (Monospace Slate Font) */}
            <span className="font-mono font-semibold text-slate-700 text-sm tracking-wide">
              {formatDateDisplay(selectedDate)}
            </span>

            {/* Right Soft Calendar Icon */}
            <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />

            {/* Invisible Date Input to open browser picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Total',
            value: total,
            icon: Users,
            color: 'text-gray-700',
            bg: 'bg-gray-50',
            border: 'border-gray-200',
          },
          {
            label: 'Menunggu',
            value: menunggu,
            icon: Clock,
            color: 'text-amber-700',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
          },
          {
            label: 'Diperiksa',
            value: diperiksa,
            icon: Stethoscope,
            color: 'text-blue-700',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
          },
          {
            label: 'Selesai',
            value: selesai,
            icon: CheckCircle2,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className={`${card.border} ${card.bg} border`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">{card.label}</p>
                    <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${card.color} opacity-30`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Patient Cards */}
      {antrian.length === 0 ? (
        <Card className="border-dashed border-gray-200 bg-gray-50/50">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 mb-3">
              <Users className="h-7 w-7 text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">
              {selectedDate === todayStr
                ? 'Belum ada antrian hari ini'
                : `Belum ada antrian untuk tanggal ${formatDateDisplay(selectedDate)}`}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {selectedDate === todayStr
                ? 'Pasien yang di-assign ke Anda akan muncul di sini secara realtime.'
                : 'Tidak ada riwayat kunjungan pasien yang di-assign ke Anda pada tanggal ini.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {antrian.map((item) => {
            const isSelesai = item.status === 'selesai'
            const isDiperiksa = item.status === 'diperiksa'
            const hasAlergi = !!item.pasien_alergi_obat
            const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.menunggu
            const StatusIcon = statusCfg.icon

            const isNewItem = newItemIds.has(item.id)

            return (
              <Card
                key={item.id}
                className={`transition-all duration-200 ${
                  hasAlergi
                    ? 'border-l-4 border-l-red-500'
                    : 'border-l-4 border-l-sky-400'
                } ${isSelesai ? 'opacity-50' : 'hover:shadow-md'} ${
                  isNewItem ? 'animate-pulse ring-2 ring-emerald-400 ring-offset-2 shadow-lg shadow-emerald-100' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    {/* Patient Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-semibold text-sky-600">
                        {item.pasien_nama.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">
                            {item.pasien_nama}
                          </p>
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            #{item.pasien_nrm}
                          </span>
                          <span className="text-xs text-gray-400">
                            {calculateAge(item.pasien_tanggal_lahir)} ·{' '}
                            {item.pasien_jenis_kelamin === 'L' ? 'L' : 'P'}
                          </span>
                          <Badge
                            variant="outline"
                            className={`${statusCfg.className} text-xs font-medium`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusCfg.label}
                          </Badge>
                        </div>

                        {/* Alergi Warning */}
                        {hasAlergi && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="font-semibold">Alergi:</span>{' '}
                            {item.pasien_alergi_obat}
                          </div>
                        )}

                        {/* Vital Signs & Keluhan */}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(item.jam_daftar)}
                          </span>
                          {(item.tensi_sistolik || item.tensi_diastolik) && (
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-rose-400" />
                              {item.tensi_sistolik ?? '-'}/{item.tensi_diastolik ?? '-'} mmHg
                            </span>
                          )}
                          {item.nadi && (
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3 text-blue-400" />
                              {item.nadi}/mnt
                            </span>
                          )}
                          {item.suhu && (
                            <span className="flex items-center gap-1">
                              <Thermometer className="h-3 w-3 text-amber-400" />
                              {item.suhu}°C
                            </span>
                          )}
                        </div>
                        {item.keluhan_utama && (
                          <p className="mt-1.5 text-xs text-gray-600 italic line-clamp-2">
                            &ldquo;{item.keluhan_utama}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 flex md:flex-col gap-2">
                      {item.status === 'menunggu' && (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white shadow-md shadow-sky-500/20"
                          onClick={() => handlePeriksa(item.id)}
                          disabled={processingId === item.id}
                        >
                          {processingId === item.id ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <Stethoscope className="h-4 w-4 mr-1.5" />
                          )}
                          Periksa
                        </Button>
                      )}
                      {isDiperiksa && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() => handleLihat(item.id)}
                        >
                          <Stethoscope className="h-4 w-4 mr-1.5" />
                          Lanjutkan
                        </Button>
                      )}
                      {isSelesai && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400"
                          onClick={() => handleLihat(item.id)}
                        >
                          <Eye className="h-4 w-4 mr-1.5" />
                          Lihat
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
