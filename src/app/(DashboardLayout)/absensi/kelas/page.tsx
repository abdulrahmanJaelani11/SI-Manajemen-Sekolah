'use client'

import React, { useEffect, useState } from 'react'
import {
  UserCheck,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  BarChart3,
  RefreshCw,
  Award,
  Sparkles,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

const STATUS_OPTIONS = [
  { value: 'hadir', label: 'Hadir', short: 'H', activeCls: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'terlambat', label: 'Telat', short: 'T', activeCls: 'bg-amber-500 text-white border-amber-500' },
  { value: 'sakit', label: 'Sakit', short: 'S', activeCls: 'bg-blue-600 text-white border-blue-600' },
  { value: 'izin', label: 'Izin', short: 'I', activeCls: 'bg-indigo-600 text-white border-indigo-600' },
  { value: 'alpa', label: 'Alpa', short: 'A', activeCls: 'bg-rose-600 text-white border-rose-600' },
]

export default function AbsensiKelasPage() {
  const { canCreate, canEdit } = usePermission()
  const allowCreate = canCreate('/absensi/kelas')
  const allowEdit = canEdit('/absensi/kelas')

  const [activeTab, setActiveTab] = useState<'harian' | 'rekap'>('harian')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncingRapor, setSyncingRapor] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [tanggal, setTanggal] = useState('')
  const [bulan, setBulan] = useState('')
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [kelasList, setKelasList] = useState<any[]>([])
  const [activePeriod, setActivePeriod] = useState<any>(null)

  const [rows, setRows] = useState<any[]>([])
  const [rekapRows, setRekapRows] = useState<any[]>([])

  const fetchData = async (mode = activeTab, kId = selectedKelasId, tgl = tanggal, bln = bulan) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('mode', mode)
      if (kId) params.set('kelasId', kId)
      if (tgl) params.set('tanggal', tgl)
      if (bln) params.set('bulan', bln)

      const res = await fetch(`/api/absensi/kelas?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setKelasList(json.data.kelasList || [])
        setActivePeriod(json.data.activePeriod || null)
        if (!tgl && json.data.tanggal) setTanggal(json.data.tanggal)
        if (!bln && json.data.bulan) setBulan(json.data.bulan)

        if (!kId && !selectedKelasId && json.data.kelasList?.length > 0) {
          setSelectedKelasId(String(json.data.kelasList[0].id))
        }

        if (mode === 'harian') {
          setRows(json.data.rows || [])
        } else {
          setRekapRows(json.data.rekapRows || [])
        }
      }
    } catch (err) {
      console.error('Fetch absensi kelas error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData('harian')
  }, [])

  useEffect(() => {
    if (selectedKelasId) {
      fetchData(activeTab, selectedKelasId, tanggal, bulan)
    }
  }, [activeTab, selectedKelasId, tanggal, bulan])

  const handleRowChange = (siswaId: number, field: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.siswaId === siswaId ? { ...r, [field]: value } : r))
    )
  }

  const handleMarkAllHadir = () => {
    setRows((prev) =>
      prev.map((r) =>
        !r.status ? { ...r, status: 'hadir', jamMasuk: r.jamMasuk || '07:00' } : r
      )
    )
  }

  const handleSave = async () => {
    if (!selectedKelasId || rows.length === 0) return
    setSaving(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/absensi/kelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tanggal,
          kelasId: Number(selectedKelasId),
          entries: rows.map((r) => ({
            siswaId: r.siswaId,
            status: r.status || 'hadir',
            jamMasuk: r.jamMasuk,
            jamPulang: r.jamPulang,
            keterangan: r.keterangan,
          })),
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        await fetchData('harian', selectedKelasId, tanggal, bulan)
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menyimpan absensi' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleSyncToRapor = async () => {
    if (!selectedKelasId) return
    if (
      !confirm(
        `Sinkronkan total Sakit, Izin, dan Alpa untuk kelas ini ke data E-Rapor (${activePeriod?.nama || '2024/2025'} ${activePeriod?.semester || 'Ganjil'})?`
      )
    ) {
      return
    }

    setSyncingRapor(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/absensi/kelas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelasId: Number(selectedKelasId),
          tahunAjaran: activePeriod?.nama,
          semester: activePeriod?.semester,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menyinkronkan ke E-Rapor' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error: ' + err.message })
    } finally {
      setSyncingRapor(false)
    }
  }

  return (
    <div className="space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Absensi Harian & Rekap Kelas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pencatatan Sakit/Izin/Alpa siswa di kelas, sinkronisasi otomatis hasil scan gerbang, & rekap bulanan.
          </p>
        </div>

        {activeTab === 'rekap' && allowEdit && selectedKelasId && (
          <button
            onClick={handleSyncToRapor}
            disabled={syncingRapor}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition self-start"
          >
            <Award className="h-4 w-4" />
            <span>{syncingRapor ? 'Menyinkronkan...' : 'Sinkronkan Absensi ke E-Rapor'}</span>
          </button>
        )}
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

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('harian')}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === 'harian'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Input Absensi Harian</span>
        </button>

        <button
          onClick={() => setActiveTab('rekap')}
          className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
            activeTab === 'rekap'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Rekapitulasi Bulanan</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            {activeTab === 'harian' ? 'Tanggal Absensi' : 'Pilih Bulan'}
          </label>
          {activeTab === 'harian' ? (
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          ) : (
            <input
              type="month"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Rombel / Kelas *
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
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ABSENSI HARIAN */}
      {/* ======================================================== */}
      {activeTab === 'harian' ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          {rows.length > 0 && allowCreate && (
            <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-200 dark:bg-slate-800/40 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                Siswa yang sudah scan QR gerbang otomatis terisi jam masuknya.
              </span>
              <button
                type="button"
                onClick={handleMarkAllHadir}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Tandai Sisanya Hadir</span>
              </button>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Memuat daftar siswa...</div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Tidak ada siswa aktif di kelas ini.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5 text-center w-12">No</th>
                      <th className="px-4 py-3.5 min-w-[180px]">Peserta Didik</th>
                      <th className="px-4 py-3.5 min-w-[290px]">Status Kehadiran</th>
                      <th className="px-3 py-3.5 text-center w-28">Jam Masuk</th>
                      <th className="px-4 py-3.5 min-w-[180px]">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((r, idx) => (
                      <tr key={r.siswaId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {r.nama}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            NIS: {r.nis}
                            {r.metode === 'qr_scan' && (
                              <span className="ml-1.5 rounded bg-blue-50 px-1.5 py-0.5 font-sans font-bold text-blue-600">
                                QR Gerbang
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {STATUS_OPTIONS.map((opt) => {
                              const isSelected = r.status === opt.value
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  disabled={!allowCreate}
                                  onClick={() => handleRowChange(r.siswaId, 'status', opt.value)}
                                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                                    isSelected
                                      ? opt.activeCls
                                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="time"
                            disabled={!allowCreate}
                            value={r.jamMasuk}
                            onChange={(e) => handleRowChange(r.siswaId, 'jamMasuk', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            disabled={!allowCreate}
                            placeholder="Catatan (opsional)..."
                            value={r.keterangan}
                            onChange={(e) => handleRowChange(r.siswaId, 'keterangan', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end bg-slate-50 px-6 py-4 border-t border-slate-200 dark:bg-slate-800/40 dark:border-slate-800">
                {allowCreate ? (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Menyimpan...' : 'Simpan Absensi Kelas'}</span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-amber-700">
                    Mode Lihat Saja
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* TAB 2: REKAPITULASI BULANAN */
        /* ======================================================== */
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Memuat rekapitulasi...</div>
          ) : rekapRows.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Belum ada data siswa di kelas ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">No</th>
                    <th className="px-4 py-3.5">Peserta Didik</th>
                    <th className="px-3 py-3.5 text-center text-emerald-600">Hadir</th>
                    <th className="px-3 py-3.5 text-center text-amber-600">Terlambat</th>
                    <th className="px-3 py-3.5 text-center text-blue-600">Sakit</th>
                    <th className="px-3 py-3.5 text-center text-indigo-600">Izin</th>
                    <th className="px-3 py-3.5 text-center text-rose-600">Alpa</th>
                    <th className="px-4 py-3.5 text-center">Total Hari Tercatat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rekapRows.map((r, idx) => (
                    <tr key={r.siswaId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {r.nama}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">NIS: {r.nis}</span>
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-emerald-600">
                        {r.hadir}
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-amber-600">
                        {r.terlambat}
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-blue-600">
                        {r.sakit}
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-indigo-600">
                        {r.izin}
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-rose-600">
                        {r.alpa}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                        {r.total} hari
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

