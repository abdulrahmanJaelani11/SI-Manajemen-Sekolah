'use client'

import React, { useEffect, useState } from 'react'
import {
  Award,
  Printer,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Send,
  FileText,
  X,
  Users,
  Sparkles,
  Lock,
  Globe,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import RaporPrintModal from '@/components/akademik/RaporPrintModal'
import { usePermission } from '@/context/PermissionContext'

export default function RaporPage() {
  const { canCreate, canEdit } = usePermission()
  const allowCreate = canCreate('/akademik/rapor')
  const allowEdit = canEdit('/akademik/rapor')

  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [tahunAjaran, setTahunAjaran] = useState('2024/2025')
  const [semester, setSemester] = useState('Ganjil')
  const [selectedKelasId, setSelectedKelasId] = useState('')

  const [kelasList, setKelasList] = useState<any[]>([])
  const [allPeriods, setAllPeriods] = useState<any[]>([])
  const [selectedKelas, setSelectedKelas] = useState<any>(null)
  const [sekolahProfil, setSekolahProfil] = useState<any>(null)
  const [kepalaSekolah, setKepalaSekolah] = useState<any>(null)
  const [rekapSiswa, setRekapSiswa] = useState<any[]>([])

  // Modal Edit Catatan Wali & Kehadiran
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [raporForm, setRaporForm] = useState({
    sikapSpiritual: 'Baik',
    sikapSosial: 'Baik',
    sakit: 0,
    izin: 0,
    alpa: 0,
    ekstrakurikuler: '',
    catatanWali: '',
    keputusan: '',
    status: 'draft',
  })

  // Modal Cetak Rapor
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printData, setPrintData] = useState<any>(null)

  const fetchRapor = async (ta?: string, sem?: string, kId?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (ta) params.set('tahunAjaran', ta)
      if (sem) params.set('semester', sem)
      if (kId) params.set('kelasId', kId)

      const res = await fetch(`/api/akademik/rapor?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setKelasList(json.data.kelasList || [])
        setAllPeriods(json.data.allPeriods || [])
        setSelectedKelas(json.data.selectedKelas || null)
        setSekolahProfil(json.data.sekolahProfil || null)
        setKepalaSekolah(json.data.kepalaSekolah || null)
        setRekapSiswa(json.data.rekapSiswa || [])

        if (!ta && json.data.tahunAjaran) setTahunAjaran(json.data.tahunAjaran)
        if (!sem && json.data.semester) setSemester(json.data.semester)
        if (!kId && !selectedKelasId && json.data.kelasList?.length > 0) {
          setSelectedKelasId(String(json.data.kelasList[0].id))
        }
      }
    } catch (err) {
      console.error('Fetch rapor error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRapor()
  }, [])

  useEffect(() => {
    if (selectedKelasId) {
      fetchRapor(tahunAjaran, semester, selectedKelasId)
    }
  }, [tahunAjaran, semester, selectedKelasId])

  const openEditModal = (row: any) => {
    setEditingRow(row)
    setRaporForm({
      sikapSpiritual: row.rapor?.sikapSpiritual || 'Baik',
      sikapSosial: row.rapor?.sikapSosial || 'Baik',
      sakit: row.rapor?.sakit || 0,
      izin: row.rapor?.izin || 0,
      alpa: row.rapor?.alpa || 0,
      ekstrakurikuler: row.rapor?.ekstrakurikuler || '',
      catatanWali: row.rapor?.catatanWali || '',
      keputusan: row.rapor?.keputusan || '',
      status: row.rapor?.status || 'draft',
    })
    setIsEditModalOpen(true)
  }

  const handleSaveRapor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRow) return
    setSubmitting(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/akademik/rapor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswaId: editingRow.siswa.id,
          kelasId: Number(selectedKelasId),
          tahunAjaran,
          semester,
          ...raporForm,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        setIsEditModalOpen(false)
        await fetchRapor(tahunAjaran, semester, selectedKelasId)
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menyimpan data rapor' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error: ' + err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleBatchPublish = async (action: 'publish_all' | 'unpublish_all') => {
    if (!selectedKelasId) return
    const msg =
      action === 'publish_all'
        ? `Terbitkan seluruh rapor kelas ${selectedKelas?.namaKelas} agar langsung dapat dilihat oleh siswa & wali murid di Portal Siswa?`
        : `Tarik kembali seluruh rapor kelas ${selectedKelas?.namaKelas} ke status Draft?`

    if (!confirm(msg)) return

    setFeedback(null)
    try {
      const res = await fetch('/api/akademik/rapor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelasId: Number(selectedKelasId),
          tahunAjaran,
          semester,
          action,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        await fetchRapor(tahunAjaran, semester, selectedKelasId)
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal memproses penerbitan massal' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Error: ' + err.message })
    }
  }

  const openPrintPreview = (row: any) => {
    setPrintData({
      siswa: row.siswa,
      kelas: selectedKelas,
      tahunAjaran,
      semester,
      nilaiList: row.nilaiList,
      rapor: row.rapor,
      rataRata: row.rataRata,
      peringkat: row.peringkat,
      sekolah: sekolahProfil,
      kepalaSekolah,
    })
    setPrintModalOpen(true)
  }

  const distinctYears = Array.from(new Set(allPeriods.map((p) => p.nama)))
  if (distinctYears.length === 0) distinctYears.push(tahunAjaran)

  const publishedCount = rekapSiswa.filter((r) => r.rapor?.status === 'diterbitkan').length
  const classAvg =
    rekapSiswa.length > 0
      ? Math.round(
          (rekapSiswa.reduce((acc, r) => acc + (r.rataRata || 0), 0) / rekapSiswa.length) * 10
        ) / 10
      : 0

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Rekapitulasi Nilai & E-Rapor Semester
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pengesahan wali kelas, rekap peringkat kelas, cetak rapor resmi, dan publikasi ke Portal Siswa.
          </p>
        </div>

        {allowEdit && selectedKelasId && rekapSiswa.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => handleBatchPublish('unpublish_all')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition"
            >
              <Lock className="h-3.5 w-3.5 text-amber-500" />
              <span>Tarik ke Draft</span>
            </button>
            <button
              onClick={() => handleBatchPublish('publish_all')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Terbitkan Semua Rapor</span>
            </button>
          </div>
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

      {/* Ringkasan Kelas */}
      {selectedKelas && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-bold uppercase text-slate-400">Wali Kelas</span>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate">
              {selectedKelas.waliKelas || 'Belum ditentukan'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-bold uppercase text-slate-400">Total Siswa Aktif</span>
            <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
              {rekapSiswa.length} Siswa
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-bold uppercase text-slate-400">Rata-rata Kelas</span>
            <p className="mt-1 text-xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
              {classAvg}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-[11px] font-bold uppercase text-slate-400">Status Terbit Portal</span>
            <p className="mt-1 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {publishedCount} / {rekapSiswa.length} Terbit
            </p>
          </div>
        </div>
      )}

      {/* Tabel Rekapitulasi E-Rapor */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="p-14 text-center text-xs text-slate-400">
            Memuat rekapitulasi nilai & rapor kelas...
          </div>
        ) : rekapSiswa.length === 0 ? (
          <div className="p-14 text-center text-sm text-slate-500">
            Belum ada siswa aktif di kelas ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5 text-center w-20">Rank</th>
                  <th className="px-4 py-3.5">Peserta Didik</th>
                  <th className="px-4 py-3.5 text-center">Mapel Dinilai</th>
                  <th className="px-4 py-3.5 text-center">Rata-rata</th>
                  <th className="px-4 py-3.5 text-center">Absensi (S/I/A)</th>
                  <th className="px-4 py-3.5 text-center">Status Portal</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rekapSiswa.map((row) => (
                  <tr key={row.siswa.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 text-center">
                      {row.peringkat > 0 ? (
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-mono font-extrabold text-xs ${
                            row.peringkat === 1
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : row.peringkat <= 3
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{row.peringkat}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {row.siswa.nama}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        NIS: {row.siswa.nis}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {row.jumlahMapel} Mapel
                      </span>
                      {row.jumlahMapel > 0 && (
                        <span className="block text-[10px] text-emerald-600">
                          ({row.jumlahTuntas} tuntas)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-sm font-black text-blue-600 dark:text-blue-400">
                      {row.rataRata}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-slate-600 dark:text-slate-300">
                      {row.rapor?.sakit || 0} / {row.rapor?.izin || 0} / {row.rapor?.alpa || 0}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {row.rapor?.status === 'diterbitkan' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <Globe className="h-3 w-3" />
                          Diterbitkan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          <Lock className="h-3 w-3" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(allowCreate || allowEdit) && (
                          <button
                            onClick={() => openEditModal(row)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Catatan Wali</span>
                          </button>
                        )}
                        <button
                          onClick={() => openPrintPreview(row)}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-blue-700"
                        >
                          <Printer className="h-3 w-3" />
                          <span>Cetak Rapor</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL EDIT CATATAN WALI KELAS & KEHADIRAN */}
      {isEditModalOpen && editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Kelengkapan Rapor — {editingRow.siswa.nama}
                </h3>
                <p className="text-xs text-slate-500">
                  NIS: {editingRow.siswa.nis} • {tahunAjaran} ({semester})
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRapor} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sikap Spiritual
                  </label>
                  <SearchableSelect
                    value={raporForm.sikapSpiritual}
                    onChange={(val) => setRaporForm({ ...raporForm, sikapSpiritual: val })}
                    options={[
                      { value: 'Sangat Baik', label: 'Sangat Baik' },
                      { value: 'Baik', label: 'Baik' },
                      { value: 'Cukup', label: 'Cukup' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sikap Sosial
                  </label>
                  <SearchableSelect
                    value={raporForm.sikapSosial}
                    onChange={(val) => setRaporForm({ ...raporForm, sikapSosial: val })}
                    options={[
                      { value: 'Sangat Baik', label: 'Sangat Baik' },
                      { value: 'Baik', label: 'Baik' },
                      { value: 'Cukup', label: 'Cukup' },
                    ]}
                  />
                </div>
              </div>

              {/* Ketidakhadiran */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rekap Ketidakhadiran (Hari)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-400 mb-1">Sakit</span>
                    <input
                      type="number"
                      min={0}
                      value={raporForm.sakit}
                      onChange={(e) => setRaporForm({ ...raporForm, sakit: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 mb-1">Izin</span>
                    <input
                      type="number"
                      min={0}
                      value={raporForm.izin}
                      onChange={(e) => setRaporForm({ ...raporForm, izin: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 mb-1">Alpa</span>
                    <input
                      type="number"
                      min={0}
                      value={raporForm.alpa}
                      onChange={(e) => setRaporForm({ ...raporForm, alpa: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ekstrakurikuler & Predikat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pramuka (Baik), Futsal (Sangat Baik)"
                  value={raporForm.ekstrakurikuler}
                  onChange={(e) => setRaporForm({ ...raporForm, ekstrakurikuler: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Wali Kelas
                </label>
                <textarea
                  rows={3}
                  placeholder="Berikan motivasi, apresiasi, atau saran perkembangan belajar siswa..."
                  value={raporForm.catatanWali}
                  onChange={(e) => setRaporForm({ ...raporForm, catatanWali: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Keputusan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Naik Kelas / Lulus"
                    value={raporForm.keputusan}
                    onChange={(e) => setRaporForm({ ...raporForm, keputusan: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Penerbitan
                  </label>
                  <SearchableSelect
                    value={raporForm.status}
                    onChange={(val) => setRaporForm({ ...raporForm, status: val })}
                    options={[
                      { value: 'draft', label: 'Draft (Internal)' },
                      { value: 'diterbitkan', label: 'Diterbitkan (Tampil di Portal)' },
                    ]}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Catatan Rapor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU & CETAK RAPOR */}
      <RaporPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        data={printData}
      />
    </div>
  )
}

