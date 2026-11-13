'use client'

import React, { useState, useEffect } from 'react'
import { usePermission } from '@/context/PermissionContext'
import {
  Award,
  BookOpen,
  Building2,
  Trophy,
  Star,
  ShieldCheck,
  HeartHandshake,
  Compass,
  Users,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
} from 'lucide-react'

interface KeunggulanItem {
  id: number
  judul: string
  deskripsi: string | null
  icon: string
  urutan: number
  active: boolean
  createdAt: string
}

const AVAILABLE_ICONS = [
  { name: 'Award', icon: Award, label: 'Penghargaan & Akreditasi' },
  { name: 'BookOpen', icon: BookOpen, label: 'Kurikulum & Buku' },
  { name: 'Building2', icon: Building2, label: 'Fasilitas & Gedung' },
  { name: 'Trophy', icon: Trophy, label: 'Piala & Prestasi' },
  { name: 'Star', icon: Star, label: 'Bintang & Keunggulan' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'Karakter & Keamanan' },
  { name: 'HeartHandshake', icon: HeartHandshake, label: 'Sosial & Budi Pekerti' },
  { name: 'Compass', icon: Compass, label: 'Visi & Arah Masa Depan' },
  { name: 'Users', icon: Users, label: 'Komunitas & Pengajar' },
  { name: 'Sparkles', icon: Sparkles, label: 'Inovasi & Teknologi' },
]

export default function CmsKeunggulanPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/cms/keunggulan')
  const allowEdit = canEdit('/cms/keunggulan')
  const allowDelete = canDelete('/cms/keunggulan')

  const [items, setItems] = useState<KeunggulanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<KeunggulanItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    icon: 'Award',
    urutan: 1,
    active: true,
  })

  const fetchKeunggulan = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/cms/keunggulan')
      const json = await res.json()
      if (json.success) {
        setItems(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeunggulan()
  }, [])

  const handleOpenAdd = () => {
    setSelectedItem(null)
    setFormData({
      judul: '',
      deskripsi: '',
      icon: 'Award',
      urutan: items.length + 1,
      active: true,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: KeunggulanItem) => {
    setSelectedItem(item)
    setFormData({
      judul: item.judul,
      deskripsi: item.deskripsi || '',
      icon: item.icon || 'Award',
      urutan: item.urutan,
      active: item.active,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.judul.trim()) {
      alert('Judul pilar keunggulan wajib diisi!')
      return
    }

    try {
      setSubmitting(true)
      const url = '/api/cms/keunggulan'
      const method = selectedItem ? 'PUT' : 'POST'
      const payload = selectedItem ? { id: selectedItem.id, ...formData } : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (json.success) {
        setIsModalOpen(false)
        fetchKeunggulan()
      } else {
        alert(json.message || 'Gagal menyimpan kartu keunggulan')
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus kartu keunggulan ini?')) return
    try {
      const res = await fetch(`/api/cms/keunggulan?id=${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        fetchKeunggulan()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleActive = async (item: KeunggulanItem) => {
    try {
      const res = await fetch('/api/cms/keunggulan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, active: !item.active }),
      })
      const json = await res.json()
      if (json.success) {
        fetchKeunggulan()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const renderIcon = (iconName: string) => {
    const found = AVAILABLE_ICONS.find((i) => i.name === iconName)
    const IconComp = found ? found.icon : Award
    return <IconComp className="h-6 w-6 text-primary" />
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Award className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pilar Keunggulan Sekolah
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola 4 pilar utama nilai unggul dan daya saing sekolah yang ditampilkan di beranda publik.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/portal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Eye className="h-4 w-4" />
            <span>Lihat di Portal</span>
          </a>
          {allowCreate && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Keunggulan</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Kartu Keunggulan */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Memuat kartu keunggulan...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <Award className="h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">
            Belum ada kartu keunggulan
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Tambahkan pilar keunggulan untuk memikat calon santri/siswa baru di landing page.
          </p>
          {allowCreate && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-900 ${
                item.active
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-dashed border-slate-300 opacity-60 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20">
                    {renderIcon(item.icon)}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    #{item.urutan}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  {item.judul}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3 dark:text-slate-400">
                  {item.deskripsi || 'Tidak ada uraian deskripsi.'}
                </p>
              </div>

              {/* Toolbar Aksi Bawah */}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                {allowEdit ? (
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`flex items-center gap-1 text-xs font-semibold ${
                      item.active
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {item.active ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Aktif</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Nonaktif</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span
                    className={`flex items-center gap-1 text-xs font-semibold ${
                      item.active
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {item.active ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Aktif</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Nonaktif</span>
                      </>
                    )}
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  {allowEdit && (
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                      title="Edit Keunggulan"
                    >
                      <Edit3 className="h-4 w-4 text-blue-500" />
                    </button>
                  )}
                  {allowDelete && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      title="Hapus Keunggulan"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedItem ? 'Edit Kartu Keunggulan' : 'Tambah Kartu Keunggulan Baru'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Pilih ikon representatif, judul pilar, dan narasi penjelasan keunggulan institusi.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Pilih Ikon Vektor
                </label>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map((ic) => {
                    const IconC = ic.icon
                    const isSelected = formData.icon === ic.name
                    return (
                      <button
                        type="button"
                        key={ic.name}
                        onClick={() => setFormData({ ...formData, icon: ic.name })}
                        className={`flex flex-col items-center justify-center rounded-xl p-2.5 transition ${
                          isSelected
                            ? 'bg-primary text-white shadow-md'
                            : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                        title={ic.label}
                      >
                        <IconC className="h-5 w-5" />
                        <span className="mt-1 text-[10px] truncate max-w-full">{ic.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Judul Keunggulan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Kurikulum Terintegrasi & Berkarakter"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Jelaskan secara ringkas poin keunggulan ini..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Nomor Urutan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.urutan}
                    onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) || 1 })}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="keunggulanActive"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="keunggulanActive" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Aktif Tayang
                  </label>
                </div>
              </div>

              {/* Tombol Simpan */}
              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : selectedItem ? 'Simpan Perubahan' : 'Tambah Keunggulan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
