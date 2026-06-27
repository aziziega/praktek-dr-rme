import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login — RME Praktek Dr. Sudiman',
  description: 'Masuk ke Sistem Rekam Medis Elektronik Praktek Dr. Umum Sudiman',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen w-screen overflow-y-auto flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4 py-8">
      {children}
    </div>
  )
}
