'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePermission } from '@/context/PermissionContext'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  Copy,
  ArrowRight,
  ExternalLink,
  Layers,
  Check,
  RotateCcw,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'

interface RoleItem {
  id: number
  namaRole: string
  keterangan: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  _count: {
    users: number
    roleMenus: number
  }
}

export default function ManajemenRolePage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/pengaturan/role')
  const allowEdit = canEdit('/pengaturan/role')
  const allowDelete = canDelete('/pengaturan/role')

  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Notification state
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal Form State (Tambah / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
  const [formData, setFormData] = useState({
    namaRole: '',
    keterangan: '',
    active: true,
    cloneRoleId: '',
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Modal Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // Fetch Roles
  const fetchRoles = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pengaturan/roles')
      const json = await res.json()
      if (json.success) {
        setRoles(json.data)
      } else {
        setAlert({ type: 'error', message: json.message || 'Gagal memuat data peran' })
      }
    } catch (err: any) {
      console.error('Fetch roles error:', err)
      setAlert({ type: 'error', message: 'Terjadi kesalahan jaringan saat memuat peran' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  // Auto-dismiss alert after 5s
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [alert])

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesSearch =
        searchQuery === '' ||
        role.namaRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (role.keterangan && role.keterangan.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && role.active) ||
        (statusFilter === 'inactive' && !role.active)

      return matchesSearch && matchesStatus
    })
  }, [roles, searchQuery, statusFilter])

  // KPI Calculations
  const kpi = useMemo(() => {
    const totalRoles = roles.length
    const activeRoles = roles.filter((r) => r.active).length
    const totalUsers = roles.reduce((acc, r) => acc + (r._count?.users || 0), 0)
    const protectedRoles = roles.filter((r) => r.id === 1).length
    return { totalRoles, activeRoles, totalUsers, protectedRoles }
  }, [roles])

  // Handlers
  const handleOpenAdd = () => {
    setEditingRole(null)
    setFormData({
      namaRole: '',
      keterangan: '',
      active: true,
      cloneRoleId: '',
    })
    setFormError('')
    setIsFormModalOpen(true)
  }

  const handleOpenEdit = (role: RoleItem) => {
    setEditingRole(role)
    setFormData({
      namaRole: role.namaRole,
      keterangan: role.keterangan || '',
      active: role.active,
      cloneRoleId: '',
    })
    setFormError('')
    setIsFormModalOpen(true)
  }

  const handleOpenDelete = (role: RoleItem) => {
    setDeletingRole(role)
    setIsDeleteModalOpen(true)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!formData.namaRole.trim()) {
      setFormError('Nama peran wajib diisi')
      return
    }

    setFormSubmitting(true)
    try {
      if (editingRole) {
        // Mode Edit (PUT)
        const res = await fetch(`/api/pengaturan/roles/${editingRole.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaRole: formData.namaRole.trim(),
            keterangan: formData.keterangan.trim() || null,
            active: formData.active,
          }),
        })
        const json = await res.json()
        if (!json.success) {
          setFormError(json.message || 'Gagal memperbarui peran')
          return
        }
        setAlert({ type: 'success', message: `Peran "${formData.namaRole}" berhasil diperbarui!` })
      } else {
        // Mode Tambah (POST)
        const res = await fetch('/api/pengaturan/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaRole: formData.namaRole.trim(),
            keterangan: formData.keterangan.trim() || null,
            active: formData.active,
            cloneRoleId: formData.cloneRoleId ? parseInt(formData.cloneRoleId, 10) : undefined,
          }),
        })
        const json = await res.json()
        if (!json.success) {
          setFormError(json.message || 'Gagal menambahkan peran')
          return
        }
        setAlert({
          type: 'success',
          message: `Peran baru "${formData.namaRole}" berhasil dibuat${
            formData.cloneRoleId ? ' beserta duplikasi hak akses!' : '!'
          }`,
        })
      }

      setIsFormModalOpen(false)
      fetchRoles()
    } catch (err: any) {
      setFormError('Terjadi kesalahan jaringan: ' + err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingRole) return
    setDeleteSubmitting(true)
    try {
      const res = await fetch(`/api/pengaturan/roles/${deletingRole.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!json.success) {
        setAlert({ type: 'error', message: json.message || 'Gagal menghapus peran' })
        setIsDeleteModalOpen(false)
        return
      }

      setAlert({ type: 'success', message: `Peran "${deletingRole.namaRole}" berhasil dihapus!` })
      setIsDeleteModalOpen(false)
      fetchRoles()
    } catch (err: any) {
      setAlert({ type: 'error', message: 'Gagal menghapus peran: ' + err.message })
      setIsDeleteModalOpen(false)
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {alert && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border p-4 shadow-lg transition-all animate-in fade-in slide-in-from-top-4 duration-300 ${
            alert.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {alert.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <p className="text-sm font-medium">{alert.message}</p>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Manajemen Peran & Wewenang
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola master struktur peran (RBAC), jumlah pengguna terikat, dan konfigurasi perizinan akses sistem.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/pengaturan/hak-akses"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Buka Matriks Hak Akses
          </Link>

          {allowCreate && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Tambah Peran Baru
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Roles */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Peran</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{kpi.totalRoles}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Struktur peran terdaftar</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Peran Aktif */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Peran Aktif</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{kpi.activeRoles}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Dapat digunakan pada akun</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Total Pengguna Terhubung */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pengguna Terhubung</p>
            <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{kpi.totalUsers}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Akun pegawai / staf aktif</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Peran Terproteksi */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Peran Sistem</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{kpi.protectedRoles}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Superadmin terkunci</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau keterangan peran..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-8 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:focus:border-blue-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-48">
            <SearchableSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'active', label: 'Hanya Aktif' },
                { value: 'inactive', label: 'Hanya Nonaktif' },
              ]}
              placeholder="Status Peran"
              searchPlaceholder="Filter status..."
            />
          </div>

          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
              title="Reset Filter"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">ID</th>
                <th className="py-3.5 px-4">Nama Peran & Wewenang</th>
                <th className="py-3.5 px-4">Deskripsi / Keterangan</th>
                <th className="py-3.5 px-4 text-center">Pengguna Terikat</th>
                <th className="py-3.5 px-4 text-center">Akses Modul</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      Memuat daftar peran sistem...
                    </div>
                  </td>
                </tr>
              ) : filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada peran yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const isProtected = role.id === 1
                  return (
                    <tr
                      key={role.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 dark:text-slate-500">
                        #{role.id}
                      </td>

                      {/* Nama Peran */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold ${
                              isProtected
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400'
                            }`}
                          >
                            {isProtected ? <Lock className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {role.namaRole}
                              </span>
                              {isProtected && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                                  Default Sistem
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Dibuat: {new Date(role.createdAt).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Keterangan */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {role.keterangan || (
                          <span className="italic text-slate-400">Tidak ada keterangan wewenang</span>
                        )}
                      </td>

                      {/* Pengguna Terikat */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Users className="h-3.5 w-3.5 text-slate-500" />
                          {role._count?.users || 0} Akun
                        </span>
                      </td>

                      {/* Akses Modul */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {role._count?.roleMenus || 0} Menu
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {role.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Atur Hak Akses */}
                          <Link
                            href={`/pengaturan/hak-akses?roleId=${role.id}`}
                            title="Konfigurasi Matriks Hak Akses"
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-colors"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Hak Akses
                          </Link>

                          {/* Tombol Edit */}
                          {allowEdit && (
                            <button
                              onClick={() => handleOpenEdit(role)}
                              title="Edit Data Peran"
                              className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}

                          {/* Tombol Hapus */}
                          {allowDelete && (
                            <button
                              onClick={() => handleOpenDelete(role)}
                              disabled={isProtected}
                              title={isProtected ? 'Peran sistem tidak dapat dihapus' : 'Hapus Peran'}
                              className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-colors ${
                                isProtected
                                  ? 'cursor-not-allowed opacity-30 text-slate-400'
                                  : 'text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-400'
                              }`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL FORM: TAMBAH / EDIT PERAN */}
      {/* ========================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  {editingRole ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {editingRole ? 'Edit Peran Sistem' : 'Tambah Peran Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingRole
                      ? 'Perbarui informasi identitas dan status peran'
                      : 'Tetapkan nama peran baru dan opsi duplikasi hak akses'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p>{formError}</p>
                </div>
              )}

              {/* Nama Peran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Peran (Role Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaRole}
                  onChange={(e) => setFormData({ ...formData, namaRole: e.target.value })}
                  placeholder="Contoh: Kepala Sekolah, Staf Perpustakaan, Wali Kelas"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Deskripsi / Keterangan Wewenang
                </label>
                <textarea
                  rows={3}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Penjelasan wewenang atau batasan tugas peran ini..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 resize-none"
                />
              </div>

              {/* Status Aktif */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Status Peran Aktif
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Peran nonaktif tidak dapat dipilih saat membuat akun baru
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    disabled={editingRole?.id === 1}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Fitur Duplikasi Hak Akses (Hanya saat Tambah Baru) */}
              {!editingRole && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 dark:border-blue-900/30 dark:bg-blue-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs">
                    <Copy className="h-4 w-4" />
                    <span>Salin Hak Akses dari Peran Lain (Opsional)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Pilih peran acuan untuk menduplikasi perizinan menu secara otomatis ke peran baru ini.
                  </p>
                  <SearchableSelect
                    value={formData.cloneRoleId}
                    onChange={(val) => setFormData({ ...formData, cloneRoleId: val })}
                    options={[
                      { value: '', label: '-- Jangan Salin (Atur Manual Nanti) --' },
                      ...roles.map((r) => ({
                        value: String(r.id),
                        label: r.namaRole,
                        sublabel: `${r._count?.roleMenus || 0} menu diizinkan`,
                      })),
                    ]}
                    placeholder="Pilih Peran Acuan..."
                    searchPlaceholder="Cari peran acuan..."
                  />
                </div>
              )}

              {/* Tombol Aksi Modal */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {formSubmitting ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{editingRole ? 'Simpan Perubahan' : 'Tambah Peran'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL KONFIRMASI HAPUS PERAN */}
      {/* ========================================================= */}
      {isDeleteModalOpen && deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Hapus Peran?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus peran{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                "{deletingRole.namaRole}"
              </span>
              ? Seluruh konfigurasi hak akses modul yang terikat pada peran ini juga akan dihapus.
            </p>

            {deletingRole._count?.users > 0 && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/60 dark:text-rose-300">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Peringatan Proteksi Data!</span>
                </div>
                Peran ini masih digunakan oleh{' '}
                <span className="font-bold">{deletingRole._count.users} akun pengguna</span>. Anda
                harus mengalihkan peran pengguna tersebut ke peran lain terlebih dahulu sebelum
                dapat menghapus peran ini.
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteSubmitting || deletingRole._count?.users > 0}
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:bg-rose-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {deleteSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Ya, Hapus Peran</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

