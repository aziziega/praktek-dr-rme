'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { UserRole } from '@/types/database'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Stethoscope, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { loginWithEmail } from '@/app/actions/auth'

const ROLE_REDIRECTS: Record<UserRole, string> = {
  staf: '/dashboard/staf/pendaftaran',
  dokter: '/dashboard/dokter/antrian',
  admin: '/dashboard/admin/overview',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Show logout toast if page is accessed with ?logout=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('logout') === 'true') {
        toast.success('Anda telah berhasil keluar dari sistem.', {
          description: 'Sesi kerja Anda telah diakhiri dengan aman.',
          duration: 5000,
        })
        // Clean up URL parameters without reloading
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
        
        // Reset sessionStorage key to trigger new welcome toast on next login
        sessionStorage.clear()
      }
    }
  }, [])

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await loginWithEmail(email, password)

      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
        setLoading(false)
        return
      }

      if (result?.success && result.redirectUrl) {
        toast.success('Login berhasil! Mengalihkan ke dashboard...')
        router.push(result.redirectUrl)
        router.refresh()
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
      toast.error('Terjadi kesalahan saat masuk. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 relative z-10">
      {/* Tombol Kembali ke Landing Page */}
      <div className="flex justify-start">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Beranda
        </Link>
      </div>

      {/* Header / Branding */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 shadow-lg shadow-primary/25">
          <Stethoscope className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Praktek Dr. Umum Sudiman
        </h1>
        <p className="text-sm text-muted-foreground">
          Sistem Rekam Medis Elektronik
        </p>
      </div>

      {/* Login Card */}
      <Card className="border-border shadow-xl bg-card text-card-foreground">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Masuk ke Sistem</CardTitle>
          <CardDescription>
            Gunakan email dan password yang telah didaftarkan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground">
        Gupolo Rt. 04 Rw. 02, Cucukan, Prambanan, Klaten 57454
      </p>
    </div>
  )
}
