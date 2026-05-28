'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
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
    admin: '/dashboard/admin/users',
  }

  const targetUrl = ROLE_REDIRECTS[userData.role] || '/dashboard'
  
  // Return success info, we will redirect in the client 
  // because next/navigation redirect in server action sometimes has edge cases
  // when used with client-side forms and useRouter
  return { success: true, redirectUrl: targetUrl }
}
