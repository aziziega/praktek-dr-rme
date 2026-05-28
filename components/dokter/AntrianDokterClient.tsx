'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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

export function AntrianDokterClient({ dokterId }: AntrianDokterClientProps) {
  const router = useRouter()
  const [antrian, setAntrian] = useState<AntrianDokterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchAntrian = useCallback(async () => {
    try {
      const data = await getAntrianDokter()
      setAntrian(data)
    } catch {
      console.error('[AntrianDokter] Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchAntrian()
  }, [fetchAntrian])

  // Supabase Realtime: listen for new patients assigned to this doctor
  useEffect(() => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const channel = supabase
      .channel('antrian-dokter-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'kunjungan',
          filter: `dokter_id=eq.${dokterId}`,
        },
        () => {
          toast.info('Pasien baru masuk antrian Anda!', {
            description: 'Daftar antrian telah diperbarui.',
          })
          fetchAntrian()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kunjungan',
          filter: `tanggal=eq.${today}`,
        },
        () => {
          fetchAntrian()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dokterId, fetchAntrian])

  async function handlePeriksa(kunjunganId: string) {
    setProcessingId(kunjunganId)
    try {
      const result = await updateStatusKunjungan(kunjunganId, 'diperiksa')
      if (!result.success) {
        toast.error(result.error ?? 'Gagal memperbarui status')
        setProcessingId(null)
        return
      }
      router.push(`/dashboard/dokter/periksa/${kunjunganId}`)
    } catch {
      toast.error('Terjadi kesalahan')
      setProcessingId(null)
    }
  }

  function handleLihat(kunjunganId: string) {
    router.push(`/dashboard/dokter/periksa/${kunjunganId}`)
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
              Belum ada antrian hari ini
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Pasien yang di-assign ke Anda akan muncul di sini secara realtime.
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

            return (
              <Card
                key={item.id}
                className={`transition-all duration-200 ${
                  hasAlergi
                    ? 'border-l-4 border-l-red-500'
                    : 'border-l-4 border-l-sky-400'
                } ${isSelesai ? 'opacity-50' : 'hover:shadow-md'}`}
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
