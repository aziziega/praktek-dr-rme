'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/types/database'
import { resolveBreadcrumbLabel } from '@/app/actions/auth'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Menu, Stethoscope } from 'lucide-react'

import { SidebarHeader } from '@/components/dashboard/sidebar/SidebarHeader'
import { SidebarNav } from '@/components/dashboard/sidebar/SidebarNav'
import { SidebarFooter } from '@/components/dashboard/sidebar/SidebarFooter'

const ROLE_LABELS: Record<UserRole, string> = {
  staf: 'Staf',
  dokter: 'Dokter',
  admin: 'Admin',
}

interface DashboardShellProps {
  children: React.ReactNode
  userName: string
  userRole: UserRole
}

export function DashboardShell({
  children,
  userName,
  userRole,
}: DashboardShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // ── Welcome toast ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = `welcome_toast_shown_${userName}`
      if (!sessionStorage.getItem(key)) {
        toast.success(`Selamat datang kembali, ${userName}!`, {
          description: `Anda masuk sebagai ${ROLE_LABELS[userRole] || userRole}.`,
          duration: 5000,
        })
        sessionStorage.setItem(key, 'true')
      }
    }
  }, [userName, userRole])

  // ── UUID dynamic breadcrumb resolver ───────────────────────────────────────
  const [resolvedLabels, setResolvedLabels] = useState<Record<string, string>>({})

  useEffect(() => {
    const paths = pathname.split('/').filter(Boolean)
    const isUUID = (s: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
    const uuids = paths.filter(isUUID)
    const missing = uuids.filter((u) => !resolvedLabels[u])
    if (missing.length === 0) return

    async function resolve() {
      const updates: Record<string, string> = {}
      for (const uuid of missing) {
        try {
          const name = await resolveBreadcrumbLabel(uuid)
          updates[uuid] = name ?? uuid.substring(0, 8) + '...'
        } catch {
          updates[uuid] = uuid.substring(0, 8) + '...'
        }
      }
      if (Object.keys(updates).length > 0) {
        setResolvedLabels((prev) => ({ ...prev, ...updates }))
      }
    }

    resolve()
  }, [pathname, resolvedLabels])

  // ── Breadcrumb renderer ────────────────────────────────────────────────────
  function renderBreadcrumbs() {
    const paths = pathname.split('/').filter(Boolean)
    if (paths.length <= 1) return null

    const pathLabels: Record<string, string> = {
      dashboard: 'Beranda',
      staf: 'Staf Pendaftaran',
      dokter: 'Dokter',
      admin: 'Administrator',
      pendaftaran: 'Pendaftaran Pasien',
      antrian: 'Antrean Pasien',
      users: 'Manajemen User',
      pasien: 'Manajemen Pasien',
      obat: 'Stok Obat',
      attendance: 'Log Kehadiran',
      activity: 'Log Aktivitas',
      keuangan: 'Laporan Pendapatan',
      periksa: 'Periksa',
    }

    const isUUID = (s: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

    return (
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          {paths.map((path, idx) => {
            const isLast = idx === paths.length - 1
            const href = '/' + paths.slice(0, idx + 1).join('/')
            const label =
              pathLabels[path] ||
              resolvedLabels[path] ||
              (isUUID(path) ? '...' : path.charAt(0).toUpperCase() + path.slice(1))

            return (
              <React.Fragment key={href}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="font-semibold text-gray-900">
                      {label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={href}
                      className="text-gray-500 hover:text-sky-600 transition-colors font-medium"
                    >
                      {label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="text-gray-400" />}
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // ── Sidebar assembly ───────────────────────────────────────────────────────
  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex h-full flex-col">
        {/* Header: Brand + Clock + Metric Cards */}
        <SidebarHeader />

        <Separator />

        {/* Navigation */}
        <SidebarNav userRole={userRole} onNavigate={onNavigate} />

        <Separator />

        {/* Footer: User Profile + Logout */}
        <SidebarFooter userName={userName} userRole={userRole} />
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-gray-200 bg-white">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 [&>button]:hidden">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Buka menu</span>
              </Button>
            </SheetTrigger>
          </Sheet>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-sky-600" />
            <span className="text-sm font-semibold text-gray-900">Dr. Sudiman</span>
          </div>
        </header>

        {/* Page Content */}
        <div
          id="main-scroll-container"
          className="flex-1 overflow-y-auto p-4 lg:p-6"
        >
          {renderBreadcrumbs()}
          <div key={pathname} className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
