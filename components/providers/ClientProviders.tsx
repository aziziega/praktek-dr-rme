'use client'

import { NetworkStatusProvider } from './NetworkStatusProvider'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <NetworkStatusProvider>{children}</NetworkStatusProvider>
}
