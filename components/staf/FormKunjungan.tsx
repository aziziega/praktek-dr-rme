'use client'

import { useState, useEffect } from 'react'
import { getActiveDokters, createKunjungan, updateAlergiObat } from '@/app/actions/staf'
import type { PasienRow } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertTriangle,
  Heart,
  Thermometer,
  Activity,
  Stethoscope,
  Hash,
  User,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'

interface FormKunjunganProps {
  pasien: PasienRow
  onSuccess: () => void
  onBack: () => void
}

export function FormKunjungan({
  pasien,
  onSuccess,
  onBack,
}: FormKunjunganProps) {
  const [dokters, setDokters] = useState<{ id: string; nama: string }[]>([])
  const [loadingDokters, setLoadingDokters] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [tensiSistolik, setTensiSistolik] = useState('')
  const [tensiDiastolik, setTensiDiastolik] = useState('')
  const [nadi, setNadi] = useState('')
  const [suhu, setSuhu] = useState('')
  const [keluhanUtama, setKeluhanUtama] = useState('')
  const [dokterId, setDokterId] = useState('')

  // Alergi Obat states
  const [alergiObatState, setAlergiObatState] = useState(pasien.alergi_obat ?? '')
  const [isAlergiOpen, setIsAlergiOpen] = useState(false)
  const [tempAlergi, setTempAlergi] = useState(pasien.alergi_obat ?? '')
  const [savingAlergi, setSavingAlergi] = useState(false)

  async function handleSaveAlergi() {
    setSavingAlergi(true)
    try {
      const result = await updateAlergiObat(pasien.id, tempAlergi)
      if (result.success) {
        setAlergiObatState(tempAlergi.trim())
        setIsAlergiOpen(false)
        toast.success('Data alergi obat pasien berhasil diperbarui')
      } else {
        toast.error(result.error ?? 'Gagal memperbarui alergi obat')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSavingAlergi(false)
    }
  }

  // Fetch active dokters on mount
  useEffect(() => {
    async function fetchDokters() {
      try {
        const data = await getActiveDokters()
        setDokters(data)
      } catch {
        toast.error('Gagal memuat daftar dokter')
      } finally {
        setLoadingDokters(false)
      }
    }
    fetchDokters()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!dokterId) {
      toast.error('Pilih dokter terlebih dahulu')
      return
    }

    setSaving(true)

    try {
      const result = await createKunjungan({
        pasien_id: pasien.id,
        dokter_id: dokterId,
        tensi_sistolik: tensiSistolik ? parseInt(tensiSistolik, 10) : undefined,
        tensi_diastolik: tensiDiastolik
          ? parseInt(tensiDiastolik, 10)
          : undefined,
        nadi: nadi ? parseInt(nadi, 10) : undefined,
        suhu: suhu ? parseFloat(suhu) : undefined,
        keluhan_utama: keluhanUtama.trim() || undefined,
      })

      if (!result.success) {
        toast.error(result.error ?? 'Gagal mendaftarkan kunjungan')
        setSaving(false)
        return
      }

      toast.success(`Kunjungan ${pasien.nama} berhasil didaftarkan`, {
        description: 'Pasien masuk antrian menunggu.',
      })
      onSuccess()
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.')
      setSaving(false)
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-4">
      {/* Patient Info Header */}
      <Card
        className={`border-l-4 ${
          alergiObatState
            ? 'border-l-red-500 bg-red-50/30'
            : 'border-l-sky-500 bg-sky-50/30'
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-sm font-semibold text-sky-600 border border-sky-100">
                {pasien.nama.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{pasien.nama}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-100">
                    <Hash className="h-3 w-3" />
                    {pasien.nrm}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                  <span>{formatDate(pasien.tanggal_lahir)}</span>
                  <span>{pasien.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                  {pasien.alamat && <span>{pasien.alamat}</span>}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={saving}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Kembali
            </Button>
          </div>

          {/* Allergy Info Bar */}
          <div className={`mt-3 flex items-center justify-between gap-3 border rounded-lg px-3 py-2 ${
            alergiObatState 
              ? 'bg-red-50/80 border-red-200 text-red-900' 
              : 'bg-gray-50 border-gray-150 text-gray-800'
          }`}>
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
                alergiObatState ? 'text-red-600' : 'text-gray-400'
              }`} />
              <div className="min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${
                  alergiObatState ? 'text-red-800' : 'text-gray-400'
                }`}>
                  Alergi Obat
                </p>
                <p className={`text-xs font-semibold mt-0.5 ${
                  alergiObatState ? 'text-red-700' : 'text-gray-600'
                } truncate`}>
                  {alergiObatState || 'Tidak ada alergi obat terdaftar'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-semibold shrink-0 gap-1 border-gray-200 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors"
              onClick={() => {
                setTempAlergi(alergiObatState)
                setIsAlergiOpen(true)
              }}
            >
              <Pencil className="h-3 w-3" />
              Ubah
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visit Form */}
      <Card className="border-gray-100 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-md shadow-sky-500/20">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Form Kunjungan</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Input vital sign dan assign dokter
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Vital Signs */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-rose-500" />
                Vital Sign
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="tensi-sistolik" className="text-xs text-gray-500">
                    Sistolik (mmHg)
                  </Label>
                  <Input
                    id="tensi-sistolik"
                    type="number"
                    placeholder="120"
                    value={tensiSistolik}
                    onChange={(e) => setTensiSistolik(e.target.value)}
                    disabled={saving}
                    min={50}
                    max={300}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tensi-diastolik" className="text-xs text-gray-500">
                    Diastolik (mmHg)
                  </Label>
                  <Input
                    id="tensi-diastolik"
                    type="number"
                    placeholder="80"
                    value={tensiDiastolik}
                    onChange={(e) => setTensiDiastolik(e.target.value)}
                    disabled={saving}
                    min={30}
                    max={200}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nadi" className="text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Nadi (/menit)
                    </span>
                  </Label>
                  <Input
                    id="nadi"
                    type="number"
                    placeholder="80"
                    value={nadi}
                    onChange={(e) => setNadi(e.target.value)}
                    disabled={saving}
                    min={30}
                    max={250}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="suhu" className="text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Thermometer className="h-3 w-3" />
                      Suhu (°C)
                    </span>
                  </Label>
                  <Input
                    id="suhu"
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={suhu}
                    onChange={(e) => setSuhu(e.target.value)}
                    disabled={saving}
                    min={30}
                    max={45}
                  />
                </div>
              </div>
            </div>

            {/* Keluhan Utama */}
            <div className="space-y-2">
              <Label htmlFor="keluhan-utama">Keluhan Utama</Label>
              <Textarea
                id="keluhan-utama"
                placeholder="Keluhan utama pasien saat datang..."
                value={keluhanUtama}
                onChange={(e) => setKeluhanUtama(e.target.value)}
                disabled={saving}
                rows={3}
              />
            </div>

            {/* Assign Dokter */}
            <div className="space-y-2">
              <Label htmlFor="dokter">
                Assign ke Dokter <span className="text-red-500">*</span>
              </Label>
              {loadingDokters ? (
                <Skeleton className="h-10 w-full" />
              ) : dokters.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  <AlertTriangle className="h-4 w-4" />
                  Tidak ada dokter aktif. Hubungi admin.
                </div>
              ) : (
                <Select
                  value={dokterId}
                  onValueChange={setDokterId}
                  disabled={saving}
                >
                  <SelectTrigger id="dokter">
                    <SelectValue placeholder="Pilih dokter..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dokters.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        <span className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-emerald-500" />
                          {d.nama}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving || loadingDokters || dokters.length === 0}
                className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white shadow-md shadow-sky-500/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Daftarkan Kunjungan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modal Kelola Alergi Obat */}
      <Dialog open={isAlergiOpen} onOpenChange={setIsAlergiOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Kelola Alergi Obat</DialogTitle>
            <DialogDescription>
              Masukkan keterangan alergi obat pasien {pasien.nama}. Kosongkan jika tidak ada alergi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="input-alergi">Daftar Alergi Obat</Label>
              <Input
                id="input-alergi"
                placeholder="Contoh: Penisilin, Sulfa, dll."
                value={tempAlergi}
                onChange={(e) => setTempAlergi(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAlergiOpen(false)}
              disabled={savingAlergi}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveAlergi}
              disabled={savingAlergi}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              {savingAlergi ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
