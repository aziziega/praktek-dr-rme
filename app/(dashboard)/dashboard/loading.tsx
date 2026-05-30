import { Stethoscope } from 'lucide-react'

export default function Loading() {
  return (
    <div className="h-[calc(100vh-8rem)] w-full flex flex-col items-center justify-center p-6 space-y-4">
      {/* Animated logo scanner */}
      <div className="relative flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-md text-white animate-pulse">
        <Stethoscope className="h-8 w-8 animate-spin duration-3000" />
        <span className="absolute inline-flex h-full w-full rounded-2xl bg-sky-400 opacity-20 animate-ping" />
      </div>

      <div className="space-y-2 text-center max-w-xs">
        <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Memuat Data RME</h3>
        <div className="h-1.5 w-32 bg-gray-100 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full w-2/3 animate-infinite-slide" />
        </div>
        <p className="text-[10px] text-gray-400 font-medium">Mohon tunggu, menyinkronkan data klinis...</p>
      </div>
    </div>
  )
}
