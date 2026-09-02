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
            <div class="logo">âœ™</div>
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
    staf: 'bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:bg-sky-900/20/80',
    dokter: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:bg-emerald-900/20/80',
    admin: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:bg-amber-900/20/80',
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col justify-center">
      {/* CSS Keyframes for shimmer animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />

      {/* Blurred Dashboard Content Preview */}
      <div className="space-y-6 filter blur-[5px] select-none pointer-events-none opacity-45 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Monitoring Attendance</h1>
            <p className="text-sm text-muted-foreground mt-1">Lacak kehadiran, durasi kerja, dan produktivitas staf serta dokter secara real-time.</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading} className="h-9 gap-1.5">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isLoading || logs.length === 0} className="h-9 gap-1.5 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 hover:bg-sky-50 dark:bg-sky-900/20">
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isLoading || logs.length === 0} className="h-9 gap-1.5 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:bg-emerald-900/20">
              <FileText className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filter Card */}
        <Card className="shadow-xs border-border bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Tanggal Mulai
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 text-foreground bg-muted/50 border-border focus:bg-card"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Tanggal Selesai
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 text-foreground bg-muted/50 border-border focus:bg-card"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Filter Karyawan
                </label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="h-10 text-foreground bg-muted/50 border-border">
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
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  Filter Peran
                </label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-10 text-foreground bg-muted/50 border-border">
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
          <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-sky-500 dark:text-sky-300" />
            Rekapitulasi Kinerja Karyawan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rekapList.map((rekap, i) => (
              <Card key={i} className="shadow-xs border-border bg-card">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground truncate max-w-[180px]">
                        {rekap.name}
                      </CardTitle>
                      <Badge className={`mt-1.5 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${roleColors[rekap.role] || 'bg-muted text-muted-foreground'}`}>
                        {rekap.role}
                      </Badge>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-300 font-bold text-sm">
                      {rekap.totalHadir}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Section A: Tabel Detail Kehadiran Harian */}
        <Card className="shadow-xs border-border bg-card">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-emerald-500 dark:text-emerald-300" />
              Detail Log Kehadiran Harian
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
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
                  {logs.slice(0, 3).map((log) => {
                    const isNotLoggedOut = !log.jam_keluar
                    return (
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground pl-4 sm:pl-6">{formatDateIndo(log.tanggal)}</TableCell>
                        <TableCell><span className="font-semibold text-foreground">{log.users?.nama || 'User'}</span></TableCell>
                        <TableCell><Badge className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full">{log.users?.role || 'staf'}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">-</TableCell>
                        <TableCell className="font-mono text-xs">-</TableCell>
                        <TableCell className="font-medium">-</TableCell>
                        <TableCell className="pr-4 sm:pr-6 text-right font-bold text-foreground">0 Pasien</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
        <div className="bg-card/80 backdrop-blur-md border border-border/60 shadow-2xl rounded-3xl p-8 sm:p-10 text-center max-w-md space-y-6 transform hover:scale-[1.01] transition-all duration-300">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-xl shadow-amber-500/20 animate-pulse">
            <Clock className="h-10 w-10" />
          </div>
          <div className="space-y-3">
            <Badge className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-none px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Under Construction
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Coming Soon!
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fitur **Monitoring Attendance** sedang dalam tahap pengembangan akhir. Modul ini segera hadir dengan pencatatan jam kerja realtime, kalkulasi otomatis durasi kerja, dan rekapitulasi data absensi klinis bulanan.
            </p>
          </div>
          <div className="pt-2">
            <div className="h-2 w-32 bg-muted rounded-full mx-auto overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full animate-[shimmer_1.5s_infinite_ease-in-out]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


