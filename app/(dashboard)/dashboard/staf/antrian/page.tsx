import type { Metadata } from 'next'
import { AntrianTable } from '@/components/staf/AntrianTable'

export const metadata: Metadata = {
  title: 'Antrian Hari Ini â€” RME Praktek Dr. Sudiman',
}

export default function AntrianStafPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Antrian Hari Ini
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lihat status antrian pasien hari ini secara realtime.
        </p>
      </div>

      <AntrianTable />
    </div>
  )
}

