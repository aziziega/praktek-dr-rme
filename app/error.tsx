'use client'

import { useEffect } from 'react'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to an activity tracker or console
    console.error('[System Error Runtime]:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated Warning Icon */}
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-md">
          <AlertCircle className="h-10 w-10 animate-bounce" />
        </div>

        {/* Error Info */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-900">Terjadi Kesalahan Sistem</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
            Sistem mendeteksi kesalahan yang tidak terduga pada sesi ini. Mohon muat ulang halaman atau coba lagi beberapa saat lagi.
          </p>
          {error.message && (
            <div className="mt-3 p-3 bg-rose-50/50 border border-rose-100 rounded-lg max-w-xs mx-auto">
              <p className="text-xs font-mono font-bold text-rose-800 break-all leading-normal">
                Error: {error.message}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button onClick={reset} variant="outline" className="h-10 gap-2 border-gray-200">
            <RotateCcw className="h-4 w-4" />
            Coba Lagi
          </Button>
          <Button asChild className="h-10 gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-md border-none">
            <Link href="/">
              <Home className="h-4 w-4" />
              Kembali Ke Beranda
            </Link>
          </Button>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider pt-6">
          System Diagnostics Code: {error.digest || 'NONE'}
        </p>
      </div>
    </div>
  )
}
