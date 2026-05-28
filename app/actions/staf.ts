'use server'

import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity-logger'
import type { PasienRow, KunjunganInsert } from '@/types/database'

// ---------------------------------------------------------------------------
// Search pasien by NRM, nama, or tanggal lahir
// ---------------------------------------------------------------------------
export async function searchPasien(query: string): Promise<PasienRow[]> {
  if (!query) return []
  const q = query.trim()
  if (q.length === 0) return []

  const isNumeric = /^\d+$/.test(q)
  // Izinkan pencarian 1 digit untuk NRM numerik (1, 2, 3), tetapi tetap batasi minimal 2 karakter untuk pencarian teks nama
  if (!isNumeric && q.length < 2) return []

  const supabase = await createClient()

  // Check if query looks like a date (YYYY-MM-DD)
  const isDate = /^\d{4}-\d{2}-\d{2}$/.test(q)

  if (isDate) {
    const { data } = await supabase
      .from('pasien')
      .select('*')
      .eq('tanggal_lahir', q)
      .order('nama')
      .limit(10)

    return (data as PasienRow[]) ?? []
  }

  // Jika query adalah angka murni, cari NRM yang sama persis ATAU nama parsial
  let queryBuilder = supabase.from('pasien').select('*')

  if (isNumeric) {
    const numQuery = parseInt(q, 10)
    queryBuilder = queryBuilder.or(`nrm.eq.${numQuery},nama.ilike.%${q}%`)
  } else {
    queryBuilder = queryBuilder.ilike('nama', `%${q}%`)
  }

  const { data } = await queryBuilder
    .order('nama')
    .limit(10)

  return (data as PasienRow[]) ?? []
}

// ---------------------------------------------------------------------------
// Generate next NRM as pure numeric sequence (e.g. 1, 2, 3)
// ---------------------------------------------------------------------------
export async function getNextNRM(): Promise<number> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pasien')
    .select('nrm')
    .order('nrm', { ascending: false }) // Urutkan langsung berdasarkan angka tertinggi
    .limit(1)

  const rows = data as { nrm: number }[] | null

  if (!rows || rows.length === 0) {
    return 1
  }

  return rows[0].nrm + 1
}

// ---------------------------------------------------------------------------
// Create a new pasien
// ---------------------------------------------------------------------------
export async function createPasien(input: {
  nrm: number
  nama: string
  tanggal_lahir: string
  tempat_lahir?: string
  jenis_kelamin: 'L' | 'P'
  alamat: string
  no_hp?: string
  alergi_obat?: string
}): Promise<{ success: boolean; data?: PasienRow; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login ulang.' }
  }

  const { data, error } = await (supabase.from('pasien') as any).insert({
    nrm: input.nrm,
    nama: input.nama,
    tanggal_lahir: input.tanggal_lahir || null,
    tempat_lahir: input.tempat_lahir || null,
    jenis_kelamin: input.jenis_kelamin,
    alamat: input.alamat,
    no_hp: input.no_hp || null,
    alergi_obat: input.alergi_obat || null,
  }).select('*').single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'NRM sudah digunakan.' }
    }
    return { success: false, error: error.message }
  }

  await logActivity({
    userId: user.id,
    aksi: 'TAMBAH_PASIEN',
    targetTabel: 'pasien',
    targetId: data.id,
    detail: { nama: data.nama, nrm: data.nrm },
  })

  return { success: true, data: data as PasienRow }
}

// ---------------------------------------------------------------------------
// Get list of active doctors
// ---------------------------------------------------------------------------
export async function getActiveDokters(): Promise<
  { id: string; nama: string }[]
> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('users')
    .select('id, nama')
    .eq('role', 'dokter')
    .eq('aktif', true)
    .order('nama')

  return (data as { id: string; nama: string }[]) ?? []
}

// ---------------------------------------------------------------------------
// Create a new kunjungan (visit)
// ---------------------------------------------------------------------------
export async function createKunjungan(input: {
  pasien_id: string
  dokter_id: string
  tensi_sistolik?: number
  tensi_diastolik?: number
  nadi?: number
  suhu?: number
  keluhan_utama?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sesi habis. Silakan login ulang.' }
  }

  const { data, error } = await (supabase.from('kunjungan') as any).insert({
    pasien_id: input.pasien_id,
    dokter_id: input.dokter_id,
    staf_id: user.id,
    tanggal: new Date().toISOString().split('T')[0],
    tensi_sistolik: input.tensi_sistolik ?? null,
    tensi_diastolik: input.tensi_diastolik ?? null,
    nadi: input.nadi ?? null,
    suhu: input.suhu ?? null,
    keluhan_utama: input.keluhan_utama || null,
    status: 'menunggu',
  }).select('id').single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Fetch pasien info for activity log
  const { data: pasienData } = await supabase
    .from('pasien')
    .select('nama, nrm')
    .eq('id', input.pasien_id)
    .single()

  const pasien = pasienData as { nama: string; nrm: string } | null

  await logActivity({
    userId: user.id,
    aksi: 'DAFTAR_KUNJUNGAN',
    targetTabel: 'kunjungan',
    targetId: data.id,
    detail: {
      pasien_nama: pasien?.nama ?? '-',
      pasien_nrm: pasien?.nrm ?? '-',
      dokter_id: input.dokter_id,
    },
  })

  return { success: true }
}

// ---------------------------------------------------------------------------
// Get today's queue (antrian hari ini)
// ---------------------------------------------------------------------------
export interface AntrianItem {
  id: string
  no_urut: number
  pasien_nama: string
  pasien_nrm: string
  dokter_nama: string
  dokter_id: string | null
  jam_daftar: string
  status: string
}

export async function getAntrianHariIni(
  dokterId?: string
): Promise<AntrianItem[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('kunjungan')
    .select(`
      id,
      jam_daftar,
      status,
      dokter_id,
      pasien:pasien_id (nama, nrm),
      dokter:dokter_id (nama)
    `)
    .eq('tanggal', today)
    .order('jam_daftar', { ascending: true })

  if (dokterId) {
    query = query.eq('dokter_id', dokterId)
  }

  const { data } = await query

  if (!data) return []

  return (data as any[]).map((row: any, index: number) => ({
    id: row.id,
    no_urut: index + 1,
    pasien_nama: row.pasien?.nama ?? '-',
    pasien_nrm: row.pasien?.nrm ?? '-',
    dokter_nama: row.dokter?.nama ?? '-',
    dokter_id: row.dokter_id,
    jam_daftar: row.jam_daftar,
    status: row.status,
  }))
}
