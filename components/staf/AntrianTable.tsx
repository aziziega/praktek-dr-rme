'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getAntrianHariIni,
  getActiveDokters,
  type AntrianItem,
} from '@/app/actions/staf'
import { createClient } from '@/lib/supabase/client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  Clock,
  Stethoscope,
  CheckCircle2,
  ListOrdered,
  Filter,
} from 'lucide-react'

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

export function AntrianTable() {
  const [antrian, setAntrian] = useState<AntrianItem[]>([])
  const [dokters, setDokters] = useState<{ id: string; nama: string }[]>([])
  const [filterDokter, setFilterDokter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const fetchAntrian = useCallback(async () => {
    try {
      const dokterId = filterDokter === 'all' ? undefined : filterDokter
      const data = await getAntrianHariIni(dokterId)
      setAntrian(data)
    } catch {
      console.error('[Antrian] Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [filterDokter])

  // Fetch initial data
  useEffect(() => {
    async function init() {
      const [_, dokterList] = await Promise.all([
        fetchAntrian(),
        getActiveDokters(),
      ])
      setDokters(dokterList)
    }
    init()
  }, [fetchAntrian])

  // Re-fetch when filter changes
  useEffect(() => {
    setLoading(true)
    fetchAntrian()
  }, [filterDokter, fetchAntrian])

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const channel = supabase
      .channel('antrian-staf-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kunjungan',
          filter: `tanggal=eq.${today}`,
        },
        () => {
          // Refetch on any change to today's kunjungan
          fetchAntrian()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAntrian])

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

  // Counters
  const total = antrian.length
  const menunggu = antrian.filter((a) => a.status === 'menunggu').length
  const diperiksa = antrian.filter((a) => a.status === 'diperiksa').length
  const selesai = antrian.filter((a) => a.status === 'selesai').length

  const counterCards = [
    {
      label: 'Total',
      value: total,
      icon: ListOrdered,
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
  ]

  return (
    <div className="space-y-5">
      {/* Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {counterCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.label}
              className={`${card.border} ${card.bg} border`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500">
                      {card.label}
                    </p>
                    {loading ? (
                      <Skeleton className="h-8 w-10 mt-1" />
                    ) : (
                      <p className={`text-2xl font-bold ${card.color}`}>
                        {card.value}
                      </p>
                    )}
                  </div>
                  <Icon className={`h-8 w-8 ${card.color} opacity-30`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="h-4 w-4" />
          <span>Filter Dokter:</span>
        </div>
        <Select value={filterDokter} onValueChange={setFilterDokter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Semua Dokter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Dokter</SelectItem>
            {dokters.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Badge variant="outline" className="text-xs text-gray-500">
            Auto-refresh aktif
          </Badge>
        </div>
      </div>

      {/* Table */}
      <Card className="border-gray-100 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[60px]" />
                  <Skeleton className="h-6 w-[80px] rounded-full" />
                </div>
              ))}
            </div>
          ) : antrian.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 mb-3">
                <Users className="h-7 w-7 text-gray-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">
                Belum ada antrian hari ini
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Kunjungan yang didaftarkan akan muncul di sini.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="w-[60px] text-center">No</TableHead>
                  <TableHead>Nama Pasien</TableHead>
                  <TableHead className="hidden sm:table-cell">NRM</TableHead>
                  <TableHead className="hidden md:table-cell">Dokter</TableHead>
                  <TableHead className="hidden sm:table-cell">Jam Daftar</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {antrian.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.menunggu
                  const StatusIcon = statusCfg.icon
                  return (
                    <TableRow key={item.id} className="group">
                      <TableCell className="text-center font-semibold text-gray-500">
                        {item.no_urut}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-gray-900">
                          {item.pasien_nama}
                        </p>
                        {/* Mobile-only: show NRM under name */}
                        <p className="text-xs text-gray-400 sm:hidden">
                          {item.pasien_nrm}
                        </p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-xs font-mono text-gray-500">
                          {item.pasien_nrm}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-600">
                        {item.dokter_nama}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-gray-500">
                        {formatTime(item.jam_daftar)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`${statusCfg.className} text-xs font-medium`}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
