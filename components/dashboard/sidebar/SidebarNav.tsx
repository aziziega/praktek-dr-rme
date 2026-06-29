'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ClipboardPlus,
  ListOrdered,
  Users,
  UserCog,
  Pill,
  Clock,
  Activity,
  Coins,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { UserRole } from '@/types/database'

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
    { title: 'Overview', href: '/dashboard/admin/dashboard', icon: LayoutDashboard },
    { title: 'Manajemen User', href: '/dashboard/admin/users', icon: UserCog },
    { title: 'Manajemen Pasien', href: '/dashboard/admin/pasien', icon: Users },
    { title: 'Stok Obat', href: '/dashboard/admin/obat', icon: Pill },
    { title: 'Keuangan', href: '/dashboard/admin/keuangan', icon: Coins },
    { title: 'Activity Log', href: '/dashboard/admin/activity', icon: Activity },
    { title: 'Attendance', href: '/dashboard/admin/attendance', icon: Clock },
  ],
}

interface SidebarNavProps {
  userRole: UserRole
  onNavigate?: () => void
}

export function SidebarNav({ userRole, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()
  const navItems = NAV_ITEMS[userRole]

  return (
    <ScrollArea className="flex-1 px-3 py-3">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        Menu Utama
      </p>
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-sky-50 to-emerald-50 text-sky-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                  isActive
                    ? 'text-sky-600'
                    : 'text-gray-400 group-hover:text-gray-600'
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
  )
}
