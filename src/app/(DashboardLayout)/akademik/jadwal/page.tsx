'use client'

import React, { useEffect, useState } from 'react'
import {
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Printer,
  AlertCircle,
  CheckCircle2,
  X,
  User,
  BookOpen,
  Building2,
  Coffee,
  Sparkles,
  ShieldAlert,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function JadwalPelajaranPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/akademik/jadwal')
  const allowEdit = canEdit('/akademik/jadwal')
  const allowDelete = canDelete('/akademik/jadwal')

  const [viewMode, setViewMode] = useState<'kelas' | 'guru' | 'slots'>('kelas')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Period & Filters
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025')
  const [semester, setSemester] = useState('Ganjil')
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [selectedGuruId, setSelectedGuruId] = useState('')

  // Master & Schedule Data
  const [jadwalList, setJadwalList] = useState<any[]>([])
  const [jamSlots, setJamSlots] = useState<any[]>([])
  const [kelasList, setKelasList] = useState<any[]>([])
  const [mapelList, setMapelList] = useState<any[]>([])
  const [guruList, setGuruList] = useState<any[]>([])
  const [pengampuList, setPengampuList] = useState<any[]>([])
  const [allPeriods, setAllPeriods] = useState<any[]>([])

  // Modal Isi/Edit Cell Jadwal
  const [isJadwalModalOpen, setIsJadwalModalOpen] = useState(false)
  const [submittingJadwal, setSubmittingJadwal] = useState(false)
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [jadwalForm, setJadwalForm] = useState({
    hari: 'Senin',
    jamPelajaranId: '',
    kelasId: '',
    mapelId: '',
    guruId: '',
    ruangan: '',
  })

  // Modal Slot Jam Belajar
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<any>(null)
  const [submittingSlot, setSubmittingSlot] = useState(false)
  const [slotForm, setSlotForm] = useState({
    urutan: 1,
    namaSlot: '',
    jamMulai: '07:00',
    jamSelesai: '07:45',
    isIstirahat: false,
  })

  const fetchJadwal = async (ta?: string, sem?: string, kId?: string, gId?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (ta) params.set('tahunAjaran', ta)
      if (sem) params.set('semester', sem)
      if (viewMode === 'kelas' && kId) params.set('kelasId', kId)
      if (viewMode === 'guru' && gId) params.set('guruId', gId)

      const res = await fetch(`/api/akademik/jadwal?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setJadwalList(json.data.jadwalList || [])
        setJamSlots(json.data.jamSlots || [])
        setKelasList(json.data.kelasList || [])
        setMapelList(json.data.mapelList || [])
        setGuruList(json.data.guruList || [])
        setPengampuList(json.data.pengampuList || [])
        setAllPeriods(json.data.allPeriods || [])

        // Default periode aktif pada load pertama
        if (!ta && json.data.tahunAjaran) {
          setTahunAjaran(json.data.tahunAjaran)
        }
        if (!sem && json.data.semester) {
          setSemester(json.data.semester)
        }
        // Auto pilih kelas pertama jika belum ada yang dipilih
        if (!kId && !selectedKelasId && json.data.kelasList?.length > 0) {
          setSelectedKelasId(String(json.data.kelasList[0].id))
        }
        if (!gId && !selectedGuruId && json.data.guruList?.length > 0) {
          setSelectedGuruId(String(json.data.guruList[0].id))
        }
      }
    } catch (err) {
      console.error('Fetch jadwal error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJadwal()
  }, [])

  useEffect(() => {
    if (viewMode !== 'slots') {
      fetchJadwal(tahunAjaran, semester, selectedKelasId, selectedGuruId)
    }
  }, [tahunAjaran, semester, selectedKelasId, selectedGuruId, viewMode])

  // Buka Modal Isi Cell Jadwal
  const openCellModal = (hari: string, slot: any, existingEntry?: any) => {
    if (!allowCreate && !allowEdit) return
    if (slot.isIstirahat) return

    setConflictError(null)
    setJadwalForm({
      hari,
      jamPelajaranId: String(slot.id),
      kelasId: existingEntry ? String(existingEntry.kelasId) : selectedKelasId,
      mapelId: existingEntry ? String(existingEntry.mapelId) : '',
      guruId: existingEntry ? String(existingEntry.guruId) : '',
      ruangan: existingEntry?.ruangan || '',
    })
    setIsJadwalModalOpen(true)
  }

  // Auto-isi guru jika ada pemetaan di GuruMapelKelas saat mapel berubah
  const handleMapelChangeInForm = (newMapelId: string) => {
    const match = pengampuList.find(
      (p) =>
        String(p.kelasId) === jadwalForm.kelasId &&
        String(p.mapelId) === newMapelId
    )
    setJadwalForm((prev) => ({
      ...prev,
      mapelId: newMapelId,
      guruId: match ? String(match.guruId) : prev.guruId,
    }))
  }

  const handleSaveJadwal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingJadwal(true)
    setConflictError(null)
    setFeedback(null)

    try {
      const res = await fetch('/api/akademik/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tahunAjaran,
          semester,
          ...jadwalForm,
        }),
      })
      const json = await res.json()

      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        setIsJadwalModalOpen(false)
        await fetchJadwal(tahunAjaran, semester, selectedKelasId, selectedGuruId)
      } else {
        // Jika bentrok (409) atau validasi gagal, tampilkan alert jelas di dalam modal
        setConflictError(json.message || 'Gagal menyimpan jadwal')
      }
    } catch (err: any) {
      setConflictError('Gagal menyimpan: ' + err.message)
    } finally {
      setSubmittingJadwal(false)
    }
  }

  const handleDeleteJadwal = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Kosongkan jadwal pelajaran pada slot ini?')) return
    setFeedback(null)

    try {
      const res = await fetch(`/api/akademik/jadwal/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        await fetchJadwal(tahunAjaran, semester, selectedKelasId, selectedGuruId)
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menghapus jadwal' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error: ' + err.message })
    }
  }

  // Slot Jam Belajar CRUD
  const openAddSlot = () => {
    setEditingSlot(null)
    setSlotForm({
      urutan: jamSlots.length + 1,
      namaSlot: `Jam ke-${jamSlots.length + 1}`,
      jamMulai: '07:00',
      jamSelesai: '07:45',
      isIstirahat: false,
    })
    setIsSlotModalOpen(true)
  }

  const openEditSlot = (slot: any) => {
    setEditingSlot(slot)
    setSlotForm({
      urutan: slot.urutan,
      namaSlot: slot.namaSlot,
      jamMulai: slot.jamMulai,
      jamSelesai: slot.jamSelesai,
      isIstirahat: Boolean(slot.isIstirahat),
    })
    setIsSlotModalOpen(true)
  }

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingSlot(true)
    setFeedback(null)

    try {
      const url = editingSlot
        ? `/api/akademik/jam-pelajaran/${editingSlot.id}`
        : '/api/akademik/jam-pelajaran'
      const method = editingSlot ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotForm),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        setIsSlotModalOpen(false)
        await fetchJadwal(tahunAjaran, semester, selectedKelasId, selectedGuruId)
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menyimpan slot waktu' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error: ' + err.message })
    } finally {
      setSubmittingSlot(false)
    }
  }

  const handleDeleteSlot = async (slot: any) => {
    if (!confirm(`Hapus slot "${slot.namaSlot}"? Jadwal yang terhubung dengan slot ini juga akan dihapus.`)) {
      return
    }
    try {
      const res = await fetch(`/api/akademik/jam-pelajaran/${slot.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        await fetchJadwal(tahunAjaran, semester, selectedKelasId, selectedGuruId)
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menghapus slot' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error: ' + err.message })
    }
  }

  const distinctYears = Array.from(new Set(allPeriods.map((p) => p.nama)))
  if (distinctYears.length === 0) distinctYears.push(tahunAjaran)

  const activeKelasObj = kelasList.find((k) => String(k.id) === selectedKelasId)
  const activeGuruObj = guruList.find((g) => String(g.id) === selectedGuruId)

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Jadwal Pelajaran Sekolah
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Penyusunan jadwal belajar mingguan dengan deteksi bentrok guru otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Cetak Jadwal</span>
          </button>

          {viewMode === 'slots' && allowCreate && (
            <button
              onClick={openAddSlot}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Slot Jam</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'
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

      {/* Tabs View Mode */}
      <div className="flex flex-wrap items-center gap-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setViewMode('kelas')}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            viewMode === 'kelas'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Jadwal Per Kelas</span>
        </button>

        <button
          onClick={() => setViewMode('guru')}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            viewMode === 'guru'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Jadwal Mengajar Guru</span>
        </button>

        <button
          onClick={() => setViewMode('slots')}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            viewMode === 'slots'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Pengaturan Jam Belajar ({jamSlots.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1 & 2: GRID JADWAL MINGGUAN */}
      {/* ======================================================== */}
      {viewMode !== 'slots' ? (
        <div className="space-y-4">
          {/* Toolbar Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Tahun Ajaran
              </label>
              <SearchableSelect
                value={tahunAjaran}
                onChange={(val) => setTahunAjaran(val)}
                options={distinctYears.map((y) => ({ value: y, label: `T.A ${y}` }))}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                Semester
              </label>
              <SearchableSelect
                value={semester}
                onChange={(val) => setSemester(val)}
                options={[
                  { value: 'Ganjil', label: 'Semester Ganjil' },
                  { value: 'Genap', label: 'Semester Genap' },
                ]}
              />
            </div>

            <div>
              {viewMode === 'kelas' ? (
                <>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Rombel / Kelas
                  </label>
                  <SearchableSelect
                    value={selectedKelasId}
                    onChange={(val) => setSelectedKelasId(val)}
                    options={kelasList.map((k) => ({
                      value: String(k.id),
                      label: `${k.jenjang?.kode} - ${k.namaKelas}`,
                    }))}
                    placeholder="Pilih Kelas..."
                  />
                </>
              ) : (
                <>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Guru Pengajar
                  </label>
                  <SearchableSelect
                    value={selectedGuruId}
                    onChange={(val) => setSelectedGuruId(val)}
                    options={guruList.map((g) => ({
                      value: String(g.id),
                      label: `${g.nama}${g.bidangStudi ? ` (${g.bidangStudi})` : ''}`,
                    }))}
                    placeholder="Pilih Guru..."
                  />
                </>
              )}
            </div>
          </div>

          {/* Info Header Grid */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <div className="font-bold text-slate-700 dark:text-slate-200">
              {viewMode === 'kelas' && activeKelasObj
                ? `Jadwal Kelas ${activeKelasObj.jenjang?.kode} ${activeKelasObj.namaKelas} • TA ${tahunAjaran} (${semester})`
                : viewMode === 'guru' && activeGuruObj
                ? `Jadwal Mengajar: ${activeGuruObj.nama} • TA ${tahunAjaran} (${semester})`
                : 'Memuat jadwal...'}
            </div>
            {viewMode === 'kelas' && allowCreate && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>Klik sel kosong atau jadwal untuk mengisi / mengubah</span>
              </span>
            )}
          </div>

          {/* Grid Timetable */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            {loading ? (
              <div className="p-16 text-center text-xs text-slate-400">
                Memuat matriks jadwal pelajaran...
              </div>
            ) : jamSlots.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">
                Belum ada slot jam pelajaran yang diatur. Klik tab <strong>Pengaturan Jam Belajar</strong> untuk menambahkan slot jam.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-slate-500 w-36 border-r border-slate-200 dark:border-slate-800">
                        Jam / Waktu
                      </th>
                      {HARI_LIST.map((hari) => (
                        <th
                          key={hari}
                          className="p-3.5 text-center font-bold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-200 min-w-[140px] border-r last:border-r-0 border-slate-200 dark:border-slate-800"
                        >
                          {hari}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {jamSlots.map((slot) => {
                      if (slot.isIstirahat) {
                        return (
                          <tr key={slot.id} className="bg-amber-50/60 dark:bg-amber-950/20">
                            <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                              <span className="font-bold text-amber-800 dark:text-amber-300 block">
                                {slot.namaSlot}
                              </span>
                              <span className="text-[10px] font-mono text-amber-600">
                                {slot.jamMulai} – {slot.jamSelesai}
                              </span>
                            </td>
                            <td
                              colSpan={6}
                              className="p-2.5 text-center font-bold text-[11px] uppercase tracking-widest text-amber-700 dark:text-amber-400"
                            >
                              <div className="inline-flex items-center gap-1.5">
                                <Coffee className="h-3.5 w-3.5" />
                                <span>{slot.namaSlot} ({slot.jamMulai} – {slot.jamSelesai})</span>
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      return (
                        <tr key={slot.id}>
                          <td className="p-3 bg-slate-50/40 dark:bg-slate-800/30 border-r border-slate-200 dark:border-slate-800 align-top">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block">
                              {slot.namaSlot}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {slot.jamMulai} – {slot.jamSelesai}
                            </span>
                          </td>

                          {HARI_LIST.map((hari) => {
                            const entry = jadwalList.find(
                              (j) => j.hari === hari && j.jamPelajaranId === slot.id
                            )

                            return (
                              <td
                                key={hari}
                                onClick={() =>
                                  viewMode === 'kelas' && openCellModal(hari, slot, entry)
                                }
                                className={`p-2 border-r last:border-r-0 border-slate-200 dark:border-slate-800 align-top transition-colors ${
                                  viewMode === 'kelas' && allowCreate
                                    ? 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                                    : ''
                                }`}
                              >
                                {entry ? (
                                  <div className="group relative rounded-xl border border-blue-200/80 bg-blue-50/60 p-2.5 dark:border-blue-900/50 dark:bg-blue-950/30">
                                    <div className="font-bold text-slate-900 dark:text-white leading-snug pr-5">
                                      {entry.mapel?.nama}
                                    </div>
                                    <div className="mt-1 text-[11px] text-blue-700 dark:text-blue-300 font-medium truncate">
                                      {viewMode === 'kelas'
                                        ? entry.guru?.nama
                                        : `Kelas: ${entry.kelas?.jenjang?.kode} ${entry.kelas?.namaKelas}`}
                                    </div>
                                    {entry.ruangan && (
                                      <span className="mt-1 inline-block rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:bg-slate-800">
                                        {entry.ruangan}
                                      </span>
                                    )}
                                    {viewMode === 'kelas' && allowDelete && (
                                      <button
                                        onClick={(e) => handleDeleteJadwal(entry.id, e)}
                                        className="opacity-0 group-hover:opacity-100 absolute top-1.5 right-1.5 rounded p-1 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                                        title="Kosongkan Slot Ini"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-14 flex items-center justify-center rounded-xl border border-dashed border-slate-200/80 text-[11px] text-slate-300 dark:border-slate-800 dark:text-slate-700 hover:border-blue-300 hover:text-blue-500 transition">
                                    {viewMode === 'kelas' && allowCreate ? '+ Tambah' : '-'}
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* TAB 3: PENGATURAN SLOT JAM BELAJAR */
        /* ======================================================== */
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Struktur Jam Belajar Harian Sekolah
            </h3>
            <p className="text-xs text-slate-500">
              Atur urutan jam pelajaran dan waktu istirahat yang berlaku sebagai baris pada matriks jadwal.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3.5 text-center w-20">Urutan</th>
                  <th className="px-4 py-3.5">Nama Slot</th>
                  <th className="px-4 py-3.5">Jam Mulai</th>
                  <th className="px-4 py-3.5">Jam Selesai</th>
                  <th className="px-4 py-3.5">Tipe</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jamSlots.map((slot) => (
                  <tr
                    key={slot.id}
                    className={
                      slot.isIstirahat
                        ? 'bg-amber-50/40 dark:bg-amber-950/15'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }
                  >
                    <td className="px-6 py-3 text-center font-mono font-bold">{slot.urutan}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {slot.namaSlot}
                    </td>
                    <td className="px-4 py-3 font-mono">{slot.jamMulai}</td>
                    <td className="px-4 py-3 font-mono">{slot.jamSelesai}</td>
                    <td className="px-4 py-3">
                      {slot.isIstirahat ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                          <Coffee className="h-3 w-3" />
                          Istirahat
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                          <BookOpen className="h-3 w-3" />
                          Jam Belajar
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {allowEdit && (
                          <button
                            onClick={() => openEditSlot(slot)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-amber-600 dark:border-slate-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {allowDelete && (
                          <button
                            onClick={() => handleDeleteSlot(slot)}
                            className="rounded-lg border border-red-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-red-900/40"
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

      {/* MODAL ISI / EDIT JADWAL CELL */}
      {isJadwalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Atur Jadwal Pelajaran
                </h3>
                <p className="text-xs text-slate-500">
                  Hari <strong>{jadwalForm.hari}</strong> •{' '}
                  {jamSlots.find((s) => String(s.id) === jadwalForm.jamPelajaranId)?.namaSlot} (
                  {jamSlots.find((s) => String(s.id) === jadwalForm.jamPelajaranId)?.jamMulai}–
                  {jamSlots.find((s) => String(s.id) === jadwalForm.jamPelajaranId)?.jamSelesai})
                </p>
              </div>
              <button
                onClick={() => setIsJadwalModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {conflictError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300">
                <ShieldAlert className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block mb-0.5">Peringatan Bentrok Jadwal!</strong>
                  <span>{conflictError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveJadwal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran *
                </label>
                <SearchableSelect
                  value={jadwalForm.mapelId}
                  onChange={handleMapelChangeInForm}
                  options={mapelList.map((m) => ({
                    value: String(m.id),
                    label: `${m.nama} (${m.kode})`,
                  }))}
                  placeholder="Pilih Mata Pelajaran..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Guru Pengajar *
                </label>
                <SearchableSelect
                  value={jadwalForm.guruId}
                  onChange={(val) => setJadwalForm({ ...jadwalForm, guruId: val })}
                  options={guruList.map((g) => ({
                    value: String(g.id),
                    label: `${g.nama}${g.bidangStudi ? ` (${g.bidangStudi})` : ''}`,
                  }))}
                  placeholder="Pilih Guru..."
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Otomatis terisi jika guru pengampu telah dipetakan di menu Mata Pelajaran.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ruangan / Lab (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ruang Kelas VII-A atau Lab Komputer"
                  value={jadwalForm.ruangan}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, ruangan: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsJadwalModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingJadwal}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingJadwal ? 'Memeriksa & Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT SLOT JAM BELAJAR */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSlot ? 'Edit Slot Jam Belajar' : 'Tambah Slot Jam Belajar'}
              </h3>
              <button
                onClick={() => setIsSlotModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Urutan *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={slotForm.urutan}
                    onChange={(e) => setSlotForm({ ...slotForm, urutan: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Slot *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jam ke-1 atau Istirahat 1"
                    value={slotForm.namaSlot}
                    onChange={(e) => setSlotForm({ ...slotForm, namaSlot: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Mulai *
                  </label>
                  <input
                    type="time"
                    required
                    value={slotForm.jamMulai}
                    onChange={(e) => setSlotForm({ ...slotForm, jamMulai: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Selesai *
                  </label>
                  <input
                    type="time"
                    required
                    value={slotForm.jamSelesai}
                    onChange={(e) => setSlotForm({ ...slotForm, jamSelesai: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 cursor-pointer dark:border-slate-800 dark:bg-slate-800/40">
                <input
                  type="checkbox"
                  checked={slotForm.isIstirahat}
                  onChange={(e) => setSlotForm({ ...slotForm, isIstirahat: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Tandai sebagai Waktu Istirahat (tidak diisi mapel)
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingSlot}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingSlot ? 'Menyimpan...' : 'Simpan Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

