'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updatePasien, importPasien } from '@/app/actions/admin'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Pencil, FilePlus, Search } from 'lucide-react'

// Extended interface for visit history
interface KunjunganHistory extends KunjunganRow {
  rekam_medis: RekamMedisRow[]
  dokter: { nama: string } | null
}

export default function AdminPasienPage() {
  const [pasien, setPasien] = useState<PasienRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Drawer/Sheet State
  const [selectedPasien, setSelectedPasien] = useState<PasienRow | null>(null)
  const [riwayat, setRiwayat] = useState<KunjunganHistory[]>([])
  const [loadingRiwayat, setLoadingRiwayat] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Dialog Edit State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editForm, setEditForm] = useState<Partial<PasienRow>>({})

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

  const supabase = createClient()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchPasien()
  }, [debouncedSearch])

  async function fetchPasien() {
    setLoading(true)
    let query = supabase.from('pasien').select('*').order('nrm', { ascending: true }).limit(50)

    if (debouncedSearch) {
      const isNumeric = /^\d+$/.test(debouncedSearch)
      if (isNumeric) {
        query = query.or(`nrm.eq.${parseInt(debouncedSearch, 10)},nama.ilike.%${debouncedSearch}%`)
      } else {
        query = query.ilike('nama', `%${debouncedSearch}%`)
      }
    }

    const { data, error } = await query

    if (error) {
      toast.error('Gagal memuat data pasien')
    } else {
      setPasien(data as PasienRow[])
    }
    setLoading(false)
  }

  async function fetchRiwayatKunjungan(pasienId: string) {
    setLoadingRiwayat(true)
    const { data, error } = await supabase
      .from('kunjungan')
      .select(`
        *,
        rekam_medis (*),
        dokter:users!kunjungan_dokter_id_fkey(nama)
      `)
      .eq('pasien_id', pasienId)
      .order('jam_daftar', { ascending: false })

    if (!error) {
      setRiwayat(data as any)
    }
    setLoadingRiwayat(false)
  }

  const handleRowClick = (p: PasienRow) => {
    setSelectedPasien(p)
    setIsSheetOpen(true)
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
      await updatePasien(editForm.id, {
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
      await importPasien({
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Manajemen Pasien</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cari, edit, dan lihat riwayat seluruh pasien.
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
              <DialogTitle>Input Pasien Lama (Import)</DialogTitle>
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
                <Label htmlFor="import-alergi">Alergi Obat</Label>
                <Input
                  id="import-alergi"
                  placeholder="Kosongkan jika tidak ada"
                  value={importForm.alergi_obat}
                  onChange={(e) => setImportForm({ ...importForm, alergi_obat: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pasien'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Cari berdasarkan nama atau NRM..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white">
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
              pasien.map((p) => (
                <TableRow 
                  key={p.id} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleRowClick(p)}
                >
                  <TableCell className="font-medium text-blue-600">
                    {p.nrm}
                  </TableCell>
                  <TableCell className="font-semibold">{p.nama}</TableCell>
                  <TableCell>
                    {p.tanggal_lahir ? new Date(p.tanggal_lahir).toLocaleDateString('id-ID') : '-'}
                  </TableCell>
                  <TableCell>{p.no_hp || '-'}</TableCell>
                  <TableCell>
                    {p.alergi_obat ? (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                        {p.alergi_obat}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">Tidak ada</span>
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

      {/* Sheet Detail & Riwayat Pasien */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle>Detail & Riwayat Pasien</SheetTitle>
            <SheetDescription>
              Informasi profil dan riwayat rekam medis pasien.
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="flex-1 -mx-6 px-6 py-4">
            {selectedPasien && (
              <div className="space-y-6">
                {/* Info Card */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedPasien.nama}</h2>
                      <p className="text-sm text-gray-500 font-medium mt-1">NRM: {selectedPasien.nrm}</p>
                    </div>
                    {selectedPasien.alergi_obat && (
                      <Badge variant="destructive" className="text-xs">
                        Alergi: {selectedPasien.alergi_obat}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    <div>
                      <span className="text-gray-500 block mb-0.5">Tanggal Lahir</span>
                      <span className="font-medium text-gray-900">
                        {selectedPasien.tanggal_lahir ? new Date(selectedPasien.tanggal_lahir).toLocaleDateString('id-ID') : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Jenis Kelamin</span>
                      <span className="font-medium text-gray-900">
                        {selectedPasien.jenis_kelamin === 'L' ? 'Laki-laki' : selectedPasien.jenis_kelamin === 'P' ? 'Perempuan' : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">No. HP</span>
                      <span className="font-medium text-gray-900">{selectedPasien.no_hp || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Alamat</span>
                      <span className="font-medium text-gray-900">{selectedPasien.alamat || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Riwayat Rekam Medis */}
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-3">Riwayat Kunjungan</h3>
                  {loadingRiwayat ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : riwayat.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50/50">
                      Belum ada riwayat kunjungan.
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full space-y-2">
                      {riwayat.map((kunj) => {
                        const rm = kunj.rekam_medis?.[0]
                        return (
                          <AccordionItem key={kunj.id} value={kunj.id} className="border rounded-lg px-4 bg-white">
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="text-left">
                                  <div className="font-medium text-gray-900 text-sm">
                                    {new Date(kunj.tanggal).toLocaleDateString('id-ID', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    Dr. {kunj.dokter?.nama || 'Tidak diketahui'}
                                  </div>
                                </div>
                                {rm?.diagnosis_nama && (
                                  <Badge variant="outline" className="text-xs shrink-0 max-w-[150px] truncate">
                                    {rm.diagnosis_nama}
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 border-t">
                              {!rm ? (
                                <p className="text-sm text-gray-500 italic">Rekam medis belum diisi (Status: {kunj.status})</p>
                              ) : (
                                <div className="space-y-3 text-sm">
                                  <div className="grid grid-cols-4 gap-2 mb-4 bg-gray-50 p-2 rounded">
                                    <div><span className="text-xs text-gray-500 block">Tensi</span><span className="font-medium">{kunj.tensi_sistolik}/{kunj.tensi_diastolik}</span></div>
                                    <div><span className="text-xs text-gray-500 block">Nadi</span><span className="font-medium">{kunj.nadi}</span></div>
                                    <div><span className="text-xs text-gray-500 block">Suhu</span><span className="font-medium">{kunj.suhu}°C</span></div>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-700">Anamnesis:</span>
                                    <p className="mt-1 text-gray-600 whitespace-pre-wrap">{rm.anamnesis || '-'}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-700">Pemeriksaan Fisik:</span>
                                    <p className="mt-1 text-gray-600 whitespace-pre-wrap">{rm.pemeriksaan_fisik || '-'}</p>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-gray-700">Terapi & Catatan:</span>
                                    <p className="mt-1 text-gray-600 whitespace-pre-wrap">{rm.terapi || '-'}</p>
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        )
                      })}
                    </Accordion>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
