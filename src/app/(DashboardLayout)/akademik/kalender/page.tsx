'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  RotateCcw,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  Users,
  Tag,
  Sparkles,
  Printer,
  CalendarDays,
  LayoutGrid,
  List,
  AlertTriangle,
  FileText,
  Flag,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

interface KalenderItem {
  id: number
  judul: string
  deskripsi: string | null
  tanggalMulai: string
  tanggalSelesai: string
  kategori: string
  warna: string
  tahunAjaran: string
  semester: string
  sasaran: string
  liburSekolah: boolean
  isPublic: boolean
  createdAt: string
}

interface StatsData {
  totalAgenda: number
  totalUjian: number
  totalLibur: number
  totalKegiatan: number
}

const KATEGORI_CONFIG: Record<string, { label: string; badge: string; defaultColor: string }> = {
  akademik: { label: 'Akademik & KBM', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300', defaultColor: '#3b82f6' },
  ujian: { label: 'Penilaian & Ujian', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300', defaultColor: '#f59e0b' },
  libur: { label: 'Libur Sekolah', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300', defaultColor: '#ef4444' },
  kegiatan: { label: 'Kegiatan Siswa', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300', defaultColor: '#10b981' },
  rapat: { label: 'Rapat Dinas / Guru', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300', defaultColor: '#8b5cf6' },
  ekstrakurikuler: { label: 'Ekstrakurikuler', badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300', defaultColor: '#14b8a6' },
  upacara: { label: 'Upacara / Hari Besar', badge: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300', defaultColor: '#e11d48' },
  lainnya: { label: 'Lainnya', badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', defaultColor: '#64748b' },
}

const SASARAN_LABELS: Record<string, string> = {
  semua: 'Seluruh Warga Sekolah',
  guru: 'Dewan Guru & Staf',
  siswa: 'Peserta Didik (Siswa)',
  wali_murid: 'Orang Tua / Wali Murid',
}

const PRESET_COLORS = [
  { name: 'Biru', hex: '#3b82f6' },
  { name: 'Merah', hex: '#ef4444' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Hijau', hex: '#10b981' },
  { name: 'Ungu', hex: '#8b5cf6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Slate', hex: '#64748b' },
]

export default function KalenderAkademikPage() {
  const { canCreate, canEdit, canDelete } = usePermission()

  const [events, setEvents] = useState<KalenderItem[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalAgenda: 0,
    totalUjian: 0,
    totalLibur: 0,
    totalKegiatan: 0,
  })
  const [tahunAjaranList, setTahunAjaranList] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Current calendar month view
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKategori, setSelectedKategori] = useState('all')
  const [selectedSasaran, setSelectedSasaran] = useState('all')
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState('all')

  // Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<KalenderItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Modal Detail State
  const [detailEvent, setDetailEvent] = useState<KalenderItem | null>(null)

  // Form State
  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    kategori: 'akademik',
    warna: '#3b82f6',
    tahunAjaran: '2024/2025',
    semester: 'ganjil',
    sasaran: 'semua',
    liburSekolah: false,
    isPublic: true,
  })

  // Fetch Events Data
  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedKategori !== 'all') params.append('kategori', selectedKategori)
      if (selectedSasaran !== 'all') params.append('sasaran', selectedSasaran)
      if (selectedTahunAjaran !== 'all') params.append('tahunAjaran', selectedTahunAjaran)

      // Query whole year or month
      const res = await fetch(`/api/akademik/kalender?${params.toString()}`)
      const json = await res.json()

      if (res.ok && json.success) {
        setEvents(json.data.events || [])
        setStats(json.data.stats || { totalAgenda: 0, totalUjian: 0, totalLibur: 0, totalKegiatan: 0 })
        if (json.data.tahunAjaranList) setTahunAjaranList(json.data.tahunAjaranList)
      } else {
        throw new Error(json.message || 'Gagal memuat agenda kalender')
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Terjadi kesalahan sistem' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [searchQuery, selectedKategori, selectedSasaran, selectedTahunAjaran])

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }
  const todayMonth = () => {
    setCurrentDate(new Date())
  }

  // Open Create Modal
  const handleOpenCreate = (initialDate?: string) => {
    setEditingEvent(null)
    const todayStr = initialDate || new Date().toISOString().slice(0, 10)
    setForm({
      judul: '',
      deskripsi: '',
      tanggalMulai: todayStr,
      tanggalSelesai: todayStr,
      kategori: 'akademik',
      warna: '#3b82f6',
      tahunAjaran: tahunAjaranList[0] || '2024/2025',
      semester: 'ganjil',
      sasaran: 'semua',
      liburSekolah: false,
      isPublic: true,
    })
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (item: KalenderItem) => {
    setEditingEvent(item)
    setForm({
      judul: item.judul,
      deskripsi: item.deskripsi || '',
      tanggalMulai: item.tanggalMulai.slice(0, 10),
      tanggalSelesai: item.tanggalSelesai.slice(0, 10),
      kategori: item.kategori,
      warna: item.warna || '#3b82f6',
      tahunAjaran: item.tahunAjaran,
      semester: item.semester,
      sasaran: item.sasaran,
      liburSekolah: item.liburSekolah,
      isPublic: item.isPublic,
    })
    setIsModalOpen(true)
  }

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.judul.trim() || !form.tanggalMulai || !form.tanggalSelesai) {
      setFeedback({ type: 'error', message: 'Judul dan rentang tanggal wajib diisi' })
      return
    }

    try {
      setSaving(true)
      const url = editingEvent ? `/api/akademik/kalender/${editingEvent.id}` : '/api/akademik/kalender'
      const method = editingEvent ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan agenda kalender')
      }

      setFeedback({
        type: 'success',
        message: editingEvent ? 'Agenda berhasil diperbarui' : 'Agenda baru berhasil dijadwalkan',
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
  const handleDelete = async (item: KalenderItem) => {
    if (!confirm(`Hapus agenda "${item.judul}" dari kalender akademik?`)) {
      return
    }

    try {
      const res = await fetch(`/api/akademik/kalender/${item.id}`, { method: 'DELETE' })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menghapus agenda')
      }

      setFeedback({ type: 'success', message: 'Agenda berhasil dihapus' })
      if (detailEvent?.id === item.id) setDetailEvent(null)
      fetchData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menghapus agenda' })
    }
  }

  // Calendar Grid Calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0-indexed

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]
  const currentMonthName = `${monthNames[month]} ${year}`

  // Days in month
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  // Calendar matrix
  const calendarCells = useMemo(() => {
    const cells = []

    // Previous month padding
    const prevPadding = firstDayOfWeek // 0 (Sun) to 6 (Sat)
    for (let i = prevPadding - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i
      const dateStr = `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      cells.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isPrevMonth: true,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
      })
    }

    // Next month padding to fill complete weeks (up to multiple of 7)
    const remaining = (7 - (cells.length % 7)) % 7
    for (let n = 1; n <= remaining; n++) {
      const dateStr = `${month === 11 ? year + 1 : year}-${String(month === 11 ? 1 : month + 2).padStart(2, '0')}-${String(n).padStart(2, '0')}`
      cells.push({
        dateStr,
        dayNum: n,
        isCurrentMonth: false,
        isNextMonth: true,
      })
    }

    return cells
  }, [year, month, firstDayOfWeek, daysInMonth, daysInPrevMonth])

  // Map events to date strings
  const eventsByDate = useMemo(() => {
    const map: Record<string, KalenderItem[]> = {}

    events.forEach((ev) => {
      const start = new Date(ev.tanggalMulai.slice(0, 10))
      const end = new Date(ev.tanggalSelesai.slice(0, 10))

      // Iterate day by day between start and end
      const cur = new Date(start)
      while (cur <= end) {
        const dStr = cur.toISOString().slice(0, 10)
        if (!map[dStr]) map[dStr] = []
        map[dStr].push(ev)
        cur.setDate(cur.getDate() + 1)
      }
    })

    return map
  }, [events])

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-primary" />
            <span>Kalender Akademik & Agenda Sekolah</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Penjadwalan kegiatan belajar mengajar, pekan ujian semester, libur sekolah, classmeeting, rapat dan upacara resmi
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 shadow-xs transition"
            title="Muat ulang data"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>

          {canCreate('/akademik/kalender') && (
            <button
              onClick={() => handleOpenCreate()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Agenda</span>
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
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Agenda Terjadwal</span>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalAgenda} Kegiatan</div>
          <p className="text-xs text-gray-400 mt-0.5">Sepanjang tahun ajaran</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Pekan Ujian & Asesmen
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.totalUjian} Agenda</div>
          <p className="text-xs text-gray-400 mt-0.5">PTS, PAS, dan Ujian Akhir</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-rose-100 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Libur Sekolah & Cuti
          </span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.totalLibur} Periode</div>
          <p className="text-xs text-gray-400 mt-0.5">Semester & hari besar nasional</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Kegiatan Siswa & Ekstra
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.totalKegiatan} Agenda</div>
          <p className="text-xs text-gray-400 mt-0.5">Classmeeting & upacara</p>
        </div>
      </div>

      {/* 3. FILTER BAR & CONTROLS */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari judul agenda atau deskripsi..."
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
                  { value: 'all', label: 'Semua Kategori' },
                  { value: 'akademik', label: 'Akademik & KBM', sublabel: 'Awal semester & KBM' },
                  { value: 'ujian', label: 'Penilaian & Ujian', sublabel: 'PTS, PAS, Asesmen' },
                  { value: 'libur', label: 'Libur Sekolah', sublabel: 'Libur semester & cuti' },
                  { value: 'kegiatan', label: 'Kegiatan Siswa', sublabel: 'Classmeeting & lomba' },
                  { value: 'rapat', label: 'Rapat Dinas / Guru', sublabel: 'Koordinasi pengajar' },
                  { value: 'ekstrakurikuler', label: 'Ekstrakurikuler', sublabel: 'Pramuka, OSIS, dll' },
                  { value: 'upacara', label: 'Upacara / Hari Besar', sublabel: 'Peringatan nasional' },
                  { value: 'lainnya', label: 'Lainnya', sublabel: 'Kegiatan umum' },
                ]}
                value={selectedKategori}
                onChange={(val) => setSelectedKategori(val || 'all')}
                placeholder="Pilih Kategori..."
                searchPlaceholder="Cari kategori..."
              />
            </div>

            {/* Filter Sasaran dengan SearchableSelect */}
            <div className="w-48">
              <SearchableSelect
                options={[
                  { value: 'all', label: 'Semua Sasaran' },
                  { value: 'semua', label: 'Seluruh Warga Sekolah' },
                  { value: 'guru', label: 'Dewan Guru & Staf' },
                  { value: 'siswa', label: 'Peserta Didik (Siswa)' },
                  { value: 'wali_murid', label: 'Orang Tua / Wali Murid' },
                ]}
                value={selectedSasaran}
                onChange={(val) => setSelectedSasaran(val || 'all')}
                placeholder="Pilih Sasaran..."
                searchPlaceholder="Cari sasaran..."
              />
            </div>

            {/* Filter Tahun Ajaran */}
            {tahunAjaranList.length > 0 && (
              <div className="w-36">
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'Semua TA' },
                    ...tahunAjaranList.map((t) => ({ value: t, label: t })),
                  ]}
                  value={selectedTahunAjaran}
                  onChange={(val) => setSelectedTahunAjaran(val || 'all')}
                  placeholder="Pilih Tahun Ajaran..."
                  searchPlaceholder="Cari TA..."
                />
              </div>
            )}

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-gray-800 text-primary shadow-xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Tampilan Visual Kalender"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-800 text-primary shadow-xs'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Tampilan Tabel Agenda"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Month Navigator Header (Only in Calendar View) */}
        {viewMode === 'calendar' && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-bold text-gray-900 dark:text-white px-2">
                {currentMonthName}
              </h2>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={todayMonth}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Bulan Ini
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN VIEW: CALENDAR GRID OR TABLE */}
      {viewMode === 'calendar' ? (
        /* VISUAL MONTHLY CALENDAR GRID */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center text-xs font-bold text-gray-500 py-2.5 uppercase tracking-wider">
            <span className="text-rose-500">Min</span>
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span className="text-blue-500">Sab</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 dark:divide-gray-700/60">
            {calendarCells.map((cell, idx) => {
              const dayEvents = eventsByDate[cell.dateStr] || []
              const isToday = cell.dateStr === todayStr
              const hasHoliday = dayEvents.some((e) => e.liburSekolah || e.kategori === 'libur')
              const isSunday = idx % 7 === 0

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => handleOpenCreate(cell.dateStr)}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition cursor-pointer hover:bg-primary/5 ${
                    !cell.isCurrentMonth
                      ? 'bg-gray-50/50 dark:bg-gray-900/40 text-gray-300 dark:text-gray-600'
                      : isSunday
                      ? 'bg-rose-50/20 dark:bg-rose-950/10'
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-primary text-white shadow-xs'
                          : hasHoliday || isSunday
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {hasHoliday && cell.isCurrentMonth && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        Libur
                      </span>
                    )}
                  </div>

                  {/* Event Pills */}
                  <div className="space-y-1 mt-1.5 flex-1 overflow-y-auto max-h-20">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDetailEvent(ev)
                        }}
                        style={{ borderLeftColor: ev.warna || '#3b82f6' }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-50 dark:bg-gray-900/90 text-gray-900 dark:text-white border-l-3 shadow-2xs truncate hover:opacity-80 transition cursor-pointer"
                        title={`${ev.judul} (${ev.kategori})`}
                      >
                        {ev.judul}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Tanggal Pelaksanaan</th>
                  <th className="px-4 py-3">Nama Agenda / Kegiatan</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Sasaran</th>
                  <th className="px-4 py-3 text-center">Status Libur</th>
                  <th className="px-4 py-3 text-center">Publikasi</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Tidak ada agenda kalender yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => {
                    const kat = KATEGORI_CONFIG[ev.kategori] || KATEGORI_CONFIG.lainnya
                    const startStr = new Date(ev.tanggalMulai).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                    const endStr = new Date(ev.tanggalSelesai).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                    const isSingleDay = ev.tanggalMulai.slice(0, 10) === ev.tanggalSelesai.slice(0, 10)

                    return (
                      <tr key={ev.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition">
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: ev.warna || '#3b82f6' }}
                            />
                            <span>{isSingleDay ? startStr : `${startStr} s.d. ${endStr}`}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900 dark:text-white">{ev.judul}</div>
                          {ev.deskripsi && (
                            <div className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{ev.deskripsi}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kat.badge}`}>
                            {kat.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {SASARAN_LABELS[ev.sasaran] || ev.sasaran}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {ev.liburSekolah ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              Libur Sekolah
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">Hari KBM</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {ev.isPublic ? (
                            <span className="text-[10px] font-semibold text-emerald-600">Publik (Web & Portal)</span>
                          ) : (
                            <span className="text-[10px] text-gray-400">Internal Guru</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setDetailEvent(ev)}
                              className="p-1 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100"
                              title="Detail Agenda"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {canEdit('/akademik/kalender') && (
                              <button
                                onClick={() => handleOpenEdit(ev)}
                                className="p-1 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100"
                                title="Edit Agenda"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete('/akademik/kalender') && (
                              <button
                                onClick={() => handleDelete(ev)}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                                title="Hapus Agenda"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* 5. MODAL TAMBAH / UBAH AGENDA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <span>{editingEvent ? 'Ubah Agenda Kalender' : 'Jadwalkan Agenda Baru'}</span>
              </h3>
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
                  Nama / Judul Agenda <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penilaian Akhir Semester (PAS) Ganjil"
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>

              {/* Kategori dengan SearchableSelect */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Kategori Agenda <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={[
                    { value: 'akademik', label: 'Akademik & KBM', sublabel: 'Awal semester, MPLS, KBM' },
                    { value: 'ujian', label: 'Penilaian & Ujian', sublabel: 'PTS, PAS, Asesmen' },
                    { value: 'libur', label: 'Libur Sekolah', sublabel: 'Libur semester & cuti' },
                    { value: 'kegiatan', label: 'Kegiatan Siswa', sublabel: 'Classmeeting & lomba' },
                    { value: 'rapat', label: 'Rapat Dinas / Guru', sublabel: 'Koordinasi pengajar' },
                    { value: 'ekstrakurikuler', label: 'Ekstrakurikuler', sublabel: 'Pramuka, OSIS, dll' },
                    { value: 'upacara', label: 'Upacara / Hari Besar', sublabel: 'Peringatan nasional' },
                    { value: 'lainnya', label: 'Lainnya', sublabel: 'Kegiatan umum' },
                  ]}
                  value={form.kategori}
                  onChange={(val) => {
                    const kat = val || 'akademik'
                    const defaultColor = KATEGORI_CONFIG[kat]?.defaultColor || '#3b82f6'
                    setForm({ ...form, kategori: kat, warna: defaultColor })
                  }}
                  placeholder="Pilih Kategori Agenda..."
                  searchPlaceholder="Cari kategori agenda..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.tanggalMulai}
                    onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal Selesai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.tanggalSelesai}
                    onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>
              </div>

              {/* Warna Label Acara */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Warna Label Kalender
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setForm({ ...form, warna: c.hex })}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        form.warna === c.hex ? 'border-gray-900 scale-110 shadow-sm' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.warna}
                    onChange={(e) => setForm({ ...form, warna: e.target.value })}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200"
                    title="Pilih warna kustom"
                  />
                </div>
              </div>

              {/* Sasaran & Semester dengan SearchableSelect */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Sasaran Peserta <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={[
                      { value: 'semua', label: 'Seluruh Warga Sekolah' },
                      { value: 'guru', label: 'Dewan Guru & Staf' },
                      { value: 'siswa', label: 'Peserta Didik (Siswa)' },
                      { value: 'wali_murid', label: 'Orang Tua / Wali Murid' },
                    ]}
                    value={form.sasaran}
                    onChange={(val) => setForm({ ...form, sasaran: val || 'semua' })}
                    placeholder="Pilih Sasaran..."
                    searchPlaceholder="Cari sasaran peserta..."
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Semester
                  </label>
                  <SearchableSelect
                    options={[
                      { value: 'ganjil', label: 'Semester Ganjil' },
                      { value: 'genap', label: 'Semester Genap' },
                      { value: 'keduanya', label: 'Sepanjang Tahun' },
                    ]}
                    value={form.semester}
                    onChange={(val) => setForm({ ...form, semester: val || 'ganjil' })}
                    placeholder="Pilih Semester..."
                    searchPlaceholder="Cari semester..."
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.liburSekolah}
                    onChange={(e) => setForm({ ...form, liburSekolah: e.target.checked })}
                    className="rounded text-rose-500 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      Hari Libur Sekolah (Tidak Ada KBM)
                    </span>
                    <p className="text-[10px] text-gray-400">
                      Tandai jika pada tanggal ini siswa dan guru libur kegiatan belajar mengajar
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer pt-2 border-t border-gray-200/60 dark:border-gray-800">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      Publikasikan ke Portal Siswa & Web Publik
                    </span>
                    <p className="text-[10px] text-gray-400">
                      Agenda akan dapat dilihat oleh siswa, wali murid, dan pengunjung portal sekolah
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Deskripsi / Petunjuk Pelaksanaan
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan, seragam yang dikenakan, atau instruksi kegiatan..."
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
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editingEvent ? 'Simpan Perubahan' : 'Jadwalkan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DETAIL AGENDA */}
      {detailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: detailEvent.warna || '#3b82f6' }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {KATEGORI_CONFIG[detailEvent.kategori]?.label || detailEvent.kategori}
                </span>
              </div>
              <button
                onClick={() => setDetailEvent(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                {detailEvent.judul}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                <span>
                  {new Date(detailEvent.tanggalMulai).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {detailEvent.tanggalMulai.slice(0, 10) !== detailEvent.tanggalSelesai.slice(0, 10) && (
                    <span>
                      {' '}s.d.{' '}
                      {new Date(detailEvent.tanggalSelesai).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Sasaran:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {SASARAN_LABELS[detailEvent.sasaran] || detailEvent.sasaran}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900">
                <span className="text-gray-400">Tahun Ajaran:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {detailEvent.tahunAjaran} ({detailEvent.semester})
                </p>
              </div>
            </div>

            {detailEvent.liburSekolah && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Hari Libur Resmi Sekolah (Kegiatan KBM Ditiadakan)</span>
              </div>
            )}

            {detailEvent.deskripsi && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs">
                <span className="text-gray-400 block mb-0.5 font-semibold">Petunjuk / Keterangan:</span>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{detailEvent.deskripsi}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
              <div className="flex gap-2">
                {canEdit('/akademik/kalender') && (
                  <button
                    onClick={() => {
                      setDetailEvent(null)
                      handleOpenEdit(detailEvent)
                    }}
                    className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Ubah</span>
                  </button>
                )}
                {canDelete('/akademik/kalender') && (
                  <button
                    onClick={() => handleDelete(detailEvent)}
                    className="inline-flex items-center gap-1 text-rose-500 font-semibold hover:underline ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setDetailEvent(null)}
                className="px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold"
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

