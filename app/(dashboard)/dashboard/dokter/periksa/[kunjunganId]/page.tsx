import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getKunjunganDetail } from '@/app/actions/dokter'
import { PeriksaClient } from '@/components/dokter/PeriksaClient'

export const metadata: Metadata = {
  title: 'Pemeriksaan — RME Praktek Dr. Sudiman',
}

interface PeriksaPageProps {
  params: Promise<{ kunjunganId: string }>
}

export default async function PeriksaPage({ params }: PeriksaPageProps) {
  const resolvedParams = await params
  const { kunjunganId } = resolvedParams

  if (!kunjunganId) {
    notFound()
  }

  const result = await getKunjunganDetail(kunjunganId)

  if (!result.success || !result.data) {
    if (result.error === 'Sesi habis.') {
      redirect('/login')
    }
    console.error('[PeriksaPage] Failed to load kunjungan detail:', result.error)
    // Jika tidak ditemukan atau bukan milik dokter ini
    redirect('/dashboard/dokter/antrian')
  }

  const { kunjungan, pasien, rekamMedis } = result.data

  return (
    <PeriksaClient
      kunjungan={kunjungan}
      pasien={pasien}
      rekamMedis={rekamMedis}
    />
  )
}
