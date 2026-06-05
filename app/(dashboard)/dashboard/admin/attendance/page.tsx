'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Users, ShieldAlert, FileSpreadsheet, FileText, User, RefreshCw, Clock } from 'lucide-react'
import { getAllUsers, getAttendanceLogs } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Helper format tanggal Indonesia
function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

// Helper format durasi menit ke "X jam Y menit"
function formatMinutes(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '-'
  if (minutes < 60) return `${minutes} menit`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) return `${hours} jam`
  return `${hours} jam ${remainingMinutes} menit`
}

interface UserFilterOption {
  id: string
  nama: string
  role: string
}

export default function AttendancePage() {
  const [users, setUsers] = useState<UserFilterOption[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Default filter dates (bulan ini - aman dari pergeseran zona waktu)
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}-01`
  })
  
  const [endDate, setEndDate] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })

  const [selectedUser, setSelectedUser] = useState<string>('ALL')
  const [selectedRole, setSelectedRole] = useState<string>('ALL')

  // Load all users list
  useEffect(() => {
    async function loadUsers() {
      try {
        const u = await getAllUsers()
        setUsers(u)
      } catch (err: any) {
        toast.error('Gagal mengambil daftar pengguna: ' + err.message)
      }
    }
    loadUsers()
  }, [])

  // Fetch attendance logs based on filters
  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const filters: any = {
        startDate,
        endDate
      }
      if (selectedUser !== 'ALL') {
        filters.userId = selectedUser
      }
      if (selectedRole !== 'ALL') {
        filters.role = selectedRole
      }

      const data = await getAttendanceLogs(filters)
      setLogs(data)
    } catch (err: any) {
      toast.error('Gagal memuat log kehadiran: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate, selectedUser, selectedRole])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Hitung aggregates untuk Section B
  const getAggregates = () => {
    const userStats: Record<string, {
      nama: string
      role: string
      totalHadir: number
      totalMinutes: number
      totalPasien: number
      daysWithMinutes: number
    }> = {}

    logs.forEach(log => {
      const userId = log.user_id
      const userName = log.users?.nama || 'Unknown'
      const userRole = log.users?.role || 'staf'

      if (!userStats[userId]) {
        userStats[userId] = {
          nama: userName,
          role: userRole,
          totalHadir: 0,
          totalMinutes: 0,
          totalPasien: 0,
          daysWithMinutes: 0
        }
      }

      userStats[userId].totalHadir += 1
      userStats[userId].totalPasien += (log.jumlah_pasien_ditangani || 0)
      if (log.durasi_menit) {
        userStats[userId].totalMinutes += log.durasi_menit
        userStats[userId].daysWithMinutes += 1
      }
    })

    return Object.values(userStats).map(stat => {
      const avgMinutes = stat.daysWithMinutes > 0 ? Math.round(stat.totalMinutes / stat.daysWithMinutes) : 0
      return {
        userId: stat.nama, // key fallback
        name: stat.nama,
        role: stat.role,
        totalHadir: stat.totalHadir,
        avgDuration: formatMinutes(avgMinutes),
        totalPasien: stat.totalPasien,
        rawAvgMinutes: avgMinutes
      }
    })
  }

  const rekapList = getAggregates()

  // Handler Ekspor CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.warning('Tidak ada data untuk diekspor.')
      return
    }

    const headers = ['Tanggal', 'Nama', 'Role', 'Jam Masuk', 'Jam Keluar', 'Durasi (Menit)', 'Jumlah Pasien Ditangani']
    const rows = logs.map(log => [
      log.tanggal,
      log.users?.nama || '',
      log.users?.role || '',
      log.jam_masuk ? new Date(log.jam_masuk).toISOString() : '',
      log.jam_keluar ? new Date(log.jam_keluar).toISOString() : '',
      log.durasi_menit || '',
      log.jumlah_pasien_ditangani || 0
    ])

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Laporan_Kehadiran_${startDate}_sd_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('File CSV berhasil diunduh!')
  }

  // Handler Ekspor PDF (Elegan & Relevan)
  const handleExportPDF = () => {
    if (logs.length === 0) {
      toast.warning('Tidak ada data untuk dicetak.')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak. Pastikan pop-up diperbolehkan.')
      return
    }

    const startFmt = formatDateIndo(startDate)
    const endFmt = formatDateIndo(endDate)
    const activeRoleLabel = selectedRole === 'ALL' ? 'Semua Peran' : selectedRole.toUpperCase()

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Kehadiran Staf & Dokter - Praktek Dr. Sudiman</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              color: #1e293b;
              padding: 40px;
              background: #fff;
              line-height: 1.5;
            }
            .header-container {
              display: flex;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .logo {
              font-size: 28px;
              margin-right: 15px;
              color: #0284c7;
            }
            .clinic-details {
              flex-grow: 1;
            }
            .clinic-name {
              font-size: 20px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
              margin: 0;
            }
            .clinic-sub {
              font-size: 12px;
              color: #64748b;
              margin: 4px 0 0 0;
            }
            .report-title {
              text-align: center;
              font-size: 16px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta-info {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px;
              font-size: 12px;
              color: #475569;
              margin-bottom: 24px;
            }
            .section-title {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
              margin: 24px 0 12px 0;
              border-left: 3px solid #0284c7;
              padding-left: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              margin-bottom: 24px;
            }
            .summary-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px;
              background-color: #fff;
            }
            .summary-card-name {
              font-size: 13px;
              font-weight: 600;
              color: #0f172a;
            }
            .summary-card-role {
              display: inline-block;
              font-size: 10px;
              font-weight: 600;
              color: #0284c7;
              background-color: #e0f2fe;
              padding: 1px 6px;
              border-radius: 4px;
              margin: 4px 0 8px 0;
              text-transform: uppercase;
            }
            .summary-metrics {
              font-size: 11px;
              color: #475569;
              line-height: 1.6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
              margin-bottom: 30px;
            }
            th {
              background-color: #f1f5f9;
              color: #475569;
              font-weight: 600;
              text-align: left;
              padding: 8px 10px;
              border-bottom: 2px solid #cbd5e1;
            }
            td {
              padding: 8px 10px;
              border-bottom: 1px solid #e2e8f0;
              color: #334155;
            }
            tr:nth-child(even) td {
              background-color: #f8fafc;
            }
            .highlight-red {
              background-color: #fee2e2 !important;
              color: #991b1b;
            }
            .role-badge {
              display: inline-block;
              padding: 1px 5px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .role-staf { background-color: #e0f2fe; color: #0369a1; }
            .role-dokter { background-color: #d1fae5; color: #065f46; }
            .role-admin { background-color: #fef3c7; color: #92400e; }
            .footer-sig {
              margin-top: 40px;
              display: flex;
              justify-content: flex-end;
            }
            .sig-box {
              text-align: center;
              width: 200px;
              font-size: 12px;
            }
            .sig-line {
              margin-top: 50px;
              border-top: 1px solid #475569;
              padding-top: 4px;
              font-weight: 600;
              color: #0f172a;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="logo">✙</div>
            <div class="clinic-details">
              <h1 class="clinic-name">Praktek Dokter Umum Sudiman</h1>
              <p class="clinic-sub">Jl. Solo - Klaten KM 4, Klaten, Jawa Tengah | Telp: (0272) 321-456</p>
            </div>
          </div>

          <div class="report-title">Laporan Kehadiran & Kinerja Staf / Dokter</div>

          <div class="meta-info">
            <div>Periode: <strong>${startFmt} - ${endFmt}</strong></div>
            <div>Peran: <strong>${activeRoleLabel}</strong></div>
            <div>Tanggal Cetak: <strong>${formatDateIndo(new Date().toISOString().split('T')[0])}</strong></div>
          </div>

          ${rekapList.length > 0 ? `
            <div class="section-title">Rekapitulasi Performa Bulanan</div>
            <div class="summary-grid">
              ${rekapList.map(r => `
                <div class="summary-card">
                  <div class="summary-card-name">${r.name}</div>
                  <div class="summary-card-role">${r.role}</div>
                  <div class="summary-metrics">
                    Total Hadir: <strong>${r.totalHadir} Hari</strong><br />
                    Rata-rata Jam Kerja: <strong>${r.avgDuration}</strong><br />
                    Pasien Ditangani: <strong>${r.totalPasien} Orang</strong>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="section-title">Detail Log Kehadiran Harian</div>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama Lengkap</th>
                <th>Peran</th>
                <th>Jam Masuk</th>
                <th>Jam Keluar</th>
                <th>Durasi</th>
                <th>Pasien Ditangani</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => {
                const isNotLoggedOut = !log.jam_keluar;
                const durationStr = isNotLoggedOut ? '-' : formatMinutes(log.durasi_menit);
                const masukStr = log.jam_masuk ? new Date(log.jam_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-';
                const keluarStr = log.jam_keluar ? new Date(log.jam_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Belum Logout';
                return `
                  <tr class="${isNotLoggedOut ? 'highlight-red' : ''}">
                    <td>${formatDateIndo(log.tanggal)}</td>
                    <td><strong>${log.users?.nama || ''}</strong></td>
                    <td><span class="role-badge role-${log.users?.role || 'staf'}">${log.users?.role || 'staf'}</span></td>
                    <td>${masukStr}</td>
                    <td>${keluarStr}</td>
                    <td>${durationStr}</td>
                    <td>${log.jumlah_pasien_ditangani ?? 0} Pasien</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="footer-sig">
            <div class="sig-box">
              <p>Mengetahui,</p>
              <div class="sig-line">Dr. Sudiman</div>
              <p style="font-size: 10px; color: #64748b; margin-top: 1px;">Kepala Klinik</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const roleColors: Record<string, string> = {
    staf: 'bg-sky-100 text-sky-700 hover:bg-sky-100/80',
    dokter: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80',
    admin: 'bg-amber-100 text-amber-700 hover:bg-amber-100/80',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Monitoring Attendance</h1>
          <p className="text-sm text-gray-500 mt-1">Lacak kehadiran, durasi kerja, dan produktivitas staf serta dokter secara real-time.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading} className="h-9 gap-1.5">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isLoading || logs.length === 0} className="h-9 gap-1.5 text-sky-700 border-sky-200 hover:bg-sky-50">
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isLoading || logs.length === 0} className="h-9 gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="shadow-xs border-gray-200 bg-white">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                Tanggal Mulai
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 text-gray-800 bg-gray-50/50 border-gray-200 focus:bg-white"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                Tanggal Selesai
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 text-gray-800 bg-gray-50/50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-gray-400" />
                Filter Karyawan
              </label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="h-10 text-gray-800 bg-gray-50/50 border-gray-200">
                  <SelectValue placeholder="Pilih Karyawan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Karyawan</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nama} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                Filter Peran
              </label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-10 text-gray-800 bg-gray-50/50 border-gray-200">
                  <SelectValue placeholder="Pilih Peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Peran</SelectItem>
                  <SelectItem value="staf">Staf Pendaftaran</SelectItem>
                  <SelectItem value="dokter">Dokter</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section B: Rekap Bulanan Grid Card */}
      <div className="space-y-3">
        <h2 className="text-base font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Users className="h-4.5 w-4.5 text-sky-500" />
          Rekapitulasi Kinerja Karyawan
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(n => (
              <Card key={n} className="animate-pulse bg-gray-50/50 border-gray-200 h-36" />
            ))}
          </div>
        ) : rekapList.length === 0 ? (
          <div className="text-center py-6 border border-gray-150 rounded-xl bg-white text-gray-400 text-sm">
            Tidak ada ringkasan kinerja untuk periode ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rekapList.map((rekap, i) => (
              <Card key={i} className="shadow-xs border-gray-200 bg-white hover:border-gray-300 transition-all duration-150">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[180px]">
                        {rekap.name}
                      </CardTitle>
                      <Badge className={`mt-1.5 text-[10px] font-semibold tracking-wider uppercase border-none px-2 py-0.5 rounded-full ${roleColors[rekap.role] || 'bg-gray-100 text-gray-600'}`}>
                        {rekap.role}
                      </Badge>
                    </div>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 font-bold text-sm">
                      {rekap.totalHadir}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 border-t border-gray-50 bg-gray-50/30 text-xs text-gray-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span>Total Hari Hadir</span>
                    <strong className="text-gray-900">{rekap.totalHadir} Hari</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Rata-rata Kerja</span>
                    <strong className="text-gray-900">{rekap.avgDuration}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Pasien Ditangani</span>
                    <strong className="text-gray-900">{rekap.totalPasien} Pasien</strong>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section A: Tabel Detail Kehadiran Harian */}
      <Card className="shadow-xs border-gray-200 bg-white">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-4.5 w-4.5 text-emerald-500" />
            Detail Log Kehadiran Harian
          </CardTitle>
          <CardDescription className="text-xs">
            Menunjukkan rincian jam masuk, jam keluar, durasi kerja, dan pasien yang ditangani setiap hari.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[120px] font-bold text-gray-700 pl-4 sm:pl-6">Tanggal</TableHead>
                  <TableHead className="font-bold text-gray-700">Nama Lengkap</TableHead>
                  <TableHead className="font-bold text-gray-700 w-[100px]">Peran</TableHead>
                  <TableHead className="font-bold text-gray-700">Jam Masuk</TableHead>
                  <TableHead className="font-bold text-gray-700">Jam Keluar</TableHead>
                  <TableHead className="font-bold text-gray-700">Durasi Kerja</TableHead>
                  <TableHead className="font-bold text-gray-700 pr-4 sm:pr-6 text-right">Pasien Ditangani</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map(n => (
                    <TableRow key={n}>
                      <TableCell className="pl-4 sm:pl-6"><div className="h-4 w-20 bg-gray-100 rounded-sm animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-gray-100 rounded-sm animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-gray-100 rounded-sm animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-12 bg-gray-100 rounded-sm animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-12 bg-gray-100 rounded-sm animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-gray-100 rounded-sm animate-pulse" /></TableCell>
                      <TableCell className="pr-4 sm:pr-6 text-right"><div className="h-4 w-8 bg-gray-100 rounded-sm animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                      Tidak ada rekaman kehadiran yang sesuai dengan filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const isNotLoggedOut = !log.jam_keluar
                    return (
                      <TableRow 
                        key={log.id} 
                        className={`transition-colors duration-700 ${
                          isNotLoggedOut 
                            ? 'bg-rose-50/50 hover:bg-rose-100/40 text-rose-900 border-l-4 border-l-rose-500' 
                            : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <TableCell className="font-medium text-gray-900 pl-4 sm:pl-6">
                          {formatDateIndo(log.tanggal)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 leading-tight">
                              {log.users?.nama || 'Unknown User'}
                            </span>
                            <span className="text-[10px] text-gray-400 truncate max-w-[150px]">
                              ID: {log.user_id.substring(0, 8)}...
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[9px] font-semibold tracking-wider uppercase border-none px-2 py-0.5 rounded-full ${roleColors[log.users?.role || 'staf'] || 'bg-gray-100 text-gray-600'}`}>
                            {log.users?.role || 'staf'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.jam_masuk 
                            ? new Date(log.jam_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.jam_keluar ? (
                            new Date(log.jam_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
                          ) : (
                            <Badge variant="outline" className="text-[9px] border-rose-200 text-rose-700 bg-rose-50 font-bold px-1.5 py-0">
                              <ShieldAlert className="h-3 w-3 mr-1 text-rose-500 animate-bounce" />
                              Belum Keluar
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {isNotLoggedOut ? (
                            <span className="text-xs text-rose-600 italic">Sedang berjalan</span>
                          ) : (
                            formatMinutes(log.durasi_menit)
                          )}
                        </TableCell>
                        <TableCell className="pr-4 sm:pr-6 text-right font-bold text-gray-900">
                          {log.jumlah_pasien_ditangani ?? 0} Pasien
                        </TableCell>
                      </TableRow>
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
