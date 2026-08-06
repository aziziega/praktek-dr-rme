'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { logActivity } from '@/lib/activity-logger'
import { revalidatePath } from 'next/cache'
import type {
  KunjunganRow,
  PasienRow,
  RekamMedisRow,
  ObatRow,
  StatusKunjungan,
} from '@/types/database'

// ---------------------------------------------------------------------------
// Types for dokter server actions
// ---------------------------------------------------------------------------

export interface AntrianDokterItem {
  id: string
  pasien_id: string
  pasien_nama: string
  pasien_nrm: number
  pasien_tanggal_lahir: string | null
  pasien_jenis_kelamin: string | null
  pasien_alergi_obat: string | null
  jam_daftar: string
  tensi_sistolik: number | null
  tensi_diastolik: number | null
  nadi: number | null
  suhu: number | null
  keluhan_utama: string | null
  status: string
}

export interface KunjunganDetail {
  kunjungan: KunjunganRow
  pasien: PasienRow
  rekamMedis: RekamMedisRow | null
}

export interface RiwayatItem {
  id: string
  tanggal: string
  jam_daftar?: string | null
  status: string
  keluhan_utama: string | null
  diagnosis_nama: string | null
  diagnosis_kode: string | null
  dokter_nama: string | null
  tensi_sistolik?: number | null
  tensi_diastolik?: number | null
  nadi?: number | null
  suhu?: number | null
  anamnesis?: string | null
  pemeriksaan_fisik?: string | null
  terapi?: string | null
  catatan?: string | null
  anamnesis_handwriting_url?: string | null
  diagnosis_handwriting_url?: string | null
  terapi_handwriting_url?: string | null
  resep?: { nama_obat: string; dosis: string; jumlah: number }[]
}

export interface ResepItem {
  obat_id: string | null
  nama_obat: string
  dosis: string
  jumlah: number
  harga_satuan: number
}

// ---------------------------------------------------------------------------
// 1. Get today's queue for logged-in doctor
// ---------------------------------------------------------------------------
export async function getAntrianDokter(tanggal?: string): Promise<AntrianDokterItem[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const targetDate = tanggal || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

  const { data } = await supabase
    .from('kunjungan')
    .select(`
      id,
      pasien_id,
      jam_daftar,
      tensi_sistolik,
      tensi_diastolik,
      nadi,
      suhu,
      keluhan_utama,
      status,
      pasien:pasien_id (nama, nrm, tanggal_lahir, jenis_kelamin, alergi_obat)
    `)
    .eq('dokter_id', user.id)
    .eq('tanggal', targetDate)
    .order('jam_daftar', { ascending: true })

  if (!data) return []

  const statusPriority: Record<string, number> = {
    'diperiksa': 1,
    'menunggu': 2,
    'selesai': 3
  }

  const mapped = (data as any[]).map((row) => ({
    id: row.id,
    pasien_id: row.pasien_id,
    pasien_nama: row.pasien?.nama ?? '-',
    pasien_nrm: row.pasien?.nrm ?? 0,
    pasien_tanggal_lahir: row.pasien?.tanggal_lahir ?? null,
    pasien_jenis_kelamin: row.pasien?.jenis_kelamin ?? null,
    pasien_alergi_obat: row.pasien?.alergi_obat ?? null,
    jam_daftar: row.jam_daftar,
    tensi_sistolik: row.tensi_sistolik,
    tensi_diastolik: row.tensi_diastolik,
    nadi: row.nadi,
    suhu: row.suhu,
    keluhan_utama: row.keluhan_utama,
    status: row.status,
  }))

  return mapped.sort((a, b) => {
    const priorityA = statusPriority[a.status] ?? 99
    const priorityB = statusPriority[b.status] ?? 99
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    // Jika status sama, urutkan berdasarkan waktu daftar terawal (ascending)
    return new Date(a.jam_daftar).getTime() - new Date(b.jam_daftar).getTime()
  })
}

