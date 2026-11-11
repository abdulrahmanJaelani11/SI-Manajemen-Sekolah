'use client'

import React, { useState, useEffect } from 'react'
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Eye,
  Calendar,
} from 'lucide-react'

interface KegiatanItem {
  id: number
  judul: string
  deskripsi: string | null
  fotoUrl: string | null
  tanggal: string | null
  createdAt: string
}

export default function CmsKegiatanPage() {
  const [kegiatan, setKegiatan] = useState<KegiatanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<KegiatanItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    fotoUrl: '',
    tanggal: '',
  })

  const fetchKegiatan = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/cms/kegiatan')
      const json = await res.json()
      if (json.success) {
        setKegiatan(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKegiatan()
  }, [])

  const handleOpenAdd = () => {
    setSelectedItem(null)
    setFormData({
      judul: '',
      deskripsi: '',
      fotoUrl: '',
      tanggal: new Date().toISOString().split('T')[0],
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: KegiatanItem) => {
    setSelectedItem(item)
    setFormData({
      judul: item.judul,
      deskripsi: item.deskripsi || '',
      fotoUrl: item.fotoUrl || '',
      tanggal: item.tanggal ? item.tanggal.split('T')[0] : '',
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
      uploadData.append('folder', 'kegiatan')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      })
      const json = await res.json()
      if (json.success) {
        setFormData((prev) => ({ ...prev, fotoUrl: json.data.url }))
      } else {
        alert(json.message || 'Gagal mengunggah foto kegiatan')
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
      alert('Judul kegiatan wajib diisi!')
      return
    }

    try {
      setSubmitting(true)
      const url = '/api/cms/kegiatan'
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
        fetchKegiatan()
      } else {
        alert(json.message || 'Gagal menyimpan kegiatan')
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus agenda kegiatan ini?')) return
    try {
      const res = await fetch(`/api/cms/kegiatan?id=${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        fetchKegiatan()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-rose-500/10 p-2 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
              <CalendarDays className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dokumentasi Kegiatan & Agenda
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Galeri dokumentasi kegiatan ekstrakurikuler, pentas seni, olimpiade, dan agenda seremonial sekolah.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/portal/kegiatan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Eye className="h-4 w-4" />
            <span>Lihat Galeri Publik</span>
          </a>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Kegiatan</span>
          </button>
        </div>
      </div>

      {/* Grid Kegiatan */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Memuat galeri kegiatan...</span>
          </div>
        </div>
      ) : kegiatan.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <CalendarDays className="h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">
            Belum ada dokumentasi kegiatan
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Mulai dokumentasikan agenda dan kemeriahan aktivitas siswa di sekolah.
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kegiatan.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {item.fotoUrl ? (
                    <img
                      src={item.fotoUrl}
                      alt={item.judul}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <CalendarDays className="h-12 w-12 stroke-[1.5]" />
                    </div>
                  )}

                  {item.tanggal && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {new Date(item.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-base font-bold text-slate-900 line-clamp-2 dark:text-white">
                    {item.judul}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3 dark:text-slate-400">
                    {item.deskripsi || 'Tidak ada deskripsi detail kegiatan.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedItem ? 'Edit Dokumentasi Kegiatan' : 'Tambah Dokumentasi Baru'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Unggah foto dan isi deskripsi agenda sekolah untuk publikasi galeri.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Judul Acara / Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Pentas Seni Nusantara & Pameran Karya Siswa"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Tanggal Pelaksanaan
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Foto Dokumentasi Acara
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
                    <span>{isUploading ? 'Unggah...' : 'Unggah'}</span>
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

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Deskripsi Kegiatan
                </label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Rangkaian kegiatan, tujuan, dan pihak yang terlibat..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                />
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
                  {submitting ? 'Menyimpan...' : selectedItem ? 'Simpan Perubahan' : 'Tambah Kegiatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
