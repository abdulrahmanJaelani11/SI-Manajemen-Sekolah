'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ShieldCheck,
  CheckSquare,
  Square,
  Save,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Users,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'

interface RoleItem {
  id: number
  namaRole: string
  keterangan?: string
}

interface MatrixItem {
  menuId: number
  namaMenu: string
  path: string
  icon?: string
  groupMenu?: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

function HakAksesContent() {
  const searchParams = useSearchParams()
  const queryRoleId = searchParams.get('roleId')

  const [roles, setRoles] = useState<RoleItem[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number>(1)
  const [matrix, setMatrix] = useState<MatrixItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch Roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch('/api/pengaturan/roles')
        const data = await res.json()
        if (data.success && data.data.length > 0) {
          setRoles(data.data)
          if (queryRoleId) {
            const parsed = parseInt(queryRoleId, 10)
            if (data.data.some((r: any) => r.id === parsed)) {
              setSelectedRoleId(parsed)
              return
            }
          }
          setSelectedRoleId(data.data[0].id)
        }
      } catch (err) {
        console.error('Fetch roles error:', err)
      }
    }

    fetchRoles()
  }, [queryRoleId])

  // Fetch Matrix for selected role
  const fetchMatrix = async (roleId: number) => {
    setLoading(true)
    setStatusMessage(null)
    try {
      const res = await fetch(`/api/pengaturan/hak-akses?roleId=${roleId}`)
      const data = await res.json()
      if (data.success) {
        setMatrix(data.data.matrix)
      }
    } catch (err) {
      console.error('Fetch matrix error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedRoleId) {
      fetchMatrix(selectedRoleId)
    }
  }, [selectedRoleId])

  // Toggle individual permission
  const handleToggle = (menuId: number, field: 'canView' | 'canCreate' | 'canEdit' | 'canDelete') => {
    setMatrix((prev) =>
      prev.map((item) =>
        item.menuId === menuId ? { ...item, [field]: !item[field] } : item
      )
    )
  }

  // Toggle all permissions on row
  const handleToggleRow = (menuId: number, enableAll: boolean) => {
    setMatrix((prev) =>
      prev.map((item) =>
        item.menuId === menuId
          ? {
              ...item,
              canView: enableAll,
              canCreate: enableAll,
              canEdit: enableAll,
              canDelete: enableAll,
            }
          : item
      )
    )
  }

  // Pilih Semua Akses
  const handleSelectAll = (selectAll: boolean) => {
    setMatrix((prev) =>
      prev.map((item) => ({
        ...item,
        canView: selectAll,
        canCreate: selectAll,
        canEdit: selectAll,
        canDelete: selectAll,
      }))
    )
  }

  // Simpan Matriks
  const handleSave = async () => {
    setSaving(true)
    setStatusMessage(null)

    try {
      const payload = {
        roleId: selectedRoleId,
        permissions: matrix.map((m) => ({
          menuId: m.menuId,
          canView: m.canView,
          canCreate: m.canCreate,
          canEdit: m.canEdit,
          canDelete: m.canDelete,
        })),
      }

      const res = await fetch('/api/pengaturan/hak-akses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const resJson = await res.json()

      if (resJson.success) {
        setStatusMessage({ type: 'success', text: 'Matriks izin hak akses berhasil diperbarui dan disimpan!' })
      } else {
        setStatusMessage({ type: 'error', text: resJson.message || 'Gagal menyimpan hak akses' })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Terjadi kesalahan jaringan: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  const selectedRoleObj = roles.find((r) => r.id === selectedRoleId)
  const isAdminRole = selectedRoleObj?.namaRole.toLowerCase() === 'administrator'

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Matriks Hak Akses & Peran (RBAC)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kontrol akses berbasis peran (Role-Based Access Control) terinci hingga tingkat aksi: Lihat, Tambah, Ubah, dan Hapus.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pengaturan/role"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Users className="h-4 w-4 text-slate-500" />
            Kelola Master Peran
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition-all"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan Hak Akses'}
          </button>
        </div>
      </div>

      {/* Role Selector & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 w-72">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            Pilih Peran:
          </label>
          <SearchableSelect
            value={selectedRoleId}
            onChange={(val) => setSelectedRoleId(parseInt(val, 10))}
            options={roles.map((r) => ({
              value: String(r.id),
              label: r.namaRole,
            }))}
            placeholder="Pilih Peran"
            searchPlaceholder="Cari peran..."
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSelectAll(true)}
            disabled={isAdminRole}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
            Pilih Semua Akses
          </button>
          <button
            onClick={() => handleSelectAll(false)}
            disabled={isAdminRole}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <Square className="h-3.5 w-3.5 text-rose-600" />
            Hapus Semua Akses
          </button>
        </div>
      </div>

      {/* Info Status / Alert */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {isAdminRole && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-3.5 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <Lock className="h-4 w-4 flex-shrink-0 text-blue-600" />
          <span>
            Peran <strong>Administrator</strong> memiliki izin mutlak (Superuser) di seluruh menu dan tindakan dalam sistem.
          </span>
        </div>
      )}

      {/* Tabel Matriks RBAC */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  Menu & Rute Sistem
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Kategori
                </th>
                <th scope="col" className="px-4 py-3.5 text-center w-28">
                  Lihat (View)
                </th>
                <th scope="col" className="px-4 py-3.5 text-center w-28">
                  Tambah (Create)
                </th>
                <th scope="col" className="px-4 py-3.5 text-center w-28">
                  Ubah (Edit)
                </th>
                <th scope="col" className="px-4 py-3.5 text-center w-28">
                  Hapus (Delete)
                </th>
                <th scope="col" className="px-4 py-3.5 text-right w-28">
                  Aksi Baris
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Memuat matriks perizinan...
                  </td>
                </tr>
              ) : (
                matrix.map((m) => (
                  <tr
                    key={m.menuId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {m.namaMenu}
                      </p>
                      <p className="font-mono text-xs text-slate-400">{m.path}</p>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {m.groupMenu || 'Sistem'}
                      </span>
                    </td>

                    {/* View */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={m.canView}
                        disabled={isAdminRole}
                        onChange={() => handleToggle(m.menuId, 'canView')}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>

                    {/* Create */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={m.canCreate}
                        disabled={isAdminRole}
                        onChange={() => handleToggle(m.menuId, 'canCreate')}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>

                    {/* Edit */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={m.canEdit}
                        disabled={isAdminRole}
                        onChange={() => handleToggle(m.menuId, 'canEdit')}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={m.canDelete}
                        disabled={isAdminRole}
                        onChange={() => handleToggle(m.menuId, 'canDelete')}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>

                    <td className="px-4 py-3 text-right">
                      {!isAdminRole && (
                        <div className="flex items-center justify-end gap-1 text-[11px]">
                          <button
                            onClick={() => handleToggleRow(m.menuId, true)}
                            className="rounded px-1.5 py-0.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 font-semibold"
                          >
                            Semua
                          </button>
                          <span>/</span>
                          <button
                            onClick={() => handleToggleRow(m.menuId, false)}
                            className="rounded px-1.5 py-0.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 font-semibold"
                          >
                            Kosong
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function HakAksesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat matriks hak akses...</div>}>
      <HakAksesContent />
    </Suspense>
  )
}
