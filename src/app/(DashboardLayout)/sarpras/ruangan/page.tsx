'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Building2,
  Plus,
  Search,
  RotateCcw,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Layers,
  MapPin,
  Maximize2,
  Check,
  AlertTriangle,
  Wrench,
  Boxes,
  DollarSign,
  User,
  LayoutGrid,
  List,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'
import { formatRupiah } from '@/lib/terbilang'

interface PegawaiItem {
  id: number
  nama: string
  nip: string | null
  jabatan: string | null
  kontak: string | null
}

interface BarangItem {
  id: number
  namaBarang: string
  jumlahTotal: number
  hargaPerolehan: number | null
  kondisiUtama: string
}

interface RuanganItem {
  id: number
  kodeRuangan: string
  namaRuangan: string
  gedung: string | null
  lantai: number | null
  kapasitas: number | null
  luasM2: number | null
  kategori: string
  kondisi: string
  pjPegawaiId: number | null
  pjPegawai: PegawaiItem | null
  keterangan: string | null
  jumlahJenisBarang: number
  totalUnitBarang: number
  totalNilaiAset: number
  barang: BarangItem[]
  createdAt: string
}

interface StatsData {
  totalRuangan: number
  totalKapasitas: number
  kondisiBaik: number
  butuhPerbaikan: number
}

