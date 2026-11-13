'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  GraduationCap,
  ArrowRight,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  History,
  ArrowLeftRight,
  CheckSquare,
  Square,
  Sparkles,
  X,
  Plus,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

export default function KenaikanKelasPage() {
  const { canCreate } = usePermission()
  const allowCreate = canCreate('/akademik/kenaikan-kelas')

  const [activeTab, setActiveTab] = useState<'proses' | 'riwayat'>('proses')
  const [mode, setMode] = useState<'naik_kelas' | 'pindah_kelas' | 'lulus'>('naik_kelas')

  const [loading, setLoading] = useState(true)
  const [loadingSiswa, setLoadingSiswa] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [kelasList, setKelasList] = useState<any[]>([])
  const [siswaList, setSiswaList] = useState<any[]>([])
  const [riwayatList, setRiwayatList] = useState<any[]>([])
  const [activePeriod, setActivePeriod] = useState<any>(null)

  const [kelasAsalId, setKelasAsalId] = useState('')
  const [kelasTujuanId, setKelasTujuanId] = useState('')
  const [tahunKeluar, setTahunKeluar] = useState(String(new Date().getFullYear()))
  const [catatan, setCatatan] = useState('')
  const [searchSiswa, setSearchSiswa] = useState('')
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<number[]>([])

  const [historySearch, setHistorySearch] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Muat daftar kelas & riwayat
  const fetchInitialData = async (asalId?: string, hSearch?: string) => {
    try {
      const params = new URLSearchParams()
      if (asalId) params.set('kelasAsalId', asalId)
      if (hSearch) params.set('search', hSearch)

      const res = await fetch(`/api/akademik/kenaikan-kelas?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setKelasList(json.data.kelasList || [])
        setRiwayatList(json.data.riwayatList || [])
        setActivePeriod(json.data.activePeriod || null)
        if (asalId) {
          const students = json.data.siswaList || []
          setSiswaList(students)
          // Otomatis centang semua siswa aktif agar praktis
          setSelectedSiswaIds(students.map((s: any) => s.id))
        }
      }
    } catch (err) {
      console.error('Fetch kenaikan kelas error:', err)
    } finally {
      setLoading(false)
      setLoadingSiswa(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Ketika Kelas Asal berubah, muat siswa kelas asal
  const handleKelasAsalChange = (newId: string) => {
    setKelasAsalId(newId)
    if (kelasTujuanId === newId) {
      setKelasTujuanId('')
    }
    if (!newId) {
      setSiswaList([])
      setSelectedSiswaIds([])
      return
    }
    setLoadingSiswa(true)
    fetchInitialData(newId, historySearch)
  }

  // Filter siswa checklist lokal
  const filteredSiswa = siswaList.filter((s) => {
    const q = searchSiswa.toLowerCase().trim()
    if (!q) return true
    return s.nama.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q)
  })

  const toggleSelectSiswa = (id: number) => {
    if (selectedSiswaIds.includes(id)) {
      setSelectedSiswaIds(selectedSiswaIds.filter((item) => item !== id))
    } else {
      setSelectedSiswaIds([...selectedSiswaIds, id])
    }
  }

  const toggleSelectAll = () => {
    const visibleIds = filteredSiswa.map((s) => s.id)
    const allSelected = visibleIds.every((id) => selectedSiswaIds.includes(id))
    if (allSelected) {
      setSelectedSiswaIds(selectedSiswaIds.filter((id) => !visibleIds.includes(id)))
    } else {
      const merged = Array.from(new Set([...selectedSiswaIds, ...visibleIds]))
      setSelectedSiswaIds(merged)
    }
  }

  const handleSubmitProcess = async () => {
    if (selectedSiswaIds.length === 0) {
      setFeedback({ type: 'error', text: 'Pilih minimal 1 siswa untuk diproses.' })
      return
    }

    if ((mode === 'naik_kelas' || mode === 'pindah_kelas') && !kelasTujuanId) {
      setFeedback({ type: 'error', text: 'Pilih Kelas Tujuan terlebih dahulu.' })
      return
    }

    const kelasAsalObj = kelasList.find((k) => String(k.id) === kelasAsalId)
    const kelasTujuanObj = kelasList.find((k) => String(k.id) === kelasTujuanId)

    const confirmMsg =
      mode === 'lulus'
        ? `Yakin meluluskan ${selectedSiswaIds.length} siswa terpilih dari kelas ${kelasAsalObj?.namaKelas || '-'} menjadi ALUMNI (${tahunKeluar})?`
        : `Yakin memindahkan ${selectedSiswaIds.length} siswa terpilih dari ${kelasAsalObj?.namaKelas || '-'} ke kelas ${kelasTujuanObj?.namaKelas || '-'}?`

    if (!confirm(confirmMsg)) return

    setSubmitting(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/akademik/kenaikan-kelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          siswaIds: selectedSiswaIds,
          kelasAsalId: kelasAsalId ? Number(kelasAsalId) : null,
          kelasTujuanId: kelasTujuanId ? Number(kelasTujuanId) : null,
          tahunKeluar: Number(tahunKeluar),
          tahunAjaranTujuan: kelasTujuanObj?.tahunAjaran || activePeriod?.nama,
          catatan,
        }),
      })
      const json = await res.json()

      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        setCatatan('')
        setLoadingSiswa(true)
        await fetchInitialData(kelasAsalId, historySearch)
      } else {
        setFeedback({ type: 'error', text: json.message || 'Proses gagal dijalankan' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Gagal memproses: ' + err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const kelasAsalObj = kelasList.find((k) => String(k.id) === kelasAsalId)
  const kelasTujuanObj = kelasList.find((k) => String(k.id) === kelasTujuanId)

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kenaikan Kelas & Kelulusan Massal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Transisi rombongan belajar antar tahun ajaran dan kelulusan alumni secara massal beserta pencatatan riwayat.
          </p>
        </div>

        {activePeriod && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300 self-start">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Periode Aktif: {activePeriod.nama} ({activePeriod.semester})</span>
          </div>
        )}
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
          onClick={() => setActiveTab('proses')}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === 'proses'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Proses Kenaikan & Kelulusan</span>
        </button>

        <button
          onClick={() => setActiveTab('riwayat')}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === 'riwayat'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Log Riwayat Transisi ({riwayatList.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PROSES KENAIKAN & KELULUSAN */}
      {/* ======================================================== */}
      {activeTab === 'proses' ? (
        <div className="space-y-6">
          {/* Mode Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setMode('naik_kelas')}
              className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition ${
                mode === 'naik_kelas'
                  ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 dark:bg-blue-950/30 dark:border-blue-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  mode === 'naik_kelas'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Kenaikan Kelas</p>
                <p className="text-[11px] text-slate-500">Naikkan siswa ke tingkat selanjutnya</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('pindah_kelas')}
              className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition ${
                mode === 'pindah_kelas'
                  ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  mode === 'pindah_kelas'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <ArrowLeftRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Pindah Rombel / Kelas</p>
                <p className="text-[11px] text-slate-500">Mutasi kelas pada tingkat yang sama</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('lulus')}
              className={`flex items-center gap-3.5 rounded-2xl border p-4 text-left transition ${
                mode === 'lulus'
                  ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-500'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  mode === 'lulus'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Kelulusan (Alumni)</p>
                <p className="text-[11px] text-slate-500">Luluskan siswa tingkat akhir ke alumni</p>
              </div>
            </button>
          </div>

          {/* Dual Panel Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* PANEL KIRI: KELAS ASAL & CHECKLIST SISWA (7 Cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    1. Pilih Kelas Asal & Siswa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Centang siswa yang akan dipindahkan atau diluluskan (siswa tidak dicentang tetap di kelas asal).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kelas Asal
                </label>
                <SearchableSelect
                  value={kelasAsalId}
                  onChange={handleKelasAsalChange}
                  options={kelasList.map((k) => ({
                    value: String(k.id),
                    label: `${k.jenjang?.kode} - ${k.namaKelas} (${k._count?.siswa || 0} siswa aktif) • TA ${k.tahunAjaran}`,
                  }))}
                  placeholder="-- Pilih Kelas Asal --"
                  searchPlaceholder="Cari nama kelas atau jenjang..."
                />
              </div>

              {kelasAsalId ? (
                <div className="space-y-3 pt-2">
                  {/* Checklist Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter nama atau NIS siswa..."
                        value={searchSiswa}
                        onChange={(e) => setSearchSiswa(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {filteredSiswa.length > 0 &&
                      filteredSiswa.every((s) => selectedSiswaIds.includes(s.id)) ? (
                        <>
                          <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                          <span>Batalkan Semua</span>
                        </>
                      ) : (
                        <>
                          <Square className="h-3.5 w-3.5 text-slate-400" />
                          <span>Pilih Semua ({filteredSiswa.length})</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Student List */}
                  {loadingSiswa ? (
                    <div className="py-10 text-center text-xs text-slate-400">
                      Memuat daftar siswa di kelas ini...
                    </div>
                  ) : filteredSiswa.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-xs text-slate-500 dark:border-slate-800">
                      Tidak ada siswa aktif di kelas ini.
                    </div>
                  ) : (
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 dark:divide-slate-800">
                      {filteredSiswa.map((s) => {
                        const isChecked = selectedSiswaIds.includes(s.id)
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleSelectSiswa(s.id)}
                            className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-blue-50/60 dark:bg-blue-950/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300 overflow-hidden">
                                {s.fotoUrl ? (
                                  <img
                                    src={s.fotoUrl}
                                    alt={s.nama}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  s.nama.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {s.nama}
                                </p>
                                <p className="text-[11px] text-slate-500 font-mono">
                                  NIS: {s.nis} • {s.jenisKelamin === 'L' ? 'L' : 'P'}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isChecked
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                              }`}
                            >
                              {isChecked ? 'Dipilih' : 'Tetap'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 py-14 text-center dark:border-slate-800">
                  <Users className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs font-medium text-slate-500">
                    Pilih <strong>Kelas Asal</strong> di atas untuk memuat daftar siswa.
                  </p>
                </div>
              )}
            </div>

            {/* PANEL KANAN: TUJUAN & EKSEKUSI (5 Cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
              <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Tujuan & Konfirmasi Proses
                </h3>
                <p className="text-xs text-slate-500">
                  Tentukan kelas tujuan atau tahun kelulusan untuk {selectedSiswaIds.length} siswa terpilih.
                </p>
              </div>

              {mode === 'lulus' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tahun Lulus / Angkatan Alumni *
                    </label>
                    <input
                      type="number"
                      value={tahunKeluar}
                      onChange={(e) => setTahunKeluar(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold font-mono focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300">
                    <strong>Info Kelulusan:</strong> Status siswa terpilih akan diubah menjadi{' '}
                    <strong>Alumni</strong>, tahun lulus dicatat, dan slot kelas asal dibebaskan untuk angkatan berikutnya.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kelas Tujuan *
                    </label>
                    <Link
                      href="/kelas"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Kelola Kelas</span>
                    </Link>
                  </div>
                  <SearchableSelect
                    value={kelasTujuanId}
                    onChange={(val) => setKelasTujuanId(val)}
                    options={kelasList
                      .filter((k) => String(k.id) !== kelasAsalId)
                      .map((k) => ({
                        value: String(k.id),
                        label: `${k.jenjang?.kode} - ${k.namaKelas} (${k._count?.siswa || 0}/${k.kapasitas} terisi) • TA ${k.tahunAjaran}`,
                      }))}
                    placeholder="-- Pilih Kelas Tujuan --"
                    searchPlaceholder="Cari kelas tujuan..."
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    mode === 'lulus'
                      ? 'Contoh: Lulus Ujian Akhir Tahun Ajaran 2024/2025'
                      : 'Contoh: Kenaikan kelas reguler ke tingkat selanjutnya'
                  }
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* Ringkasan Eksekusi */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs dark:bg-slate-800/40 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Siswa Dipilih</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedSiswaIds.length} Siswa
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Asal</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {kelasAsalObj ? `${kelasAsalObj.jenjang?.kode} - ${kelasAsalObj.namaKelas}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tujuan</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {mode === 'lulus'
                      ? `Status ALUMNI (${tahunKeluar})`
                      : kelasTujuanObj
                      ? `${kelasTujuanObj.jenjang?.kode} - ${kelasTujuanObj.namaKelas}`
                      : '-'}
                  </span>
                </div>
              </div>

              {allowCreate ? (
                <button
                  type="button"
                  onClick={handleSubmitProcess}
                  disabled={submitting || selectedSiswaIds.length === 0}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50 ${
                    mode === 'lulus'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {submitting
                      ? 'Memproses Data...'
                      : mode === 'lulus'
                      ? `Proses Kelulusan ${selectedSiswaIds.length} Siswa`
                      : `Proses Pindahkan ${selectedSiswaIds.length} Siswa`}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                  Mode Lihat Saja: Peran Anda tidak memiliki izin untuk memproses kenaikan kelas.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* TAB 2: LOG RIWAYAT TRANSISI */
        /* ======================================================== */
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Riwayat Kenaikan Kelas, Pindah Rombel & Kelulusan
              </h3>
              <p className="text-xs text-slate-500">
                Jejak audit lengkap perpindahan kelas dan kelulusan siswa.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama / NIS siswa..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value)
                  fetchInitialData(kelasAsalId, e.target.value)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          {riwayatList.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Belum ada riwayat kenaikan kelas atau kelulusan yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5">Siswa</th>
                    <th className="px-4 py-3.5">Jenis Proses</th>
                    <th className="px-4 py-3.5">Transisi Kelas</th>
                    <th className="px-4 py-3.5">Petugas</th>
                    <th className="px-6 py-3.5">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {riwayatList.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono">
                        {new Date(r.tanggalProses).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/siswa/${r.siswa?.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 dark:text-white"
                        >
                          {r.siswa?.nama}
                        </Link>
                        <span className="block text-[11px] text-slate-400 font-mono">
                          NIS: {r.siswa?.nis}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            r.jenisAksi === 'lulus'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : r.jenisAksi === 'naik_kelas'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300'
                          }`}
                        >
                          {r.jenisAksi === 'lulus'
                            ? 'Lulus / Alumni'
                            : r.jenisAksi === 'naik_kelas'
                            ? 'Naik Kelas'
                            : 'Pindah Kelas'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="text-slate-600 dark:text-slate-300">
                            {r.kelasAsal
                              ? `${r.kelasAsal.jenjang?.kode} ${r.kelasAsal.namaKelas}`
                              : '-'}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {r.jenisAksi === 'lulus'
                              ? 'ALUMNI'
                              : r.kelasTujuan
                              ? `${r.kelasTujuan.jenjang?.kode} ${r.kelasTujuan.namaKelas}`
                              : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        {r.diprosesOleh || '-'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate" title={r.catatan || ''}>
                        {r.catatan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

