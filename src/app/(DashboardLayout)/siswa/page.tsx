'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Download,
  Upload,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Camera,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'

interface Jenjang {
  id: number
  kode: string
  nama: string
  tingkat: { id: number; tingkat: string; urutan: number }[]
  jurusan: { id: number; kodeJurusan: string; namaJurusan: string }[]
}

interface KelasItem {
  id: number
  namaKelas: string
  jenjangId: number
  tingkatId: number
  jurusanId?: number
  tingkat?: { tingkat: string }
}

interface Siswa {
  id: number
  nis: string
  nisn?: string
  nama: string
  jenisKelamin: string
  jenjangId: number
  kelasId?: number
  jurusanId?: number
  status: string
  tahunMasuk?: number
  tahunKeluar?: number
  tempatLahir?: string
  tanggalLahir?: string
  alamat?: string
  telpSiswa?: string
  emailSiswa?: string
  namaWali?: string
  telpWali?: string
  hubunganWali?: string
  pekerjaanWali?: string
  prestasi?: string
  fotoUrl?: string
  jenjang?: { kode: string; nama: string }
  kelas?: { namaKelas: string; tingkat?: { tingkat: string } }
  jurusan?: { kodeJurusan: string; namaJurusan: string }
}

interface StatsData {
  totalSiswa: number
  aktifTotal: number
  alumniTotal: number
  mutasiTotal: number
  lakiTotal: number
  perempuanTotal: number
  jenjangBreakdown: {
    jenjangId: number
    kode: string
    nama: string
    totalSiswaAktif: number
  }[]
}

