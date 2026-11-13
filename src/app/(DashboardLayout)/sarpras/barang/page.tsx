'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Boxes,
  Plus,
  Search,
  RotateCcw,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Image as ImageIcon,
  QrCode,
  Printer,
  Check,
  AlertTriangle,
  Building2,
  Tag,
  DollarSign,
  User,
  LayoutGrid,
  List,
  Sparkles,
  Layers,
  Calendar,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import LabelAsetModal, { AssetLabelItem } from '@/components/sarpras/LabelAsetModal'
import { usePermission } from '@/context/PermissionContext'
import { formatRupiah } from '@/lib/terbilang'

interface KategoriItem {
  id: number
  kode: string
  nama: string
}

interface RuanganItem {
  id: number
  kodeRuangan: string
  namaRuangan: string
  gedung: string | null
}

interface PegawaiItem {
  id: number
  nama: string
  nip: string | null
  jabatan: string | null
}

interface BarangItem {
  id: number
  kodeBarang: string
  namaBarang: string
  kategoriId: number
  ruanganId: number | null
  merk: string | null
  spesifikasi: string | null
  noSeri: string | null
  tahunPengadaan: number | null
  sumberDana: string | null
  hargaPerolehan: number | null
  jumlahTotal: number
  jumlahBaik: number
  jumlahRusakRingan: number
  jumlahRusakBerat: number
  jumlahAfkir: number
  kondisiUtama: string
  pjPegawaiId: number | null
  fotoUrl: string | null
  keterangan: string | null
  kategori: KategoriItem
  ruangan: RuanganItem | null
  pjPegawai: PegawaiItem | null
  createdAt: string
}

interface StatsData {
  totalJenisBarang: number
  totalFisikUnit: number
  unitBaik: number
  unitRusak: number
  totalNilaiPerolehan: number
}

