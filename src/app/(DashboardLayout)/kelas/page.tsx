'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Building2,
  Users,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  AlertCircle,
  UserCheck,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

interface Jenjang {
  id: number
  kode: string
  nama: string
  tingkat: { id: number; tingkat: string; urutan: number }[]
  jurusan: { id: number; kodeJurusan: string; namaJurusan: string }[]
}

interface Kelas {
  id: number
  namaKelas: string
  jenjangId: number
  tingkatId: number
  jurusanId?: number
  waliKelas?: string
  tahunAjaran: string
  kapasitas: number
  active: boolean
  jenjang: { kode: string; nama: string }
  tingkat: { tingkat: string }
  jurusan?: { kodeJurusan: string; namaJurusan: string }
  _count?: { siswa: number }
}

interface SiswaInKelas {
  id: number
  nis: string
  nisn?: string
  nama: string
  jenisKelamin: string
  status: string
  telpSiswa?: string
  fotoUrl?: string
}

export default function KelasPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/kelas')
  const allowEdit = canEdit('/kelas')
  const allowDelete = canDelete('/kelas')

  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [masterJenjang, setMasterJenjang] = useState<Jenjang[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedJenjang, setSelectedJenjang] = useState('')
  const [selectedTingkat, setSelectedTingkat] = useState('')

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSiswaModalOpen, setIsSiswaModalOpen] = useState(false)
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null)
  const [selectedKelasDetail, setSelectedKelasDetail] = useState<any>(null)
  const [loadingSiswaModal, setLoadingSiswaModal] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    jenjangId: '',
    tingkatId: '',
    jurusanId: '',
    namaKelas: '',
    waliKelas: '',
    tahunAjaran: '2024/2025',
    kapasitas: 36,
    active: true,
  })
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Fetch Master Data & Kelas List
  const fetchKelas = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedJenjang) params.append('jenjangId', selectedJenjang)
      if (selectedTingkat) params.append('tingkatId', selectedTingkat)

      const res = await fetch(`/api/master/kelas?${params.toString()}`)
      const data = await res.json()
      if (data.success) setKelasList(data.data)
    } catch (err) {
      console.error('Fetch kelas error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMaster = async () => {
    try {
      const res = await fetch('/api/master/jenjang')
      const data = await res.json()
      if (data.success) setMasterJenjang(data.data)
    } catch (err) {
      console.error('Fetch master error:', err)
    }
  }

  useEffect(() => {
    fetchMaster()
  }, [])

  useEffect(() => {
    fetchKelas()
  }, [selectedJenjang, selectedTingkat])

  // Hitung Statistik
  const stats = useMemo(() => {
    const totalKelas = kelasList.length
    const totalKapasitas = kelasList.reduce((acc, k) => acc + (k.kapasitas || 0), 0)
    const totalSiswaTerdaftar = kelasList.reduce((acc, k) => acc + (k._count?.siswa || 0), 0)
    const keterisian = totalKapasitas > 0 ? Math.round((totalSiswaTerdaftar / totalKapasitas) * 100) : 0

    return { totalKelas, totalKapasitas, totalSiswaTerdaftar, keterisian }
  }, [kelasList])

  // Filter Tingkat & Jurusan berdasarkan Jenjang yang dipilih di Form
  const formJenjangObj = useMemo(() => {
    if (!formData.jenjangId) return null
    return masterJenjang.find((j) => j.id === parseInt(formData.jenjangId, 10))
  }, [formData.jenjangId, masterJenjang])

  // Open Form Add
  const handleOpenAdd = () => {
    setEditingKelas(null)
    const defaultJenjang = masterJenjang[0]
    setFormData({
      jenjangId: defaultJenjang ? String(defaultJenjang.id) : '',
      tingkatId: defaultJenjang?.tingkat[0] ? String(defaultJenjang.tingkat[0].id) : '',
      jurusanId: '',
      namaKelas: '',
      waliKelas: '',
      tahunAjaran: '2024/2025',
      kapasitas: 36,
      active: true,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  // Open Form Edit
  const handleOpenEdit = (kelas: Kelas) => {
    setEditingKelas(kelas)
    setFormData({
      jenjangId: String(kelas.jenjangId),
      tingkatId: String(kelas.tingkatId),
      jurusanId: kelas.jurusanId ? String(kelas.jurusanId) : '',
      namaKelas: kelas.namaKelas,
      waliKelas: kelas.waliKelas || '',
      tahunAjaran: kelas.tahunAjaran || '2024/2025',
      kapasitas: kelas.kapasitas || 36,
      active: kelas.active,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  // Handle Save
  const handleSaveKelas = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSubmitting(true)

    try {
      const url = editingKelas ? `/api/master/kelas/${editingKelas.id}` : '/api/master/kelas'
      const method = editingKelas ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const resJson = await res.json()

      if (!resJson.success) {
        setFormError(resJson.message || 'Gagal menyimpan rombel kelas')
        return
      }

      setIsFormOpen(false)
      fetchKelas()
    } catch (err: any) {
      setFormError('Terjadi kesalahan jaringan: ' + err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle Delete
  const handleDeleteKelas = async (kelas: Kelas) => {
    if (!window.confirm(`Hapus rombel kelas "${kelas.namaKelas}"?`)) return

    try {
      const res = await fetch(`/api/master/kelas/${kelas.id}`, { method: 'DELETE' })
      const resJson = await res.json()
      if (!resJson.success) {
        alert(resJson.message || 'Gagal menghapus rombel')
        return
      }
      fetchKelas()
    } catch (err: any) {
      alert('Gagal menghapus rombel: ' + err.message)
    }
  }

  // Open Modal Lihat Siswa
  const handleViewSiswa = async (kelas: Kelas) => {
    setIsSiswaModalOpen(true)
    setLoadingSiswaModal(true)
    setSelectedKelasDetail(null)

    try {
      const res = await fetch(`/api/master/kelas/${kelas.id}/siswa`)
      const resJson = await res.json()
      if (resJson.success) {
        setSelectedKelasDetail(resJson.data)
      }
    } catch (err) {
      console.error('Error viewing class students:', err)
    } finally {
      setLoadingSiswaModal(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Rombongan Belajar & Kelas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pengelolaan rombel kelas, alokasi wali kelas, kapasitas ruang, dan daftar siswa terdaftar.
          </p>
        </div>
        {allowCreate && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Tambah Rombel Kelas
          </button>
        )}
      </div>

      {/* Statistik Ringkas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Rombel</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.totalKelas}</p>
          <p className="text-xs text-slate-500">Kelas aktif</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Siswa Terdaftar</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalSiswaTerdaftar}</p>
          <p className="text-xs text-slate-500">Dalam seluruh rombel</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Kapasitas</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalKapasitas}</p>
          <p className="text-xs text-slate-500">Batas daya tampung</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rasio Keterisian</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.keterisian}%</p>
          <p className="text-xs text-slate-500">Persentase bangku terisi</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-64">
            <SearchableSelect
              value={selectedJenjang}
              onChange={(val) => {
                setSelectedJenjang(val)
                setSelectedTingkat('')
              }}
              options={[
                { value: '', label: 'Semua Jenjang' },
                ...masterJenjang.map((j) => ({
                  value: String(j.id),
                  label: `${j.kode} - ${j.nama}`,
                })),
              ]}
              placeholder="Semua Jenjang"
              searchPlaceholder="Cari jenjang..."
            />
          </div>

          {selectedJenjang && (
            <div className="w-full sm:w-48">
              <SearchableSelect
                value={selectedTingkat}
                onChange={(val) => setSelectedTingkat(val)}
                options={[
                  { value: '', label: 'Semua Tingkat' },
                  ...(masterJenjang
                    .find((j) => j.id === parseInt(selectedJenjang, 10))
                    ?.tingkat.map((t) => ({
                      value: String(t.id),
                      label: `Tingkat ${t.tingkat}`,
                    })) || []),
                ]}
                placeholder="Semua Tingkat"
                searchPlaceholder="Cari tingkat..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabel Rombel Kelas */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  Rombel / Kelas
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Jenjang & Tingkat
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Wali Kelas
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Tahun Ajaran
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Keterisian Siswa
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  Status
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Memuat data rombel kelas...
                  </td>
                </tr>
              ) : kelasList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Belum ada rombel kelas yang terdaftar.
                  </td>
                </tr>
              ) : (
                kelasList.map((k) => {
                  const siswaCount = k._count?.siswa || 0
                  const ratio = Math.min(100, Math.round((siswaCount / (k.kapasitas || 36)) * 100))

                  return (
                    <tr
                      key={k.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{k.namaKelas}</span>
                          {k.jurusan && (
                            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                              {k.jurusan.kodeJurusan}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {k.jenjang.kode}
                        </span>{' '}
                        • Tingkat {k.tingkat.tingkat}
                      </td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                        {k.waliKelas || <span className="text-slate-400 italic">Belum ditentukan</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{k.tahunAjaran}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full ${
                                ratio >= 100 ? 'bg-rose-500' : ratio > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {siswaCount} / {k.kapasitas}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            k.active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {k.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewSiswa(k)}
                            title="Lihat Daftar Siswa"
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Siswa ({siswaCount})</span>
                          </button>
                          {allowEdit && (
                            <button
                              onClick={() => handleOpenEdit(k)}
                              title="Edit Rombel"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {allowDelete && (
                            <button
                              onClick={() => handleDeleteKelas(k)}
                              title="Hapus Rombel"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* ======================================================== */}
      {/* MODAL FORM TAMBAH / EDIT KELAS */}
      {/* ======================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingKelas ? 'Ubah Rombel Kelas' : 'Tambah Rombel Baru'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveKelas} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jenjang Pendidikan *
                </label>
                <SearchableSelect
                  value={formData.jenjangId}
                  onChange={(val) => {
                    const found = masterJenjang.find((j) => j.id === parseInt(val, 10))
                    setFormData({
                      ...formData,
                      jenjangId: val,
                      tingkatId: found?.tingkat[0] ? String(found.tingkat[0].id) : '',
                      jurusanId: '',
                    })
                  }}
                  options={masterJenjang.map((j) => ({
                    value: String(j.id),
                    label: `${j.kode} - ${j.nama}`,
                  }))}
                  placeholder="-- Pilih Jenjang --"
                  searchPlaceholder="Cari jenjang..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat Kelas *
                  </label>
                  <SearchableSelect
                    value={formData.tingkatId}
                    onChange={(val) => setFormData({ ...formData, tingkatId: val })}
                    options={(formJenjangObj?.tingkat || []).map((t) => ({
                      value: String(t.id),
                      label: `Tingkat ${t.tingkat}`,
                    }))}
                    placeholder="-- Pilih Tingkat --"
                    searchPlaceholder="Cari tingkat..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Program Jurusan
                  </label>
                  <SearchableSelect
                    value={formData.jurusanId}
                    onChange={(val) => setFormData({ ...formData, jurusanId: val })}
                    disabled={!formJenjangObj || formJenjangObj.jurusan.length === 0}
                    options={[
                      { value: '', label: '-- Tanpa Jurusan / Umum --' },
                      ...(formJenjangObj?.jurusan || []).map((jur) => ({
                        value: String(jur.id),
                        label: `${jur.kodeJurusan} - ${jur.namaJurusan}`,
                      })),
                    ]}
                    placeholder="-- Tanpa Jurusan / Umum --"
                    searchPlaceholder="Cari jurusan..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Rombongan Belajar *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: VII A, X RPL 1, XII IPA 2"
                  value={formData.namaKelas}
                  onChange={(e) => setFormData({ ...formData, namaKelas: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Guru Wali Kelas
                </label>
                <input
                  type="text"
                  placeholder="Nama lengkap guru wali kelas beserta gelar"
                  value={formData.waliKelas}
                  onChange={(e) => setFormData({ ...formData, waliKelas: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tahun Ajaran
                  </label>
                  <input
                    type="text"
                    value={formData.tahunAjaran}
                    onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                    placeholder="2024/2025"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kapasitas Maksimal
                  </label>
                  <input
                    type="number"
                    value={formData.kapasitas}
                    onChange={(e) => setFormData({ ...formData, kapasitas: parseInt(e.target.value, 10) || 36 })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Rombel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL LIHAT SISWA PER ROMBEL (Fitur Spesial SI-MAARIF) */}
      {/* ======================================================== */}
      {isSiswaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Daftar Siswa di Kelas {selectedKelasDetail?.namaKelas}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedKelasDetail?.jenjang?.nama} • Wali Kelas:{' '}
                  {selectedKelasDetail?.waliKelas || 'Belum ditentukan'}
                </p>
              </div>
              <button
                onClick={() => setIsSiswaModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              {loadingSiswaModal ? (
                <p className="py-8 text-center text-sm text-slate-500">Memuat siswa di rombel...</p>
              ) : !selectedKelasDetail?.siswa || selectedKelasDetail.siswa.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-sm text-slate-500">Belum ada siswa yang dialokasikan ke kelas ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {selectedKelasDetail.siswa.map((s: SiswaInKelas) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      {s.fotoUrl ? (
                        <img
                          src={s.fotoUrl}
                          alt={s.nama}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {s.nama.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {s.nama}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          NIS: {s.nis} • {s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <span className="text-xs font-semibold text-slate-500 self-center">
                Total Siswa: {selectedKelasDetail?.siswa?.length || 0} / Kapasitas {selectedKelasDetail?.kapasitas || 36}
              </span>
              <button
                onClick={() => setIsSiswaModalOpen(false)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
