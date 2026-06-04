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
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white rounded-2xl border border-red-100 shadow-sm my-6">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Gagal Memuat Halaman Pemeriksaan</h3>
        <p className="text-sm text-gray-500 mb-2 text-center max-w-md">
          Terjadi kesalahan saat mengambil detail kunjungan.
        </p>
        <div className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-xs font-mono text-red-700 mb-6 max-w-lg w-full text-center">
          Detail Error: {result.error ?? 'Unknown error'}
        </div>
        <a
          href="/dashboard/dokter/antrian"
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          Kembali ke Antrian
        </a>
      </div>
    )
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
