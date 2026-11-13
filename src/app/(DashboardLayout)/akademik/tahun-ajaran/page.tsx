'use client'

import React, { useEffect, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  Power,
  X,
  Clock,
  Users,
  Building2,
  CalendarRange,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

interface TahunAjaranItem {
  id: number
  nama: string
  semester: string
  tanggalMulai: string | null
  tanggalSelesai: string | null
  isActive: boolean
  keterangan: string | null
}

export default function TahunAjaranPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/akademik/tahun-ajaran')
  const allowEdit = canEdit('/akademik/tahun-ajaran')
  const allowDelete = canDelete('/akademik/tahun-ajaran')

  const [loading, setLoading] = useState(true)
  const [periods, setPeriods] = useState<TahunAjaranItem[]>([])
  const [activePeriod, setActivePeriod] = useState<TahunAjaranItem | null>(null)
  const [stats, setStats] = useState({ totalPeriode: 0, totalSiswaAktif: 0, totalKelas: 0 })
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal Tambah/Edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TahunAjaranItem | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nama: '',
    semester: 'Ganjil',
    tanggalMulai: '',
    tanggalSelesai: '',
    isActive: false,
    keterangan: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/akademik/tahun-ajaran')
      const json = await res.json()
      if (json.success && json.data) {
        setPeriods(json.data.periods || [])
        setActivePeriod(json.data.activePeriod || null)
        setStats(json.data.stats || { totalPeriode: 0, totalSiswaAktif: 0, totalKelas: 0 })
      }
    } catch (err) {
      console.error('Fetch tahun ajaran error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openAddModal = () => {
    const nextYear = new Date().getFullYear()
    setEditingItem(null)
    setFormData({
      nama: `${nextYear}/${nextYear + 1}`,
      semester: 'Ganjil',
      tanggalMulai: '',
      tanggalSelesai: '',
      isActive: periods.length === 0,
      keterangan: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (item: TahunAjaranItem) => {
    setEditingItem(item)
    setFormData({
      nama: item.nama,
      semester: item.semester,
      tanggalMulai: item.tanggalMulai ? item.tanggalMulai.slice(0, 10) : '',
      tanggalSelesai: item.tanggalSelesai ? item.tanggalSelesai.slice(0, 10) : '',
      isActive: item.isActive,
      keterangan: item.keterangan || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    try {
      const url = editingItem
        ? `/api/akademik/tahun-ajaran/${editingItem.id}`
        : '/api/akademik/tahun-ajaran'
      const method = editingItem ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()

      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        setIsModalOpen(false)
        await fetchData()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tahun-ajaran-updated'))
        }
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menyimpan periode' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Terjadi kesalahan: ' + err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleActivate = async (item: TahunAjaranItem) => {
    if (
      !confirm(
        `Aktifkan periode ${item.nama} (Semester ${item.semester}) sebagai Tahun Ajaran Aktif?\n\nPeriode aktif sebelumnya akan otomatis dinonaktifkan.`
      )
    ) {
      return
    }

    setFeedback(null)
    try {
      const res = await fetch(`/api/akademik/tahun-ajaran/${item.id}`, {
        method: 'PATCH',
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        await fetchData()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tahun-ajaran-updated'))
        }
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal mengaktifkan periode' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Gagal terhubung ke server: ' + err.message })
    }
  }

  const handleDelete = async (item: TahunAjaranItem) => {
    if (
      !confirm(
        `Yakin ingin menghapus periode ${item.nama} Semester ${item.semester}? Data yang sudah dihapus tidak dapat dikembalikan.`
      )
    ) {
      return
    }

    setFeedback(null)
    try {
      const res = await fetch(`/api/akademik/tahun-ajaran/${item.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', text: json.message })
        await fetchData()
      } else {
        setFeedback({ type: 'error', text: json.message || 'Gagal menghapus periode' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: 'Gagal menghapus: ' + err.message })
    }
  }

  const formatTanggal = (tgl: string | null) => {
    if (!tgl) return '-'
    return new Date(tgl).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tahun Ajaran & Semester Aktif
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pusat kendali periode akademik sekolah. Periode aktif akan menjadi acuan otomatis di seluruh modul.
          </p>
        </div>

        {allowCreate && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Periode Baru</span>
          </button>
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

      {/* Periode Sedang Aktif + KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Highlight Periode Aktif */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-400">
                <CalendarRange className="h-7 w-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/40">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>PERIODE AKADEMIK SEDANG AKTIF</span>
                </div>
                <h2 className="mt-1.5 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {activePeriod
                    ? `T.A ${activePeriod.nama} — Semester ${activePeriod.semester}`
                    : 'Belum Ada Periode Aktif'}
                </h2>
                {activePeriod?.keterangan && (
                  <p className="text-xs text-slate-500 mt-0.5">{activePeriod.keterangan}</p>
                )}
              </div>
            </div>

            {activePeriod && (
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-2.5 text-xs dark:bg-slate-800/50 dark:border-slate-700">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Rentang Tanggal Efektif
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatTanggal(activePeriod.tanggalMulai)} s.d.{' '}
                  {formatTanggal(activePeriod.tanggalSelesai)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span>
              Semua transaksi kasir SPP baru, status dashboard, dan jadwal pelajaran otomatis mengacu pada tahun ajaran aktif ini.
            </span>
          </div>
        </div>

        {/* Ringkasan Statistik Akademik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Total Siswa Aktif</span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                {stats.totalSiswaAktif} Siswa
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Rombongan Belajar Aktif</span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                {stats.totalKelas} Kelas
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Daftar Tahun Ajaran */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Daftar Periode Tahun Ajaran & Semester ({periods.length})
            </h3>
            <p className="text-xs text-slate-500">
              Klik tombol &quot;Jadikan Aktif&quot; untuk berpindah semester atau memulai tahun ajaran baru.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            Memuat daftar periode tahun ajaran...
          </div>
        ) : periods.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Belum ada periode tahun ajaran yang terdaftar. Silakan tambah periode baru.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3.5">Tahun Ajaran</th>
                  <th className="px-4 py-3.5">Semester</th>
                  <th className="px-4 py-3.5">Rentang Tanggal</th>
                  <th className="px-4 py-3.5">Keterangan</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {periods.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.isActive
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/15'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white font-mono text-sm">
                      {item.nama}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                          item.semester === 'Ganjil'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                        }`}
                      >
                        Semester {item.semester}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {formatTanggal(item.tanggalMulai)} – {formatTanggal(item.tanggalSelesai)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-500 max-w-xs truncate" title={item.keterangan || ''}>
                      {item.keterangan || '-'}
                    </td>
                    <td className="px-4 py-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          AKTIF
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {allowEdit && !item.isActive && (
                          <button
                            onClick={() => handleActivate(item)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                            title="Aktifkan Periode Ini"
                          >
                            <Power className="h-3 w-3" />
                            <span>Jadikan Aktif</span>
                          </button>
                        )}
                        {allowEdit && (
                          <button
                            onClick={() => openEditModal(item)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-amber-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                            title="Ubah Periode"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {allowDelete && !item.isActive && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="rounded-lg border border-red-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-red-900/40 dark:hover:bg-rose-950/40 transition"
                            title="Hapus Periode"
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

      {/* Modal Tambah / Edit Tahun Ajaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingItem ? 'Edit Periode Tahun Ajaran' : 'Tambah Periode Tahun Ajaran'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tahun Ajaran *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2025/2026"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Semester *
                  </label>
                  <SearchableSelect
                    value={formData.semester}
                    onChange={(val) => setFormData({ ...formData, semester: val })}
                    options={[
                      { value: 'Ganjil', label: 'Semester Ganjil' },
                      { value: 'Genap', label: 'Semester Genap' },
                    ]}
                    placeholder="Pilih Semester"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalMulai}
                    onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalSelesai}
                    onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tahun ajaran baru semester ganjil"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {(!editingItem || !editingItem.isActive) && (
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 cursor-pointer dark:border-slate-800 dark:bg-slate-800/40">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Jadikan Periode Aktif Sekarang
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Otomatis menonaktifkan periode aktif sebelumnya.
                    </span>
                  </div>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Periode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

