'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Stethoscope, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated Icon */}
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-lg shadow-sky-500/20 text-white animate-pulse">
          <Stethoscope className="h-10 w-10" />
        </div>

        {/* Error Info */}
        <div className="space-y-2">
          <h1 className="text-6xl font-extrabold tracking-tight text-gray-900 font-mono">404</h1>
          <h2 className="text-xl font-bold text-gray-800">Halaman Tidak Ditemukan</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
            Maaf, rekam medis atau halaman yang Anda cari tidak ditemukan atau telah dipindahkan ke direktori lain.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button 
            variant="outline" 
            className="h-10 gap-2 border-gray-200 cursor-pointer"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <Button asChild className="h-10 gap-2 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 text-white shadow-md border-none">
            <Link href="/">
              <Home className="h-4 w-4" />
              Ke Halaman Utama
            </Link>
          </Button>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider pt-6">
          Rekam Medis Elektronik — Praktek Dr. Sudiman
        </p>
      </div>
    </div>
  )
}
