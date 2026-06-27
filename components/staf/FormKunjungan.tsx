'use client'

import { useState, useEffect } from 'react'
import { getActiveDokters, createKunjungan, updateAlergiObat, getRiwayatPendaftaranPasien } from '@/app/actions/staf'
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
  Save,
  CheckCircle2,
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

  // Riwayat Kunjungan Pendaftaran
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [loadingRiwayat, setLoadingRiwayat] = useState(true)

  // Draf states
  const [isReady, setIsReady] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`draft_kunjungan_${pasien.id}`)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.tensiSistolik) setTensiSistolik(data.tensiSistolik)
        if (data.tensiDiastolik) setTensiDiastolik(data.tensiDiastolik)
        if (data.nadi) setNadi(data.nadi)
        if (data.suhu) setSuhu(data.suhu)
        if (data.keluhanUtama) setKeluhanUtama(data.keluhanUtama)
        if (data.dokterId) setDokterId(data.dokterId)
        if (data.lastSaved) setLastSaved(new Date(data.lastSaved))
      }
    } catch (err) {
      console.error('Gagal memuat draf:', err)
    } finally {
      setIsReady(true)
    }
  }, [pasien.id])

  // Debounced Auto-save to localStorage
  useEffect(() => {
    if (!isReady) return

    setIsTyping(true)
    const timer = setTimeout(() => {
      setSavingDraft(true)
      try {
        const draft = {
          tensiSistolik,
          tensiDiastolik,
          nadi,
          suhu,
          keluhanUtama,
          dokterId,
          lastSaved: new Date().toISOString(),
        }
        localStorage.setItem(`draft_kunjungan_${pasien.id}`, JSON.stringify(draft))
        setLastSaved(new Date())
        setIsTyping(false)
      } catch (err) {
        console.error('Gagal menyimpan draf:', err)
      } finally {
        setSavingDraft(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [tensiSistolik, tensiDiastolik, nadi, suhu, keluhanUtama, dokterId, isReady, pasien.id])

  const handleManualSave = () => {
    setSavingDraft(true)
    try {
      const draft = {
        tensiSistolik,
        tensiDiastolik,
        nadi,
        suhu,
        keluhanUtama,
        dokterId,
        lastSaved: new Date().toISOString(),
      }
      localStorage.setItem(`draft_kunjungan_${pasien.id}`, JSON.stringify(draft))
      setLastSaved(new Date())
      toast.success('Draf pendaftaran berhasil disimpan secara lokal')
    } catch (err) {
      toast.error('Gagal menyimpan draf')
    } finally {
      setSavingDraft(false)
    }
  }

  function formatLastSaved(): string {
    if (!lastSaved) return ''
    return lastSaved.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Pagination states for past visit history list
  const [historyPage, setHistoryPage] = useState(1)
  const historyItemsPerPage = 5
  const totalHistoryPages = Math.ceil(riwayat.length / historyItemsPerPage)
  const paginatedRiwayat = riwayat.slice((historyPage - 1) * historyItemsPerPage, historyPage * historyItemsPerPage)

  useEffect(() => {
    async function fetchRiwayat() {
      try {
        const data = await getRiwayatPendaftaranPasien(pasien.id)
        setRiwayat(data)
      } catch (err) {
        console.error('Gagal memuat riwayat:', err)
      } finally {
        setLoadingRiwayat(false)
      }
    }
    fetchRiwayat()
  }, [pasien.id])

  // Helper: Format date & time with day, date, month, year, and WIB local time
  function formatIndonesianDateTime(dateStr: string | null | Date): string {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ]
      const dayName = days[date.getDay()]
      const day = String(date.getDate()).padStart(2, '0')
      const monthName = months[date.getMonth()]
      const year = date.getFullYear()

      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')

      return `${dayName}, ${day} ${monthName} ${year} · ${hours}:${minutes} WIB`
    } catch {
      return String(dateStr)
    }
  }

  // Alergi Obat states
  const [alergiObatState, setAlergiObatState] = useState(pasien.alergi_obat ?? '')
  const [isAlergiOpen, setIsAlergiOpen] = useState(false)
  const [tempAlergi, setTempAlergi] = useState(pasien.alergi_obat ?? '')
  const [savingAlergi, setSavingAlergi] = useState(false)

  // Vital signs validation modal states
  const [isVitalsWarningOpen, setIsVitalsWarningOpen] = useState(false)
  const [vitalsAnomalies, setVitalsAnomalies] = useState<{ field: string; val: string; msg: string; isExtreme: boolean }[]>([])

  function checkVitalsAnomalies() {
    const anomalies: { field: string; val: string; msg: string; isExtreme: boolean }[] = []

    const sys = tensiSistolik ? parseInt(tensiSistolik, 10) : null
    const dias = tensiDiastolik ? parseInt(tensiDiastolik, 10) : null
    const hr = nadi ? parseInt(nadi, 10) : null

    // Normalize Indonesian comma decimals to dots
    const normalizedSuhu = suhu ? suhu.replace(',', '.') : ''
    const temp = normalizedSuhu ? parseFloat(normalizedSuhu) : null

    // 1. Blood Pressure Sistolik
    if (sys !== null) {
      if (sys < 50 || sys > 250) {
        anomalies.push({
          field: 'Tekanan Darah Sistolik',
          val: `${sys} mmHg`,
          msg: 'Nilai sangat ekstrem di luar batas fisiologis wajar (Kemungkinan besar salah ketik/typo).',
          isExtreme: true
        })
      } else if (sys < 90 || sys >= 140) {
        anomalies.push({
          field: 'Tekanan Darah Sistolik',
          val: `${sys} mmHg`,
          msg: sys < 90 ? 'Mendekati kondisi Hipotensi (Rendah).' : 'Mendekati kondisi Hipertensi (Tinggi).',
          isExtreme: false
        })
      }
    }

    // 2. Blood Pressure Diastolik
    if (dias !== null) {
      if (dias < 30 || dias > 150) {
        anomalies.push({
          field: 'Tekanan Darah Diastolik',
          val: `${dias} mmHg`,
          msg: 'Nilai sangat ekstrem di luar batas fisiologis wajar (Kemungkinan besar salah ketik/typo).',
          isExtreme: true
        })
      } else if (dias < 60 || dias >= 90) {
        anomalies.push({
          field: 'Tekanan Darah Diastolik',
          val: `${dias} mmHg`,
          msg: dias < 60 ? 'Mendekati kondisi Diastolik Rendah.' : 'Mendekati kondisi Diastolik Tinggi.',
          isExtreme: false
        })
      }
    }

    // 3. Heart Rate (Nadi)
    if (hr !== null) {
      if (hr < 30 || hr > 220) {
        anomalies.push({
          field: 'Denyut Nadi',
          val: `${hr} bpm`,
          msg: 'Nilai denyut nadi sangat ekstrem (Kemungkinan besar salah ketik/typo).',
          isExtreme: true
        })
      } else if (hr < 50 || hr > 110) {
        anomalies.push({
          field: 'Denyut Nadi',
          val: `${hr} bpm`,
          msg: hr < 50 ? 'Denyut nadi lambat (Kecenderungan Bradikardia).' : 'Denyut nadi cepat (Kecenderungan Takikardia).',
          isExtreme: false
        })
      }
    }

    // 4. Temperature (Suhu)
    if (temp !== null) {
      if (temp < 30.0 || temp > 43.0) {
        anomalies.push({
          field: 'Suhu Tubuh',
          val: `${temp} °C`,
          msg: temp >= 100
            ? 'Nilai suhu terlampau tinggi. Apakah Anda lupa menuliskan koma desimal? (contoh: ketik 36.5 atau 36,5)'
            : 'Nilai suhu tubuh sangat ekstrem (Kemungkinan besar salah ketik/typo).',
          isExtreme: true
        })
      } else if (temp < 35.0 || temp >= 38.0) {
        anomalies.push({
          field: 'Suhu Tubuh',
          val: `${temp} °C`,
          msg: temp < 35.0 ? 'Kondisi Hipotermia (Suhu Tubuh Terlalu Rendah).' : 'Kondisi Demam / Febris (Suhu Tinggi).',
          isExtreme: false
        })
      }
    }

    return anomalies
  }

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

    const anomalies = checkVitalsAnomalies()
    if (anomalies.length > 0) {
      setVitalsAnomalies(anomalies)
      setIsVitalsWarningOpen(true)
      return
    }

    await executeSubmit()
  }

  async function executeSubmit() {
    setSaving(true)
    setIsVitalsWarningOpen(false)

    try {
      const result = await createKunjungan({
        pasien_id: pasien.id,
        dokter_id: dokterId,
        tensi_sistolik: tensiSistolik ? parseInt(tensiSistolik, 10) : undefined,
        tensi_diastolik: tensiDiastolik
          ? parseInt(tensiDiastolik, 10)
          : undefined,
        nadi: nadi ? parseInt(nadi, 10) : undefined,
        // Support Indonesian comma separators as dots
        suhu: suhu ? parseFloat(suhu.replace(',', '.')) : undefined,
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
      try {
        localStorage.removeItem(`draft_kunjungan_${pasien.id}`)
      } catch (err) {
        console.error('Gagal menghapus draf:', err)
      }
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
    <div className="space-y-6">
      {/* Header outside cream paper */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={saving}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Kembali
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Pendaftaran Kunjungan Pasien
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {pasien.nama} · #{pasien.nrm}
            </p>
          </div>
        </div>
      </div>

      {/* 💾 Draf Auto-save Status Bar */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg p-2.5 px-4 text-xs">
        <div className="flex items-center gap-2">
          {isTyping ? (
            <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-50 border border-sky-200">
              <Loader2 className="h-3 w-3 mr-1 animate-pulse" />
              Sedang mengetik...
            </Badge>
          ) : savingDraft ? (
            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Menyimpan draf...
            </Badge>
          ) : lastSaved ? (
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Draf tersimpan otomatis pukul {formatLastSaved()} WIB
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-400 border-gray-200 bg-white">
              Auto-save aktif (lokal browser)
            </Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleManualSave}
          disabled={savingDraft}
          className="h-7 text-xs gap-1 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all bg-white shadow-xs"
        >
          <Save className="h-3 w-3" />
          Simpan Draf Sekarang
        </Button>
      </div>

      {/* 📄 LEBARAN KERTAS IVORY REKAM MEDIS PASIEN (Hanya berisi Formulir & Riwayat Klinis) */}
      <div className="bg-[#FAF9F6] border-2 border-[#EADFC9] shadow-xl rounded-xl p-6 md:p-8 space-y-6 relative overflow-hidden select-none">

        {/* Kop Lembar Rekam Medis (Sesuai Foto Asli) */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold tracking-widest text-gray-800 border-b border-gray-400 pb-1 inline-block">
            REKAM MEDIS PASIEN
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Alamat : Gupolo Rt. 04 Rw. 02, Cucukan, Prambanan, Klaten 57454
          </p>
          <div className="border-t-4 border-double border-gray-800 my-3" />
        </div>

        {/* Metadata Pasien dengan Garis Dotted */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs md:text-sm text-gray-800">
          {/* Kolom Kiri */}
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="font-semibold text-gray-600 w-28 shrink-0 pb-0.5">Nama Pasien</span>
              <span className="text-gray-400">:</span>
              <span className="grow border-b border-dotted border-gray-500 font-handwritten text-blue-900 px-2 font-bold text-lg select-all">
                {pasien.nama}
              </span>
            </div>

            <div className="flex items-end gap-2">
              <span className="font-semibold text-gray-600 w-28 shrink-0 pb-0.5">Tempat/Tgl Lahir</span>
              <span className="text-gray-400">:</span>
              <span className="grow border-b border-dotted border-gray-500 font-handwritten text-blue-900 px-2 select-all">
                {pasien.tempat_lahir ?? 'Sragen'}, {formatDate(pasien.tanggal_lahir)}
              </span>
            </div>

            <div className="flex items-end gap-2">
              <span className="font-semibold text-gray-600 w-28 shrink-0 pb-0.5">Alamat</span>
              <span className="text-gray-400">:</span>
              <span className="grow border-b border-dotted border-gray-500 font-handwritten text-blue-900 px-2 select-all leading-snug">
                {pasien.alamat ?? '-'}
              </span>
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="font-semibold text-gray-600 w-24 shrink-0 pb-0.5">No. RM</span>
              <span className="text-gray-400">:</span>
              <span className="grow border-b border-dotted border-gray-500 font-handwritten text-blue-900 px-2 font-bold text-lg select-all">
                {pasien.nrm}
              </span>
            </div>

            <div className="flex items-end gap-2">
              <span className="font-semibold text-gray-600 w-24 shrink-0 pb-0.5">Alergi Obat</span>
              <span className="text-gray-400">:</span>
              <span className={`grow border-b border-dotted border-gray-500 font-handwritten px-2 font-semibold select-all flex items-center justify-between ${alergiObatState ? 'text-red-600 border-red-300' : 'text-blue-900'}`}>
                <span className="flex items-center gap-1">
                  {alergiObatState ? <AlertTriangle className="h-3.5 w-3.5 text-red-500 inline" /> : null}
                  {alergiObatState || '-'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 hover:bg-gray-250 text-sky-600 rounded ml-1"
                  onClick={() => {
                    setTempAlergi(alergiObatState)
                    setIsAlergiOpen(true)
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </span>
            </div>

            <div className="flex items-end gap-2">
              <span className="font-semibold text-gray-600 w-24 shrink-0 pb-0.5">No. HP</span>
              <span className="text-gray-400">:</span>
              <span className="grow border-b border-dotted border-gray-500 font-handwritten text-blue-900 px-2 select-all">
                {pasien.no_hp ?? '-'}
              </span>
            </div>

            <div className="flex items-end gap-2">
              <span className="font-semibold text-gray-600 w-24 shrink-0 pb-0.5">Jenis Kelamin</span>
              <span className="text-gray-400">:</span>
              <span className="grow border-b border-dotted border-gray-500 font-handwritten text-blue-900 px-2 select-all">
                {pasien.jenis_kelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
              </span>
            </div>
          </div>
        </div>

        {/* 📚 TABEL REKAM MEDIS GRID 4 KOLOM UTAMA (Sama Persis Seperti Tampilan Dokter) */}
        <div className="border border-gray-400 bg-white rounded-lg overflow-x-auto mt-6">
          <table className="w-full min-w-[750px] sm:min-w-0 table-fixed border-collapse text-xs md:text-sm text-gray-800">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-400 text-center font-bold">
                <th className="p-3 border-r border-gray-400 w-[20%] bg-gray-100 sticky top-0 z-10 shadow-xs">Tanggal</th>
                <th className="p-3 border-r border-gray-400 w-[45%] bg-gray-100 sticky top-0 z-10 shadow-xs">Anamnesa / Pemeriksaan</th>
                <th className="p-3 border-r border-gray-400 w-[18%] bg-gray-100 sticky top-0 z-10 shadow-xs">Diagnosis</th>
                <th className="p-3 bg-gray-100 w-[17%] sticky top-0 z-10 shadow-xs">Terapi</th>
              </tr>
            </thead>
            <tbody>

              {/* 🛑 BARIS UTAMA EDITABLE STAF (HARI INI) */}
              {historyPage === 1 && (
                <tr className="border-b border-gray-300 align-top bg-amber-50/20 hover:bg-amber-50/30 transition-colors">

                  {/* 1. Tanggal + Form Vital Signs */}
                  <td className="p-3 border-r border-gray-300 space-y-3">
                    <div className="font-bold text-gray-900 leading-snug">
                      {formatIndonesianDateTime(new Date())}
                    </div>

                    <div className="space-y-3 pt-2 border-t border-dashed border-gray-200">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500 shrink-0" />
                        Tanda Vital (Edit)
                      </div>

                      {/* Tensi Input sistolik & diastolik */}
                      <div className="space-y-1">
                        <Label className="text-[10px] text-gray-500">Tekanan Darah (mmHg)</Label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            placeholder="Sistolik"
                            value={tensiSistolik}
                            onChange={(e) => setTensiSistolik(e.target.value)}
                            disabled={saving}
                            className="h-7 text-xs w-16 p-1 text-center font-handwritten text-blue-900 focus-visible:ring-emerald-500 border-gray-300"
                          />
                          <span className="text-gray-400">/</span>
                          <Input
                            type="number"
                            placeholder="Diastolik"
                            value={tensiDiastolik}
                            onChange={(e) => setTensiDiastolik(e.target.value)}
                            disabled={saving}
                            className="h-7 text-xs w-16 p-1 text-center font-handwritten text-blue-900 focus-visible:ring-emerald-500 border-gray-300"
                          />
                        </div>
                      </div>

                      {/* Nadi & Suhu */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <Activity className="h-2.5 w-2.5 text-blue-500" />
                            Nadi (/m)
                          </Label>
                          <Input
                            type="number"
                            placeholder="Nadi"
                            value={nadi}
                            onChange={(e) => setNadi(e.target.value)}
                            disabled={saving}
                            className="h-7 text-xs w-full p-1 text-center font-handwritten text-blue-900 focus-visible:ring-emerald-500 border-gray-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <Thermometer className="h-2.5 w-2.5 text-amber-500" />
                            Suhu (°C)
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Suhu"
                            value={suhu}
                            onChange={(e) => setSuhu(e.target.value)}
                            disabled={saving}
                            className="h-7 text-xs w-full p-1 text-center font-handwritten text-blue-900 focus-visible:ring-emerald-500 border-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Anamnesa / Keluhan Utama Textarea */}
                  <td className="p-2 border-r border-gray-300">
                    <Textarea
                      placeholder="Petugas Pendaftaran menulis keluhan utama pasien saat datang di sini..."
                      value={keluhanUtama}
                      onChange={(e) => setKeluhanUtama(e.target.value)}
                      disabled={saving}
                      rows={12}
                      className="w-full h-full min-h-[220px] p-2 resize-y font-handwritten text-blue-900 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:font-sans placeholder:text-gray-400 leading-relaxed text-base shadow-none break-words"
                    />
                  </td>

                  {/* 3. Diagnosis (Read-Only diisi oleh dokter) */}
                  <td className="p-3 border-r border-gray-300 text-center align-middle">
                    <span className="text-xs text-gray-400 italic font-medium block p-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                      (Diisi oleh Dokter)
                    </span>
                  </td>

                  {/* 4. Terapi (Read-Only diisi oleh dokter) */}
                  <td className="p-3 text-center align-middle">
                    <span className="text-xs text-gray-400 italic font-medium block p-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                      (Diisi oleh Dokter)
                    </span>
                  </td>

                </tr>
              )}

              {/* 📜 RIWAYAT KUNJUNGAN SEBELUMNYA (READ-ONLY) */}
              {loadingRiwayat ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Memuat riwayat rekam medis terdahulu...
                  </td>
                </tr>
              ) : riwayat.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 font-medium italic">
                    Belum ada riwayat kunjungan medis pasien sebelumnya pada sistem.
                  </td>
                </tr>
              ) : (
                paginatedRiwayat.map((row) => {
                  const rm = Array.isArray(row.rekam_medis) ? row.rekam_medis[0] : row.rekam_medis;
                  return (
                    <tr key={row.id} className="border-b border-gray-200 align-top opacity-85 hover:opacity-100 transition-opacity">

                      {/* Kolom Tanggal Riwayat + Vital Signs */}
                      <td className="p-3 border-r border-gray-200 text-gray-600 font-semibold leading-normal">
                        <div>{formatIndonesianDateTime(row.jam_daftar || row.tanggal)}</div>
                        <div className="text-[11px] text-sky-700 mt-1 font-sans font-medium">
                          Dr. {row.dokter?.nama || 'Tidak diketahui'}
                        </div>

                        {/* Tampilan Vital Signs Riwayat */}
                        {(row.tensi_sistolik || row.nadi || row.suhu) && (
                          <div className="mt-2.5 space-y-1 pt-1.5 border-t border-dashed border-gray-200 text-[11px] font-handwritten text-blue-800 text-xs">
                            {row.tensi_sistolik && (
                              <div>BP: {row.tensi_sistolik}/{row.tensi_diastolik ?? '-'} mmHg</div>
                            )}
                            {row.nadi && (
                              <div>HR: {row.nadi} /menit</div>
                            )}
                            {row.suhu && (
                              <div>Temp: {row.suhu} °C</div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Kolom Anamnesa / Pemeriksaan Riwayat */}
                      <td className="p-3 border-r border-gray-200 font-handwritten text-blue-900 text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                        {rm?.anamnesis || '-'}
                        {rm?.pemeriksaan_fisik && (
                          <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                            {rm.pemeriksaan_fisik}
                          </div>
                        )}
                      </td>

                      {/* Kolom Diagnosis Riwayat */}
                      <td className="p-3 border-r border-gray-200 font-handwritten text-blue-900 text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                        {rm?.diagnosis_nama || '-'}
                        {rm?.diagnosis_kode && (
                          <span className="font-sans text-[10px] text-gray-500 block mt-1 font-normal select-all">
                            ({rm.diagnosis_kode})
                          </span>
                        )}
                      </td>

                      {/* Kolom Terapi Riwayat */}
                      <td className="p-3 font-handwritten text-blue-900 text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                        {rm?.terapi || '-'}

                        {/* Tampilan Resep Riwayat */}
                        {row.resep_obat && row.resep_obat.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-dashed border-gray-200 text-xs">
                            <ul className="space-y-1 list-disc list-inside text-blue-800 font-medium">
                              {row.resep_obat.map((r: any, idx: number) => (
                                <li key={idx} className="leading-snug">
                                  {r.nama_obat} ({r.dosis}) x{r.jumlah}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}

            </tbody>
          </table>
        </div>

        {/* Kontrol Navigasi Halaman Riwayat */}
        {totalHistoryPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-4 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
              disabled={historyPage === 1}
              className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 bg-[#FAF9F6] shadow-sm"
            >
              Sebelumnya
            </Button>

            <span className="text-sm font-semibold text-gray-700 font-mono">
              {historyPage} / {totalHistoryPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryPage((prev) => Math.min(prev + 1, totalHistoryPages))}
              disabled={historyPage === totalHistoryPages}
              className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 bg-[#FAF9F6] shadow-sm"
            >
              Selanjutnya
            </Button>
          </div>
        )}

      </div>

      {/* ⚙️ BAGIAN ADMINISTRASI DI LUAR FORMULIR REKAM MEDIS (DI BAWAH KERTAS CREAM) */}
      <div className="bg-[#FAF9F6] border-2 border-[#EADFC9] rounded-2xl p-5 shadow-md space-y-4">
        <div className="text-xs uppercase font-extrabold tracking-wider text-sky-700 flex items-center gap-1.5 border-b border-[#EADFC9] pb-2">
          <Stethoscope className="h-4 w-4 text-sky-600 shrink-0" />
          Rujukan & Pengiriman Berkas RME
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dokter" className="text-xs text-gray-500 font-semibold">
              Kirim Berkas ke Dokter Pemeriksa <span className="text-red-500">*</span>
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
                <SelectTrigger id="dokter" className="border-gray-300 focus:ring-sky-500 max-w-md bg-white">
                  <SelectValue placeholder="Pilih dokter pemeriksa..." />
                </SelectTrigger>
                <SelectContent>
                  {dokters.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                        {d.nama}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={saving}
              className="border-gray-300 hover:bg-gray-50 text-gray-700 bg-white"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving || loadingDokters || dokters.length === 0}
              className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white shadow-md shadow-sky-500/20 gap-2 font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengirim Berkas...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Kirim Berkas RME ke Dokter
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

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

      {/* Modal Peringatan Vital Signs Ekstrem / Tidak Normal */}
      <Dialog open={isVitalsWarningOpen} onOpenChange={setIsVitalsWarningOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl border-amber-200">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-amber-700 font-bold text-lg">
              <AlertTriangle className="h-5.5 w-5.5 text-amber-500 animate-bounce" />
              Peringatan Nilai Tanda Vital
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-xs leading-relaxed">
              Sistem mendeteksi beberapa nilai tanda vital berada di luar batas normal atau sangat ekstrem. Silakan tinjau kembali untuk menghindari kesalahan ketik (*typo*).
            </DialogDescription>
          </DialogHeader>

          {/* List of Anomalies */}
          <div className="space-y-3 my-4 bg-amber-55/30 border border-amber-100/70 rounded-xl p-4 max-h-[250px] overflow-y-auto">
            {vitalsAnomalies.map((anom, idx) => (
              <div key={idx} className="flex gap-2.5 items-start text-xs border-b border-amber-100/50 pb-2.5 last:border-0 last:pb-0">
                {anom.isExtreme ? (
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                    ❌
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                    ⚠️
                  </span>
                )}
                <div className="space-y-0.5">
                  <div className="font-bold text-gray-800">
                    {anom.field}: <span className={anom.isExtreme ? 'text-red-600 font-extrabold select-all' : 'text-amber-700 font-extrabold select-all'}>{anom.val}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    {anom.msg}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsVitalsWarningOpen(false)}
              className="w-full sm:w-auto border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 bg-white"
            >
              Perbaiki Inputan
            </Button>
            <Button
              onClick={executeSubmit}
              disabled={saving}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-md shadow-amber-500/10 gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Ya, Data Benar & Kirim
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
