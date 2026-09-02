'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import type { UserRole } from '@/types/database'
import { resolveBreadcrumbLabel, logout } from '@/app/actions/auth'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { 
  Menu, Stethoscope, Sun, Moon, LogOut, ChevronRight,
  ClipboardPlus, ListOrdered, Users, UserCog, Pill, Clock, Activity, Coins, LayoutDashboard 
} from 'lucide-react'

const ROLE_LABELS: Record<UserRole, string> = {
  staf: 'Staf',
  dokter: 'Dokter',
  admin: 'Admin',
}

const ROLE_COLORS: Record<UserRole, string> = {
  staf: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  dokter: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  admin: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
}

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  staf: [
    { title: 'Pendaftaran', href: '/dashboard/staf/pendaftaran', icon: ClipboardPlus },
    { title: 'Antrian Hari Ini', href: '/dashboard/staf/antrian', icon: ListOrdered },
    { title: 'Manajemen Pasien', href: '/dashboard/staf/pasien', icon: Users },
  ],
  dokter: [
    { title: 'Antrian Saya', href: '/dashboard/dokter/antrian', icon: ListOrdered },
  ],
  admin: [
    { title: 'Overview', href: '/dashboard/admin/overview', icon: LayoutDashboard },
    { title: 'Manajemen User', href: '/dashboard/admin/users', icon: UserCog },
    { title: 'Manajemen Pasien', href: '/dashboard/admin/pasien', icon: Users },
    { title: 'Stok Obat', href: '/dashboard/admin/obat', icon: Pill },
    { title: 'Keuangan', href: '/dashboard/admin/keuangan', icon: Coins },
    { title: 'Activity Log', href: '/dashboard/admin/activity', icon: Activity },
    { title: 'Attendance', href: '/dashboard/admin/attendance', icon: Clock },
  ],
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
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Logout Dialog state
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
                    <BreadcrumbPage className="font-semibold text-foreground">
                      {label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={href}
                      className="text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      {label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="text-muted-foreground" />}
              </React.Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const navItems = NAV_ITEMS[userRole]

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 shadow-sm">
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Mobile Menu Trigger */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Buka menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 flex flex-col p-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-md">
                    <Stethoscope className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold leading-tight">
                      Dr. Sudiman
                    </h2>
                    <p className="text-[11px] text-muted-foreground">Rekam Medis Elektronik</p>
                  </div>
                </div>
                <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Menu Utama
                </div>
                <nav className="flex flex-col gap-1 flex-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                        <span className="truncate">{item.title}</span>
                        {isActive && (
                          <ChevronRight className="ml-auto h-4 w-4 text-primary/70" />
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-md">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block min-w-0">
              <h1 className="truncate text-sm font-bold leading-tight">Dr. Sudiman</h1>
              <p className="text-[11px] text-muted-foreground">Praktek Mandiri</p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {mounted && (
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-muted-foreground hover:text-foreground">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          <div className="hidden md:flex items-center gap-3 border-l border-border pl-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold leading-none">{userName}</span>
              <Badge variant="outline" className={`mt-1 text-[10px] font-semibold ${ROLE_COLORS[userRole]}`}>
                {ROLE_LABELS[userRole]}
              </Badge>
            </div>
          </div>
          
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shadow-sm border border-primary/20">
            {userName.charAt(0).toUpperCase()}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsLogoutDialogOpen(true)}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Menu Utama
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    <span className="truncate">{item.title}</span>
                    {isActive && (
                      <ChevronRight className="ml-auto h-4 w-4 text-primary/70" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content Content */}
        <main className="flex-1 overflow-hidden relative bg-background">
          <div id="main-scroll-container" className="h-full overflow-y-auto p-4 lg:p-6 bg-grid opacity-100">
            <div className="relative z-10 bg-card rounded-2xl shadow-sm border border-border min-h-full p-4 lg:p-6 text-card-foreground">
              {renderBreadcrumbs()}
              <div key={pathname} className="animate-fade-in pb-20">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={isLogoutDialogOpen}
        onOpenChange={(open) => !isLoggingOut && setIsLogoutDialogOpen(open)}
      >
        <DialogContent
          className="sm:max-w-[400px] bg-card text-card-foreground border-border"
          onPointerDownOutside={(e) => isLoggingOut && e.preventDefault()}
          onEscapeKeyDown={(e) => isLoggingOut && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">Konfirmasi Keluar</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Apakah Anda yakin ingin keluar dari sistem?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Anda akan dikembalikan ke halaman login dan perlu masuk kembali
              untuk mengakses dashboard.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(false)}
              disabled={isLoggingOut}
              className="bg-background"
            >
              Batal
            </Button>
            <form action={logout} onSubmit={() => setIsLoggingOut(true)}>
              <Button
                type="submit"
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Keluar...' : 'Ya, Keluar'}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
