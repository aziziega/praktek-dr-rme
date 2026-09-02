'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { logout } from '@/app/actions/auth'
import type { UserRole } from '@/types/database'

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

interface SidebarFooterProps {
  userName: string
  userRole: UserRole
}

export function SidebarFooter({ userName, userRole }: SidebarFooterProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  return (
    <>
      <div className="border-t border-border p-4 space-y-3">
        {/* User Profile */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 text-sm font-bold text-sky-700 shadow-sm border border-sky-200/60">
            {userName.charAt(0).toUpperCase()}
          </div>
          {/* Name + Role Badge */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground leading-tight">
              {userName}
            </p>
            <Badge
              variant="outline"
              className={`mt-0.5 text-[10px] font-semibold ${ROLE_COLORS[userRole]}`}
            >
              {ROLE_LABELS[userRole]}
            </Badge>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-red-600 hover:bg-red-50"
          onClick={() => setIsDialogOpen(true)}
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !isLoggingOut && setIsDialogOpen(open)}
      >
        <DialogContent
          className="sm:max-w-[400px]"
          onPointerDownOutside={(e) => isLoggingOut && e.preventDefault()}
          onEscapeKeyDown={(e) => isLoggingOut && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Konfirmasi Keluar</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin keluar dari sistem?
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Anda akan dikembalikan ke halaman login dan perlu masuk kembali
              untuk mengakses dashboard.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isLoggingOut}
            >
              Batal
            </Button>
            <form action={logout} onSubmit={() => setIsLoggingOut(true)}>
              <Button
                type="submit"
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Keluar...' : 'Ya, Keluar'}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
