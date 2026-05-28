'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { saveRekamMedis, getRiwayatKunjungan, type RiwayatItem } from '@/app/actions/dokter'
import type { KunjunganRow, PasienRow, RekamMedisRow } from '@/types/database'
import type { ResepItem } from '@/app/actions/dokter'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Save, 
  Loader2, 
  CheckCircle2, 
  Activity, 
  Thermometer, 
  Heart, 
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface TabRekamMedisProps {
  kunjungan: KunjunganRow
  pasien: PasienRow
  initialData: RekamMedisRow | null
  readOnly: boolean
  resepItems?: ResepItem[]
  onDataChange?: (data: {
    anamnesis: string
    pemeriksaan_fisik: string
    diagnosis_kode: string
    diagnosis_nama: string
    terapi: string
    catatan: string
  }) => void
}

export function TabRekamMedis({
  kunjungan,
  pasien,
  initialData,
  readOnly,
  resepItems = [],
  onDataChange,
}: TabRekamMedisProps) {
  // Rekam Medis fields
  const [anamnesis, setAnamnesis] = useState(initialData?.anamnesis ?? '')
  const [pemeriksaanFisik, setPemeriksaanFisik] = useState(initialData?.pemeriksaan_fisik ?? '')
  const [diagnosisKode, setDiagnosisKode] = useState(initialData?.diagnosis_kode ?? '')
  const [diagnosisNama, setDiagnosisNama] = useState(initialData?.diagnosis_nama ?? '')
  const [terapi, setTerapi] = useState(initialData?.terapi ?? '')
  const [catatan, setCatatan] = useState(initialData?.catatan ?? '')

  // Inline Vital Sign fields
  const [tensiSistolik, setTensiSistolik] = useState<string>(kunjungan.tensi_sistolik ? String(kunjungan.tensi_sistolik) : '')
  const [tensiDiastolik, setTensiDiastolik] = useState<string>(kunjungan.tensi_diastolik ? String(kunjungan.tensi_diastolik) : '')
  const [nadi, setNadi] = useState<string>(kunjungan.nadi ? String(kunjungan.nadi) : '')
  const [suhu, setSuhu] = useState<string>(kunjungan.suhu ? String(kunjungan.suhu) : '')

  // Loading & Saving States
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [riwayat, setRiwayat] = useState<RiwayatItem[]>([])
  const [loadingRiwayat, setLoadingRiwayat] = useState(true)
  const isDirty = useRef(false)

  // Fetch complete previous visits' record history
  useEffect(() => {
    async function fetchRiwayat() {
      try {
        const data = await getRiwayatKunjungan(pasien.id, kunjungan.id)
        setRiwayat(data)
      } catch (err) {
        console.error('Gagal memuat riwayat rekam medis:', err)
      } finally {
        setLoadingRiwayat(false)
      }
    }
    fetchRiwayat()
  }, [pasien.id, kunjungan.id])

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

  // Helper: Format birth date and calculate age
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
      return `${age} th`
    } catch {
      return '-'
    }
  }

  // Notify parent of data changes
  const notifyParent = useCallback(() => {
    onDataChange?.({
      anamnesis,
      pemeriksaan_fisik: pemeriksaanFisik,
      diagnosis_kode: diagnosisKode,
      diagnosis_nama: diagnosisNama,
      terapi,
      catatan,
    })
  }, [anamnesis, pemeriksaanFisik, diagnosisKode, diagnosisNama, terapi, catatan, onDataChange])

  useEffect(() => {
    notifyParent()
  }, [notifyParent])

  // Change handler to track dirty state
  function handleChange(setter: (v: string) => void, value: string) {
    setter(value)
    isDirty.current = true
  }

  // Manual save function
  const handleManualSave = async () => {
    setSaving(true)
    try {
      const result = await saveRekamMedis({
        kunjunganId: kunjungan.id,
        anamnesis: anamnesis || undefined,
        pemeriksaan_fisik: pemeriksaanFisik || undefined,
        diagnosis_kode: diagnosisKode || undefined,
        diagnosis_nama: diagnosisNama || undefined,
        terapi: terapi || undefined,
        catatan: catatan || undefined,
        tensi_sistolik: tensiSistolik ? Number(tensiSistolik) : null,
        tensi_diastolik: tensiDiastolik ? Number(tensiDiastolik) : null,
        nadi: nadi ? Number(nadi) : null,
        suhu: suhu ? Number(suhu) : null,
      })

      if (result.success) {
        isDirty.current = false
        setLastSaved(new Date())
        toast.success('Draf rekam medis berhasil disimpan')
      } else {
        toast.error(result.error || 'Gagal menyimpan draf')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan')
    } finally {
      setSaving(false)
    }
  }

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (readOnly) return

    const interval = setInterval(async () => {
      if (!isDirty.current) return

      setSaving(true)
      try {
        const result = await saveRekamMedis({
          kunjunganId: kunjungan.id,
          anamnesis: anamnesis || undefined,
          pemeriksaan_fisik: pemeriksaanFisik || undefined,
          diagnosis_kode: diagnosisKode || undefined,
          diagnosis_nama: diagnosisNama || undefined,
          terapi: terapi || undefined,
          catatan: catatan || undefined,
          tensi_sistolik: tensiSistolik ? Number(tensiSistolik) : null,
          tensi_diastolik: tensiDiastolik ? Number(tensiDiastolik) : null,
          nadi: nadi ? Number(nadi) : null,
          suhu: suhu ? Number(suhu) : null,
        })

        if (result.success) {
          isDirty.current = false
          setLastSaved(new Date())
        }
      } catch {
        // Silent fail for auto-save
      } finally {
        setSaving(false)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [
    readOnly,
    kunjungan.id,
    anamnesis,
    pemeriksaanFisik,
    diagnosisKode,
    diagnosisNama,
    terapi,
    catatan,
    tensiSistolik,
    tensiDiastolik,
    nadi,
    suhu,
  ])

  function formatLastSaved(): string {
    if (!lastSaved) return ''
    return lastSaved.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      {/* 💾 Saving and Auto-save Header Info */}
      {!readOnly && (
        <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg p-2.5 px-4 text-xs">
          <div className="flex items-center gap-2">
            {saving ? (
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-200">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Menyimpan draf...
              </Badge>
            ) : lastSaved ? (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Draft tersimpan {formatLastSaved()}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500 border-gray-200">
                Auto-save aktif (Tiap 30 detik)
              </Badge>
            )}
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleManualSave} 
            disabled={saving}
            className="h-7 text-xs gap-1 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all"
          >
            <Save className="h-3 w-3" />
            Simpan Draf Sekarang
          </Button>
        </div>
      )}

      {/* 📄 1. LEBARAN KERTAS IVORY REKAM MEDIS PASIEN */}
      <div className="bg-[#FAF9F6] border-2 border-[#EADFC9] shadow-xl rounded-xl p-6 md:p-8 space-y-6 relative overflow-hidden select-none">
        
        {/* Kop Lembar Rekam Medis (Sesui Foto Asli) */}
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
                {pasien.tempat_lahir ?? 'Sragen'}, {pasien.tanggal_lahir ? new Date(pasien.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
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
              <span className={`grow border-b border-dotted border-gray-500 font-handwritten px-2 font-semibold select-all ${pasien.alergi_obat ? 'text-red-600 border-red-300' : 'text-blue-900'}`}>
                {pasien.alergi_obat ? (
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 inline" />
                    {pasien.alergi_obat}
                  </span>
                ) : '-'}
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

        {/* 📚 TABEL REKAM MEDIS GRID 4 KOLOM UTAMA */}
        <div className="border border-gray-400 bg-white rounded-lg overflow-hidden mt-6">
          <table className="w-full table-fixed border-collapse text-xs md:text-sm text-gray-800">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-400 text-center font-bold">
                <th className="p-3 border-r border-gray-400 w-[20%]">Tanggal</th>
                <th className="p-3 border-r border-gray-400 w-[45%]">Anamnesa / Pemeriksaan</th>
                <th className="p-3 border-r border-gray-400 w-[18%]">Diagnosis</th>
                <th className="p-3 w-[17%]">Terapi</th>
              </tr>
            </thead>
            <tbody>
              
              {/* 🛑 HARI INI (BARIS UTAMA EDITABLE DOKTER) */}
              <tr className="border-b border-gray-300 align-top bg-amber-50/20 hover:bg-amber-50/30 transition-colors">
                
                {/* 1. KOLOM TANGGAL + INPUT VITAL SIGNS OLEH DOKTER */}
                <td className="p-3 border-r border-gray-300 space-y-3">
                  <div className="font-bold text-gray-900 leading-snug">
                    {formatIndonesianDateTime(kunjungan.jam_daftar || new Date())}
                  </div>
                  
                  {/* Form Input Vital Signs Inline */}
                  <div className="space-y-3 pt-2 border-t border-dashed border-gray-200">
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1">
                      <Heart className="h-3 w-3 text-red-500 shrink-0" />
                      Tanda Vital (Edit)
                    </div>
                    
                    {/* Tensi Input */}
                    <div className="space-y-1">
                      <Label className="text-[10px] text-gray-500">Tekanan Darah (mmHg)</Label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          placeholder="Sistolik"
                          value={tensiSistolik}
                          onChange={(e) => handleChange(setTensiSistolik, e.target.value)}
                          disabled={readOnly}
                          className="h-7 text-xs w-16 p-1 text-center font-handwritten text-blue-900 focus-visible:ring-emerald-500"
                        />
                        <span className="text-gray-400">/</span>
                        <Input
                          type="number"
                          placeholder="Diastolik"
                          value={tensiDiastolik}
                          onChange={(e) => handleChange(setTensiDiastolik, e.target.value)}
                          disabled={readOnly}
                          className="h-7 text-xs w-16 p-1 text-center font-handwritten text-blue-900 focus-visible:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Nadi & Suhu Inline Grid */}
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
                          onChange={(e) => handleChange(setNadi, e.target.value)}
                          disabled={readOnly}
                          className="h-7 text-xs w-full p-1 text-center font-handwritten text-blue-900 focus-visible:ring-emerald-500"
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
                          onChange={(e) => handleChange(setSuhu, e.target.value)}
                          disabled={readOnly}
                          className="h-7 text-xs w-full p-1 text-center font-handwritten text-blue-900 focus-visible:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </td>

                {/* 2. KOLOM ANAMNESA / PEMERIKSAAN (INPUT BEBAS TEXTAREA BESAR) */}
                <td className="p-2 border-r border-gray-300">
                  <Textarea
                    placeholder="Tulis anamnesis lengkap keluhan pasien & hasil pemeriksaan fisik di sini secara bebas..."
                    value={anamnesis}
                    onChange={(e) => handleChange(setAnamnesis, e.target.value)}
                    disabled={readOnly}
                    rows={12}
                    className="w-full h-full min-h-[220px] p-2 resize-y font-handwritten text-blue-900 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:font-sans placeholder:text-gray-400 leading-relaxed text-base shadow-none break-words"
                  />
                </td>

                {/* 3. KOLOM DIAGNOSIS (INPUT TEKS DIAGNOSA BEBAS) */}
                <td className="p-2 border-r border-gray-300">
                  <Textarea
                    placeholder="Diagnosis..."
                    value={diagnosisNama}
                    onChange={(e) => handleChange(setDiagnosisNama, e.target.value)}
                    disabled={readOnly}
                    rows={10}
                    className="w-full h-full min-h-[220px] p-2 resize-y font-handwritten text-blue-900 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:font-sans placeholder:text-gray-400 leading-relaxed text-base shadow-none break-words"
                  />
                </td>

                {/* 4. KOLOM TERAPI (INPUT TINDAKAN + AUTO-SINKRON RESEP OBAT) */}
                <td className="p-2 space-y-4">
                  <Textarea
                    placeholder="Terapi non-obat, edukasi, catatan..."
                    value={terapi}
                    onChange={(e) => handleChange(setTerapi, e.target.value)}
                    disabled={readOnly}
                    rows={6}
                    className="w-full p-2 resize-y font-handwritten text-blue-900 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:font-sans placeholder:text-gray-400 leading-relaxed text-base shadow-none break-words"
                  />
                  
                  {/* Sinkronisasi Daftar Resep Obat */}
                  {resepItems.length > 0 && (
                    <div className="pt-2.5 border-t border-dashed border-gray-300 px-2 text-xs">
                      <div className="font-bold text-gray-500 uppercase text-[9px] tracking-wider mb-1.5">
                        Resep Obat Terintegrasi:
                      </div>
                      <ul className="space-y-1.5 list-disc list-inside font-handwritten text-blue-800 text-sm">
                        {resepItems.map((item, idx) => (
                          <li key={idx} className="leading-snug">
                            {item.nama_obat} ({item.dosis})
                            <span className="font-sans text-[10px] text-gray-500 ml-1.5 font-normal">
                              x{item.jumlah}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </td>
              </tr>

              {/* 📜 RIWAYAT KUNJUNGAN SEBELUMNYA (READ-ONLY BARIS DI BAWAH HARI INI) */}
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
                riwayat.map((row) => (
                  <tr key={row.id} className="border-b border-gray-200 align-top opacity-85 hover:opacity-100 transition-opacity">
                    
                    {/* Kolom Tanggal Riwayat + Vital Signs */}
                    <td className="p-3 border-r border-gray-200 text-gray-600 font-semibold leading-normal">
                      <div>{formatIndonesianDateTime(row.jam_daftar || row.tanggal)}</div>
                      
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

                    {/* Kolom Anamnesa / Pemeriksaan Riwayat (Gaya Tulisan Tangan Pena Biru) */}
                    <td className="p-3 border-r border-gray-200 font-handwritten text-blue-900 text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                      {row.anamnesis || '-'}
                      {row.pemeriksaan_fisik && (
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                          {row.pemeriksaan_fisik}
                        </div>
                      )}
                    </td>

                    {/* Kolom Diagnosis Riwayat */}
                    <td className="p-3 border-r border-gray-200 font-handwritten text-blue-900 text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                      {row.diagnosis_nama || '-'}
                      {row.diagnosis_kode && (
                        <span className="font-sans text-[10px] text-gray-500 block mt-1 font-normal select-all">
                          ({row.diagnosis_kode})
                        </span>
                      )}
                    </td>

                    {/* Kolom Terapi Riwayat */}
                    <td className="p-3 font-handwritten text-blue-900 text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                      {row.terapi || '-'}
                      
                      {/* Tampilan Resep Riwayat */}
                      {row.resep && row.resep.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-dashed border-gray-200 text-xs">
                          <ul className="space-y-1 list-disc list-inside text-blue-800">
                            {row.resep.map((r, idx) => (
                              <li key={idx} className="leading-snug">
                                {r.nama_obat} ({r.dosis}) x{r.jumlah}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
