'use client'

import { ThemeProvider } from 'next-themes'
import { NetworkStatusProvider } from './NetworkStatusProvider'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NetworkStatusProvider>{children}</NetworkStatusProvider>
    </ThemeProvider>
  )
}
