'use client'

import React, { useState, useEffect } from 'react'
import {
  Sliders,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  MoveUp,
  MoveDown,
} from 'lucide-react'

interface CarouselItem {
  id: number
  badge: string | null
  judul: string
  deskripsi: string | null
  fotoUrl: string | null
  link1Text: string | null
  link1Url: string | null
  link2Text: string | null
  link2Url: string | null
  urutan: number
  active: boolean
  createdAt: string
}

export default function CmsCarouselPage() {
  const [carousels, setCarousels] = useState<CarouselItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CarouselItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    badge: 'Informasi Sekolah',
    judul: '',
    deskripsi: '',
    fotoUrl: '',
    link1Text: 'Pelajari Selengkapnya',
    link1Url: '#profil',
    link2Text: 'Hubungi Kami',
    link2Url: '#kontak',
    urutan: 1,
    active: true,
  })

  const fetchCarousels = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/cms/carousel')
      const json = await res.json()
      if (json.success) {
        setCarousels(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCarousels()
  }, [])

  const handleOpenAdd = () => {
    setSelectedItem(null)
    setFormData({
      badge: 'Informasi Sekolah',
      judul: '',
      deskripsi: '',
      fotoUrl: '',
      link1Text: 'Pelajari Selengkapnya',
      link1Url: '#profil',
      link2Text: 'Hubungi Kami',
      link2Url: '#kontak',
      urutan: carousels.length + 1,
      active: true,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: CarouselItem) => {
    setSelectedItem(item)
    setFormData({
      badge: item.badge || '',
      judul: item.judul,
      deskripsi: item.deskripsi || '',
      fotoUrl: item.fotoUrl || '',
      link1Text: item.link1Text || '',
      link1Url: item.link1Url || '',
      link2Text: item.link2Text || '',
      link2Url: item.link2Url || '',
      urutan: item.urutan,
      active: item.active,
    })
    setIsModalOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('folder', 'carousel')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      })
      const json = await res.json()
      if (json.success) {
        setFormData((prev) => ({ ...prev, fotoUrl: json.data.url }))
      } else {
        alert(json.message || 'Gagal mengunggah foto banner')
      }
    } catch (err: any) {
      alert('Error saat mengunggah foto: ' + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.judul.trim()) {
      alert('Judul headline wajib diisi!')
      return
    }

    try {
      setSubmitting(true)
      const url = '/api/cms/carousel'
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
        fetchCarousels()
      } else {
        alert(json.message || 'Gagal menyimpan carousel')
      }
    } catch (err: any) {
      alert('Error simpan carousel: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus banner carousel ini?')) return
    try {
      const res = await fetch(`/api/cms/carousel?id=${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        fetchCarousels()
      } else {
        alert(json.message || 'Gagal menghapus carousel')
      }
    } catch (err: any) {
      alert('Error hapus carousel: ' + err.message)
    }
  }

  const handleToggleActive = async (item: CarouselItem) => {
    try {
      const res = await fetch('/api/cms/carousel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, active: !item.active }),
      })
      const json = await res.json()
      if (json.success) {
        fetchCarousels()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-primary/10 p-2 text-primary dark:bg-primary/20">
              <Sliders className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Banner Hero Carousel
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola slide hero animasi pada halaman depan beranda portal publik sekolah.
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
            <span>Lihat Portal Publik</span>
          </a>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Slide Banner</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Banner</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{carousels.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Slide Tayang (Aktif)</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {carousels.filter((c) => c.active).length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Animasi Banner</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Cross-Fade Transition</p>
          </div>
        </div>
      </div>

      {/* Grid Banner Cards */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Memuat slide carousel...</span>
          </div>
        </div>
      ) : carousels.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <Sliders className="h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">
            Belum ada banner carousel
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Klik tombol &quot;Tambah Slide Banner&quot; untuk membuat slide hero portal utama.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {carousels.map((item, index) => (
            <div
              key={item.id}
              className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md dark:bg-slate-900 ${
                item.active
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-dashed border-slate-300 opacity-60 dark:border-slate-800'
              }`}
            >
              {/* Preview Banner Mockup */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                {item.fotoUrl ? (
                  <img
                    src={item.fotoUrl}
                    alt={item.judul}
                    className="h-full w-full object-cover opacity-60"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-slate-900 via-primary/80 to-slate-900">
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                      Standard Modern Pattern
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-5 flex flex-col justify-end text-white">
                  {item.badge && (
                    <span className="inline-block self-start rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-xs font-bold tracking-wide text-white shadow">
                      {item.badge}
                    </span>
                  )}
                  <h3 className="mt-2 text-lg font-bold leading-snug line-clamp-2 drop-shadow-md">
                    {item.judul}
                  </h3>
                </div>

                <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
                  <span>Urutan #{item.urutan}</span>
                </div>
              </div>

              {/* Konten Keterangan & Link */}
              <div className="p-5">
                <p className="text-sm text-slate-600 line-clamp-2 dark:text-slate-300">
                  {item.deskripsi || 'Tidak ada deskripsi tambahan.'}
                </p>

                {/* Tombol CTA */}
                <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {item.link1Text && (
                    <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/20">
                      <span>{item.link1Text}</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  )}
                  {item.link2Text && (
                    <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <span>{item.link2Text}</span>
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>

              {/* Toolbar Aksi Bawah */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => handleToggleActive(item)}
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    item.active
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {item.active ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Aktif Tayang</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>Nonaktif</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 dark:border-red-900/40 dark:bg-slate-800 dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Carousel */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedItem ? 'Edit Banner Carousel' : 'Tambah Banner Carousel Baru'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Isi parameter headline, narasi, dan tautan tombol untuk banner beranda depan.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Badge Kategori
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="Contoh: PPDB 2024/2025"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Urutan Tayang
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.urutan}
                    onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) || 1 })}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Judul Headline Utama *
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Membina Generasi Berkarakter Unggul & Mandiri"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Deskripsi Narasi Ringkas
                </label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Tuliskan 1-2 kalimat pengantar..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>

              {/* Upload Foto Banner */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Foto Banner Latar Belakang
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="text"
                    value={formData.fotoUrl}
                    onChange={(e) => setFormData({ ...formData, fotoUrl: e.target.value })}
                    placeholder="URL gambar atau unggah berkas..."
                    className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                  />
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Upload className="h-4 w-4" />
                    <span>{isUploading ? 'Mengunggah...' : 'Unggah'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Tombol Aksi 1 & 2 */}
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800/40">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tombol Aksi 1 (Teks)
                  </label>
                  <input
                    type="text"
                    value={formData.link1Text}
                    onChange={(e) => setFormData({ ...formData, link1Text: e.target.value })}
                    placeholder="Pelajari Selengkapnya"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    value={formData.link1Url}
                    onChange={(e) => setFormData({ ...formData, link1Url: e.target.value })}
                    placeholder="Tautan URL: #profil atau /portal/profil"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tombol Aksi 2 (Teks)
                  </label>
                  <input
                    type="text"
                    value={formData.link2Text}
                    onChange={(e) => setFormData({ ...formData, link2Text: e.target.value })}
                    placeholder="Hubungi Kami"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    value={formData.link2Url}
                    onChange={(e) => setFormData({ ...formData, link2Url: e.target.value })}
                    placeholder="Tautan URL: #kontak atau /portal/kegiatan"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="activeCheck" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tampilkan slide ini di beranda depan publik
                </label>
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
                  {submitting ? 'Menyimpan...' : selectedItem ? 'Simpan Perubahan' : 'Tambah Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
