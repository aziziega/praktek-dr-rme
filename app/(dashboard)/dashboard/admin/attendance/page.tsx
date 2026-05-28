import { Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Attendance — RME Praktek Dr. Sudiman',
}

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Rekap kehadiran staf & dokter.</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
        <Clock className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">Modul Attendance</h3>
        <p className="text-sm text-gray-500 mt-1">Fitur ini akan segera diimplementasikan.</p>
      </div>
    </div>
  )
}
