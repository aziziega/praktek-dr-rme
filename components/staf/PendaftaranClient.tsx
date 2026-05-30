'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PasienRow } from '@/types/database'
import { SearchPasien } from '@/components/staf/SearchPasien'
import { FormPasienBaru } from '@/components/staf/FormPasienBaru'
import { FormKunjungan } from '@/components/staf/FormKunjungan'
import { getPendaftaranStats, type PendaftaranStats } from '@/app/actions/staf'
import { Users, UserPlus, RefreshCw } from 'lucide-react'

type ViewState = 'search' | 'new-patient' | 'kunjungan'

export function PendaftaranClient() {
  const [view, setView] = useState<ViewState>('search')
  const [selectedPasien, setSelectedPasien] = useState<PasienRow | null>(null)
  const [stats, setStats] = useState<PendaftaranStats>({ total: 0, baru: 0, lama: 0 })

  const fetchStats = useCallback(async () => {
    try {
      const data = await getPendaftaranStats()
      setStats(data)
    } catch (err) {
      console.error('[PendaftaranClient] Failed to fetch stats:', err)
    }
  }, [])

  useEffect(() => {
    if (view === 'search') {
      fetchStats()
    }
  }, [view, fetchStats])

  function handleSelectPasien(pasien: PasienRow) {
    setSelectedPasien(pasien)
    setView('kunjungan')
  }

  function handleNewPasien() {
    setView('new-patient')
  }

  function handlePasienCreated(pasien: PasienRow) {
    setSelectedPasien(pasien)
    setView('kunjungan')
  }

  function handleKunjunganSuccess() {
    setSelectedPasien(null)
    setView('search')
    fetchStats()
  }

  function handleBack() {
    setSelectedPasien(null)
    setView('search')
  }

  return (
    <>
      {view === 'search' && (
        <div className="space-y-6">
          {/* Glassmorphic Daily Stats Bar */}
          <div className="grid grid-cols-3 gap-4 bg-white border border-gray-150 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Kunjungan</span>
                <p className="text-lg font-extrabold text-gray-900 leading-none mt-0.5">{stats.total} Pasien</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pasien Baru</span>
                <p className="text-lg font-extrabold text-emerald-600 leading-none mt-0.5">{stats.baru} Orang</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pasien Lama</span>
                <p className="text-lg font-extrabold text-indigo-600 leading-none mt-0.5">{stats.lama} Orang</p>
              </div>
            </div>
          </div>

          <SearchPasien
            onSelectPasien={handleSelectPasien}
            onNewPasien={handleNewPasien}
          />
        </div>
      )}

      {view === 'new-patient' && (
        <FormPasienBaru
          onSuccess={handlePasienCreated}
          onCancel={handleBack}
        />
      )}

      {view === 'kunjungan' && selectedPasien && (
        <FormKunjungan
          pasien={selectedPasien}
          onSuccess={handleKunjunganSuccess}
          onBack={handleBack}
        />
      )}
    </>
  )
}
