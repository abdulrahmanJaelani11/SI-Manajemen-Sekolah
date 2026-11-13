'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Layers,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  X,
  Eye,
  Grid,
  List,
  RotateCcw,
  BookmarkCheck,
  Tag,
  MapPin,
  Barcode,
  Calendar,
  User,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

interface BukuItem {
  id: number
  kodeBuku: string
  judul: string
  pengarang: string
  penerbit: string
  tahunTerbit: number | null
  isbn: string
  kategoriId: number
  kategori: { id: number; kode: string; nama: string }
  lokasiRak: string
  jumlahTotal: number
  jumlahTersedia: number
  sedangDipinjam: number
  coverUrl: string | null
  deskripsi: string | null
}

export default function KatalogBukuPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/perpustakaan/buku')
  const allowEdit = canEdit('/perpustakaan/buku')
  const allowDelete = canDelete('/perpustakaan/buku')

  const [loading, setLoading] = useState(true)
  const [bukuList, setBukuList] = useState<BukuItem[]>([])
  const [kategoriList, setKategoriList] = useState<Array<{ id: number; kode: string; nama: string; count: number }>>([])
  const [stats, setStats] = useState({
    totalJudul: 0,
    totalEksemplar: 0,
    totalTersedia: 0,
    totalDipinjam: 0,
  })

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKategori, setSelectedKategori] = useState('all')
  const [tersediaOnly, setTersediaOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Feedback alert
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal Form State (Tambah / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBuku, setEditingBuku] = useState<BukuItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [form, setForm] = useState({
    judul: '',
    pengarang: '',
    penerbit: '',
    tahunTerbit: new Date().getFullYear().toString(),
    isbn: '',
    kategoriId: '',
    lokasiRak: '',
    jumlahTotal: 1,
    coverUrl: '',
    deskripsi: '',
  })

  // Modal Detail State
  const [detailBuku, setDetailBuku] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (selectedKategori && selectedKategori !== 'all') params.set('kategoriId', selectedKategori)
      if (tersediaOnly) params.set('tersediaOnly', 'true')

      const res = await fetch(`/api/perpustakaan/buku?${params.toString()}`)
      const json = await res.json()

      if (res.ok && json.success) {
        setBukuList(json.data.buku || [])
        setStats(json.data.stats)
        setKategoriList(json.data.kategoriList || [])
      } else {
        throw new Error(json.message || 'Gagal memuat katalog buku')
      }
    } catch (err: any) {
      console.error(err)
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat data buku' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedKategori, tersediaOnly])

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingBuku(null)
    setForm({
      judul: '',
      pengarang: '',
      penerbit: '',
      tahunTerbit: new Date().getFullYear().toString(),
      isbn: '',
      kategoriId: kategoriList[0]?.id?.toString() || '',
      lokasiRak: 'Rak A-01',
      jumlahTotal: 1,
      coverUrl: '',
      deskripsi: '',
    })
    setIsModalOpen(true)
  }

  // Open Edit modal
  const handleOpenEdit = (buku: BukuItem) => {
    setEditingBuku(buku)
    setForm({
      judul: buku.judul,
      pengarang: buku.pengarang !== '-' ? buku.pengarang : '',
      penerbit: buku.penerbit !== '-' ? buku.penerbit : '',
      tahunTerbit: buku.tahunTerbit ? buku.tahunTerbit.toString() : '',
      isbn: buku.isbn !== '-' ? buku.isbn : '',
      kategoriId: buku.kategoriId.toString(),
      lokasiRak: buku.lokasiRak !== '-' ? buku.lokasiRak : '',
      jumlahTotal: buku.jumlahTotal,
      coverUrl: buku.coverUrl || '',
      deskripsi: buku.deskripsi || '',
    })
    setIsModalOpen(true)
  }

  // Handle Cover Upload
  const handleUploadCover = async (file: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'Berkas harus berupa gambar (JPEG, PNG, WEBP, GIF)' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Ukuran berkas gambar maksimal 5 MB' })
      return
    }

    try {
      setUploadingCover(true)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'buku')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()

      if (res.ok && json.success && json.data?.url) {
        setForm((prev) => ({ ...prev, coverUrl: json.data.url }))
        setFeedback({ type: 'success', message: 'Gambar sampul buku berhasil diunggah' })
      } else {
        throw new Error(json.message || 'Gagal mengunggah gambar sampul')
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal mengunggah gambar sampul' })
    } finally {
      setUploadingCover(false)
    }
  }

  // Submit Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.judul.trim() || !form.kategoriId) {
      setFeedback({ type: 'error', message: 'Judul buku dan kategori wajib diisi' })
      return
    }

    try {
      setSaving(true)
      const url = editingBuku ? `/api/perpustakaan/buku/${editingBuku.id}` : '/api/perpustakaan/buku'
      const method = editingBuku ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan data buku')
      }

      setFeedback({
        type: 'success',
        message: editingBuku ? 'Data buku berhasil diperbarui' : 'Buku baru berhasil didaftarkan ke katalog',
      })
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Terjadi kesalahan sistem' })
    } finally {
      setSaving(false)
    }
  }

  // Handle Delete
  const handleDelete = async (buku: BukuItem) => {
    if (!confirm(`Hapus buku "${buku.judul}" (${buku.kodeBuku}) dari katalog perpustakaan?`)) {
      return
    }

    try {
      const res = await fetch(`/api/perpustakaan/buku/${buku.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menghapus buku')
      }

      setFeedback({ type: 'success', message: 'Buku berhasil dihapus dari perpustakaan' })
      fetchData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menghapus buku' })
    }
  }

  // View Detail modal
  const handleOpenDetail = async (id: number) => {
    try {
      setLoadingDetail(true)
      const res = await fetch(`/api/perpustakaan/buku/${id}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setDetailBuku(json.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Filtered on client
  const displayedBuku = useMemo(() => {
    if (!searchQuery.trim()) return bukuList
    const q = searchQuery.toLowerCase().trim()
    return bukuList.filter(
      (b) =>
        b.judul.toLowerCase().includes(q) ||
        b.kodeBuku.toLowerCase().includes(q) ||
        b.pengarang.toLowerCase().includes(q) ||
        b.penerbit.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.lokasiRak.toLowerCase().includes(q)
    )
  }, [bukuList, searchQuery])

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Perpustakaan & Literasi Digital</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Katalog Buku & Pustaka Sekolah
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Kelola inventaris koleksi buku cetak, penempatan rak, dan status ketersediaan peminjaman.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {allowCreate && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition shadow-sm shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Buku Baru</span>
            </button>
          )}

          <button
            onClick={fetchData}
            title="Muat Ulang"
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 text-sm">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 rounded-lg hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Judul Buku</span>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalJudul} Judul</div>
          <p className="text-xs text-gray-400 mt-0.5">Koleksi terdaftar di sistem</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Total Eksemplar
          </span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.totalEksemplar} Buku</div>
          <p className="text-xs text-gray-400 mt-0.5">Jumlah seluruh fisik buku</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Buku Tersedia (Rak)
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.totalTersedia} Buku
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Dapat langsung dipinjam</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Sedang Dipinjam
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.totalDipinjam} Buku</div>
          <p className="text-xs text-gray-400 mt-0.5">Aktif dipegang siswa</p>
        </div>
      </div>

      {/* 3. FILTER BAR */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari judul, pengarang, ISBN, rak, atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>

          <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-between md:justify-end">
            {/* Filter Kategori dengan SearchableSelect */}
            <div className="w-56 text-xs">
              <SearchableSelect
                options={[
                  { value: 'all', label: `Semua Kategori (${stats.totalJudul})` },
                  ...kategoriList.map((k) => ({
                    value: String(k.id),
                    label: k.nama,
                    badge: `${k.count} buku`,
                    sublabel: `Kode: ${k.kode}`,
                  })),
                ]}
                value={selectedKategori}
                onChange={(val) => setSelectedKategori(val || 'all')}
                placeholder="Pilih Kategori..."
                searchPlaceholder="Cari kategori buku..."
              />
            </div>

            {/* Toggle Tersedia Only */}
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                checked={tersediaOnly}
                onChange={(e) => setTersediaOnly(e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <span>Tersedia Saja</span>
            </label>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-800 text-primary shadow-xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Tampilan Kartu"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-800 text-primary shadow-xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Tampilan Tabel"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. KATALOG CONTENT (GRID OR TABLE) */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">
          <RotateCcw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm">Sedang memuat katalog buku perpustakaan...</p>
        </div>
      ) : displayedBuku.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Tidak ada buku ditemukan</h3>
          <p className="text-xs text-gray-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter kategori.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {displayedBuku.map((buku) => (
            <div
              key={buku.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col group"
            >
              {/* Header card with cover or placeholder */}
              <div className="h-44 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 relative flex items-center justify-center p-4">
                {buku.coverUrl ? (
                  <img src={buku.coverUrl} alt={buku.judul} className="h-full object-contain drop-shadow-md rounded" />
                ) : (
                  <div className="text-center text-slate-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-1 opacity-40 group-hover:scale-110 transition" />
                    <span className="text-[10px] uppercase font-mono tracking-widest">{buku.kategori.kode}</span>
                  </div>
                )}

                {/* Stock badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                      buku.jumlahTersedia > 0
                        ? 'bg-emerald-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {buku.jumlahTersedia > 0 ? `${buku.jumlahTersedia} Tersedia` : 'Habis Dipinjam'}
                  </span>
                </div>

                {/* Rak badge */}
                <div className="absolute bottom-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 dark:bg-black/70 text-gray-800 dark:text-gray-200 backdrop-blur-xs">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>{buku.lokasiRak}</span>
                  </span>
                </div>
              </div>

              {/* Body card */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {buku.kategori.nama}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition">
                    {buku.judul}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">Oleh: {buku.pengarang}</p>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 text-[11px] text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Penerbit:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[130px]">
                      {buku.penerbit} {buku.tahunTerbit ? `(${buku.tahunTerbit})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span>Kode:</span>
                    <span className="text-gray-800 dark:text-gray-200">{buku.kodeBuku}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleOpenDetail(buku.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Detail</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {allowEdit && (
                      <button
                        onClick={() => handleOpenEdit(buku)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        title="Edit Buku"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {allowDelete && (
                      <button
                        onClick={() => handleDelete(buku)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                        title="Hapus Buku"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 w-28">Kode Buku</th>
                  <th className="py-3.5 px-4">Judul & Pengarang</th>
                  <th className="py-3.5 px-4 w-36">Kategori</th>
                  <th className="py-3.5 px-4 w-24">Lokasi Rak</th>
                  <th className="py-3.5 px-4 w-24 text-center">Total</th>
                  <th className="py-3.5 px-4 w-24 text-center">Tersedia</th>
                  <th className="py-3.5 px-4 w-24 text-center">Dipinjam</th>
                  <th className="py-3.5 px-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium">
                {displayedBuku.map((buku, idx) => (
                  <tr key={buku.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-750 transition">
                    <td className="py-3 px-4 text-center text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-gray-800 dark:text-gray-200">
                      {buku.kodeBuku}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900 dark:text-white">{buku.judul}</div>
                      <div className="text-[11px] text-gray-500">
                        {buku.pengarang} • {buku.penerbit} {buku.tahunTerbit ? `(${buku.tahunTerbit})` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary">
                        {buku.kategori.nama}
                      </span>
                    </td>
                    <td className="py-3 px-4">{buku.lokasiRak}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-900 dark:text-white">
                      {buku.jumlahTotal}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          buku.jumlahTersedia > 0
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {buku.jumlahTersedia}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                      {buku.jumlahTotal - buku.jumlahTersedia}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenDetail(buku.id)}
                          className="p-1 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition"
                          title="Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {allowEdit && (
                          <button
                            onClick={() => handleOpenEdit(buku)}
                            className="p-1 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 transition"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {allowDelete && (
                          <button
                            onClick={() => handleDelete(buku)}
                            className="p-1 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* 5. MODAL TAMBAH / EDIT BUKU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingBuku ? 'Edit Data Buku' : 'Pendaftaran Buku Baru'}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingBuku ? `Mengubah data ${editingBuku.kodeBuku}` : 'Lengkapi metadata dan inventaris buku'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Judul Buku <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Matematika Tingkat Lanjut Kelas X"
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Kategori Rak <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={kategoriList.map((k) => ({
                      value: String(k.id),
                      label: k.nama,
                      sublabel: `Kode: ${k.kode}`,
                    }))}
                    value={form.kategoriId}
                    onChange={(val) => setForm({ ...form, kategoriId: val })}
                    placeholder="-- Pilih Kategori Rak --"
                    searchPlaceholder="Cari kategori buku..."
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Lokasi Rak</label>
                  <input
                    type="text"
                    placeholder="Contoh: Rak A-02, Lemari 3"
                    value={form.lokasiRak}
                    onChange={(e) => setForm({ ...form, lokasiRak: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Pengarang / Penulis</label>
                  <input
                    type="text"
                    placeholder="Nama pengarang"
                    value={form.pengarang}
                    onChange={(e) => setForm({ ...form, pengarang: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Penerbit</label>
                  <input
                    type="text"
                    placeholder="Nama penerbit"
                    value={form.penerbit}
                    onChange={(e) => setForm({ ...form, penerbit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    placeholder="2024"
                    value={form.tahunTerbit}
                    onChange={(e) => setForm({ ...form, tahunTerbit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Nomor ISBN</label>
                  <input
                    type="text"
                    placeholder="978-602-xxx"
                    value={form.isbn}
                    onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Jumlah Eksemplar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.jumlahTotal}
                    onChange={(e) => setForm({ ...form, jumlahTotal: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-gray-700 dark:text-gray-300">
                  Gambar Sampul Buku (Cover)
                </label>

                {/* Live Preview Sampul jika ada */}
                {form.coverUrl && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <div className="w-12 h-16 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                      <img
                        src={form.coverUrl}
                        alt="Sampul Buku"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {form.coverUrl}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                        ✓ Gambar sampul aktif
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, coverUrl: '' })}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Hapus gambar sampul"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Opsi Upload File & Input Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary bg-gray-50 dark:bg-gray-900/50 cursor-pointer transition text-gray-700 dark:text-gray-300">
                    <Upload className={`w-4 h-4 text-primary ${uploadingCover ? 'animate-bounce' : ''}`} />
                    <span className="font-semibold text-xs">
                      {uploadingCover ? 'Mengunggah Sampul...' : 'Unggah File Gambar'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={uploadingCover}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleUploadCover(f)
                      }}
                    />
                  </label>

                  <div>
                    <input
                      type="text"
                      placeholder="Atau tempel link URL gambar..."
                      value={form.coverUrl}
                      onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  Mendukung berkas JPG, PNG, WEBP, atau GIF (Maks. 5 MB).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Sinopsis / Catatan Buku</label>
                <textarea
                  rows={3}
                  placeholder="Deskripsi singkat isi buku atau kurikulum yang sesuai..."
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingCover}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : uploadingCover ? 'Mengunggah...' : editingBuku ? 'Simpan Perubahan' : 'Daftarkan Buku'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DETAIL BUKU */}
      {detailBuku && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <span className="text-[10px] font-mono text-primary font-bold">{detailBuku.kodeBuku}</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{detailBuku.judul}</h3>
              </div>
              <button
                onClick={() => setDetailBuku(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Pengarang:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{detailBuku.pengarang || '-'}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Penerbit & Tahun:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {detailBuku.penerbit || '-'} {detailBuku.tahunTerbit ? `(${detailBuku.tahunTerbit})` : ''}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Kategori & Rak:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {detailBuku.kategori?.nama} • {detailBuku.lokasiRak || '-'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">ISBN:</span>
                <p className="font-semibold font-mono text-gray-800 dark:text-gray-200 mt-0.5">
                  {detailBuku.isbn || '-'}
                </p>
              </div>
              <div className="col-span-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                <span>Status Inventaris Eksemplar:</span>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold">
                    Total: {detailBuku.jumlahTotal}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold">
                    Tersedia: {detailBuku.jumlahTersedia}
                  </span>
                </div>
              </div>
            </div>

            {/* Riwayat Peminjam Terakhir */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Riwayat Sirkulasi / Siswa Peminjam Terakhir:</span>
              </span>

              {detailBuku.peminjaman?.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">Belum ada riwayat sirkulasi untuk buku ini.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-xl">
                  {detailBuku.peminjaman.map((p: any) => (
                    <div key={p.id} className="p-2.5 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-200">
                          {p.siswa.nama} ({p.siswa.nis})
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Pinjam: {new Date(p.tanggalPinjam).toLocaleDateString('id-ID')} • Tempo:{' '}
                          {new Date(p.jatuhTempo).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'kembali'
                            ? 'bg-gray-100 text-gray-600'
                            : p.status === 'terlambat'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {p.status === 'kembali'
                          ? 'Dikembalikan'
                          : p.status === 'terlambat'
                          ? 'Terlambat'
                          : 'Sedang Dipinjam'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailBuku(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

