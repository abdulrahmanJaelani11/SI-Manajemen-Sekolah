'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  LogOut,
  LogIn,
  Search,
  AlertCircle,
  CheckCircle2,
  Trash2,
  X,
  RotateCcw,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

const JENIS_BADGE: Record<string, { label: string; style: string }> = {
  keluar: {
    label: 'Mutasi Keluar / Pindah',
    style: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  masuk: {
    label: 'Mutasi Masuk (Pindahan)',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  drop_out: {
    label: 'Berhenti / Drop Out',
    style: 'bg-rose-50 text-rose-700 border-rose-200',
  },
}

export default function MutasiSiswaPage() {
  const { canCreate, canDelete } = usePermission()
  const allowCreate = canCreate('/kesiswaan/mutasi')
  const allowDelete = canDelete('/kesiswaan/mutasi')

  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  const [logs, setLogs] = useState<any[]>([])
  const [siswaAktifList, setSiswaAktifList] = useState<any[]>([])
  const [jenjangList, setJenjangList] = useState<any[]>([])
  const [jurusanList, setJurusanList] = useState<any[]>([])
  const [kelasList, setKelasList] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalMutasi: 0,
    mutasiKeluar: 0,
    mutasiMasuk: 0,
    dropOut: 0,
  })

  // Filter
  const [filterJenis, setFilterJenis] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal Mutasi Keluar / DO
  const [isKeluarOpen, setIsKeluarOpen] = useState(false)
  const [savingKeluar, setSavingKeluar] = useState(false)
  const [keluarForm, setKeluarForm] = useState({
    siswaId: '',
    jenisMutasi: 'keluar',
    tanggalMutasi: new Date().toISOString().slice(0, 10),
    nomorSurat: '',
    sekolahAsalTujuan: '',
    alasan: '',
  })

  // Modal Mutasi Masuk
  const [isMasukOpen, setIsMasukOpen] = useState(false)
  const [savingMasuk, setSavingMasuk] = useState(false)
  const [masukForm, setMasukForm] = useState({
    tanggalMutasi: new Date().toISOString().slice(0, 10),
    nomorSurat: '',
    sekolahAsalTujuan: '',
    alasan: '',
    jenjangId: '',
    jurusanId: '',
    kelasId: '',
    nis: '',
    nisn: '',
    nama: '',
    jenisKelamin: 'L',
    tempatLahir: '',
    tanggalLahir: '',
    namaWali: '',
    telpWali: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterJenis !== 'all') params.set('jenisMutasi', filterJenis)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/kesiswaan/mutasi?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setLogs(json.data.logs || [])
        setStats(json.data.stats)
        setSiswaAktifList(json.data.siswaAktifList || [])
        setJenjangList(json.data.jenjangList || [])
        setJurusanList(json.data.jurusanList || [])
        setKelasList(json.data.kelasList || [])
      }
    } catch (err) {
      console.error('Fetch mutasi error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterJenis])

  const filteredMasukJurusan = useMemo(
    () => jurusanList.filter((j) => String(j.jenjangId) === String(masukForm.jenjangId)),
    [jurusanList, masukForm.jenjangId]
  )

  const filteredMasukKelas = useMemo(
    () => kelasList.filter((k) => String(k.jenjangId) === String(masukForm.jenjangId)),
    [kelasList, masukForm.jenjangId]
  )

  const handleSubmitKeluar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingKeluar(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/kesiswaan/mutasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keluarForm),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setIsKeluarOpen(false)
        setKeluarForm({
          siswaId: '',
          jenisMutasi: 'keluar',
          tanggalMutasi: new Date().toISOString().slice(0, 10),
          nomorSurat: '',
          sekolahAsalTujuan: '',
          alasan: '',
        })
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message || 'Gagal memproses mutasi keluar' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingKeluar(false)
    }
  }

  const handleSubmitMasuk = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingMasuk(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/kesiswaan/mutasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenisMutasi: 'masuk',
          tanggalMutasi: masukForm.tanggalMutasi,
          nomorSurat: masukForm.nomorSurat,
          sekolahAsalTujuan: masukForm.sekolahAsalTujuan,
          alasan: masukForm.alasan,
          siswaBaru: {
            jenjangId: masukForm.jenjangId,
            jurusanId: masukForm.jurusanId || null,
            kelasId: masukForm.kelasId || null,
            nis: masukForm.nis,
            nisn: masukForm.nisn,
            nama: masukForm.nama,
            jenisKelamin: masukForm.jenisKelamin,
            tempatLahir: masukForm.tempatLahir,
            tanggalLahir: masukForm.tanggalLahir,
            namaWali: masukForm.namaWali,
            telpWali: masukForm.telpWali,
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setIsMasukOpen(false)
        setMasukForm({
          tanggalMutasi: new Date().toISOString().slice(0, 10),
          nomorSurat: '',
          sekolahAsalTujuan: '',
          alasan: '',
          jenjangId: '',
          jurusanId: '',
          kelasId: '',
          nis: '',
          nisn: '',
          nama: '',
          jenisKelamin: 'L',
          tempatLahir: '',
          tanggalLahir: '',
          namaWali: '',
          telpWali: '',
        })
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message || 'Gagal mendaftarkan siswa masuk' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingMasuk(false)
    }
  }

  const handleDeleteLog = async (row: any, restore = false) => {
    const msg = restore
      ? `Batalkan mutasi "${row.siswa?.nama}" dan kembalikan statusnya menjadi AKTIF?`
      : `Hapus riwayat catatan mutasi "${row.siswa?.nama}"?`
    if (!confirm(msg)) return

    setFeedback(null)
    try {
      const res = await fetch(
        `/api/kesiswaan/mutasi?id=${row.id}${restore ? '&restore=1' : ''}`,
        { method: 'DELETE' }
      )
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
            Administrasi Mutasi Siswa
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pencatatan perpindahan siswa keluar, berhenti/DO, serta registrasi siswa pindahan masuk.
          </p>
        </div>

        {allowCreate && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsMasukOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
            >
              <LogIn className="h-4 w-4" />
              <span>Catat Mutasi Masuk</span>
            </button>
            <button
              onClick={() => setIsKeluarOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-amber-700 transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Proses Mutasi Keluar</span>
            </button>
          </div>
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

      {/* 4 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500">Total Catatan Mutasi</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.totalMutasi}</p>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-amber-600">Mutasi Keluar / Pindah</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.mutasiKeluar}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-emerald-600">Mutasi Masuk</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.mutasiMasuk}</p>
        </div>
        <div className="rounded-2xl border border-rose-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-rose-600">Berhenti / Drop Out</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.dropOut}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama/NIS siswa, no. surat, atau sekolah asal/tujuan..."
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
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            Cari
          </button>
        </div>

        <SearchableSelect
          value={filterJenis}
          onChange={(val) => setFilterJenis(val)}
          options={[
            { value: 'all', label: 'Semua Jenis Mutasi' },
            { value: 'keluar', label: 'Mutasi Keluar / Pindah' },
            { value: 'masuk', label: 'Mutasi Masuk' },
            { value: 'drop_out', label: 'Berhenti / Drop Out' },
          ]}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Tanggal &amp; No. Surat</th>
                <th className="px-4 py-3">Siswa &amp; Kelas</th>
                <th className="px-4 py-3">Jenis Mutasi</th>
                <th className="px-4 py-3">Sekolah Asal / Tujuan &amp; Alasan</th>
                <th className="px-4 py-3">Petugas</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Memuat riwayat mutasi siswa...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Belum ada catatan mutasi siswa.
                  </td>
                </tr>
              ) : (
                logs.map((row) => {
                  const badge = JENIS_BADGE[row.jenisMutasi] || JENIS_BADGE.keluar
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {new Date(row.tanggalMutasi).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {row.nomorSurat || 'Tanpa No. Surat'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{row.siswa?.nama}</div>
                        <div className="text-[11px] text-slate-500">
                          NIS: {row.siswa?.nis} • Kelas: {row.kelasTerakhir || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-extrabold ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        {row.sekolahAsalTujuan && (
                          <div className="font-semibold text-slate-800">
                            {row.jenisMutasi === 'masuk' ? 'Dari: ' : 'Tujuan: '}
                            {row.sekolahAsalTujuan}
                          </div>
                        )}
                        <p className="text-slate-600">{row.alasan}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{row.diprosesOleh || '-'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {allowDelete && (
                          <div className="inline-flex gap-1">
                            {(row.jenisMutasi === 'keluar' || row.jenisMutasi === 'drop_out') && (
                              <button
                                onClick={() => handleDeleteLog(row, true)}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-50"
                                title="Batalkan mutasi & aktifkan kembali siswa"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Aktifkan</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteLog(row, false)}
                              className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                              title="Hapus log mutasi"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
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

      {/* MODAL MUTASI KELUAR / DO */}
      {isKeluarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitKeluar}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Proses Mutasi Keluar / Berhenti
              </h3>
              <button type="button" onClick={() => setIsKeluarOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Pilih Siswa Aktif *</label>
                <SearchableSelect
                  value={keluarForm.siswaId}
                  onChange={(val) => setKeluarForm({ ...keluarForm, siswaId: val })}
                  options={siswaAktifList.map((s) => ({
                    value: String(s.id),
                    label: `${s.nama} (${s.nis})`,
                    sublabel: s.kelas ? `${s.jenjang?.kode || ''} ${s.kelas.namaKelas}` : 'Tanpa Kelas',
                  }))}
                  placeholder="Cari nama atau NIS siswa..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Jenis Mutasi *</label>
                  <SearchableSelect
                    value={keluarForm.jenisMutasi}
                    onChange={(val) => setKeluarForm({ ...keluarForm, jenisMutasi: val })}
                    options={[
                      { value: 'keluar', label: 'Mutasi Keluar / Pindah Sekolah' },
                      { value: 'drop_out', label: 'Berhenti / Drop Out' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Tanggal Efektif *</label>
                  <input
                    type="date"
                    required
                    value={keluarForm.tanggalMutasi}
                    onChange={(e) =>
                      setKeluarForm({ ...keluarForm, tanggalMutasi: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Nomor Surat Pindah</label>
                  <input
                    type="text"
                    value={keluarForm.nomorSurat}
                    onChange={(e) => setKeluarForm({ ...keluarForm, nomorSurat: e.target.value })}
                    placeholder="421/102/SKP/2026"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Sekolah Tujuan</label>
                  <input
                    type="text"
                    value={keluarForm.sekolahAsalTujuan}
                    onChange={(e) =>
                      setKeluarForm({ ...keluarForm, sekolahAsalTujuan: e.target.value })
                    }
                    placeholder="Nama sekolah tujuan pindah"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Alasan Mutasi / Keterangan *</label>
                <textarea
                  rows={2}
                  required
                  value={keluarForm.alasan}
                  onChange={(e) => setKeluarForm({ ...keluarForm, alasan: e.target.value })}
                  placeholder="Contoh: Mengikuti kepindahan tugas orang tua"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsKeluarOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingKeluar}
                className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {savingKeluar ? 'Memproses...' : 'Simpan Mutasi Keluar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL MUTASI MASUK */}
      {isMasukOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitMasuk}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Catat Siswa Pindahan (Mutasi Masuk)
              </h3>
              <button type="button" onClick={() => setIsMasukOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1">NIS Baru *</label>
                <input
                  type="text"
                  required
                  value={masukForm.nis}
                  onChange={(e) => setMasukForm({ ...masukForm, nis: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">NISN</label>
                <input
                  type="text"
                  value={masukForm.nisn}
                  onChange={(e) => setMasukForm({ ...masukForm, nisn: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={masukForm.nama}
                  onChange={(e) => setMasukForm({ ...masukForm, nama: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Jenis Kelamin *</label>
                <SearchableSelect
                  value={masukForm.jenisKelamin}
                  onChange={(val) => setMasukForm({ ...masukForm, jenisKelamin: val })}
                  options={[
                    { value: 'L', label: 'Laki-laki' },
                    { value: 'P', label: 'Perempuan' },
                  ]}
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Tanggal Masuk *</label>
                <input
                  type="date"
                  required
                  value={masukForm.tanggalMutasi}
                  onChange={(e) => setMasukForm({ ...masukForm, tanggalMutasi: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Jenjang *</label>
                <SearchableSelect
                  value={masukForm.jenjangId}
                  onChange={(val) =>
                    setMasukForm({ ...masukForm, jenjangId: val, jurusanId: '', kelasId: '' })
                  }
                  options={jenjangList.map((j) => ({
                    value: String(j.id),
                    label: `${j.kode} - ${j.nama}`,
                  }))}
                  placeholder="Pilih jenjang..."
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Penempatan Kelas</label>
                <SearchableSelect
                  value={masukForm.kelasId}
                  onChange={(val) => setMasukForm({ ...masukForm, kelasId: val })}
                  allowClear
                  disabled={!masukForm.jenjangId}
                  options={filteredMasukKelas.map((k) => ({
                    value: String(k.id),
                    label: k.namaKelas,
                  }))}
                  placeholder="Pilih kelas..."
                />
              </div>
              {filteredMasukJurusan.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">Jurusan</label>
                  <SearchableSelect
                    value={masukForm.jurusanId}
                    onChange={(val) => setMasukForm({ ...masukForm, jurusanId: val })}
                    allowClear
                    options={filteredMasukJurusan.map((j) => ({
                      value: String(j.id),
                      label: `${j.kodeJurusan} - ${j.namaJurusan}`,
                    }))}
                  />
                </div>
              )}
              <div>
                <label className="block font-bold mb-1">Nama Sekolah Asal *</label>
                <input
                  type="text"
                  required
                  value={masukForm.sekolahAsalTujuan}
                  onChange={(e) =>
                    setMasukForm({ ...masukForm, sekolahAsalTujuan: e.target.value })
                  }
                  placeholder="Sekolah sebelumnya"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">No. Surat Pindah</label>
                <input
                  type="text"
                  value={masukForm.nomorSurat}
                  onChange={(e) => setMasukForm({ ...masukForm, nomorSurat: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Nama Wali</label>
                <input
                  type="text"
                  value={masukForm.namaWali}
                  onChange={(e) => setMasukForm({ ...masukForm, namaWali: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Telp Wali</label>
                <input
                  type="text"
                  value={masukForm.telpWali}
                  onChange={(e) => setMasukForm({ ...masukForm, telpWali: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Alasan Kepindahan *</label>
                <textarea
                  rows={2}
                  required
                  value={masukForm.alasan}
                  onChange={(e) => setMasukForm({ ...masukForm, alasan: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsMasukOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingMasuk}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingMasuk ? 'Menyimpan...' : 'Daftarkan Siswa Pindahan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

