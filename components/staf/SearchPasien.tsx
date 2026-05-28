'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { searchPasien } from '@/app/actions/staf'
import type { PasienRow } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  UserPlus,
  AlertTriangle,
  Calendar,
  Hash,
} from 'lucide-react'

interface SearchPasienProps {
  onSelectPasien: (pasien: PasienRow) => void
  onNewPasien: () => void
}

export function SearchPasien({ onSelectPasien, onNewPasien }: SearchPasienProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PasienRow[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Expose the ref for parent to focus
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    const isNumeric = /^\d+$/.test(trimmed)
    
    // Izinkan pencarian 1 digit untuk NRM numerik (1, 2, 3), tetapi tetap batasi teks minimal 2 karakter
    if (!isNumeric && trimmed.length < 2) {
      setResults([])
      setHasSearched(false)
      return
    }

    if (trimmed.length === 0) {
      setResults([])
      setHasSearched(false)
      return
    }

    setLoading(true)
    try {
      const data = await searchPasien(q)
      setResults(data)
      setHasSearched(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(value: string) {
    setQuery(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      doSearch(value)
    }, 300)
  }

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
        <Input
          ref={inputRef}
          id="search-pasien"
          type="text"
          placeholder="Cari pasien: ketik NRM, nama, atau tanggal lahir (YYYY-MM-DD)..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-10 h-12 text-base bg-white border-gray-200 focus:border-sky-400 focus:ring-sky-400/20"
        />
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-gray-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            {results.length} pasien ditemukan
          </p>
          <div className="space-y-2">
            {results.map((pasien) => (
              <Card
                key={pasien.id}
                className="border-gray-100 hover:border-sky-200 hover:shadow-md cursor-pointer transition-all duration-150 group"
                onClick={() => onSelectPasien(pasien)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-semibold text-sky-600 group-hover:bg-sky-100 transition-colors">
                        {pasien.nama.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {pasien.nama}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Hash className="h-3 w-3" />
                            {pasien.nrm}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(pasien.tanggal_lahir)}
                          </span>
                        </div>
                        {pasien.alergi_obat && (
                          <div className="mt-2">
                            <Badge
                              variant="outline"
                              className="bg-red-50 text-red-700 border-red-200 text-xs"
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Alergi: {pasien.alergi_obat}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                    >
                      Pilih
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Not Found — Register New */}
      {!loading && hasSearched && results.length === 0 && (
        <Card className="border-dashed border-gray-200 bg-gray-50/50">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 mb-3">
              <Search className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">
              Pasien tidak ditemukan
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Tidak ada pasien yang cocok dengan pencarian &ldquo;{query}&rdquo;
            </p>
            <Button
              onClick={onNewPasien}
              className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white shadow-md shadow-sky-500/20"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Daftarkan Pasien Baru
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!loading && !hasSearched && (
        <div className="text-center py-12 space-y-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-emerald-50 mx-auto">
            <Search className="h-7 w-7 text-sky-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700">
              Cari Pasien
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Ketik minimal 2 karakter untuk mulai mencari
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={onNewPasien}
              className="text-sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Atau daftarkan pasien baru
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
