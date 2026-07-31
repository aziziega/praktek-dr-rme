'use client'

import { useState, useEffect, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Stethoscope } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Prefetch login page for instant transition
    router.prefetch('/login')
  }, [router])

  const handleNavigateLogin = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (isExiting) return
    setIsExiting(true)
    setTimeout(() => {
      router.push('/login')
    }, 300)
  }

  return (
    <div className="relative h-screen w-screen overflow-y-auto">
      {/* Fullscreen Background Image - Fixed with subtle fade-in */}
      <div
        className="fixed inset-0 z-0 animate-fade-in"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/75 to-green-900/80"></div>
      </div>

      {/* Main Content with Entrance Stagger & Exit Fade-Out */}
      <div className={`relative z-10 transition-all duration-300 ${isExiting ? 'animate-fade-out-page' : ''}`}>
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
          <div className="w-full max-w-4xl text-center space-y-8">

            {/* Logo */}
            <div
              className="flex justify-center animate-fade-in-scale [animation-fill-mode:backwards]"
              style={{ animationDelay: '100ms' }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-3 transition-transform duration-300">
                <Stethoscope className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Platform Badge */}
            <div
              className="flex justify-center animate-fade-in-down [animation-fill-mode:backwards]"
              style={{ animationDelay: '200ms' }}
            >
              <div className="inline-block px-5 py-2 bg-blue-500/30 backdrop-blur-sm border border-blue-300/30 text-blue-100 rounded-full text-sm font-semibold shadow-inner hover:bg-blue-500/40 transition-colors">
                ✨ Platform RME Modern & Terintegrasi
              </div>
            </div>

            {/* Headline */}
            <h1
              className="text-4xl md:text-5xl font-extrabold text-white leading-tight animate-fade-in-up [animation-fill-mode:backwards]"
              style={{ animationDelay: '300ms' }}
            >
              Rekam Medis Digital untuk Praktik Modern
            </h1>

            {/* Subheadline */}
            <p
              className="text-lg md:text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto animate-fade-in-up [animation-fill-mode:backwards]"
              style={{ animationDelay: '400ms' }}
            >
              Sistem RME terintegrasi yang aman, efisien, dan mudah digunakan.
              Tinggalkan kertas, beralih ke digital untuk pelayanan kesehatan yang lebih baik.
            </p>

            {/* Large Login Button */}
            <div
              className="flex justify-center pt-4 animate-fade-in-up [animation-fill-mode:backwards]"
              style={{ animationDelay: '500ms' }}
            >
              <Button
                size="lg"
                onClick={handleNavigateLogin}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-12 py-7 text-xl font-bold shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all duration-300 rounded-xl cursor-pointer"
              >
                {isExiting ? (
                  <span className="flex items-center gap-2 animate-pulse">
                    Mengarahkan ke Sistem...
                  </span>
                ) : (
                  'Masuk ke Sistem →'
                )}
              </Button>
            </div>

            {/* Features Cards Container */}
            <div
              className="pt-8 animate-fade-in-up [animation-fill-mode:backwards]"
              style={{ animationDelay: '600ms' }}
            >
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 md:p-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Feature 1 */}
                  <div
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up [animation-fill-mode:backwards]"
                    style={{ animationDelay: '700ms' }}
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-white mb-1">Pendaftaran & Vital Sign Digital</h3>
                        <p className="text-sm text-blue-200">Proses pendaftaran cepat dengan pencatatan vital sign otomatis</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up [animation-fill-mode:backwards]"
                    style={{ animationDelay: '800ms' }}
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-white mb-1">Manajemen Resep & Stok Obat</h3>
                        <p className="text-sm text-blue-200">Kelola resep dan inventory obat secara real-time</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up [animation-fill-mode:backwards]"
                    style={{ animationDelay: '900ms' }}
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-white mb-1">Pembayaran & Laporan Terintegrasi</h3>
                        <p className="text-sm text-blue-200">Sistem pembayaran dan laporan keuangan otomatis</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/20 hover:border-white/40 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up [animation-fill-mode:backwards]"
                    style={{ animationDelay: '1000ms' }}
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-white mb-1">Data Aman & Terenkripsi</h3>
                        <p className="text-sm text-blue-200">Keamanan data pasien dengan enkripsi tingkat enterprise</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div
                  className="flex flex-wrap justify-center items-center gap-6 pt-8 mt-6 border-t border-white/20 animate-fade-in-up [animation-fill-mode:backwards]"
                  style={{ animationDelay: '1100ms' }}
                >
                  <div className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="font-semibold">Paperless & Efisien</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="font-semibold">Siap Integrasi Satu Sehat</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="font-semibold">Activity Log Lengkap</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  )
}
