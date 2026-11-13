'use client'

import React, { useEffect, useState } from 'react'
import {
  GraduationCap,
  Search,
  Download,
  Edit3,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

const KARIR_BADGE: Record<string, { label: string; style: string }> = {
  kuliah: {
    label: 'Kuliah / Perguruan Tinggi',
    style: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  melanjutkan_sekolah: {
    label: 'Melanjutkan Sekolah',
    style: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  bekerja: {
    label: 'Bekerja / Karyawan',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  wirausaha: {
    label: 'Wirausaha / Mandiri',
    style: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  belum_diketahui: {
    label: 'Belum Dilacak',
    style: 'bg-slate-100 text-slate-600 border-slate-200',
  },
}

export default function DirektoriAlumniPage() {
  const { canEdit } = usePermission()
  const allowEdit = canEdit('/kesiswaan/alumni')

  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  const [alumniList, setAlumniList] = useState<any[]>([])
  const [tahunOptions, setTahunOptions] = useState<number[]>([])
  const [jenjangList, setJenjangList] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalAlumni: 0,
    melanjutkanStudi: 0,
    bekerjaWirausaha: 0,
    belumDilacak: 0,
  })

  // Filters
  const [filterJenjang, setFilterJenjang] = useState('all')
  const [filterTahun, setFilterTahun] = useState('all')
  const [filterKarir, setFilterKarir] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal Edit Tracer Study
  const [editingAlumni, setEditingAlumni] = useState<any>(null)
  const [savingTracer, setSavingTracer] = useState(false)
  const [tracerForm, setTracerForm] = useState({
    tahunLulus: new Date().getFullYear(),
    statusKarir: 'belum_diketahui',
    instansiTujuan: '',
    jabatanJurusan: '',
    kontakTerbaru: '',
    emailTerbaru: '',
    kotaDomisili: '',
    catatan: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterJenjang !== 'all') params.set('jenjangId', filterJenjang)
      if (filterTahun !== 'all') params.set('tahunLulus', filterTahun)
      if (filterKarir !== 'all') params.set('statusKarir', filterKarir)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/kesiswaan/alumni?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setAlumniList(json.data.alumniList || [])
        setStats(json.data.stats)
        setTahunOptions(json.data.tahunOptions || [])
        setJenjangList(json.data.jenjangList || [])
      }
    } catch (err) {
      console.error('Fetch alumni error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterJenjang, filterTahun, filterKarir])

  const openTracerModal = (item: any) => {
    const tr = item.alumniTracer
    setEditingAlumni(item)
    setTracerForm({
      tahunLulus: tr?.tahunLulus || item.tahunKeluar || new Date().getFullYear(),
      statusKarir: tr?.statusKarir || 'belum_diketahui',
      instansiTujuan: tr?.instansiTujuan || '',
      jabatanJurusan: tr?.jabatanJurusan || '',
      kontakTerbaru: tr?.kontakTerbaru || item.telpSiswa || item.telpWali || '',
      emailTerbaru: tr?.emailTerbaru || item.emailSiswa || '',
      kotaDomisili: tr?.kotaDomisili || '',
      catatan: tr?.catatan || '',
    })
  }

  const handleSaveTracer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAlumni) return
    setSavingTracer(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/kesiswaan/alumni', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswaId: editingAlumni.id,
          ...tracerForm,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setEditingAlumni(null)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message || 'Gagal menyimpan tracer alumni' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingTracer(false)
    }
  }

  const handleExportCsv = () => {
    const headers = [
      'NIS',
      'NISN',
      'Nama Lengkap',
      'Jenjang',
      'Jurusan',
      'Tahun Lulus',
      'Status Pasca-Lulus',
      'Instansi / Kampus / Usaha',
      'Prodi / Jabatan',
      'Kontak',
      'Kota Domisili',
    ]
    const rows = alumniList.map((a) => {
      const tr = a.alumniTracer
      return [
        a.nis,
        a.nisn || '',
        a.nama,
        a.jenjang?.kode || '',
        a.jurusan?.namaJurusan || '',
        tr?.tahunLulus || a.tahunKeluar || '',
        KARIR_BADGE[tr?.statusKarir || 'belum_diketahui']?.label || '',
        tr?.instansiTujuan || '',
        tr?.jabatanJurusan || '',
        tr?.kontakTerbaru || a.telpSiswa || a.telpWali || '',
        tr?.kotaDomisili || '',
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    })
    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `direktori_alumni_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Buku Induk &amp; Direktori Alumni
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Arsip siswa lulusan beserta tracer study jejak studi lanjut dan karir pasca-kelulusan.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={alumniList.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4 text-blue-600" />
          <span>Ekspor CSV Alumni</span>
        </button>
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

      {/* 4 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500">Total Alumni Tercatat</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalAlumni}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-blue-600">Melanjutkan Studi / Kuliah</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {stats.melanjutkanStudi}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-emerald-600">Bekerja / Wirausaha</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {stats.bekerjaWirausaha}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-amber-600">Belum Dilacak</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {stats.belumDilacak}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama/NIS alumni atau kampus/perusahaan..."
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
          value={filterTahun}
          onChange={(val) => setFilterTahun(val)}
          options={[
            { value: 'all', label: 'Semua Angkatan' },
            ...tahunOptions.map((y) => ({ value: String(y), label: `Lulusan ${y}` })),
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
          value={filterKarir}
          onChange={(val) => setFilterKarir(val)}
          options={[
            { value: 'all', label: 'Semua Status Karir' },
            { value: 'kuliah', label: 'Kuliah / PT' },
            { value: 'melanjutkan_sekolah', label: 'Melanjutkan Sekolah' },
            { value: 'bekerja', label: 'Bekerja' },
            { value: 'wirausaha', label: 'Wirausaha' },
            { value: 'belum_diketahui', label: 'Belum Dilacak' },
          ]}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Alumni &amp; NIS</th>
                <th className="px-4 py-3">Jenjang &amp; Angkatan</th>
                <th className="px-4 py-3">Status Pasca-Lulus</th>
                <th className="px-4 py-3">Instansi / Kampus / Usaha</th>
                <th className="px-4 py-3">Kontak &amp; Domisili</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Memuat direktori alumni...
                  </td>
                </tr>
              ) : alumniList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Belum ada alumni tercatat (siswa berstatus lulus dari menu Kenaikan Kelas &amp; Kelulusan akan tampil otomatis di sini).
                  </td>
                </tr>
              ) : (
                alumniList.map((a) => {
                  const tr = a.alumniTracer
                  const karir = KARIR_BADGE[tr?.statusKarir || 'belum_diketahui'] || KARIR_BADGE.belum_diketahui
                  const tahunLulus = tr?.tahunLulus || a.tahunKeluar || '-'
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{a.nama}</div>
                        <div className="text-[11px] font-mono text-slate-500">NIS: {a.nis}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">
                          {a.jenjang?.kode}
                          {a.jurusan ? ` • ${a.jurusan.kodeJurusan}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-500">Angkatan Lulus {tahunLulus}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-bold ${karir.style}`}
                        >
                          {karir.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">
                          {tr?.instansiTujuan || '-'}
                        </div>
                        {tr?.jabatanJurusan && (
                          <div className="text-[11px] text-slate-500">{tr.jabatanJurusan}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="font-mono">{tr?.kontakTerbaru || a.telpSiswa || a.telpWali || '-'}</div>
                        <div className="text-[11px] text-slate-400">{tr?.kotaDomisili || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {allowEdit && (
                          <button
                            onClick={() => openTracerModal(a)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Tracer Study</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL UPDATE TRACER STUDY */}
      {editingAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveTracer}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Update Tracer Study Alumni
                </h3>
                <p className="text-xs text-slate-500">
                  {editingAlumni.nama} (NIS: {editingAlumni.nis})
                </p>
              </div>
              <button type="button" onClick={() => setEditingAlumni(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Tahun Lulus *</label>
                <input
                  type="number"
                  required
                  value={tracerForm.tahunLulus}
                  onChange={(e) =>
                    setTracerForm({ ...tracerForm, tahunLulus: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Status Pasca-Lulus</label>
                <SearchableSelect
                  value={tracerForm.statusKarir}
                  onChange={(val) => setTracerForm({ ...tracerForm, statusKarir: val })}
                  options={[
                    { value: 'kuliah', label: 'Kuliah / Perguruan Tinggi' },
                    { value: 'melanjutkan_sekolah', label: 'Melanjutkan Sekolah' },
                    { value: 'bekerja', label: 'Bekerja / Karyawan' },
                    { value: 'wirausaha', label: 'Wirausaha / Mandiri' },
                    { value: 'belum_diketahui', label: 'Belum Dilacak' },
                  ]}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Nama Kampus / Perusahaan / Sekolah</label>
                <input
                  type="text"
                  value={tracerForm.instansiTujuan}
                  onChange={(e) => setTracerForm({ ...tracerForm, instansiTujuan: e.target.value })}
                  placeholder="Contoh: Institut Teknologi Bandung / PT Telkom / SMA N 1"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Prodi / Jurusan / Jabatan</label>
                <input
                  type="text"
                  value={tracerForm.jabatanJurusan}
                  onChange={(e) => setTracerForm({ ...tracerForm, jabatanJurusan: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Kota Domisili</label>
                <input
                  type="text"
                  value={tracerForm.kotaDomisili}
                  onChange={(e) => setTracerForm({ ...tracerForm, kotaDomisili: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Kontak / WhatsApp Terbaru</label>
                <input
                  type="text"
                  value={tracerForm.kontakTerbaru}
                  onChange={(e) => setTracerForm({ ...tracerForm, kontakTerbaru: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Email Terbaru</label>
                <input
                  type="email"
                  value={tracerForm.emailTerbaru}
                  onChange={(e) => setTracerForm({ ...tracerForm, emailTerbaru: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={tracerForm.catatan}
                  onChange={(e) => setTracerForm({ ...tracerForm, catatan: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingAlumni(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingTracer}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingTracer ? 'Menyimpan...' : 'Simpan Data Tracer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

