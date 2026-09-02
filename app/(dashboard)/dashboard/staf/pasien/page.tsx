'use client'

import { useState, useEffect } from 'react'
import { getStafPasien, getRiwayatKunjunganPasienStaf, updatePasienStaf, importPasienStaf } from '@/app/actions/staf'
import type { PasienRow, KunjunganRow, RekamMedisRow } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Pencil, Search, AlertTriangle, Loader2, Activity, Thermometer, FilePlus, Eye, PenTool } from 'lucide-react'
import { useNetworkStatus } from '@/components/providers/NetworkStatusProvider'

// Extended interface for visit history
interface KunjunganHistory extends KunjunganRow {
  rekam_medis: any
  dokter: { nama: string } | null
  resep_obat?: { nama_obat: string; dosis: string; jumlah: number }[]
}

export default function StafPasienPage() {
  const isOnline = useNetworkStatus()
  const [pasien, setPasien] = useState<PasienRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Pagination states for Patient List (>20 data)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const totalPages = Math.ceil(pasien.length / itemsPerPage)
  const paginatedPasien = pasien.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Drawer/Sheet State
  const [selectedPasien, setSelectedPasien] = useState<PasienRow | null>(null)
  const [riwayat, setRiwayat] = useState<KunjunganHistory[]>([])
  const [loadingRiwayat, setLoadingRiwayat] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Pagination states for past visit history list
  const [historyPage, setHistoryPage] = useState(1)
  const historyItemsPerPage = 5
  const totalHistoryPages = Math.ceil(riwayat.length / historyItemsPerPage)
  const paginatedRiwayat = riwayat.slice((historyPage - 1) * historyItemsPerPage, historyPage * historyItemsPerPage)

  // Helper: Format date with day, date, month, year, and time (e.g., Selasa, 04/08/26 · 14:30 WIB)
  function formatIndonesianDateTime(dateStr: string | null | Date): string {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      const dayName = days[date.getDay()]
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = String(date.getFullYear()).slice(-2)

      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')

      return `${dayName}, ${day}/${month}/${year} · ${hours}:${minutes} WIB`
    } catch {
      return String(dateStr)
    }
  }

  // Dialog Edit State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editForm, setEditForm] = useState<Partial<PasienRow>>({})

  // Modal preview Canvas (Tulisan Tangan) state
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null)

  // Dialog Import State
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importForm, setImportForm] = useState({
    nrm: '',
    nama: '',
    tanggal_lahir: '',
    tempat_lahir: '',
    jenis_kelamin: '',
    alamat: '',
    no_hp: '',
    alergi_obat: ''
  })

  const [debugError, setDebugError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchPasien()
    setCurrentPage(1) // Reset pagination to page 1 when search changes
  }, [debouncedSearch])

  async function fetchPasien() {
    setLoading(true)
    setDebugError(null)
    try {
      const data = await getStafPasien(debouncedSearch)
      setPasien(data as PasienRow[])
    } catch (err: any) {
      console.error('[StafPasien] fetch error:', err)
      const msg = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : 'No stack trace'
      setDebugError(`Server Action Exception (Pasien): ${msg}\\nStack: ${stack}`)
      toast.error('Terjadi kesalahan memuat data pasien: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRiwayatKunjungan(pasienId: string) {
    setLoadingRiwayat(true)
    try {
      const data = await getRiwayatKunjunganPasienStaf(pasienId)
      setRiwayat(data as any)
    } catch (err: any) {
      console.error('[StafPasien] fetchRiwayat error:', err)
      const msg = err instanceof Error ? err.message : String(err)
      toast.error('Gagal mengambil riwayat kunjungan: ' + msg)
    } finally {
      setLoadingRiwayat(false)
    }
  }

  const handleRowClick = (p: PasienRow) => {
    setSelectedPasien(p)
    setIsSheetOpen(true)
    setHistoryPage(1)
    fetchRiwayatKunjungan(p.id)
  }

  const handleEditClick = (e: React.MouseEvent, p: PasienRow) => {
    e.stopPropagation() // Prevent opening the sheet
    setEditForm(p)
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editForm.id || !editForm.nama) return

    setIsSubmitting(true)
    try {
      await updatePasienStaf(editForm.id, {
        nama: editForm.nama,
        tanggal_lahir: editForm.tanggal_lahir || undefined,
        tempat_lahir: editForm.tempat_lahir || undefined,
        jenis_kelamin: editForm.jenis_kelamin || undefined,
        alamat: editForm.alamat || undefined,
        no_hp: editForm.no_hp || undefined,
        alergi_obat: editForm.alergi_obat || undefined
      })
      toast.success('Data pasien berhasil diperbarui')
      setIsEditOpen(false)
      fetchPasien()
      
      // Update selectedPasien if sheet is open
      if (selectedPasien?.id === editForm.id) {
        setSelectedPasien(editForm as PasienRow)
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedNrm = parseInt(importForm.nrm, 10)
    if (isNaN(parsedNrm)) {
      toast.error('NRM harus berupa angka')
      return
    }

    setIsSubmitting(true)
    try {
      await importPasienStaf({
        ...importForm,
        nrm: parsedNrm,
        tanggal_lahir: importForm.tanggal_lahir || undefined,
        tempat_lahir: importForm.tempat_lahir || undefined,
        jenis_kelamin: importForm.jenis_kelamin || undefined,
        alamat: importForm.alamat || undefined,
        no_hp: importForm.no_hp || undefined,
        alergi_obat: importForm.alergi_obat || undefined
      })
      toast.success('Pasien lama berhasil di-import')
      setIsImportOpen(false)
      setImportForm({
        nrm: '',
        nama: '',
        tanggal_lahir: '',
        tempat_lahir: '',
        jenis_kelamin: '',
        alamat: '',
        no_hp: '',
        alergi_obat: ''
      })
      fetchPasien()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Pasien</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cari, edit, dan lihat riwayat pasien yang terdaftar.
          </p>
        </div>

        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <FilePlus className="h-4 w-4" />
              Input Pasien Lama
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Input Pasien Lama</DialogTitle>
              <DialogDescription>
                Masukkan data pasien dari sistem rekam medis sebelumnya secara manual beserta NRM lamanya. NRM harus berupa angka.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleImportSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="import-nrm">NRM Lama (Angka)</Label>
                  <Input
                    id="import-nrm"
                    required
                    type="number"
                    value={importForm.nrm}
                    onChange={(e) => setImportForm({ ...importForm, nrm: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="import-nama">Nama Lengkap</Label>
                  <Input
                    id="import-nama"
                    required
                    value={importForm.nama}
                    onChange={(e) => setImportForm({ ...importForm, nama: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="import-tanggal-lahir">Tanggal Lahir</Label>
                  <Input
                    id="import-tanggal-lahir"
                    type="date"
                    value={importForm.tanggal_lahir}
                    onChange={(e) => setImportForm({ ...importForm, tanggal_lahir: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="import-jenis-kelamin">Jenis Kelamin</Label>
                  <Select
                    value={importForm.jenis_kelamin}
                    onValueChange={(val) => setImportForm({ ...importForm, jenis_kelamin: val as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-alamat">Alamat</Label>
                <Textarea
                  id="import-alamat"
                  placeholder="Alamat lengkap"
                  value={importForm.alamat}
                  onChange={(e) => setImportForm({ ...importForm, alamat: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="import-hp">No HP</Label>
                  <Input
                    id="import-hp"
                    placeholder="Kosongkan jika tidak ada"
                    value={importForm.no_hp}
                    onChange={(e) => setImportForm({ ...importForm, no_hp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="import-alergi">Alergi Obat</Label>
                  <Input
                    id="import-alergi"
                    placeholder="Kosongkan jika tidak ada"
                    value={importForm.alergi_obat}
                    onChange={(e) => setImportForm({ ...importForm, alergi_obat: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || !isOnline}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pasien'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {debugError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-800 text-red-900 dark:text-red-300 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap shadow-md mb-4">
          <p className="font-bold text-sm mb-2 flex items-center gap-2 text-red-700 dark:text-red-300">
            <span className="animate-ping h-2.5 w-2.5 rounded-full bg-red-600"></span>
            Diagnostik Kesalahan (Gagal Load Data):
          </p>
          {debugError}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nama atau NRM..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">NRM</TableHead>
              <TableHead>Nama Pasien</TableHead>
              <TableHead>Tgl Lahir</TableHead>
              <TableHead>No HP</TableHead>
              <TableHead>Alergi Obat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : pasien.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Tidak ada data pasien yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              paginatedPasien.map((p) => (
                <TableRow 
                  key={p.id} 
                  className="cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleRowClick(p)}
                >
                  <TableCell className="font-medium text-blue-600 dark:text-blue-300">
                    {p.nrm}
                  </TableCell>
                  <TableCell className="font-semibold">{p.nama}</TableCell>
                  <TableCell>
                    {p.tanggal_lahir ? new Date(p.tanggal_lahir).toLocaleDateString('id-ID') : '-'}
                  </TableCell>
                  <TableCell>{p.no_hp || '-'}</TableCell>
                  <TableCell>
                    {p.alergi_obat ? (
                      <Badge variant="destructive" className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 hover:bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                        {p.alergi_obat}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Tidak ada</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleEditClick(e, p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Kontrol Navigasi Halaman Pasien */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-6 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="text-muted-foreground hover:text-sky-600 dark:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            &lt; &nbsp; Sebelumnya
          </Button>
          
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            const isActive = pageNum === currentPage;
            return (
              <Button
                key={pageNum}
                variant={isActive ? 'outline' : 'ghost'}
                className={`h-9 w-9 rounded-xl font-bold transition-all ${
                  isActive
                    ? 'border border-border bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="text-muted-foreground hover:text-sky-600 dark:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            Selanjutnya &nbsp; &gt;
          </Button>
        </div>
      )}

      {/* Dialog Detail & Riwayat Pasien */}
      <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <DialogContent className="w-full sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-bold text-foreground">Berkas Rekam Medis Elektronik</DialogTitle>
            <DialogDescription>
              Lembaran riwayat lengkap rekam medis dan data kunjungan pasien.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
            {selectedPasien && (
              <div className="space-y-6">
                {/* Lebaran Kertas Ivory Rekam Medis Pasien */}
                <div className="bg-[#FAF9F6] border-2 border-[#EADFC9] shadow-xl rounded-xl p-6 md:p-8 space-y-6 relative overflow-hidden">
                  
                  {/* Kop Lembar Rekam Medis */}
                  <div className="text-center space-y-1">
                    <h2 className="text-2xl font-extrabold tracking-widest text-gray-900 border-b border-gray-200 pb-1 inline-block">
                      REKAM MEDIS PASIEN
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      Alamat : Gupolo Rt. 04 Rw. 02, Cucukan, Prambanan, Klaten 57454
                    </p>
                    <div className="border-t-4 border-double border-gray-800 my-3" />
                  </div>

                  {/* Metadata Pasien dengan Garis Dotted */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs md:text-sm text-gray-900">
                    {/* Kolom Kiri */}
                    <div className="space-y-3">
                      <div className="flex items-end gap-2">
                        <span className="font-semibold text-gray-500 w-28 shrink-0 pb-0.5">Nama Pasien</span>
                        <span className="text-gray-500">:</span>
                        <span className="grow border-b border-dotted border-gray-500 font-handwritten text-blue-900 px-2 font-bold text-lg select-all">
                          {selectedPasien.nama}
                        </span>
                      </div>

                      <div className="flex items-end gap-2">
                        <span className="font-semibold text-gray-500 w-28 shrink-0 pb-0.5">Tempat/Tgl Lahir</span>
                        <span className="text-gray-500">:</span>
                        <span className="grow border-b border-dotted border-gray-500 font-handwritten text-blue-900 px-2 select-all">
                          {selectedPasien.tempat_lahir ?? 'Sragen'}, {selectedPasien.tanggal_lahir ? new Date(selectedPasien.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </span>
                      </div>

                      <div className="flex items-end gap-2">
                        <span className="font-semibold text-gray-500 w-28 shrink-0 pb-0.5">Alamat</span>
                        <span className="text-gray-500">:</span>
                        <span className="grow border-b border-dotted border-gray-500 font-handwritten text-blue-900 px-2 select-all leading-snug">
                          {selectedPasien.alamat ?? '-'}
                        </span>
                      </div>
                    </div>

                    {/* Kolom Kanan */}
                    <div className="space-y-3">
                      <div className="flex items-end gap-2">
                        <span className="font-semibold text-gray-500 w-24 shrink-0 pb-0.5">No. RM</span>
                        <span className="text-gray-500">:</span>
                        <span className="grow border-b border-dotted border-gray-500 font-handwritten text-blue-900 px-2 font-bold text-lg select-all">
                          {selectedPasien.nrm}
                        </span>
                      </div>

                      <div className="flex items-end gap-2">
                        <span className="font-semibold text-gray-500 w-24 shrink-0 pb-0.5">Alergi Obat</span>
                        <span className="text-gray-500">:</span>
                        <span className={`grow border-b border-dotted border-gray-500 font-handwritten px-2 font-semibold select-all ${selectedPasien.alergi_obat ? 'text-red-600 border-red-300' : 'text-blue-900'}`}>
                          {selectedPasien.alergi_obat ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 inline text-red-500" />
                              {selectedPasien.alergi_obat}
                            </span>
                          ) : '-'}
                        </span>
                      </div>

                      <div className="flex items-end gap-2">
                        <span className="font-semibold text-gray-500 w-24 shrink-0 pb-0.5">No. HP</span>
                        <span className="text-gray-500">:</span>
                        <span className="grow border-b border-dotted border-gray-500 font-handwritten text-blue-900 px-2 select-all">
                          {selectedPasien.no_hp ?? '-'}
                        </span>
                      </div>

                      <div className="flex items-end gap-2">
                        <span className="font-semibold text-gray-500 w-24 shrink-0 pb-0.5">Jenis Kelamin</span>
                        <span className="text-gray-500">:</span>
                        <span className="grow border-b border-dotted border-gray-500 font-handwritten text-blue-900 px-2 select-all">
                          {selectedPasien.jenis_kelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabel Rekam Medis Grid 4 Kolom Utama */}
                  <div className="border border-gray-200 bg-white rounded-lg overflow-x-auto mt-6">
                    <table className="w-full min-w-[750px] sm:min-w-0 table-fixed border-collapse text-xs md:text-sm text-gray-900">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-center font-bold">
                          <th className="p-3 border-r border-gray-200 w-[12%] bg-gray-50">Tanggal / Dokter / Vital</th>
                          <th className="p-3 border-r border-gray-200 w-[43%] bg-gray-50">Anamnesa / Pemeriksaan</th>
                          <th className="p-3 border-r border-gray-200 w-[18%] bg-gray-50">Diagnosis</th>
                          <th className="p-3 bg-gray-50 w-[27%]">Terapi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingRiwayat ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-500">
                              <Loader2 className="h-6 w-6 animate-spin inline mr-2" />
                              Memuat berkas rekam medis...
                            </td>
                          </tr>
                        ) : riwayat.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-500 font-medium italic">
                              Belum ada riwayat kunjungan medis pasien pada sistem.
                            </td>
                          </tr>
                        ) : (
                          paginatedRiwayat.map((row) => {
                            const rm = Array.isArray(row.rekam_medis) ? row.rekam_medis[0] : row.rekam_medis
                            return (
                              <tr key={row.id} className="border-b border-gray-200 align-top hover:bg-gray-50/50 transition-colors">
                                
                                {/* Kolom Tanggal Riwayat + Vital Signs */}
                                <td className="p-3 border-r border-gray-200 text-gray-500 font-semibold leading-normal">
                                  <div className="text-gray-900">{formatIndonesianDateTime(row.jam_daftar || row.tanggal)}</div>
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
                                        <div className="flex items-center gap-1">
                                          <Activity className="h-3 w-3 text-blue-500 inline" />
                                          {row.nadi} /menit
                                        </div>
                                      )}
                                      {row.suhu && (
                                        <div className="flex items-center gap-1">
                                          <Thermometer className="h-3 w-3 text-amber-500 inline" />
                                          {row.suhu} °C
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Kolom Anamnesa / Pemeriksaan Riwayat */}
                                <td className="p-3 border-r border-gray-200 font-handwritten text-blue-900 text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                                  {rm?.anamnesis || (rm?.anamnesis_handwriting_url ? '' : '-')}
                                  {rm?.pemeriksaan_fisik && (
                                    <div className="mt-2 pt-2 border-t border-dashed border-gray-200">
                                      {rm.pemeriksaan_fisik}
                                    </div>
                                  )}
                                  {rm?.anamnesis_handwriting_url && (
                                    <div className="mt-2 group relative">
                                      <img
                                        src={rm.anamnesis_handwriting_url}
                                        alt="Tulisan Tangan Anamnesis"
                                        onClick={() => setSelectedImage({ url: rm.anamnesis_handwriting_url, title: 'Tulisan Tangan Anamnesis' })}
                                        className="rounded-lg border border-amber-200 bg-[#FAF9F6] p-1.5 w-full max-h-none object-contain cursor-zoom-in hover:border-blue-400 hover:shadow-md transition-all"
                                      />
                                      <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1 font-sans shadow-sm">
                                        <Eye className="h-3 w-3" /> Perbesar Canvas
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Kolom Diagnosis Riwayat */}
                                <td className="p-3 border-r border-gray-200 font-handwritten text-blue-900 text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                                  {rm?.diagnosis_nama || (rm?.diagnosis_handwriting_url ? '' : '-')}
                                  {rm?.diagnosis_kode && (
                                    <span className="font-sans text-[10px] text-gray-500 block mt-1 font-normal select-all">
                                      ({rm.diagnosis_kode})
                                    </span>
                                  )}
                                  {rm?.diagnosis_handwriting_url && (
                                    <div className="mt-2 group relative">
                                      <img
                                        src={rm.diagnosis_handwriting_url}
                                        alt="Tulisan Tangan Diagnosis"
                                        onClick={() => setSelectedImage({ url: rm.diagnosis_handwriting_url, title: 'Tulisan Tangan Diagnosis' })}
                                        className="rounded-lg border border-amber-200 bg-[#FAF9F6] p-1.5 w-full max-h-none object-contain cursor-zoom-in hover:border-blue-400 hover:shadow-md transition-all"
                                      />
                                      <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1 font-sans shadow-sm">
                                        <Eye className="h-3 w-3" /> Perbesar Canvas
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Kolom Terapi Riwayat */}
                                <td className="p-3 font-handwritten text-blue-900 text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
                                  {rm?.terapi || (rm?.terapi_handwriting_url ? '' : '-')}
                                  {rm?.terapi_handwriting_url && (
                                    <div className="mt-2 group relative">
                                      <img
                                        src={rm.terapi_handwriting_url}
                                        alt="Tulisan Tangan Terapi"
                                        onClick={() => setSelectedImage({ url: rm.terapi_handwriting_url, title: 'Tulisan Tangan Terapi' })}
                                        className="rounded-lg border border-amber-200 bg-[#FAF9F6] p-1.5 w-full max-h-none object-contain cursor-zoom-in hover:border-blue-400 hover:shadow-md transition-all"
                                      />
                                      <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1 font-sans shadow-sm">
                                        <Eye className="h-3 w-3" /> Perbesar Canvas
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Tampilan Resep Riwayat */}
                                  {row.resep_obat && row.resep_obat.length > 0 && (
                                    <div className="mt-2.5 pt-2 border-t border-dashed border-gray-200 text-xs">
                                      <ul className="space-y-1 list-disc list-inside text-blue-800 font-medium">
                                        {row.resep_obat.map((r, idx) => (
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
                        className="px-4 py-2 border border-border rounded text-xs font-semibold text-gray-700 hover:bg-muted disabled:opacity-40 bg-[#FAF9F6]"
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
                        className="px-4 py-2 border border-border rounded text-xs font-semibold text-gray-700 hover:bg-muted disabled:opacity-40 bg-[#FAF9F6]"
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Pasien */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Data Pasien</DialogTitle>
            <DialogDescription>
              Lakukan perubahan data profil pasien. NRM tidak dapat diubah demi integritas data.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nama">Nama Lengkap</Label>
              <Input
                id="edit-nama"
                required
                value={editForm.nama || ''}
                onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tanggal-lahir">Tanggal Lahir</Label>
                <Input
                  id="edit-tanggal-lahir"
                  type="date"
                  value={editForm.tanggal_lahir || ''}
                  onChange={(e) => setEditForm({ ...editForm, tanggal_lahir: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-jenis-kelamin">Jenis Kelamin</Label>
                <Select
                  value={editForm.jenis_kelamin || ''}
                  onValueChange={(val) => setEditForm({ ...editForm, jenis_kelamin: val as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-alamat">Alamat</Label>
              <Textarea
                id="edit-alamat"
                value={editForm.alamat || ''}
                onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hp">No HP</Label>
              <Input
                id="edit-hp"
                value={editForm.no_hp || ''}
                onChange={(e) => setEditForm({ ...editForm, no_hp: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-alergi">Alergi Obat</Label>
              <Input
                id="edit-alergi"
                placeholder="Kosongkan jika tidak ada"
                value={editForm.alergi_obat || ''}
                onChange={(e) => setEditForm({ ...editForm, alergi_obat: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !isOnline}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Preview Gambar Canvas (Tulisan Tangan) Full-size */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="sm:max-w-[750px] p-6 rounded-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <PenTool className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              {selectedImage?.title || 'Preview Canvas Tulisan Tangan'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Berkas tulisan tangan / corat-coret dokter pada rekam medis pasien.
            </DialogDescription>
          </DialogHeader>

          {selectedImage && (
            <div className="my-3 flex justify-center bg-[#FAF9F6] border-2 border-amber-200 dark:border-amber-800/80 rounded-xl p-4 shadow-inner max-h-[70vh] overflow-auto">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-w-full h-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedImage(null)}
              className="w-full sm:w-auto border-border font-semibold text-gray-700 hover:bg-muted bg-card"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

