'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Users,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Eye,
  GraduationCap,
  FileText,
  X,
  RefreshCw,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

const STATUS_MAP: Record<string, { label: string; badge: string }> = {
  menunggu: {
    label: 'Menunggu',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  verifikasi: {
    label: 'Verifikasi',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  diterima: {
    label: 'Diterima',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cadangan: {
    label: 'Cadangan',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  ditolak: {
    label: 'Ditolak',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
}

export default function AdminPpdbPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/kesiswaan/ppdb')
  const allowEdit = canEdit('/kesiswaan/ppdb')
  const allowDelete = canDelete('/kesiswaan/ppdb')

  const [activeTab, setActiveTab] = useState<'pendaftar' | 'gelombang'>('pendaftar')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  // Data
  const [pendaftarList, setPendaftarList] = useState<any[]>([])
  const [gelombangList, setGelombangList] = useState<any[]>([])
  const [jenjangList, setJenjangList] = useState<any[]>([])
  const [kelasList, setKelasList] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    menunggu: 0,
    verifikasi: 0,
    diterima: 0,
    cadangan: 0,
    ditolak: 0,
    sudahJadiSiswa: 0,
  })

  // Filters
  const [filterGelombang, setFilterGelombang] = useState('all')
  const [filterJenjang, setFilterJenjang] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal Detail & Seleksi
  const [selectedPendaftar, setSelectedPendaftar] = useState<any>(null)
  const [seleksiStatus, setSeleksiStatus] = useState('menunggu')
  const [seleksiCatatan, setSeleksiCatatan] = useState('')
  const [savingSeleksi, setSavingSeleksi] = useState(false)

  // Modal Konversi ke Siswa Aktif
  const [enrollTarget, setEnrollTarget] = useState<any>(null)
  const [enrollNis, setEnrollNis] = useState('')
  const [enrollKelasId, setEnrollKelasId] = useState('')
  const [enrolling, setEnrolling] = useState(false)

  // Modal Gelombang
  const [isWaveModalOpen, setIsWaveModalOpen] = useState(false)
  const [editingWave, setEditingWave] = useState<any>(null)
  const [savingWave, setSavingWave] = useState(false)
  const [waveForm, setWaveForm] = useState({
    nama: '',
    tahunAjaran: '2025/2026',
    tanggalMulai: '',
    tanggalSelesai: '',
    kuotaTotal: 100,
    biayaDaftar: 0,
    syaratText: '',
    isActive: true,
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterGelombang !== 'all') params.set('gelombangId', filterGelombang)
      if (filterJenjang !== 'all') params.set('jenjangId', filterJenjang)
      if (filterStatus !== 'all') params.set('statusSeleksi', filterStatus)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/kesiswaan/ppdb?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setPendaftarList(json.data.pendaftarList || [])
        setStats(json.data.stats)
        setGelombangList(json.data.gelombangList || [])
        setJenjangList(json.data.jenjangList || [])
        setKelasList(json.data.kelasList || [])
      }
    } catch (err) {
      console.error('Fetch PPDB admin error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterGelombang, filterJenjang, filterStatus])

  const eligibleKelasOptions = useMemo(() => {
    if (!enrollTarget) return []
    return kelasList
      .filter((k) => Number(k.jenjangId) === Number(enrollTarget.jenjangId))
      .map((k) => ({
        value: String(k.id),
        label: `${k.namaKelas} (${k.jenjang?.kode || ''}${k.jurusan ? ` - ${k.jurusan.kodeJurusan}` : ''})`,
        sublabel: `TA ${k.tahunAjaran}`,
      }))
  }, [kelasList, enrollTarget])

  const openDetailModal = (item: any) => {
    setSelectedPendaftar(item)
    setSeleksiStatus(item.statusSeleksi)
    setSeleksiCatatan(item.catatanPanitia || '')
  }

  const handleSaveSeleksi = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPendaftar) return
    setSavingSeleksi(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/kesiswaan/ppdb', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPendaftar.id,
          statusSeleksi: seleksiStatus,
          catatanPanitia: seleksiCatatan,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setSelectedPendaftar(null)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message || 'Gagal memperbarui seleksi' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingSeleksi(false)
    }
  }

  const handleDeletePendaftar = async (item: any) => {
    if (!confirm(`Hapus pendaftaran "${item.nama}" (${item.noPendaftaran})?`)) return
    setFeedback(null)
    try {
      const res = await fetch(`/api/kesiswaan/ppdb?id=${item.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    }
  }

  const handleOpenEnroll = (item: any) => {
    setEnrollTarget(item)
    setEnrollNis('')
    setEnrollKelasId('')
  }

  const handleConfirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollTarget) return
    setEnrolling(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/kesiswaan/ppdb/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pendaftarId: enrollTarget.id,
          nis: enrollNis.trim() || undefined,
          kelasId: enrollKelasId ? Number(enrollKelasId) : undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setEnrollTarget(null)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message || 'Gagal mendaftarkan siswa' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setEnrolling(false)
    }
  }

  const openWaveModal = (wave?: any) => {
    if (wave) {
      setEditingWave(wave)
      setWaveForm({
        nama: wave.nama,
        tahunAjaran: wave.tahunAjaran,
        tanggalMulai: new Date(wave.tanggalMulai).toISOString().slice(0, 10),
        tanggalSelesai: new Date(wave.tanggalSelesai).toISOString().slice(0, 10),
        kuotaTotal: wave.kuotaTotal,
        biayaDaftar: wave.biayaDaftar,
        syaratText: wave.syaratText || '',
        isActive: wave.isActive,
      })
    } else {
      setEditingWave(null)
      setWaveForm({
        nama: '',
        tahunAjaran: '2025/2026',
        tanggalMulai: new Date().toISOString().slice(0, 10),
        tanggalSelesai: '',
        kuotaTotal: 100,
        biayaDaftar: 0,
        syaratText: '1. Kartu Keluarga\n2. Pas Foto 3x4\n3. Ijazah / SKL / Rapor',
        isActive: true,
      })
    }
    setIsWaveModalOpen(true)
  }

  const handleSaveWave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingWave(true)
    setFeedback(null)
    try {
      const method = editingWave ? 'PUT' : 'POST'
      const payload = editingWave ? { ...waveForm, id: editingWave.id } : waveForm
      const res = await fetch('/api/kesiswaan/ppdb/gelombang', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setIsWaveModalOpen(false)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message || 'Gagal menyimpan gelombang' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingWave(false)
    }
  }

  const handleDeleteWave = async (wave: any) => {
    if (!confirm(`Hapus gelombang "${wave.nama}"?`)) return
    setFeedback(null)
    try {
      const res = await fetch(`/api/kesiswaan/ppdb/gelombang?id=${wave.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            PPDB Online &amp; Seleksi Pendaftar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola gelombang pendaftaran publik, verifikasi berkas, kelulusan seleksi, hingga konversi menjadi Siswa aktif.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/portal/ppdb"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Buka Halaman PPDB Publik ↗</span>
          </a>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500">Total Pendaftar</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-amber-600">Menunggu / Verifikasi</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {stats.menunggu + stats.verifikasi}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-emerald-600">Lulus / Diterima</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.diterima}</p>
        </div>
        <div className="rounded-2xl border border-blue-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-blue-600">Sudah Jadi Siswa Aktif</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {stats.sudahJadiSiswa}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('pendaftar')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'pendaftar'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daftar &amp; Seleksi Pendaftar ({stats.total})
        </button>
        <button
          onClick={() => setActiveTab('gelombang')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'gelombang'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pengaturan Gelombang &amp; Kuota ({gelombangList.length})
        </button>
      </div>

      {/* TAB 1: DAFTAR & SELEKSI PENDAFTAR */}
      {activeTab === 'pendaftar' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari No. Daftar / Nama / Asal Sekolah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchData()
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <button
                onClick={fetchData}
                className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Cari
              </button>
            </div>

            <SearchableSelect
              value={filterGelombang}
              onChange={(val) => setFilterGelombang(val)}
              options={[
                { value: 'all', label: 'Semua Gelombang' },
                ...gelombangList.map((g) => ({ value: String(g.id), label: g.nama })),
              ]}
            />

            <SearchableSelect
              value={filterJenjang}
              onChange={(val) => setFilterJenjang(val)}
              options={[
                { value: 'all', label: 'Semua Jenjang' },
                ...jenjangList.map((j) => ({ value: String(j.id), label: `${j.kode} - ${j.nama}` })),
              ]}
            />

            <SearchableSelect
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { value: 'all', label: 'Semua Status Seleksi' },
                { value: 'menunggu', label: 'Menunggu Verifikasi' },
                { value: 'verifikasi', label: 'Verifikasi' },
                { value: 'diterima', label: 'Diterima' },
                { value: 'cadangan', label: 'Cadangan' },
                { value: 'ditolak', label: 'Ditolak' },
              ]}
            />
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">No. Daftar</th>
                    <th className="px-4 py-3">Calon Siswa</th>
                    <th className="px-4 py-3">Tujuan &amp; Jalur</th>
                    <th className="px-4 py-3">Asal Sekolah</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        Memuat data pendaftar PPDB...
                      </td>
                    </tr>
                  ) : pendaftarList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        Belum ada data pendaftar yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    pendaftarList.map((item) => {
                      const st = STATUS_MAP[item.statusSeleksi] || STATUS_MAP.menunggu
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                            <div>{item.noPendaftaran}</div>
                            <div className="text-[10px] font-sans font-normal text-slate-400">
                              {new Date(item.tanggalDaftar).toLocaleDateString('id-ID')}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 dark:text-white">{item.nama}</div>
                            <div className="text-[11px] text-slate-500">
                              {item.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki'} • Wali:{' '}
                              {item.namaWali} ({item.telpWali})
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.jenjang?.kode}
                              {item.jurusan ? ` • ${item.jurusan.kodeJurusan}` : ''}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Jalur {item.jalurPendaftaran}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            <div>{item.asalSekolah}</div>
                            {item.nilaiRataRapor && (
                              <div className="text-[11px] text-slate-400">
                                Rata Rapor: {item.nilaiRataRapor}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-extrabold ${st.badge}`}
                            >
                              {st.label}
                            </span>
                            {item.siswa && (
                              <div className="mt-1 text-[10px] font-bold text-emerald-700">
                                ✓ NIS: {item.siswa.nis}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openDetailModal(item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Seleksi</span>
                              </button>

                              {allowEdit && item.statusSeleksi === 'diterima' && !item.siswaId && (
                                <button
                                  onClick={() => handleOpenEnroll(item)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                                  title="Daftarkan menjadi Siswa aktif"
                                >
                                  <GraduationCap className="h-3.5 w-3.5" />
                                  <span>Jadi Siswa</span>
                                </button>
                              )}

                              {allowDelete && !item.siswaId && (
                                <button
                                  onClick={() => handleDeletePendaftar(item)}
                                  className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                                  title="Hapus pendaftar"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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
        </div>
      )}

      {/* TAB 2: MANAJEMEN GELOMBANG */}
      {activeTab === 'gelombang' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {allowCreate && (
              <button
                onClick={() => openWaveModal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Gelombang PPDB</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gelombangList.map((wave) => {
              const pct = Math.min(100, Math.round((wave.jumlahPendaftar / wave.kuotaTotal) * 100))
              return (
                <div
                  key={wave.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          wave.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {wave.isActive ? 'AKTIF DIBUKA' : 'NONAKTIF'}
                      </span>
                      <h3 className="mt-1.5 text-base font-extrabold text-slate-900 dark:text-white">
                        {wave.nama}
                      </h3>
                      <p className="text-xs text-slate-500">Tahun Ajaran {wave.tahunAjaran}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {allowEdit && (
                        <button
                          onClick={() => openWaveModal(wave)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {allowDelete && (
                        <button
                          onClick={() => handleDeleteWave(wave)}
                          className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600">
                    Jadwal: {new Date(wave.tanggalMulai).toLocaleDateString('id-ID')} s.d.{' '}
                    {new Date(wave.tanggalSelesai).toLocaleDateString('id-ID')}
                  </p>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">Pendaftar Terisi</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {wave.jumlahPendaftar} / {wave.kuotaTotal} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MODAL DETAIL & SELEKSI PENDAFTAR */}
      {selectedPendaftar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Detail &amp; Verifikasi Pendaftar
                </h3>
                <p className="text-xs font-mono font-bold text-blue-600">
                  {selectedPendaftar.noPendaftaran} • {selectedPendaftar.nama}
                </p>
              </div>
              <button onClick={() => setSelectedPendaftar(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 rounded-xl p-4">
              <div><strong>Jenjang/Jurusan:</strong> {selectedPendaftar.jenjang?.nama} {selectedPendaftar.jurusan ? `(${selectedPendaftar.jurusan.namaJurusan})` : ''}</div>
              <div><strong>Jalur:</strong> {selectedPendaftar.jalurPendaftaran}</div>
              <div><strong>TTL:</strong> {selectedPendaftar.tempatLahir}, {new Date(selectedPendaftar.tanggalLahir).toLocaleDateString('id-ID')}</div>
              <div><strong>NISN:</strong> {selectedPendaftar.nisn || '-'}</div>
              <div><strong>Asal Sekolah:</strong> {selectedPendaftar.asalSekolah}</div>
              <div><strong>Rata Rapor:</strong> {selectedPendaftar.nilaiRataRapor ?? '-'}</div>
              <div className="sm:col-span-2"><strong>Alamat:</strong> {selectedPendaftar.alamat}</div>
              <div><strong>Wali:</strong> {selectedPendaftar.namaWali} ({selectedPendaftar.hubunganWali})</div>
              <div><strong>Kontak Wali:</strong> {selectedPendaftar.telpWali}</div>
            </div>

            {/* Lampiran Berkas */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Berkas Persyaratan Terunggah:</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedPendaftar.fotoUrl ? (
                  <a href={selectedPendaftar.fotoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-bold text-blue-700">
                    <FileText className="h-3.5 w-3.5" /> Lihat Pas Foto
                  </a>
                ) : <span className="text-slate-400">Pas Foto: Belum diunggah</span>}
                {selectedPendaftar.berkasKkUrl ? (
                  <a href={selectedPendaftar.berkasKkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-bold text-blue-700">
                    <FileText className="h-3.5 w-3.5" /> Lihat Kartu Keluarga
                  </a>
                ) : <span className="text-slate-400">• KK: Belum diunggah</span>}
                {selectedPendaftar.berkasIjazahUrl ? (
                  <a href={selectedPendaftar.berkasIjazahUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-bold text-blue-700">
                    <FileText className="h-3.5 w-3.5" /> Lihat Ijazah/Rapor
                  </a>
                ) : <span className="text-slate-400">• Ijazah/Rapor: Belum diunggah</span>}
              </div>
            </div>

            <form onSubmit={handleSaveSeleksi} className="space-y-4 border-t border-slate-200 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Keputusan Status Seleksi
                </label>
                <SearchableSelect
                  value={seleksiStatus}
                  onChange={(val) => setSeleksiStatus(val)}
                  disabled={!allowEdit}
                  options={[
                    { value: 'menunggu', label: 'Menunggu Verifikasi' },
                    { value: 'verifikasi', label: 'Dalam Verifikasi' },
                    { value: 'diterima', label: 'Diterima / Lulus Seleksi' },
                    { value: 'cadangan', label: 'Cadangan' },
                    { value: 'ditolak', label: 'Ditolak' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan Panitia (Tampil di Cek Status Publik)
                </label>
                <textarea
                  rows={2}
                  disabled={!allowEdit}
                  value={seleksiCatatan}
                  onChange={(e) => setSeleksiCatatan(e.target.value)}
                  placeholder="Contoh: Silakan hadir daftar ulang membawa berkas asli pada..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPendaftar(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
                >
                  Tutup
                </button>
                {allowEdit && (
                  <button
                    type="submit"
                    disabled={savingSeleksi}
                    className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingSeleksi ? 'Menyimpan...' : 'Simpan Keputusan Seleksi'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONVERSI JADI SISWA AKTIF */}
      {enrollTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmEnroll}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Daftarkan ke Data Siswa Aktif
                </h3>
                <p className="text-xs text-slate-500">
                  {enrollTarget.nama} ({enrollTarget.noPendaftaran})
                </p>
              </div>
              <button type="button" onClick={() => setEnrollTarget(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIS Siswa Baru (Kosongkan untuk Auto-Generate)
              </label>
              <input
                type="text"
                value={enrollNis}
                onChange={(e) => setEnrollNis(e.target.value)}
                placeholder="Biarkan kosong agar otomatis dibuat"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Penempatan Kelas Awal (Opsional)
              </label>
              <SearchableSelect
                value={enrollKelasId}
                onChange={(val) => setEnrollKelasId(val)}
                allowClear
                options={eligibleKelasOptions}
                placeholder="Pilih kelas penempatan..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEnrollTarget(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={enrolling}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <GraduationCap className="h-4 w-4" />
                <span>{enrolling ? 'Memproses...' : 'Konversi Jadi Siswa'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT GELOMBANG */}
      {isWaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveWave}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingWave ? 'Edit Gelombang PPDB' : 'Tambah Gelombang PPDB'}
              </h3>
              <button type="button" onClick={() => setIsWaveModalOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Nama Gelombang *</label>
                <input
                  type="text"
                  required
                  value={waveForm.nama}
                  onChange={(e) => setWaveForm({ ...waveForm, nama: e.target.value })}
                  placeholder="Contoh: Gelombang 2 - Jalur Umum"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Tahun Ajaran Target *</label>
                <input
                  type="text"
                  required
                  value={waveForm.tahunAjaran}
                  onChange={(e) => setWaveForm({ ...waveForm, tahunAjaran: e.target.value })}
                  placeholder="2025/2026"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Kuota Total</label>
                <input
                  type="number"
                  min={1}
                  value={waveForm.kuotaTotal}
                  onChange={(e) => setWaveForm({ ...waveForm, kuotaTotal: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Tanggal Mulai *</label>
                <input
                  type="date"
                  required
                  value={waveForm.tanggalMulai}
                  onChange={(e) => setWaveForm({ ...waveForm, tanggalMulai: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Tanggal Selesai *</label>
                <input
                  type="date"
                  required
                  value={waveForm.tanggalSelesai}
                  onChange={(e) => setWaveForm({ ...waveForm, tanggalSelesai: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Informasi Persyaratan Berkas</label>
                <textarea
                  rows={3}
                  value={waveForm.syaratText}
                  onChange={(e) => setWaveForm({ ...waveForm, syaratText: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="waveActive"
                  type="checkbox"
                  checked={waveForm.isActive}
                  onChange={(e) => setWaveForm({ ...waveForm, isActive: e.target.checked })}
                />
                <label htmlFor="waveActive" className="font-bold">
                  Aktif &amp; Tampilkan di Portal PPDB Publik
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsWaveModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingWave}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingWave ? 'Menyimpan...' : 'Simpan Gelombang'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

