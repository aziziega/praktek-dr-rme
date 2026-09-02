'use client'

import { useState, useEffect } from 'react'
import { getAdminObat, createObat, updateObat, addObatStock, toggleObatStatus, deleteObat } from '@/app/actions/admin'
import { formatRupiah } from '@/lib/utils'
import { obatSchema } from '@/lib/validations'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Pill, Pencil, PlusCircle, AlertTriangle, Trash2 } from 'lucide-react'
import { useNetworkStatus } from '@/components/providers/NetworkStatusProvider'

interface ObatData {
  id: string
  nama: string
  satuan: string
  stok: number
  harga_jual: number
  aktif: boolean
  updated_at: string
}

export default function AdminObatPage() {
  const isOnline = useNetworkStatus()
  const [obat, setObat] = useState<ObatData[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog Add State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addForm, setAddForm] = useState({ nama: '', satuan: '', stok: 0, harga_jual: 0 })

  // Dialog Edit State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ id: '', nama: '', satuan: '', harga_jual: 0 })

  // Dialog Add Stock State
  const [isStockOpen, setIsStockOpen] = useState(false)
  const [stockForm, setStockForm] = useState({ id: '', nama: '', stokSaatIni: 0, tambah: 0 })

  // Dialog Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string } | null>(null)

  const [debugError, setDebugError] = useState<string | null>(null)

  useEffect(() => {
    fetchObat()
  }, [])

  async function fetchObat() {
    setLoading(true)
    setDebugError(null)
    try {
      const data = await getAdminObat()
      setObat(data as ObatData[])
    } catch (err: any) {
      console.error('[AdminObat] fetch error:', err)
      const msg = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : 'No stack trace'
      setDebugError(`Server Action Exception (Obat): ${msg}\nStack: ${stack}`)
      toast.error('Terjadi kesalahan memuat data obat: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Zod validation
    const validation = obatSchema.safeParse(addForm)
    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setIsSubmitting(true)
    try {
      await createObat(addForm)
      toast.success('Obat berhasil ditambahkan')
      setIsAddOpen(false)
      setAddForm({ nama: '', satuan: '', stok: 0, harga_jual: 0 })
      fetchObat()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Zod validation (Pick only fields edited)
    const editSchema = obatSchema.pick({ nama: true, satuan: true, harga_jual: true })
    const validation = editSchema.safeParse({
      nama: editForm.nama,
      satuan: editForm.satuan,
      harga_jual: editForm.harga_jual
    })
    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setIsSubmitting(true)
    try {
      await updateObat(editForm.id, { 
        nama: editForm.nama, 
        satuan: editForm.satuan, 
        harga_jual: editForm.harga_jual 
      })
      toast.success('Obat berhasil diperbarui')
      setIsEditOpen(false)
      fetchObat()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await addObatStock(stockForm.id, stockForm.tambah)
      toast.success('Stok berhasil ditambahkan')
      setIsStockOpen(false)
      fetchObat()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const confirmMessage = currentStatus
      ? 'Yakin ingin menonaktifkan obat ini?'
      : 'Yakin ingin mengaktifkan obat ini?'
    
    if (!confirm(confirmMessage)) return

    try {
      await toggleObatStatus(id, !currentStatus)
      toast.success(`Obat berhasil di${currentStatus ? 'nonaktifkan' : 'aktifkan'}`)
      fetchObat()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    }
  }

  const filteredObat = obat.filter((o) => {
    if (statusFilter === 'aktif' && !o.aktif) return false
    if (statusFilter === 'nonaktif' && o.aktif) return false
    if (statusFilter === 'menipis' && (o.stok > 10 || !o.aktif)) return false
    
    if (searchQuery && !o.nama.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Stok Obat</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola daftar obat, ketersediaan stok, dan harga jual.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Pill className="h-4 w-4" />
              Tambah Obat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Obat Baru</DialogTitle>
              <DialogDescription>
                Masukkan data master obat ke dalam sistem.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Obat</Label>
                <Input
                  id="nama"
                  required
                  placeholder="Misal: Paracetamol 500mg"
                  value={addForm.nama}
                  onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="satuan">Satuan</Label>
                  <Input
                    id="satuan"
                    required
                    placeholder="Misal: Tablet, Botol"
                    value={addForm.satuan}
                    onChange={(e) => setAddForm({ ...addForm, satuan: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stok">Stok Awal</Label>
                  <Input
                    id="stok"
                    type="number"
                    min="0"
                    required
                    value={addForm.stok || ''}
                    onChange={(e) => setAddForm({ ...addForm, stok: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="harga">Harga Jual (Rp)</Label>
                <Input
                  id="harga"
                  type="number"
                  min="0"
                  required
                  value={addForm.harga_jual || ''}
                  onChange={(e) => setAddForm({ ...addForm, harga_jual: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || !isOnline}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Obat'}
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Cari nama obat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:max-w-[200px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="nonaktif">Nonaktif</SelectItem>
              <SelectItem value="menipis">Stok Menipis (â‰¤ 10)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Obat</TableHead>
              <TableHead>Satuan</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Harga Jual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredObat.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Tidak ada data obat.
                </TableCell>
              </TableRow>
            ) : (
              filteredObat.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nama}</TableCell>
                  <TableCell>{item.satuan}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.stok <= 10 && item.aktif ? (
                        <Badge variant="destructive" className="gap-1 px-1.5">
                          <AlertTriangle className="h-3 w-3" />
                          {item.stok}
                        </Badge>
                      ) : (
                        <span className="font-semibold">{item.stok}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatRupiah(item.harga_jual)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={item.aktif} 
                        onCheckedChange={() => handleToggleStatus(item.id, item.aktif)} 
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!item.aktif}
                        onClick={() => {
                          setStockForm({ id: item.id, nama: item.nama, stokSaatIni: item.stok, tambah: 0 })
                          setIsStockOpen(true)
                        }}
                      >
                        <PlusCircle className="mr-1 h-3 w-3" />
                        Stok
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditForm({ 
                            id: item.id, 
                            nama: item.nama, 
                            satuan: item.satuan,
                            harga_jual: item.harga_jual
                          })
                          setIsEditOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 dark:text-red-300 hover:text-red-700 dark:text-red-300 hover:bg-red-50 dark:bg-red-900/20"
                        onClick={() => {
                          setDeleteTarget({ id: item.id, nama: item.nama })
                          setIsDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Edit Obat */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Obat</DialogTitle>
            <DialogDescription>
              Ubah rincian obat. Stok hanya bisa ditambah lewat tombol + Stok.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nama">Nama Obat</Label>
              <Input
                id="edit-nama"
                required
                value={editForm.nama}
                onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-satuan">Satuan</Label>
                <Input
                  id="edit-satuan"
                  required
                  value={editForm.satuan}
                  onChange={(e) => setEditForm({ ...editForm, satuan: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-harga">Harga Jual (Rp)</Label>
                <Input
                  id="edit-harga"
                  type="number"
                  min="0"
                  required
                  value={editForm.harga_jual || ''}
                  onChange={(e) => setEditForm({ ...editForm, harga_jual: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !isOnline}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Tambah Stok */}
      <Dialog open={isStockOpen} onOpenChange={setIsStockOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Tambah Stok Barang Masuk</DialogTitle>
            <DialogDescription>
              Obat: <strong className="text-foreground">{stockForm.nama}</strong> <br/>
              Stok saat ini: {stockForm.stokSaatIni}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStockSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="tambah-stok">Jumlah Tambahan</Label>
              <Input
                id="tambah-stok"
                type="number"
                min="1"
                required
                value={stockForm.tambah || ''}
                onChange={(e) => setStockForm({ ...stockForm, tambah: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || stockForm.tambah <= 0}>
                {isSubmitting ? 'Menyimpan...' : 'Tambahkan Stok'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            <DialogTitle className="text-center text-lg font-semibold text-foreground">
              Hapus Master Obat
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground pt-2">
              Apakah Anda yakin ingin menghapus obat <strong className="text-foreground">"{deleteTarget?.nama}"</strong>? <br />
              Tindakan ini tidak dapat dibatalkan dan obat akan dihapus permanen dari sistem.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center gap-2 pt-4 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isSubmitting || !isOnline}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting || !isOnline}
              onClick={async () => {
                if (!deleteTarget) return
                setIsSubmitting(true)
                try {
                  await deleteObat(deleteTarget.id)
                  toast.success(`Obat "${deleteTarget.nama}" berhasil dihapus`)
                  setIsDeleteOpen(false)
                  setDeleteTarget(null)
                  fetchObat()
                } catch (err: any) {
                  toast.error(err.message || 'Terjadi kesalahan saat menghapus obat')
                } finally {
                  setIsSubmitting(false)
                }
              }}
            >
              {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


