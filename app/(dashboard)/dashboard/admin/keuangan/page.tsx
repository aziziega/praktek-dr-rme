'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Coins,
  User,
  TrendingUp,
  DollarSign,
  BarChart3,
  LineChart as LineChartIcon,
  FileSpreadsheet,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Receipt,
  Pill,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  getKeuanganSummary,
  getKeuanganDailyDetail,
  getKeuanganChart,
  getKeuanganRangeDetail,
} from '@/app/actions/admin'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const BULAN_LABELS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatRupiahShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`
  return String(value)
}

function formatDateTimeIndo(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const day = date.getDate()
  const month = BULAN_LABELS[date.getMonth()]
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day} ${month} ${year}, ${hours}:${minutes} WIB`
}

function formatDateToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function formatDateIndoFull(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const dayName = days[date.getDay()]
  const day = date.getDate()
  const month = BULAN_LABELS[date.getMonth()]
  const year = date.getFullYear()
  return `${dayName}, ${day} ${month} ${year}`
}

interface SummaryData {
  totalPendapatan: number
  totalPeriksa: number
  totalObat: number
  jumlahTransaksi: number
}

interface ChartData {
  bulan: number
  label: string
  pendapatan: number
  periksa: number
  obat: number
  transaksi: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 text-xs space-y-1.5">
      <p className="font-bold text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">{formatRupiah(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function KeuanganPage() {
  const now = new Date()
  const [tanggal, setTanggal] = useState(() => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [chartTahun, setChartTahun] = useState(now.getFullYear())
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')

  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [detail, setDetail] = useState<any[]>([])
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingChart, setLoadingChart] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [exporting, setExporting] = useState<'xlsx' | 'pdf' | null>(null)

  // Export modal state
  const [exportModalType, setExportModalType] = useState<'xlsx' | 'pdf' | null>(null)
  const [exportDariTanggal, setExportDariTanggal] = useState<string>('')
  const [exportSampaiTanggal, setExportSampaiTanggal] = useState<string>('')
  const [exportError, setExportError] = useState<string | null>(null)

  const dateInputRef = useRef<HTMLInputElement>(null)

  const fetchSummaryAndDetail = useCallback(async () => {
    setLoadingSummary(true)
    setLoadingDetail(true)
    try {
      const [yearStr, monthStr] = tanggal.split('-')
      const selectBulan = Number(monthStr)
      const selectTahun = Number(yearStr)

      const [s, d] = await Promise.all([
        getKeuanganSummary(selectBulan, selectTahun),
        getKeuanganDailyDetail(tanggal),
      ])
      setSummary(s)
      setDetail(d)
    } catch (err: any) {
      toast.error('Gagal memuat data keuangan: ' + err.message)
    } finally {
      setLoadingSummary(false)
      setLoadingDetail(false)
    }
  }, [tanggal])

  const fetchChart = useCallback(async () => {
    setLoadingChart(true)
    try {
      const c = await getKeuanganChart(chartTahun)
      setChartData(c)
    } catch (err: any) {
      toast.error('Gagal memuat data chart: ' + err.message)
    } finally {
      setLoadingChart(false)
    }
  }, [chartTahun])

  useEffect(() => { fetchSummaryAndDetail() }, [fetchSummaryAndDetail])
  useEffect(() => { fetchChart() }, [fetchChart])

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handlePrevDay = () => {
    const d = new Date(tanggal)
    d.setDate(d.getDate() - 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    setTanggal(`${year}-${month}-${day}`)
  }

  const handleNextDay = () => {
    const d = new Date(tanggal)
    d.setDate(d.getDate() + 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    setTanggal(`${year}-${month}-${day}`)
  }

  const handleGoToToday = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    setTanggal(`${year}-${month}-${day}`)
  }

  const periksaPersen = summary && summary.totalPendapatan > 0
    ? Math.round((summary.totalPeriksa / summary.totalPendapatan) * 100)
    : 0
  const obatPersen = summary && summary.totalPendapatan > 0
    ? Math.round((summary.totalObat / summary.totalPendapatan) * 100)
    : 0

  const [yearStr, monthStr] = tanggal.split('-')
  const selectBulan = Number(monthStr)
  const selectTahun = Number(yearStr)

  // Buka modal export dan set default tanggal (awal bulan ini s.d. hari ini)
  function openExportModal(type: 'xlsx' | 'pdf') {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`
    const firstOfMonth = `${year}-${month}-01`
    setExportDariTanggal(firstOfMonth)
    setExportSampaiTanggal(todayStr)
    setExportError(null)
    setExportModalType(type)
  }

  // Validasi rentang sebelum export
  function validateExportRange(dari: string, sampai: string): string | null {
    if (!dari || !sampai) return 'Harap pilih rentang tanggal terlebih dahulu.'
    if (sampai < dari) return 'Tanggal akhir tidak boleh lebih awal dari tanggal awal.'
    const diffMs = new Date(sampai).getTime() - new Date(dari).getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    if (diffDays > 365) return 'Rentang tanggal maksimal 1 tahun (365 hari).'
    return null
  }

  async function handleExportExcel(dari: string, sampai: string) {
    const err = validateExportRange(dari, sampai)
    if (err) { setExportError(err); return }
    setExportModalType(null)
    setExporting('xlsx')
    try {
      const rangeData = await getKeuanganRangeDetail(dari, sampai)
      const XLSX = await import('xlsx')

      // Sheet ringkasan
      const totalPendapatan = rangeData.reduce((s: number, r: any) => s + Number(r.total_bayar), 0)
      const totalPeriksa = rangeData.reduce((s: number, r: any) => s + Number(r.tarif_periksa), 0)
      const totalObat = rangeData.reduce((s: number, r: any) => s + Number(r.total_obat), 0)
      const summaryRows = [
        { Keterangan: 'Periode', Nilai: `${formatDateToDDMMYYYY(dari)} â€” ${formatDateToDDMMYYYY(sampai)}` },
        { Keterangan: 'Total Pendapatan', Nilai: formatRupiah(totalPendapatan) },
        { Keterangan: 'Jasa Periksa', Nilai: formatRupiah(totalPeriksa) },
        { Keterangan: 'Omset Obat', Nilai: formatRupiah(totalObat) },
        { Keterangan: 'Jumlah Transaksi', Nilai: rangeData.length },
      ]
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
      wsSummary['!cols'] = [{ wch: 22 }, { wch: 30 }]

      // Sheet rincian
      const rows = rangeData.map((item: any) => ({
        Tanggal: formatDateTimeIndo(item.created_at),
        'Nama Pasien': item.kunjungan?.pasien?.nama ?? '-',
        NRM: item.kunjungan?.pasien?.nrm ?? '-',
        Dokter: item.dokter?.nama ?? '-',
        'Tarif Periksa': Number(item.tarif_periksa),
        'Total Obat': Number(item.total_obat),
        'Total Bayar': Number(item.total_bayar),
        'Metode Bayar': item.metode_bayar ?? '-',
        Catatan: item.catatan ?? '-',
      }))
      const wsDetail = XLSX.utils.json_to_sheet(rows)
      wsDetail['!cols'] = [
        { wch: 28 }, { wch: 25 }, { wch: 10 }, { wch: 20 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 14 }, { wch: 20 },
      ]

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Rincian Transaksi')
      XLSX.writeFile(wb, `Laporan_Keuangan_${dari}_${sampai}.xlsx`)
      toast.success('File Excel berhasil di-export')
    } catch (err: any) {
      toast.error('Gagal export Excel: ' + err.message)
    } finally {
      setExporting(null)
    }
  }

  async function handleExportPDF(dari: string, sampai: string) {
    const err = validateExportRange(dari, sampai)
    if (err) { setExportError(err); return }
    setExportModalType(null)
    setExporting('pdf')
    try {
      const rangeData = await getKeuanganRangeDetail(dari, sampai)
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.default
      const autoTableModule = await import('jspdf-autotable')
      const autoTable = autoTableModule.default

      const totalPendapatan = rangeData.reduce((s: number, r: any) => s + Number(r.total_bayar), 0)
      const totalPeriksa = rangeData.reduce((s: number, r: any) => s + Number(r.tarif_periksa), 0)
      const totalObat = rangeData.reduce((s: number, r: any) => s + Number(r.total_obat), 0)

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      // Kop laporan
      doc.setFontSize(16)
      doc.text('Laporan Pendapatan Keuangan', 14, 15)
      doc.setFontSize(10)
      doc.text(`Periode: ${formatDateToDDMMYYYY(dari)} s.d. ${formatDateToDDMMYYYY(sampai)}`, 14, 22)
      doc.text('Praktek Dr. Umum Sudiman â€” Gupolo, Prambanan, Klaten', 14, 27)

      // Tabel ringkasan
      autoTable(doc, {
        startY: 32,
        head: [['Keterangan', 'Nilai']],
        body: [
          ['Total Pendapatan', formatRupiah(totalPendapatan)],
          ['Jasa Periksa', formatRupiah(totalPeriksa)],
          ['Omset Obat', formatRupiah(totalObat)],
          ['Jumlah Transaksi', String(rangeData.length)],
        ],
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
        margin: { left: 14, right: 14 },
        tableWidth: 120,
      })

      // Tabel rincian transaksi
      const tableData = rangeData.map((item: any) => [
        formatDateTimeIndo(item.created_at),
        item.kunjungan?.pasien?.nama ?? '-',
        item.dokter?.nama ?? '-',
        formatRupiah(Number(item.tarif_periksa)),
        formatRupiah(Number(item.total_obat)),
        formatRupiah(Number(item.total_bayar)),
        item.metode_bayar ?? '-',
      ])

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [['Tanggal', 'Pasien', 'Dokter', 'Tarif Periksa', 'Total Obat', 'Total Bayar', 'Metode']],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      })

      doc.save(`Laporan_Keuangan_${dari}_${sampai}.pdf`)
      toast.success('File PDF berhasil di-export')
    } catch (err: any) {
      toast.error('Gagal export PDF: ' + err.message)
    } finally {
      setExporting(null)
    }
  }

  const tahunOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Laporan Keuangan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rekap pendapatan, grafik tren, dan rincian transaksi klinik.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openExportModal('xlsx')}
            disabled={exporting !== null}
            className="gap-1.5 bg-card shadow-xs"
          >
            {exporting === 'xlsx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />}
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openExportModal('pdf')}
            disabled={exporting !== null}
            className="gap-1.5 bg-card shadow-xs"
          >
            {exporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-rose-600" />}
            Export PDF
          </Button>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-xs border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card className="shadow-xs border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Total Pendapatan</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center"><DollarSign className="h-4 w-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-foreground">{formatRupiah(summary?.totalPendapatan ?? 0)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">{summary?.jumlahTransaksi ?? 0} transaksi lunas</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Jasa Periksa</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-300 flex items-center justify-center"><User className="h-4 w-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-foreground">{formatRupiah(summary?.totalPeriksa ?? 0)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">{periksaPersen}% dari total pendapatan</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Omset Obat</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><TrendingUp className="h-4 w-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-foreground">{formatRupiah(summary?.totalObat ?? 0)}</div>
                <p className="text-[10px] text-muted-foreground mt-1">{obatPersen}% dari total pendapatan</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">Jumlah Transaksi</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 flex items-center justify-center"><Receipt className="h-4 w-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-foreground">{summary?.jumlahTransaksi ?? 0}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Bulan {BULAN_LABELS[selectBulan - 1]} {selectTahun}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Chart Section */}
      <Card className="shadow-xs border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />
              <CardTitle className="text-sm font-bold text-foreground">
                Tren Pendapatan Tahun {chartTahun}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(chartTahun)} onValueChange={(v) => setChartTahun(Number(v))}>
                <SelectTrigger className="w-[90px] h-8 text-xs bg-card shadow-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tahunOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    chartType === 'bar'
                      ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
                      : 'bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Bar
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border-l border-border transition-colors ${
                    chartType === 'line'
                      ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
                      : 'bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <LineChartIcon className="h-3.5 w-3.5" />
                  Line
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingChart ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={formatRupiahShort} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="periksa" name="Jasa Periksa" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="obat" name="Omset Obat" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={formatRupiahShort} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="pendapatan" name="Total Pendapatan" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
                    <Line type="monotone" dataKey="periksa" name="Jasa Periksa" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3, fill: '#0ea5e9' }} />
                    <Line type="monotone" dataKey="obat" name="Omset Obat" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card className="shadow-xs border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-sky-500 dark:text-sky-300" />
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Rincian Transaksi
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{detail.length} transaksi tercatat</p>
              </div>
            </div>

            {/* Filter Tanggal (Daily Navigation Control - Light Theme) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Left Arrow */}
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevDay}
                className="h-8 w-8 bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Hari Ini Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToToday}
                className="h-8 px-3 bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg font-bold text-xs"
              >
                Hari Ini
              </Button>

              {/* Right Arrow */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextDay}
                className="h-8 w-8 bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Date Picker Pill */}
              <div className="relative">
                <input
                  type="date"
                  ref={dateInputRef}
                  value={tanggal} // YYYY-MM-DD
                  onChange={(e) => {
                    if (e.target.value) {
                      setTanggal(e.target.value)
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-8 px-3 bg-card border-border text-gray-700 rounded-full font-bold flex items-center gap-2 hover:bg-muted shadow-2xs"
                >
                  <Calendar className="h-3.5 w-3.5 text-red-500 dark:text-red-300 shrink-0 fill-red-500/10" />
                  <span className="font-mono text-xs tracking-wide">{formatDateToDDMMYYYY(tanggal)}</span>
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[40px]" />
                  <TableHead className="font-bold text-gray-700 w-[170px]">Tanggal</TableHead>
                  <TableHead className="font-bold text-gray-700">Pasien</TableHead>
                  <TableHead className="font-bold text-gray-700">Dokter</TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">Periksa</TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">Obat</TableHead>
                  <TableHead className="font-bold text-gray-700 text-right">Total</TableHead>
                  <TableHead className="font-bold text-gray-700 w-[90px]">Metode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingDetail ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    </TableRow>
                  ))
                ) : detail.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                      Tidak ada transaksi pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  detail.map((item: any) => {
                    const isOpen = !!expandedRows[item.id]
                    const resep = item.kunjungan?.resep_obat ?? []
                    return (
                      <React.Fragment key={item.id}>
                        <TableRow className={`hover:bg-muted/50 transition-colors ${isOpen ? 'bg-sky-50 dark:bg-sky-900/20/20' : ''}`}>
                          <TableCell className="pl-4">
                            {resep.length > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                                onClick={() => toggleRow(item.id)}
                              >
                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {formatDateTimeIndo(item.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground text-sm">{item.kunjungan?.pasien?.nama ?? '-'}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">#{item.kunjungan?.pasien?.nrm ?? '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">{item.dokter?.nama ?? '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-700">{formatRupiah(Number(item.tarif_periksa))}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-700">{formatRupiah(Number(item.total_obat))}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-bold text-foreground">{formatRupiah(Number(item.total_bayar))}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase">
                              {item.metode_bayar}
                            </Badge>
                          </TableCell>
                        </TableRow>

                        {isOpen && resep.length > 0 && (
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={8} className="p-4 pl-12 border-t border-border">
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                  <Pill className="h-3.5 w-3.5 text-violet-500" />
                                  Detail Resep Obat ({resep.length} item)
                                </h4>
                                <div className="bg-card border border-border rounded-lg overflow-hidden shadow-2xs">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="bg-muted text-muted-foreground font-semibold">
                                        <th className="text-left px-3 py-2">Nama Obat</th>
                                        <th className="text-left px-3 py-2">Dosis</th>
                                        <th className="text-right px-3 py-2">Jumlah</th>
                                        <th className="text-right px-3 py-2">Harga Satuan</th>
                                        <th className="text-right px-3 py-2">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {resep.map((r: any, idx: number) => (
                                        <tr key={idx} className="border-t border-gray-50">
                                          <td className="px-3 py-2 font-medium text-foreground">{r.nama_obat}</td>
                                          <td className="px-3 py-2 text-muted-foreground">{r.dosis}</td>
                                          <td className="px-3 py-2 text-right font-mono text-gray-700">{r.jumlah}</td>
                                          <td className="px-3 py-2 text-right font-mono text-gray-700">{formatRupiah(Number(r.harga_satuan))}</td>
                                          <td className="px-3 py-2 text-right font-mono font-semibold text-foreground">{formatRupiah(Number(r.subtotal))}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              {item.catatan && (
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                  Catatan: <span className="text-muted-foreground">{item.catatan}</span>
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* â”€â”€ Export Modal â”€â”€ */}
      <Dialog open={exportModalType !== null} onOpenChange={(open) => { if (!open) setExportModalType(null) }}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              {exportModalType === 'xlsx'
                ? <><FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-300" /> Export Excel (.xlsx)</>
                : <><FileText className="h-5 w-5 text-rose-600" /> Export PDF</>
              }
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Pilih rentang tanggal laporan keuangan yang ingin di-export.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Date Range Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="export-dari" className="text-xs font-semibold text-gray-700">Dari Tanggal</Label>
                <input
                  id="export-dari"
                  type="date"
                  value={exportDariTanggal}
                  onChange={(e) => {
                    setExportDariTanggal(e.target.value)
                    setExportError(null)
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 dark:border-sky-800 transition"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="export-sampai" className="text-xs font-semibold text-gray-700">Sampai Tanggal</Label>
                <input
                  id="export-sampai"
                  type="date"
                  value={exportSampaiTanggal}
                  onChange={(e) => {
                    setExportSampaiTanggal(e.target.value)
                    setExportError(null)
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400 dark:border-sky-800 transition"
                />
              </div>
            </div>

            {/* Error message */}
            {exportError && (
              <p className="text-xs text-red-500 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">
                âš  {exportError}
              </p>
            )}

            {/* Info note */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {exportModalType === 'xlsx'
                ? 'File Excel akan memiliki 2 sheet: "Ringkasan" berisi total, dan "Rincian Transaksi" berisi data per-baris.'
                : 'File PDF akan memuat ringkasan keuangan dan tabel rincian transaksi yang rapi untuk dicetak.'
              }
            </p>
          </div>

          <DialogFooter className="gap-2 flex-row justify-end">
            <Button
              variant="outline"
              onClick={() => setExportModalType(null)}
              className="border-border text-muted-foreground hover:bg-muted"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (exportModalType === 'xlsx') handleExportExcel(exportDariTanggal, exportSampaiTanggal)
                else if (exportModalType === 'pdf') handleExportPDF(exportDariTanggal, exportSampaiTanggal)
              }}
              disabled={exporting !== null}
              className={exportModalType === 'xlsx'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5'
                : 'bg-rose-600 hover:bg-rose-700 text-white gap-1.5'
              }
            >
              {exporting !== null
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>
                : exportModalType === 'xlsx'
                  ? <><FileSpreadsheet className="h-4 w-4" /> Download Excel (.xlsx)</>
                  : <><FileText className="h-4 w-4" /> Download PDF</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