// ---------------------------------------------------------------------------
// 2. Get kunjungan detail for examination page
// ---------------------------------------------------------------------------
export async function getKunjunganDetail(
  kunjunganId: string
): Promise<{ success: boolean; data?: KunjunganDetail; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesi habis.' }

  // Fetch kunjungan
  const { data: kunjungan, error: kErr } = await supabase
    .from('kunjungan')
    .select('*')
    .eq('id', kunjunganId)
    .single()

  if (kErr || !kunjungan) {
    return { success: false, error: 'Kunjungan tidak ditemukan.' }
  }

  const k = kunjungan as KunjunganRow

  // Validate ownership
  if (k.dokter_id !== user.id) {
    return { success: false, error: 'Akses ditolak.' }
  }

  // Fetch pasien
  const { data: pasien } = await supabase
    .from('pasien')
    .select('*')
    .eq('id', k.pasien_id)
    .single()

  if (!pasien) {
    return { success: false, error: 'Data pasien tidak ditemukan.' }
  }

  // Fetch rekam medis (may not exist yet)
  const { data: rm } = await supabase
    .from('rekam_medis')
    .select('*')
    .eq('kunjungan_id', kunjunganId)
    .single()

  return {
    success: true,
    data: {
      kunjungan: k,
      pasien: pasien as PasienRow,
      rekamMedis: rm ? (rm as unknown as RekamMedisRow) : null,
    },
  }
}

// ---------------------------------------------------------------------------
// 3. Get patient visit history (last 5, exclude current)
// ---------------------------------------------------------------------------
export async function getRiwayatKunjungan(
  pasienId: string,
  currentKunjunganId: string
): Promise<RiwayatItem[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('kunjungan')
    .select(`
      id,
      tanggal,
      jam_daftar,
      status,
      keluhan_utama,
      tensi_sistolik,
      tensi_diastolik,
      nadi,
      suhu,
      dokter:dokter_id (nama),
      rekam_medis (anamnesis, pemeriksaan_fisik, diagnosis_nama, diagnosis_kode, terapi, catatan, anamnesis_handwriting_url, diagnosis_handwriting_url, terapi_handwriting_url),
      resep_obat (nama_obat, dosis, jumlah)
    `)
    .eq('pasien_id', pasienId)
    .neq('id', currentKunjunganId)
    .order('jam_daftar', { ascending: false })
    .limit(100)

  if (!data) return []

  return (data as any[]).map((row) => ({
    id: row.id,
    tanggal: row.tanggal,
    jam_daftar: row.jam_daftar,
    status: row.status,
    keluhan_utama: row.keluhan_utama,
    tensi_sistolik: row.tensi_sistolik,
    tensi_diastolik: row.tensi_diastolik,
    nadi: row.nadi,
    suhu: row.suhu,
    diagnosis_nama: (row.rekam_medis as any)?.diagnosis_nama ?? null,
    diagnosis_kode: (row.rekam_medis as any)?.diagnosis_kode ?? null,
    anamnesis: (row.rekam_medis as any)?.anamnesis ?? null,
    pemeriksaan_fisik: (row.rekam_medis as any)?.pemeriksaan_fisik ?? null,
    terapi: (row.rekam_medis as any)?.terapi ?? null,
    catatan: (row.rekam_medis as any)?.catatan ?? null,
    anamnesis_handwriting_url: (row.rekam_medis as any)?.anamnesis_handwriting_url ?? null,
    diagnosis_handwriting_url: (row.rekam_medis as any)?.diagnosis_handwriting_url ?? null,
    terapi_handwriting_url: (row.rekam_medis as any)?.terapi_handwriting_url ?? null,
    dokter_nama: row.dokter?.nama ?? null,
    resep: row.resep_obat ?? []
  }))
}

// ---------------------------------------------------------------------------
// 4. Update kunjungan status
// ---------------------------------------------------------------------------
export async function updateStatusKunjungan(
  kunjunganId: string,
  status: StatusKunjungan
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesi habis.' }

  // Validate ownership
  const { data: kunjungan } = await supabase
    .from('kunjungan')
    .select('dokter_id')
    .eq('id', kunjunganId)
    .single()

  if (!kunjungan || (kunjungan as any).dokter_id !== user.id) {
    return { success: false, error: 'Akses ditolak.' }
  }

  const { error } = await (supabase.from('kunjungan') as any)
    .update({ status })
    .eq('id', kunjunganId)

  if (error) return { success: false, error: error.message }

  // Bust Next.js cache so the periksa page loads fresh data
  revalidatePath('/dashboard/dokter/periksa/[kunjunganId]', 'page')
  revalidatePath('/dashboard/dokter/antrian')

  return { success: true }
}

