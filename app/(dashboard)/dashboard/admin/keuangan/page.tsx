'use client'

import React from 'react'
import { Coins, Calendar, User, TrendingUp, DollarSign, ArrowUpRight, BarChart2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function KeuanganPage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col justify-center">
      {/* CSS Keyframes for shimmer animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />

      {/* Blurred Dashboard Content Preview */}
      <div className="space-y-6 filter blur-[5px] select-none pointer-events-none opacity-45 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Laporan Pendapatan Keuangan</h1>
            <p className="text-sm text-gray-500 mt-1">Pantau total omset, transaksi apotek, dan analitik pendapatan klinik secara real-time.</p>
          </div>
        </div>

        {/* Metrics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-xs border-gray-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-gray-600 uppercase">Total Pendapatan</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold text-gray-900">Rp 12.500.000</div>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> +12.5% dari bulan lalu</p>
            </CardContent>
          </Card>
          <Card className="shadow-xs border-gray-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-gray-600 uppercase">Jasa Konsultasi</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center"><User className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold text-gray-900">Rp 5.250.000</div>
              <p className="text-[10px] text-gray-400 mt-1">42% dari total omset</p>
            </CardContent>
          </Card>
          <Card className="shadow-xs border-gray-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-gray-600 uppercase">Omset Obat Resep</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><TrendingUp className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold text-gray-900">Rp 7.250.000</div>
              <p className="text-[10px] text-gray-400 mt-1">58% dari total omset</p>
            </CardContent>
          </Card>
          <Card className="shadow-xs border-gray-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-gray-600 uppercase">Bagi Hasil Klinik</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><BarChart2 className="h-4 w-4" /></div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-extrabold text-gray-900">Rp 2.100.000</div>
              <p className="text-[10px] text-gray-400 mt-1">Estimasi profit bersih</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Details Rows */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-xs border-gray-200 bg-white h-72">
            <CardHeader><CardTitle className="text-sm font-bold text-gray-900">Grafik Penjualan Bulanan</CardTitle></CardHeader>
            <CardContent className="h-48 flex items-center justify-center text-gray-400 text-xs">Visualisasi Grafik</CardContent>
          </Card>
          <Card className="shadow-xs border-gray-200 bg-white h-72">
            <CardHeader><CardTitle className="text-sm font-bold text-gray-900">Metode Pembayaran</CardTitle></CardHeader>
            <CardContent className="h-48 flex items-center justify-center text-gray-400 text-xs">Proporsi QRIS vs Tunai</CardContent>
          </Card>
        </div>
      </div>

      {/* Premium Coming Soon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
        <div className="bg-white/80 backdrop-blur-md border border-gray-200/60 shadow-2xl rounded-3xl p-8 sm:p-10 text-center max-w-md space-y-6 transform hover:scale-[1.01] transition-all duration-300">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-xl shadow-emerald-500/20 animate-pulse">
            <Coins className="h-10 w-10" />
          </div>
          <div className="space-y-3">
            <Badge className="bg-emerald-100 text-emerald-800 border-none px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
              Under Construction
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Coming Soon!
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Fitur **Laporan Pendapatan Keuangan** sedang dalam tahap pengembangan akhir. Modul ini segera hadir dengan pembukuan omset otomatis, rincian biaya periksa & resep obat, perhitungan bagi hasil dokter, serta grafik statistik terpadu.
            </p>
          </div>
          <div className="pt-2">
            <div className="h-2 w-32 bg-gray-100 rounded-full mx-auto overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full animate-[shimmer_1.5s_infinite_ease-in-out]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
