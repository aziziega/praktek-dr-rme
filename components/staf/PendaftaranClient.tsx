'use client'

import { useState } from 'react'
import type { PasienRow } from '@/types/database'
import { SearchPasien } from '@/components/staf/SearchPasien'
import { FormPasienBaru } from '@/components/staf/FormPasienBaru'
import { FormKunjungan } from '@/components/staf/FormKunjungan'

type ViewState = 'search' | 'new-patient' | 'kunjungan'

export function PendaftaranClient() {
  const [view, setView] = useState<ViewState>('search')
  const [selectedPasien, setSelectedPasien] = useState<PasienRow | null>(null)

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
    // Focus will be handled by SearchPasien's useEffect
  }

  function handleBack() {
    setSelectedPasien(null)
    setView('search')
  }

  return (
    <>
      {view === 'search' && (
        <SearchPasien
          onSelectPasien={handleSelectPasien}
          onNewPasien={handleNewPasien}
        />
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
