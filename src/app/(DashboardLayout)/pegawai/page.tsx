'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  GraduationCap,
  Briefcase,
  Award,
  Plus,
  Pencil,
  Trash2,
  Search,
  Camera,
  X,
  AlertCircle,
  Phone,
  Mail,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

interface Pegawai {
  id: number
  nip?: string
  nama: string
  jenisKelamin: string
  jenisPegawai: string // 'guru', 'staf_tu', 'kepala_sekolah'
  jabatan?: string
  bidangStudi?: string
  kontak?: string
  email?: string
  alamat?: string
  fotoUrl?: string
  statusKepegawaian?: string
  active: boolean
}

export default function PegawaiPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/pegawai')
  const allowEdit = canEdit('/pegawai')
  const allowDelete = canDelete('/pegawai')

  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
  const [stats, setStats] = useState<any>({ total: 0, guru: 0, stafTu: 0, pimpinan: 0 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedJenis, setSelectedJenis] = useState('')

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    jenisKelamin: 'L',
    jenisPegawai: 'guru',
    jabatan: '',
    bidangStudi: '',
    kontak: '',
    email: '',
    alamat: '',
    fotoUrl: '',
    statusKepegawaian: 'tetap',
    active: true,
  })
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchPegawai = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedJenis) params.append('jenisPegawai', selectedJenis)

      const res = await fetch(`/api/pegawai?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setPegawaiList(data.data)
        if (data.meta?.stats) setStats(data.meta.stats)
      }
    } catch (err) {
      console.error('Fetch pegawai error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPegawai()
    }, 250)
    return () => clearTimeout(timer)
  }, [search, selectedJenis])

  const handleOpenAdd = () => {
    setEditingPegawai(null)
    setFormData({
      nip: '',
      nama: '',
      jenisKelamin: 'L',
      jenisPegawai: 'guru',
      jabatan: 'Guru Pengajar',
      bidangStudi: '',
      kontak: '',
      email: '',
      alamat: '',
      fotoUrl: '',
      statusKepegawaian: 'tetap',
      active: true,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  const handleOpenEdit = (p: Pegawai) => {
    setEditingPegawai(p)
    setFormData({
      nip: p.nip || '',
      nama: p.nama,
      jenisKelamin: p.jenisKelamin,
      jenisPegawai: p.jenisPegawai,
      jabatan: p.jabatan || '',
      bidangStudi: p.bidangStudi || '',
      kontak: p.kontak || '',
      email: p.email || '',
      alamat: p.alamat || '',
      fotoUrl: p.fotoUrl || '',
      statusKepegawaian: p.statusKepegawaian || 'tetap',
      active: p.active,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    setFormError('')
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('folder', 'pegawai')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      })
      const resJson = await res.json()
      if (resJson.success) {
        setFormData((prev) => ({ ...prev, fotoUrl: resJson.data.url }))
      } else {
        setFormError(resJson.message || 'Gagal mengunggah foto')
      }
    } catch (err: any) {
      setFormError('Gagal mengunggah foto: ' + err.message)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSubmitting(true)

    try {
      const url = editingPegawai ? `/api/pegawai/${editingPegawai.id}` : '/api/pegawai'
      const method = editingPegawai ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const resJson = await res.json()

      if (!resJson.success) {
        setFormError(resJson.message || 'Gagal menyimpan data pegawai')
        return
      }

      setIsFormOpen(false)
      fetchPegawai()
    } catch (err: any) {
      setFormError('Terjadi kesalahan jaringan: ' + err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (p: Pegawai) => {
    if (!window.confirm(`Hapus data pegawai "${p.nama}"?`)) return

    try {
      const res = await fetch(`/api/pegawai/${p.id}`, { method: 'DELETE' })
      const resJson = await res.json()
      if (!resJson.success) {
        alert(resJson.message || 'Gagal menghapus pegawai')
        return
      }
      fetchPegawai()
    } catch (err: any) {
      alert('Gagal menghapus pegawai: ' + err.message)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Direktori Guru & Pegawai
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola data dewan guru pendidik, staf tata usaha, dan pimpinan sekolah.
          </p>
        </div>
        {allowCreate && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Tambah Tenaga Pendidik / Pegawai
          </button>
        )}
      </div>

      {/* 4 Statistik Pegawai */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Tenaga Kerja</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-slate-500">Pegawai terdaftar</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Guru Pendidik</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <GraduationCap className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.guru}</p>
          <p className="text-xs text-slate-500">Tenaga pengajar aktif</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tata Usaha</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.stafTu}</p>
          <p className="text-xs text-slate-500">Tenaga administrasi</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pimpinan / Kepala</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.pimpinan}</p>
          <p className="text-xs text-slate-500">Pimpinan madrasah/sekolah</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama pegawai, NIP, atau mata pelajaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <SearchableSelect
              value={selectedJenis}
              onChange={(val) => setSelectedJenis(val)}
              options={[
                { value: '', label: 'Semua Kategori' },
                { value: 'guru', label: 'Guru Pengajar' },
                { value: 'staf_tu', label: 'Tata Usaha (TU)' },
                { value: 'kepala_sekolah', label: 'Kepala Sekolah / Pimpinan' },
              ]}
              placeholder="Semua Kategori"
              searchPlaceholder="Cari kategori..."
            />
          </div>
        </div>
      </div>

      {/* Tabel Pegawai */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  Pegawai / Pendidik
                </th>
                <th scope="col" className="px-4 py-3.5">
                  NIP / NUPTK
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Jabatan & Bidang Studi
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  Kategori
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Kontak
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
                    Memuat direktori pegawai...
                  </td>
                </tr>
              ) : pegawaiList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Belum ada data pegawai yang terdaftar.
                  </td>
                </tr>
              ) : (
                pegawaiList.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.fotoUrl ? (
                          <img
                            src={p.fotoUrl}
                            alt={p.nama}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            {p.nama.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {p.nama}
                          </p>
                          <p className="text-xs text-slate-500">
                            {p.statusKepegawaian || 'Pegawai Tetap'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {p.nip || <span className="text-slate-400 italic">Non-NIP</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-slate-200">
                        {p.jabatan || 'Guru'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {p.bidangStudi ? `Mapel: ${p.bidangStudi}` : '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {p.jenisPegawai.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-mono text-slate-800 dark:text-slate-200">{p.kontak || '-'}</p>
                      <p className="text-slate-500">{p.email || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {p.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {allowEdit && (
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Pegawai"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {allowDelete && (
                          <button
                            onClick={() => handleDelete(p)}
                            title="Hapus Pegawai"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Pegawai */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingPegawai ? 'Ubah Data Pegawai' : 'Tambah Pegawai Baru'}
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

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Upload Foto */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    {formData.fotoUrl ? (
                      <img
                        src={formData.fotoUrl}
                        alt="Pas Foto"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                        <Camera className="h-7 w-7" />
                        <span className="text-[10px]">Foto</span>
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {isUploadingPhoto ? 'Mengunggah...' : 'Pilih Foto'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nama Lengkap & Gelar *
                    </label>
                    <input
                      type="text"
                      placeholder="Drs. H. Ahmad Fauzi, M.Pd"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      placeholder="19800101..."
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jenis Kelamin
                    </label>
                    <SearchableSelect
                      value={formData.jenisKelamin}
                      onChange={(val) => setFormData({ ...formData, jenisKelamin: val })}
                      options={[
                        { value: 'L', label: 'Laki-Laki (L)' },
                        { value: 'P', label: 'Perempuan (P)' },
                      ]}
                      placeholder="Pilih jenis kelamin..."
                      searchPlaceholder="Cari..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Pegawai
                  </label>
                  <SearchableSelect
                    value={formData.jenisPegawai}
                    onChange={(val) => setFormData({ ...formData, jenisPegawai: val })}
                    options={[
                      { value: 'guru', label: 'Guru Pengajar' },
                      { value: 'staf_tu', label: 'Tata Usaha (TU)' },
                      { value: 'kepala_sekolah', label: 'Kepala Sekolah / Pimpinan' },
                    ]}
                    placeholder="Pilih kategori pegawai..."
                    searchPlaceholder="Cari kategori..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Jabatan Struktural
                  </label>
                  <input
                    type="text"
                    placeholder="Wakasek Kurikulum, Guru Tetap, dll."
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Bidang / Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    placeholder="Matematika, Bahasa Inggris, dll."
                    value={formData.bidangStudi}
                    onChange={(e) => setFormData({ ...formData, bidangStudi: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="0812..."
                    value={formData.kontak}
                    onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    placeholder="guru@sekolah.sch.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
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
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Pegawai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
