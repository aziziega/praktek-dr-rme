'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  getKeuanganChart,
  getKeuanganDetail,
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
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs space-y-1.5">
      <p className="font-bold text-gray-800">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-semibold text-gray-800">{formatRupiah(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function KeuanganPage() {
  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())
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

  const fetchSummaryAndDetail = useCallback(async () => {
    setLoadingSummary(true)
    setLoadingDetail(true)
    try {
      const [s, d] = await Promise.all([
        getKeuanganSummary(bulan, tahun),
        getKeuanganDetail(bulan, tahun),
      ])
      setSummary(s)
      setDetail(d)
    } catch (err: any) {
      toast.error('Gagal memuat data keuangan: ' + err.message)
    } finally {
      setLoadingSummary(false)
      setLoadingDetail(false)
    }
  }, [bulan, tahun])

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

  const periksaPersen = summary && summary.totalPendapatan > 0
    ? Math.round((summary.totalPeriksa / summary.totalPendapatan) * 100)
    : 0
  const obatPersen = summary && summary.totalPendapatan > 0
    ? Math.round((summary.totalObat / summary.totalPendapatan) * 100)
    : 0

  async function handleExportExcel() {
    setExporting('xlsx')
    try {
      const XLSX = await import('xlsx')
      const rows = detail.map((item: any) => ({
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

      const ws = XLSX.utils.json_to_sheet(rows)

      const colWidths = [
        { wch: 28 }, { wch: 25 }, { wch: 10 }, { wch: 20 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 14 }, { wch: 20 },
      ]
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, `Keuangan ${BULAN_LABELS[bulan - 1]} ${tahun}`)
      XLSX.writeFile(wb, `Laporan_Keuangan_${BULAN_LABELS[bulan - 1]}_${tahun}.xlsx`)
      toast.success('File Excel berhasil di-export')
    } catch (err: any) {
      toast.error('Gagal export Excel: ' + err.message)
    } finally {
      setExporting(null)
    }
  }

  async function handleExportPDF() {
    setExporting('pdf')
    try {
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.default
      const autoTableModule = await import('jspdf-autotable')
      const autoTable = autoTableModule.default

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

      doc.setFontSize(16)
      doc.text('Laporan Pendapatan Keuangan', 14, 15)
      doc.setFontSize(10)
      doc.text(`Periode: ${BULAN_LABELS[bulan - 1]} ${tahun}`, 14, 22)
      doc.text(`Praktek Dr. Umum Sudiman — Gupolo, Prambanan, Klaten`, 14, 27)

      doc.setFontSize(9)
      doc.text(`Total Pendapatan: ${formatRupiah(summary?.totalPendapatan ?? 0)}`, 14, 35)
      doc.text(`Jasa Periksa: ${formatRupiah(summary?.totalPeriksa ?? 0)}`, 14, 40)
      doc.text(`Omset Obat: ${formatRupiah(summary?.totalObat ?? 0)}`, 100, 35)
      doc.text(`Jumlah Transaksi: ${summary?.jumlahTransaksi ?? 0}`, 100, 40)

      const tableData = detail.map((item: any) => [
        formatDateTimeIndo(item.created_at),
        item.kunjungan?.pasien?.nama ?? '-',
        item.dokter?.nama ?? '-',
        formatRupiah(Number(item.tarif_periksa)),
        formatRupiah(Number(item.total_obat)),
        formatRupiah(Number(item.total_bayar)),
        item.metode_bayar ?? '-',
      ])

      autoTable(doc, {
        startY: 46,
        head: [['Tanggal', 'Pasien', 'Dokter', 'Tarif Periksa', 'Total Obat', 'Total Bayar', 'Metode']],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [14, 165, 233], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      })

      doc.save(`Laporan_Keuangan_${BULAN_LABELS[bulan - 1]}_${tahun}.pdf`)
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Laporan Keuangan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Rekap pendapatan, grafik tren, dan rincian transaksi klinik.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={exporting !== null || loadingDetail}
            className="gap-1.5 bg-white shadow-xs"
          >
            {exporting === 'xlsx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exporting !== null || loadingDetail}
            className="gap-1.5 bg-white shadow-xs"
          >
            {exporting === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-rose-600" />}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filter Bulan & Tahun */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={String(bulan)} onValueChange={(v) => setBulan(Number(v))}>
          <SelectTrigger className="w-[160px] bg-white shadow-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BULAN_LABELS.map((label, i) => (
              <SelectItem key={i} value={String(i + 1)}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(tahun)} onValueChange={(v) => setTahun(Number(v))}>
          <SelectTrigger className="w-[100px] bg-white shadow-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tahunOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingSummary ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-xs border-gray-200 bg-white">
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
            <Card className="shadow-xs border-gray-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-600 uppercase">Total Pendapatan</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign className="h-4 w-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-gray-900">{formatRupiah(summary?.totalPendapatan ?? 0)}</div>
                <p className="text-[10px] text-gray-400 mt-1">{summary?.jumlahTransaksi ?? 0} transaksi lunas</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-gray-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-600 uppercase">Jasa Periksa</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center"><User className="h-4 w-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-gray-900">{formatRupiah(summary?.totalPeriksa ?? 0)}</div>
                <p className="text-[10px] text-gray-400 mt-1">{periksaPersen}% dari total pendapatan</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-gray-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-600 uppercase">Omset Obat</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center"><TrendingUp className="h-4 w-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-gray-900">{formatRupiah(summary?.totalObat ?? 0)}</div>
                <p className="text-[10px] text-gray-400 mt-1">{obatPersen}% dari total pendapatan</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-gray-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-gray-600 uppercase">Jumlah Transaksi</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Receipt className="h-4 w-4" /></div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-gray-900">{summary?.jumlahTransaksi ?? 0}</div>
                <p className="text-[10px] text-gray-400 mt-1">Bulan {BULAN_LABELS[bulan - 1]} {tahun}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Chart Section */}
      <Card className="shadow-xs border-gray-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-sm font-bold text-gray-900">
                Tren Pendapatan Tahun {chartTahun}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(chartTahun)} onValueChange={(v) => setChartTahun(Number(v))}>
                <SelectTrigger className="w-[90px] h-8 text-xs bg-white shadow-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tahunOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    chartType === 'bar'
                      ? 'bg-sky-50 text-sky-700'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Bar
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border-l border-gray-200 transition-colors ${
                    chartType === 'line'
                      ? 'bg-sky-50 text-sky-700'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
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
      <Card className="shadow-xs border-gray-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-sky-500" />
              <div>
                <CardTitle className="text-sm font-bold text-gray-900">
                  Rincian Transaksi — {BULAN_LABELS[bulan - 1]} {tahun}
                </CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">{detail.length} transaksi tercatat</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
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
                    <TableCell colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                      Tidak ada transaksi pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  detail.map((item: any) => {
                    const isOpen = !!expandedRows[item.id]
                    const resep = item.kunjungan?.resep_obat ?? []
                    return (
                      <React.Fragment key={item.id}>
                        <TableRow className={`hover:bg-gray-50/50 transition-colors ${isOpen ? 'bg-sky-50/20' : ''}`}>
                          <TableCell className="pl-4">
                            {resep.length > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md text-gray-400 hover:text-gray-900"
                                onClick={() => toggleRow(item.id)}
                              >
                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-600 whitespace-nowrap">
                            {formatDateTimeIndo(item.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 text-sm">{item.kunjungan?.pasien?.nama ?? '-'}</span>
                              <span className="text-[10px] text-gray-400 font-mono">#{item.kunjungan?.pasien?.nrm ?? '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">{item.dokter?.nama ?? '-'}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-700">{formatRupiah(Number(item.tarif_periksa))}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-gray-700">{formatRupiah(Number(item.total_obat))}</TableCell>
                          <TableCell className="text-right font-mono text-sm font-bold text-gray-900">{formatRupiah(Number(item.total_bayar))}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase">
                              {item.metode_bayar}
                            </Badge>
                          </TableCell>
                        </TableRow>

                        {isOpen && resep.length > 0 && (
                          <TableRow className="bg-gray-50/40 hover:bg-gray-50/40">
                            <TableCell colSpan={8} className="p-4 pl-12 border-t border-gray-100">
                              <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                  <Pill className="h-3.5 w-3.5 text-violet-500" />
                                  Detail Resep Obat ({resep.length} item)
                                </h4>
                                <div className="bg-white border border-gray-150 rounded-lg overflow-hidden shadow-2xs">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="bg-gray-50 text-gray-500 font-semibold">
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
                                          <td className="px-3 py-2 font-medium text-gray-800">{r.nama_obat}</td>
                                          <td className="px-3 py-2 text-gray-600">{r.dosis}</td>
                                          <td className="px-3 py-2 text-right font-mono text-gray-700">{r.jumlah}</td>
                                          <td className="px-3 py-2 text-right font-mono text-gray-700">{formatRupiah(Number(r.harga_satuan))}</td>
                                          <td className="px-3 py-2 text-right font-mono font-semibold text-gray-900">{formatRupiah(Number(r.subtotal))}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              {item.catatan && (
                                <p className="mt-2 text-[11px] text-gray-400">
                                  Catatan: <span className="text-gray-600">{item.catatan}</span>
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
    </div>
  )
}
