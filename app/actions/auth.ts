'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function logout() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

      // Get today's attendance log that hasn't checked out yet
      const { data: existing } = await (supabase.from('attendance_logs') as any)
        .select('id, jam_masuk')
        .eq('user_id', user.id)
        .eq('tanggal', today)
        .is('jam_keluar', null)
        .single()

      if (existing) {
        const ext = existing as any
        const jamMasuk = new Date(ext.jam_masuk)
        const jamKeluar = new Date()
        const diffMs = jamKeluar.getTime() - jamMasuk.getTime()
        const durasiMenit = Math.max(0, Math.round(diffMs / (1000 * 60)))

        await (supabase.from('attendance_logs') as any)
          .update({
            jam_keluar: jamKeluar.toISOString(),
            durasi_menit: durasiMenit,
          })
          .eq('id', ext.id)
      }
    }
  } catch (err) {
    console.error('[Attendance] Error recording sign-out on logout:', err)
  }

  await supabase.auth.signOut()
  redirect('/login?logout=true')
}

export async function loginWithEmail(email: string, password: string) {
  const supabase = await createClient()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    if (signInError.message.includes('Invalid login credentials')) {
      return { error: 'Email atau password salah.' }
    }
    return { error: signInError.message }
  }

  // Fetch user role
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Gagal mendapatkan data user.' }
  }

  const { data } = await supabase
    .from('users')
    .select('role, aktif')
    .eq('id', user.id)
    .single()

  const userData = data as { role: string; aktif: boolean } | null

  if (!userData) {
    await supabase.auth.signOut()
    return { error: 'Akun belum terdaftar di sistem. Hubungi admin.' }
  }

  if (!userData.aktif) {
    await supabase.auth.signOut()
    return { error: 'Akun Anda telah dinonaktifkan. Hubungi admin.' }
  }

  const ROLE_REDIRECTS: Record<string, string> = {
    staf: '/dashboard/staf/pendaftaran',
    dokter: '/dashboard/dokter/antrian',
    admin: '/dashboard/admin/overview',
  }

  const targetUrl = ROLE_REDIRECTS[userData.role] || '/dashboard'
  
  // Return success info, we will redirect in the client 
  // because next/navigation redirect in server action sometimes has edge cases
  // when used with client-side forms and useRouter
  return { success: true, redirectUrl: targetUrl }
}

export async function resolveBreadcrumbLabel(uuid: string): Promise<string | null> {
  console.log('[resolveBreadcrumbLabel] Called with UUID:', uuid)

  // Use service role to safely bypass strict read RLS policies for UI breadcrumbs
  const serviceClient = createServiceRoleClient()

  // 1. Try to find in kunjungan (associated with a patient)
  console.log('[resolveBreadcrumbLabel] Querying kunjungan table for:', uuid)
  const { data: kunjunganData, error: kunjunganError } = await serviceClient
    .from('kunjungan')
    .select('pasien:pasien_id (nama)')
    .eq('id', uuid)
    .single()

  if (kunjunganError) {
    console.log('[resolveBreadcrumbLabel] Kunjungan query error:', kunjunganError.message)
  }

  if (kunjunganData && (kunjunganData as any).pasien?.nama) {
    console.log('[resolveBreadcrumbLabel] Found patient name in kunjungan:', (kunjunganData as any).pasien.nama)
    return (kunjunganData as any).pasien.nama
  }

  // 2. Try to find in pasien directly
  console.log('[resolveBreadcrumbLabel] Querying pasien table directly for:', uuid)
  const { data: pasienData, error: pasienError } = await serviceClient
    .from('pasien')
    .select('nama')
    .eq('id', uuid)
    .single()

  if (pasienError) {
    console.log('[resolveBreadcrumbLabel] Pasien query error:', pasienError.message)
  }

  if (pasienData && (pasienData as any).nama) {
    console.log('[resolveBreadcrumbLabel] Found patient name in pasien table:', (pasienData as any).nama)
    return (pasienData as any).nama
  }

  console.log('[resolveBreadcrumbLabel] No matching record found for UUID:', uuid)
  return null
}


