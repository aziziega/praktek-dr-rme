'use client'

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { WifiOff } from 'lucide-react'

const NetworkStatusContext = createContext(true)

export function useNetworkStatus() {
  return useContext(NetworkStatusContext)
}

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

function getServerSnapshot() {
  return true
}

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setShow(true)
    } else {
      const timer = setTimeout(() => setShow(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])

  return (
    <NetworkStatusContext.Provider value={isOnline}>
      {show && (
        <div
          role="alert"
          className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white transition-all duration-300 ${
            isOnline
              ? 'bg-emerald-600 animate-in fade-in slide-in-from-top'
              : 'bg-red-600 animate-in fade-in slide-in-from-top'
          }`}
        >
          {isOnline ? (
            <>Koneksi internet terhubung kembali.</>
          ) : (
            <>
              <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
              Koneksi terputus. Menunggu internet terhubung kembali...
            </>
          )}
        </div>
      )}
      {children}
    </NetworkStatusContext.Provider>
  )
}
