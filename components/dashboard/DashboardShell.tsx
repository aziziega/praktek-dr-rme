'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/types/database'
import { logout, resolveBreadcrumbLabel } from '@/app/actions/auth'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import {
  Stethoscope,
  ClipboardPlus,
  ListOrdered,
  Users,
  UserCog,
  Pill,
  Clock,
  Activity,
  LogOut,
  Menu,
  ChevronRight,
  Coins,
} from 'lucide-react'

// Navigation items per role
interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  staf: [
    { title: 'Pendaftaran', href: '/dashboard/staf/pendaftaran', icon: ClipboardPlus },
    { title: 'Antrian Hari Ini', href: '/dashboard/staf/antrian', icon: ListOrdered },
  ],
  dokter: [
    { title: 'Antrian Saya', href: '/dashboard/dokter/antrian', icon: ListOrdered },
  ],
  admin: [
    { title: 'Manajemen User', href: '/dashboard/admin/users', icon: UserCog },
    { title: 'Manajemen Pasien', href: '/dashboard/admin/pasien', icon: Users },
    { title: 'Stok Obat', href: '/dashboard/admin/obat', icon: Pill },
    { title: 'Keuangan', href: '/dashboard/admin/keuangan', icon: Coins },
    { title: 'Activity Log', href: '/dashboard/admin/activity', icon: Activity },
    { title: 'Attendance', href: '/dashboard/admin/attendance', icon: Clock },
  ],
}

const ROLE_LABELS: Record<UserRole, string> = {
  staf: 'Staf',
  dokter: 'Dokter',
  admin: 'Admin',
}

const ROLE_COLORS: Record<UserRole, string> = {
  staf: 'bg-sky-100 text-sky-700 border-sky-200',
  dokter: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  admin: 'bg-amber-100 text-amber-700 border-amber-200',
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
  const navItems = NAV_ITEMS[userRole]

  // Live Ticking Clock State
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Show welcome toast when landing on the dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = `welcome_toast_shown_${userName}`
      const isShown = sessionStorage.getItem(key)
      if (!isShown) {
        toast.success(`Selamat datang kembali, ${userName}!`, {
          description: `Anda masuk sebagai ${ROLE_LABELS[userRole] || userRole}.`,
          duration: 5000,
        })
        sessionStorage.setItem(key, 'true')
      }
    }
  }, [userName, userRole])

  // UUID dynamic breadcrumb label resolver state
  const [resolvedLabels, setResolvedLabels] = useState<Record<string, string>>({})

  useEffect(() => {
    const paths = pathname.split('/').filter(Boolean)
    const uuids = paths.filter(path => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path))

    const missingUuids = uuids.filter(uuid => !resolvedLabels[uuid])
    if (missingUuids.length === 0) return

    async function resolveUuids() {
      const updates: Record<string, string> = {}

      for (const uuid of missingUuids) {
        try {
          const resolvedName = await resolveBreadcrumbLabel(uuid)
          if (resolvedName) {
            updates[uuid] = resolvedName
          } else {
            // Truncate fallback
            updates[uuid] = uuid.substring(0, 8) + '...'
          }
        } catch (err) {
          console.error('[Breadcrumbs] Error resolving UUID:', err)
          updates[uuid] = uuid.substring(0, 8) + '...'
        }
      }

      if (Object.keys(updates).length > 0) {
        setResolvedLabels(prev => ({ ...prev, ...updates }))
      }
    }

    resolveUuids()
  }, [pathname, resolvedLabels])

  function formatIndonesianLiveDate(date: Date): string {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const monthName = months[date.getMonth()]
    const year = date.getFullYear()
    return `${dayName}, ${day} ${monthName} ${year}`
  }

  function formatLiveTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds} WIB`
  }

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

    const isUUID = (str: string) => {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
    }

    return (
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          {paths.map((path, idx) => {
            const isLast = idx === paths.length - 1
            const href = '/' + paths.slice(0, idx + 1).join('/')
            const label = pathLabels[path] || resolvedLabels[path] || (isUUID(path) ? '...' : path.charAt(0).toUpperCase() + path.slice(1))

            return (
              <React.Fragment key={href}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="font-semibold text-gray-900">{label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href} className="text-gray-500 hover:text-sky-600 transition-colors font-medium">
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

  function SidebarContent() {
    return (
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="px-4 py-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-md shadow-sky-500/20">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-gray-900">
                Dr. Sudiman
              </h2>
              <p className="text-xs text-gray-500">Rekam Medis Elektronik</p>
            </div>
          </div>
        </div>

        {/* Live Clock Widget */}
        <div className="px-4 pb-4">
          <div className="flex flex-col text-gray-500">
            <div className="text-base font-bold tracking-tight font-mono text-gray-800">
              {time ? formatLiveTime(time) : '--:--:-- WIB'}
            </div>
            <div className="text-xs font-medium text-gray-400 truncate">
              {time ? formatIndonesianLiveDate(time) : 'Memuat...'}
            </div>
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive
                      ? 'bg-gradient-to-r from-sky-50 to-emerald-50 text-sky-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-sky-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                  />
                  <span className="truncate">{item.title}</span>
                  {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 text-sky-400" />
                  )}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        <Separator />

        {/* User Info & Logout */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {userName}
              </p>
              <Badge
                variant="outline"
                className={`mt-0.5 text-xs font-medium ${ROLE_COLORS[userRole]}`}
              >
                {ROLE_LABELS[userRole]}
              </Badge>
            </div>
          </div>

          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-gray-200 bg-white">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 [&>button]:hidden">
          <SidebarContent />
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
            <span className="text-sm font-semibold text-gray-900">
              Dr. Sudiman
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderBreadcrumbs()}
          {children}
        </div>
      </main>
    </div>
  )
}
