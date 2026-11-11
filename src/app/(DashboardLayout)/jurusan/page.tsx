'use client'

import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Building2,
  Users,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'

interface Jenjang {
  id: number
  kode: string
  nama: string
}

interface Jurusan {
  id: number
  jenjangId: number
  kodeJurusan: string
  namaJurusan: string
  keterangan?: string
  active: boolean
  jenjang: Jenjang
  _count?: {
    kelas: number
    siswa: number
  }
}

export default function JurusanPage() {
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([])
  const [masterJenjang, setMasterJenjang] = useState<Jenjang[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedJenjang, setSelectedJenjang] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingJurusan, setEditingJurusan] = useState<Jurusan | null>(null)

  const [formData, setFormData] = useState({
    jenjangId: '',
    kodeJurusan: '',
    namaJurusan: '',
    keterangan: '',
    active: true,
  })
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchJurusan = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedJenjang) params.append('jenjangId', selectedJenjang)

      const res = await fetch(`/api/master/jurusan?${params.toString()}`)
      const data = await res.json()
      if (data.success) setJurusanList(data.data)
    } catch (err) {
      console.error('Fetch jurusan error:', err)
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
    fetchJurusan()
  }, [selectedJenjang])

  const handleOpenAdd = () => {
    setEditingJurusan(null)
    const defaultJenjang = masterJenjang.find((j) => j.kode === 'SMK' || j.kode === 'SMA') || masterJenjang[0]
    setFormData({
      jenjangId: defaultJenjang ? String(defaultJenjang.id) : '',
      kodeJurusan: '',
      namaJurusan: '',
      keterangan: '',
      active: true,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  const handleOpenEdit = (jur: Jurusan) => {
    setEditingJurusan(jur)
    setFormData({
      jenjangId: String(jur.jenjangId),
      kodeJurusan: jur.kodeJurusan,
      namaJurusan: jur.namaJurusan,
      keterangan: jur.keterangan || '',
      active: jur.active,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSubmitting(true)

    try {
      const url = editingJurusan ? `/api/master/jurusan/${editingJurusan.id}` : '/api/master/jurusan'
      const method = editingJurusan ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const resJson = await res.json()

      if (!resJson.success) {
        setFormError(resJson.message || 'Gagal menyimpan data jurusan')
        return
      }

      setIsFormOpen(false)
      fetchJurusan()
    } catch (err: any) {
      setFormError('Terjadi kesalahan jaringan: ' + err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (jur: Jurusan) => {
    if (!window.confirm(`Hapus jurusan "${jur.namaJurusan}" (${jur.kodeJurusan})?`)) return

    try {
      const res = await fetch(`/api/master/jurusan/${jur.id}`, { method: 'DELETE' })
      const resJson = await res.json()
      if (!resJson.success) {
        alert(resJson.message || 'Gagal menghapus jurusan')
        return
      }
      fetchJurusan()
    } catch (err: any) {
      alert('Gagal menghapus jurusan: ' + err.message)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Program Jurusan & Peminatan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola peminatan akademik dan kompetensi keahlian untuk jenjang pendidikan menengah (SMA/SMK).
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Tambah Jurusan
        </button>
      </div>

      {/* Filter Jenjang */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Jenjang:</label>
        <div className="w-64">
          <SearchableSelect
            value={selectedJenjang}
            onChange={(val) => setSelectedJenjang(val)}
            options={[
              { value: '', label: 'Semua Jenjang' },
              ...masterJenjang.map((j) => ({
                value: String(j.id),
                label: `${j.kode} (${j.nama})`,
              })),
            ]}
            placeholder="Semua Jenjang"
            searchPlaceholder="Cari jenjang..."
          />
        </div>
      </div>

      {/* Tabel Jurusan */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  Kode
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Program Jurusan / Keahlian
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Jenjang
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Keterangan
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  Rombel & Siswa
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
                    Memuat data jurusan...
                  </td>
                </tr>
              ) : jurusanList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Belum ada program jurusan yang didaftarkan.
                  </td>
                </tr>
              ) : (
                jurusanList.map((jur) => (
                  <tr
                    key={jur.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {jur.kodeJurusan}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {jur.namaJurusan}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {jur.jenjang.kode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {jur.keterangan || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" /> {jur._count?.kelas || 0} Kelas •
                        <Users className="h-3.5 w-3.5 text-slate-400" /> {jur._count?.siswa || 0} Siswa
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          jur.active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {jur.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(jur)}
                          title="Edit Jurusan"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(jur)}
                          title="Hapus Jurusan"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Jurusan */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingJurusan ? 'Ubah Program Jurusan' : 'Tambah Jurusan Baru'}
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jenjang Terkait *
                </label>
                <SearchableSelect
                  value={formData.jenjangId}
                  onChange={(val) => setFormData({ ...formData, jenjangId: val })}
                  options={masterJenjang.map((j) => ({
                    value: String(j.id),
                    label: `${j.kode} (${j.nama})`,
                  }))}
                  placeholder="-- Pilih Jenjang --"
                  searchPlaceholder="Cari jenjang..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kode Singkat Jurusan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: RPL, TKJ, MIPA, IPS"
                  value={formData.kodeJurusan}
                  onChange={(e) => setFormData({ ...formData, kodeJurusan: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nama Lengkap Jurusan / Keahlian *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rekayasa Perangkat Lunak"
                  value={formData.namaJurusan}
                  onChange={(e) => setFormData({ ...formData, namaJurusan: e.target.value })}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Fokus kompetensi keahlian..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
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
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Jurusan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
