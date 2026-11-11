'use client'

import React, { useState, useEffect } from 'react'
import {
  Newspaper,
  Plus,
  Trash2,
  Edit3,
  Search,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  User,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'

interface BeritaItem {
  id: number
  judul: string
  slug: string
  ringkasan: string | null
  deskripsi: string
  fotoUrl: string | null
  kategori: string | null
  penulis: string | null
  published: boolean
  createdAt: string
  updatedAt: string
}

const KATEGORI_LIST = ['Semua', 'Pengumuman', 'Akademik', 'Prestasi', 'Kegiatan']

export default function CmsBeritaPage() {
  const [beritaList, setBeritaList] = useState<BeritaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kategoriFilter, setKategoriFilter] = useState('Semua')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BeritaItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    judul: '',
    slug: '',
    ringkasan: '',
    deskripsi: '',
    fotoUrl: '',
    kategori: 'Pengumuman',
    penulis: 'Admin Sekolah',
    published: true,
  })

  const fetchBerita = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search.trim()) params.append('search', search.trim())
      if (kategoriFilter !== 'Semua') params.append('kategori', kategoriFilter)
      params.append('published', 'all')

      const res = await fetch(`/api/cms/berita?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setBeritaList(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBerita()
  }, [kategoriFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBerita()
  }

  const handleOpenAdd = () => {
    setSelectedItem(null)
    setFormData({
      judul: '',
      slug: '',
      ringkasan: '',
      deskripsi: '',
      fotoUrl: '',
      kategori: 'Pengumuman',
      penulis: 'Admin Sekolah',
      published: true,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: BeritaItem) => {
    setSelectedItem(item)
    setFormData({
      judul: item.judul,
      slug: item.slug,
      ringkasan: item.ringkasan || '',
      deskripsi: item.deskripsi,
      fotoUrl: item.fotoUrl || '',
      kategori: item.kategori || 'Pengumuman',
      penulis: item.penulis || 'Admin Sekolah',
      published: item.published,
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
      uploadData.append('folder', 'berita')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      })
      const json = await res.json()
      if (json.success) {
        setFormData((prev) => ({ ...prev, fotoUrl: json.data.url }))
      } else {
        alert(json.message || 'Gagal mengunggah gambar sampul')
      }
    } catch (err: any) {
      alert('Error saat mengunggah gambar: ' + err.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.judul.trim()) {
      alert('Judul berita wajib diisi!')
      return
    }
    if (!formData.deskripsi.trim()) {
      alert('Konten berita wajib diisi!')
      return
    }

    try {
      setSubmitting(true)
      const url = '/api/cms/berita'
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
        fetchBerita()
      } else {
        alert(json.message || 'Gagal menyimpan artikel')
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus artikel berita ini?')) return
    try {
      const res = await fetch(`/api/cms/berita?id=${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        fetchBerita()
      } else {
        alert(json.message || 'Gagal menghapus berita')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleTogglePublish = async (item: BeritaItem) => {
    try {
      const res = await fetch('/api/cms/berita', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, published: !item.published }),
      })
      const json = await res.json()
      if (json.success) {
        fetchBerita()
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
            <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Newspaper className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Publikasi Warta & Berita
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola publikasi warta, liputan acara, dan surat pengumuman resmi sekolah.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/portal/berita"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Eye className="h-4 w-4" />
            <span>Lihat Halaman Publik</span>
          </a>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>Tulis Berita Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between dark:border-slate-800 dark:bg-slate-900">
        {/* Kategori Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {KATEGORI_LIST.map((kat) => (
            <button
              key={kat}
              onClick={() => setKategoriFilter(kat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                kategoriFilter === kat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {kat}
            </button>
          ))}
        </div>

        {/* Form Pencarian */}
        <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berita atau penulis..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2 pl-9 pr-4 text-xs focus:border-primary focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
          />
        </form>
      </div>

      {/* Daftar Tabel / Kartu Berita */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Memuat katalog berita...</span>
          </div>
        </div>
      ) : beritaList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <Newspaper className="h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-200">
            Tidak ada berita yang ditemukan
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Mulai tulis artikel berita atau pengumuman pertama Anda.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow"
          >
            <Plus className="h-4 w-4" />
            <span>Tulis Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Artikel Berita</th>
                  <th className="px-4 py-4">Kategori</th>
                  <th className="px-4 py-4">Penulis</th>
                  <th className="px-4 py-4">Tanggal Rilis</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {beritaList.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          {item.fotoUrl ? (
                            <img
                              src={item.fotoUrl}
                              alt={item.judul}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="max-w-md">
                          <h4 className="font-bold text-slate-900 line-clamp-1 dark:text-white">
                            {item.judul}
                          </h4>
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                            {item.ringkasan || 'Tidak ada ringkasan teks.'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                        {item.kategori || 'Pengumuman'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.penulis || 'Admin'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(item)}
                        className={`flex items-center gap-1 text-xs font-semibold ${
                          item.published
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {item.published ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Terbit</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5" />
                            <span>Draf</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/portal/berita/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                          title="Lihat Pratinjau Artikel"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-950/40"
                          title="Edit Berita"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40"
                          title="Hapus Berita"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Berita */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedItem ? 'Edit Artikel Warta & Berita' : 'Tulis Artikel Berita Baru'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Isi formulir publikasi untuk menyajikan informasi terkini kepada warga sekolah dan publik.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Judul Berita *
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Pembukaan Kegiatan MPLS & Pengenalan Ekosistem Belajar"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                    Kategori
                  </label>
                  <SearchableSelect
                    value={formData.kategori}
                    onChange={(val) => setFormData({ ...formData, kategori: val })}
                    options={[
                      { value: 'Pengumuman', label: 'Pengumuman' },
                      { value: 'Akademik', label: 'Akademik' },
                      { value: 'Prestasi', label: 'Prestasi' },
                      { value: 'Kegiatan', label: 'Kegiatan' },
                    ]}
                    placeholder="Pilih Kategori"
                    searchPlaceholder="Cari kategori..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Nama Penulis / Humas
                  </label>
                  <input
                    type="text"
                    value={formData.penulis}
                    onChange={(e) => setFormData({ ...formData, penulis: e.target.value })}
                    placeholder="Tim Humas Sekolah"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                  />
                </div>
              </div>

              {/* Upload Foto Sampul */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Foto Sampul Berita (Banner Utama)
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="text"
                    value={formData.fotoUrl}
                    onChange={(e) => setFormData({ ...formData, fotoUrl: e.target.value })}
                    placeholder="URL gambar atau unggah file..."
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
                  Ringkasan Singkat (Lead Paragraph)
                </label>
                <textarea
                  rows={2}
                  value={formData.ringkasan}
                  onChange={(e) => setFormData({ ...formData, ringkasan: e.target.value })}
                  placeholder="Ringkasan 1-2 kalimat untuk pratinjau kartu berita di landing page..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Konten Naskah Lengkap Berita *
                </label>
                <textarea
                  rows={6}
                  required
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Tuliskan naskah berita lengkap di sini (mendukung paragraf, teks HTML <p>, <b>, dll)..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-slate-700 font-sans"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publishedCheck"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="publishedCheck" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Langsung terbitkan ke publik (Published)
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
                  {submitting ? 'Menyimpan...' : selectedItem ? 'Simpan Perubahan' : 'Terbitkan Berita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
