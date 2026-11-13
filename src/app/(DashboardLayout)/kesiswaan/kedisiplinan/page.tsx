'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ShieldAlert,
  Award,
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Trash2,
  X,
  Users,
  ClipboardList,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

const STATUS_BK_MAP: Record<string, { label: string; style: string }> = {
  tercatat: {
    label: 'Tercatat',
    style: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  pembinaan: {
    label: 'Dalam Pembinaan BK',
    style: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  selesai: {
    label: 'Selesai / Dibina',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
}

export default function KedisiplinanPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/kesiswaan/kedisiplinan')
  const allowEdit = canEdit('/kesiswaan/kedisiplinan')
  const allowDelete = canDelete('/kesiswaan/kedisiplinan')

  const [activeTab, setActiveTab] = useState<'log' | 'rekap' | 'kategori'>('log')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  const [logs, setLogs] = useState<any[]>([])
  const [rekapSiswa, setRekapSiswa] = useState<any[]>([])
  const [siswaList, setSiswaList] = useState<any[]>([])
  const [kelasList, setKelasList] = useState<any[]>([])
  const [kategoriList, setKategoriList] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalPelanggaran: 0,
    totalPrestasi: 0,
    dalamPembinaan: 0,
    siswaPerluPerhatian: 0,
  })

  // Filters
  const [filterJenis, setFilterJenis] = useState('all')
  const [filterStatusBk, setFilterStatusBk] = useState('all')
  const [filterKelasId, setFilterKelasId] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal Catat Poin Baru
  const [isCatatOpen, setIsCatatOpen] = useState(false)
  const [savingCatat, setSavingCatat] = useState(false)
  const [catatForm, setCatatForm] = useState({
    siswaId: '',
    kategoriId: '',
    tanggal: new Date().toISOString().slice(0, 10),
    deskripsi: '',
    tindakLanjut: '',
    statusBk: 'tercatat',
  })

  // Modal Tindak Lanjut BK
  const [editingLog, setEditingLog] = useState<any>(null)
  const [editBkForm, setEditBkForm] = useState({
    deskripsi: '',
    tindakLanjut: '',
    statusBk: 'tercatat',
  })
  const [savingEditBk, setSavingEditBk] = useState(false)

  // Modal Kategori Poin
  const [isKategoriModalOpen, setIsKategoriModalOpen] = useState(false)
  const [editingKategori, setEditingKategori] = useState<any>(null)
  const [savingKategori, setSavingKategori] = useState(false)
  const [kategoriForm, setKategoriForm] = useState({
    kode: '',
    nama: '',
    jenis: 'pelanggaran',
    tingkat: 'ringan',
    poin: 10,
    active: true,
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterJenis !== 'all') params.set('jenis', filterJenis)
      if (filterStatusBk !== 'all') params.set('statusBk', filterStatusBk)
      if (filterKelasId !== 'all') params.set('kelasId', filterKelasId)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const [resMain, resKat] = await Promise.all([
        fetch(`/api/kesiswaan/kedisiplinan?${params.toString()}`),
        fetch('/api/kesiswaan/kedisiplinan/kategori'),
      ])
      const jsonMain = await resMain.json()
      const jsonKat = await resKat.json()

      if (jsonMain.success && jsonMain.data) {
        setLogs(jsonMain.data.logs || [])
        setRekapSiswa(jsonMain.data.rekapSiswa || [])
        setStats(jsonMain.data.stats)
        setSiswaList(jsonMain.data.siswaList || [])
        setKelasList(jsonMain.data.kelasList || [])
      }
      if (jsonKat.success && jsonKat.data) {
        setKategoriList(jsonKat.data)
      }
    } catch (err) {
      console.error('Fetch kedisiplinan error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterJenis, filterStatusBk, filterKelasId])

  const selectedKategoriInfo = useMemo(
    () => kategoriList.find((k) => String(k.id) === String(catatForm.kategoriId)) || null,
    [kategoriList, catatForm.kategoriId]
  )

  const handleCreateCatat = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCatat(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/kesiswaan/kedisiplinan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catatForm),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setIsCatatOpen(false)
        setCatatForm({
          siswaId: '',
          kategoriId: '',
          tanggal: new Date().toISOString().slice(0, 10),
          deskripsi: '',
          tindakLanjut: '',
          statusBk: 'tercatat',
        })
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message || 'Gagal mencatat poin' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingCatat(false)
    }
  }

  const openEditBk = (row: any) => {
    setEditingLog(row)
    setEditBkForm({
      deskripsi: row.deskripsi,
      tindakLanjut: row.tindakLanjut || '',
      statusBk: row.statusBk || 'tercatat',
    })
  }

  const handleSaveEditBk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLog) return
    setSavingEditBk(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/kesiswaan/kedisiplinan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingLog.id, ...editBkForm }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setEditingLog(null)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingEditBk(false)
    }
  }

  const handleDeleteLog = async (id: number) => {
    if (!confirm('Hapus catatan poin ini?')) return
    setFeedback(null)
    try {
      const res = await fetch(`/api/kesiswaan/kedisiplinan?id=${id}`, { method: 'DELETE' })
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

  const openKategoriModal = (kat?: any) => {
    if (kat) {
      setEditingKategori(kat)
      setKategoriForm({
        kode: kat.kode,
        nama: kat.nama,
        jenis: kat.jenis,
        tingkat: kat.tingkat,
        poin: kat.poin,
        active: kat.active,
      })
    } else {
      setEditingKategori(null)
      setKategoriForm({
        kode: '',
        nama: '',
        jenis: 'pelanggaran',
        tingkat: 'ringan',
        poin: 10,
        active: true,
      })
    }
    setIsKategoriModalOpen(true)
  }

  const handleSaveKategori = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingKategori(true)
    setFeedback(null)
    try {
      const method = editingKategori ? 'PUT' : 'POST'
      const payload = editingKategori ? { ...kategoriForm, id: editingKategori.id } : kategoriForm
      const res = await fetch('/api/kesiswaan/kedisiplinan/kategori', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setIsKategoriModalOpen(false)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingKategori(false)
    }
  }

  const handleDeleteKategori = async (kat: any) => {
    if (!confirm(`Hapus kategori "${kat.nama}"?`)) return
    setFeedback(null)
    try {
      const res = await fetch(`/api/kesiswaan/kedisiplinan/kategori?id=${kat.id}`, {
        method: 'DELETE',
      })
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
            Kedisiplinan, Poin Prestasi &amp; Bimbingan Konseling
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Buku pencatatan poin pelanggaran, poin prestasi, tindak lanjut BK, dan pantauan ambang batas pembinaan.
          </p>
        </div>

        {allowCreate && (
          <button
            onClick={() => setIsCatatOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Pelanggaran / Prestasi</span>
          </button>
        )}
      </div>

      {/* Feedback */}
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
          <button onClick={() => setFeedback(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-rose-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-rose-600">Total Catatan Pelanggaran</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalPelanggaran}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-emerald-600">Total Catatan Prestasi</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalPrestasi}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-amber-600">Dalam Pembinaan BK</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {stats.dalamPembinaan}
          </p>
        </div>
        <div className="rounded-2xl border border-red-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-red-700">Perlu Perhatian (&ge;50 Poin)</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {stats.siswaPerluPerhatian} Siswa
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('log')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'log'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Log Kejadian &amp; Poin ({logs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('rekap')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'rekap'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Rekap Skor per Siswa ({rekapSiswa.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('kategori')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'kategori'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Master Aturan Poin ({kategoriList.length})</span>
        </button>
      </div>

      {/* TAB 1: LOG KEJADIAN */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama/NIS siswa, kategori, atau deskripsi..."
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
              value={filterJenis}
              onChange={(val) => setFilterJenis(val)}
              options={[
                { value: 'all', label: 'Semua Jenis' },
                { value: 'pelanggaran', label: 'Pelanggaran (-)' },
                { value: 'prestasi', label: 'Prestasi (+)' },
              ]}
            />

            <SearchableSelect
              value={filterStatusBk}
              onChange={(val) => setFilterStatusBk(val)}
              options={[
                { value: 'all', label: 'Semua Status BK' },
                { value: 'tercatat', label: 'Tercatat' },
                { value: 'pembinaan', label: 'Dalam Pembinaan BK' },
                { value: 'selesai', label: 'Selesai / Dibina' },
              ]}
            />

            <SearchableSelect
              value={filterKelasId}
              onChange={(val) => setFilterKelasId(val)}
              options={[
                { value: 'all', label: 'Semua Kelas' },
                ...kelasList.map((k) => ({
                  value: String(k.id),
                  label: `${k.jenjang?.kode || ''} - ${k.namaKelas}`,
                })),
              ]}
            />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Siswa</th>
                    <th className="px-4 py-3">Kategori &amp; Poin</th>
                    <th className="px-4 py-3">Deskripsi &amp; Tindak Lanjut</th>
                    <th className="px-4 py-3">Status BK</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        Memuat log kedisiplinan...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        Belum ada catatan kedisiplinan atau prestasi.
                      </td>
                    </tr>
                  ) : (
                    logs.map((row) => {
                      const bk = STATUS_BK_MAP[row.statusBk] || STATUS_BK_MAP.tercatat
                      const isPrestasi = row.jenis === 'prestasi'
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-600">
                            {new Date(row.tanggal).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {row.siswa?.nama}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              NIS: {row.siswa?.nis} •{' '}
                              {row.siswa?.kelas?.namaKelas
                                ? `${row.siswa?.jenjang?.kode || ''} ${row.siswa.kelas.namaKelas}`
                                : 'Tanpa Kelas'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-extrabold ${
                                isPrestasi
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isPrestasi ? `+${row.poin}` : `-${row.poin}`} Poin
                            </span>
                            <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                              {row.kategori?.nama}
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-slate-700 dark:text-slate-300">{row.deskripsi}</p>
                            {row.tindakLanjut && (
                              <p className="mt-1 text-[11px] text-blue-700 font-semibold">
                                Tindak lanjut: {row.tindakLanjut}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-bold ${bk.style}`}
                            >
                              {bk.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {allowEdit && (
                                <button
                                  onClick={() => openEditBk(row)}
                                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                                  title="Ubah tindak lanjut BK"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {allowDelete && (
                                <button
                                  onClick={() => handleDeleteLog(row.id)}
                                  className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                                  title="Hapus catatan"
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

      {/* TAB 2: REKAP SKOR PER SISWA */}
      {activeTab === 'rekap' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Siswa</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3 text-center">Pelanggaran</th>
                  <th className="px-4 py-3 text-center">Prestasi</th>
                  <th className="px-4 py-3 text-center">Skor Net</th>
                  <th className="px-4 py-3">Status Monitoring BK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rekapSiswa.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      Belum ada rekaman poin untuk ditampilkan.
                    </td>
                  </tr>
                ) : (
                  rekapSiswa.map((s) => (
                    <tr key={s.siswaId} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{s.nama}</div>
                        <div className="text-[11px] font-mono text-slate-400">{s.nis}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.jenjangKode} • {s.kelasNama}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-rose-600">
                        -{s.poinPelanggaran} ({s.jumlahPelanggaran}x)
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-600">
                        +{s.poinPrestasi} ({s.jumlahPrestasi}x)
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-black text-slate-800">
                        {s.skorNet > 0 ? `+${s.skorNet}` : s.skorNet}
                      </td>
                      <td className="px-4 py-3">
                        {s.perluPerhatianBk ? (
                          <span className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-extrabold text-rose-700">
                            Perlu Pembinaan BK (&ge;50 Poin Pelanggaran)
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            Kondisi Baik / Aman
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MASTER KATEGORI POIN */}
      {activeTab === 'kategori' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {allowCreate && (
              <button
                onClick={() => openKategoriModal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Kategori Poin</span>
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Aturan / Kategori</th>
                  <th className="px-4 py-3">Jenis &amp; Tingkat</th>
                  <th className="px-4 py-3 text-center">Bobot Poin</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kategoriList.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{k.kode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{k.nama}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-lg border px-2 py-0.5 text-[11px] font-bold capitalize ${
                          k.jenis === 'prestasi'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {k.jenis} • {k.tingkat}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-black text-slate-800">
                      {k.jenis === 'prestasi' ? `+${k.poin}` : `-${k.poin}`}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        {allowEdit && (
                          <button
                            onClick={() => openKategoriModal(k)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {allowDelete && (
                          <button
                            onClick={() => handleDeleteKategori(k)}
                            className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* MODAL CATAT POIN BARU */}
      {isCatatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreateCatat}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Catat Pelanggaran / Prestasi Siswa
              </h3>
              <button type="button" onClick={() => setIsCatatOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Pilih Siswa *</label>
                <SearchableSelect
                  value={catatForm.siswaId}
                  onChange={(val) => setCatatForm({ ...catatForm, siswaId: val })}
                  options={siswaList.map((s) => ({
                    value: String(s.id),
                    label: `${s.nama} (${s.nis})`,
                    sublabel: s.kelas ? `${s.jenjang?.kode || ''} ${s.kelas.namaKelas}` : 'Belum ada kelas',
                  }))}
                  placeholder="Cari nama atau NIS siswa..."
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Kategori Poin *</label>
                <SearchableSelect
                  value={catatForm.kategoriId}
                  onChange={(val) => setCatatForm({ ...catatForm, kategoriId: val })}
                  options={kategoriList
                    .filter((k) => k.active)
                    .map((k) => ({
                      value: String(k.id),
                      label: `[${k.kode}] ${k.nama}`,
                      sublabel: `${k.jenis.toUpperCase()} (${k.jenis === 'prestasi' ? '+' : '-'}${k.poin} poin)`,
                    }))}
                  placeholder="Pilih kategori aturan poin..."
                />
                {selectedKategoriInfo && (
                  <p className="mt-1 text-[11px] font-bold text-blue-600">
                    Bobot otomatis: {selectedKategoriInfo.jenis === 'prestasi' ? '+' : '-'}
                    {selectedKategoriInfo.poin} poin ({selectedKategoriInfo.tingkat})
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Tanggal Kejadian *</label>
                  <input
                    type="date"
                    required
                    value={catatForm.tanggal}
                    onChange={(e) => setCatatForm({ ...catatForm, tanggal: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Status Penanganan BK</label>
                  <SearchableSelect
                    value={catatForm.statusBk}
                    onChange={(val) => setCatatForm({ ...catatForm, statusBk: val })}
                    options={[
                      { value: 'tercatat', label: 'Tercatat' },
                      { value: 'pembinaan', label: 'Dalam Pembinaan BK' },
                      { value: 'selesai', label: 'Selesai / Dibina' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Kronologi / Deskripsi Kejadian *</label>
                <textarea
                  rows={2}
                  required
                  value={catatForm.deskripsi}
                  onChange={(e) => setCatatForm({ ...catatForm, deskripsi: e.target.value })}
                  placeholder="Jelaskan detail kejadian atau pencapaian siswa..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Tindak Lanjut / Sanksi / Apresiasi</label>
                <input
                  type="text"
                  value={catatForm.tindakLanjut}
                  onChange={(e) => setCatatForm({ ...catatForm, tindakLanjut: e.target.value })}
                  placeholder="Contoh: Pembinaan lisan, Panggilan wali, atau Piagam penghargaan"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCatatOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingCatat}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingCatat ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EDIT TINDAK LANJUT BK */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEditBk}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Perbarui Tindak Lanjut BK
                </h3>
                <p className="text-xs text-slate-500">
                  {editingLog.siswa?.nama} • {editingLog.kategori?.nama}
                </p>
              </div>
              <button type="button" onClick={() => setEditingLog(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Status Pembinaan BK</label>
                <SearchableSelect
                  value={editBkForm.statusBk}
                  onChange={(val) => setEditBkForm({ ...editBkForm, statusBk: val })}
                  options={[
                    { value: 'tercatat', label: 'Tercatat' },
                    { value: 'pembinaan', label: 'Dalam Pembinaan BK' },
                    { value: 'selesai', label: 'Selesai / Dibina' },
                  ]}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={editBkForm.deskripsi}
                  onChange={(e) => setEditBkForm({ ...editBkForm, deskripsi: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Catatan Tindak Lanjut BK</label>
                <textarea
                  rows={2}
                  value={editBkForm.tindakLanjut}
                  onChange={(e) => setEditBkForm({ ...editBkForm, tindakLanjut: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingEditBk}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingEditBk ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT KATEGORI POIN */}
      {isKategoriModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveKategori}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingKategori ? 'Edit Kategori Poin' : 'Tambah Kategori Poin'}
              </h3>
              <button type="button" onClick={() => setIsKategoriModalOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Kode *</label>
                  <input
                    type="text"
                    required
                    value={kategoriForm.kode}
                    onChange={(e) => setKategoriForm({ ...kategoriForm, kode: e.target.value })}
                    placeholder="PLG-06 / PRS-05"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Bobot Poin *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={kategoriForm.poin}
                    onChange={(e) =>
                      setKategoriForm({ ...kategoriForm, poin: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  value={kategoriForm.nama}
                  onChange={(e) => setKategoriForm({ ...kategoriForm, nama: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Jenis</label>
                  <SearchableSelect
                    value={kategoriForm.jenis}
                    onChange={(val) =>
                      setKategoriForm({
                        ...kategoriForm,
                        jenis: val,
                        tingkat: val === 'prestasi' ? 'sekolah' : 'ringan',
                      })
                    }
                    options={[
                      { value: 'pelanggaran', label: 'Pelanggaran (-)' },
                      { value: 'prestasi', label: 'Prestasi (+)' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Tingkat</label>
                  <SearchableSelect
                    value={kategoriForm.tingkat}
                    onChange={(val) => setKategoriForm({ ...kategoriForm, tingkat: val })}
                    options={
                      kategoriForm.jenis === 'prestasi'
                        ? [
                            { value: 'sekolah', label: 'Tingkat Sekolah' },
                            { value: 'kota', label: 'Tingkat Kota/Kab' },
                            { value: 'provinsi', label: 'Tingkat Provinsi' },
                            { value: 'nasional', label: 'Tingkat Nasional' },
                          ]
                        : [
                            { value: 'ringan', label: 'Pelanggaran Ringan' },
                            { value: 'sedang', label: 'Pelanggaran Sedang' },
                            { value: 'berat', label: 'Pelanggaran Berat' },
                          ]
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsKategoriModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingKategori}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingKategori ? 'Menyimpan...' : 'Simpan Kategori'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

