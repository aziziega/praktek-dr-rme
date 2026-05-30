'use client'

import { useState, useCallback } from 'react'
import type { KunjunganRow, PasienRow, RekamMedisRow } from '@/types/database'
import type { ResepItem } from '@/app/actions/dokter'

import { PasienInfoSidebar } from '@/components/dokter/PasienInfoSidebar'
import { TabRekamMedis } from '@/components/dokter/TabRekamMedis'
import { TabResepObat } from '@/components/dokter/TabResepObat'
import { TabPembayaran } from '@/components/dokter/TabPembayaran'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Pill, CreditCard, Lock } from 'lucide-react'
import Link from 'next/link'

interface PeriksaClientProps {
  kunjungan: KunjunganRow
  pasien: PasienRow
  rekamMedis: RekamMedisRow | null
}

export function PeriksaClient({
  kunjungan,
  pasien,
  rekamMedis,
}: PeriksaClientProps) {
  const isSelesai = kunjungan.status === 'selesai'

  // Shared state between tabs
  const [rekamMedisData, setRekamMedisData] = useState({
    anamnesis: rekamMedis?.anamnesis ?? '',
    pemeriksaan_fisik: rekamMedis?.pemeriksaan_fisik ?? '',
    diagnosis_kode: rekamMedis?.diagnosis_kode ?? '',
    diagnosis_nama: rekamMedis?.diagnosis_nama ?? '',
    terapi: rekamMedis?.terapi ?? '',
    catatan: rekamMedis?.catatan ?? '',
    tensi_sistolik: kunjungan.tensi_sistolik ? String(kunjungan.tensi_sistolik) : '',
    tensi_diastolik: kunjungan.tensi_diastolik ? String(kunjungan.tensi_diastolik) : '',
    nadi: kunjungan.nadi ? String(kunjungan.nadi) : '',
    suhu: kunjungan.suhu ? String(kunjungan.suhu) : '',
  })
  const [resepItems, setResepItems] = useState<ResepItem[]>([])
  const [totalObat, setTotalObat] = useState(0)

  const handleRekamMedisChange = useCallback(
    (data: typeof rekamMedisData) => {
      setRekamMedisData(data)
    },
    []
  )

  const handleResepChange = useCallback(
    (items: ResepItem[], total: number) => {
      setResepItems(items)
      setTotalObat(total)
    },
    []
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/dokter/antrian">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Pemeriksaan Pasien
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {pasien.nama} · #{pasien.nrm}
            </p>
          </div>
        </div>
        {isSelesai && (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <Lock className="h-3 w-3 mr-1" />
            Kunjungan Selesai (Read-Only)
          </Badge>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Patient Info Sidebar */}
        <div className="lg:col-span-1">
          <PasienInfoSidebar pasien={pasien} kunjungan={kunjungan} />
        </div>

        {/* Right: 3 Tabs */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-gray-100">
            <CardContent className="p-4 md:p-6">
              <Tabs defaultValue="rekam-medis">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger
                    value="rekam-medis"
                    className="gap-1.5 text-xs md:text-sm"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Rekam Medis</span>
                    <span className="sm:hidden">RM</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="resep-obat"
                    className="gap-1.5 text-xs md:text-sm"
                  >
                    <Pill className="h-4 w-4" />
                    <span className="hidden sm:inline">Resep & Obat</span>
                    <span className="sm:hidden">Resep</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="pembayaran"
                    className="gap-1.5 text-xs md:text-sm"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span className="hidden sm:inline">Pembayaran</span>
                    <span className="sm:hidden">Bayar</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="rekam-medis">
                  <TabRekamMedis
                    kunjungan={kunjungan}
                    pasien={pasien}
                    initialData={rekamMedisData}
                    readOnly={isSelesai}
                    resepItems={resepItems}
                    onDataChange={handleRekamMedisChange}
                  />
                </TabsContent>

                <TabsContent value="resep-obat">
                  <TabResepObat
                    kunjunganId={kunjungan.id}
                    readOnly={isSelesai}
                    onItemsChange={handleResepChange}
                  />
                </TabsContent>

                <TabsContent value="pembayaran">
                  <TabPembayaran
                    kunjunganId={kunjungan.id}
                    readOnly={isSelesai}
                    totalObat={totalObat}
                    resepItems={resepItems}
                    rekamMedisData={rekamMedisData}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
