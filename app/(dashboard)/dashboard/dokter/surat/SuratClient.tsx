'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  FileCheck, Building2, Printer, Clock, FileText, User, Check, Activity, History, X
} from 'lucide-react'
import { createSurat, getLatestKunjungan, getSuratHistory, logCetakUlangSurat } from '@/app/actions/surat'

interface Pasien {
  id: string
  nama: string
  nrm: number
  jenis_kelamin: string
  tanggal_lahir: string
  alamat: string
}

interface SuratClientProps {
  patients: Pasien[]
  currentUserId: string
  currentUserName: string
  initialHistory?: any[]
}

export default function SuratClient({ patients, currentUserId, currentUserName, initialHistory }: SuratClientProps) {
  const searchParams = useSearchParams()
  const initialPatientId = searchParams.get('patientId') || ''
  const initialKunjunganId = searchParams.get('kunjunganId') || ''

  const [activeTab, setActiveTab] = useState<'sehat' | 'rujukan' | 'sakit' | 'riwayat'>('sehat')
  const [history, setHistory] = useState<any[]>(initialHistory || [])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId)

  const [isGenerating, setIsGenerating] = useState(false)
  const [printData, setPrintData] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const formatDateID = (d?: string) => {
    const dateObj = d ? new Date(d) : new Date()
    return isNaN(dateObj.getTime())
      ? d || ''
      : dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getPatientAge = (tglLahir?: string) => {
    if (!tglLahir) return 34
    const birthYear = new Date(tglLahir).getFullYear()
    if (isNaN(birthYear)) return 34
    return new Date().getFullYear() - birthYear
  }

  const getPatientNIK = (pasien: any) => {
    if (!pasien) return '3273011508920001'
    if (pasien.nik) return pasien.nik
    if (pasien.nrm) return `327301${String(pasien.nrm).padStart(6, '0')}0001`
    return '3273011508920001'
  }

  // --- FORM STATE: SURAT KETERANGAN SEHAT ---
  const [skNomorSurat, setSkNomorSurat] = useState('')
  const [skOccupation, setSkOccupation] = useState('Karyawan Swasta')
  const [skPurpose, setSkPurpose] = useState('Persyaratan Melamar Pekerjaan')
  const [skHeight, setSkHeight] = useState('170')
  const [skWeight, setSkWeight] = useState('65')
  const [skBloodPressure, setSkBloodPressure] = useState('120/80 mmHg')
  const [skPulse, setSkPulse] = useState('78')
  const [skBloodType, setSkBloodType] = useState('Golongan Darah O')
  const [skColorBlindness, setSkColorBlindness] = useState('Tidak Buta Warna (Normal)')
  const [skHealthStatus, setSkHealthStatus] = useState('Dinyatakan SEHAT (Layak)')
  const [skNotes, setSkNotes] = useState('Kondisi fisik dan vital sign dalam keadaan sehat.')

  // --- FORM STATE: SURAT RUJUKAN RS ---
  const [srNomorSurat, setSrNomorSurat] = useState('')
  const [srHospital, setSrHospital] = useState('RSUD dr. Hasan Sadikin Bandung')
  const [srDepartment, setSrDepartment] = useState('Poli Penyakit Dalam (Sp.PD)')
  const [srDiagnosis, setSrDiagnosis] = useState('')
  const [srAnamnesis, setSrAnamnesis] = useState('')
  const [srVitalSigns, setSrVitalSigns] = useState('TD: 120/80 mmHg, Nadi: 80x/mnt, Suhu: 36.5°C')
  const [srTreatment, setSrTreatment] = useState('Terapi simptomatis awal telah diberikan.')
  const [srReason, setSrReason] = useState('Evaluasi spesialis & penanganan medis lebih lanjut.')

  // --- FORM STATE: SURAT KETERANGAN SAKIT ---
  const [ssNomorSurat, setSsNomorSurat] = useState('')
  const [ssDays, setSsDays] = useState('3')
  const [ssStartDate, setSsStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [ssEndDate, setSsEndDate] = useState(new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10))
  const [ssDiagnosis, setSsDiagnosis] = useState('')

  const [latestKunjungan, setLatestKunjungan] = useState<any>(null)

  useEffect(() => {
    async function fetchLatestData() {
      if (selectedPatientId) {
        const kunjungan: any = await getLatestKunjungan(selectedPatientId)
        setLatestKunjungan(kunjungan)
        if (kunjungan) {
          // Fill Vitals
          if (kunjungan.tensi_sistolik && kunjungan.tensi_diastolik) {
            setSkBloodPressure(`${kunjungan.tensi_sistolik}/${kunjungan.tensi_diastolik} mmHg`)
          }
          if (kunjungan.nadi) {
            setSkPulse(`${kunjungan.nadi}`)
          }

          let vitals = []
          if (kunjungan.tensi_sistolik) vitals.push(`TD: ${kunjungan.tensi_sistolik}/${kunjungan.tensi_diastolik} mmHg`)
          if (kunjungan.nadi) vitals.push(`Nadi: ${kunjungan.nadi}x/mnt`)
          if (kunjungan.suhu) vitals.push(`Suhu: ${kunjungan.suhu}°C`)
          setSrVitalSigns(vitals.join(', '))

          if (kunjungan.rekam_medis && kunjungan.rekam_medis.length > 0) {
            const rm = kunjungan.rekam_medis[0]
            const diag = rm.diagnosis_nama ? `${rm.diagnosis_kode ? rm.diagnosis_kode + ' - ' : ''}${rm.diagnosis_nama}` : (rm.diagnosis_kode || '')
            setSrDiagnosis(diag)
            setSsDiagnosis(diag)
            setSrAnamnesis(rm.anamnesis || '')
            setSrTreatment(rm.terapi || 'Terapi simptomatis awal telah diberikan.')
          } else if (kunjungan.keluhan_utama) {
            setSrAnamnesis(kunjungan.keluhan_utama)
            setSsDiagnosis(kunjungan.keluhan_utama)
          }
        }
      } else {
        setLatestKunjungan(null)
      }
    }
    fetchLatestData()
  }, [selectedPatientId])

  const selectedPatient = patients.find(p => p.id === selectedPatientId)

  const calculateAge = (birthDateStr?: string | null) => {
    if (!birthDateStr) return null
    const birth = new Date(birthDateStr)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
    return age
  }

  const formatDateIndo = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const generateLetterNumber = (type: string) => {
    const d = new Date()
    const month = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][d.getMonth()]
    const rand = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')
    return `${rand}/${type}/${month}/${d.getFullYear()}`
  }

  useEffect(() => {
    if (!skNomorSurat) setSkNomorSurat(generateLetterNumber('SK-SEHAT'))
    if (!srNomorSurat) setSrNomorSurat(generateLetterNumber('SR-RS'))
    if (!ssNomorSurat) setSsNomorSurat(generateLetterNumber('SK-SAKIT'))
  }, [])

  const updateEndDate = (startStr: string, daysStr: string) => {
    const days = parseInt(daysStr) || 1
    const start = new Date(startStr)
    if (!isNaN(start.getTime())) {
      const end = new Date(start.getTime() + (days - 1) * 86400000)
      setSsEndDate(end.toISOString().slice(0, 10))
    }
  }

  const refreshHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const res = await getSuratHistory()
      setHistory(res || [])
    } catch (err) {
      console.error('Error refreshing surat history:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'riwayat') {
      refreshHistory()
    }
  }, [activeTab])

  const handleCetakUlang = async (item: any) => {
    try {
      await logCetakUlangSurat(item.id, item.nomor_surat, item.tipe_surat)
    } catch (err) {
      console.error('Error logging reprint:', err)
    }

    setPrintData({
      tipe_surat: item.tipe_surat,
      nomor_surat: item.nomor_surat,
      pasien: item.pasien,
      dokter_nama: item.dokter?.nama || currentUserName,
      created_at: item.created_at,
      data: item.data
    })

    setIsPreviewOpen(true)
    toast.success(`Membuka pratinjau ${item.nomor_surat}`)
  }

  const handleGenerate = async () => {
    if (activeTab === 'riwayat') return

    if (!selectedPatientId) {
      toast.error('Silakan pilih pasien terlebih dahulu')
      return
    }

    setIsGenerating(true)
    try {
      let payloadData: any = {}
      let nomor = ''

      if (activeTab === 'sehat') {
        nomor = skNomorSurat || generateLetterNumber('SK-SEHAT')
        payloadData = {
          occupation: skOccupation,
          purpose: skPurpose,
          height: skHeight,
          weight: skWeight,
          blood_pressure: skBloodPressure,
          pulse: skPulse,
          blood_type: skBloodType,
          color_blindness: skColorBlindness,
          health_status: skHealthStatus,
          notes: skNotes
        }
      } else if (activeTab === 'rujukan') {
        nomor = srNomorSurat || generateLetterNumber('SR-RS')
        payloadData = {
          hospital_name: srHospital,
          department_name: srDepartment,
          diagnosis: srDiagnosis,
          anamnesis: srAnamnesis,
          vital_signs: srVitalSigns,
          treatment: srTreatment,
          reason: srReason
        }
      } else if (activeTab === 'sakit') {
        nomor = ssNomorSurat || generateLetterNumber('SK-SAKIT')
        payloadData = {
          leave_days: ssDays,
          start_date: ssStartDate,
          end_date: ssEndDate,
          diagnosis: ssDiagnosis
        }
      }

      const result = await createSurat({
        pasien_id: selectedPatientId,
        kunjungan_id: initialKunjunganId || undefined,
        tipe_surat: activeTab,
        nomor_surat: nomor,
        data: payloadData
      })

      const p = patients.find(p => p.id === selectedPatientId)

      setPrintData({
        tipe_surat: activeTab,
        nomor_surat: nomor,
        pasien: p,
        dokter_nama: currentUserName,
        created_at: result.created_at,
        data: payloadData
      })

      setIsPreviewOpen(true)
      toast.success('Surat berhasil dibuat. Menampilkan pratinjau.')

      // Refresh history list so the new letter appears immediately
      refreshHistory()

    } catch (e: any) {
      toast.error(e.message || 'Gagal membuat surat')
    } finally {
      setIsGenerating(false)
    }
  }

  const renderLetterSheet = (data: any) => {
      if (!data) return null

      return (
        <div className="space-y-4 text-gray-900 leading-normal">
          {/* Kop Surat */}
          <div className="text-center pb-2">
            <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-gray-900">
              PRAKTIK DOKTER MANDIRI
            </h1>
            <p className="text-sm font-bold text-teal-600 mt-0.5">
              {data.dokter_nama || currentUserName || 'dr. Hendra Pratama, Sp.PD'}
            </p>
            <p className="text-[11px] text-gray-500 mt-1 leading-tight">
              SIP No: 449/123/SIP-DR/DISKES/2024 • STR No: 31.1.1.100.2.19.123456
            </p>
            <p className="text-[11px] text-gray-500 leading-tight">
              Alamat Praktik: Jl. R.E. Martadinata No. 88, Bandung • Telp: (022) 7201234 / 0812-3456-7890
            </p>
            <div className="border-b-2 border-gray-900 mt-3" />
          </div>

          {/* 1. SURAT KETERANGAN SEHAT */}
          {data.tipe_surat === 'sehat' && (
            <div className="space-y-3">
              <div className="text-center">
                <h2 className="text-sm sm:text-base font-bold underline uppercase tracking-wide text-gray-900">
                  SURAT KETERANGAN SEHAT
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Nomor: {data.nomor_surat}
                </p>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed pt-1">
                Yang bertanda tangan di bawah ini Dokter Praktik Mandiri menerangkan dengan sebenarnya bahwa:
              </p>

              <table className="w-full text-xs text-gray-800">
                <tbody>
                  <tr>
                    <td className="w-36 sm:w-44 py-0.5 text-gray-700">Nama Lengkap</td>
                    <td className="py-0.5">: <span className="font-semibold text-gray-900">{data.pasien?.nama}</span></td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-700">NIK</td>
                    <td className="py-0.5">: {getPatientNIK(data.pasien)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-700">Jenis Kelamin / Umur</td>
                    <td className="py-0.5">: {data.pasien?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}, {getPatientAge(data.pasien?.tanggal_lahir)} Tahun</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-700">Pekerjaan</td>
                    <td className="py-0.5">: {data.data?.occupation || 'Karyawan Swasta'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-700">Alamat</td>
                    <td className="py-0.5">: {data.pasien?.alamat || 'Jl. Sukajadi No. 45, Bandung'}</td>
                  </tr>
                </tbody>
              </table>

              <p className="text-xs text-gray-700 font-medium pt-1">
                Berdasarkan hasil pemeriksaan fisik & kesehatan saat ini:
              </p>

              <div className="p-3 border border-gray-200 rounded-xl bg-gray-50/50">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-gray-700">
                  <div>• Tinggi Badan: {data.data?.height ? `${data.data.height} cm` : '170 cm'}</div>
                  <div>• Berat Badan: {data.data?.weight ? `${data.data.weight} kg` : '65 kg'}</div>
                  <div>• Tekanan Darah: {data.data?.blood_pressure || '120/80 mmHg'}</div>
                  <div>• Golongan Darah: {data.data?.blood_type || 'Golongan Darah O'}</div>
                  <div>• Buta Warna: {data.data?.color_blindness || 'Tidak Buta Warna (Normal)'}</div>
                  <div>• Denyut Nadi: {data.data?.pulse ? `${data.data.pulse} bpm` : '78 bpm'}</div>
                </div>
                {data.data?.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                    <span className="font-semibold text-gray-700">• Catatan: </span>{data.data.notes}
                  </div>
                )}
              </div>

              <div className="p-3 border border-emerald-300 bg-emerald-50/70 rounded-xl text-center text-xs text-emerald-950 font-normal">
                Kesimpulan: Yang bersangkutan dinyatakan <span className="font-bold underline text-emerald-900">SEHAT</span> untuk keperluan: &quot;{data.data?.purpose || 'Persyaratan Melamar Pekerjaan'}&quot;.
              </div>
            </div>
          )}

          {/* 2. SURAT RUJUKAN RUMAH SAKIT */}
          {data.tipe_surat === 'rujukan' && (
            <div className="space-y-3">
              <div className="text-center">
                <h2 className="text-sm sm:text-base font-bold underline uppercase tracking-wide text-gray-900">
                  SURAT RUJUKAN RUMAH SAKIT
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Nomor: {data.nomor_surat}
                </p>
              </div>

              <div className="flex justify-between items-start text-xs text-gray-800 pt-1">
                <div>
                  <p className="text-gray-600">Kepada Yth:</p>
                  <p className="font-bold text-gray-900">Dokter Spesialis / Tim Medis {data.data?.department_name || 'Poli Penyakit Dalam (Sp.PD)'}</p>
                  <p className="font-bold text-gray-900">{data.data?.hospital_name || 'RSUD dr. Hasan Sadikin Bandung'}</p>
                </div>
                <div className="text-right text-gray-600">
                  <p>Bandung, {formatDateID(data.created_at)}</p>
                </div>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">
                Mohon konsul dan penanganan medis lebih lanjut terhadap pasien di bawah ini:
              </p>

              <table className="w-full text-xs text-gray-800">
                <tbody>
                  <tr>
                    <td className="w-32 py-0.5 text-gray-700">Nama Pasien</td>
                    <td className="py-0.5">: <span className="font-semibold text-gray-900">{data.pasien?.nama}</span></td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-700">NIK / Umur</td>
                    <td className="py-0.5">: {getPatientNIK(data.pasien)} ({getPatientAge(data.pasien?.tanggal_lahir)} Thn)</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-700">Alamat</td>
                    <td className="py-0.5">: {data.pasien?.alamat || 'Jl. Sukajadi No. 45, Bandung'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="p-3 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2 text-xs">
                <div>
                  <p className="font-bold text-gray-800">1. Diagnosis Sementara / Kerja:</p>
                  <p className="text-teal-600 font-semibold pl-3 mt-0.5">{data.data?.diagnosis || 'J00 - Acute nasopharyngitis (common cold)'}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800">2. Ringkasan Anamnesis:</p>
                  <p className="text-gray-600 pl-3 mt-0.5">{data.data?.anamnesis || 'Kunjungan bulan lalu: Flu ringan dan pegal linu.'}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800">3. Tanda Vital & Pemeriksaan Fisik:</p>
                  <p className="text-gray-600 pl-3 mt-0.5">{data.data?.vital_signs || 'TD: 120/80 mmHg, Nadi: 78x/mnt, Suhu: 36.8°C, BB: 65kg'}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800">4. Terapi / Tindakan yang Telah Diberikan:</p>
                  <p className="text-gray-600 pl-3 mt-0.5">{data.data?.treatment || 'Obat: Paracetamol 500mg (3x1 tablet sesudah makan)'}</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800">5. Alasan Rujukan:</p>
                  <p className="text-gray-600 pl-3 mt-0.5">{data.data?.reason || 'Evaluasi spesialis & penanganan medis lebih lanjut.'}</p>
                </div>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">
                Demikian surat rujukan ini kami kirimkan. Atas kerja sama dan penanganan Teman Sejawat, kami ucapkan terima kasih.
              </p>
            </div>
          )}

          {/* 3. SURAT KETERANGAN SAKIT */}
          {data.tipe_surat === 'sakit' && (
            <div className="space-y-3">
              <div className="text-center">
                <h2 className="text-sm sm:text-base font-bold underline uppercase tracking-wide text-gray-900">
                  SURAT KETERANGAN SAKIT
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Nomor: {data.nomor_surat}
                </p>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed pt-1">
                Menerangkan bahwa pasien di bawah ini membutuhkan istirahat berobat karena kondisi kesehatan (sakit):
              </p>

              <table className="w-full text-xs text-gray-800">
                <tbody>
                  <tr>
                    <td className="w-32 py-0.5 text-gray-700">Nama Pasien</td>
                    <td className="py-0.5">: <span className="font-semibold text-gray-900">{data.pasien?.nama}</span></td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-700">NIK / Umur</td>
                    <td className="py-0.5">: {getPatientNIK(data.pasien)} ({getPatientAge(data.pasien?.tanggal_lahir)} Thn)</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-gray-700">Diagnosis</td>
                    <td className="py-0.5">: <span className="font-medium text-gray-900">{data.data?.diagnosis || 'J00 - Acute nasopharyngitis (common cold)'}</span></td>
                  </tr>
                </tbody>
              </table>

              <div className="p-3.5 border border-purple-200 bg-purple-50/70 rounded-xl text-center text-xs text-purple-950">
                Perlu istirahat berobat selama <strong className="text-purple-700 underline font-bold">{data.data?.leave_days || '3'} Hari</strong> terhitung dari tanggal {formatDateID(data.data?.start_date)} s/d {formatDateID(data.data?.end_date)}.
              </div>
            </div>
          )}

          {/* Footer & Tanda Tangan */}
          <div className="mt-8 pt-2 flex justify-between items-end text-xs">
            <div className="text-[10px] text-gray-400 italic space-y-0.5">
              <p>* Surat ini diterbitkan sah secara elektronik</p>
              <p>* Dokumen Praktik Dokter Mandiri</p>
            </div>
            <div className="text-center w-52 sm:w-60">
              <p className="text-gray-700">Bandung, {formatDateID(data.created_at)}</p>
              <p className="text-gray-700 mt-0.5">Dokter Pemeriksa,</p>
              <div className="h-12 sm:h-14" />
              <p className="font-bold underline text-gray-900">
                {data.dokter_nama || currentUserName || 'dr. Hendra Pratama, Sp.PD'}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                SIP: 449/123/SIP-DR/DISKES/2024
              </p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <>
        <div className="space-y-6 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border/60 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <FileCheck className="w-5 h-5 text-teal-400" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Modul Cetak Surat Kesehatan & Rujukan RS
                </h1>
                {/* <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Dokter Praktik Mandiri
              </span> */}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 ml-9">
                Penerbitan resmi Surat Keterangan Sehat, Surat Rujukan Ke Rumah Sakit, dan Surat Keterangan Sakit pasien.
              </p>
            </div>

            <div className="flex bg-muted/60 p-1 rounded-xl border border-border/40 shrink-0">
              <Button
                variant={activeTab === 'sehat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('sehat')}
                className={`gap-1.5 text-xs font-medium ${activeTab === 'sehat' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <FileCheck className="w-3.5 h-3.5" /> Surat Sehat
              </Button>
              <Button
                variant={activeTab === 'rujukan' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('rujukan')}
                className={`gap-1.5 text-xs font-medium ${activeTab === 'rujukan' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Building2 className="w-3.5 h-3.5" /> Rujukan RS
              </Button>
              <Button
                variant={activeTab === 'sakit' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('sakit')}
                className={`gap-1.5 text-xs font-medium ${activeTab === 'sakit' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Clock className="w-3.5 h-3.5" /> Surat Sakit
              </Button>
              <Button
                variant={activeTab === 'riwayat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('riwayat')}
                className={`gap-1.5 text-xs font-medium ${activeTab === 'riwayat' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <History className="w-3.5 h-3.5" /> Riwayat Surat
              </Button>
            </div>
          </div>

          {activeTab === 'riwayat' ? (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-4 border-b border-border/40">
                <CardTitle className="text-base font-semibold text-foreground">
                  Riwayat Rekapitulasi Surat Terbit
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Daftar seluruh Surat Sehat, Surat Rujukan RS, dan Surat Sakit yang telah diterbitkan.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3">
                {isLoadingHistory ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Memuat riwayat surat...
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-sm">Belum ada riwayat surat yang diterbitkan</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">Pilih tab Surat Sehat, Rujukan, atau Sakit untuk membuat surat baru</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-card/60 hover:bg-muted/40 transition-all"
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Icon Box */}
                        <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${item.tipe_surat === 'sehat'
                            ? 'bg-teal-500/10 text-teal-400'
                            : item.tipe_surat === 'rujukan'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-purple-500/10 text-purple-400'
                          }`}>
                          {item.tipe_surat === 'sehat' && <FileCheck className="w-5 h-5" />}
                          {item.tipe_surat === 'rujukan' && <Building2 className="w-5 h-5" />}
                          {item.tipe_surat === 'sakit' && <Clock className="w-5 h-5" />}
                        </div>

                        {/* Info */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-sm text-foreground">
                              {item.tipe_surat === 'sehat' && `Surat Keterangan Sehat (${item.nomor_surat})`}
                              {item.tipe_surat === 'rujukan' && `Surat Rujukan RS (${item.nomor_surat})`}
                              {item.tipe_surat === 'sakit' && `Surat Sakit / Istirahat (${item.nomor_surat})`}
                            </h4>

                            {/* Badge Status */}
                            {item.tipe_surat === 'sehat' && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                SEHAT
                              </span>
                            )}
                            {item.tipe_surat === 'rujukan' && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                Rujukan RS
                              </span>
                            )}
                            {item.tipe_surat === 'sakit' && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                {item.data?.leave_days ? `${item.data.leave_days} Hari Istirahat` : '3 Hari Istirahat'}
                              </span>
                            )}
                          </div>

                          {/* Subtitle / Details */}
                          <p className="text-xs text-muted-foreground">
                            <span>Pasien: <strong className="text-foreground font-semibold">{item.pasien?.nama || '-'}</strong></span>
                            {item.tipe_surat === 'sehat' && item.data?.purpose && (
                              <span> • Keperluan: {item.data.purpose}</span>
                            )}
                            {item.tipe_surat === 'rujukan' && item.data?.hospital_name && (
                              <span>
                                {' '}• Ke:{' '}
                                <span className="text-blue-400 font-semibold">{item.data.hospital_name}</span>
                                {item.data.department_name ? ` (${item.data.department_name})` : ''}
                              </span>
                            )}
                            {item.tipe_surat === 'sakit' && item.data?.diagnosis && (
                              <span> • Diagnosis: {item.data.diagnosis}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right Action: Date & Cetak Ulang */}
                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <span className="text-xs text-muted-foreground">
                          {formatDateIndo(item.created_at)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCetakUlang(item)}
                          className="gap-1.5 text-xs font-medium border-border/80 hover:bg-muted"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Cetak Ulang
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Form Kiri */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                      <User className="w-5 h-5 text-teal-400" />
                      Pilih Pasien Tujuan
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Pilih pasien terdaftar dari database
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground">Pilih Pasien</Label>
                      <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                        <SelectTrigger className="w-full bg-background border-input text-sm">
                          <SelectValue placeholder="Pilih pasien..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {patients.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nama} (NRM: {p.nrm})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPatient && (
                      <div className="rounded-xl border border-border/80 bg-muted/40 p-4 space-y-3 text-sm">
                        {/* Header Nama Pasien & Badge Gender */}
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-base text-foreground tracking-tight">
                            {selectedPatient.nama}
                          </h3>
                          <span className="rounded-full px-3 py-0.5 text-xs font-medium border border-border text-muted-foreground bg-muted">
                            {selectedPatient.jenis_kelamin === 'L'
                              ? 'Laki-laki'
                              : selectedPatient.jenis_kelamin === 'P'
                                ? 'Perempuan'
                                : '-'}
                          </span>
                        </div>

                        {/* Info NRM, Umur & Alamat */}
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>
                            <span>NRM: </span>
                            <span className="text-foreground font-medium">{selectedPatient.nrm}</span>
                          </p>
                          <p>
                            <span>Umur: </span>
                            <span className="text-foreground">
                              {calculateAge(selectedPatient.tanggal_lahir) !== null
                                ? `${calculateAge(selectedPatient.tanggal_lahir)} Thn `
                                : ''}
                              ({formatDateIndo(selectedPatient.tanggal_lahir)})
                            </span>
                          </p>
                          <p>
                            <span>Alamat: </span>
                            <span className="text-foreground">{selectedPatient.alamat || '-'}</span>
                          </p>
                        </div>

                        {/* Garis Pemisah & Notifikasi EMR */}
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-teal-400 flex items-center gap-1.5 font-medium">
                            <Check className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                            Data vital sign otomatis diimpor dari EMR terakhir
                            {latestKunjungan?.created_at && (
                              (` (${formatDateIndo(latestKunjungan.created_at)})`)
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Form Kanan (Detail Surat) */}
              <div className="lg:col-span-8">
                <Card className="border-border/60 shadow-sm">
                  <CardHeader className="pb-4 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${activeTab === 'sehat'
                          ? 'bg-teal-500/10 text-teal-400'
                          : activeTab === 'rujukan'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-purple-500/10 text-purple-400'
                        }`}>
                        {activeTab === 'sehat' && <FileCheck className="w-5 h-5" />}
                        {activeTab === 'rujukan' && <Building2 className="w-5 h-5" />}
                        {activeTab === 'sakit' && <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {activeTab === 'sehat' && 'Form Surat Keterangan Sehat'}
                          {activeTab === 'rujukan' && 'Form Surat Rujukan Ke Rumah Sakit'}
                          {activeTab === 'sakit' && 'Form Surat Keterangan Sakit (Istirahat)'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {activeTab === 'sehat' && 'Lengkapi parameter fisik, keperluan, dan pernyataan kelayakan sehat pasien.'}
                          {activeTab === 'rujukan' && 'Tentukan RS Tujuan, Poli Spesialis, Ringkasan Diagnosis, dan Alasan Rujukan Medis.'}
                          {activeTab === 'sakit' && 'Surat keterangan perlunya istirahat berobat karena sakit.'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">

                    {activeTab === 'sehat' && (
                      <div className="space-y-4">
                        {/* Row 1: Nomor Surat & Pekerjaan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Nomor Surat Resmi</Label>
                            <Input
                              value={skNomorSurat}
                              onChange={e => setSkNomorSurat(e.target.value)}
                              placeholder="005/SK-SEHAT/VII/2026"
                              className="font-mono text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Pekerjaan Pasien</Label>
                            <Input
                              value={skOccupation}
                              onChange={e => setSkOccupation(e.target.value)}
                              placeholder="Karyawan Swasta"
                            />
                          </div>
                        </div>

                        {/* Row 2: Keperluan Permohonan Surat */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Keperluan Permohonan Surat</Label>
                          <Input
                            value={skPurpose}
                            onChange={e => setSkPurpose(e.target.value)}
                            placeholder="Persyaratan Melamar Pekerjaan"
                          />
                        </div>

                        {/* Section Divider: Hasil Pemeriksaan Fisik */}
                        <div className="pt-2">
                          <div className="flex items-center gap-1.5 text-teal-400 font-semibold text-xs tracking-wider uppercase mb-3">
                            <Activity className="w-4 h-4 text-teal-400" />
                            <span>Hasil Pemeriksaan Fisik</span>
                          </div>

                          {/* Row 3: 4 Parameter Fisik */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Tinggi Badan (cm)</Label>
                              <Input
                                value={skHeight}
                                onChange={e => setSkHeight(e.target.value)}
                                placeholder="170"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Berat Badan (kg)</Label>
                              <Input
                                value={skWeight}
                                onChange={e => setSkWeight(e.target.value)}
                                placeholder="65"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Tekanan Darah</Label>
                              <Input
                                value={skBloodPressure}
                                onChange={e => setSkBloodPressure(e.target.value)}
                                placeholder="120/80 mmHg"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Denyut Nadi (bpm)</Label>
                              <Input
                                value={skPulse}
                                onChange={e => setSkPulse(e.target.value)}
                                placeholder="78"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Row 4: Status Klinis (3 Kolom) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Golongan Darah</Label>
                            <Select value={skBloodType} onValueChange={setSkBloodType}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Golongan Darah" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Golongan Darah A">Golongan Darah A</SelectItem>
                                <SelectItem value="Golongan Darah B">Golongan Darah B</SelectItem>
                                <SelectItem value="Golongan Darah AB">Golongan Darah AB</SelectItem>
                                <SelectItem value="Golongan Darah O">Golongan Darah O</SelectItem>
                                <SelectItem value="Tidak Tahu / -">Tidak Tahu / -</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Pemeriksaan Buta Warna</Label>
                            <Select value={skColorBlindness} onValueChange={setSkColorBlindness}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Kondisi" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Tidak Buta Warna (Normal)">Tidak Buta Warna (Normal)</SelectItem>
                                <SelectItem value="Buta Warna Parsial">Buta Warna Parsial</SelectItem>
                                <SelectItem value="Buta Warna Total">Buta Warna Total</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Kesimpulan Kesehatan</Label>
                            <Select value={skHealthStatus} onValueChange={setSkHealthStatus}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Kesimpulan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Dinyatakan SEHAT (Layak)">Dinyatakan SEHAT (Layak)</SelectItem>
                                <SelectItem value="Dinyatakan Kurang Sehat">Dinyatakan Kurang Sehat</SelectItem>
                                <SelectItem value="Perlu Evaluasi Lebih Lanjut">Perlu Evaluasi Lebih Lanjut</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Row 5: Catatan / Saran Dokter (Opsional) */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Catatan / Saran Dokter (Opsional)</Label>
                          <Input
                            value={skNotes}
                            onChange={e => setSkNotes(e.target.value)}
                            placeholder="Kondisi fisik dan vital sign dalam keadaan sehat."
                          />
                        </div>
                      </div>
                    )}

                    {activeTab === 'rujukan' && (
                      <div className="space-y-4">
                        {/* Row 1: Nomor Surat & Nama RS Tujuan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Nomor Surat Rujukan</Label>
                            <Input
                              value={srNomorSurat}
                              onChange={e => setSrNomorSurat(e.target.value)}
                              placeholder="002/SR-RS/VII/2026"
                              className="font-mono text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Nama Rumah Sakit Tujuan</Label>
                            <Input
                              value={srHospital}
                              onChange={e => setSrHospital(e.target.value)}
                              placeholder="RSUD dr. Hasan Sadikin Bandung"
                            />
                          </div>
                        </div>

                        {/* Row 2: Poli Tujuan & Diagnosis */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Poli / Dokter Spesialis Tujuan</Label>
                            <Input
                              value={srDepartment}
                              onChange={e => setSrDepartment(e.target.value)}
                              placeholder="Poli Penyakit Dalam (Sp.PD)"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Diagnosis Sementara / Kerja</Label>
                            <Input
                              value={srDiagnosis}
                              onChange={e => setSrDiagnosis(e.target.value)}
                              placeholder="e.g. E11 - Type 2 Diabetes Mellitus dengan Komplikasi"
                            />
                          </div>
                        </div>

                        {/* Row 3: Ringkasan Anamnesis / Keluhan Medis (Textarea) */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Ringkasan Anamnesis / Keluhan Medis</Label>
                          <textarea
                            value={srAnamnesis}
                            onChange={e => setSrAnamnesis(e.target.value)}
                            placeholder="Catat keluhan utama dan kondisi pasien..."
                            rows={3}
                            className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>

                        {/* Row 4: Tanda Vital & Terapi */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Ringkasan Tanda Vital & Fisik</Label>
                            <Input
                              value={srVitalSigns}
                              onChange={e => setSrVitalSigns(e.target.value)}
                              placeholder="TD: 120/80 mmHg, Nadi: 80x/mnt, Suhu: 36.5°C"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Terapi / Obat yang Sudah Diberikan</Label>
                            <Input
                              value={srTreatment}
                              onChange={e => setSrTreatment(e.target.value)}
                              placeholder="Terapi simptomatis awal telah diberikan."
                            />
                          </div>
                        </div>

                        {/* Row 5: Alasan Rujukan Medis */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Alasan Rujukan Medis</Label>
                          <Input
                            value={srReason}
                            onChange={e => setSrReason(e.target.value)}
                            placeholder="Evaluasi spesialis & penanganan medis lebih lanjut."
                          />
                        </div>
                      </div>
                    )}

                    {activeTab === 'sakit' && (
                      <div className="space-y-4">
                        {/* Row 1: Nomor Surat & Durasi Istirahat */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Nomor Surat Sakit</Label>
                            <Input
                              value={ssNomorSurat}
                              onChange={e => setSsNomorSurat(e.target.value)}
                              placeholder="002/SK-SAKIT/VII/2026"
                              className="font-mono text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Jumlah Hari Istirahat</Label>
                            <Input
                              type="number"
                              min={1}
                              value={ssDays}
                              onChange={e => {
                                const val = e.target.value
                                setSsDays(val)
                                updateEndDate(ssStartDate, val)
                              }}
                              placeholder="3"
                            />
                          </div>
                        </div>

                        {/* Row 2: Mulai Tanggal & Sampai Tanggal */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Mulai Tanggal</Label>
                            <Input
                              type="date"
                              value={ssStartDate}
                              onChange={e => {
                                const val = e.target.value
                                setSsStartDate(val)
                                updateEndDate(val, ssDays)
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Sampai Tanggal</Label>
                            <Input
                              type="date"
                              value={ssEndDate}
                              onChange={e => setSsEndDate(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Row 3: Diagnosis / Keluhan Ringkas */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Diagnosis / Keluhan Ringkas</Label>
                          <Input
                            value={ssDiagnosis}
                            onChange={e => setSsDiagnosis(e.target.value)}
                            placeholder="e.g. J00 - Acute Nasopharyngitis (Fever & Flu)"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex justify-end">
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !selectedPatientId}
                        className={`gap-2 text-white font-medium shadow-sm transition-all ${activeTab === 'sehat'
                            ? 'bg-emerald-600 hover:bg-emerald-500'
                            : activeTab === 'rujukan'
                              ? 'bg-blue-600 hover:bg-blue-500'
                              : 'bg-purple-600 hover:bg-purple-500'
                          }`}
                      >
                        <Printer className="w-4 h-4" />
                        {isGenerating
                          ? 'Menyimpan...'
                          : activeTab === 'sehat'
                            ? 'Buat & Pratinjau Cetak Surat Sehat'
                            : activeTab === 'rujukan'
                              ? 'Buat & Pratinjau Cetak Surat Rujukan'
                              : 'Buat & Pratinjau Cetak Surat Sakit'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* --- RENDER HELPER LETTER CONTENT --- */}
        {(() => null)()}

        {/* --- MODAL PRATINJAU CETAK SURAT --- */}
        {isPreviewOpen && printData && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:hidden animate-in fade-in duration-150">
            <div className="bg-[#0B0F17] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-gray-100">
              {/* Header Modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-[#0B0F17] shrink-0">
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
                  {printData.tipe_surat === 'sehat' && 'Pratinjau Cetak Surat Keterangan Sehat'}
                  {printData.tipe_surat === 'rujukan' && 'Pratinjau Cetak Surat Rujukan Rumah Sakit'}
                  {printData.tipe_surat === 'sakit' && 'Pratinjau Cetak Surat Keterangan Sakit'}
                </h2>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-gray-400 hover:text-white transition p-1.5 rounded-lg hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Letter Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070A0F] scrollbar-thin scrollbar-thumb-gray-800">
                <div className="bg-white text-gray-900 rounded-2xl shadow-xl p-6 sm:p-8 max-w-xl mx-auto border border-gray-100 font-sans text-xs sm:text-sm">
                  {renderLetterSheet(printData)}
                </div>
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-gray-800/80 bg-[#0B0F17] shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(false)}
                  className="bg-[#151C28] hover:bg-[#1C2638] text-gray-300 border-gray-700 text-xs px-4 py-2 h-9 rounded-lg"
                >
                  Tutup
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 h-9 rounded-lg font-medium flex items-center gap-2 shadow-sm transition"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Sekarang (Print / PDF)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* --- PRINT TEMPLATE (Hidden on screen, visible on print) --- */}
        {printData && (
          <div className="hidden print:block font-sans text-gray-900 p-8 bg-white absolute top-0 left-0 w-full h-full">
            {renderLetterSheet(printData)}
          </div>
        )}
      </>
    )
}
