'use client'

import { useState, useEffect } from 'react'
import { getNextNRM, createPasien } from '@/app/actions/staf'
import type { PasienRow } from '@/types/database'
import { pasienSchema } from '@/lib/validations'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Save, Loader2, Hash, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface FormPasienBaruProps {
  onSuccess: (pasien: PasienRow) => void
  onCancel: () => void
}

export function FormPasienBaru({ onSuccess, onCancel }: FormPasienBaruProps) {
  const [nrm, setNrm] = useState('')
  const [loadingNrm, setLoadingNrm] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [nama, setNama] = useState('')
  const [displayDob, setDisplayDob] = useState('')
  const [tanggalLahir, setTanggalLahir] = useState('')
  const [tempatLahir, setTempatLahir] = useState('')
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P' | ''>('')
  const [alamat, setAlamat] = useState('')
  const [noHp, setNoHp] = useState('')
  const [alergiObat, setAlergiObat] = useState('')

  // Format input ke DD/MM/YYYY secara otomatis saat diketik
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '') // Hanya angka

    if (val.length > 2 && val.length <= 4) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`
    } else if (val.length > 4) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}`
    }

    setDisplayDob(val)

    // Validasi & konversi ke YYYY-MM-DD
    if (val.length === 10) {
      const parts = val.split('/')
      const d = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      const y = parseInt(parts[2], 10)
      const currentYear = new Date().getFullYear()

      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= currentYear) {
        const daysInMonth = new Date(y, m, 0).getDate()
        if (d <= daysInMonth) {
          setTanggalLahir(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
          return
        }
      }
    }
    setTanggalLahir('') // Set kosong agar ditolak validasi submit jika tidak valid
  }

  // Fetch next NRM on mount
  useEffect(() => {
    async function fetchNRM() {
      try {
        const nextNrm = await getNextNRM()
        setNrm(String(nextNrm))
      } catch {
        setNrm('')
        toast.error('Gagal generate NRM otomatis')
      } finally {
        setLoadingNrm(false)
      }
    }
    fetchNRM()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Explicit empty checks for required fields to trigger red toast instead of browser tooltip
    if (!nrm.trim()) {
      toast.error('Nomor Rekam Medis (NRM) wajib diisi')
      return
    }
    if (!nama.trim()) {
      toast.error('Nama Lengkap pasien wajib diisi')
      return
    }
    if (!jenisKelamin) {
      toast.error('Jenis Kelamin wajib dipilih')
      return
    }
    if (!tanggalLahir) {
      toast.error('Tanggal Lahir wajib diisi')
      return
    }
    if (!tempatLahir.trim()) {
      toast.error('Tempat Lahir wajib diisi')
      return
    }
    if (!alamat.trim()) {
      toast.error('Alamat lengkap pasien wajib diisi')
      return
    }

    // Client-side validation dengan Zod
    const validation = pasienSchema.safeParse({
      nrm,
      nama,
      tanggal_lahir: tanggalLahir || undefined,
      tempat_lahir: tempatLahir.trim(),
      jenis_kelamin: jenisKelamin || undefined,
      alamat,
      no_hp: noHp || undefined,
      alergi_obat: alergiObat || undefined
    })

    if (!validation.success) {
      const firstError = validation.error.issues[0].message
      toast.error(firstError)
      return
    }

    const validatedData = validation.data
    const nrmNumber = validatedData.nrm

    setSaving(true)

    try {
      const result = await createPasien({
        nrm: nrmNumber,
        nama: nama.trim(),
        tanggal_lahir: tanggalLahir,
        tempat_lahir: tempatLahir.trim(),
        jenis_kelamin: jenisKelamin as 'L' | 'P',
        alamat: alamat.trim(),
        no_hp: noHp.trim() || undefined,
        alergi_obat: alergiObat.trim() || undefined,
      })

      if (!result.success || !result.data) {
        toast.error(result.error ?? 'Gagal menyimpan pasien')
        setSaving(false)
        return
      }

      toast.success(`Pasien ${result.data.nama} berhasil didaftarkan`)
      onSuccess(result.data)
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.')
      setSaving(false)
    }
  }

  return (
    <Card className="border-gray-100 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-md shadow-sky-500/20">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Pendaftaran Pasien Baru</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Isi data pasien yang diperlukan
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Kembali
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* NRM — Auto Generated (Editable) */}
          <div className="space-y-2">
            <Label htmlFor="nrm">
              Nomor Rekam Medis (NRM) <span className="text-red-500">*</span>
            </Label>
            {loadingNrm ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-sky-500" />
                <Input
                  id="nrm"
                  className="pl-9 font-mono font-semibold text-sky-700 bg-sky-50/10 focus-visible:bg-white"
                  placeholder="Nomor Rekam Medis"
                  value={nrm}
                  onChange={(e) => {
                    const val = e.target.value
                    // Hanya izinkan angka murni (digit) saat mengetik
                    if (val === '' || /^\d+$/.test(val)) {
                      setNrm(val)
                    }
                  }}
                  disabled={saving}
                  required
                />
                <span className="absolute right-3 top-3.5 text-[10px] text-gray-400">
                  (otomatis diisi, bisa diubah)
                </span>
              </div>
            )}
          </div>

          {/* Row 1: Nama & Jenis Kelamin */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="nama">
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nama"
                placeholder="Nama lengkap pasien"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                disabled={saving}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jenis-kelamin">
                Jenis Kelamin <span className="text-red-500">*</span>
              </Label>
              <Select
                value={jenisKelamin}
                onValueChange={(v) => setJenisKelamin(v as 'L' | 'P')}
                disabled={saving}
              >
                <SelectTrigger id="jenis-kelamin">
                  <SelectValue placeholder="Pilih..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Laki-laki</SelectItem>
                  <SelectItem value="P">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Tanggal Lahir & Tempat Lahir */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tanggal-lahir">
                Tanggal Lahir <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tanggal-lahir"
                placeholder="Hari/Bulan/Tahun (contoh: 17/08/1945)"
                value={displayDob}
                onChange={handleDobChange}
                maxLength={10}
                className="bg-white border-gray-300 focus-visible:ring-sky-500 font-mono tracking-wide"
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tempat-lahir">
                Tempat Lahir <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tempat-lahir"
                placeholder="Tempat lahir"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
                disabled={saving}
                required
              />
            </div>
          </div>

          {/* Row 3: Alamat */}
          <div className="space-y-2">
            <Label htmlFor="alamat">
              Alamat <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="alamat"
              placeholder="Alamat lengkap pasien"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              disabled={saving}
              rows={2}
              required
            />
          </div>

          {/* Row 4: No HP & Alergi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="no-hp">No. HP</Label>
              <Input
                id="no-hp"
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alergi-obat">Alergi Obat</Label>
              <Input
                id="alergi-obat"
                placeholder="Misal: Penisilin, Sulfa"
                value={alergiObat}
                onChange={(e) => setAlergiObat(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving || loadingNrm}
              className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white shadow-md shadow-sky-500/20"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan & Lanjut Kunjungan
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
