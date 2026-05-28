import type { Metadata } from 'next'
import { AntrianTable } from '@/components/staf/AntrianTable'

export const metadata: Metadata = {
  title: 'Antrian Hari Ini — RME Praktek Dr. Sudiman',
}

export default function AntrianStafPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Antrian Hari Ini
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat status antrian pasien hari ini secara realtime.
        </p>
      </div>

      <AntrianTable />
    </div>
  )
}
