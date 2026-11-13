'use client'

import React, { useEffect, useState } from 'react'
import {
  FileCheck,
  Sliders,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'
import { calculateNilaiAkhir, getPredikat } from '@/lib/akademik/grade-utils'

export default function InputNilaiPage() {
  const { canCreate, canEdit } = usePermission()
  const allowCreate = canCreate('/akademik/nilai')
  const allowEdit = canEdit('/akademik/nilai')

  const [loading, setLoading] = useState(true)
  const [loadingRows, setLoadingRows] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025')
  const [semester, setSemester] = useState('Ganjil')
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [selectedMapelId, setSelectedMapelId] = useState('')

  // Master Data
  const [kelasList, setKelasList] = useState<any[]>([])
  const [mapelList, setMapelList] = useState<any[]>([])
  const [allPeriods, setAllPeriods] = useState<any[]>([])
  const [selectedMapel, setSelectedMapel] = useState<any>(null)
  const [pengampuInfo, setPengampuInfo] = useState<any>(null)

  // Bobot
  const [bobot, setBobot] = useState({ bobotTugas: 40, bobotPts: 25, bobotPas: 35 })
  const [isBobotModalOpen, setIsBobotModalOpen] = useState(false)
  const [bobotForm, setBobotForm] = useState({ bobotTugas: 40, bobotPts: 25, bobotPas: 35 })
  const [savingBobot, setSavingBobot] = useState(false)

  // Student Grade Rows
  const [rows, setRows] = useState<any[]>([])

  const fetchNilaiData = async (ta?: string, sem?: string, kId?: string, mId?: string) => {
    if (kId && mId) setLoadingRows(true)
    try {
      const params = new URLSearchParams()
      if (ta) params.set('tahunAjaran', ta)
      if (sem) params.set('semester', sem)
      if (kId) params.set('kelasId', kId)
      if (mId) params.set('mapelId', mId)

      const res = await fetch(`/api/akademik/nilai?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setKelasList(json.data.kelasList || [])
        setMapelList(json.data.mapelList || [])
        setAllPeriods(json.data.allPeriods || [])
        setBobot(json.data.bobot || { bobotTugas: 40, bobotPts: 25, bobotPas: 35 })
        setSelectedMapel(json.data.selectedMapel || null)
        setPengampuInfo(json.data.pengampuInfo || null)
        setRows(json.data.siswaRows || [])

        if (!ta && json.data.tahunAjaran) setTahunAjaran(json.data.tahunAjaran)
        if (!sem && json.data.semester) setSemester(json.data.semester)
        if (!kId && !selectedKelasId && json.data.kelasList?.length > 0) {
          setSelectedKelasId(String(json.data.kelasList[0].id))
        }
        if (!mId && !selectedMapelId && json.data.mapelList?.length > 0) {
          setSelectedMapelId(String(json.data.mapelList[0].id))
        }
      }
    } catch (err) {
      console.error('Fetch nilai error:', err)
    } finally {
      setLoading(false)
      setLoadingRows(false)
    }
  }

  useEffect(() => {
    fetchNilaiData()
  }, [])

  useEffect(() => {
    if (selectedKelasId && selectedMapelId) {
      fetchNilaiData(tahunAjaran, semester, selectedKelasId, selectedMapelId)
    }
  }, [tahunAjaran, semester, selectedKelasId, selectedMapelId])

  const handleCellChange = (
    siswaId: number,
    field: 'nilaiTugas' | 'nilaiPts' | 'nilaiPas' | 'deskripsi',
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.siswaId !== siswaId) return row

        if (field === 'deskripsi') {
          return { ...row, deskripsi: value }
        }

        const num = Math.min(100, Math.max(0, Number(value) || 0))
        const updated = { ...row, [field]: num }
        const nilaiAkhir = calculateNilaiAkhir(
          updated.nilaiTugas,
          updated.nilaiPts,
          updated.nilaiPas,
          bobot
        )
        const predikat = getPredikat(nilaiAkhir, selectedMapel?.kkm || 75)
        return { ...updated, nilaiAkhir, predikat }
      })
    )
  }

  const handleSaveGrades = async () => {
    if (!selectedKelasId || !selectedMapelId || rows.length === 0) return

    setSaving(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/akademik/nilai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelasId: Number(selectedKelasId),
          mapelId: Number(selectedMapelId),
          guruId: pengampuInfo?.guruId || null,
          tahunAjaran,
          semester,
          entries: rows.map((r) => ({
            siswaId: r.siswaId,
            nilaiTugas: r.nilaiTugas,
            nilaiPts: r.nilaiPts,
            nilaiPas: r.nilaiPas,
            deskripsi: r.deskripsi,
          })),
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        await fetchNilaiData(tahunAjaran, semester, selectedKelasId, selectedMapelId)
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menyimpan nilai' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Gagal menyimpan: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBobot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bobotForm.bobotTugas + bobotForm.bobotPts + bobotForm.bobotPas !== 100) {
      alert('Total bobot (Tugas + PTS + PAS) harus tepat 100%')
      return
    }

    setSavingBobot(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/akademik/bobot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tahunAjaran,
          semester,
          ...bobotForm,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        setIsBobotModalOpen(false)
        await fetchNilaiData(tahunAjaran, semester, selectedKelasId, selectedMapelId)
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menyimpan bobot' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error: ' + err.message })
    } finally {
      setSavingBobot(false)
    }
  }

  const distinctYears = Array.from(new Set(allPeriods.map((p) => p.nama)))
  if (distinctYears.length === 0) distinctYears.push(tahunAjaran)

  const kkm = selectedMapel?.kkm || 75
  const totalTuntas = rows.filter((r) => r.nilaiAkhir >= kkm).length

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Input Nilai Siswa
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pengisian nilai Tugas, PTS, dan PAS per mata pelajaran. Nilai akhir & predikat dihitung otomatis sesuai bobot.
          </p>
        </div>

        {allowEdit && (
          <button
            onClick={() => {
              setBobotForm({
                bobotTugas: bobot.bobotTugas,
                bobotPts: bobot.bobotPts,
                bobotPas: bobot.bobotPas,
              })
              setIsBobotModalOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 self-start"
          >
            <Sliders className="h-4 w-4 text-blue-600" />
            <span>
              Atur Bobot ({bobot.bobotTugas}% / {bobot.bobotPts}% / {bobot.bobotPas}%)
            </span>
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

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
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

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Mata Pelajaran *
          </label>
          <SearchableSelect
            value={selectedMapelId}
            onChange={(val) => setSelectedMapelId(val)}
            options={mapelList.map((m) => ({
              value: String(m.id),
              label: `${m.nama} (${m.kode})`,
            }))}
            placeholder="Pilih Mata Pelajaran..."
          />
        </div>
      </div>

      {/* Info Context Bar */}
      {selectedMapel && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200/80 bg-blue-50/50 px-5 py-3.5 text-xs dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>{selectedMapel.nama}</span>
            </div>
            <span className="rounded-full bg-white px-2.5 py-0.5 font-mono font-bold text-emerald-700 border border-emerald-200 dark:bg-slate-800 dark:text-emerald-300">
              KKM: {kkm}
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              Pengampu:{' '}
              <strong>{pengampuInfo?.guru?.nama || 'Belum dipetakan di Master Mapel'}</strong>
            </span>
          </div>

          <div className="text-slate-600 dark:text-slate-300 font-medium">
            Ketuntasan Kelas: <strong>{totalTuntas} / {rows.length} Siswa Tuntas</strong>
          </div>
        </div>
      )}

      {/* Tabel Input Nilai */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading || loadingRows ? (
          <div className="p-14 text-center text-xs text-slate-400">
            Memuat daftar siswa dan nilai...
          </div>
        ) : !selectedKelasId || !selectedMapelId ? (
          <div className="p-14 text-center text-sm text-slate-500">
            Pilih <strong>Kelas</strong> dan <strong>Mata Pelajaran</strong> untuk mulai mengisi nilai.
          </div>
        ) : rows.length === 0 ? (
          <div className="p-14 text-center text-sm text-slate-500">
            Tidak ada siswa aktif di kelas ini.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5 text-center w-12">No</th>
                    <th className="px-4 py-3.5 min-w-[200px]">Peserta Didik</th>
                    <th className="px-3 py-3.5 text-center w-28">
                      Tugas ({bobot.bobotTugas}%)
                    </th>
                    <th className="px-3 py-3.5 text-center w-28">
                      PTS ({bobot.bobotPts}%)
                    </th>
                    <th className="px-3 py-3.5 text-center w-28">
                      PAS ({bobot.bobotPas}%)
                    </th>
                    <th className="px-3 py-3.5 text-center w-24">Akhir</th>
                    <th className="px-3 py-3.5 text-center w-28">Predikat</th>
                    <th className="px-4 py-3.5 min-w-[220px]">Deskripsi Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.map((r, idx) => {
                    const isTuntas = r.nilaiAkhir >= kkm
                    return (
                      <tr key={r.siswaId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {r.nama}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">NIS: {r.nis}</span>
                        </td>
                        <td className="px-2 py-2.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.5"
                            disabled={!allowCreate}
                            value={r.nilaiTugas}
                            onChange={(e) => handleCellChange(r.siswaId, 'nilaiTugas', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center font-mono font-bold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                          />
                        </td>
                        <td className="px-2 py-2.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.5"
                            disabled={!allowCreate}
                            value={r.nilaiPts}
                            onChange={(e) => handleCellChange(r.siswaId, 'nilaiPts', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center font-mono font-bold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                          />
                        </td>
                        <td className="px-2 py-2.5">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.5"
                            disabled={!allowCreate}
                            value={r.nilaiPas}
                            onChange={(e) => handleCellChange(r.siswaId, 'nilaiPas', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center font-mono font-bold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`font-mono text-sm font-black ${
                              isTuntas
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {r.nilaiAkhir}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              r.predikat === 'A'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : r.predikat === 'B'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : r.predikat === 'C'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {r.predikat} • {isTuntas ? 'Tuntas' : 'Belum'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            disabled={!allowCreate}
                            placeholder="Catatan capaian kompetensi..."
                            value={r.deskripsi}
                            onChange={(e) => handleCellChange(r.siswaId, 'deskripsi', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-6 py-4 border-t border-slate-200 dark:bg-slate-800/40 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Total <strong>{rows.length} siswa</strong> siap disimpan ke buku nilai semester.
              </span>

              {allowCreate ? (
                <button
                  onClick={handleSaveGrades}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Menyimpan Nilai...' : 'Simpan Semua Nilai'}</span>
                </button>
              ) : (
                <span className="text-xs font-semibold text-amber-700">
                  Mode Lihat Saja (tidak memiliki izin simpan nilai)
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* MODAL PENGATURAN BOBOT PENILAIAN */}
      {isBobotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pengaturan Bobot Penilaian
              </h3>
              <button
                onClick={() => setIsBobotModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBobot} className="mt-4 space-y-4">
              <p className="text-xs text-slate-500">
                Periode: <strong>{tahunAjaran} ({semester})</strong>. Total ketiga bobot harus sama dengan <strong>100%</strong>.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bobot Tugas / Harian (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={bobotForm.bobotTugas}
                    onChange={(e) => setBobotForm({ ...bobotForm, bobotTugas: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bobot PTS / Tengah Semester (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={bobotForm.bobotPts}
                    onChange={(e) => setBobotForm({ ...bobotForm, bobotPts: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bobot PAS / Akhir Semester (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={bobotForm.bobotPas}
                    onChange={(e) => setBobotForm({ ...bobotForm, bobotPas: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between text-xs dark:bg-slate-800 dark:border-slate-700">
                <span>Total Persentase</span>
                <span
                  className={`font-mono font-extrabold ${
                    bobotForm.bobotTugas + bobotForm.bobotPts + bobotForm.bobotPas === 100
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                >
                  {bobotForm.bobotTugas + bobotForm.bobotPts + bobotForm.bobotPas}%
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBobotModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingBobot}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingBobot ? 'Menyimpan...' : 'Simpan Bobot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

