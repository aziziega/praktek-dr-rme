'use server'

import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity-logger'
import { revalidatePath } from 'next/cache'

export interface SuratRow {
  id: string
  pasien_id: string
  kunjungan_id: string | null
  dokter_id: string
  tipe_surat: 'sehat' | 'sakit' | 'rujukan'
  nomor_surat: string
  data: any
  created_at: string
  updated_at: string
}

export async function createSurat(payload: {
  pasien_id: string
  kunjungan_id?: string
  tipe_surat: 'sehat' | 'sakit' | 'rujukan'
  nomor_surat: string
  data: any
}) {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await
    (supabase.from('surat') as any)
      .insert({
        pasien_id: payload.pasien_id,
        kunjungan_id: payload.kunjungan_id || null,
        dokter_id: authData.user.id,
        tipe_surat: payload.tipe_surat,
        nomor_surat: payload.nomor_surat,
        data: payload.data
      })
      .select()
      .single()

  if (error) {
    console.error('Error creating surat:', error)
    throw new Error(error.message)
  }

  await logActivity({
    userId: authData.user.id,
    aksi: 'CREATE_SURAT',
    targetTabel: 'surat',
    targetId: data?.id,
    detail: { tipe: payload.tipe_surat, nomor: payload.nomor_surat }
  })

  revalidatePath('/dashboard/dokter/surat')
  return data
}

export async function getSuratHistory() {
  const supabase = await createClient()
  const { data, error } = await (supabase.from('surat') as any)
    .select(`
      *,
      pasien ( id, nama, nrm, jenis_kelamin, tanggal_lahir, alamat ),
      dokter:users ( nama )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching surat history:', error)
    return []
  }

  return data || []
}

export async function logCetakUlangSurat(suratId: string, nomorSurat: string, tipeSurat: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (authData?.user) {
    await logActivity({
      userId: authData.user.id,
      aksi: 'CETAK_ULANG_SURAT',
      targetTabel: 'surat',
      targetId: suratId,
      detail: { nomor_surat: nomorSurat, tipe_surat: tipeSurat }
    })
  }
}

export async function getLatestKunjungan(pasien_id: string) {
  const supabase = await createClient()

  // Find latest kunjungan for this patient
  const { data: kunjunganData, error: kError } = await supabase
    .from('kunjungan')
    .select('*, rekam_medis(*)')
    .eq('pasien_id', pasien_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (kError && kError.code !== 'PGRST116') {
    console.error('Error fetching latest kunjungan:', kError)
  }

  return kunjunganData || null
}