export default function SiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [masterJenjang, setMasterJenjang] = useState<Jenjang[]>([])
  const [allKelas, setAllKelas] = useState<KelasItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedJenjang, setSelectedJenjang] = useState('')
  const [selectedKelas, setSelectedKelas] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedGender, setSelectedGender] = useState('')

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null)
  const [viewingSiswa, setViewingSiswa] = useState<Siswa | null>(null)

  // Form State
  const [formData, setFormData] = useState<any>({
    jenjangId: '',
    kelasId: '',
    jurusanId: '',
    nis: '',
    nisn: '',
    nama: '',
    jenisKelamin: 'L',
    tahunMasuk: new Date().getFullYear(),
    status: 'aktif',
    tempatLahir: '',
    tanggalLahir: '',
    alamat: '',
    telpSiswa: '',
    emailSiswa: '',
    namaWali: '',
    telpWali: '',
    hubunganWali: 'Orang Tua',
    pekerjaanWali: '',
    prestasi: '',
    fotoUrl: '',
  })
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  // Load Data
  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedJenjang) params.append('jenjangId', selectedJenjang)
      if (selectedKelas) params.append('kelasId', selectedKelas)
      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedGender) params.append('jenisKelamin', selectedGender)

      const [resSiswa, resStats] = await Promise.all([
        fetch(`/api/siswa?${params.toString()}`),
        fetch('/api/siswa/stats'),
      ])

      const dataSiswa = await resSiswa.json()
      const dataStats = await resStats.json()

      if (dataSiswa.success) setSiswaList(dataSiswa.data)
      if (dataStats.success) setStats(dataStats.data)
    } catch (err) {
      console.error('Fetch siswa error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMaster = async () => {
    try {
      const [resJenjang, resKelas] = await Promise.all([
        fetch('/api/master/jenjang'),
        fetch('/api/master/kelas'),
      ])
      const dataJenjang = await resJenjang.json()
      const dataKelas = await resKelas.json()

      if (dataJenjang.success) setMasterJenjang(dataJenjang.data)
      if (dataKelas.success) setAllKelas(dataKelas.data)
    } catch (err) {
      console.error('Fetch master error:', err)
    }
  }

  useEffect(() => {
    fetchMaster()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 250)
    return () => clearTimeout(timer)
  }, [search, selectedJenjang, selectedKelas, selectedStatus, selectedGender])

  // Filter kelas untuk dropdown berdasarkan jenjang yang dipilih
  const availableKelas = useMemo(() => {
    if (!formData.jenjangId) return allKelas
    return allKelas.filter((k) => k.jenjangId === parseInt(formData.jenjangId, 10))
  }, [formData.jenjangId, allKelas])

  const currentJenjangObj = useMemo(() => {
    if (!formData.jenjangId) return null
    return masterJenjang.find((j) => j.id === parseInt(formData.jenjangId, 10))
  }, [formData.jenjangId, masterJenjang])

  // Reset form
  const handleOpenAdd = () => {
    setEditingSiswa(null)
    const defaultJenjang = masterJenjang[0]?.id ? String(masterJenjang[0].id) : ''
    setFormData({
      jenjangId: defaultJenjang,
      kelasId: '',
      jurusanId: '',
      nis: '',
      nisn: '',
      nama: '',
      jenisKelamin: 'L',
      tahunMasuk: new Date().getFullYear(),
      status: 'aktif',
      tempatLahir: '',
      tanggalLahir: '',
      alamat: '',
      telpSiswa: '',
      emailSiswa: '',
      namaWali: '',
      telpWali: '',
      hubunganWali: 'Orang Tua',
      pekerjaanWali: '',
      prestasi: '',
      fotoUrl: '',
    })
    setFormError('')
    setIsFormOpen(true)
  }

  const handleOpenEdit = (siswa: Siswa) => {
    setEditingSiswa(siswa)
    setFormData({
      jenjangId: String(siswa.jenjangId),
      kelasId: siswa.kelasId ? String(siswa.kelasId) : '',
      jurusanId: siswa.jurusanId ? String(siswa.jurusanId) : '',
      nis: siswa.nis,
      nisn: siswa.nisn || '',
      nama: siswa.nama,
      jenisKelamin: siswa.jenisKelamin,
      tahunMasuk: siswa.tahunMasuk || new Date().getFullYear(),
      status: siswa.status,
      tempatLahir: siswa.tempatLahir || '',
      tanggalLahir: siswa.tanggalLahir ? siswa.tanggalLahir.split('T')[0] : '',
      alamat: siswa.alamat || '',
      telpSiswa: siswa.telpSiswa || '',
      emailSiswa: siswa.emailSiswa || '',
      namaWali: siswa.namaWali || '',
      telpWali: siswa.telpWali || '',
      hubunganWali: siswa.hubunganWali || 'Orang Tua',
      pekerjaanWali: siswa.pekerjaanWali || '',
      prestasi: siswa.prestasi || '',
      fotoUrl: siswa.fotoUrl || '',
    })
    setFormError('')
    setIsFormOpen(true)
  }

  // Handle Foto Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    setFormError('')
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('folder', 'siswa')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      })
      const resJson = await res.json()
      if (resJson.success) {
        setFormData((prev: any) => ({ ...prev, fotoUrl: resJson.data.url }))
      } else {
        setFormError(resJson.message || 'Gagal mengunggah foto')
      }
    } catch (err: any) {
      setFormError('Gagal mengunggah foto: ' + err.message)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Handle Save
  const handleSaveSiswa = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSubmitting(true)

    try {
      const url = editingSiswa ? `/api/siswa/${editingSiswa.id}` : '/api/siswa'
      const method = editingSiswa ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const resJson = await res.json()
      if (!resJson.success) {
        setFormError(resJson.message || 'Gagal menyimpan data siswa')
        return
      }

      setIsFormOpen(false)
      fetchData()
    } catch (err: any) {
      setFormError('Terjadi kesalahan jaringan: ' + err.message)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Handle Delete
  const handleDeleteSiswa = async (siswa: Siswa) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus data siswa "${siswa.nama}" (NIS: ${siswa.nis})?`
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/siswa/${siswa.id}`, { method: 'DELETE' })
      const resJson = await res.json()
      if (!resJson.success) {
        alert(resJson.message || 'Gagal menghapus siswa')
        return
      }
      fetchData()
    } catch (err: any) {
      alert('Gagal menghapus siswa: ' + err.message)
    }
  }

  // Handle Import Submit
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) return

    setImportLoading(true)
    setImportResult(null)

    try {
      const data = new FormData()
      data.append('file', importFile)

      const res = await fetch('/api/siswa/import', {
        method: 'POST',
        body: data,
      })
      const resJson = await res.json()
      setImportResult(resJson)
      if (resJson.success) {
        fetchData()
      }
    } catch (err: any) {
      setImportResult({ success: false, message: 'Gagal mengirim berkas: ' + err.message })
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Data Peserta Didik
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola data pokok siswa, pemetaan kelas & jurusan, serta ekspor-impor berkas kesiswaan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/siswa/export?jenjangId=${selectedJenjang}&kelasId=${selectedKelas}&status=${selectedStatus}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-[#3B82F6] hover:text-[#1E3A8A] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Ekspor CSV
          </a>
          <button
            onClick={() => {
              setImportFile(null)
              setImportResult(null)
              setIsImportOpen(true)
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-[#3B82F6] hover:text-[#1E3A8A] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Impor CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 transition dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* 6 Statistik Kesiswaan */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-[#1E3A8A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Siswa</span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSiswa}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Terdaftar di sistem</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Siswa Aktif</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.aktifTotal}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sedang menempuh studi</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-indigo-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Laki-Laki</span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.lakiTotal}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Siswa aktif</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-pink-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Perempuan</span>
              <div className="rounded-lg bg-pink-50 p-2 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-pink-600 dark:text-pink-400">{stats.perempuanTotal}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Siswi aktif</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-[#F59E0B]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Alumni</span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.alumniTotal}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Telah lulus</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-rose-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mutasi / Keluar</span>
              <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                <UserX className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.mutasiTotal}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pindah sekolah</p>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIS, NISN, atau nama wali..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <SearchableSelect
              value={selectedJenjang}
              onChange={(val) => {
                setSelectedJenjang(val)
                setSelectedKelas('')
              }}
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

          <div>
            <SearchableSelect
              value={selectedKelas}
              onChange={(val) => setSelectedKelas(val)}
              options={[
                { value: '', label: 'Semua Kelas' },
                ...allKelas
                  .filter((k) => (!selectedJenjang ? true : k.jenjangId === parseInt(selectedJenjang, 10)))
                  .map((k) => ({
                    value: String(k.id),
                    label: k.namaKelas,
                  })),
              ]}
              placeholder="Semua Kelas"
              searchPlaceholder="Cari kelas..."
            />
          </div>

          <div>
            <SearchableSelect
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'aktif', label: 'Aktif' },
                { value: 'alumni', label: 'Alumni' },
                { value: 'mutasi', label: 'Mutasi' },
              ]}
              placeholder="Semua Status"
              searchPlaceholder="Cari status..."
            />
          </div>
        </div>
      </div>

      {/* Tabel Data Siswa */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-100/90 text-xs uppercase text-[#1E3A8A] font-semibold dark:border-slate-800 dark:bg-slate-800/60 dark:text-blue-300">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  Peserta Didik
                </th>
                <th scope="col" className="px-4 py-3.5">
                  NIS / NISN
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Jenjang & Rombel
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  L/P
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  Status
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Kontak / Wali
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 [&>tr:nth-child(even)]:bg-slate-50/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : siswaList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada data siswa yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                siswaList.map((siswa) => (
                  <tr
                    key={siswa.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {siswa.fotoUrl ? (
                          <img
                            src={siswa.fotoUrl}
                            alt={siswa.nama}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {siswa.nama.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {siswa.nama}
                          </p>
                          <p className="text-xs text-slate-500">
                            Masuk: {siswa.tahunMasuk || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="font-medium text-slate-900 dark:text-slate-200">
                        {siswa.nis}
                      </div>
                      <div className="text-slate-500">{siswa.nisn || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-200">
                        {siswa.kelas?.namaKelas || 'Belum Masuk Kelas'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {siswa.jenjang?.kode}
                        {siswa.jurusan ? ` • ${siswa.jurusan.kodeJurusan}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                          siswa.jenisKelamin === 'L'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300'
                        }`}
                      >
                        {siswa.jenisKelamin}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          siswa.status === 'aktif'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : siswa.status === 'alumni'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {siswa.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="text-slate-800 dark:text-slate-200">
                        {siswa.namaWali || '-'}
                      </p>
                      <p className="text-slate-500 font-mono">
                        {siswa.telpWali || siswa.telpSiswa || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setViewingSiswa(siswa)
                            setIsDetailOpen(true)
                          }}
                          title="Lihat Detail Siswa"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(siswa)}
                          title="Ubah Data Siswa"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSiswa(siswa)}
                          title="Hapus Siswa"
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

      {/* ======================================================== */}
      {/* MODAL FORM TAMBAH / EDIT SISWA */}
      {/* ======================================================== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingSiswa ? 'Ubah Data Siswa' : 'Tambah Peserta Didik Baru'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
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

            <form onSubmit={handleSaveSiswa} className="mt-4 space-y-6">
              {/* Bagian Foto & Data Pokok */}
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {/* Upload Foto */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    {formData.fotoUrl ? (
                      <img
                        src={formData.fotoUrl}
                        alt="Pas Foto"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                        <Camera className="h-8 w-8" />
                        <span className="text-[10px]">Pas Foto</span>
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

                {/* Input Pokok */}
                <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Jenjang Pendidikan *
                    </label>
                    <SearchableSelect
                      value={formData.jenjangId}
                      onChange={(val) =>
                        setFormData({
                          ...formData,
                          jenjangId: val,
                          kelasId: '',
                          jurusanId: '',
                        })
                      }
                      options={masterJenjang.map((j) => ({
                        value: String(j.id),
                        label: `${j.kode} - ${j.nama}`,
                      }))}
                      placeholder="-- Pilih Jenjang --"
                      searchPlaceholder="Cari jenjang..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rombel / Kelas
                    </label>
                    <SearchableSelect
                      value={formData.kelasId}
                      onChange={(val) => setFormData({ ...formData, kelasId: val })}
                      options={[
                        { value: '', label: '-- Belum Ditentukan --' },
                        ...availableKelas.map((k) => ({
                          value: String(k.id),
                          label: k.namaKelas,
                        })),
                      ]}
                      placeholder="-- Belum Ditentukan --"
                      searchPlaceholder="Cari kelas..."
                    />
                  </div>

                  {currentJenjangObj && currentJenjangObj.jurusan.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Program Jurusan / Keahlian
                      </label>
                      <SearchableSelect
                        value={formData.jurusanId}
                        onChange={(val) => setFormData({ ...formData, jurusanId: val })}
                        options={[
                          { value: '', label: '-- Pilih Jurusan --' },
                          ...currentJenjangObj.jurusan.map((jur) => ({
                            value: String(jur.id),
                            label: `${jur.kodeJurusan} - ${jur.namaJurusan}`,
                          })),
                        ]}
                        placeholder="-- Pilih Jurusan --"
                        searchPlaceholder="Cari jurusan..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nomor Induk Siswa (NIS) *
                    </label>
                    <input
                      type="text"
                      value={formData.nis}
                      onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                      placeholder="e.g. 2024001"
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      NISN (Nasional)
                    </label>
                    <input
                      type="text"
                      value={formData.nisn}
                      onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                      placeholder="10 digit nomor nasional"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nama Lengkap Peserta Didik *
                    </label>
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Nama lengkap sesuai akta kelahiran"
                      required
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Biodata & Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin *
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Kesiswaan
                  </label>
                  <SearchableSelect
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={[
                      { value: 'aktif', label: 'Aktif' },
                      { value: 'alumni', label: 'Alumni' },
                      { value: 'mutasi', label: 'Mutasi / Keluar' },
                    ]}
                    placeholder="Pilih status..."
                    searchPlaceholder="Cari..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tahun Masuk
                  </label>
                  <input
                    type="number"
                    value={formData.tahunMasuk}
                    onChange={(e) => setFormData({ ...formData, tahunMasuk: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={formData.tempatLahir}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No. Handphone Siswa
                  </label>
                  <input
                    type="text"
                    value={formData.telpSiswa}
                    onChange={(e) => setFormData({ ...formData, telpSiswa: e.target.value })}
                    placeholder="0812..."
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Data Orang Tua & Wali */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Data Orang Tua / Wali
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nama Wali / Orang Tua
                    </label>
                    <input
                      type="text"
                      value={formData.namaWali}
                      onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No. Kontak Wali
                    </label>
                    <input
                      type="text"
                      value={formData.telpWali}
                      onChange={(e) => setFormData({ ...formData, telpWali: e.target.value })}
                      placeholder="08..."
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Hubungan Wali
                    </label>
                    <input
                      type="text"
                      value={formData.hubunganWali}
                      onChange={(e) => setFormData({ ...formData, hubunganWali: e.target.value })}
                      placeholder="Ayah / Ibu / Paman"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Alamat & Prestasi */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Alamat Lengkap Domisili
                  </label>
                  <textarea
                    rows={2}
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Catatan Prestasi / Rekam Jejak
                  </label>
                  <textarea
                    rows={2}
                    value={formData.prestasi}
                    onChange={(e) => setFormData({ ...formData, prestasi: e.target.value })}
                    placeholder="Juara 1 Lomba Cerdas Cermat, dll."
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
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
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Data Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETAIL SISWA */}
      {/* ======================================================== */}
      {isDetailOpen && viewingSiswa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            {/* Header Profil */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                  Profil Peserta Didik
                </span>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-full bg-white/10 p-1 text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-4">
                {viewingSiswa.fotoUrl ? (
                  <img
                    src={viewingSiswa.fotoUrl}
                    alt={viewingSiswa.nama}
                    className="h-20 w-20 rounded-full border-4 border-white/30 object-cover shadow"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-2xl font-bold">
                    {viewingSiswa.nama.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{viewingSiswa.nama}</h3>
                  <p className="text-sm text-blue-100">
                    NIS: {viewingSiswa.nis} {viewingSiswa.nisn ? `• NISN: ${viewingSiswa.nisn}` : ''}
                  </p>
                  <span className="mt-1 inline-block rounded-md bg-white/20 px-2 py-0.5 text-xs font-medium">
                    {viewingSiswa.status.toUpperCase()} • {viewingSiswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rincian Tab */}
            <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Jenjang & Kelas</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {viewingSiswa.jenjang?.kode} - {viewingSiswa.kelas?.namaKelas || 'Belum ada kelas'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Program Jurusan</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {viewingSiswa.jurusan ? viewingSiswa.jurusan.namaJurusan : 'Umum (Tidak Ada)'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Tempat, Tgl Lahir</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {viewingSiswa.tempatLahir || '-'}{' '}
                    {viewingSiswa.tanggalLahir ? `, ${new Date(viewingSiswa.tanggalLahir).toLocaleDateString('id-ID')}` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">No. Kontak Siswa</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {viewingSiswa.telpSiswa || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Wali Murid</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {viewingSiswa.namaWali || '-'} ({viewingSiswa.hubunganWali || 'Wali'})
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">No. Kontak Wali</span>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {viewingSiswa.telpWali || '-'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Alamat Tempat Tinggal</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {viewingSiswa.alamat || '-'}
                </p>
              </div>

              {viewingSiswa.prestasi && (
                <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/40">
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Catatan Prestasi
                  </span>
                  <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
                    {viewingSiswa.prestasi}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-800/50">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL IMPOR MASSAL SISWA CSV */}
      {/* ======================================================== */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Impor Massal Siswa via CSV
                </h2>
              </div>
              <button
                onClick={() => setIsImportOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-blue-50 p-4 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                <p className="font-semibold">Format Urutan Kolom CSV:</p>
                <code className="mt-1 block overflow-x-auto rounded bg-blue-100/70 p-2 font-mono text-[11px] text-blue-950 dark:bg-blue-900/60 dark:text-blue-100">
                  NIS, NISN, Nama Lengkap, Jenis Kelamin (L/P), Jenjang (SD/SMP/SMA/SMK), Nama Kelas, Kode Jurusan, Status, Tahun Masuk
                </code>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Tip: Pastikan kode jenjang sesuai (misal: SMP, SMA, SMK) dan nama kelas sudah ada di menu Rombel.
                </p>
              </div>

              <form onSubmit={handleImportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Berkas CSV
                  </label>
                  <input
                    type="file"
                    accept=".csv, text/csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:file:bg-blue-950 dark:file:text-blue-300"
                  />
                </div>

                {importResult && (
                  <div
                    className={`rounded-lg p-4 text-xs ${
                      importResult.success
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                        : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {importResult.success ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span>{importResult.message}</span>
                    </div>

                    {importResult.data?.errors?.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                        {importResult.data.errors.map((err: any, idx: number) => (
                          <p key={idx} className="font-mono text-[11px] text-rose-600 dark:text-rose-300">
                            Baris {err.row}: {err.error} (NIS: {err.nis || '-'})
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImportOpen(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={!importFile || importLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
                  >
                    {importLoading ? 'Memproses...' : 'Mulai Impor Siswa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
