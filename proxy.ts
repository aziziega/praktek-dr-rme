import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { UserRole } from '@/types/database'

// Role-based default redirect paths
const ROLE_REDIRECTS: Record<UserRole, string> = {
  staf: '/dashboard/staf/pendaftaran',
  dokter: '/dashboard/dokter/antrian',
  admin: '/dashboard/admin/users',
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Ambil user data untuk memverifikasi token JWT dari server Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // --- Protected routes: /dashboard/* ---
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // OPTIMASI: Jika ini adalah prefetch request (Next.js Link hover), bypass query database
    // karena Layout.tsx akan memvalidasi ulang secara penuh saat transisi halaman sebenarnya terjadi.
    const isPrefetch = request.headers.get('x-middleware-prefetch') === '1' || request.headers.get('purpose') === 'prefetch'
    if (isPrefetch) {
      return supabaseResponse
    }

    // Ambil data user dari tabel users
    const { data } = await supabase
      .from('users')
      .select('role, aktif')
      .eq('id', user.id)
      .single()

    const userData = data as { role: string; aktif: boolean } | null

    if (!userData || !userData.aktif) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const role = userData.role as UserRole

    // Redirect root /dashboard ke halaman default role masing-masing
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      const url = request.nextUrl.clone()
      url.pathname = ROLE_REDIRECTS[role]
      return NextResponse.redirect(url)
    }

    // Batasi akses sub-route berdasarkan role (kecuali admin)
    if (role !== 'admin') {
      const allowedPrefix = `/dashboard/${role}`
      if (!pathname.startsWith(allowedPrefix)) {
        const url = request.nextUrl.clone()
        url.pathname = ROLE_REDIRECTS[role]
        return NextResponse.redirect(url)
      }
    }
  }

  // --- Kembalikan user terautentikasi agar tidak bisa buka halaman login ---
  if (pathname === '/login' || pathname === '/') {
    if (user) {
      const { data: loginUserData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      const userInfo = loginUserData as { role: string } | null

      if (userInfo) {
        const role = userInfo.role as UserRole
        const url = request.nextUrl.clone()
        url.pathname = ROLE_REDIRECTS[role]
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

// OPTIMASI: Hanya jalankan proxy middleware pada rute HTML utama untuk performa maksimal
export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
  ],
}
