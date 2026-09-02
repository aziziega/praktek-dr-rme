'use client'

import { useState, useEffect } from 'react'
import { getAdminUsers, createUser, updateUser, toggleUserStatus, changeUserPassword } from '@/app/actions/admin'
import type { UserRole } from '@/types/database'
import { userSchema } from '@/lib/validations'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPlus, Pencil, KeyRound, Eye, EyeOff } from 'lucide-react'
import { useNetworkStatus } from '@/components/providers/NetworkStatusProvider'

interface UserData {
  id: string
  email: string
  nama: string
  role: string
  aktif: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const isOnline = useNetworkStatus()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Dialog Add State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [addForm, setAddForm] = useState({ email: '', nama: '', role: 'staf', password: '' })

  // Dialog Edit State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ id: '', nama: '', role: 'staf' })

  // Dialog Password Reset State
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ id: '', email: '', nama: '', password: '', showPassword: true })

  // Confirm Status Toggle State
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; currentStatus: boolean } | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const [debugError, setDebugError] = useState<string | null>(null)

  async function fetchUsers() {
    setLoading(true)
    setDebugError(null)
    try {
      const data = await getAdminUsers()
      setUsers(data as UserData[])
    } catch (err: any) {
      console.error('[AdminUsers] fetch error:', err)
      const msg = err instanceof Error ? err.message : String(err)
      const stack = err instanceof Error ? err.stack : 'No stack trace'
      setDebugError(`Server Action Exception: ${msg}\nStack: ${stack}`)
      toast.error('Terjadi kesalahan memuat data dari server: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Zod validation
    const validation = userSchema.safeParse(addForm)
    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setIsSubmitting(true)
    try {
      await createUser(addForm)
      toast.success('User berhasil ditambahkan')
      setIsAddOpen(false)
      setAddForm({ email: '', nama: '', role: 'staf', password: '' })
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Zod validation (Pick only nama and role for edit)
    const editSchema = userSchema.pick({ nama: true, role: true })
    const validation = editSchema.safeParse({ nama: editForm.nama, role: editForm.role })
    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setIsSubmitting(true)
    try {
      await updateUser(editForm.id, { nama: editForm.nama, role: editForm.role })
      toast.success('User berhasil diperbarui')
      setIsEditOpen(false)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setIsSubmitting(true)
    try {
      await changeUserPassword(passwordForm.id, passwordForm.password)
      toast.success('Password berhasil diperbarui')
      setIsPasswordOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    setConfirmTarget({ id, currentStatus })
    setConfirmOpen(true)
  }

  const executeToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus(id, !currentStatus)
      toast.success(`User berhasil di${currentStatus ? 'nonaktifkan' : 'aktifkan'}`)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan')
    }
  }

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen User</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola staf, dokter, dan admin sistem.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <UserPlus className="h-4 w-4" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Tambahkan staf, dokter, atau admin baru. Password yang dibuat minimal 6 karakter.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input
                  id="nama"
                  required
                  placeholder="Misal: Dr. Budi Santoso"
                  value={addForm.nama}
                  onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="budi@klinik.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={addForm.role}
                  onValueChange={(val) => setAddForm({ ...addForm, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staf">Staf</SelectItem>
                    <SelectItem value="dokter">Dokter</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || !isOnline}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {debugError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-800 text-red-900 dark:text-red-300 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap shadow-md mb-4">
          <p className="font-bold text-sm mb-2 flex items-center gap-2 text-red-700 dark:text-red-300">
            <span className="animate-ping h-2.5 w-2.5 rounded-full bg-red-600"></span>
            Diagnostik Kesalahan (Gagal Load Data):
          </p>
          {debugError}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              <SelectItem value="staf">Staf</SelectItem>
              <SelectItem value="dokter">Dokter</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tgl Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Tidak ada data user.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nama}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'dokter' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.aktif}
                        onCheckedChange={() => handleToggleStatus(user.id, user.aktif)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {user.aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditForm({ id: user.id, nama: user.nama, role: user.role })
                          setIsEditOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:bg-amber-900/20"
                        onClick={() => {
                          setPasswordForm({ id: user.id, email: user.email, nama: user.nama, password: '', showPassword: true })
                          setIsPasswordOpen(true)
                        }}
                        title="Ganti Password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Ubah detail pengguna (Email tidak dapat diubah).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nama">Nama Lengkap</Label>
              <Input
                id="edit-nama"
                required
                value={editForm.nama}
                onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(val) => setEditForm({ ...editForm, role: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staf">Staf</SelectItem>
                  <SelectItem value="dokter">Dokter</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !isOnline}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget?.currentStatus ? 'Nonaktifkan Pengguna?' : 'Aktifkan Pengguna?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.currentStatus
                ? 'Apakah Anda yakin ingin menonaktifkan pengguna ini? Pengguna tidak akan dapat login atau mengakses sistem hingga diaktifkan kembali.'
                : 'Apakah Anda yakin ingin mengaktifkan kembali pengguna ini? Pengguna akan dapat login dan mengakses dashboard sesuai role mereka.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmTarget(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmTarget) {
                  await executeToggleStatus(confirmTarget.id, confirmTarget.currentStatus)
                }
                setConfirmTarget(null)
              }}
              className={confirmTarget?.currentStatus 
                ? 'bg-red-600 hover:bg-red-700 text-white border-none' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-none'}
            >
              Ya, {confirmTarget?.currentStatus ? 'Nonaktifkan' : 'Aktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Ganti Password */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Ganti Password User</DialogTitle>
            <DialogDescription>
              Ubah password untuk user <strong className="text-foreground">{passwordForm.nama}</strong> ({passwordForm.email}).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  required
                  type={passwordForm.showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setPasswordForm({ ...passwordForm, showPassword: !passwordForm.showPassword })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {passwordForm.showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || passwordForm.password.length < 6}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}


