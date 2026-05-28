import { Activity } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Activity Log — RME Praktek Dr. Sudiman',
}

export default function ActivityLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Activity Log</h1>
        <p className="text-sm text-gray-500 mt-1">Audit trail seluruh aktivitas sistem.</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
        <Activity className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">Modul Activity Log</h3>
        <p className="text-sm text-gray-500 mt-1">Fitur ini akan segera diimplementasikan.</p>
      </div>
    </div>
  )
}
