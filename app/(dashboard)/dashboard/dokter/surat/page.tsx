import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuratClient from './SuratClient'

import { getSuratHistory } from '@/app/actions/surat'

export const metadata = {
  title: 'Cetak Surat | Praktek Dr. Umum Sudiman',
}

export default async function SuratPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all patients for the dropdown
  const { data: patients } = await supabase
    .from('pasien')
    .select('id, nama, nrm, jenis_kelamin, tanggal_lahir, alamat')
    .order('nama', { ascending: true })

  // Determine user role
  const { data } = await supabase
    .from('users')
    .select('nama, role')
    .eq('id', user.id)
    .single()
    
  const userData = data as { nama: string; role: string } | null
  const initialHistory = await getSuratHistory()

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <SuratClient
        patients={patients || []}
        currentUserId={user.id}
        currentUserName={userData?.nama || ''}
        initialHistory={initialHistory || []}
      />
    </div>
  )
}
