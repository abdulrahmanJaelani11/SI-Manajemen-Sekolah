'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { usePermission } from '@/context/PermissionContext'
import {
  Menu as MenuIcon,
  Plus,
  Pencil,
  Trash2,
  Search,
  Folder,
  Layers,
  ShieldAlert,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { Icon } from '@iconify/react'
import SearchableSelect from '@/components/ui/searchable-select'

interface MenuItem {
  id: number
  namaMenu: string
  path: string
  icon: string
  groupMenu: string
  urutan: number
  rolesAllowedCount: number
  isProtected: boolean
}

// Koleksi preset ikon Solar yang sering digunakan di aplikasi sekolah
const POPULAR_ICONS = [
  { icon: 'solar:widget-2-linear', label: 'Dashboard' },
  { icon: 'solar:users-group-two-rounded-linear', label: 'Siswa / Murid' },
  { icon: 'solar:user-speak-rounded-linear', label: 'Guru / Pegawai' },
  { icon: 'solar:buildings-2-linear', label: 'Kelas / Gedung' },
  { icon: 'solar:diploma-linear', label: 'Jurusan / Sertifikat' },
  { icon: 'solar:calendar-mark-linear', label: 'Kalender / Jadwal' },
  { icon: 'solar:book-2-linear', label: 'Buku / Mapel' },
  { icon: 'solar:wallet-money-linear', label: 'Kasir / SPP' },
  { icon: 'solar:bill-list-linear', label: 'Tagihan / Keuangan' },
  { icon: 'solar:clock-square-linear', label: 'Waktu / Jam' },
  { icon: 'solar:shield-keyhole-linear', label: 'Keamanan / Akses' },
  { icon: 'solar:settings-linear', label: 'Pengaturan' },
  { icon: 'solar:history-linear', label: 'Riwayat / Audit' },
  { icon: 'solar:qr-code-linear', label: 'Scan QR / Presensi' },
  { icon: 'solar:document-text-linear', label: 'Laporan / Berita' },
  { icon: 'solar:menu-dots-square-linear', label: 'Menu Navigasi' },
]

export default function ManajemenMenuPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/pengaturan/menu')
  const allowEdit = canEdit('/pengaturan/menu')
  const allowDelete = canDelete('/pengaturan/menu')

  const [menus, setMenus] = useState<MenuItem[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    namaMenu: '',
    path: '',
    icon: 'solar:widget-2-linear',
    groupMenu: '',
    customGroup: '',
    urutan: 1,
  })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const fetchMenus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pengaturan/menu')
      const json = await res.json()
      if (json.success && json.data) {
        setMenus(json.data.menus || [])
        setGroups(json.data.groups || [])
      }
    } catch (err) {
      console.error('Fetch menus error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenus()
  }, [])

  // Auto-dismiss toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [successToast])

  // Filtered menu list
  const filteredMenus = useMemo(() => {
    return menus.filter((m) => {
      const matchSearch =
        !search ||
        m.namaMenu.toLowerCase().includes(search.toLowerCase()) ||
        m.path.toLowerCase().includes(search.toLowerCase()) ||
        m.groupMenu.toLowerCase().includes(search.toLowerCase())
      const matchGroup = !selectedGroup || m.groupMenu === selectedGroup
      return matchSearch && matchGroup
    })
  }, [menus, search, selectedGroup])

  // Grouped menus Map
  const groupedMenus = useMemo(() => {
    const map = new Map<string, MenuItem[]>()
    for (const m of filteredMenus) {
      if (!map.has(m.groupMenu)) {
        map.set(m.groupMenu, [])
      }
      map.get(m.groupMenu)!.push(m)
    }
    return map
  }, [filteredMenus])

  // Open modal create
  const handleOpenAdd = () => {
    setEditingMenu(null)
    const defaultGroup = selectedGroup || groups[0] || 'Utama'
    const menusInGroup = menus.filter((m) => m.groupMenu === defaultGroup)
    const nextUrutan = menusInGroup.length > 0 ? Math.max(...menusInGroup.map((m) => m.urutan)) + 1 : 1

    setFormData({
      namaMenu: '',
      path: '',
      icon: 'solar:widget-2-linear',
      groupMenu: defaultGroup,
      customGroup: '',
      urutan: nextUrutan,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  // Open modal edit
  const handleOpenEdit = (menu: MenuItem) => {
    setEditingMenu(menu)
    setFormData({
      namaMenu: menu.namaMenu,
      path: menu.path,
      icon: menu.icon,
      groupMenu: menu.groupMenu,
      customGroup: '',
      urutan: menu.urutan,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  // Save menu
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    const finalGroup = formData.customGroup.trim() ? formData.customGroup.trim() : formData.groupMenu

    try {
      const url = editingMenu ? `/api/pengaturan/menu/${editingMenu.id}` : '/api/pengaturan/menu'
      const method = editingMenu ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaMenu: formData.namaMenu,
          path: formData.path,
          icon: formData.icon,
          groupMenu: finalGroup,
          urutan: formData.urutan,
        }),
      })

      const json = await res.json()
      if (!json.success) {
        setFormError(json.message || 'Gagal menyimpan menu')
        return
      }

      setIsModalOpen(false)
      setSuccessToast(editingMenu ? 'Menu berhasil diperbarui' : 'Menu baru berhasil didaftarkan')
      fetchMenus()

      // Picu pembaruan real-time pada Sidebar
      window.dispatchEvent(new Event('menu-updated'))
    } catch (err: any) {
      setFormError('Terjadi kesalahan jaringan: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Delete menu
  const handleDelete = async (menu: MenuItem) => {
    if (menu.isProtected) {
      alert(`Menu "${menu.namaMenu}" merupakan rute sistem terproteksi dan tidak boleh dihapus.`)
      return
    }

    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus menu "${menu.namaMenu}" (${menu.path})?\n\nPerhatian: Hak akses role pada menu ini juga akan dicabut.`
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/pengaturan/menu/${menu.id}`, { method: 'DELETE' })
      const json = await res.json()

      if (!json.success) {
        alert(json.message || 'Gagal menghapus menu')
        return
      }

      setSuccessToast(`Menu "${menu.namaMenu}" berhasil dihapus`)
      fetchMenus()
      window.dispatchEvent(new Event('menu-updated'))
    } catch (err: any) {
      alert('Error saat menghapus menu: ' + err.message)
    }
  }

  // Quick swap urutan (naik / turun)
  const handleMoveOrder = async (menu: MenuItem, direction: 'up' | 'down') => {
    const groupItems = menus
      .filter((m) => m.groupMenu === menu.groupMenu)
      .sort((a, b) => a.urutan - b.urutan)

    const currentIndex = groupItems.findIndex((m) => m.id === menu.id)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= groupItems.length) return

    const targetMenu = groupItems[targetIndex]

    // Tukar nomor urutan
    try {
      const res = await fetch('/api/pengaturan/menu/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { id: menu.id, urutan: targetMenu.urutan },
            { id: targetMenu.id, urutan: menu.urutan },
          ],
        }),
      })

      const json = await res.json()
      if (json.success) {
        fetchMenus()
        window.dispatchEvent(new Event('menu-updated'))
      } else {
        alert(json.message || 'Gagal mengubah urutan')
      }
    } catch (err: any) {
      alert('Gagal mengubah urutan: ' + err.message)
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Manajemen Menu Sistem
            </h1>
            <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Direktori & Sidebar
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola hierarki rute URL, tata letak grup navigasi, ikon sistem, dan urutan menu di sidebar sekolah.
          </p>
        </div>

        {allowCreate && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-[#1E3A8A] transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Menu Baru</span>
          </button>
        )}
      </div>

      {/* 3 Kartu Metrik Ringkas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Rute Menu
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <MenuIcon className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white font-mono">
            {menus.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Terdaftar dalam basis data sistem</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Grup Navigasi
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {groups.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kelompok navigasi modul</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Menu Terproteksi
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {menus.filter((m) => m.isProtected).length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Rute inti terlindungi dari hapus</p>
        </div>
      </div>

      {/* Toolbar Filter & Pencarian */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama menu, path URL (/siswa), atau grup..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <SearchableSelect
              value={selectedGroup}
              onChange={(val) => setSelectedGroup(val)}
              options={[
                { value: '', label: 'Semua Kelompok Grup' },
                ...groups.map((g) => ({ value: g, label: g })),
              ]}
              placeholder="Filter Grup Menu"
              searchPlaceholder="Cari nama grup..."
            />
          </div>
        </div>
      </div>

      {/* Daftar Menu per Grup */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Memuat daftar menu sistem...
          </p>
        </div>
      ) : groupedMenus.size === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
          <Folder className="h-10 w-10 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">Tidak ada menu yang cocok</p>
          <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter grup Anda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedMenus.entries()).map(([groupName, groupItems]) => (
            <div
              key={groupName}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Header Grup */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {groupName}
                    </h2>
                  </div>
                </div>
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  {groupItems.length} Sub-Menu
                </span>
              </div>

              {/* Tabel Menu dalam Grup */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="border-b border-slate-200 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                    <tr>
                      <th scope="col" className="px-4 py-3 w-16 text-center">
                        Urut
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Nama Menu & Navigasi
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Rute URL (Path)
                      </th>
                      <th scope="col" className="px-4 py-3 text-center">
                        Izin Peran (RBAC)
                      </th>
                      <th scope="col" className="px-4 py-3 text-center">
                        Status Proteksi
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {groupItems.map((m, idx) => (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Urutan & Tombol Reorder */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="w-6 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              #{m.urutan}
                            </span>
                            {allowEdit && (
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => handleMoveOrder(m, 'up')}
                                  disabled={idx === 0}
                                  title="Geser Naik"
                                  className="text-slate-400 hover:text-blue-600 disabled:opacity-20 transition"
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveOrder(m, 'down')}
                                  disabled={idx === groupItems.length - 1}
                                  title="Geser Turun"
                                  className="text-slate-400 hover:text-blue-600 disabled:opacity-20 transition"
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Ikon & Nama Menu */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/40 shadow-2xs">
                              <Icon icon={m.icon} height={20} width={20} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {m.namaMenu}
                              </p>
                              <p className="text-[11px] font-mono text-slate-400">
                                Icon: {m.icon}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Rute URL */}
                        <td className="px-4 py-3.5">
                          <a
                            href={m.path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                          >
                            <span>{m.path}</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                        </td>

                        {/* Hak Akses RBAC */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {m.rolesAllowedCount} Peran Mengakses
                          </span>
                        </td>

                        {/* Status Proteksi */}
                        <td className="px-4 py-3.5 text-center">
                          {m.isProtected ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <ShieldCheck className="h-3 w-3" />
                              Sistem Vital
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                              <Sparkles className="h-3 w-3" />
                              Kustom
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {allowEdit && (
                              <button
                                onClick={() => handleOpenEdit(m)}
                                title="Ubah Konfigurasi Menu"
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400 transition"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {allowDelete && (
                              <button
                                onClick={() => handleDelete(m)}
                                disabled={m.isProtected}
                                title={
                                  m.isProtected
                                    ? 'Menu sistem inti terproteksi dari penghapusan'
                                    : 'Hapus Menu'
                                }
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 disabled:opacity-25 dark:hover:bg-slate-800 dark:hover:text-rose-400 transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Ubah Menu */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  <MenuIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingMenu ? 'Ubah Menu Sistem' : 'Tambah Menu Baru'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Konfigurasi nama, rute path, ikon navigasi, dan kelompok grup.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              {/* Nama Menu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Menu Navigasi *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jadwal Mengajar Guru"
                  value={formData.namaMenu}
                  onChange={(e) => setFormData({ ...formData, namaMenu: e.target.value })}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Path URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rute URL (Path) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: /akademik/jadwal-guru"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  disabled={editingMenu?.isProtected}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono text-slate-900 focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {editingMenu?.isProtected ? (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                    🔒 Rute URL sistem terproteksi dan tidak dapat diubah jalurnya.
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Harus diawali dengan tanda garis miring (slash), misalnya: <code>/spp/transaksi</code>
                  </p>
                )}
              </div>

              {/* Grup Menu & Urutan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelompok Grup Menu *
                  </label>
                  <SearchableSelect
                    value={formData.groupMenu}
                    onChange={(val) => setFormData({ ...formData, groupMenu: val })}
                    options={groups.map((g) => ({ value: g, label: g }))}
                    placeholder="Pilih Grup Menu"
                    searchPlaceholder="Cari grup..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Atau Buat Grup Baru
                  </label>
                  <input
                    type="text"
                    placeholder="Ketik nama grup baru..."
                    value={formData.customGroup}
                    onChange={(e) => setFormData({ ...formData, customGroup: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Urut Tampilan
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.urutan}
                  onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value, 10) || 1 })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Ikon Navigasi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ikon Navigasi (Iconify / Solar Icons) *
                  </label>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                    Live Preview
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                    <Icon icon={formData.icon || 'solar:widget-2-linear'} height={24} width={24} />
                  </div>
                  <input
                    type="text"
                    placeholder="solar:widget-2-linear"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Preset Icon Cepat */}
                <div className="mt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Pilihan Cepat Ikon Populer:
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {POPULAR_ICONS.map((p) => (
                      <button
                        type="button"
                        key={p.icon}
                        onClick={() => setFormData({ ...formData, icon: p.icon })}
                        title={p.label}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition text-center ${
                          formData.icon === p.icon
                            ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon icon={p.icon} height={18} width={18} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition active:scale-95"
                >
                  {submitting ? 'Menyimpan...' : editingMenu ? 'Simpan Perubahan' : 'Tambah Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
