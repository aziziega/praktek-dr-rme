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
    <div className="h-screen w-screen overflow-y-auto flex items-center justify-center bg-background bg-grid px-4 py-8">
      <div className="relative z-10">
        {children}
      </div>
      {/* Decorative gradient overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-background/80 via-background to-background/50 pointer-events-none"></div>
    </div>
  )
}