const KATEGORI_LABELS: Record<string, { label: string; color: string }> = {
  kelas: { label: 'Ruang Kelas', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' },
  laboratorium: { label: 'Laboratorium', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' },
  perpustakaan: { label: 'Perpustakaan', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' },
  kantor: { label: 'Kantor / TU', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
  bengkel: { label: 'Bengkel Praktik', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' },
  gudang: { label: 'Gudang Sarpras', color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300' },
  olahraga: { label: 'Sarana Olahraga', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300' },
  ibadah: { label: 'Tempat Ibadah', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300' },
  lainnya: { label: 'Lainnya', color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300' },
}

const KONDISI_LABELS: Record<string, { label: string; badge: string; icon: any }> = {
  baik: { label: 'Baik & Siap Pakai', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300', icon: CheckCircle2 },
  rusak_ringan: { label: 'Rusak Ringan', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300', icon: AlertTriangle },
  rusak_berat: { label: 'Rusak Berat', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300', icon: AlertCircle },
  renovasi: { label: 'Dalam Renovasi', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300', icon: Wrench },
}

export default function MasterRuanganPage() {
  const { canCreate, canEdit, canDelete } = usePermission()

  const [ruanganList, setRuanganList] = useState<RuanganItem[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalRuangan: 0,
    totalKapasitas: 0,
    kondisiBaik: 0,
    butuhPerbaikan: 0,
  })
  const [gedungOptions, setGedungOptions] = useState<string[]>([])
  const [pegawaiList, setPegawaiList] = useState<PegawaiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGedung, setSelectedGedung] = useState('all')
  const [selectedKategori, setSelectedKategori] = useState('all')
  const [selectedKondisi, setSelectedKondisi] = useState('all')

  // Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRuangan, setEditingRuangan] = useState<RuanganItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Modal Detail State
  const [detailRuangan, setDetailRuangan] = useState<RuanganItem | null>(null)

  // Form State
  const [form, setForm] = useState({
    kodeRuangan: '',
    namaRuangan: '',
    gedung: '',
    lantai: 1,
    kapasitas: 36,
    luasM2: '',
    kategori: 'kelas',
    kondisi: 'baik',
    pjPegawaiId: '',
    keterangan: '',
  })

  // Fetch Pegawai for PIC dropdown
  useEffect(() => {
    fetch('/api/pegawai')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const list = Array.isArray(json.data) ? json.data : json.data.pegawai || []
          setPegawaiList(list)
        }
      })
      .catch((err) => console.error('Failed to fetch pegawai:', err))
  }, [])

  // Fetch Ruangan Data
  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedGedung !== 'all') params.append('gedung', selectedGedung)
      if (selectedKategori !== 'all') params.append('kategori', selectedKategori)
      if (selectedKondisi !== 'all') params.append('kondisi', selectedKondisi)

      const res = await fetch(`/api/sarpras/ruangan?${params.toString()}`)
      const json = await res.json()

      if (res.ok && json.success) {
        setRuanganList(json.data.ruangan || [])
        setStats(json.data.stats || { totalRuangan: 0, totalKapasitas: 0, kondisiBaik: 0, butuhPerbaikan: 0 })
        if (json.data.gedungList) {
          setGedungOptions(json.data.gedungList)
        }
      } else {
        throw new Error(json.message || 'Gagal mengambil data ruangan')
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Terjadi kesalahan sistem' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [searchQuery, selectedGedung, selectedKategori, selectedKondisi])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingRuangan(null)
    setForm({
      kodeRuangan: '',
      namaRuangan: '',
      gedung: gedungOptions[0] || 'Gedung A (Utama)',
      lantai: 1,
      kapasitas: 36,
      luasM2: '',
      kategori: 'kelas',
      kondisi: 'baik',
      pjPegawaiId: '',
      keterangan: '',
    })
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (ruangan: RuanganItem) => {
    setEditingRuangan(ruangan)
    setForm({
      kodeRuangan: ruangan.kodeRuangan,
      namaRuangan: ruangan.namaRuangan,
      gedung: ruangan.gedung || '',
      lantai: ruangan.lantai || 1,
      kapasitas: ruangan.kapasitas || 36,
      luasM2: ruangan.luasM2 ? String(ruangan.luasM2) : '',
      kategori: ruangan.kategori || 'kelas',
      kondisi: ruangan.kondisi || 'baik',
      pjPegawaiId: ruangan.pjPegawaiId ? String(ruangan.pjPegawaiId) : '',
      keterangan: ruangan.keterangan || '',
    })
    setIsModalOpen(true)
  }

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.kodeRuangan.trim() || !form.namaRuangan.trim()) {
      setFeedback({ type: 'error', message: 'Kode dan nama ruangan wajib diisi' })
      return
    }

    try {
      setSaving(true)
      const url = editingRuangan ? `/api/sarpras/ruangan/${editingRuangan.id}` : '/api/sarpras/ruangan'
      const method = editingRuangan ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan data ruangan')
      }

      setFeedback({
        type: 'success',
        message: editingRuangan ? 'Data ruangan berhasil diperbarui' : 'Ruangan baru berhasil didaftarkan',
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
  const handleDelete = async (ruangan: RuanganItem) => {
    if (!confirm(`Hapus ruangan "${ruangan.namaRuangan}" (${ruangan.kodeRuangan})?`)) {
      return
    }

    try {
      const res = await fetch(`/api/sarpras/ruangan/${ruangan.id}`, { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menghapus ruangan')
      }

      setFeedback({ type: 'success', message: 'Data ruangan berhasil dihapus' })
      fetchData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menghapus ruangan' })
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-primary" />
            <span>Master Ruangan & Lokasi Sarpras</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pemetaan gedung, ruang kelas, laboratorium komputer/IPA, perpustakaan, kantor, dan bengkel praktik
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 shadow-xs transition"
            title="Muat ulang data"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>

          {canCreate('/sarpras/ruangan') && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Ruangan</span>
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 text-sm">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
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
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Ruangan</span>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalRuangan} Ruangan</div>
          <p className="text-xs text-gray-400 mt-0.5">Seluruh gedung sekolah</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Total Daya Tampung
          </span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.totalKapasitas} Kursi</div>
          <p className="text-xs text-gray-400 mt-0.5">Kapasitas belajar & ruang</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Kondisi Baik (Siap Pakai)
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.kondisiBaik} Ruangan
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Terawat & operasional normal</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Perlu Perbaikan / Rehab
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.butuhPerbaikan} Ruangan</div>
          <p className="text-xs text-gray-400 mt-0.5">Rusak ringan / renovasi</p>
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
              placeholder="Cari kode ruangan, nama ruangan, atau gedung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-between md:justify-end text-xs">
            {/* Filter Gedung dengan SearchableSelect */}
            <div className="w-44">
              <SearchableSelect
                options={[
                  { value: 'all', label: 'Semua Gedung' },
                  ...gedungOptions.map((g) => ({ value: g, label: g })),
                ]}
                value={selectedGedung}
                onChange={(val) => setSelectedGedung(val || 'all')}
                placeholder="Pilih Gedung..."
                searchPlaceholder="Cari gedung..."
              />
            </div>

            {/* Filter Kategori dengan SearchableSelect */}
            <div className="w-48">
              <SearchableSelect
                options={[
                  { value: 'all', label: 'Semua Kategori' },
                  { value: 'kelas', label: 'Ruang Kelas', sublabel: 'Tempat belajar teori' },
                  { value: 'laboratorium', label: 'Laboratorium', sublabel: 'Komputer, IPA, Bahasa' },
                  { value: 'perpustakaan', label: 'Perpustakaan', sublabel: 'Koleksi buku & literasi' },
                  { value: 'kantor', label: 'Kantor / TU', sublabel: 'Administrasi & staf guru' },
                  { value: 'bengkel', label: 'Bengkel Praktik', sublabel: 'Vokasi & kejuruan' },
                  { value: 'gudang', label: 'Gudang Sarpras', sublabel: 'Penyimpanan inventaris' },
                  { value: 'olahraga', label: 'Sarana Olahraga', sublabel: 'Lapangan & GOR' },
                  { value: 'ibadah', label: 'Tempat Ibadah', sublabel: 'Masjid / Musholla' },
                  { value: 'lainnya', label: 'Lainnya', sublabel: 'Ruang serbaguna / UKS' },
                ]}
                value={selectedKategori}
                onChange={(val) => setSelectedKategori(val || 'all')}
                placeholder="Pilih Kategori..."
                searchPlaceholder="Cari kategori..."
              />
            </div>

            {/* Filter Kondisi dengan SearchableSelect */}
            <div className="w-44">
              <SearchableSelect
                options={[
                  { value: 'all', label: 'Semua Kondisi' },
                  { value: 'baik', label: 'Kondisi Baik', badge: 'Normal' },
                  { value: 'rusak_ringan', label: 'Rusak Ringan', badge: 'Perlu Cat/Plafon' },
                  { value: 'rusak_berat', label: 'Rusak Berat', badge: 'Tidak Layak' },
                  { value: 'renovasi', label: 'Dalam Renovasi', badge: 'Rehab' },
                ]}
                value={selectedKondisi}
                onChange={(val) => setSelectedKondisi(val || 'all')}
                placeholder="Pilih Kondisi..."
                searchPlaceholder="Cari kondisi..."
              />
            </div>

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
                title="Tampilan Grid"
              >
                <LayoutGrid className="w-4 h-4" />
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

      {/* 4. MAIN CONTENT VIEW */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <RotateCcw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat data pemetaan ruangan...</p>
        </div>
      ) : ruanganList.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Tidak ada ruangan yang ditemukan</h3>
          <p className="text-xs text-gray-400 mt-1">Coba sesuaikan filter pencarian atau daftarkan ruangan baru.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ruanganList.map((r) => {
            const kat = KATEGORI_LABELS[r.kategori] || KATEGORI_LABELS.lainnya
            const kon = KONDISI_LABELS[r.kondisi] || KONDISI_LABELS.baik
            const KonIcon = kon.icon

            return (
              <div
                key={r.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar: Code & Condition */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {r.kodeRuangan}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${kon.badge}`}>
                      <KonIcon className="w-3 h-3" />
                      <span>{kon.label}</span>
                    </span>
                  </div>

                  {/* Room Title & Category */}
                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{r.namaRuangan}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${kat.color}`}>
                      {kat.label}
                    </span>
                    {r.gedung && (
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{r.gedung} {r.lantai ? `(Lt. ${r.lantai})` : ''}</span>
                      </span>
                    )}
                  </div>

                  {/* Room Specs */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>Kapasitas: <strong>{r.kapasitas || '-'} Kursi</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-purple-500" />
                      <span>Luas: <strong>{r.luasM2 ? `${r.luasM2} m²` : '-'}</strong></span>
                    </div>
                  </div>

                  {/* PIC Pegawai */}
                  <div className="mt-2 text-xs flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <User className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">PIC: <strong>{r.pjPegawai ? r.pjPegawai.nama : 'Belum Ditentukan'}</strong></span>
                  </div>

                  {/* Inventory Summary */}
                  <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-xs space-y-1">
                    <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Boxes className="w-3.5 h-3.5" />
                        <span>Total Aset Barang:</span>
                      </span>
                      <strong className="text-gray-800 dark:text-gray-200">
                        {r.jumlahJenisBarang} Jenis ({r.totalUnitBarang} Unit)
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Valuasi Aset:</span>
                      </span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(r.totalNilaiAset)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                  <button
                    onClick={() => setDetailRuangan(r)}
                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Inventaris</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {canEdit('/sarpras/ruangan') && (
                      <button
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        title="Edit Ruangan"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete('/sarpras/ruangan') && (
                      <button
                        onClick={() => handleDelete(r)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Hapus Ruangan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Ruangan</th>
                  <th className="px-4 py-3">Gedung / Lokasi</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-center">Kapasitas</th>
                  <th className="px-4 py-3">Penanggung Jawab</th>
                  <th className="px-4 py-3 text-center">Aset Fisik</th>
                  <th className="px-4 py-3 text-right">Valuasi Aset</th>
                  <th className="px-4 py-3 text-center">Kondisi</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {ruanganList.map((r) => {
                  const kat = KATEGORI_LABELS[r.kategori] || KATEGORI_LABELS.lainnya
                  const kon = KONDISI_LABELS[r.kondisi] || KONDISI_LABELS.baik

                  return (
                    <tr key={r.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition">
                      <td className="px-4 py-3 font-mono font-bold text-gray-700 dark:text-gray-300">
                        {r.kodeRuangan}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                        {r.namaRuangan}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {r.gedung || '-'} {r.lantai ? `(Lt. ${r.lantai})` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${kat.color}`}>
                          {kat.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                        {r.kapasitas || '-'} Kursi
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {r.pjPegawai?.nama || '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                        {r.jumlahJenisBarang} ({r.totalUnitBarang} Unit)
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(r.totalNilaiAset)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kon.badge}`}>
                          {kon.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailRuangan(r)}
                            className="p-1 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100"
                            title="Detail Inventaris"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEdit('/sarpras/ruangan') && (
                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="p-1 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete('/sarpras/ruangan') && (
                            <button
                              onClick={() => handleDelete(r)}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODAL TAMBAH / UBAH RUANGAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span>{editingRuangan ? 'Ubah Data Ruangan' : 'Daftarkan Ruangan Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Kode Ruangan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: R-LAB-01"
                    value={form.kodeRuangan}
                    onChange={(e) => setForm({ ...form, kodeRuangan: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nama Ruangan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Laboratorium Komputer 2"
                    value={form.namaRuangan}
                    onChange={(e) => setForm({ ...form, namaRuangan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Gedung / Blok</label>
                  <input
                    type="text"
                    placeholder="Contoh: Gedung B (Sains), Gedung Utama"
                    value={form.gedung}
                    onChange={(e) => setForm({ ...form, gedung: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Lantai</label>
                  <input
                    type="number"
                    min={1}
                    value={form.lantai}
                    onChange={(e) => setForm({ ...form, lantai: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Kategori Ruangan <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={[
                      { value: 'kelas', label: 'Ruang Kelas Reguler', sublabel: 'Tempat KBM harian' },
                      { value: 'laboratorium', label: 'Laboratorium', sublabel: 'Komputer, IPA, Bahasa, Multimedia' },
                      { value: 'perpustakaan', label: 'Perpustakaan', sublabel: 'Ruang baca & katalog pustaka' },
                      { value: 'kantor', label: 'Kantor / Ruang Guru / TU', sublabel: 'Pelayanan administrasi' },
                      { value: 'bengkel', label: 'Bengkel Praktik Kejuruan', sublabel: 'Tempat kerja vokasi' },
                      { value: 'gudang', label: 'Gudang Sarpras', sublabel: 'Penyimpanan barang & logistik' },
                      { value: 'olahraga', label: 'Sarana Olahraga', sublabel: 'GOR, lapangan, ruang senam' },
                      { value: 'ibadah', label: 'Tempat Ibadah', sublabel: 'Musholla / Masjid sekolah' },
                      { value: 'lainnya', label: 'Lainnya', sublabel: 'UKS, kantin, pos keamanan' },
                    ]}
                    value={form.kategori}
                    onChange={(val) => setForm({ ...form, kategori: val || 'kelas' })}
                    placeholder="Pilih Kategori Ruangan..."
                    searchPlaceholder="Cari kategori ruangan..."
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Kondisi Fisik Ruangan <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={[
                      { value: 'baik', label: 'Kondisi Baik & Siap Pakai', badge: 'Normal' },
                      { value: 'rusak_ringan', label: 'Rusak Ringan', badge: 'Perlu Cat/Plafon' },
                      { value: 'rusak_berat', label: 'Rusak Berat', badge: 'Tidak Layak Pakai' },
                      { value: 'renovasi', label: 'Sedang Dalam Renovasi', badge: 'Rehab' },
                    ]}
                    value={form.kondisi}
                    onChange={(val) => setForm({ ...form, kondisi: val || 'baik' })}
                    placeholder="Pilih Kondisi Fisik..."
                    searchPlaceholder="Cari kondisi fisik..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Kapasitas (Kursi Siswa)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="36"
                    value={form.kapasitas}
                    onChange={(e) => setForm({ ...form, kapasitas: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Luas Ruangan (m²)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="56"
                    value={form.luasM2}
                    onChange={(e) => setForm({ ...form, luasM2: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              {/* PIC Pegawai Penanggung Jawab */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Penanggung Jawab / PIC Ruangan
                </label>
                <SearchableSelect
                  options={[
                    { value: '', label: '-- Tidak Ada PIC / Ditentukan Nanti --' },
                    ...pegawaiList.map((p) => ({
                      value: String(p.id),
                      label: p.nama,
                      sublabel: p.jabatan || 'Tenaga Pendidik / Staf',
                      badge: p.nip ? `NIP: ${p.nip}` : undefined,
                    })),
                  ]}
                  value={form.pjPegawaiId}
                  onChange={(val) => setForm({ ...form, pjPegawaiId: val })}
                  placeholder="Pilih PIC Penanggung Jawab..."
                  searchPlaceholder="Ketik nama atau jabatan pegawai..."
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Keterangan / Fasilitas</label>
                <textarea
                  rows={2}
                  placeholder="Catatan fasilitas terpasang (AC, proyektor, wastafel, dll)..."
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
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
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editingRuangan ? 'Simpan Perubahan' : 'Daftarkan Ruangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DETAIL INVENTARIS RUANGAN */}
      {detailRuangan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <span className="text-[10px] font-mono text-primary font-bold">{detailRuangan.kodeRuangan}</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {detailRuangan.namaRuangan}
                </h3>
              </div>
              <button
                onClick={() => setDetailRuangan(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Gedung:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{detailRuangan.gedung || '-'}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Lantai:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">Lantai {detailRuangan.lantai || 1}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Kapasitas:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{detailRuangan.kapasitas || '-'} Kursi</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Luas:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{detailRuangan.luasM2 ? `${detailRuangan.luasM2} m²` : '-'}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs flex justify-between items-center">
              <div>
                <span className="text-blue-600 dark:text-blue-300 font-semibold">Penanggung Jawab (PIC):</span>
                <p className="font-bold text-blue-900 dark:text-blue-100">{detailRuangan.pjPegawai?.nama || 'Belum Ditentukan'}</p>
              </div>
              <div className="text-right">
                <span className="text-blue-600 dark:text-blue-300 font-semibold">Total Nilai Valuasi Aset:</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(detailRuangan.totalNilaiAset)}</p>
              </div>
            </div>

            {/* List Aset Barang Terpasang */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-primary" />
                <span>Inventaris Aset Terpasang ({detailRuangan.jumlahJenisBarang} Item, {detailRuangan.totalUnitBarang} Unit):</span>
              </span>

              {detailRuangan.barang?.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  Belum ada aset barang yang dialokasikan ke ruangan ini.
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-700">
                  {detailRuangan.barang.map((b) => (
                    <div key={b.id} className="p-3 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{b.namaBarang}</p>
                        <p className="text-[11px] text-gray-400">
                          Jumlah Fisik: <strong>{b.jumlahTotal} unit</strong> • Kondisi: <span className="capitalize">{b.kondisiUtama.replace('_', ' ')}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">Nilai Perolehan</span>
                        <strong className="text-gray-800 dark:text-gray-200">
                          {formatRupiah(Number(b.hargaPerolehan || 0) * b.jumlahTotal)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detailRuangan.keterangan && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs">
                <span className="text-gray-400 block mb-0.5">Catatan / Keterangan:</span>
                <p className="text-gray-700 dark:text-gray-300">{detailRuangan.keterangan}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setDetailRuangan(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-xs"
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

