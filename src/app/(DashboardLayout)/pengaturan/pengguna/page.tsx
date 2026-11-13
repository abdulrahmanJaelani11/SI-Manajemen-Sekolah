'use client'

import React, { useState, useEffect } from 'react'
import { usePermission } from '@/context/PermissionContext'
import {
  Users,
  UserPlus,
  ShieldCheck,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Key,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'

interface Role {
  id: number
  namaRole: string
}

interface UserItem {
  id: number
  username: string
  namaLengkap: string
  email?: string
  roleId: number
  active: boolean
  createdAt: string
  role: { id: number; namaRole: string }
}

export default function PenggunaPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/pengaturan/pengguna')
  const allowEdit = canEdit('/pengaturan/pengguna')
  const allowDelete = canDelete('/pengaturan/pengguna')

  const [users, setUsers] = useState<UserItem[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    namaLengkap: '',
    email: '',
    roleId: '',
    active: true,
  })
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pengaturan/pengguna')
      const data = await res.json()
      if (data.success) {
        setUsers(data.data.users)
        setRoles(data.data.roles)
      }
    } catch (err) {
      console.error('Fetch users error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleOpenAdd = () => {
    setEditingUser(null)
    setFormData({
      username: '',
      password: '',
      namaLengkap: '',
      email: '',
      roleId: roles[0] ? String(roles[0].id) : '1',
      active: true,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '', // biarkan kosong jika tidak ingin ganti
      namaLengkap: user.namaLengkap,
      email: user.email || '',
      roleId: String(user.roleId),
      active: user.active,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSubmitting(true)

    try {
      const url = editingUser ? `/api/pengaturan/pengguna/${editingUser.id}` : '/api/pengaturan/pengguna'
      const method = editingUser ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const resJson = await res.json()

      if (!resJson.success) {
        setFormError(resJson.message || 'Gagal menyimpan pengguna')
        return
      }

      setIsFormOpen(false)
      fetchUsers()
    } catch (err: any) {
      setFormError('Terjadi kesalahan jaringan: ' + err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (user: UserItem) => {
    if (!window.confirm(`Hapus pengguna "${user.namaLengkap}" (${user.username})?`)) return

    try {
      const res = await fetch(`/api/pengaturan/pengguna/${user.id}`, { method: 'DELETE' })
      const resJson = await res.json()
      if (!resJson.success) {
        alert(resJson.message || 'Gagal menghapus pengguna')
        return
      }
      fetchUsers()
    } catch (err: any) {
      alert('Error saat menghapus pengguna: ' + err.message)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Manajemen Akun Pengguna
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola akun pengelola sistem, penetapan peran (role assignment), dan keamanan kata sandi.
          </p>
        </div>
        {allowCreate && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Pengguna Baru
          </button>
        )}
      </div>

      {/* Tabel Pengguna */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  Pengguna
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Username
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Surel (Email)
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  Peran (Role)
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  Status
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Memuat daftar akun pengguna...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {u.namaLengkap.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {u.namaLengkap}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Terdaftar: {new Date(u.createdAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {u.username}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {u.email || '-'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        <ShieldCheck className="h-3 w-3" />
                        {u.role.namaRole}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {u.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {allowEdit && (
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Ubah Pengguna"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {allowDelete && u.username !== 'admin' && (
                          <button
                            onClick={() => handleDelete(u)}
                            title="Hapus Pengguna"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {!allowEdit && (!allowDelete || u.username === 'admin') && (
                          <span className="text-xs text-slate-400 italic">Lihat Saja</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Pengguna */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingUser ? 'Ubah Akun Pengguna' : 'Tambah Pengguna Baru'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Subagyo"
                  value={formData.namaLengkap}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Username *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ahmad_tu"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {editingUser ? 'Kata Sandi Baru (Kosongkan jika tidak diubah)' : 'Kata Sandi *'}
                </label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Alamat Email
                </label>
                <input
                  type="email"
                  placeholder="user@sekolah.sch.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Peran / Hak Akses (Role) *
                </label>
                <SearchableSelect
                  value={formData.roleId}
                  onChange={(val) => setFormData({ ...formData, roleId: val })}
                  options={roles.map((r) => ({
                    value: String(r.id),
                    label: r.namaRole,
                  }))}
                  placeholder="Pilih Peran Pengguna"
                  searchPlaceholder="Cari peran..."
                  required
                />
              </div>

              {editingUser && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="userActive"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="userActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Akun Aktif (Dapat Login)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
