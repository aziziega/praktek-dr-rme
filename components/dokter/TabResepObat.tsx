'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { searchObat, getResepKunjungan, type ResepItem } from '@/app/actions/dokter'
import type { ObatRow } from '@/types/database'

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
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  Pill,
  Package,
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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ObatRow[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
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

  // Search obat with debounce
  function handleSearchChange(value: string) {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const data = await searchObat(value)
        setSearchResults(data)
        setShowResults(true)
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function addObatFromMaster(obat: ObatRow) {
    const newItem: LocalResepItem = {
      _key: newKey(),
      obat_id: obat.id,
      nama_obat: obat.nama,
      dosis: '',
      jumlah: 1,
      harga_satuan: Number(obat.harga_jual),
    }
    setItems((prev) => [...prev, newItem])
    setSearchQuery('')
    setShowResults(false)
  }

  function addObatManual() {
    const newItem: LocalResepItem = {
      _key: newKey(),
      obat_id: null,
      nama_obat: '',
      dosis: '',
      jumlah: 1,
      harga_satuan: 0,
    }
    setItems((prev) => [...prev, newItem])
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

  return (
    <div className="space-y-5">
      {/* Search Obat */}
      {!readOnly && (
        <div className="space-y-3">
          <div ref={searchRef} className="relative">
            <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Pill className="h-4 w-4 text-sky-500" />
              Cari Obat dari Master
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Ketik nama obat (min 2 karakter)..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((obat) => (
                  <button
                    key={obat.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 hover:bg-sky-50 transition-colors border-b border-gray-50 last:border-b-0"
                    onClick={() => addObatFromMaster(obat)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {obat.nama}
                        </p>
                        <p className="text-xs text-gray-500">
                          {obat.satuan} · {formatCurrency(Number(obat.harga_jual))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {obat.stok < 5 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
                          >
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                            Stok {obat.stok}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          <Package className="h-2.5 w-2.5 mr-0.5" />
                          {obat.stok}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showResults && searchResults.length === 0 && !searchLoading && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-xs text-gray-500">
                Obat tidak ditemukan di master.
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addObatManual}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Tambah Obat Manual
          </Button>
        </div>
      )}

      {/* Resep Table */}
      {items.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="w-[30%]">Nama Obat</TableHead>
                <TableHead className="w-[15%]">Dosis</TableHead>
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
