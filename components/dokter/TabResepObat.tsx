'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { searchObat, getResepKunjungan, getAllActiveObat, type ResepItem } from '@/app/actions/dokter'
import type { ObatRow } from '@/types/database'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  Pill,
  Package,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

interface TabResepObatProps {
  kunjunganId: string
  readOnly: boolean
  onItemsChange?: (items: ResepItem[], total: number) => void
}

interface LocalResepItem extends ResepItem {
  _key: string // local unique key for React rendering
}

export function TabResepObat({
  kunjunganId,
  readOnly,
  onItemsChange,
}: TabResepObatProps) {
  const [items, setItems] = useState<LocalResepItem[]>([])
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [allObat, setAllObat] = useState<ObatRow[]>([])
  const [loadingAllObat, setLoadingAllObat] = useState(false)
  const [modalSearchQuery, setModalSearchQuery] = useState('')

  const [loaded, setLoaded] = useState(false)
  const keyCounter = useRef(0)

  function newKey() {
    keyCounter.current += 1
    return `resep-${keyCounter.current}-${Date.now()}`
  }

  // Load existing resep
  useEffect(() => {
    async function load() {
      try {
        // Check if there is saved state in sessionStorage first (only if not readOnly)
        if (!readOnly && typeof window !== 'undefined') {
          const cached = sessionStorage.getItem(`resep-items-${kunjunganId}`)
          if (cached) {
            const parsed = JSON.parse(cached)
            setItems(parsed)
            setLoaded(true)
            return
          }
        }

        const data = await getResepKunjungan(kunjunganId)
        setItems(data.map((d) => ({ ...d, _key: newKey() })))
      } catch {
        console.error('[TabResep] Failed to load')
      } finally {
        setLoaded(true)
      }
    }
    load()
  }, [kunjunganId, readOnly])

  // Fetch all active drugs for the picker modal
  const fetchAllObat = useCallback(async () => {
    setLoadingAllObat(true)
    try {
      const data = await getAllActiveObat()
      setAllObat(data)
    } catch {
      toast.error('Gagal mengambil katalog obat master.')
    } finally {
      setLoadingAllObat(false)
    }
  }, [])

  useEffect(() => {
    if (modalOpen) {
      fetchAllObat()
      setModalSearchQuery('')
    }
  }, [modalOpen, fetchAllObat])

  // Notify parent on items change & save to sessionStorage
  const notifyParent = useCallback(() => {
    const total = items.reduce(
      (sum, item) => sum + item.jumlah * item.harga_satuan,
      0
    )
    const clean: ResepItem[] = items.map(({ _key, ...rest }) => rest)
    onItemsChange?.(clean, total)

    // Save to sessionStorage if loaded and NOT readOnly
    if (loaded && !readOnly && typeof window !== 'undefined') {
      sessionStorage.setItem(`resep-items-${kunjunganId}`, JSON.stringify(items))
    }
  }, [items, loaded, readOnly, kunjunganId, onItemsChange])

  useEffect(() => {
    if (loaded) notifyParent()
  }, [loaded, notifyParent])

  function addObatFromMaster(obat: ObatRow) {
    if (obat.stok <= 0) {
      toast.error(`Stok obat "${obat.nama}" habis! Tidak dapat ditambahkan ke resep.`)
      return
    }

    const existingIndex = items.findIndex((item) => item.obat_id === obat.id)

    if (existingIndex > -1) {
      const currentQty = items[existingIndex].jumlah
      if (currentQty >= obat.stok) {
        toast.error(`Jumlah resep melebihi stok yang tersedia (${obat.stok} ${obat.satuan})`)
        return
      }
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex ? { ...item, jumlah: item.jumlah + 1 } : item
        )
      )
      toast.success(`Jumlah resep untuk "${obat.nama}" ditingkatkan menjadi ${currentQty + 1}`)
    } else {
      const newItem: LocalResepItem = {
        _key: newKey(),
        obat_id: obat.id,
        nama_obat: obat.nama,
        dosis: '3x1', // standard default dosage suggestion
        jumlah: 1,
        harga_satuan: Number(obat.harga_jual),
      }
      setItems((prev) => [...prev, newItem])
      toast.success(`Obat "${obat.nama}" ditambahkan ke resep.`)
    }

    setModalOpen(false)
  }

  function addObatManual() {
    const newItem: LocalResepItem = {
      _key: newKey(),
      obat_id: null,
      nama_obat: '',
      dosis: '3x1',
      jumlah: 1,
      harga_satuan: 0,
    }
    setItems((prev) => [...prev, newItem])
    toast.success('Kolom obat manual baru ditambahkan.')
  }

  function updateItem(key: string, field: keyof ResepItem, value: string | number | null) {
    setItems((prev) =>
      prev.map((item) =>
        item._key === key ? { ...item, [field]: value } : item
      )
    )
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item._key !== key))
  }

  // Totals
  const totalHarga = items.reduce(
    (sum, item) => sum + item.jumlah * item.harga_satuan,
    0
  )

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  // Local filtering inside the modal
  const filteredObat = allObat.filter((obat) =>
    obat.nama.toLowerCase().includes(modalSearchQuery.toLowerCase())
  )

  return (

    <div className="space-y-5">
      {/* Action Buttons */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2 border-[#EADFC9] hover:bg-[#FAF9F6] text-amber-900 border font-medium h-9 text-xs transition-colors shadow-sm bg-[#FAF9F6]/50"
            onClick={() => setModalOpen(true)}
          >
            <Pill className="h-4 w-4 text-sky-500" />
            Pilih Obat dari Master Catalog
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={addObatManual}
            className="flex items-center gap-1.5 h-9 text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-0.5 text-gray-500" />
            Tambah Obat Manual (Racikan)
          </Button>
        </div>
      )}

      {/* Catalog Dialog Picker Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-2xl border-[#EADFC9] bg-[#FAF9F6]">
          <DialogHeader className="pb-3 border-b border-[#EADFC9]">
            <DialogTitle className="flex items-center gap-2 text-amber-900 font-bold text-lg">
              <Pill className="h-5 w-5 text-sky-600" />
              Katalog Master Obat
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-xs mt-1">
              Pilih obat dari master catalog untuk langsung dimasukkan ke resep pasien.
            </DialogDescription>
          </DialogHeader>

          {/* Search Inside Modal */}
          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari berdasarkan nama atau kode obat..."
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm bg-white border-gray-200 focus-visible:ring-sky-500 rounded-xl"
            />
          </div>

          {/* List Wrapper */}
          <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-2 max-h-[45vh]">
            {loadingAllObat ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500 mb-2" />
                <p className="text-xs">Memuat katalog obat...</p>
              </div>
            ) : filteredObat.length > 0 ? (
              filteredObat.map((obat) => {
                const isOutOfStock = obat.stok <= 0
                const isLowStock = obat.stok > 0 && obat.stok < 5
                
                return (
                  <button
                    key={obat.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => addObatFromMaster(obat)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                      isOutOfStock
                        ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-sky-300 hover:shadow-xs active:scale-[0.99]'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {obat.nama}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Harga Jual: <span className="font-semibold text-gray-700">{formatCurrency(Number(obat.harga_jual))}</span> per {obat.satuan}
                      </p>

                    </div>

                    <div className="flex items-center gap-3">
                      {isOutOfStock ? (
                        <Badge className="bg-red-50 text-red-700 border-red-200 border text-[10px] py-0.5 px-2">
                          Habis
                        </Badge>
                      ) : isLowStock ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-[10px] py-0.5 px-2 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          Stok {obat.stok}
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-[10px] py-0.5 px-2 flex items-center gap-1">
                          <Package className="h-3 w-3 text-emerald-500" />
                          Stok {obat.stok}
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-white/50">
                <Pill className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Tidak ada obat yang cocok.</p>
                <p className="text-xs mt-1">Gunakan kata kunci pencarian yang lain.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Resep Table */}
      {items.length > 0 ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white">
          <Table>
            <TableHeader>

              <TableRow className="bg-gray-50/80">
                <TableHead className="w-[30%]">Nama Obat</TableHead>
                <TableHead className="w-[15%]">
                  Dosis <span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="w-[10%] text-center">Jml</TableHead>
                <TableHead className="w-[18%] text-right">Harga</TableHead>
                <TableHead className="w-[18%] text-right">Subtotal</TableHead>
                {!readOnly && (
                  <TableHead className="w-[9%] text-center" />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const subtotal = item.jumlah * item.harga_satuan
                return (
                  <TableRow key={item._key}>
                    <TableCell>
                      {readOnly ? (
                        <span className="text-sm">{item.nama_obat}</span>
                      ) : (
                        <Input
                          value={item.nama_obat}
                          onChange={(e) =>
                            updateItem(item._key, 'nama_obat', e.target.value)
                          }
                          placeholder="Nama obat"
                          className="h-8 text-sm"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        <span className="text-sm">{item.dosis}</span>
                      ) : (
                        <Input
                          value={item.dosis}
                          onChange={(e) =>
                            updateItem(item._key, 'dosis', e.target.value)
                          }
                          placeholder="3x1"
                          className="h-8 text-sm"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {readOnly ? (
                        <span className="text-sm">{item.jumlah}</span>
                      ) : (
                        <Input
                          type="number"
                          value={item.jumlah || ''}
                          onChange={(e) =>
                            updateItem(
                              item._key,
                              'jumlah',
                              e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0
                            )
                          }
                          min={1}
                          className="h-8 text-sm text-center"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {readOnly ? (
                        <span className="text-sm">
                          {formatCurrency(item.harga_satuan)}
                        </span>
                      ) : (
                        <Input
                          type="number"
                          value={item.harga_satuan || ''}
                          onChange={(e) =>
                            updateItem(
                              item._key,
                              'harga_satuan',
                              e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                            )
                          }
                          min={0}
                          className="h-8 text-sm text-right"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {formatCurrency(subtotal)}
                    </TableCell>
                    {!readOnly && (
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeItem(item._key)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Total Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
            <span className="text-sm font-semibold text-gray-700">
              Total Obat
            </span>
            <span className="text-base font-bold text-sky-700">
              {formatCurrency(totalHarga)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <Pill className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>Belum ada resep obat.</p>
          {!readOnly && (
            <p className="text-xs mt-1">
              Cari obat dari master atau tambah manual.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