// ---------------------------------------------------------------------------
// 5. Save rekam medis (upsert)
// ---------------------------------------------------------------------------
export async function saveRekamMedis(input: {
  kunjunganId: string
  anamnesis?: string
  pemeriksaan_fisik?: string
  diagnosis_kode?: string
  diagnosis_nama?: string
  terapi?: string
  catatan?: string
  anamnesis_handwriting_url?: string | null
  diagnosis_handwriting_url?: string | null
  terapi_handwriting_url?: string | null
  tensi_sistolik?: number | null
  tensi_diastolik?: number | null
  nadi?: number | null
  suhu?: number | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesi habis.' }

  // 1. Save vital signs to kunjungan table if provided
  if (
    input.tensi_sistolik !== undefined ||
    input.tensi_diastolik !== undefined ||
    input.nadi !== undefined ||
    input.suhu !== undefined
  ) {
    const { error: kError } = await (supabase.from('kunjungan') as any)
      .update({
        tensi_sistolik: input.tensi_sistolik,
        tensi_diastolik: input.tensi_diastolik,
        nadi: input.nadi,
        suhu: input.suhu,
      })
      .eq('id', input.kunjunganId)

    if (kError) return { success: false, error: 'Gagal memperbarui vital sign: ' + kError.message }
  }

  // 2. Save rekam medis (upsert)
  const { data: existing } = await supabase
    .from('rekam_medis')
    .select('id')
    .eq('kunjungan_id', input.kunjunganId)
    .single()

  const payload: Record<string, any> = {
    anamnesis: input.anamnesis || null,
    pemeriksaan_fisik: input.pemeriksaan_fisik || null,
    diagnosis_kode: input.diagnosis_kode || null,
    diagnosis_nama: input.diagnosis_nama || null,
    terapi: input.terapi || null,
    catatan: input.catatan || null,
    updated_at: new Date().toISOString(),
  }

  if (input.anamnesis_handwriting_url !== undefined) {
    payload.anamnesis_handwriting_url = input.anamnesis_handwriting_url
  }
  if (input.diagnosis_handwriting_url !== undefined) {
    payload.diagnosis_handwriting_url = input.diagnosis_handwriting_url
  }
  if (input.terapi_handwriting_url !== undefined) {
    payload.terapi_handwriting_url = input.terapi_handwriting_url
  }

  if (existing) {
    // Update
    const { error } = await (supabase.from('rekam_medis') as any)
      .update(payload)
      .eq('kunjungan_id', input.kunjunganId)

    if (error) return { success: false, error: error.message }
  } else {
    // Insert
    const { error } = await (supabase.from('rekam_medis') as any).insert({
      kunjungan_id: input.kunjunganId,
      dokter_id: user.id,
      ...payload,
    })

    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// 5b. Upload handwriting canvas PNG image to Supabase Storage
// ---------------------------------------------------------------------------
export async function uploadHandwritingImage(
  base64DataUrl: string,
  field: 'anamnesis' | 'diagnosis' | 'terapi',
  kunjunganId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Sesi habis.' }

    const commaIndex = base64DataUrl.indexOf(',')
    if (commaIndex === -1) {
      return { success: false, error: 'Format gambar base64 tidak valid.' }
    }

    const base64Str = base64DataUrl.substring(commaIndex + 1)
    const imageBuffer = Buffer.from(base64Str, 'base64')
    const fileName = `${kunjunganId}_${field}_${Date.now()}.png`
    const filePath = `handwriting/${fileName}`

    // Gunakan admin client (bypassing RLS) karena upsert membutuhkan SELECT & UPDATE yang terkadang gagal pada RLS storage
    const { createClient: createSupabaseJs } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return { success: false, error: 'Server configuration error (missing Supabase keys)' }
    }

    const adminSupabase = createSupabaseJs(supabaseUrl, serviceRoleKey)

    // 1. Upload dengan admin client
    const uploadRes = await adminSupabase.storage
      .from('handwriting-notes')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadRes.error) {
      console.error('[uploadHandwritingImage] Upload error:', uploadRes.error)
      return { success: false, error: `Gagal upload gambar: ${uploadRes.error.message}` }
    }

    // Gunakan internal API route untuk signed URL proxy
    const proxyUrl = `/api/handwriting?path=${encodeURIComponent(filePath)}`

    return { success: true, url: proxyUrl }
  } catch (err: any) {
    console.error('[uploadHandwritingImage] Exception:', err)
    return { success: false, error: err.message || 'Gagal mengunggah gambar tulisan tangan' }
  }
}

