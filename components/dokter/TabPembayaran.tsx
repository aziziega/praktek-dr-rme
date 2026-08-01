'use client'

import { useState } from 'react'
import { selesaikanKunjungan, type ResepItem } from '@/app/actions/dokter'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  Loader2,
  Banknote,
  Receipt,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNetworkStatus } from '@/components/providers/NetworkStatusProvider'

interface TabPembayaranProps {
  kunjunganId: string
  readOnly: boolean
  totalObat: number
  resepItems: ResepItem[]
  rekamMedisData: {
    anamnesis: string
    pemeriksaan_fisik: string
    diagnosis_kode: string
    diagnosis_nama: string
    terapi: string
    catatan: string
    anamnesis_handwriting_url?: string | null
    diagnosis_handwriting_url?: string | null
    terapi_handwriting_url?: string | null
    tensi_sistolik?: string
    tensi_diastolik?: string
    nadi?: string
    suhu?: string
  }
}

export function TabPembayaran({
  kunjunganId,
  readOnly,
  totalObat,
  resepItems,
  rekamMedisData,
}: TabPembayaranProps) {
  const router = useRouter()
  const isOnline = useNetworkStatus()
  const [tarifPeriksa, setTarifPeriksa] = useState(50000)
  const [catatanBayar, setCatatanBayar] = useState('')
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const totalBayar = tarifPeriksa + totalObat

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  async function handleSelesai() {
    const hasEmptyDosis = resepItems.some(item => !item.dosis || !item.dosis.trim())
    if (hasEmptyDosis) {
      toast.error('Dosis obat wajib diisi untuk semua resep!')
      setDialogOpen(false)
      return
    }

    setSaving(true)
    try {
      const result = await selesaikanKunjungan({
        kunjunganId,
        anamnesis: rekamMedisData.anamnesis || undefined,
        pemeriksaan_fisik: rekamMedisData.pemeriksaan_fisik || undefined,
        diagnosis_kode: rekamMedisData.diagnosis_kode || undefined,
        diagnosis_nama: rekamMedisData.diagnosis_nama || undefined,
        terapi: rekamMedisData.terapi || undefined,
        catatan_medis: rekamMedisData.catatan || undefined,
        anamnesis_handwriting_url: rekamMedisData.anamnesis_handwriting_url,
        diagnosis_handwriting_url: rekamMedisData.diagnosis_handwriting_url,
        terapi_handwriting_url: rekamMedisData.terapi_handwriting_url,
        tensi_sistolik: rekamMedisData.tensi_sistolik ? parseInt(rekamMedisData.tensi_sistolik, 10) : undefined,
        tensi_diastolik: rekamMedisData.tensi_diastolik ? parseInt(rekamMedisData.tensi_diastolik, 10) : undefined,
        nadi: rekamMedisData.nadi ? parseInt(rekamMedisData.nadi, 10) : undefined,
        suhu: rekamMedisData.suhu ? parseFloat(rekamMedisData.suhu) : undefined,
        resepItems,
        tarif_periksa: tarifPeriksa,
        catatan_bayar: catatanBayar || undefined,
      })

      if (!result.success) {
        toast.error(result.error ?? 'Gagal menyelesaikan kunjungan')
        setSaving(false)
        setDialogOpen(false)
        return
      }

      // Clear sessionStorage for this kunjungan
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`resep-items-${kunjunganId}`)
      }

      toast.success('Kunjungan berhasil diselesaikan!', {
        description: `Total pembayaran: ${formatCurrency(totalBayar)}`,
      })
      router.push('/dashboard/dokter/antrian')
    } catch {
      toast.error('Terjadi kesalahan')
      setSaving(false)
      setDialogOpen(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Tarif Periksa */}
      <div className="space-y-2">
        <Label htmlFor="tarif-periksa" className="text-sm font-semibold flex items-center gap-2">
          <Banknote className="h-4 w-4 text-emerald-500" />
          Tarif Periksa
        </Label>
        {readOnly ? (
          <p className="text-lg font-semibold text-gray-800">
            {formatCurrency(tarifPeriksa)}
          </p>
        ) : (
          <Input
            id="tarif-periksa"
            type="number"
            value={tarifPeriksa || ''}
            onChange={(e) => setTarifPeriksa(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
            min={0}
            className="max-w-xs text-lg font-semibold"
          />
        )}
      </div>

      {/* Total Obat */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4 text-sky-500" />
          Total Obat
        </Label>
        <p className="text-lg font-semibold text-gray-800">
          {formatCurrency(totalObat)}
        </p>
        <p className="text-xs text-gray-400">
          Dihitung otomatis dari tab Resep & Obat
        </p>
      </div>

      {/* TOTAL BAYAR */}
      <Card className="bg-gradient-to-r from-sky-500 to-emerald-500 border-0 shadow-lg shadow-sky-500/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white/80">
              <CreditCard className="h-6 w-6" />
              <span className="text-sm font-medium">TOTAL BAYAR</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-white">
              {formatCurrency(totalBayar)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Catatan */}
      <div className="space-y-2">
        <Label htmlFor="catatan-bayar" className="text-sm font-semibold">
          Catatan Pembayaran
        </Label>
        <Textarea
          id="catatan-bayar"
          placeholder="Catatan tambahan pembayaran..."
          value={catatanBayar}
          onChange={(e) => setCatatanBayar(e.target.value)}
          disabled={readOnly}
          rows={2}
          className={readOnly ? 'bg-gray-50' : ''}
        />
      </div>

      {/* Tombol Selesai */}
      {!readOnly && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button
            size="lg"
            disabled={!isOnline}
            className="w-full bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white shadow-lg shadow-emerald-500/20 text-base"
            onClick={(e) => {
              const hasEmptyDosis = resepItems.some(item => !item.dosis || !item.dosis.trim())
              if (hasEmptyDosis) {
                e.preventDefault()
                e.stopPropagation()
                toast.error('Dosis obat wajib diisi untuk semua resep sebelum menyelesaikan kunjungan!')
                return
              }
              setDialogOpen(true)
            }}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Selesai & Tandai Lunas
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Selesai</DialogTitle>
              <DialogDescription>
                Anda akan menyelesaikan kunjungan ini. Tindakan ini akan:
              </DialogDescription>
            </DialogHeader>
            <ul className="text-sm text-gray-600 space-y-1.5 ml-4 list-disc">
              <li>Menyimpan rekam medis</li>
              <li>Menyimpan resep obat ({resepItems.length} item)</li>
              <li>Mencatat pembayaran: {formatCurrency(totalBayar)}</li>
              <li>Mengurangi stok obat dari master</li>
              <li>Mengubah status kunjungan menjadi selesai</li>
            </ul>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                onClick={handleSelesai}
                disabled={saving || !isOnline}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Ya, Selesaikan
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Read-only summary */}
      {readOnly && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald-800">
            Kunjungan telah diselesaikan
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            Pembayaran telah dicatat sebagai lunas.
          </p>
        </div>
      )}
    </div>
  )
}