const KONDISI_MAP: Record<string, { label: string; badge: string; icon: any }> = {
  baik: { label: 'Baik', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300', icon: CheckCircle2 },
  rusak_ringan: { label: 'Rusak Ringan', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300', icon: AlertTriangle },
  rusak_berat: { label: 'Rusak Berat', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300', icon: AlertCircle },
  afkir: { label: 'Afkir / Dihapus', badge: 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: X },
}

export default function InventarisBarangPage() {
  const { canCreate, canEdit, canDelete } = usePermission()

  const [barangList, setBarangList] = useState<BarangItem[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalJenisBarang: 0,
    totalFisikUnit: 0,
    unitBaik: 0,
    unitRusak: 0,
    totalNilaiPerolehan: 0,
  })
  const [kategoriList, setKategoriList] = useState<KategoriItem[]>([])
  const [ruanganList, setRuanganList] = useState<RuanganItem[]>([])
  const [pegawaiList, setPegawaiList] = useState<PegawaiItem[]>([])
  const [sumberDanaOptions, setSumberDanaOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKategori, setSelectedKategori] = useState('all')
  const [selectedRuangan, setSelectedRuangan] = useState('all')
  const [selectedKondisi, setSelectedKondisi] = useState('all')
  const [selectedSumberDana, setSelectedSumberDana] = useState('all')

  // Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Selection for Mass QR Printing
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBarang, setEditingBarang] = useState<BarangItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)

  // Modal Detail State
  const [detailBarang, setDetailBarang] = useState<BarangItem | null>(null)

  // Modal Print QR Label State
  const [printItems, setPrintItems] = useState<AssetLabelItem[]>([])
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)

  // Form State
  const [form, setForm] = useState({
    kodeBarang: '',
    namaBarang: '',
    kategoriId: '',
    ruanganId: '',
    merk: '',
    spesifikasi: '',
    noSeri: '',
    tahunPengadaan: new Date().getFullYear(),
    sumberDana: 'BOS Reguler',
    hargaPerolehan: 0,
    jumlahTotal: 1,
    jumlahBaik: 1,
    jumlahRusakRingan: 0,
    jumlahRusakBerat: 0,
    jumlahAfkir: 0,
    kondisiUtama: 'baik',
    pjPegawaiId: '',
    fotoUrl: '',
    keterangan: '',
  })

  // Fetch Pegawai
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

  // Fetch Barang Data
  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedKategori !== 'all') params.append('kategoriId', selectedKategori)
      if (selectedRuangan !== 'all') params.append('ruanganId', selectedRuangan)
      if (selectedKondisi !== 'all') params.append('kondisi', selectedKondisi)
      if (selectedSumberDana !== 'all') params.append('sumberDana', selectedSumberDana)

      const res = await fetch(`/api/sarpras/barang?${params.toString()}`)
      const json = await res.json()

      if (res.ok && json.success) {
        setBarangList(json.data.barang || [])
        setStats(json.data.stats || {
          totalJenisBarang: 0,
          totalFisikUnit: 0,
          unitBaik: 0,
          unitRusak: 0,
          totalNilaiPerolehan: 0,
        })
        if (json.data.kategoriList) setKategoriList(json.data.kategoriList)
        if (json.data.ruanganList) setRuanganList(json.data.ruanganList)
        if (json.data.sumberDanaList) setSumberDanaOptions(json.data.sumberDanaList)
      } else {
        throw new Error(json.message || 'Gagal memuat inventaris barang')
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Terjadi kesalahan sistem' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [searchQuery, selectedKategori, selectedRuangan, selectedKondisi, selectedSumberDana])

  // Multi-Selection Handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleSelectAll = () => {
    if (selectedIds.length === barangList.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(barangList.map((b) => b.id))
    }
  }

  // Handle Print Single or Mass Labels
  const handleOpenPrint = (itemsToPrint: BarangItem[]) => {
    const formatted: AssetLabelItem[] = itemsToPrint.map((b) => ({
      id: b.id,
      kodeBarang: b.kodeBarang,
      namaBarang: b.namaBarang,
      merk: b.merk,
      noSeri: b.noSeri,
      tahunPengadaan: b.tahunPengadaan,
      sumberDana: b.sumberDana,
      namaRuangan: b.ruangan?.namaRuangan,
      gedung: b.ruangan?.gedung,
    }))
    setPrintItems(formatted)
    setIsPrintModalOpen(true)
  }

  // Upload Foto Handler
  const handleUploadFoto = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setFeedback({ type: 'error', message: 'Format berkas harus berupa JPG, PNG, WEBP, atau GIF' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Ukuran foto maksimal 5 MB' })
      return
    }

    try {
      setUploadingFoto(true)
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'sarpras')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()

      if (res.ok && json.success && json.data?.url) {
        setForm((prev) => ({ ...prev, fotoUrl: json.data.url }))
        setFeedback({ type: 'success', message: 'Foto aset berhasil diunggah' })
      } else {
        throw new Error(json.message || 'Gagal mengunggah foto aset')
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal mengunggah foto' })
    } finally {
      setUploadingFoto(false)
    }
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingBarang(null)
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '')
    const autoKode = `AST-${yearMonth}-${String(barangList.length + 1).padStart(4, '0')}`

    setForm({
      kodeBarang: autoKode,
      namaBarang: '',
      kategoriId: kategoriList[0]?.id ? String(kategoriList[0].id) : '',
      ruanganId: ruanganList[0]?.id ? String(ruanganList[0].id) : '',
      merk: '',
      spesifikasi: '',
      noSeri: '',
      tahunPengadaan: new Date().getFullYear(),
      sumberDana: 'BOS Reguler',
      hargaPerolehan: 0,
      jumlahTotal: 1,
      jumlahBaik: 1,
      jumlahRusakRingan: 0,
      jumlahRusakBerat: 0,
      jumlahAfkir: 0,
      kondisiUtama: 'baik',
      pjPegawaiId: '',
      fotoUrl: '',
      keterangan: '',
    })
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (b: BarangItem) => {
    setEditingBarang(b)
    setForm({
      kodeBarang: b.kodeBarang,
      namaBarang: b.namaBarang,
      kategoriId: String(b.kategoriId),
      ruanganId: b.ruanganId ? String(b.ruanganId) : '',
      merk: b.merk || '',
      spesifikasi: b.spesifikasi || '',
      noSeri: b.noSeri || '',
      tahunPengadaan: b.tahunPengadaan || new Date().getFullYear(),
      sumberDana: b.sumberDana || 'BOS Reguler',
      hargaPerolehan: Number(b.hargaPerolehan) || 0,
      jumlahTotal: b.jumlahTotal,
      jumlahBaik: b.jumlahBaik,
      jumlahRusakRingan: b.jumlahRusakRingan,
      jumlahRusakBerat: b.jumlahRusakBerat,
      jumlahAfkir: b.jumlahAfkir,
      kondisiUtama: b.kondisiUtama,
      pjPegawaiId: b.pjPegawaiId ? String(b.pjPegawaiId) : '',
      fotoUrl: b.fotoUrl || '',
      keterangan: b.keterangan || '',
    })
    setIsModalOpen(true)
  }

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.namaBarang.trim() || !form.kategoriId) {
      setFeedback({ type: 'error', message: 'Nama barang dan kategori aset wajib diisi' })
      return
    }

    try {
      setSaving(true)
      const url = editingBarang ? `/api/sarpras/barang/${editingBarang.id}` : '/api/sarpras/barang'
      const method = editingBarang ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan data barang aset')
      }

      setFeedback({
        type: 'success',
        message: editingBarang ? 'Data aset berhasil diperbarui' : 'Aset barang baru berhasil didaftarkan ke inventaris',
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
  const handleDelete = async (b: BarangItem) => {
    if (!confirm(`Hapus aset "${b.namaBarang}" (${b.kodeBarang}) dari inventaris sarpras?`)) {
      return
    }

    try {
      const res = await fetch(`/api/sarpras/barang/${b.id}`, { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menghapus aset barang')
      }

      setFeedback({ type: 'success', message: 'Aset barang berhasil dihapus' })
      fetchData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menghapus aset barang' })
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-primary" />
            <span>Inventaris & Aset Barang (Sarpras)</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pencatatan aset sekolah, kondisi fisik unit, sumber dana, lokasi penempatan, dan cetak label barcode / QR Code
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Tombol Cetak Label Massal */}
          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                const selectedItems = barangList.filter((b) => selectedIds.includes(b.id))
                handleOpenPrint(selectedItems)
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Label QR ({selectedIds.length} Terpilih)</span>
            </button>
          )}

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 shadow-xs transition"
            title="Muat ulang data"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>

          {canCreate('/sarpras/barang') && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Aset Barang</span>
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Jenis Aset</span>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalJenisBarang} Item</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Katalog terdaftar</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-sm">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Total Unit Fisik
          </span>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.totalFisikUnit} Unit</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Seluruh unit aset</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Kondisi Baik
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.unitBaik} Unit</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Operasional normal</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Rusak / Afkir
          </span>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.unitRusak} Unit</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Perlu perbaikan</p>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-sm">
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Valuasi Perolehan
          </span>
          <div className="text-base font-bold text-purple-700 dark:text-purple-300 mt-1 truncate">
            {formatRupiah(stats.totalNilaiPerolehan)}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Nilai aset kumulatif</p>
        </div>
      </div>

      {/* 3. FILTER BAR */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode, nama barang, merk, no seri..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-between md:justify-end text-xs">
            {/* Filter Kategori dengan SearchableSelect */}
            <div className="w-44">
              <SearchableSelect
                options={[
                  { value: 'all', label: `Semua Kategori (${stats.totalJenisBarang})` },
                  ...kategoriList.map((k) => ({
                    value: String(k.id),
                    label: k.nama,
                    sublabel: `Kode: ${k.kode}`,
                  })),
                ]}
                value={selectedKategori}
                onChange={(val) => setSelectedKategori(val || 'all')}
                placeholder="Pilih Kategori..."
                searchPlaceholder="Cari kategori..."
              />
            </div>

            {/* Filter Ruangan dengan SearchableSelect */}
            <div className="w-44">
              <SearchableSelect
                options={[
                  { value: 'all', label: 'Semua Lokasi Ruangan' },
                  ...ruanganList.map((r) => ({
                    value: String(r.id),
                    label: r.namaRuangan,
                    sublabel: r.gedung || undefined,
                    badge: r.kodeRuangan,
                  })),
                ]}
                value={selectedRuangan}
                onChange={(val) => setSelectedRuangan(val || 'all')}
                placeholder="Pilih Ruangan..."
                searchPlaceholder="Cari ruangan..."
              />
            </div>

            {/* Filter Kondisi dengan SearchableSelect */}
            <div className="w-40">
              <SearchableSelect
                options={[
                  { value: 'all', label: 'Semua Kondisi' },
                  { value: 'baik', label: 'Kondisi Baik', badge: 'Normal' },
                  { value: 'rusak_ringan', label: 'Rusak Ringan', badge: 'Perlu Servis' },
                  { value: 'rusak_berat', label: 'Rusak Berat', badge: 'Mati Total' },
                  { value: 'afkir', label: 'Afkir / Dihapus', badge: 'Afkir' },
                ]}
                value={selectedKondisi}
                onChange={(val) => setSelectedKondisi(val || 'all')}
                placeholder="Pilih Kondisi..."
                searchPlaceholder="Cari kondisi..."
              />
            </div>

            {/* Filter Sumber Dana dengan SearchableSelect */}
            <div className="w-44">
              <SearchableSelect
                options={[
                  { value: 'all', label: 'Semua Sumber Dana' },
                  ...sumberDanaOptions.map((sd) => ({ value: sd, label: sd })),
                ]}
                value={selectedSumberDana}
                onChange={(val) => setSelectedSumberDana(val || 'all')}
                placeholder="Pilih Sumber Dana..."
                searchPlaceholder="Cari sumber dana..."
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

        {/* Selection Bar Action */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
          <label className="inline-flex items-center gap-2 cursor-pointer font-medium hover:text-gray-900 dark:hover:text-white">
            <input
              type="checkbox"
              checked={selectedIds.length > 0 && selectedIds.length === barangList.length}
              onChange={handleSelectAll}
              className="rounded text-primary focus:ring-primary"
            />
            <span>Pilih Semua Barang ({barangList.length} item)</span>
          </label>

          {selectedIds.length > 0 && (
            <span className="font-semibold text-primary">
              {selectedIds.length} aset terpilih untuk cetak label
            </span>
          )}
        </div>
      </div>

      {/* 4. MAIN INVENTORY CONTENT */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <RotateCcw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat inventaris aset barang...</p>
        </div>
      ) : barangList.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Boxes className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Tidak ada aset barang yang cocok</h3>
          <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci filter atau daftarkan aset baru.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {barangList.map((b) => {
            const kon = KONDISI_MAP[b.kondisiUtama] || KONDISI_MAP.baik
            const KonIcon = kon.icon
            const isChecked = selectedIds.includes(b.id)

            return (
              <div
                key={b.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl border transition p-4 flex flex-col justify-between space-y-3.5 relative ${
                  isChecked
                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Bar: Checkbox, Code & Condition */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(b.id)}
                        className="rounded text-primary focus:ring-primary cursor-pointer"
                        title="Pilih untuk cetak label"
                      />
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {b.kodeBarang}
                      </span>
                    </div>

                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${kon.badge}`}>
                      <KonIcon className="w-3 h-3" />
                      <span>{kon.label}</span>
                    </span>
                  </div>

                  {/* Image & Title Card */}
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                      {b.fotoUrl ? (
                        <img
                          src={b.fotoUrl}
                          alt={b.namaBarang}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <Boxes className="w-7 h-7 text-gray-300 dark:text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug truncate" title={b.namaBarang}>
                        {b.namaBarang}
                      </h3>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {b.merk || 'Tanpa Merk'} {b.noSeri ? `• SN: ${b.noSeri}` : ''}
                      </p>
                      <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mt-1">
                        {b.kategori?.nama}
                      </span>
                    </div>
                  </div>

                  {/* Placement & Quantity */}
                  <div className="mt-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span className="text-[11px] text-gray-400">Lokasi:</span>
                      <strong className="truncate max-w-[180px] text-gray-800 dark:text-gray-200">
                        {b.ruangan ? b.ruangan.namaRuangan : 'Belum Ditentukan'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span className="text-[11px] text-gray-400">Total Unit:</span>
                      <div>
                        <strong className="text-gray-900 dark:text-white">{b.jumlahTotal} unit</strong>
                        <span className="text-[10px] text-emerald-600 font-semibold ml-1.5">
                          ({b.jumlahBaik} baik{b.jumlahRusakRingan + b.jumlahRusakBerat > 0 ? `, ${b.jumlahRusakRingan + b.jumlahRusakBerat} rusak` : ''})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span className="text-[11px] text-gray-400">Nilai Perolehan:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {formatRupiah(Number(b.hargaPerolehan || 0) * b.jumlahTotal)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                  <button
                    onClick={() => handleOpenPrint([b])}
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold"
                    title="Cetak Label QR Barcode"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Label QR</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailBarang(b)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      title="Lihat Detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canEdit('/sarpras/barang') && (
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        title="Edit Aset"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete('/sarpras/barang') && (
                      <button
                        onClick={() => handleDelete(b)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Hapus Aset"
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
                  <th className="px-3 py-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === barangList.length}
                      onChange={handleSelectAll}
                      className="rounded text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3">Kode Aset</th>
                  <th className="px-3 py-3">Nama Barang & Merk</th>
                  <th className="px-3 py-3">Kategori</th>
                  <th className="px-3 py-3">Lokasi Ruangan</th>
                  <th className="px-3 py-3 text-center">Jumlah (Fisik)</th>
                  <th className="px-3 py-3 text-right">Nilai Total</th>
                  <th className="px-3 py-3 text-center">Kondisi</th>
                  <th className="px-3 py-3 text-center">Sumber Dana</th>
                  <th className="px-3 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {barangList.map((b) => {
                  const kon = KONDISI_MAP[b.kondisiUtama] || KONDISI_MAP.baik
                  const isChecked = selectedIds.includes(b.id)

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition ${
                        isChecked ? 'bg-primary/5 dark:bg-primary/10' : ''
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(b.id)}
                          className="rounded text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-gray-800 dark:text-gray-200">
                        {b.kodeBarang}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-gray-900 dark:text-white">{b.namaBarang}</div>
                        <div className="text-[10px] text-gray-400">
                          {b.merk || '-'} {b.noSeri ? `(SN: ${b.noSeri})` : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">
                        {b.kategori?.nama}
                      </td>
                      <td className="px-3 py-3 text-gray-700 dark:text-gray-300 font-medium">
                        {b.ruangan?.namaRuangan || '-'}
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-gray-900 dark:text-white">
                        {b.jumlahTotal} Unit
                        <div className="text-[10px] text-emerald-600 font-normal">
                          {b.jumlahBaik} baik
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(Number(b.hargaPerolehan || 0) * b.jumlahTotal)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kon.badge}`}>
                          {kon.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">
                        {b.sumberDana || '-'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenPrint([b])}
                            className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                            title="Cetak Label QR"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDetailBarang(b)}
                            className="p-1 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100"
                            title="Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEdit('/sarpras/barang') && (
                            <button
                              onClick={() => handleOpenEdit(b)}
                              className="p-1 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete('/sarpras/barang') && (
                            <button
                              onClick={() => handleDelete(b)}
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

      {/* 5. MODAL TAMBAH / UBAH ASET BARANG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-primary" />
                <span>{editingBarang ? 'Ubah Data Aset Barang' : 'Daftarkan Aset Barang Baru'}</span>
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
                    Kode Aset Barang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: AST-2024-001"
                    value={form.kodeBarang}
                    onChange={(e) => setForm({ ...form, kodeBarang: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nama Barang / Aset <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PC Desktop Core i5"
                    value={form.namaBarang}
                    onChange={(e) => setForm({ ...form, namaBarang: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              {/* Kategori & Ruangan dengan SearchableSelect */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Kategori Aset <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={kategoriList.map((k) => ({
                      value: String(k.id),
                      label: k.nama,
                      sublabel: `Kode: ${k.kode}`,
                    }))}
                    value={form.kategoriId}
                    onChange={(val) => setForm({ ...form, kategoriId: val })}
                    placeholder="Pilih Kategori Aset..."
                    searchPlaceholder="Cari kategori..."
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Lokasi Penempatan Ruangan
                  </label>
                  <SearchableSelect
                    options={[
                      { value: '', label: '-- Belum Dialokasikan / Gudang Umum --' },
                      ...ruanganList.map((r) => ({
                        value: String(r.id),
                        label: r.namaRuangan,
                        sublabel: r.gedung || undefined,
                        badge: r.kodeRuangan,
                      })),
                    ]}
                    value={form.ruanganId}
                    onChange={(val) => setForm({ ...form, ruanganId: val })}
                    placeholder="Pilih Ruangan..."
                    searchPlaceholder="Cari nama atau kode ruangan..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Merk / Brand</label>
                  <input
                    type="text"
                    placeholder="Contoh: Asus, Epson, Olympic"
                    value={form.merk}
                    onChange={(e) => setForm({ ...form, merk: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Nomor Seri (Serial Number)</label>
                  <input
                    type="text"
                    placeholder="Contoh: SN-89218209"
                    value={form.noSeri}
                    onChange={(e) => setForm({ ...form, noSeri: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Tahun Pengadaan</label>
                  <input
                    type="number"
                    value={form.tahunPengadaan}
                    onChange={(e) => setForm({ ...form, tahunPengadaan: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Sumber Dana</label>
                  <SearchableSelect
                    options={[
                      { value: 'BOS Reguler', label: 'BOS Reguler', sublabel: 'Bantuan Operasional Sekolah' },
                      { value: 'BOS Kinerja', label: 'BOS Kinerja', sublabel: 'Bantuan Berbasis Prestasi' },
                      { value: 'Yayasan', label: 'Yayasan', sublabel: 'Anggaran Yayasan Penyelenggara' },
                      { value: 'Komite Sekolah', label: 'Komite Sekolah', sublabel: 'Partisipasi Orang Tua Siswa' },
                      { value: 'Pemerintah Daerah', label: 'Pemerintah Daerah', sublabel: 'APBD / Hibah Pemda' },
                      { value: 'Hibah / Donasi', label: 'Hibah / Donasi', sublabel: 'Sumbangan CSR Swasta' },
                      { value: 'Unit Usaha Sekolah', label: 'Unit Usaha Sekolah', sublabel: 'Koperasi & Hasil Prakerin' },
                    ]}
                    value={form.sumberDana}
                    onChange={(val) => setForm({ ...form, sumberDana: val || 'BOS Reguler' })}
                    placeholder="Pilih Sumber Dana..."
                    searchPlaceholder="Cari sumber dana..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.hargaPerolehan}
                    onChange={(e) => setForm({ ...form, hargaPerolehan: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              {/* PIC Pegawai & Kondisi Utama Barang dengan SearchableSelect */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Penanggung Jawab / PIC Barang
                  </label>
                  <SearchableSelect
                    options={[
                      { value: '', label: '-- Belum Ditentukan / Ikut PIC Ruangan --' },
                      ...pegawaiList.map((p) => ({
                        value: String(p.id),
                        label: p.nama,
                        sublabel: p.jabatan || 'Pendidik / Tenaga Kependidikan',
                        badge: p.nip ? `NIP: ${p.nip}` : undefined,
                      })),
                    ]}
                    value={form.pjPegawaiId}
                    onChange={(val) => setForm({ ...form, pjPegawaiId: val })}
                    placeholder="Pilih PIC Barang..."
                    searchPlaceholder="Ketik nama atau jabatan pegawai..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Kondisi Utama Barang
                  </label>
                  <SearchableSelect
                    options={[
                      { value: 'baik', label: 'Kondisi Baik', sublabel: 'Berfungsi normal tanpa kendala', badge: 'Normal' },
                      { value: 'rusak_ringan', label: 'Rusak Ringan', sublabel: 'Masih dapat dipakai sebagian', badge: 'Servis' },
                      { value: 'rusak_berat', label: 'Rusak Berat', sublabel: 'Mati total / tidak dapat digunakan', badge: 'Rusak' },
                      { value: 'afkir', label: 'Afkir / Dihapus', sublabel: 'Siap dilelang atau dimusnahkan', badge: 'Afkir' },
                    ]}
                    value={form.kondisiUtama}
                    onChange={(val) => setForm({ ...form, kondisiUtama: val || 'baik' })}
                    placeholder="Pilih Kondisi Utama..."
                    searchPlaceholder="Cari kondisi..."
                  />
                </div>
              </div>

              {/* Rincian Kondisi Fisik Unit */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-2">
                <span className="block font-bold text-gray-800 dark:text-gray-200">
                  Rincian Kondisi Fisik Unit (Total: {form.jumlahTotal} Unit):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-600 mb-0.5">Jumlah Baik</label>
                    <input
                      type="number"
                      min={0}
                      value={form.jumlahBaik}
                      onChange={(e) => {
                        const baik = Number(e.target.value)
                        const tot = baik + form.jumlahRusakRingan + form.jumlahRusakBerat + form.jumlahAfkir
                        setForm({ ...form, jumlahBaik: baik, jumlahTotal: tot })
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-600 mb-0.5">Rusak Ringan</label>
                    <input
                      type="number"
                      min={0}
                      value={form.jumlahRusakRingan}
                      onChange={(e) => {
                        const rr = Number(e.target.value)
                        const tot = form.jumlahBaik + rr + form.jumlahRusakBerat + form.jumlahAfkir
                        setForm({ ...form, jumlahRusakRingan: rr, jumlahTotal: tot })
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-rose-600 mb-0.5">Rusak Berat</label>
                    <input
                      type="number"
                      min={0}
                      value={form.jumlahRusakBerat}
                      onChange={(e) => {
                        const rb = Number(e.target.value)
                        const tot = form.jumlahBaik + form.jumlahRusakRingan + rb + form.jumlahAfkir
                        setForm({ ...form, jumlahRusakBerat: rb, jumlahTotal: tot })
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">Afkir / Dihapus</label>
                    <input
                      type="number"
                      min={0}
                      value={form.jumlahAfkir}
                      onChange={(e) => {
                        const af = Number(e.target.value)
                        const tot = form.jumlahBaik + form.jumlahRusakRingan + form.jumlahRusakBerat + af
                        setForm({ ...form, jumlahAfkir: af, jumlahTotal: tot })
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Upload Foto Barang */}
              <div className="space-y-2">
                <label className="block font-semibold text-gray-700 dark:text-gray-300">
                  Foto Fisik Barang / Aset
                </label>

                {form.fotoUrl && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
                      <img src={form.fotoUrl} alt="Foto Aset" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{form.fotoUrl}</p>
                      <p className="text-[11px] text-emerald-600 font-medium mt-0.5">✓ Foto aset aktif</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, fotoUrl: '' })}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                      title="Hapus foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary bg-gray-50 dark:bg-gray-900/50 cursor-pointer transition text-gray-700 dark:text-gray-300">
                    <Upload className={`w-4 h-4 text-primary ${uploadingFoto ? 'animate-bounce' : ''}`} />
                    <span className="font-semibold text-xs">
                      {uploadingFoto ? 'Mengunggah Foto...' : 'Unggah File Foto'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={uploadingFoto}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleUploadFoto(f)
                      }}
                    />
                  </label>

                  <div>
                    <input
                      type="text"
                      placeholder="Atau tempel link URL foto..."
                      value={form.fotoUrl}
                      onChange={(e) => setForm({ ...form, fotoUrl: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Spesifikasi Teknis
                </label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi teknis (misal: Processor, RAM, Daya Listrik, Bahan Material)..."
                  value={form.spesifikasi}
                  onChange={(e) => setForm({ ...form, spesifikasi: e.target.value })}
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
                  disabled={saving || uploadingFoto}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editingBarang ? 'Simpan Perubahan' : 'Daftarkan Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DETAIL ASET BARANG */}
      {detailBarang && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <span className="text-[10px] font-mono text-primary font-bold">{detailBarang.kodeBarang}</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                  {detailBarang.namaBarang}
                </h3>
              </div>
              <button
                onClick={() => setDetailBarang(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Foto & Spek Utama */}
            <div className="flex gap-4">
              <div className="w-28 h-28 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                {detailBarang.fotoUrl ? (
                  <img src={detailBarang.fotoUrl} alt={detailBarang.namaBarang} className="w-full h-full object-cover" />
                ) : (
                  <Boxes className="w-10 h-10 text-gray-300 dark:text-gray-500" />
                )}
              </div>

              <div className="flex-1 space-y-1.5 text-xs">
                <div>
                  <span className="text-gray-400">Merk / Model:</span>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{detailBarang.merk || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Nomor Seri:</span>
                  <p className="font-mono text-gray-800 dark:text-gray-200">{detailBarang.noSeri || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Kategori:</span>
                  <p className="font-semibold text-primary">{detailBarang.kategori?.nama}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Lokasi Penempatan:</span>
                <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                  {detailBarang.ruangan ? detailBarang.ruangan.namaRuangan : 'Gudang Umum'}
                </p>
                {detailBarang.ruangan?.gedung && (
                  <p className="text-[10px] text-gray-500">{detailBarang.ruangan.gedung}</p>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Sumber Dana & Tahun:</span>
                <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                  {detailBarang.sumberDana || 'BOS'} ({detailBarang.tahunPengadaan || '-'})
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Harga Satuan Perolehan:</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatRupiah(detailBarang.hargaPerolehan || 0)}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Total Nilai Aset:</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatRupiah((detailBarang.hargaPerolehan || 0) * detailBarang.jumlahTotal)}
                </p>
              </div>
            </div>

            {/* Rincian Unit */}
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-200 block mb-1">
                Kondisi Fisik {detailBarang.jumlahTotal} Unit:
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="text-[10px] text-gray-400 block">Baik</span>
                  <strong className="text-emerald-600 text-sm">{detailBarang.jumlahBaik}</strong>
                </div>
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="text-[10px] text-gray-400 block">Rusak Ringan</span>
                  <strong className="text-amber-600 text-sm">{detailBarang.jumlahRusakRingan}</strong>
                </div>
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="text-[10px] text-gray-400 block">Rusak Berat</span>
                  <strong className="text-rose-600 text-sm">{detailBarang.jumlahRusakBerat}</strong>
                </div>
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <span className="text-[10px] text-gray-400 block">Afkir</span>
                  <strong className="text-gray-500 text-sm">{detailBarang.jumlahAfkir}</strong>
                </div>
              </div>
            </div>

            {detailBarang.spesifikasi && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs">
                <span className="text-gray-400 block mb-0.5">Spesifikasi Lengkap:</span>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{detailBarang.spesifikasi}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setDetailBarang(null)
                  handleOpenPrint([detailBarang])
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Label QR</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailBarang(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL CETAK LABEL QR BARCODE */}
      {isPrintModalOpen && (
        <LabelAsetModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          items={printItems}
        />
      )}
    </div>
  )
}

