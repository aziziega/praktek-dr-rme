import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, MapPin, Phone, FileText, Stethoscope } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      {/* Fullscreen Background Image - Fixed */}
      <div
        className="fixed inset-0 z-0"
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

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
          <div className="w-full max-w-4xl text-center space-y-8">

            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-lg">
                <Stethoscope className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Platform Badge */}
            <div className="flex justify-center">
              <div className="inline-block px-5 py-2 bg-blue-500/30 backdrop-blur-sm border border-blue-300/30 text-blue-100 rounded-full text-sm font-semibold">
                ✨ Platform RME Modern & Terintegrasi
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
              Rekam Medis Digital untuk Praktik Modern
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
              Sistem RME terintegrasi yang aman, efisien, dan mudah digunakan.
              Tinggalkan kertas, beralih ke digital untuk pelayanan kesehatan yang lebih baik.
            </p>

            {/* Large Login Button */}
            <div className="flex justify-center pt-4">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-12 py-7 text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-200 rounded-xl"
                >
                  Masuk ke Sistem →
                </Button>
              </Link>
            </div>

            {/* Features Cards - TRANSPARENT CARD ONLY HERE */}
            <div className="pt-8">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8 md:p-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Feature 1 */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/15 transition-all">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-white mb-1">Pendaftaran & Vital Sign Digital</h3>
                        <p className="text-sm text-blue-200">Proses pendaftaran cepat dengan pencatatan vital sign otomatis</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/15 transition-all">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-white mb-1">Manajemen Resep & Stok Obat</h3>
                        <p className="text-sm text-blue-200">Kelola resep dan inventory obat secara real-time</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/15 transition-all">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-white mb-1">Pembayaran & Laporan Terintegrasi</h3>
                        <p className="text-sm text-blue-200">Sistem pembayaran dan laporan keuangan otomatis</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5 hover:bg-white/15 transition-all">
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
                <div className="flex flex-wrap justify-center items-center gap-6 pt-8 mt-6 border-t border-white/20">
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="font-semibold">Paperless & Efisien</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="font-semibold">Siap Integrasi Satu Sehat</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-200">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="font-semibold">Activity Log Lengkap</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Footer with Practice Info */}
        {/* <footer className="bg-gray-900/90 backdrop-blur-sm border-t border-white/10">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm"> */}

        {/* Practice Info */}
        {/* <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Praktek Dr. Sudiman</h3>
                    <p className="text-xs text-gray-400">Sistem RME Digital</p>
                  </div>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Platform rekam medis elektronik modern untuk meningkatkan efisiensi
                  dan kualitas pelayanan kesehatan.
                </p>
              </div> */}

        {/* Contact & Location */}
        {/* <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Informasi Kontak</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-gray-300">
                    <MapPin className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>Gupolo, Cucukan, Kec. Prambanan, Kabupaten Klaten, Jawa Tengah 57454</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Phone className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>0878-9028-7007</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-300">
                    <FileText className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <span>SIP: 500.16.7.2/054/2024</span>
                  </div>
                </div>
              </div> */}

        {/* Operating Hours */}
        {/* <div>
                <h4 className="font-semibold text-white mb-3 text-sm">Jam Operasional</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                    <span className="font-medium text-white">Senin - Sabtu</span>
                  </div>
                  <div className="ml-6 space-y-1 text-gray-300">
                    <p>Pagi: 06.00 - 10.00 WIB</p>
                    <p>Sore: 16.00 - 21.00 WIB</p>
                  </div>
                  <div className="flex items-center gap-2 ml-6 mt-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-gray-300">Minggu: Libur</span>
                  </div>
                </div>
              </div>

            </div> */}

        {/* Bottom Bar */}
        {/* <div className="border-t border-white/10 mt-6 pt-6 text-center text-xs text-gray-400">
              <p>© 2024 Praktek Dr. Sudiman. All rights reserved.</p>
              <p className="mt-1">Sistem Rekam Medis Elektronik - Powered by Modern Web Technology</p>
            </div>
          </div>
        </footer> */}
      </div>
    </div>
  )
}
