import type { Metadata } from 'next'
import { PendaftaranClient } from '@/components/staf/PendaftaranClient'

export const metadata: Metadata = {
  title: 'Pendaftaran â€” RME Praktek Dr. Sudiman',
}

export default function PendaftaranPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pendaftaran Pasien
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cari pasien, daftarkan pasien baru, dan input vital sign.
        </p>
      </div>

      <PendaftaranClient />
    </div>
  )
}

