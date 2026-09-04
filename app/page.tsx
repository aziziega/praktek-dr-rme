'use client'

import { useState, useEffect, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Stethoscope } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
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
    <div className="relative h-screen w-screen overflow-y-auto bg-background text-foreground">
      {/* Fullscreen Background - Using .bg-grid from globals.css */}
      <div className="fixed inset-0 z-0 bg-grid animate-fade-in opacity-40"></div>

      {/* Decorative ECG Line across the screen */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-full ecg-line scale-y-[3]"></div>
      </div>

      {/* Overlay gradient */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-background/80 via-background to-background/50"></div>

      {/* Main Content */}
      <div className={`relative z-10 transition-all duration-300 ${isExiting ? 'animate-fade-out-page' : ''}`}>
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
          <div className="w-full max-w-4xl text-center space-y-8">

            {/* Logo */}
            <div className="flex justify-center animate-fade-in-scale" style={{ animationDelay: '100ms' }}>
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-3 transition-transform duration-300">
                <Stethoscope className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>

            {/* Platform Badge */}
            <div className="flex justify-center animate-fade-in-down" style={{ animationDelay: '200ms' }}>
              <div className="inline-block px-5 py-2 bg-primary/10 border border-primary/20 text-primary rounded-full text-sm font-semibold shadow-inner hover:bg-primary/20 transition-colors">
                ✨ Platform RME Modern & Terintegrasi
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl font-extrabold font-heading leading-tight animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              Praktek Dr. Sudiman
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              Sistem Rekam Medis Elektronik (RME) terintegrasi yang aman, efisien, dan mudah digunakan untuk pelayanan kesehatan terbaik di Prambanan, Klaten.
            </p>

            {/* Large Login Button */}
            <div className="flex justify-center pt-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <Button
                size="lg"
                onClick={handleNavigateLogin}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-7 text-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 rounded-xl cursor-pointer"
              >
                {isExiting ? (
                  <span className="flex items-center gap-2 animate-pulse">
                    Mengarahkan ke Sistem...
                  </span>
                ) : (
                  'Masuk ke Portal →'
                )}
              </Button>
            </div>

            {/* Features Cards Container */}
            <div className="pt-8 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
              <div className="bg-card/50 backdrop-blur-lg border border-border rounded-3xl shadow-xl p-8 md:p-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  {/* Feature 1 */}
                  <div className="bg-background/80 backdrop-blur-sm border border-border rounded-xl p-5 hover:bg-muted/50 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold mb-1">Pendaftaran & Vital Sign Digital</h3>
                        <p className="text-sm text-muted-foreground">Proses pendaftaran cepat dengan pencatatan vital sign otomatis</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="bg-background/80 backdrop-blur-sm border border-border rounded-xl p-5 hover:bg-muted/50 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold mb-1">Manajemen Resep & Stok Obat</h3>
                        <p className="text-sm text-muted-foreground">Kelola resep dan inventory obat secara real-time</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="bg-background/80 backdrop-blur-sm border border-border rounded-xl p-5 hover:bg-muted/50 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold mb-1">Pembayaran & Laporan Terintegrasi</h3>
                        <p className="text-sm text-muted-foreground">Sistem pembayaran dan laporan keuangan otomatis</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div className="bg-background/80 backdrop-blur-sm border border-border rounded-xl p-5 hover:bg-muted/50 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold mb-1">Data Aman & Terenkripsi</h3>
                        <p className="text-sm text-muted-foreground">Keamanan data pasien dengan enkripsi tingkat enterprise</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center items-center gap-6 pt-8 mt-6 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="font-semibold">Paperless & Efisien</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="font-semibold">Siap Integrasi Satu Sehat</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
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
