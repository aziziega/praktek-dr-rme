'use client'

import { useState, useEffect } from 'react'
import { getRiwayatKunjungan, type RiwayatItem } from '@/app/actions/dokter'
import type { PasienRow, KunjunganRow } from '@/types/database'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertTriangle,
  Heart,
  Activity,
  Thermometer,
  User,
  Hash,
  Calendar,
  FileText,
  History,
} from 'lucide-react'

interface PasienInfoSidebarProps {
  pasien: PasienRow
  kunjungan: KunjunganRow
}

export function PasienInfoSidebar({
  pasien,
  kunjungan,
}: PasienInfoSidebarProps) {
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([])
  const [loadingRiwayat, setLoadingRiwayat] = useState(true)

  useEffect(() => {
    async function fetchRiwayat() {
      try {
        const data = await getRiwayatKunjungan(pasien.id, kunjungan.id)
        setRiwayat(data)
      } catch {
        console.error('[Sidebar] Failed to fetch riwayat')
      } finally {
        setLoadingRiwayat(false)
      }
    }
    fetchRiwayat()
  }, [pasien.id, kunjungan.id])

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
      return `${age} tahun`
    } catch {
      return '-'
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const hasAlergi = !!pasien.alergi_obat

  return (
    <div className="space-y-4">
      {/* Patient Info Card */}
      <Card
        className={`${
          hasAlergi
            ? 'border-l-4 border-l-red-500'
            : 'border-l-4 border-l-sky-500'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-50 text-base font-bold text-sky-600">
              {pasien.nama.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-base">{pasien.nama}</CardTitle>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                <span className="flex items-center gap-1 font-mono">
                  <Hash className="h-3 w-3" />
                  {pasien.nrm}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          {/* Demographics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{calculateAge(pasien.tanggal_lahir)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <User className="h-3 w-3" />
              <span>
                {pasien.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
              </span>
            </div>
          </div>

          {/* Alergi Warning */}
          {hasAlergi && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-800">
                  ALERGI OBAT
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  {pasien.alergi_obat}
                </p>
              </div>
            </div>
          )}

          {/* Vital Signs - Current Visit */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-rose-500" />
              Vital Sign Kunjungan Ini
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: 'Tensi',
                  value:
                    kunjungan.tensi_sistolik || kunjungan.tensi_diastolik
                      ? `${kunjungan.tensi_sistolik ?? '-'}/${kunjungan.tensi_diastolik ?? '-'}`
                      : '-',
                  unit: 'mmHg',
                  icon: Heart,
                  color: 'text-rose-500',
                },
                {
                  label: 'Nadi',
                  value: kunjungan.nadi ?? '-',
                  unit: '/mnt',
                  icon: Activity,
                  color: 'text-blue-500',
                },
                {
                  label: 'Suhu',
                  value: kunjungan.suhu ?? '-',
                  unit: '°C',
                  icon: Thermometer,
                  color: 'text-amber-500',
                },
              ].map((v) => {
                const Icon = v.icon
                return (
                  <div
                    key={v.label}
                    className="bg-gray-50 rounded-lg px-2.5 py-2 text-center"
                  >
                    <Icon className={`h-3 w-3 ${v.color} mx-auto mb-0.5`} />
                    <p className="text-xs font-semibold text-gray-800">
                      {v.value}
                      <span className="text-gray-400 font-normal ml-0.5">
                        {v.value !== '-' ? v.unit : ''}
                      </span>
                    </p>
                    <p className="text-[10px] text-gray-400">{v.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Keluhan */}
          {kunjungan.keluhan_utama && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                Keluhan Utama
              </p>
              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 italic">
                &ldquo;{kunjungan.keluhan_utama}&rdquo;
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visit History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-gray-500" />
            Riwayat Kunjungan
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          {loadingRiwayat ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : riwayat.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              Belum ada riwayat kunjungan sebelumnya.
            </p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {riwayat.map((r, idx) => (
                <AccordionItem key={r.id} value={`riwayat-${idx}`}>
                  <AccordionTrigger className="text-xs py-2 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <span className="font-medium text-gray-700">
                        {formatDate(r.tanggal)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 h-4"
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-gray-600 space-y-1 pb-2">
                    {r.keluhan_utama && (
                      <p>
                        <span className="font-medium text-gray-700">Keluhan:</span>{' '}
                        {r.keluhan_utama}
                      </p>
                    )}
                    {r.diagnosis_nama && (
                      <p>
                        <span className="font-medium text-gray-700">Diagnosis:</span>{' '}
                        {r.diagnosis_nama}
                        {r.diagnosis_kode && (
                          <span className="text-gray-400 ml-1">
                            ({r.diagnosis_kode})
                          </span>
                        )}
                      </p>
                    )}
                    {r.dokter_nama && (
                      <p>
                        <span className="font-medium text-gray-700">Dokter:</span>{' '}
                        {r.dokter_nama}
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