// ---------------------------------------------------------------------------
// 6. Search obat aktif
// ---------------------------------------------------------------------------
export async function searchObat(query: string): Promise<ObatRow[]> {
  if (!query || query.trim().length < 2) return []

  const supabase = await createClient()

  const { data } = await supabase
    .from('obat')
    .select('*')
    .eq('aktif', true)
    .ilike('nama', `%${query.trim()}%`)
    .order('nama')
    .limit(10)

  return (data as ObatRow[]) ?? []
}

export async function getAllActiveObat(): Promise<ObatRow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('obat')
    .select('*')
    .eq('aktif', true)
    .order('nama', { ascending: true })

  return (data as ObatRow[]) ?? []
}


// ---------------------------------------------------------------------------
// 7. Get existing resep for a kunjungan
// ---------------------------------------------------------------------------
export async function getResepKunjungan(
  kunjunganId: string
): Promise<ResepItem[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('resep_obat')
    .select('obat_id, nama_obat, dosis, jumlah, harga_satuan')
    .eq('kunjungan_id', kunjunganId)
    .order('created_at', { ascending: true })

  if (!data) return []

  return (data as any[]).map((row) => ({
    obat_id: row.obat_id,
    nama_obat: row.nama_obat,
    dosis: row.dosis,
    jumlah: row.jumlah,
    harga_satuan: Number(row.harga_satuan),
  }))
}

// ---------------------------------------------------------------------------
// 8. Selesaikan kunjungan (complete visit + payment)
// ---------------------------------------------------------------------------
export async function selesaikanKunjungan(input: {
  kunjunganId: string
  // Rekam medis
  anamnesis?: string
  pemeriksaan_fisik?: string
  diagnosis_kode?: string
  diagnosis_nama?: string
  terapi?: string
  catatan_medis?: string
  anamnesis_handwriting_url?: string | null
  diagnosis_handwriting_url?: string | null
  terapi_handwriting_url?: string | null
  // Vital signs
  tensi_sistolik?: number
  tensi_diastolik?: number
  nadi?: number
  suhu?: number
  // Resep
  resepItems: ResepItem[]
  // Pembayaran
  tarif_periksa: number
  catatan_bayar?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Sesi habis.' }

  // Validate ownership
  const { data: kunjungan } = await supabase
    .from('kunjungan')
    .select('dokter_id, status')
    .eq('id', input.kunjunganId)
    .single()

  if (!kunjungan || (kunjungan as any).dokter_id !== user.id) {
    return { success: false, error: 'Akses ditolak.' }
  }

  if ((kunjungan as any).status === 'selesai') {
    return { success: false, error: 'Kunjungan sudah diselesaikan.' }
  }

  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    const payload = {
      kunjunganId: input.kunjunganId,
      dokterId: user.id,
      tarif_periksa: input.tarif_periksa,
      catatan_bayar: input.catatan_bayar,
      resepItems: input.resepItems,
      anamnesis: input.anamnesis,
      pemeriksaan_fisik: input.pemeriksaan_fisik,
      diagnosis_kode: input.diagnosis_kode,
      diagnosis_nama: input.diagnosis_nama,
      terapi: input.terapi,
      catatan_medis: input.catatan_medis,
      anamnesis_handwriting_url: input.anamnesis_handwriting_url,
      diagnosis_handwriting_url: input.diagnosis_handwriting_url,
      terapi_handwriting_url: input.terapi_handwriting_url,
      tensi_sistolik: input.tensi_sistolik,
      tensi_diastolik: input.tensi_diastolik,
      nadi: input.nadi,
      suhu: input.suhu,
      tanggal_hari_ini: today
    }

    const { data, error } = await (supabase.rpc as any)('selesaikan_kunjungan_trx', {
      payload: payload
    })

    if (error) {
      console.error('[selesaikanKunjungan] RPC Error:', error)
      return { success: false, error: error.message }
    }

    if (data && !data.success) {
      console.error('[selesaikanKunjungan] Logika RPC Error:', data.error)
      return { success: false, error: data.error }
    }

    return { success: true }
  } catch (err) {
    console.error('[selesaikanKunjungan] Exception:', err)
    return { success: false, error: 'Terjadi kesalahan saat menyelesaikan kunjungan.' }
  }
}
