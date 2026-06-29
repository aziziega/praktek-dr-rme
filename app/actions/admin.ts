'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { logActivity } from '@/lib/activity-logger'
import type { UserRole } from '@/types/database'

// ---------------------------------------------------------------------------
// 1. MANAJEMEN USER
// ---------------------------------------------------------------------------

export async function createUser(data: { email: string; nama: string; role: string; password: string }) {
  const supabase = await createClient()
  const serviceRoleClient = createServiceRoleClient()

  // Pastikan user adalah admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: adminUser } = await (supabase.from('users') as any).select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'admin') throw new Error('Unauthorized - Admin Only')

  const { data: authData, error: authError } = await serviceRoleClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  })

  if (authError) throw new Error(authError.message)
  if (!authData.user) throw new Error('Gagal membuat user di Auth')

  // Cek apakah data user sudah dibuat oleh trigger database auth.users -> public.users
  const newUserId = authData.user.id
  const { data: existingUser } = await (supabase.from('users') as any)
    .select('id')
    .eq('id', newUserId)
    .maybeSingle()

  let dbError;
  if (existingUser) {
    // Jika sudah ada (dibuat oleh trigger), update nama dan role sesuai form input
    const { error } = await (supabase.from('users') as any)
      .update({
        nama: data.nama,
        role: data.role as UserRole,
        aktif: true
      })
      .eq('id', newUserId)
    dbError = error
  } else {
    // Jika belum ada trigger, lakukan insert manual
    const { error } = await (supabase.from('users') as any).insert({
      id: newUserId,
      email: data.email,
      nama: data.nama,
      role: data.role as UserRole,
      aktif: true
    })
    dbError = error
  }

  if (dbError) {
    // Cleanup if db operation fails (delete from both Auth and public.users to prevent orphaned records)
    await serviceRoleClient.auth.admin.deleteUser(newUserId)
    await (supabase.from('users') as any).delete().eq('id', newUserId)
    throw new Error(dbError.message)
  }

  await logActivity({
    userId: user.id,
    aksi: 'TAMBAH_USER',
    targetTabel: 'users',
    targetId: newUserId,
    detail: { email: data.email, nama: data.nama, role: data.role },
  })
}

export async function updateUser(id: string, data: { nama: string; role: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Cek jika edit role diri sendiri
  if (id === user.id && data.role !== 'admin') {
    throw new Error('Tidak bisa menghapus role admin dari diri sendiri.')
  }

  const { error } = await (supabase.from('users') as any)
    .update({ nama: data.nama, role: data.role })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logActivity({
    userId: user.id,
    aksi: 'EDIT_USER',
    targetTabel: 'users',
    targetId: id,
    detail: { nama: data.nama, role: data.role },
  })
}

export async function toggleUserStatus(id: string, aktif: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (id === user.id) throw new Error('Tidak bisa menonaktifkan diri sendiri.')

  const { error } = await (supabase.from('users') as any)
    .update({ aktif })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logActivity({
    userId: user.id,
    aksi: aktif ? 'AKTIF_USER' : 'NONAKTIF_USER',
    targetTabel: 'users',
    targetId: id,
    detail: { aktif },
  })
}

export async function changeUserPassword(userId: string, newPassword: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify that the user is an admin
  const { data: adminUser } = await (supabase.from('users') as any).select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'admin') throw new Error('Unauthorized - Admin Only')

  if (newPassword.length < 6) throw new Error('Password minimal harus 6 karakter.')

  // Update in auth using service role
  const serviceRoleClient = createServiceRoleClient()
  const { error } = await serviceRoleClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) throw new Error(error.message)

  // Get name for logging
  const { data: targetUser } = await (supabase.from('users') as any)
    .select('email')
    .eq('id', userId)
    .single()

  await logActivity({
    userId: user.id,
    aksi: 'GANTI_PASSWORD_USER',
    targetTabel: 'users',
    targetId: userId,
    detail: { email: targetUser?.email },
  })
}

// ---------------------------------------------------------------------------
// 2. MANAJEMEN STOK OBAT
// ---------------------------------------------------------------------------

