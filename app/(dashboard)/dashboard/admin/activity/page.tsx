'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, User, Activity, ChevronDown, ChevronUp, RefreshCw, Layers, CheckSquare } from 'lucide-react'
import { getAllUsers, getActivityLogs } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { toast } from 'sonner'

// Helper format tanggal & waktu Indonesia
function formatDateTimeIndo(dateTimeStr: string): string {
  if (!dateTimeStr) return '-'
  const date = new Date(dateTimeStr)
  if (isNaN(date.getTime())) return dateTimeStr
  
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} WIB`
}

interface UserFilterOption {
  id: string
  nama: string
  role: string
}

// Master daftar aksi audit trail
const AVAILABLE_ACTIONS = [
  { value: 'TAMBAH_USER', label: 'Tambah User' },
  { value: 'EDIT_USER', label: 'Edit User' },
  { value: 'AKTIF_USER', label: 'Aktifkan User' },
  { value: 'NONAKTIF_USER', label: 'Nonaktifkan User' },
  { value: 'TAMBAH_OBAT', label: 'Tambah Obat' },
  { value: 'EDIT_OBAT', label: 'Edit Obat' },
  { value: 'TAMBAH_STOK', label: 'Tambah Stok' },
  { value: 'AKTIF_OBAT', label: 'Aktifkan Obat' },
  { value: 'NONAKTIF_OBAT', label: 'Nonaktifkan Obat' },
  { value: 'EDIT_PASIEN', label: 'Edit Pasien' },
  { value: 'IMPORT_PASIEN', label: 'Import Pasien' },
  { value: 'DAFTAR_PASIEN', label: 'Pendaftaran Pasien' },
  { value: 'SIMPAN_REKAM_MEDIS', label: 'Simpan Rekam Medis' },
]

export default function ActivityLogPage() {
  const [users, setUsers] = useState<UserFilterOption[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  // Default filter: tanggal 1 bulan ini (aman dari pergeseran zona waktu)
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
  const [selectedActions, setSelectedActions] = useState<string[]>([])

  const limit = 50

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

  // Fetch activity logs based on filters
  const fetchLogs = useCallback(async (pageToFetch = 1) => {
    setIsLoading(true)
    try {
      const filters: any = {
        startDate,
        endDate,
      }
      if (selectedUser !== 'ALL') {
        filters.userId = selectedUser
      }
      if (selectedActions.length > 0) {
        filters.aksi = selectedActions
      }

      const result = await getActivityLogs(filters, pageToFetch, limit)
      setLogs(result.data)
      setTotalCount(result.count)
      setTotalPages(result.totalPages)
      setCurrentPage(result.page)
    } catch (err: any) {
      toast.error('Gagal memuat audit trail: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate, selectedUser, selectedActions])

  useEffect(() => {
    fetchLogs(1)
  }, [startDate, endDate, selectedUser, selectedActions, fetchLogs])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchLogs(page)
    }
  }

  // Toggle expanded details
  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Toggle single action selection
  const handleActionToggle = (actionValue: string) => {
    setSelectedActions(prev =>
      prev.includes(actionValue)
        ? prev.filter(a => a !== actionValue)
        : [...prev, actionValue]
    )
  }

  // Get color badges for Actions
  const getActionBadge = (action: string) => {
    const act = action.toUpperCase()
    
    // Hijau
    if (
      act.startsWith('TAMBAH_') ||
      act.startsWith('AKTIF_') ||
      act.includes('IMPORT_')
    ) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
    
    // Kuning
    if (act.startsWith('EDIT_')) {
      return 'bg-amber-50 text-amber-700 border-amber-250'
    }
    
    // Merah
    if (
      act.startsWith('NONAKTIF_') ||
      act.startsWith('BATAL_') ||
      act.startsWith('HAPUS_')
    ) {
      return 'bg-rose-50 text-rose-700 border-rose-200'
    }
    
    // Biru
    if (
      act.includes('MASUK') ||
      act.includes('KELUAR') ||
      act.startsWith('CETAK_') ||
      act.startsWith('SIMPAN_')
    ) {
      return 'bg-sky-50 text-sky-700 border-sky-200'
    }
    
    // Abu-abu (Lainnya)
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  const roleColors: Record<string, string> = {
    staf: 'bg-sky-100 text-sky-700 border-sky-200',
    dokter: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    admin: 'bg-amber-100 text-amber-700 border-amber-200',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-sans">Activity Log</h1>
          <p className="text-sm text-gray-500 mt-1">Audit trail komprehensif seluruh aksi, perubahan data, dan aktivitas dalam sistem.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button variant="outline" size="sm" onClick={() => fetchLogs(currentPage)} disabled={isLoading} className="h-9 gap-1.5 bg-white shadow-xs">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
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
                Pelaku (User)
              </label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="h-10 text-gray-800 bg-gray-50/50 border-gray-200">
                  <SelectValue placeholder="Pilih User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua User</SelectItem>
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
                <Layers className="h-3.5 w-3.5 text-gray-400" />
                Filter Aksi ({selectedActions.length === 0 ? 'Semua' : selectedActions.length})
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full h-10 justify-between text-left text-gray-800 bg-gray-50/50 border-gray-200 font-normal hover:bg-gray-50">
                    <span className="truncate">
                      {selectedActions.length === 0
                        ? 'Semua Aksi'
                        : `${selectedActions.length} Aksi Terpilih`}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                  <DropdownMenuLabel className="text-xs">Pilih Kategori Aksi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {AVAILABLE_ACTIONS.map(action => (
                    <DropdownMenuCheckboxItem
                      key={action.value}
                      checked={selectedActions.includes(action.value)}
                      onCheckedChange={() => handleActionToggle(action.value)}
                      className="text-xs cursor-pointer"
                    >
                      {action.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {selectedActions.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedActions([])}
                        className="w-full text-[10px] text-center text-rose-600 hover:text-rose-700 h-8 font-semibold"
                      >
                        Hapus Semua Pilihan
                      </Button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Logs Table */}
      <Card className="shadow-xs border-gray-200 bg-white">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-sky-500" />
              Catatan Aktivitas Sistem
            </h3>
            <p className="text-xs text-gray-500">Total data cocok: <strong>{totalCount} log</strong></p>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[45px]"></TableHead>
                  <TableHead className="w-[180px] font-bold text-gray-700">Waktu</TableHead>
                  <TableHead className="font-bold text-gray-700">User Pelaksana</TableHead>
                  <TableHead className="font-bold text-gray-700 w-[140px]">Kategori Aksi</TableHead>
                  <TableHead className="font-bold text-gray-700">Tabel Target</TableHead>
                  <TableHead className="font-bold text-gray-700 pr-4 sm:pr-6">ID Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map(n => (
                    <TableRow key={n}>
                      <TableCell><div className="h-4 w-4 bg-gray-100 rounded-sm animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-32 bg-gray-100 rounded-sm animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-48 bg-gray-100 rounded-sm animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-24 bg-gray-100 rounded-sm animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-16 bg-gray-100 rounded-sm animate-pulse" /></TableCell>
                      <TableCell className="pr-4 sm:pr-6"><div className="h-4 w-28 bg-gray-100 rounded-sm animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                      Tidak ada catatan aktivitas yang sesuai filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const isOpen = !!expandedRows[log.id]
                    return (
                      <React.Fragment key={log.id}>
                        <TableRow className={`hover:bg-gray-50/50 transition-colors duration-150 ${isOpen ? 'bg-sky-50/20' : ''}`}>
                          <TableCell className="pl-4">
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-gray-400 hover:text-gray-900" onClick={() => toggleRow(log.id)}>
                              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-600 whitespace-nowrap">
                            {formatDateTimeIndo(log.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 leading-tight">
                                {log.users?.nama || 'System Trigger'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase mt-0.5">
                                {log.users?.role || 'system'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-bold border rounded-md tracking-wide px-2 py-0.5 ${getActionBadge(log.aksi)}`}>
                              {log.aksi}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-gray-700 font-mono text-xs">
                            {log.target_tabel || '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-500 pr-4 sm:pr-6 whitespace-nowrap">
                            {log.target_id || '-'}
                          </TableCell>
                        </TableRow>
                        
                        {isOpen && (
                          <TableRow className="bg-gray-50/40 hover:bg-gray-50/40">
                            <TableCell colSpan={6} className="p-4 pl-12 border-t border-gray-100">
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                  <CheckSquare className="h-3.5 w-3.5 text-sky-500" />
                                  Rincian Modifikasi / Data Log:
                                </h4>
                                <div className="bg-white border border-gray-150 rounded-lg p-3 sm:p-4 shadow-2xs">
                                  {log.detail && typeof log.detail === 'object' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {Object.entries(log.detail).map(([key, val]: [string, any]) => {
                                        let displayValue = '';
                                        if (val && typeof val === 'object') {
                                          displayValue = JSON.stringify(val);
                                        } else {
                                          displayValue = String(val);
                                        }
                                        return (
                                          <div key={key} className="space-y-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{key.replace('_', ' ')}</span>
                                            <p className="text-xs text-gray-800 bg-gray-50 border border-gray-100 rounded px-2.5 py-1.5 font-mono break-all leading-normal">
                                              {displayValue}
                                            </p>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <pre className="text-xs font-mono text-gray-700 bg-gray-50 p-2.5 rounded overflow-x-auto">
                                      {JSON.stringify(log.detail, null, 2)}
                                    </pre>
                                  )}
                                </div>
                                {log.ip_address && (
                                  <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <span>Alamat IP Pelaksana:</span>
                                    <strong className="font-mono text-gray-600">{log.ip_address}</strong>
                                  </div>
                                )}
                              </div>
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="text-xs text-gray-500 text-center sm:text-left">
                Menampilkan halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Total <strong>{totalCount}</strong> catatan)
              </span>
              <Pagination className="w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="cursor-pointer text-xs"
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1
                    // Tampilkan halaman pertama, terakhir, dan seputar halaman aktif
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={pageNum === currentPage}
                            className="cursor-pointer text-xs font-semibold h-8 w-8"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    } else if (
                      pageNum === 2 ||
                      pageNum === totalPages - 1
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationEllipsis className="h-8 w-8" />
                        </PaginationItem>
                      )
                    }
                    return null
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="cursor-pointer text-xs"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
