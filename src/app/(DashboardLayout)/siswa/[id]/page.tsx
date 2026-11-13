'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Award,
  BookOpen,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  Printer,
  Receipt,
  ShieldCheck,
  Pencil,
  Trash2,
  ExternalLink,
  GraduationCap,
  Building2,
  Sparkles,
  Camera,
  X,
  Coins,
  ChevronRight,
  Send,
  QrCode,
} from 'lucide-react'
import { formatRupiah, BULAN_AKADEMIK } from '@/lib/terbilang'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'
import KartuSiswaModal from '@/components/siswa/KartuSiswaModal'

interface Jenjang {
  id: number
  kode: string
  nama: string
}

interface KelasItem {
  id: number
  namaKelas: string
  jenjangId: number
  tingkatId: number
  jurusanId?: number
  tingkat?: { tingkat: string }
}

export default function DetailSiswaPage() {
  const params = useParams()
  const router = useRouter()
  const siswaId = params?.id as string

  const { canEdit, canDelete } = usePermission()
  const allowEdit = canEdit('/siswa')
  const allowDelete = canDelete('/siswa')

  // Data states
  const [loading, setLoading] = useState(true)
  const [loadingSpp, setLoadingSpp] = useState(false)
  const [siswa, setSiswa] = useState<any>(null)
  const [sppData, setSppData] = useState<any>(null)
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025')
  const [activeTab, setActiveTab] = useState<'spp' | 'biodata' | 'kedisiplinan'>('spp')
  const [sekolah, setSekolah] = useState<any>(null)
  const [isKartuModalOpen, setIsKartuModalOpen] = useState(false)

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState('')

  // Master options for edit modal
  const [masterJenjang, setMasterJenjang] = useState<Jenjang[]>([])
  const [masterKelas, setMasterKelas] = useState<KelasItem[]>([])

  // Fetch Siswa Details
  const fetchSiswa = async () => {
    if (!siswaId) return
    try {
      const res = await fetch(`/api/siswa/${siswaId}`)
      const json = await res.json()
      if (json.success && json.data) {
        setSiswa(json.data)
      } else {
        alert(json.message || 'Siswa tidak ditemukan')
        router.push('/siswa')
      }
    } catch (err: any) {
      console.error('Fetch siswa error:', err)
      alert('Gagal memuat profil siswa')
    }
  }

  // Fetch SPP Data for specified academic year
  const fetchSpp = async (ta: string) => {
    if (!siswaId) return
    setLoadingSpp(true)
    try {
      const res = await fetch(`/api/spp/siswa/${siswaId}?tahunAjaran=${encodeURIComponent(ta)}`)
      const json = await res.json()
      if (json.success && json.data) {
        setSppData(json.data)
      }
    } catch (err: any) {
      console.error('Fetch SPP error:', err)
    } finally {
      setLoadingSpp(false)
    }
  }

  // Fetch Profil Sekolah untuk Kartu Siswa
  const fetchSekolah = async () => {
    try {
      const res = await fetch('/api/pengaturan/sekolah')
      const json = await res.json()
      if (json.success) setSekolah(json.data)
    } catch (err) {
      console.error('Fetch sekolah error:', err)
    }
  }

  // Fetch Master Data for Edit Form
  const fetchMasters = async () => {
    try {
      const [resJ, resK] = await Promise.all([
        fetch('/api/master/jenjang'),
        fetch('/api/master/kelas'),
      ])
      const jsonJ = await resJ.json()
      const jsonK = await resK.json()
      if (jsonJ.success) setMasterJenjang(jsonJ.data)
      if (jsonK.success) setMasterKelas(jsonK.data)
    } catch (err) {
      console.error('Fetch master error:', err)
    }
  }

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      let activeTa = tahunAjaran
      try {
        const resTa = await fetch('/api/akademik/tahun-ajaran/aktif')
        const jsonTa = await resTa.json()
        if (jsonTa.success && jsonTa.data?.activePeriod?.nama) {
          activeTa = jsonTa.data.activePeriod.nama
          setTahunAjaran(activeTa)
        }
      } catch {
        // fallback to default
      }
      await Promise.all([fetchSiswa(), fetchSpp(activeTa), fetchMasters(), fetchSekolah()])
      setLoading(false)
    }
    loadAll()
  }, [siswaId])

  const handleTahunAjaranChange = (newTa: string) => {
    setTahunAjaran(newTa)
    fetchSpp(newTa)
  }

  // Open Edit Modal with prefilled values
  const handleOpenEdit = () => {
    if (!siswa) return
    setEditFormData({
      jenjangId: String(siswa.jenjangId || ''),
      kelasId: siswa.kelasId ? String(siswa.kelasId) : '',
      jurusanId: siswa.jurusanId ? String(siswa.jurusanId) : '',
      nis: siswa.nis || '',
      nisn: siswa.nisn || '',
      nama: siswa.nama || '',
      jenisKelamin: siswa.jenisKelamin || 'L',
      tahunMasuk: siswa.tahunMasuk || new Date().getFullYear(),
      status: siswa.status || 'aktif',
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
    setEditError('')
    setIsEditModalOpen(true)
  }

  // Handle Photo Upload in Edit Modal
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    setEditError('')
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('folder', 'siswa')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      })
      const json = await res.json()
      if (json.success) {
        setEditFormData((prev: any) => ({ ...prev, fotoUrl: json.data.url }))
      } else {
        setEditError(json.message || 'Gagal mengunggah foto siswa')
      }
    } catch (err: any) {
      setEditError('Error unggah foto: ' + err.message)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Submit Edit Form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError('')
    setEditSubmitting(true)

    try {
      const res = await fetch(`/api/siswa/${siswaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })
      const json = await res.json()
      if (json.success) {
        setIsEditModalOpen(false)
        await fetchSiswa()
        await fetchSpp(tahunAjaran)
      } else {
        setEditError(json.message || 'Gagal memperbarui data siswa')
      }
    } catch (err: any) {
      setEditError('Terjadi kesalahan: ' + err.message)
    } finally {
      setEditSubmitting(false)
    }
  }

  // Handle Delete
  const handleDelete = async () => {
    if (!siswa) return
    const confirmed = confirm(`Yakin ingin menghapus siswa "${siswa.nama}" (NIS: ${siswa.nis})?`)
    if (!confirmed) return

    try {
      const res = await fetch(`/api/siswa/${siswaId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        alert('Siswa berhasil dihapus')
        router.push('/siswa')
      } else {
        alert(json.message || 'Gagal menghapus siswa')
      }
    } catch (err: any) {
      alert('Error hapus: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Memuat profil dan data pembayaran siswa...</p>
      </div>
    )
  }

  if (!siswa) return null

  // Format Tanggal Lahir & Hitung Umur
  let tglLahirFormatted = '-'
  let umurText = ''
  if (siswa.tanggalLahir) {
    const d = new Date(siswa.tanggalLahir)
    tglLahirFormatted = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const ageDiffMs = Date.now() - d.getTime()
    const ageDate = new Date(ageDiffMs)
    const age = Math.abs(ageDate.getUTCFullYear() - 1970)
    if (!isNaN(age)) {
      umurText = ` (${age} tahun)`
    }
  }

  // Summary Finansial
  const summary = sppData?.summary || {
    totalBulanTerbayar: 0,
    totalBulanTunggakan: 12,
    totalNominalTerbayar: 0,
    totalEstimasiTunggakan: 0,
  }
  const tarifNominal = sppData?.tarifNominal || 150000
  const months = sppData?.months || []
  const riwayatTransaksi = sppData?.riwayatTransaksi || []
  const listTahunAjaran = sppData?.listTahunAjaran || ['2024/2025', '2023/2024']

  return (
    <div className="space-y-6 pb-16">
      {/* ======================================================== */}
      {/* 1. TOP BREADCRUMB & ACTION BAR */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/siswa" className="hover:text-blue-600 transition-colors">
              Data Peserta Didik
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[200px]">
              {siswa.nama}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <Link
              href="/siswa"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali</span>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Detail Lengkap Siswa
            </h1>
          </div>
        </div>

        {/* Action Buttons Top */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Pay di Kasir */}
          <Link
            href={`/spp/kasir?siswaId=${siswa.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition"
          >
            <Wallet className="h-4 w-4" />
            <span>Bayar SPP di Kasir</span>
          </Link>

          {/* Kartu Siswa & QR Code */}
          <button
            onClick={() => setIsKartuModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-xs hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60 transition"
            title="Lihat & Cetak Kartu Siswa Ber-QR Code"
          >
            <QrCode className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Kartu Pelajar</span>
          </button>

          {/* Edit Siswa */}
          {allowEdit && (
            <button
              onClick={handleOpenEdit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-amber-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
            >
              <Pencil className="h-3.5 w-3.5 text-amber-500" />
              <span>Ubah Data</span>
            </button>
          )}

          {/* Cetak Profil */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
            title="Cetak Halaman Ini"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Cetak</span>
          </button>

          {/* Hapus Siswa */}
          {allowDelete && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white p-2 text-xs font-semibold text-rose-600 shadow-xs hover:bg-rose-50 dark:border-red-900/40 dark:bg-slate-900 dark:hover:bg-rose-950/40 transition"
              title="Hapus Siswa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. HERO PROFILE CARD */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Profile Left: Avatar + Details */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Foto Profil */}
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs dark:border-slate-700 dark:bg-slate-800">
              {siswa.fotoUrl ? (
                <img
                  src={siswa.fotoUrl}
                  alt={siswa.nama}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-2xl sm:text-3xl font-bold text-white">
                  {siswa.nama.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Identitas Utama */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {siswa.nama}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    siswa.status === 'aktif'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900/40'
                      : siswa.status === 'alumni'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/40'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/40'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      siswa.status === 'aktif'
                        ? 'bg-emerald-500'
                        : siswa.status === 'alumni'
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  {siswa.status?.toUpperCase()}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    siswa.jenisKelamin === 'L'
                      ? 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50'
                      : 'bg-pink-50 text-pink-700 border border-pink-100 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-900/50'
                  }`}
                >
                  {siswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
                {siswa.tahunMasuk && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    Angkatan {siswa.tahunMasuk}
                  </span>
                )}
              </div>

              {/* Data Akademik & Identifikasi */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono">
                  NIS: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{siswa.nis}</strong>
                </span>
                {siswa.nisn && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono">
                      NISN: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{siswa.nisn}</strong>
                    </span>
                  </>
                )}
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>
                    {siswa.jenjang?.kode} - {siswa.kelas?.namaKelas || 'Belum masuk kelas'}
                    {siswa.jurusan ? ` (${siswa.jurusan.kodeJurusan})` : ''}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Quick Financial Summary Widget */}
          <div className="flex-shrink-0 flex items-center justify-between sm:justify-start gap-4 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                summary.totalEstimasiTunggakan > 0
                  ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/30'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30'
              }`}
            >
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Sisa Tunggakan SPP ({tahunAjaran})
              </p>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-lg font-bold font-mono tracking-tight ${
                    summary.totalEstimasiTunggakan > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatRupiah(summary.totalEstimasiTunggakan)}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  ({summary.totalBulanTunggakan} bln)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider & Contact Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Telepon Siswa */}
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Phone className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] text-slate-400">Telp Siswa</span>
              {siswa.telpSiswa ? (
                <a
                  href={`https://wa.me/${siswa.telpSiswa.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-slate-700 hover:text-blue-600 hover:underline dark:text-slate-200 truncate block"
                >
                  {siswa.telpSiswa}
                </a>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </div>
          </div>

          {/* Kontak Wali */}
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] text-slate-400">Wali ({siswa.hubunganWali || 'Wali'})</span>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-700 dark:text-slate-200 truncate" title={siswa.namaWali || ''}>
                  {siswa.namaWali || '-'}
                </span>
                {siswa.telpWali && (
                  <a
                    href={`https://wa.me/${siswa.telpWali.replace(/\D/g, '')}?text=Assalamu%27alaikum%20Bapak%2FIbu%20Wali%20dari%20${encodeURIComponent(siswa.nama)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                    title="Kirim WhatsApp ke Wali"
                  >
                    <Send className="h-2.5 w-2.5" />
                    <span>WA</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Alamat */}
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] text-slate-400">Alamat Tempat Tinggal</span>
              <span className="font-medium text-slate-700 dark:text-slate-200 truncate block" title={siswa.alamat || ''}>
                {siswa.alamat || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TABS NAVIGASI */}
      {/* ======================================================== */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('spp')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === 'spp'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Informasi Pembayaran SPP & Tagihan</span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            12 Bulan
          </span>
        </button>

        <button
          onClick={() => setActiveTab('biodata')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === 'biodata'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Biodata Lengkap & Riwayat Kesiswaan</span>
        </button>

        <button
          onClick={() => setActiveTab('kedisiplinan')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === 'kedisiplinan'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Kedisiplinan &amp; Poin BK</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {siswa?.kedisiplinan?.length || 0}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 4. TAB 1: INFORMASI PEMBAYARAN SPP SISWA */}
      {/* ======================================================== */}
      {activeTab === 'spp' && (
        <div className="space-y-6">
          {/* Filter Tahun Ajaran & Quick Action */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Status Tagihan & Iuran SPP
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih siklus tahun ajaran akademik untuk melihat rekapitulasi 12 bulan dan daftar transaksi kuitansi.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                Tahun Ajaran:
              </label>
              <div className="w-44">
                <SearchableSelect
                  value={tahunAjaran}
                  onChange={(val) => handleTahunAjaranChange(val)}
                  options={listTahunAjaran.map((ta: string) => ({
                    value: ta,
                    label: `T.A. ${ta}`,
                  }))}
                  placeholder="Pilih Tahun Ajaran"
                  searchPlaceholder="Cari T.A..."
                />
              </div>
            </div>
          </div>

          {/* 4 Kartu KPI Finansial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tarif Ketetapan */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tarif Ketetapan SPP</p>
                <h4 className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {formatRupiah(tarifNominal)}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Per bulan / siswa</p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Coins className="h-5 w-5" />
              </div>
            </div>

            {/* Total Terbayar */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Telah Terbayar</p>
                <h4 className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatRupiah(summary.totalNominalTerbayar)}
                </h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">
                  {summary.totalBulanTerbayar} dari 12 Bulan Lunas
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            {/* Sisa Tunggakan */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Sisa Tunggakan Tagihan</p>
                <h4 className={`text-xl font-bold font-mono mt-1 ${summary.totalEstimasiTunggakan > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'}`}>
                  {formatRupiah(summary.totalEstimasiTunggakan)}
                </h4>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                  {summary.totalBulanTunggakan} Bulan Belum Bayar
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            {/* Status Administrasi */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Kelayakan Administrasi</p>
                <h4 className={`text-base font-bold mt-1 ${summary.totalBulanTunggakan === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {summary.totalBulanTunggakan === 0 ? 'Bebas Tunggakan' : `Tunggakan ${summary.totalBulanTunggakan} Bulan`}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {summary.totalBulanTunggakan === 0 ? 'Tertib administrasi kartu ujian' : 'Harap melunasi di kasir'}
                </p>
              </div>
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${summary.totalBulanTunggakan === 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60'}`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Matriks Status 12 Bulan SPP */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Matriks Pembayaran 12 Bulan</span>
                  <span className="text-xs font-mono font-normal text-slate-500">
                    (Tahun Ajaran {tahunAjaran})
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Siklus pembayaran bulanan dari Juli hingga Juni tahun ajaran berjalan.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Lunas ({summary.totalBulanTerbayar})
                </span>
                <span className="flex items-center gap-1.5 font-medium text-rose-700 dark:text-rose-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  Belum Bayar ({summary.totalBulanTunggakan})
                </span>
              </div>
            </div>

            {loadingSpp ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Memuat data matriks SPP...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {months.map((item: any) => {
                  const isPaid = item.status === 'paid'
                  return (
                    <div
                      key={item.urutan}
                      className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition ${
                        isPaid
                          ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                          : 'border-dashed border-slate-300 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30'
                      }`}
                    >
                      <div>
                        {/* Header Kartu Bulan */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.bulan}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            #{item.urutan}
                          </span>
                        </div>

                        {/* Status Badge & Nominal */}
                        <div className="mt-2.5 space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Lunas</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3" />
                                <span>Belum Bayar</span>
                              </>
                            )}
                          </span>

                          <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                            {formatRupiah(isPaid ? item.nominalBayar : item.nominalTagihan)}
                          </p>
                        </div>
                      </div>

                      {/* Detail Footer */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500">
                        {isPaid ? (
                          <div className="space-y-1">
                            <p className="truncate">
                              Tgl: {new Date(item.tanggalBayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </p>
                            {item.noTransaksi && (
                              <Link
                                href={`/spp/kuitansi/${item.noTransaksi}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 font-mono font-medium text-blue-600 hover:underline dark:text-blue-400"
                              >
                                <span>Kuitansi</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </Link>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={`/spp/kasir?siswaId=${siswa.id}`}
                            className="inline-flex items-center justify-center w-full rounded-lg bg-blue-600/10 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300 transition"
                          >
                            Bayar di Kasir
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tabel Riwayat Transaksi Pembayaran */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <span>Riwayat Transaksi & Bukti Kuitansi</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Daftar transaksi kasir yang diterbitkan untuk pembayaran siswa ini.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Total: {riwayatTransaksi.length} Transaksi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4">No. Transaksi</th>
                    <th className="py-3 px-4">Waktu Transaksi</th>
                    <th className="py-3 px-4">Bulan Dibayar</th>
                    <th className="py-3 px-4 text-right">Nominal Tagihan</th>
                    <th className="py-3 px-4 text-right">Diskon</th>
                    <th className="py-3 px-4 text-right">Total Bayar</th>
                    <th className="py-3 px-4 text-center">Metode</th>
                    <th className="py-3 px-4">Petugas</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {riwayatTransaksi.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Belum ada riwayat pembayaran yang tercatat pada tahun ajaran ini.
                      </td>
                    </tr>
                  ) : (
                    riwayatTransaksi.map((tx: any) => (
                      <tr key={tx.noTransaksi} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {tx.noTransaksi}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {new Date(tx.tanggalBayar).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {tx.bulanItems?.map((b: any, idx: number) => (
                              <span
                                key={idx}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {b.bulan}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                          {formatRupiah(tx.totalNominal + (tx.totalDiskon || 0))}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                          {tx.totalDiskon > 0 ? formatRupiah(tx.totalDiskon) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(tx.totalNominal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {tx.metodeBayar || 'Tunai'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {tx.petugas || 'Kasir'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/spp/kuitansi/${tx.noTransaksi}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-600 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 transition"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Kuitansi</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. TAB 2: BIODATA & PROFIL LENGKAP SISWA */}
      {/* ======================================================== */}
      {activeTab === 'biodata' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Data Kesiswaan & Akademik */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <span>Data Kesiswaan & Rombongan Belajar</span>
            </h4>

            <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Nomor Induk Siswa (NIS)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {siswa.nis}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">NISN</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {siswa.nisn || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Jenjang Pendidikan</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {siswa.jenjang?.nama} ({siswa.jenjang?.kode})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Rombel Kelas Saat Ini</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {siswa.kelas?.namaKelas || 'Belum Masuk Kelas'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Program Keahlian / Jurusan</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {siswa.jurusan ? `${siswa.jurusan.namaJurusan} (${siswa.jurusan.kodeJurusan})` : 'Umum (Tidak Ada)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Tahun Masuk / Angkatan</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {siswa.tahunMasuk ? `Tahun ${siswa.tahunMasuk}` : '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Status Siswa</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                  {siswa.status}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Tahun Keluar / Kelulusan</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {siswa.tahunKeluar || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Informasi Pribadi & Kontak */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <User className="h-4 w-4 text-indigo-600" />
              <span>Informasi Pribadi & Kontak</span>
            </h4>

            <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Nama Lengkap</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {siswa.nama}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Jenis Kelamin</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {siswa.jenisKelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">Tempat, Tanggal Lahir</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {siswa.tempatLahir ? `${siswa.tempatLahir}, ` : ''}{tglLahirFormatted}{umurText}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Nomor WhatsApp / HP</span>
                {siswa.telpSiswa ? (
                  <a
                    href={`https://wa.me/${siswa.telpSiswa.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-blue-600 hover:underline"
                  >
                    {siswa.telpSiswa}
                  </a>
                ) : (
                  <span className="text-slate-400 font-mono">-</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Surel (Email) Siswa</span>
                {siswa.emailSiswa ? (
                  <a href={`mailto:${siswa.emailSiswa}`} className="font-medium text-blue-600 hover:underline">
                    {siswa.emailSiswa}
                  </a>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">Alamat Tempat Tinggal</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {siswa.alamat || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Data Orang Tua / Wali */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <User className="h-4 w-4 text-emerald-600" />
              <span>Data Orang Tua / Wali Murid</span>
            </h4>

            <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Nama Wali</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {siswa.namaWali || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Hubungan dengan Siswa</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {siswa.hubunganWali || 'Orang Tua'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Pekerjaan Wali</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {siswa.pekerjaanWali || '-'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Kontak WhatsApp / Telp Wali</span>
                {siswa.telpWali ? (
                  <a
                    href={`https://wa.me/${siswa.telpWali.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{siswa.telpWali}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400 font-mono">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Catatan Prestasi & Ekstrakurikuler */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Award className="h-4 w-4 text-amber-500" />
              <span>Catatan Prestasi & Riwayat Kesiswaan</span>
            </h4>

            {siswa.prestasi ? (
              <div className="rounded-xl bg-amber-50/70 p-4 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40">
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed whitespace-pre-line">
                  {siswa.prestasi}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Belum ada riwayat prestasi atau catatan khusus yang dicatat untuk siswa ini.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5B. TAB 3: KEDISIPLINAN & CATATAN BIMBINGAN KONSELING    */}
      {/* ======================================================== */}
      {activeTab === 'kedisiplinan' && (
        <div className="space-y-5">
          {(() => {
            const logs: any[] = siswa.kedisiplinan || []
            const poinPrestasi = logs
              .filter((l) => l.jenis === 'prestasi')
              .reduce((s, l) => s + (l.poin || 0), 0)
            const poinPelanggaran = logs
              .filter((l) => l.jenis === 'pelanggaran')
              .reduce((s, l) => s + (l.poin || 0), 0)
            const skorNet = poinPrestasi - poinPelanggaran

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-semibold text-emerald-600">Total Poin Prestasi (+)</span>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">+{poinPrestasi}</p>
                  </div>
                  <div className="rounded-2xl border border-rose-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <span className="text-xs font-semibold text-rose-600">Total Poin Pelanggaran (-)</span>
                    <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">-{poinPelanggaran}</p>
                  </div>
                  <div className="rounded-2xl border border-blue-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-blue-600">Skor Bersih Disiplin</span>
                      <p className="mt-1 text-2xl font-black font-mono text-slate-900 dark:text-white">
                        {skorNet > 0 ? `+${skorNet}` : skorNet}
                      </p>
                    </div>
                    <Link
                      href="/kesiswaan/kedisiplinan"
                      className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      Kelola di BK
                    </Link>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
                  {logs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Belum ada catatan poin pelanggaran ataupun prestasi untuk siswa ini.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-3">Tanggal</th>
                            <th className="px-4 py-3">Kategori</th>
                            <th className="px-4 py-3">Poin</th>
                            <th className="px-4 py-3">Deskripsi &amp; Tindak Lanjut BK</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {logs.map((row) => (
                            <tr key={row.id}>
                              <td className="px-4 py-3 whitespace-nowrap font-medium">
                                {new Date(row.tanggal).toLocaleDateString('id-ID')}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {row.kategori?.nama}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold">
                                <span
                                  className={
                                    row.jenis === 'prestasi' ? 'text-emerald-600' : 'text-rose-600'
                                  }
                                >
                                  {row.jenis === 'prestasi' ? `+${row.poin}` : `-${row.poin}`}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-slate-700">{row.deskripsi}</p>
                                {row.tindakLanjut && (
                                  <p className="text-[11px] text-blue-600 mt-0.5">
                                    Tindak lanjut: {row.tindakLanjut}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3 uppercase text-[11px] font-bold text-slate-600">
                                {row.statusBk}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL UBAH DATA SISWA */}
      {/* ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Ubah Data Peserta Didik
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              {/* Foto Profil & Identitas Dasar */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    {editFormData.fotoUrl ? (
                      <img
                        src={editFormData.fotoUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <User className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300">
                    {isUploadingPhoto ? 'Mengunggah...' : 'Pilih Foto'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nama Lengkap Siswa *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.nama}
                      onChange={(e) => setEditFormData({ ...editFormData, nama: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Jenis Kelamin *
                    </label>
                    <div className="mt-1 flex gap-4 pt-1">
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name="editJenisKelamin"
                          value="L"
                          checked={editFormData.jenisKelamin === 'L'}
                          onChange={() => setEditFormData({ ...editFormData, jenisKelamin: 'L' })}
                        />
                        <span>Laki-laki</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name="editJenisKelamin"
                          value="P"
                          checked={editFormData.jenisKelamin === 'P'}
                          onChange={() => setEditFormData({ ...editFormData, jenisKelamin: 'P' })}
                        />
                        <span>Perempuan</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rombel & Jenjang */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Jenjang Pendidikan *
                  </label>
                  <select
                    required
                    value={editFormData.jenjangId}
                    onChange={(e) => setEditFormData({ ...editFormData, jenjangId: e.target.value, kelasId: '' })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="">Pilih Jenjang</option>
                    {masterJenjang.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.kode} - {j.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Rombel Kelas
                  </label>
                  <select
                    value={editFormData.kelasId}
                    onChange={(e) => setEditFormData({ ...editFormData, kelasId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="">Pilih Rombel Kelas</option>
                    {masterKelas
                      .filter((k) => !editFormData.jenjangId || k.jenjangId === parseInt(editFormData.jenjangId, 10))
                      .map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.namaKelas}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status Kesiswaan
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="alumni">Alumni</option>
                    <option value="mutasi">Mutasi</option>
                  </select>
                </div>
              </div>

              {/* NIS, NISN, Tahun Masuk */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    NIS *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.nis}
                    onChange={(e) => setEditFormData({ ...editFormData, nis: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    NISN (Opsional)
                  </label>
                  <input
                    type="text"
                    value={editFormData.nisn}
                    onChange={(e) => setEditFormData({ ...editFormData, nisn: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tahun Masuk / Angkatan
                  </label>
                  <input
                    type="number"
                    value={editFormData.tahunMasuk}
                    onChange={(e) => setEditFormData({ ...editFormData, tahunMasuk: parseInt(e.target.value, 10) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Tempat & Tanggal Lahir */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    value={editFormData.tempatLahir}
                    onChange={(e) => setEditFormData({ ...editFormData, tempatLahir: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={editFormData.tanggalLahir}
                    onChange={(e) => setEditFormData({ ...editFormData, tanggalLahir: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Kontak & Alamat */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No. Telp / WhatsApp Siswa
                  </label>
                  <input
                    type="text"
                    value={editFormData.telpSiswa}
                    onChange={(e) => setEditFormData({ ...editFormData, telpSiswa: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Surel (Email) Siswa
                  </label>
                  <input
                    type="email"
                    value={editFormData.emailSiswa}
                    onChange={(e) => setEditFormData({ ...editFormData, emailSiswa: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Alamat Lengkap
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.alamat}
                    onChange={(e) => setEditFormData({ ...editFormData, alamat: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Data Wali */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nama Wali Murid
                  </label>
                  <input
                    type="text"
                    value={editFormData.namaWali}
                    onChange={(e) => setEditFormData({ ...editFormData, namaWali: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hubungan Wali
                  </label>
                  <select
                    value={editFormData.hubunganWali}
                    onChange={(e) => setEditFormData({ ...editFormData, hubunganWali: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Kakek/Nenek">Kakek/Nenek</option>
                    <option value="Paman/Bibi">Paman/Bibi</option>
                    <option value="Wali Lainnya">Wali Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No. Telp / WhatsApp Wali
                  </label>
                  <input
                    type="text"
                    value={editFormData.telpWali}
                    onChange={(e) => setEditFormData({ ...editFormData, telpWali: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Prestasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Catatan Prestasi / Ekstrakurikuler
                </label>
                <textarea
                  rows={2}
                  value={editFormData.prestasi}
                  onChange={(e) => setEditFormData({ ...editFormData, prestasi: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* Tombol Aksi */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting || isUploadingPhoto}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kartu Siswa & QR Code */}
      <KartuSiswaModal
        isOpen={isKartuModalOpen}
        onClose={() => setIsKartuModalOpen(false)}
        siswa={siswa}
        sekolah={sekolah}
      />
    </div>
  )
}