export async function createObat(data: { nama: string; satuan: string; stok: number; harga_jual: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: newObat, error } = await (supabase.from('obat') as any)
    .insert({
      nama: data.nama,
      satuan: data.satuan,
      stok: data.stok,
      harga_jual: data.harga_jual,
      aktif: true
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await logActivity({
    userId: user.id,
    aksi: 'TAMBAH_OBAT',
    targetTabel: 'obat',
    targetId: newObat.id,
    detail: { nama: data.nama, stok: data.stok },
  })
}

export async function updateObat(id: string, data: { nama: string; satuan: string; harga_jual: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await (supabase.from('obat') as any)
    .update({ nama: data.nama, satuan: data.satuan, harga_jual: data.harga_jual, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logActivity({
    userId: user.id,
    aksi: 'EDIT_OBAT',
    targetTabel: 'obat',
    targetId: id,
    detail: data,
  })
}

export async function addObatStock(id: string, amount: number) {
  if (amount <= 0) throw new Error('Jumlah stok tambahan harus lebih dari 0')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Ambil stok saat ini
  const { data: obat, error: fetchError } = await (supabase.from('obat') as any)
    .select('stok, nama')
    .eq('id', id)
    .single()

  if (fetchError || !obat) throw new Error('Obat tidak ditemukan')

  const newStock = obat.stok + amount

  const { error: updateError } = await (supabase.from('obat') as any)
    .update({ stok: newStock, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) throw new Error(updateError.message)

  await logActivity({
    userId: user.id,
    aksi: 'TAMBAH_STOK',
    targetTabel: 'obat',
    targetId: id,
    detail: { obat: obat.nama, tambah: amount, stok_akhir: newStock },
  })
}

export async function toggleObatStatus(id: string, aktif: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await (supabase.from('obat') as any)
    .update({ aktif, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logActivity({
    userId: user.id,
    aksi: aktif ? 'AKTIF_OBAT' : 'NONAKTIF_OBAT',
    targetTabel: 'obat',
    targetId: id,
    detail: { aktif },
  })
}

export async function deleteObat(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify that the user is an admin
  const { data: adminUser } = await (supabase.from('users') as any).select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'admin') throw new Error('Unauthorized - Admin Only')

  // Get name first for logging
  const { data: obat, error: fetchError } = await (supabase.from('obat') as any)
    .select('nama')
    .eq('id', id)
    .single()

  if (fetchError || !obat) throw new Error('Obat tidak ditemukan')

  const { error } = await (supabase.from('obat') as any)
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logActivity({
    userId: user.id,
    aksi: 'HAPUS_OBAT',
    targetTabel: 'obat',
    targetId: id,
    detail: { nama: obat.nama },
  })
}

// ---------------------------------------------------------------------------
// 3. MANAJEMEN PASIEN
// ---------------------------------------------------------------------------

export async function updatePasien(id: string, data: { nama: string; tanggal_lahir?: string; tempat_lahir?: string; jenis_kelamin?: string; alamat?: string; no_hp?: string; alergi_obat?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await (supabase.from('pasien') as any)
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logActivity({
    userId: user.id,
    aksi: 'EDIT_PASIEN',
    targetTabel: 'pasien',
    targetId: id,
    detail: { nama: data.nama },
  })
}

export async function importPasien(data: { nrm: number; nama: string; tanggal_lahir?: string; tempat_lahir?: string; jenis_kelamin?: string; alamat?: string; no_hp?: string; alergi_obat?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Pastikan NRM unik
  const { count } = await (supabase.from('pasien') as any)
    .select('*', { count: 'exact', head: true })
    .eq('nrm', data.nrm)
  
  if (count && count > 0) {
    throw new Error(`NRM ${data.nrm} sudah terdaftar.`)
  }

  const { data: newPasien, error } = await (supabase.from('pasien') as any)
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)

  await logActivity({
    userId: user.id,
    aksi: 'IMPORT_PASIEN',
    targetTabel: 'pasien',
    targetId: newPasien.id,
    detail: { nrm: data.nrm, nama: data.nama },
  })
}

// ---------------------------------------------------------------------------
// 4. ADMIN MONITORING (ATTENDANCE & ACTIVITY LOGS)
// ---------------------------------------------------------------------------

export async function getAllUsers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await (supabase.from('users') as any)
    .select('id, nama, role, email, aktif')
    .order('nama', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getAttendanceLogs(filters: {
  startDate?: string
  endDate?: string
  userId?: string
  role?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: adminUser } = await (supabase.from('users') as any).select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'admin') throw new Error('Unauthorized - Admin Only')

  let query = supabase
    .from('attendance_logs')
    .select(`
      *,
      users:user_id (
        nama,
        role
      )
    `)

  if (filters.startDate) {
    query = query.gte('tanggal', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('tanggal', filters.endDate)
  }
  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }

  const { data, error } = await query
    .order('tanggal', { ascending: false })
    .order('jam_masuk', { ascending: false })

  if (error) throw new Error(error.message)

  let filteredData = data || []
  if (filters.role) {
    filteredData = filteredData.filter((log: any) => log.users?.role === filters.role)
  }

  return filteredData
}

export async function getActivityLogs(filters: {
  startDate?: string
  endDate?: string
  userId?: string
  aksi?: string[]
}, page = 1, limit = 50) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: adminUser } = await (supabase.from('users') as any).select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'admin') throw new Error('Unauthorized - Admin Only')

  let query = supabase
    .from('activity_logs')
    .select(`
      *,
      users:user_id (
        nama,
        role
      )
    `, { count: 'exact' })

  if (filters.startDate) {
    query = query.gte('created_at', `${filters.startDate}T00:00:00.000Z`)
  }
  if (filters.endDate) {
    query = query.lte('created_at', `${filters.endDate}T23:59:59.999Z`)
  }
  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }
  if (filters.aksi && filters.aksi.length > 0) {
    query = query.in('aksi', filters.aksi)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query
    .order('created_at', { ascending: false })
    .range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data: data || [],
    count: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

// ---------------------------------------------------------------------------
// 5. SERVER-SIDE READ ACTIONS FOR STUCK SKELETON RESOLUTION
// ---------------------------------------------------------------------------

export async function getAdminUsers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify that the user is an admin
  const { data: adminUser } = await (supabase.from('users') as any).select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'admin') throw new Error('Unauthorized - Admin Only')

  const { data, error } = await (supabase.from('users') as any)
    .select('id, email, nama, role, aktif, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getAdminPasien(search?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify that the user is an admin
  const { data: adminUser } = await (supabase.from('users') as any).select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'admin') throw new Error('Unauthorized - Admin Only')

  let query = supabase.from('pasien').select('*').order('nrm', { ascending: true }).limit(50)

  if (search) {
    const isNumeric = /^\d+$/.test(search)
    if (isNumeric) {
      query = query.or(`nrm.eq.${parseInt(search, 10)},nama.ilike.%${search}%`)
    } else {
      query = query.ilike('nama', `%${search}%`)
    }
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function getRiwayatKunjunganPasien(pasienId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify that the user is an admin
  const { data: adminUser } = await (supabase.from('users') as any).select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'admin') throw new Error('Unauthorized - Admin Only')

  const serviceRoleClient = createServiceRoleClient()
  const { data, error } = await serviceRoleClient
    .from('kunjungan')
    .select(`
      *,
      rekam_medis (*),
      dokter:users!kunjungan_dokter_id_fkey(nama),
      resep_obat (nama_obat, dosis, jumlah)
    `)
    .eq('pasien_id', pasienId)
    .order('jam_daftar', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getAdminObat() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify that the user is an admin
  const { data: adminUser } = await (supabase.from('users') as any).select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'admin') throw new Error('Unauthorized - Admin Only')

  const { data, error } = await (supabase.from('obat') as any)
    .select('*')
    .order('nama', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

// ---------------------------------------------------------------------------
// 6. DELETE PASIEN (HARD DELETE - ADMIN ONLY)
// ---------------------------------------------------------------------------

export async function deletePasien(id: string, nama: string, nrm: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify that the user is an admin
  const { data: adminUser } = await (supabase.from('users') as any).select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'admin') throw new Error('Unauthorized - Admin Only')

  // Hard delete - CASCADE will automatically delete all related data:
  // - kunjungan, rekam_medis, resep_obat, pembayaran
  const { error } = await (supabase.from('pasien') as any)
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logActivity({
    userId: user.id,
    aksi: 'HAPUS_PASIEN',
    targetTabel: 'pasien',
    targetId: id,
    detail: { nama, nrm },
  })
}

// ---------------------------------------------------------------------------
// 7. GET PATIENT DELETE PREVIEW (DETAILED DATA FOR CONFIRMATION)
// ---------------------------------------------------------------------------

export async function getPatientDeletePreview(patientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify that the user is an admin
  const { data: adminUser } = await (supabase.from('users') as any).select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'admin') throw new Error('Unauthorized - Admin Only')

  // Fetch all related data for preview using service role for complete access
  const serviceRoleClient = createServiceRoleClient()
  
  const { data: kunjungan, error } = await serviceRoleClient
    .from('kunjungan')
    .select(`
      id,
      tanggal,
      resep_obat (
        nama_obat,
        dosis,
        jumlah,
        harga_satuan,
        subtotal,
        obat_id
      ),
      pembayaran (
        total_bayar,
        tarif_periksa,
        total_obat
      )
    `)
    .eq('pasien_id', patientId)
    .order('tanggal', { ascending: false })

  if (error) throw new Error(error.message)

  // Calculate totals
  const totalVisits = kunjungan?.length || 0
  const totalRevenue = (kunjungan as any[])?.reduce((sum: number, k: any) => {
    const payments = Array.isArray(k.pembayaran) ? k.pembayaran : (k.pembayaran ? [k.pembayaran] : [])
    return sum + (payments[0]?.total_bayar || 0)
  }, 0) || 0

  // Group medicines and track which ones will have stock restored
  const medicineMap = new Map<string, { jumlah: number; willRestore: boolean }>()
  ;(kunjungan as any[])?.forEach((k: any) => {
    const resepArray = Array.isArray(k.resep_obat) ? k.resep_obat : (k.resep_obat ? [k.resep_obat] : [])
    resepArray.forEach((r: any) => {
      const key = r.nama_obat
      const existing = medicineMap.get(key) || { jumlah: 0, willRestore: false }
      medicineMap.set(key, {
        jumlah: existing.jumlah + (r.jumlah || 0),
        willRestore: existing.willRestore || (r.obat_id != null)
      })
    })
  })

  const medicines = Array.from(medicineMap.entries()).map(([nama, data]) => ({
    nama_obat: nama,
    total_jumlah: data.jumlah,
    will_restore_stock: data.willRestore
  }))

  return {
    totalVisits,
    totalRevenue,
    medicines,
    hasData: totalVisits > 0
  }
}

// ---------------------------------------------------------------------------
// 8. KEUANGAN — LAPORAN PENDAPATAN
// ---------------------------------------------------------------------------

export async function getKeuanganSummary(bulan: number, tahun: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: adminUser } = await (supabase.from('users') as any).select('role').eq('id', user.id).single()
  if (adminUser?.role !== 'admin') throw new Error('Unauthorized - Admin Only')

  const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01T00:00:00`
  const lastDay = new Date(tahun, bulan, 0).getDate()
  const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-${lastDay}T23:59:59`

  const { data, error } = await (supabase.from('pembayaran') as any)
    .select('tarif_periksa, total_obat, total_bayar')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('status', 'lunas')

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as { tarif_periksa: number; total_obat: number; total_bayar: number }[]

  return {
    totalPendapatan: rows.reduce((s, r) => s + Number(r.total_bayar), 0),
    totalPeriksa: rows.reduce((s, r) => s + Number(r.tarif_periksa), 0),
    totalObat: rows.reduce((s, r) => s + Number(r.total_obat), 0),
    jumlahTransaksi: rows.length,
  }
}

export async function getKeuanganChart(tahun: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const startDate = `${tahun}-01-01T00:00:00`
  const endDate = `${tahun}-12-31T23:59:59`

  const { data, error } = await (supabase.from('pembayaran') as any)
    .select('tarif_periksa, total_obat, total_bayar, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('status', 'lunas')

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as { tarif_periksa: number; total_obat: number; total_bayar: number; created_at: string }[]

  const months = Array.from({ length: 12 }, (_, i) => ({
    bulan: i + 1,
    label: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][i],
    pendapatan: 0,
    periksa: 0,
    obat: 0,
    transaksi: 0,
  }))

  for (const row of rows) {
    const month = new Date(row.created_at).getMonth()
    months[month].pendapatan += Number(row.total_bayar)
    months[month].periksa += Number(row.tarif_periksa)
    months[month].obat += Number(row.total_obat)
    months[month].transaksi += 1
  }

  return months
}

export async function getKeuanganDetail(bulan: number, tahun: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01T00:00:00`
  const lastDay = new Date(tahun, bulan, 0).getDate()
  const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-${lastDay}T23:59:59`

  const { data, error } = await (supabase.from('pembayaran') as any)
    .select(`
      id,
      tarif_periksa,
      total_obat,
      total_bayar,
      metode_bayar,
      status,
      catatan,
      created_at,
      kunjungan:kunjungan_id (
        id,
        tanggal,
        jam_daftar,
        pasien:pasien_id ( id, nrm, nama ),
        resep_obat ( nama_obat, dosis, jumlah, harga_satuan, subtotal )
      ),
      dokter:dokter_id ( id, nama )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []) as any[]
}
