'use client'

import React, { useState, useEffect } from 'react'
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Coins,
} from 'lucide-react'
import { formatRupiah } from '@/lib/terbilang'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

interface TarifItem {
  id: number
  jenjangId: number
  tingkatId?: number
  tahunAjaran: string
  namaTarif: string
  nominal: number
  keterangan?: string
  active: boolean
  jenjang: { kode: string; nama: string }
  tingkat?: { tingkat: string }
}

export default function MasterTarifSppPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/spp/tarif')
  const allowEdit = canEdit('/spp/tarif')
  const allowDelete = canDelete('/spp/tarif')

  const [tarifList, setTarifList] = useState<TarifItem[]>([])
  const [masterJenjang, setMasterJenjang] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedJenjang, setSelectedJenjang] = useState('')
  const [tahunAjaran, setTahunAjaran] = useState('')

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTarif, setEditingTarif] = useState<TarifItem | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    jenjangId: '',
    tingkatId: '',
    tahunAjaran: '2024/2025',
    namaTarif: 'SPP Bulanan',
    nominal: 150000,
    keterangan: '',
    active: true,
  })
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchTarif = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedJenjang) params.append('jenjangId', selectedJenjang)
      if (tahunAjaran) params.append('tahunAjaran', tahunAjaran)

      const res = await fetch(`/api/spp/tarif?${params.toString()}`)
      const data = await res.json()
      if (data.success) setTarifList(data.data)
    } catch (err) {
      console.error('Fetch tarif error:', err)
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
    fetchTarif()
  }, [selectedJenjang, tahunAjaran])

  const handleOpenAdd = () => {
    setEditingTarif(null)
    const defaultJ = masterJenjang[0]
    setFormData({
      jenjangId: defaultJ ? String(defaultJ.id) : '',
      tingkatId: '',
      tahunAjaran: '2024/2025',
      namaTarif: 'SPP Bulanan',
      nominal: 150000,
      keterangan: '',
      active: true,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  const handleOpenEdit = (t: TarifItem) => {
    setEditingTarif(t)
    setFormData({
      jenjangId: String(t.jenjangId),
      tingkatId: t.tingkatId ? String(t.tingkatId) : '',
      tahunAjaran: t.tahunAjaran,
      namaTarif: t.namaTarif,
      nominal: t.nominal,
      keterangan: t.keterangan || '',
      active: t.active,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSubmitting(true)

    try {
      const url = editingTarif ? `/api/spp/tarif/${editingTarif.id}` : '/api/spp/tarif'
      const method = editingTarif ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const resJson = await res.json()

      if (!resJson.success) {
        setFormError(resJson.message || 'Gagal menyimpan tarif SPP')
        return
      }

      setIsFormOpen(false)
      fetchTarif()
    } catch (err: any) {
      setFormError('Terjadi kesalahan: ' + err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (t: TarifItem) => {
    if (!window.confirm(`Hapus tarif ${t.namaTarif} (${t.jenjang.kode})?`)) return

    try {
      const res = await fetch(`/api/spp/tarif/${t.id}`, { method: 'DELETE' })
      const resJson = await res.json()
      if (!resJson.success) {
        alert(resJson.message || 'Gagal menghapus tarif')
        return
      }
      fetchTarif()
    } catch (err: any) {
      alert('Error saat menghapus: ' + err.message)
    }
  }

  const selectedJenjangObj = masterJenjang.find((j) => j.id === parseInt(formData.jenjangId, 10))

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Master Tarif Iuran SPP
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Ketetapan standar besaran tarif iuran SPP bulanan per jenjang, tingkat kelas, dan tahun ajaran.
          </p>
        </div>
        {allowCreate && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Tambah Ketetapan Tarif
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="w-full sm:w-60">
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

        <div className="w-full sm:w-48">
          <SearchableSelect
            value={tahunAjaran}
            onChange={(val) => setTahunAjaran(val)}
            options={[
              { value: '', label: 'Semua Tahun Ajaran' },
              { value: '2024/2025', label: '2024/2025' },
              { value: '2025/2026', label: '2025/2026' },
              { value: '2023/2024', label: '2023/2024' },
            ]}
            placeholder="Semua Tahun Ajaran"
            searchPlaceholder="Cari tahun ajaran..."
          />
        </div>
      </div>

      {/* Tabel Tarif SPP */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  Jenjang & Sasaran Tingkat
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Nama Pos Tarif
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Tahun Ajaran
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Besaran Iuran Bulanan
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Keterangan
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
                    Memuat ketetapan tarif SPP...
                  </td>
                </tr>
              ) : tarifList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Belum ada ketetapan tarif SPP yang didaftarkan.
                  </td>
                </tr>
              ) : (
                tarifList.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {t.jenjang.kode} ({t.jenjang.nama})
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.tingkat ? `Berlaku khusus Tingkat ${t.tingkat.tingkat}` : 'Berlaku untuk semua tingkat'}
                      </p>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {t.namaTarif}
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {t.tahunAjaran}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(t.nominal)}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      {t.keterangan || '-'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          t.active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {t.active ? 'Aktif' : 'Arsip'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {allowEdit && (
                          <button
                            onClick={() => handleOpenEdit(t)}
                            title="Edit Tarif"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {allowDelete && (
                          <button
                            onClick={() => handleDelete(t)}
                            title="Hapus Tarif"
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

      {/* Modal Form Tarif */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingTarif ? 'Ubah Ketetapan Tarif' : 'Tambah Tarif SPP Baru'}
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
                  Jenjang Pendidikan *
                </label>
                <SearchableSelect
                  value={formData.jenjangId}
                  onChange={(val) => setFormData({ ...formData, jenjangId: val, tingkatId: '' })}
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tingkat Kelas (Opsional)
                </label>
                <SearchableSelect
                  value={formData.tingkatId}
                  onChange={(val) => setFormData({ ...formData, tingkatId: val })}
                  options={[
                    { value: '', label: '-- Berlaku Semua Tingkat --' },
                    ...(selectedJenjangObj?.tingkat || []).map((t: any) => ({
                      value: String(t.id),
                      label: `Tingkat ${t.tingkat}`,
                    })),
                  ]}
                  placeholder="-- Berlaku Semua Tingkat --"
                  searchPlaceholder="Cari tingkat kelas..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tahun Ajaran *
                  </label>
                  <input
                    type="text"
                    value={formData.tahunAjaran}
                    onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nama Pos Tarif
                  </label>
                  <input
                    type="text"
                    value={formData.namaTarif}
                    onChange={(e) => setFormData({ ...formData, namaTarif: e.target.value })}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Besaran Iuran Bulanan (Nominal Rp) *
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 150000"
                  value={formData.nominal}
                  onChange={(e) => setFormData({ ...formData, nominal: parseFloat(e.target.value) || 0 })}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <span className="mt-1 block text-xs text-slate-500 font-mono">
                  Format: {formatRupiah(formData.nominal)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Keterangan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Catatan ketetapan rapat komite..."
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
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Ketetapan Tarif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
