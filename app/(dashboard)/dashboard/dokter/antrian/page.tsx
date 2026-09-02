import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AntrianDokterClient } from '@/components/dokter/AntrianDokterClient'

export const metadata: Metadata = {
  title: 'Antrian Saya â€” RME Praktek Dr. Sudiman',
}

export default async function AntrianDokterPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Antrian Saya
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daftar pasien yang di-assign ke Anda hari ini.
        </p>
      </div>

      <AntrianDokterClient dokterId={user.id} />
    </div>
  )
}

