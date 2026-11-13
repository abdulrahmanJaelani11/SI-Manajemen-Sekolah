'use client'

import React, { useEffect, useState } from 'react'
import {
  BookOpen,
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  Award,
  Clock,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

export default function MataPelajaranPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/akademik/mapel')
  const allowEdit = canEdit('/akademik/mapel')
  const allowDelete = canDelete('/akademik/mapel')

  const [activeTab, setActiveTab] = useState<'katalog' | 'pengampu'>('katalog')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Data Master
  const [mapelList, setMapelList] = useState<any[]>([])
  const [jenjangList, setJenjangList] = useState<any[]>([])
  const [jurusanList, setJurusanList] = useState<any[]>([])
  const [kelasList, setKelasList] = useState<any[]>([])
  const [guruList, setGuruList] = useState<any[]>([])
  const [pengampuList, setPengampuList] = useState<any[]>([])
  const [activePeriod, setActivePeriod] = useState<any>(null)

  // Filter Katalog
  const [searchQuery, setSearchQuery] = useState('')
  const [filterKelompok, setFilterKelompok] = useState('')
  const [filterJenjang, setFilterJenjang] = useState('')

  // Filter Pengampu
  const [pengampuTa, setPengampuTa] = useState('2024/2025')
  const [pengampuSemester, setPengampuSemester] = useState('Ganjil')
  const [pengampuKelasId, setPengampuKelasId] = useState('')

  // Modal Mapel
  const [isMapelModalOpen, setIsMapelModalOpen] = useState(false)
  const [editingMapel, setEditingMapel] = useState<any>(null)
  const [submittingMapel, setSubmittingMapel] = useState(false)
  const [mapelForm, setMapelForm] = useState({
    kode: '',
    nama: '',
    kelompok: 'Umum',
    kkm: 75,
    jenjangId: '',
    jurusanId: '',
    deskripsi: '',
    active: true,
  })

  // Modal Pengampu
  const [isPengampuModalOpen, setIsPengampuModalOpen] = useState(false)
  const [submittingPengampu, setSubmittingPengampu] = useState(false)
  const [pengampuForm, setPengampuForm] = useState({
    kelasId: '',
    mapelId: '',
    guruId: '',
    tahunAjaran: '2024/2025',
    semester: 'Ganjil',
    jamPerMinggu: 2,
  })

  const fetchMapelData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (filterKelompok) params.set('kelompok', filterKelompok)
      if (filterJenjang) params.set('jenjangId', filterJenjang)

      const res = await fetch(`/api/akademik/mapel?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setMapelList(json.data.mapelList || [])
        setJenjangList(json.data.jenjangList || [])
        setJurusanList(json.data.jurusanList || [])
        setKelasList(json.data.kelasList || [])
        setGuruList(json.data.guruList || [])
        if (json.data.activePeriod && !activePeriod) {
          setActivePeriod(json.data.activePeriod)
          setPengampuTa(json.data.activePeriod.nama)
          setPengampuSemester(json.data.activePeriod.semester)
        }
      }
    } catch (err) {
      console.error('Fetch mapel error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPengampu = async (ta = pengampuTa, sem = pengampuSemester, kId = pengampuKelasId) => {
    try {
      const params = new URLSearchParams()
      if (ta) params.set('tahunAjaran', ta)
      if (sem) params.set('semester', sem)
      if (kId) params.set('kelasId', kId)

      const res = await fetch(`/api/akademik/pengampu?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setPengampuList(json.data || [])
      }
    } catch (err) {
      console.error('Fetch pengampu error:', err)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMapelData()
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery, filterKelompok, filterJenjang])

  useEffect(() => {
    fetchPengampu(pengampuTa, pengampuSemester, pengampuKelasId)
  }, [pengampuTa, pengampuSemester, pengampuKelasId])

  // CRUD Mapel
  const openAddMapel = () => {
    setEditingMapel(null)
    setMapelForm({
      kode: '',
      nama: '',
      kelompok: 'Umum',
      kkm: 75,
      jenjangId: '',
      jurusanId: '',
      deskripsi: '',
      active: true,
    })
    setIsMapelModalOpen(true)
  }

  const openEditMapel = (item: any) => {
    setEditingMapel(item)
    setMapelForm({
      kode: item.kode,
      nama: item.nama,
      kelompok: item.kelompok || 'Umum',
      kkm: item.kkm ?? 75,
      jenjangId: item.jenjangId ? String(item.jenjangId) : '',
      jurusanId: item.jurusanId ? String(item.jurusanId) : '',
      deskripsi: item.deskripsi || '',
      active: item.active !== false,
    })
    setIsMapelModalOpen(true)
  }

  const handleSaveMapel = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingMapel(true)
    setFeedback(null)

    try {
      const url = editingMapel
        ? `/api/akademik/mapel/${editingMapel.id}`
        : '/api/akademik/mapel'
      const method = editingMapel ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapelForm),
      })
      const json = await res.json()

      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        setIsMapelModalOpen(false)
        await fetchMapelData()
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menyimpan mata pelajaran' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Gagal menyimpan: ' + err.message })
    } finally {
      setSubmittingMapel(false)
    }
  }

  const handleDeleteMapel = async (item: any) => {
    if (!confirm(`Hapus mata pelajaran "${item.nama}" (${item.kode})?`)) return
    setFeedback(null)

    try {
      const res = await fetch(`/api/akademik/mapel/${item.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        await fetchMapelData()
        await fetchPengampu()
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menghapus mata pelajaran' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error: ' + err.message })
    }
  }

  // CRUD Pengampu
  const openAddPengampu = () => {
    setPengampuForm({
      kelasId: pengampuKelasId || '',
      mapelId: '',
      guruId: '',
      tahunAjaran: pengampuTa,
      semester: pengampuSemester,
      jamPerMinggu: 2,
    })
    setIsPengampuModalOpen(true)
  }

  const handleSavePengampu = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingPengampu(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/akademik/pengampu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pengampuForm),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        setIsPengampuModalOpen(false)
        await fetchPengampu()
        await fetchMapelData()
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menyimpan penugasan' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error: ' + err.message })
    } finally {
      setSubmittingPengampu(false)
    }
  }

  const handleDeletePengampu = async (item: any) => {
    if (
      !confirm(
        `Hapus penugasan ${item.guru?.nama} mengajar ${item.mapel?.nama} di kelas ${item.kelas?.namaKelas}?`
      )
    ) {
      return
    }
    setFeedback(null)
    try {
      const res = await fetch(`/api/akademik/pengampu/${item.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        await fetchPengampu()
        await fetchMapelData()
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menghapus penugasan' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error: ' + err.message })
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mata Pelajaran & Guru Pengampu
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola katalog mata pelajaran, penetapan KKM, dan pemetaan guru pengajar di setiap rombel kelas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'katalog' && allowCreate && (
            <button
              onClick={openAddMapel}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Mata Pelajaran</span>
            </button>
          )}
          {activeTab === 'pengampu' && allowCreate && (
            <button
              onClick={openAddPengampu}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition"
            >
              <UserCheck className="h-4 w-4" />
              <span>Tetapkan Guru Pengampu</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('katalog')}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === 'katalog'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Katalog Mata Pelajaran ({mapelList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pengampu')}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === 'pengampu'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Pemetaan Guru Pengampu ({pengampuList.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: KATALOG MATA PELAJARAN */}
      {/* ======================================================== */}
      {activeTab === 'katalog' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode atau nama mata pelajaran..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <SearchableSelect
              value={filterKelompok}
              onChange={(val) => setFilterKelompok(val)}
              options={[
                { value: '', label: 'Semua Kelompok Mapel' },
                { value: 'Umum', label: 'Kelompok Umum / Nasional' },
                { value: 'Keagamaan', label: 'Pendidikan Agama & Keagamaan' },
                { value: 'Kejuruan', label: 'Kejuruan / Produktif' },
                { value: 'Muatan Lokal', label: 'Muatan Lokal (Mulok)' },
              ]}
              placeholder="Semua Kelompok"
            />

            <SearchableSelect
              value={filterJenjang}
              onChange={(val) => setFilterJenjang(val)}
              options={[
                { value: '', label: 'Semua Jenjang' },
                ...jenjangList.map((j) => ({
                  value: String(j.id),
                  label: `${j.kode} (${j.nama})`,
                })),
              ]}
              placeholder="Semua Jenjang"
            />
          </div>

          {/* Tabel Mapel */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Memuat data mata pelajaran...</div>
            ) : mapelList.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                Tidak ada mata pelajaran yang ditemukan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5">Kode</th>
                      <th className="px-4 py-3.5">Nama Mata Pelajaran</th>
                      <th className="px-4 py-3.5">Kelompok</th>
                      <th className="px-4 py-3.5 text-center">KKM</th>
                      <th className="px-4 py-3.5">Jenjang / Jurusan</th>
                      <th className="px-4 py-3.5 text-center">Kelas Diampu</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mapelList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {item.kode}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {item.nama}
                          </span>
                          {item.deskripsi && (
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {item.deskripsi}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {item.kelompok}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-0.5 font-mono font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {item.kkm}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {item.jenjang?.kode || 'Semua Jenjang'}
                          {item.jurusan ? ` (${item.jurusan.kodeJurusan})` : ''}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-200">
                          {item._count?.pengampu || 0} kelas
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {allowEdit && (
                              <button
                                onClick={() => openEditMapel(item)}
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-amber-600 dark:border-slate-700 dark:text-slate-300"
                                title="Edit Mapel"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {allowDelete && (
                              <button
                                onClick={() => handleDeleteMapel(item)}
                                className="rounded-lg border border-red-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-red-900/40"
                                title="Hapus Mapel"
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
            )}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* TAB 2: PEMETAAN GURU PENGAMPU */
        /* ======================================================== */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Tahun Ajaran
              </label>
              <input
                type="text"
                value={pengampuTa}
                onChange={(e) => setPengampuTa(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Semester
              </label>
              <SearchableSelect
                value={pengampuSemester}
                onChange={(val) => setPengampuSemester(val)}
                options={[
                  { value: 'Ganjil', label: 'Semester Ganjil' },
                  { value: 'Genap', label: 'Semester Genap' },
                ]}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Filter Kelas
              </label>
              <SearchableSelect
                value={pengampuKelasId}
                onChange={(val) => setPengampuKelasId(val)}
                options={[
                  { value: '', label: 'Semua Kelas' },
                  ...kelasList.map((k) => ({
                    value: String(k.id),
                    label: `${k.jenjang?.kode} - ${k.namaKelas}`,
                  })),
                ]}
                placeholder="Semua Kelas"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            {pengampuList.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                Belum ada penugasan guru pengampu untuk periode {pengampuTa} ({pengampuSemester}).
                <br />
                Klik tombol <strong>&quot;Tetapkan Guru Pengampu&quot;</strong> di kanan atas untuk memulai.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-3.5">Kelas</th>
                      <th className="px-4 py-3.5">Mata Pelajaran</th>
                      <th className="px-4 py-3.5">Guru Pengampu</th>
                      <th className="px-4 py-3.5 text-center">Beban Jam</th>
                      <th className="px-4 py-3.5">Periode</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pengampuList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                          {item.kelas?.jenjang?.kode} - {item.kelas?.namaKelas}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {item.mapel?.nama}
                          </span>
                          <span className="block text-[10px] font-mono text-slate-400">
                            {item.mapel?.kode}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.guru?.nama}
                          </span>
                          {item.guru?.nip && (
                            <span className="block text-[10px] font-mono text-slate-400">
                              NIP: {item.guru.nip}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                            <Clock className="h-3 w-3" />
                            {item.jamPerMinggu} JP/mgg
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-mono">
                          {item.tahunAjaran} ({item.semester})
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {allowDelete && (
                            <button
                              onClick={() => handleDeletePengampu(item)}
                              className="rounded-lg border border-red-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-red-900/40"
                              title="Hapus Penugasan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT MATA PELAJARAN */}
      {isMapelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
              </h3>
              <button
                onClick={() => setIsMapelModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMapel} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Mapel *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MTK-01"
                    value={mapelForm.kode}
                    onChange={(e) => setMapelForm({ ...mapelForm, kode: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono uppercase focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Mata Pelajaran *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Matematika Wajib"
                    value={mapelForm.nama}
                    onChange={(e) => setMapelForm({ ...mapelForm, nama: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kelompok Mapel
                  </label>
                  <SearchableSelect
                    value={mapelForm.kelompok}
                    onChange={(val) => setMapelForm({ ...mapelForm, kelompok: val })}
                    options={[
                      { value: 'Umum', label: 'Umum / Nasional' },
                      { value: 'Keagamaan', label: 'Keagamaan' },
                      { value: 'Kejuruan', label: 'Kejuruan / Produktif' },
                      { value: 'Muatan Lokal', label: 'Muatan Lokal' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    KKM (Nilai Ketuntasan) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={mapelForm.kkm}
                    onChange={(e) => setMapelForm({ ...mapelForm, kkm: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenjang (Opsional)
                  </label>
                  <SearchableSelect
                    value={mapelForm.jenjangId}
                    onChange={(val) => setMapelForm({ ...mapelForm, jenjangId: val })}
                    options={[
                      { value: '', label: 'Semua Jenjang' },
                      ...jenjangList.map((j) => ({
                        value: String(j.id),
                        label: `${j.kode} (${j.nama})`,
                      })),
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jurusan (Opsional)
                  </label>
                  <SearchableSelect
                    value={mapelForm.jurusanId}
                    onChange={(val) => setMapelForm({ ...mapelForm, jurusanId: val })}
                    options={[
                      { value: '', label: 'Semua Jurusan' },
                      ...jurusanList.map((jr) => ({
                        value: String(jr.id),
                        label: `${jr.kodeJurusan} - ${jr.namaJurusan}`,
                      })),
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={2}
                  value={mapelForm.deskripsi}
                  onChange={(e) => setMapelForm({ ...mapelForm, deskripsi: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMapelModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingMapel}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingMapel ? 'Menyimpan...' : 'Simpan Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENUGASAN GURU PENGAMPU */}
      {isPengampuModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tetapkan Guru Pengampu
              </h3>
              <button
                onClick={() => setIsPengampuModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePengampu} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kelas *
                </label>
                <SearchableSelect
                  value={pengampuForm.kelasId}
                  onChange={(val) => setPengampuForm({ ...pengampuForm, kelasId: val })}
                  options={kelasList.map((k) => ({
                    value: String(k.id),
                    label: `${k.jenjang?.kode} - ${k.namaKelas}`,
                  }))}
                  placeholder="Pilih Kelas..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran *
                </label>
                <SearchableSelect
                  value={pengampuForm.mapelId}
                  onChange={(val) => setPengampuForm({ ...pengampuForm, mapelId: val })}
                  options={mapelList.map((m) => ({
                    value: String(m.id),
                    label: `${m.nama} (${m.kode})`,
                  }))}
                  placeholder="Pilih Mata Pelajaran..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Guru Pengampu *
                </label>
                <SearchableSelect
                  value={pengampuForm.guruId}
                  onChange={(val) => setPengampuForm({ ...pengampuForm, guruId: val })}
                  options={guruList.map((g) => ({
                    value: String(g.id),
                    label: `${g.nama}${g.bidangStudi ? ` (${g.bidangStudi})` : ''}`,
                  }))}
                  placeholder="Pilih Guru..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tahun Ajaran
                  </label>
                  <input
                    type="text"
                    required
                    value={pengampuForm.tahunAjaran}
                    onChange={(e) => setPengampuForm({ ...pengampuForm, tahunAjaran: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <SearchableSelect
                    value={pengampuForm.semester}
                    onChange={(val) => setPengampuForm({ ...pengampuForm, semester: val })}
                    options={[
                      { value: 'Ganjil', label: 'Ganjil' },
                      { value: 'Genap', label: 'Genap' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam/Minggu
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={pengampuForm.jamPerMinggu}
                    onChange={(e) => setPengampuForm({ ...pengampuForm, jamPerMinggu: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-mono font-bold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPengampuModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPengampu}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingPengampu ? 'Menyimpan...' : 'Simpan Penugasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

