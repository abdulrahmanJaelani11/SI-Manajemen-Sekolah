'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  LogOut,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  Printer,
  User,
  CreditCard,
  Phone,
  MapPin,
  Building2,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Award,
  BookOpen,
  Send,
  MessageCircle,
  HelpCircle,
  RefreshCw,
  Wallet,
  LogIn,
  ArrowLeft,
  ClipboardCheck,
  CalendarDays,
} from 'lucide-react'
import { formatRupiah } from '@/lib/terbilang'
import KuitansiModal from '@/components/spp/KuitansiModal'
import SearchableSelect from '@/components/ui/searchable-select'

export default function PortalSiswaDashboard() {
  const router = useRouter()

  // State Otentikasi & Data Siswa
  const [siswa, setSiswa] = useState<any>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  // State SPP
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025')
  const [sppData, setSppData] = useState<any>(null)
  const [loadingSpp, setLoadingSpp] = useState(true)

  // State Tab Aktif
  const [activeTab, setActiveTab] = useState<'spp' | 'tagihan' | 'jadwal' | 'rapor' | 'absensi' | 'kedisiplinan' | 'perpustakaan' | 'kalender' | 'biodata' | 'pembayaran'>('spp')

  // State Kalender Akademik Siswa
  const [kalenderEvents, setKalenderEvents] = useState<any[]>([])
  const [loadingKalender, setLoadingKalender] = useState(false)

  // State Perpustakaan Digital Siswa
  const [pustakaData, setPustakaData] = useState<any>(null)
  const [loadingPustaka, setLoadingPustaka] = useState(false)
  const [pustakaSearch, setPustakaSearch] = useState('')
  const [pustakaKategori, setPustakaKategori] = useState('all')

  // State Tagihan Non-SPP & Cicilan
  const [tagihanData, setTagihanData] = useState<any>(null)
  const [loadingTagihan, setLoadingTagihan] = useState(false)

  // State Jadwal Pelajaran Kelas
  const [jadwalData, setJadwalData] = useState<any>(null)
  const [loadingJadwal, setLoadingJadwal] = useState(false)

  // State Nilai & E-Rapor Semester
  const [raporSemester, setRaporSemester] = useState('Ganjil')
  const [raporData, setRaporData] = useState<any>(null)
  const [loadingRapor, setLoadingRapor] = useState(false)

  // State Riwayat Presensi Bulanan
  const [absensiBulan, setAbsensiBulan] = useState(() => {
    const now = new Date()
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
    return wib.toISOString().slice(0, 7)
  })
  const [absensiData, setAbsensiData] = useState<any>(null)
  const [loadingAbsensi, setLoadingAbsensi] = useState(false)

  // State Kedisiplinan & BK
  const [kedisiplinanData, setKedisiplinanData] = useState<any>(null)
  const [loadingKedisiplinan, setLoadingKedisiplinan] = useState(false)

  // State Kuitansi Modal
  const [selectedKuitansi, setSelectedKuitansi] = useState<any>(null)
  const [isKuitansiOpen, setIsKuitansiOpen] = useState(false)
  const [loadingKuitansiNo, setLoadingKuitansiNo] = useState<string | null>(null)

  // State Salin Nomor Rekening
  const [copiedBank, setCopiedBank] = useState<string | null>(null)

  // 1. Verifikasi Sesi Siswa
  useEffect(() => {
    const checkSession = async () => {
      setLoadingAuth(true)
      try {
        const token =
          typeof window !== 'undefined'
            ? localStorage.getItem('siswa_token')
            : null

        const headers: HeadersInit = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const res = await fetch('/api/portal/siswa/me', { headers })
        const json = await res.json()

        if (json.success && json.data) {
          setSiswa(json.data)
        } else {
          // Token tidak ada atau invalid - bersihkan cache lokal
          if (typeof window !== 'undefined') {
            localStorage.removeItem('siswa_session')
            localStorage.removeItem('siswa_token')
          }
          setSiswa(null)
        }
      } catch (err) {
        console.error('Gagal verifikasi sesi:', err)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('siswa_session')
          localStorage.removeItem('siswa_token')
        }
        setSiswa(null)
      } finally {
        setLoadingAuth(false)
      }
    }

    checkSession()
  }, [])

  // 2. Muat Data SPP Siswa berdasarkan Tahun Ajaran
  const fetchSpp = async (thn: string) => {
    setLoadingSpp(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('siswa_token')
          : null
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(
        `/api/portal/siswa/spp?tahunAjaran=${encodeURIComponent(thn)}`,
        { headers }
      )
      const json = await res.json()
      if (json.success) {
        setSppData(json.data)
      }
    } catch (err) {
      console.error('Gagal memuat SPP:', err)
    } finally {
      setLoadingSpp(false)
    }
  }

  // 2b. Muat Jadwal Pelajaran Kelas
  const fetchJadwal = async () => {
    setLoadingJadwal(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('siswa_token')
          : null
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch('/api/portal/siswa/jadwal', { headers })
      const json = await res.json()
      if (json.success) {
        setJadwalData(json.data)
      }
    } catch (err) {
      console.error('Gagal memuat jadwal:', err)
    } finally {
      setLoadingJadwal(false)
    }
  }

  // 2c. Muat Nilai & E-Rapor Semester
  const fetchRapor = async (thn: string, sem: string) => {
    setLoadingRapor(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('siswa_token')
          : null
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch(
        `/api/portal/siswa/rapor?tahunAjaran=${encodeURIComponent(thn)}&semester=${encodeURIComponent(sem)}`,
        { headers }
      )
      const json = await res.json()
      if (json.success) {
        setRaporData(json.data)
      }
    } catch (err) {
      console.error('Gagal memuat rapor:', err)
    } finally {
      setLoadingRapor(false)
    }
  }

  // 2d. Muat Riwayat Presensi Bulanan
  const fetchAbsensi = async (bln: string) => {
    setLoadingAbsensi(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('siswa_token')
          : null
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch(
        `/api/portal/siswa/absensi?bulan=${encodeURIComponent(bln)}`,
        { headers }
      )
      const json = await res.json()
      if (json.success) {
        setAbsensiData(json.data)
      }
    } catch (err) {
      console.error('Gagal memuat riwayat presensi:', err)
    } finally {
      setLoadingAbsensi(false)
    }
  }

  // 2e. Muat Riwayat Kedisiplinan & Poin BK
  const fetchKedisiplinan = async () => {
    setLoadingKedisiplinan(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('siswa_token')
          : null
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch('/api/portal/siswa/kedisiplinan', { headers })
      const json = await res.json()
      if (json.success) {
        setKedisiplinanData(json.data)
      }
    } catch (err) {
      console.error('Gagal memuat data kedisiplinan:', err)
    } finally {
      setLoadingKedisiplinan(false)
    }
  }

  // 2f. Muat Tagihan Non-SPP & Cicilan
  const fetchTagihan = async () => {
    setLoadingTagihan(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('siswa_token')
          : null
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch('/api/portal/siswa/tagihan', { headers })
      const json = await res.json()
      if (json.success) {
        setTagihanData(json.data)
      }
    } catch (err) {
      console.error('Gagal memuat tagihan Non-SPP:', err)
    } finally {
      setLoadingTagihan(false)
    }
  }

  // 2f. Muat Data Perpustakaan & Peminjaman Siswa
  const fetchPustaka = async (search = '', kat = 'all') => {
    setLoadingPustaka(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('siswa_token')
          : null
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (kat && kat !== 'all') params.set('kategoriId', kat)

      const res = await fetch(`/api/portal/siswa/perpustakaan?${params.toString()}`, { headers })
      const json = await res.json()
      if (json.success) {
        setPustakaData(json.data)
      }
    } catch (err) {
      console.error('Gagal memuat data perpustakaan siswa:', err)
    } finally {
      setLoadingPustaka(false)
    }
  }

  useEffect(() => {
    if (siswa) {
      fetchSpp(tahunAjaran)
    }
  }, [siswa, tahunAjaran])

  useEffect(() => {
    if (siswa) {
      fetchJadwal()
    }
  }, [siswa])

  useEffect(() => {
    if (siswa) {
      fetchRapor(tahunAjaran, raporSemester)
    }
  }, [siswa, tahunAjaran, raporSemester])

  useEffect(() => {
    if (siswa) {
      fetchAbsensi(absensiBulan)
    }
  }, [siswa, absensiBulan])

  const fetchKalender = async () => {
    try {
      setLoadingKalender(true)
      const res = await fetch('/api/portal/kalender')
      const json = await res.json()
      if (res.ok && json.success) {
        setKalenderEvents(json.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch kalender:', err)
    } finally {
      setLoadingKalender(false)
    }
  }

  useEffect(() => {
    if (siswa) {
      fetchKedisiplinan()
      fetchTagihan()
      fetchPustaka()
      fetchKalender()
    }
  }, [siswa])

  // 3. Handle Logout Siswa
  const handleLogout = async () => {
    try {
      await fetch('/api/portal/siswa/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('siswa_session')
        localStorage.removeItem('siswa_token')
      }
      setSiswa(null)
      window.location.replace('/portal/login-siswa')
    }
  }

  // 4. Buka Modal Kuitansi Sah
  const handleOpenKuitansi = async (noTransaksi: string) => {
    setLoadingKuitansiNo(noTransaksi)
    try {
      const res = await fetch(`/api/spp/transaksi/${encodeURIComponent(noTransaksi)}`)
      const json = await res.json()
      if (json.success && json.data) {
        setSelectedKuitansi(json.data)
        setIsKuitansiOpen(true)
      } else {
        alert(json.message || 'Gagal memuat kuitansi')
      }
    } catch (err: any) {
      alert('Gagal mengambil kuitansi: ' + err.message)
    } finally {
      setLoadingKuitansiNo(null)
    }
  }

  // 5. Salin Nomor Rekening
  const handleCopyRekening = (noRek: string, bankName: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(noRek)
      setCopiedBank(bankName)
      setTimeout(() => setCopiedBank(null), 2500)
    }
  }

  if (loadingAuth) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-slate-700">
          Memuat data otentikasi santri/siswa...
        </p>
        <p className="text-xs text-slate-400 mt-1">Menghubungkan ke pangkalan data terpusat</p>
      </div>
    )
  }

  if (!siswa) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-slate-50/70">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-sm border border-blue-100">
          <GraduationCap className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Sesi Belum Masuk atau Telah Berakhir
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          Silakan masuk menggunakan Nomor Induk Siswa (NIS) dan tanggal lahir untuk melihat rincian kartu iuran SPP 12 bulan dan histori kuitansi resmi santri/siswa.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/portal/login-siswa"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition"
          >
            <LogIn className="h-4 w-4" />
            <span>Masuk ke Portal Siswa</span>
          </Link>
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    )
  }

  const tanggalLahirStr = siswa.tanggalLahir
    ? new Date(siswa.tanggalLahir).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-'

  const summary = sppData?.summary || {
    totalTerbayar: 0,
    totalTunggakan: 0,
    bulanLunasCount: 0,
    bulanNunggakCount: 12,
  }

  const persenLunas = Math.round((summary.bulanLunasCount / 12) * 100)

  // Pesan WhatsApp Pre-filled
  const waPhone = '6281234567890'
  const waText = encodeURIComponent(
    `Assalamu'alaikum Wr. Wb. Bapak/Ibu Bendahara Lembaga.\n\nSaya wali murid dari peserta didik:\nNama: ${siswa.nama}\nNIS: ${siswa.nis}\nKelas: ${siswa.kelas?.namaKelas || '-'}\n\nIngin melakukan konfirmasi perihal administrasi / pembayaran iuran SPP. Terima kasih.`
  )
  const waUrl = `https://wa.me/${waPhone}?text=${waText}`

  return (
    <div className="bg-slate-50/60 pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* ============================================================== */}
        {/* 1. HERO BANNER & KARTU IDENTITAS DIGITAL SISWA                 */}
        {/* ============================================================== */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E3A8A] via-[#172554] to-[#1E3A8A] p-6 sm:p-8 text-white shadow-xl">
          {/* Aksen Latar Belakang */}
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Sisi Kiri: Foto, Nama & Kelas */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative flex-shrink-0">
                {siswa.fotoUrl ? (
                  <img
                    src={siswa.fotoUrl}
                    alt={siswa.nama}
                    className="h-24 w-24 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-lg border-2 border-white/20">
                    <GraduationCap className="h-12 w-12 text-amber-300" />
                  </div>
                )}
                <span className="absolute -bottom-2 -right-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Aktif
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-blue-500/20 px-2.5 py-1 text-xs font-semibold text-blue-200 border border-blue-400/20">
                    {siswa.jenjang?.nama || 'Peserta Didik'}
                  </span>
                  <span className="rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/20">
                    Kelas: {siswa.kelas?.namaKelas || 'Belum Ditentukan'}
                  </span>
                  {siswa.jurusan && (
                    <span className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-400/20">
                      {siswa.jurusan.kodeJurusan || siswa.jurusan.namaJurusan}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {siswa.nama}
                </h1>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-blue-100">
                  <span className="flex items-center gap-1">
                    <span className="text-blue-300">NIS:</span>
                    <strong className="text-white font-mono">{siswa.nis}</strong>
                  </span>
                  {siswa.nisn && (
                    <span className="flex items-center gap-1">
                      <span className="text-blue-300">NISN:</span>
                      <strong className="text-white font-mono">{siswa.nisn}</strong>
                    </span>
                  )}
                  {siswa.namaWali && (
                    <span className="flex items-center gap-1">
                      <span className="text-blue-300">Wali:</span>
                      <strong className="text-white">{siswa.namaWali}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sisi Kanan: Kontrol Tahun Ajaran & Logout */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-4 lg:pt-0 border-t border-slate-800 lg:border-t-0">
              <div className="w-44">
                <SearchableSelect
                  value={tahunAjaran}
                  onChange={(val) => setTahunAjaran(val)}
                  options={[
                    { value: '2024/2025', label: 'T.A 2024/2025' },
                    { value: '2023/2024', label: 'T.A 2023/2024' },
                    { value: '2025/2026', label: 'T.A 2025/2026' },
                  ]}
                  placeholder="Pilih Tahun Ajaran"
                  searchPlaceholder="Cari tahun..."
                  triggerClassName="bg-blue-900/60 border-blue-700/60 text-white hover:border-blue-500"
                />
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 px-3.5 py-2 text-xs font-bold transition active:scale-95 shadow-sm"
                title="Keluar dari sesi portal siswa"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. STATISTIK KEUANGAN MANDIRI (KPI CARDS)                      */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Kartu 1: Total Lunas */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition border-t-4 border-t-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total SPP Lunas
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatRupiah(summary.totalTerbayar)}
              </div>
              <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span>{summary.bulanLunasCount} dari 12 Bulan Terpenuhi</span>
              </p>
            </div>
          </div>

          {/* Kartu 2: Estimasi Tunggakan */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-amber-300 transition border-t-4 border-t-[#F59E0B]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Sisa Tunggakan SPP
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatRupiah(summary.totalTunggakan)}
              </div>
              <p className="mt-1 text-xs text-amber-600 font-semibold flex items-center gap-1">
                <span>{summary.bulanNunggakCount} Bulan Belum Dibayar</span>
              </p>
            </div>
          </div>

          {/* Kartu 3: Persentase Pelunasan */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-blue-300 transition border-t-4 border-t-[#2563EB]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rasio Pemenuhan Iuran
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {persenLunas}%
                </div>
                <span className="text-xs text-slate-500 font-medium">T.A. {tahunAjaran}</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${persenLunas}%` }}
                />
              </div>
            </div>
          </div>

          {/* Kartu 4: Ketetapan Tarif SPP */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition border-t-4 border-t-[#1E3A8A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tarif SPP Bulanan
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatRupiah(sppData?.nominalTarif || 150000)}
              </div>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Sesuai Jenjang {siswa.jenjang?.kode || 'Madrasah'}
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. TAB NAVIGASI MANDIRI                                        */}
        {/* ============================================================== */}
        <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('spp')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'spp'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Kartu Iuran SPP 12 Bulan & Kuitansi</span>
          </button>

          <button
            onClick={() => setActiveTab('tagihan')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'tagihan'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span>Tagihan Non-SPP</span>
          </button>

          <button
            onClick={() => setActiveTab('jadwal')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'jadwal'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Jadwal Pelajaran Kelas</span>
          </button>

          <button
            onClick={() => setActiveTab('rapor')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'rapor'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Nilai & E-Rapor Semester</span>
          </button>

          <button
            onClick={() => setActiveTab('absensi')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'absensi'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Riwayat Presensi</span>
          </button>

          <button
            onClick={() => setActiveTab('kedisiplinan')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'kedisiplinan'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Kedisiplinan &amp; BK</span>
          </button>

          <button
            onClick={() => setActiveTab('perpustakaan')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'perpustakaan'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Pustaka &amp; Literasi</span>
          </button>

          <button
            onClick={() => setActiveTab('kalender')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'kalender'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Kalender Akademik</span>
          </button>

          <button
            onClick={() => setActiveTab('biodata')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'biodata'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Biodata Santri & Rekam Prestasi</span>
          </button>

          <button
            onClick={() => setActiveTab('pembayaran')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'pembayaran'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Rekening Resmi & Panduan Bayar</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* 4. KONTEN TAB 1: KARTU IURAN SPP 12 BULAN & HISTORI KUITANSI    */}
        {/* ============================================================== */}
        {activeTab === 'spp' && (
          <div className="space-y-8">
            {/* GRID 12 BULAN AKADEMIK */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Matriks Status SPP 12 Bulan (Juli - Juni)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pemantauan langsung status pelunasan iuran bulanan tahun ajaran {tahunAjaran}.
                  </p>
                </div>
                <button
                  onClick={() => fetchSpp(tahunAjaran)}
                  className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingSpp ? 'animate-spin' : ''}`} />
                  <span>Segarkan Status</span>
                </button>
              </div>

              {loadingSpp ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
                  <span className="text-xs">Memuat status 12 bulan...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                  {sppData?.bulanStatus?.map((item: any) => {
                    const isLunas = item.status === 'lunas'

                    return (
                      <div
                        key={item.urutan}
                        className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                          isLunas
                            ? 'bg-emerald-50/50 border-emerald-200 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                            <span>Bulan #{item.urutan}</span>
                            {isLunas ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="h-3 w-3" />
                                Lunas
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md">
                                <Clock className="h-3 w-3" />
                                Nunggak
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900">
                            {item.bulan}
                          </h3>

                          <div className="mt-2 text-xs font-mono font-bold text-slate-700">
                            {formatRupiah(isLunas ? item.nominalBayar : item.nominalTarif)}
                          </div>

                          {isLunas && item.diskon > 0 && (
                            <span className="text-[10px] text-emerald-700 font-medium">
                              (Potongan: {formatRupiah(item.diskon)})
                            </span>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px]">
                          {isLunas ? (
                            <div className="space-y-1.5">
                              <p className="text-[10px] text-slate-500">
                                {new Date(item.tanggalBayar).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                              {item.noTransaksi && (
                                <button
                                  onClick={() => handleOpenKuitansi(item.noTransaksi)}
                                  disabled={loadingKuitansiNo === item.noTransaksi}
                                  className="w-full inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2 text-[10px] transition active:scale-95 shadow-xs"
                                >
                                  {loadingKuitansiNo === item.noTransaksi ? (
                                    <span>Memuat...</span>
                                  ) : (
                                    <>
                                      <Printer className="h-3 w-3" />
                                      <span>Kuitansi</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">
                              Belum terbayar
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* TABEL HISTORI TRANSAKSI KUITANSI SAH */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Buku Riwayat Kuitansi Pembayaran Sah
                  </h2>
                  <p className="text-xs text-slate-500">
                    Seluruh transaksi kuitansi pembayaran SPP yang tercatat resmi pada sistem kasir sekolah.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-bold border border-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Kuitansi Sah Ber-Barcode</span>
                </div>
              </div>

              {sppData?.riwayatTransaksi?.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  Belum ada riwayat transaksi pembayaran SPP untuk tahun ajaran {tahunAjaran}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">No. Kuitansi</th>
                        <th className="py-3 px-4">Tanggal Bayar</th>
                        <th className="py-3 px-4">Cakupan Bulan SPP</th>
                        <th className="py-3 px-4 text-right">Total Dibayar</th>
                        <th className="py-3 px-4">Metode & Petugas</th>
                        <th className="py-3 px-4 text-center">Salinan Kuitansi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sppData?.riwayatTransaksi?.map((tx: any) => (
                        <tr key={tx.noTransaksi} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                            {tx.noTransaksi}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {new Date(tx.tanggalBayar).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {tx.bulanItems.map((b: any) => (
                                <span
                                  key={b.urutanBulan}
                                  className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200"
                                >
                                  {b.bulan}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(tx.totalNominal)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase mr-1.5 border border-emerald-200">
                              {tx.metodeBayar || 'TUNAI'}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              Kasir: {tx.petugas || 'Tata Usaha'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleOpenKuitansi(tx.noTransaksi)}
                              disabled={loadingKuitansiNo === tx.noTransaksi}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 text-xs transition active:scale-95 shadow-sm"
                            >
                              {loadingKuitansiNo === tx.noTransaksi ? (
                                <span>Memuat...</span>
                              ) : (
                                <>
                                  <Printer className="h-3.5 w-3.5" />
                                  <span>Cetak Salinan</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. KONTEN TAB 2: BIODATA SANTRI & REKAM PRESTASI               */}
        {/* ============================================================== */}
        {activeTab === 'biodata' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom 1 & 2: Informasi Data Pokok */}
            <div className="lg:col-span-2 space-y-6">
              {/* Kartu Profil Pokok */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Data Pokok Peserta Didik</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Nama Lengkap
                    </span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {siswa.nama}
                    </strong>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Nomor Induk Siswa (NIS / NISN)
                    </span>
                    <strong className="text-slate-900 text-sm mt-0.5 font-mono block">
                      {siswa.nis} {siswa.nisn ? ` / ${siswa.nisn}` : ''}
                    </strong>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Jenis Kelamin
                    </span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {siswa.jenisKelamin === 'L' ? 'Laki-Laki (Ikhwan)' : 'Perempuan (Akhwat)'}
                    </strong>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Tempat, Tanggal Lahir
                    </span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {siswa.tempatLahir || '-'}, {tanggalLahirStr}
                    </strong>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Jenjang & Rombel Kelas
                    </span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {siswa.jenjang?.nama} • {siswa.kelas?.namaKelas || 'Kelas Belum Ditentukan'}
                    </strong>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Wali Kelas
                    </span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {siswa.kelas?.waliKelas || 'Ustadz / Ustadzah Pembimbing'}
                    </strong>
                  </div>
                </div>

                {/* Alamat */}
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                    <span>Alamat Domisili Siswa</span>
                  </span>
                  <p className="text-slate-800 font-medium mt-1 leading-relaxed">
                    {siswa.alamat || 'Alamat domisili lengkap belum tercatat di data pokok kesiswaan.'}
                  </p>
                </div>
              </div>

              {/* Data Orang Tua / Wali */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  <span>Data Orang Tua / Wali Murid</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Nama Wali
                    </span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {siswa.namaWali || '-'}
                    </strong>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Hubungan Keluarga
                    </span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {siswa.hubunganWali || 'Orang Tua Kandung'}
                    </strong>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Nomor Telepon / WhatsApp Wali
                    </span>
                    <strong className="text-slate-900 text-sm mt-0.5 font-mono block">
                      {siswa.telpWali || '-'}
                    </strong>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">
                      Pekerjaan Wali
                    </span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {siswa.pekerjaanWali || '-'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom 3: Catatan Prestasi & Status Santri */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  <span>Rekam Jejak Prestasi</span>
                </h2>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Daftar penghargaan akademik, tahfidz, olahraga, dan rekam keaktifan ekstrakurikuler.
                </p>

                {siswa.prestasi ? (
                  <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed whitespace-pre-line font-medium">
                    {siswa.prestasi}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-5 text-center text-xs text-slate-500">
                    <Award className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <span>Belum ada catatan khusus prestasi yang dimasukkan oleh pembina akademik.</span>
                  </div>
                )}
              </div>

              {/* Bantuan Layanan TU */}
              <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-6 shadow-sm text-xs">
                <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Koreksi Data Siswa?</span>
                </div>
                <p className="text-slate-600 leading-relaxed mb-4">
                  Apabila terdapat kesalahan penulisan nama, tanggal lahir, atau alamat, harap hubungi staf Tata Usaha & Kesiswaan sekolah dengan melampirkan salinan KK/Akta Kelahiran.
                </p>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 transition active:scale-95 shadow-md shadow-blue-500/20"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Hubungi Tata Usaha (WhatsApp)</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 6. KONTEN TAB 3: REKENING RESMI & PANDUAN BAYAR SPP            */}
        {/* ============================================================== */}
        {activeTab === 'pembayaran' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kolom 1 & 2: Daftar Rekening Resmi */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">
                      Rekening Bank Resmi Penerimaan SPP
                    </h2>
                    <p className="text-xs text-slate-500">
                      Seluruh pembayaran non-tunai wajib ditransfer langsung ke rekening giro resmi lembaga berikut:
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-bold border border-emerald-200">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Terverifikasi Sah</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Rekening 1: BSI */}
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-400 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-emerald-700 text-sm tracking-wide bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          BANK SYARIAH INDONESIA (BSI)
                        </span>
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 pt-1">
                        7123 4567 89
                      </div>
                      <p className="text-xs text-slate-500">
                        Atas Nama: <strong className="text-slate-800">YAYASAN PENDIDIKAN MA&apos;ARIF</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopyRekening('7123456789', 'bsi')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 text-xs transition active:scale-95"
                    >
                      {copiedBank === 'bsi' ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Salin No. Rekening</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Rekening 2: BRI */}
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-400 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-blue-700 text-sm tracking-wide bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          BANK RAKYAT INDONESIA (BRI)
                        </span>
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 pt-1">
                        0123 0100 4567 530
                      </div>
                      <p className="text-xs text-slate-500">
                        Atas Nama: <strong className="text-slate-800">BENDAHARA SPP LEMBAGA</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopyRekening('012301004567530', 'bri')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 text-xs transition active:scale-95"
                    >
                      {copiedBank === 'bri' ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Salin No. Rekening</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Rekening 3: Bank Mandiri */}
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-400 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-indigo-700 text-sm tracking-wide bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          BANK MANDIRI
                        </span>
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 pt-1">
                        1310 0987 6543 2
                      </div>
                      <p className="text-xs text-slate-500">
                        Atas Nama: <strong className="text-slate-800">SEKOLAH MANAJEMEN TERPADU</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopyRekening('1310098765432', 'mandiri')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 text-xs transition active:scale-95"
                    >
                      {copiedBank === 'mandiri' ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Salin No. Rekening</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-amber-50 p-4 border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Peringatan Keamanan:</strong> Jangan pernah mentransfer biaya SPP ke nomor rekening pribadi perorangan guru/staf. Sekolah hanya bertanggung jawab atas transfer ke nomor rekening lembaga resmi di atas.
                  </p>
                </div>
              </div>
            </div>

            {/* Kolom 3: Panduan 3 Langkah & Konfirmasi Cepat */}
            <div className="space-y-6">
              {/* Panduan 3 Langkah */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm mb-4">
                  Panduan Alur Pembayaran
                </h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-black text-xs">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-800 block">Transfer ke Rekening Resmi</strong>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">
                        Kirimkan dana sesuai jumlah bulan yang hendak dibayar dengan mencantumkan berita transfer: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">SPP {siswa.nama} ({siswa.nis})</code>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-black text-xs">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-800 block">Simpan Struk / Bukti Transfer</strong>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">
                        Tangkapan layar (screenshot) m-Banking atau bukti struk ATM disimpan sebagai lampiran konfirmasi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-black text-xs">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-800 block">Konfirmasi ke Kasir Sekolah</strong>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">
                        Kirim bukti bayar melalui tombol WhatsApp di bawah. Kasir akan segera menginput data dan kuitansi sah akan otomatis terbit di portal ini.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 transition active:scale-95 shadow-md shadow-emerald-500/20 text-xs"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Konfirmasi Pembayaran (WhatsApp)</span>
                  </a>
                </div>
              </div>

              {/* Pembayaran Tunai di Kantor */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm text-xs">
                <h3 className="font-extrabold text-slate-900 text-sm mb-2">
                  Pembayaran Tunai di Loket TU
                </h3>
                <p className="text-slate-500 leading-relaxed mb-3">
                  Wali murid juga dapat membayar tunai langsung di kantor Tata Usaha pada jam operasional:
                </p>
                <div className="rounded-xl bg-slate-50 p-3 space-y-1 text-slate-600 font-medium border border-slate-100">
                  <div className="flex justify-between">
                    <span>Senin - Kamis</span>
                    <strong className="text-slate-900">07:30 - 14:30 WIB</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Jum&apos;at</span>
                    <strong className="text-slate-900">07:30 - 11:00 WIB</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sabtu</span>
                    <strong className="text-slate-900">07:30 - 13:00 WIB</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* KONTEN TAB: JADWAL PELAJARAN KELAS                             */}
        {/* ============================================================== */}
        {activeTab === 'jadwal' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Jadwal Pelajaran Mingguan Kelas {siswa.kelas?.namaKelas || '-'}
                </h2>
                <p className="text-xs text-slate-500">
                  Tahun Ajaran {jadwalData?.tahunAjaran || tahunAjaran} • Semester{' '}
                  {jadwalData?.semester || 'Ganjil'}
                </p>
              </div>
              <button
                onClick={fetchJadwal}
                className="inline-flex items-center gap-1.5 self-start text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingJadwal ? 'animate-spin' : ''}`} />
                <span>Segarkan Jadwal</span>
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              {loadingJadwal ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Memuat jadwal pelajaran kelas...
                </div>
              ) : !jadwalData?.jamSlots?.length || !jadwalData?.jadwalList?.length ? (
                <div className="p-12 text-center space-y-2">
                  <Calendar className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">
                    Jadwal Pelajaran Belum Tersedia
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Bagian Kurikulum belum mempublikasikan jadwal pelajaran untuk kelas{' '}
                    <strong>{siswa.kelas?.namaKelas || 'Anda'}</strong> pada periode aktif ini.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-3.5 font-bold uppercase tracking-wider text-[11px] text-slate-500 w-36 border-r border-slate-200">
                          Jam / Waktu
                        </th>
                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((hari) => (
                          <th
                            key={hari}
                            className="p-3.5 text-center font-bold uppercase tracking-wider text-[11px] text-slate-700 min-w-[135px] border-r last:border-r-0 border-slate-200"
                          >
                            {hari}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {jadwalData.jamSlots.map((slot: any) => {
                        if (slot.isIstirahat) {
                          return (
                            <tr key={slot.id} className="bg-amber-50/70">
                              <td className="p-2.5 border-r border-slate-200">
                                <span className="font-bold text-amber-800 block">
                                  {slot.namaSlot}
                                </span>
                                <span className="text-[10px] font-mono text-amber-600">
                                  {slot.jamMulai} – {slot.jamSelesai}
                                </span>
                              </td>
                              <td
                                colSpan={6}
                                className="p-2.5 text-center font-bold text-[11px] uppercase tracking-widest text-amber-700"
                              >
                                {slot.namaSlot} ({slot.jamMulai} – {slot.jamSelesai})
                              </td>
                            </tr>
                          )
                        }

                        return (
                          <tr key={slot.id}>
                            <td className="p-3 bg-slate-50/50 border-r border-slate-200 align-top">
                              <span className="font-bold text-slate-800 block">
                                {slot.namaSlot}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {slot.jamMulai} – {slot.jamSelesai}
                              </span>
                            </td>
                            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((hari) => {
                              const entry = jadwalData.jadwalList.find(
                                (j: any) => j.hari === hari && j.jamPelajaranId === slot.id
                              )
                              return (
                                <td
                                  key={hari}
                                  className="p-2 border-r last:border-r-0 border-slate-200 align-top"
                                >
                                  {entry ? (
                                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-2.5">
                                      <div className="font-bold text-slate-900 leading-snug">
                                        {entry.mapel?.nama}
                                      </div>
                                      <div className="mt-1 text-[11px] text-blue-700 font-medium truncate">
                                        {entry.guru?.nama}
                                      </div>
                                      {entry.ruangan && (
                                        <span className="mt-1 inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                                          {entry.ruangan}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="h-12 flex items-center justify-center text-slate-300">
                                      -
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* KONTEN TAB: NILAI & E-RAPOR SEMESTER                           */}
        {/* ============================================================== */}
        {activeTab === 'rapor' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Laporan Hasil Belajar (E-Rapor Semester)
                </h2>
                <p className="text-xs text-slate-500">
                  Tahun Ajaran {tahunAjaran} • Semester {raporSemester}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start">
                <div className="flex items-center rounded-xl bg-white p-1 border border-slate-200 text-xs">
                  <button
                    onClick={() => setRaporSemester('Ganjil')}
                    className={`rounded-lg px-3 py-1.5 font-bold transition ${
                      raporSemester === 'Ganjil'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ganjil
                  </button>
                  <button
                    onClick={() => setRaporSemester('Genap')}
                    className={`rounded-lg px-3 py-1.5 font-bold transition ${
                      raporSemester === 'Genap'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Genap
                  </button>
                </div>

                <button
                  onClick={() => fetchRapor(tahunAjaran, raporSemester)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingRapor ? 'animate-spin' : ''}`} />
                  <span>Segarkan</span>
                </button>
              </div>
            </div>

            {loadingRapor ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center text-xs text-slate-400">
                Memuat laporan hasil belajar siswa...
              </div>
            ) : !raporData?.published ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center space-y-2">
                <Award className="mx-auto h-10 w-10 text-amber-400" />
                <p className="text-sm font-bold text-slate-800">
                  E-Rapor Semester {raporSemester} Belum Diterbitkan
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Penilaian untuk tahun ajaran <strong>{tahunAjaran}</strong> semester{' '}
                  <strong>{raporSemester}</strong> saat ini masih dalam proses verifikasi oleh Wali Kelas.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Nilai Rata-rata</span>
                    <p className="mt-1 text-2xl font-black font-mono text-blue-600">
                      {raporData.summary?.rataRata || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Ketuntasan Mapel</span>
                    <p className="mt-1 text-2xl font-black text-emerald-600">
                      {raporData.summary?.jumlahTuntas || 0} / {raporData.summary?.jumlahMapel || 0} Tuntas
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Sikap Spiritual & Sosial</span>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {raporData.rapor?.sikapSpiritual || 'Baik'} / {raporData.rapor?.sikapSosial || 'Baik'}
                    </p>
                  </div>
                </div>

                {/* Tabel Nilai */}
                <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3.5 text-center w-12">No</th>
                          <th className="px-4 py-3.5">Mata Pelajaran</th>
                          <th className="px-4 py-3.5 text-center">KKM</th>
                          <th className="px-4 py-3.5 text-center">Nilai Akhir</th>
                          <th className="px-4 py-3.5 text-center">Predikat</th>
                          <th className="px-4 py-3.5">Deskripsi Capaian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {raporData.nilaiList?.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              Belum ada data nilai mata pelajaran.
                            </td>
                          </tr>
                        ) : (
                          raporData.nilaiList?.map((n: any, idx: number) => {
                            const tuntas = (n.nilaiAkhir || 0) >= (n.mapel?.kkm || 75)
                            return (
                              <tr key={n.id} className="hover:bg-slate-50/70">
                                <td className="px-4 py-3 text-center font-mono text-slate-400">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-bold text-slate-900 block">
                                    {n.mapel?.nama}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {n.mapel?.kelompok}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center font-mono text-slate-600">
                                  {n.mapel?.kkm || 75}
                                </td>
                                <td
                                  className={`px-4 py-3 text-center font-mono text-sm font-black ${
                                    tuntas ? 'text-emerald-600' : 'text-rose-600'
                                  }`}
                                >
                                  {n.nilaiAkhir}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                      n.predikat === 'A'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : n.predikat === 'B'
                                        ? 'bg-blue-100 text-blue-800'
                                        : n.predikat === 'C'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {n.predikat}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {n.deskripsi || '-'}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Absensi & Catatan Wali */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm text-xs space-y-3">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Rekapitulasi Ketidakhadiran
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Sakit</span>
                        <span className="text-lg font-black font-mono text-slate-800">
                          {raporData.rapor?.sakit || 0}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Izin</span>
                        <span className="text-lg font-black font-mono text-slate-800">
                          {raporData.rapor?.izin || 0}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Alpa</span>
                        <span className="text-lg font-black font-mono text-slate-800">
                          {raporData.rapor?.alpa || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm text-xs space-y-2">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Catatan & Keputusan Wali Kelas
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {raporData.rapor?.catatanWali ||
                        'Terus tingkatkan semangat belajar dan kedisiplinan.'}
                    </p>
                    {raporData.rapor?.ekstrakurikuler && (
                      <p className="pt-1 text-slate-600">
                        <strong>Ekstrakurikuler:</strong> {raporData.rapor.ekstrakurikuler}
                      </p>
                    )}
                    {raporData.rapor?.keputusan && (
                      <div className="mt-2 inline-block rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 font-bold text-emerald-700">
                        Keputusan: {raporData.rapor.keputusan}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 6B. KONTEN TAB 6: RIWAYAT PRESENSI & KEHADIRAN BULANAN         */}
        {/* ============================================================== */}
        {activeTab === 'absensi' && (
          <div className="space-y-6">
            {/* Header Filter Bulan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Riwayat Presensi & Kehadiran Santri
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Rekaman scan QR gerbang sekolah maupun presensi harian wali kelas per bulan.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-600">Pilih Bulan:</label>
                <input
                  type="month"
                  value={absensiBulan}
                  onChange={(e) => setAbsensiBulan(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-[#2563EB] focus:bg-white focus:outline-none"
                />
                <button
                  onClick={() => fetchAbsensi(absensiBulan)}
                  disabled={loadingAbsensi}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  title="Muat ulang data presensi"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingAbsensi ? 'animate-spin' : ''}`} />
                  <span>Segarkan</span>
                </button>
              </div>
            </div>

            {/* 4 Kartu KPI Ringkasan Kehadiran */}
            {absensiData?.summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700">Persentase Hadir</span>
                    <ClipboardCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {absensiData.summary.persenHadir}%
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {absensiData.summary.totalMasuk} dari {absensiData.summary.totalLogs} hari tercatat
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700">Tepat Waktu (Hadir)</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {absensiData.summary.hadir} <span className="text-xs font-semibold text-slate-500">hari</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Masuk sesuai jam operasional
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700">Terlambat</span>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    {absensiData.summary.terlambat} <span className="text-xs font-semibold text-slate-500">kali</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Melewati batas toleransi masuk
                  </p>
                </div>

                <div className="rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700">Sakit / Izin / Alpa</span>
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                  </div>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {absensiData.summary.sakit}S · {absensiData.summary.izin}I · {absensiData.summary.alpa}A
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ketidakhadiran bulan {absensiBulan}
                  </p>
                </div>
              </div>
            )}

            {/* Tabel Riwayat Log Presensi Harian */}
            <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Log Kehadiran Harian ({absensiBulan})
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {absensiData?.logs?.length || 0} catatan ditemukan
                </span>
              </div>

              {loadingAbsensi ? (
                <div className="p-10 text-center text-xs font-semibold text-slate-400">
                  Memuat riwayat presensi bulan {absensiBulan}...
                </div>
              ) : !absensiData?.logs || absensiData.logs.length === 0 ? (
                <div className="p-10 text-center">
                  <ClipboardCheck className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    Belum Ada Catatan Presensi
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tidak ada log kehadiran yang tercatat pada bulan {absensiBulan}.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Tanggal</th>
                        <th className="px-6 py-3.5">Jam Masuk</th>
                        <th className="px-6 py-3.5">Jam Pulang</th>
                        <th className="px-6 py-3.5">Metode</th>
                        <th className="px-6 py-3.5">Status</th>
                        <th className="px-6 py-3.5">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {absensiData.logs.map((log: any) => {
                        const normalizedStatus = String(log.status || '').toUpperCase()
                        const statusStyles: Record<string, string> = {
                          HADIR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          TERLAMBAT: 'bg-amber-50 text-amber-700 border-amber-200',
                          SAKIT: 'bg-sky-50 text-sky-700 border-sky-200',
                          IZIN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                          ALPA: 'bg-rose-50 text-rose-700 border-rose-200',
                        }
                        const badgeClass =
                          statusStyles[normalizedStatus] ||
                          'bg-slate-100 text-slate-700 border-slate-200'

                        const formattedDate = new Date(log.tanggal).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-6 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                              {formattedDate}
                            </td>
                            <td className="px-6 py-3.5 font-mono font-bold text-slate-700">
                              {log.jamMasuk || '-'}
                            </td>
                            <td className="px-6 py-3.5 font-mono font-bold text-slate-700">
                              {log.jamPulang || '-'}
                            </td>
                            <td className="px-6 py-3.5">
                              <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                                {log.metode === 'qr_scan' ? 'Scan QR Gerbang' : 'Input Kelas'}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <span
                                className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-extrabold ${badgeClass}`}
                              >
                                {normalizedStatus}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-slate-600">
                              {log.keterangan || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 6C. KONTEN TAB 7: KEDISIPLINAN, POIN PRESTASI & CATATAN BK      */}
        {/* ============================================================== */}
        {activeTab === 'kedisiplinan' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Buku Poin Kedisiplinan, Prestasi &amp; Bimbingan Konseling
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pantau akumulasi poin prestasi, catatan pelanggaran tata tertib, dan tindak lanjut BK.
                </p>
              </div>
              <button
                onClick={fetchKedisiplinan}
                disabled={loadingKedisiplinan}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingKedisiplinan ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {kedisiplinanData?.summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                  <span className="text-xs font-bold text-emerald-700">Total Poin Prestasi (+)</span>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    +{kedisiplinanData.summary.totalPoinPrestasi}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {kedisiplinanData.summary.totalPrestasiCount} penghargaan tercatat
                  </p>
                </div>

                <div className="rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
                  <span className="text-xs font-bold text-rose-700">Total Poin Pelanggaran (-)</span>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    -{kedisiplinanData.summary.totalPoinPelanggaran}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {kedisiplinanData.summary.totalPelanggaranCount} catatan pelanggaran
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
                  <span className="text-xs font-bold text-blue-700">Skor Bersih &amp; Status BK</span>
                  <p className="mt-2 text-2xl font-black font-mono text-slate-900">
                    {kedisiplinanData.summary.skorNet > 0
                      ? `+${kedisiplinanData.summary.skorNet}`
                      : kedisiplinanData.summary.skorNet}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-600">
                    {kedisiplinanData.summary.perluPerhatianBk
                      ? 'Perlu Pendampingan BK'
                      : 'Kondisi Kedisiplinan Baik'}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Riwayat Catatan Kedisiplinan &amp; Prestasi
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {kedisiplinanData?.logs?.length || 0} catatan
                </span>
              </div>

              {loadingKedisiplinan ? (
                <div className="p-10 text-center text-xs font-semibold text-slate-400">
                  Memuat riwayat kedisiplinan...
                </div>
              ) : !kedisiplinanData?.logs || kedisiplinanData.logs.length === 0 ? (
                <div className="p-10 text-center">
                  <ShieldCheck className="mx-auto h-10 w-10 text-emerald-400" />
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    Belum Ada Catatan Pelanggaran atau Prestasi
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Catatan pembinaan BK dan penghargaan prestasi siswa akan tampil di halaman ini.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3.5">Tanggal</th>
                        <th className="px-6 py-3.5">Kategori</th>
                        <th className="px-6 py-3.5">Poin</th>
                        <th className="px-6 py-3.5">Deskripsi &amp; Tindak Lanjut BK</th>
                        <th className="px-6 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {kedisiplinanData.logs.map((row: any) => {
                        const isPrestasi = row.jenis === 'prestasi'
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-6 py-3.5 whitespace-nowrap font-bold text-slate-800">
                              {new Date(row.tanggal).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-6 py-3.5 font-semibold text-slate-800">
                              {row.kategori?.nama}
                            </td>
                            <td className="px-6 py-3.5">
                              <span
                                className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-extrabold ${
                                  isPrestasi
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {isPrestasi ? `+${row.poin}` : `-${row.poin}`}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <p className="text-slate-700">{row.deskripsi}</p>
                              {row.tindakLanjut && (
                                <p className="mt-1 text-[11px] font-semibold text-blue-700">
                                  Tindak lanjut BK: {row.tindakLanjut}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-3.5 uppercase text-[11px] font-bold text-slate-600">
                              {row.statusBk}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 6D. KONTEN TAB 8: TAGIHAN NON-SPP & RIWAYAT CICILAN            */}
        {/* ============================================================== */}
        {activeTab === 'tagihan' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Tagihan Non-SPP &amp; Riwayat Cicilan
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Informasi tagihan uang pangkal, seragam, daftar ulang, ujian, beserta riwayat pembayaran cicilan.
                </p>
              </div>
              <button
                onClick={fetchTagihan}
                disabled={loadingTagihan}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingTagihan ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {tagihanData?.summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                  <span className="text-xs font-bold text-slate-500">Total Kewajiban Non-SPP</span>
                  <p className="mt-2 text-2xl font-black font-mono text-slate-900">
                    {formatRupiah(tagihanData.summary.totalWajibBayar)}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                  <span className="text-xs font-bold text-emerald-700">Sudah Dibayar</span>
                  <p className="mt-2 text-2xl font-black font-mono text-emerald-700">
                    {formatRupiah(tagihanData.summary.totalTerbayar)}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50 to-white p-5 shadow-sm">
                  <span className="text-xs font-bold text-rose-700">Sisa Tagihan / Cicilan</span>
                  <p className="mt-2 text-2xl font-black font-mono text-rose-700">
                    {formatRupiah(tagihanData.summary.totalSisa)}
                  </p>
                </div>
              </div>
            )}

            {loadingTagihan ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-400">
                Memuat daftar tagihan Non-SPP...
              </div>
            ) : !tagihanData?.tagihanList || tagihanData.tagihanList.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                <p className="mt-2 text-sm font-bold text-slate-700">
                  Tidak Ada Tagihan Non-SPP
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Saat ini tidak terdapat tagihan di luar SPP untuk akun siswa ini.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tagihanData.tagihanList.map((t: any) => {
                  const statusBadge =
                    t.status === 'lunas'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : t.status === 'cicilan'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                  const statusText =
                    t.status === 'lunas' ? 'LUNAS' : t.status === 'cicilan' ? 'CICILAN' : 'BELUM BAYAR'

                  return (
                    <div
                      key={t.id}
                      className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-blue-600">
                            {t.kodeTagihan} • TA {t.tahunAjaran}
                          </span>
                          <h3 className="text-base font-extrabold text-slate-900">{t.judul}</h3>
                          <p className="text-xs text-slate-500">{t.jenis?.nama}</p>
                        </div>
                        <span
                          className={`inline-flex self-start sm:self-center rounded-lg border px-3 py-1 text-xs font-extrabold ${statusBadge}`}
                        >
                          {statusText}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block">Kewajiban</span>
                          <strong className="font-mono text-slate-800">
                            {formatRupiah(t.wajibBayar)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Terbayar</span>
                          <strong className="font-mono text-emerald-700">
                            {formatRupiah(t.totalTerbayar)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Sisa</span>
                          <strong className="font-mono text-rose-600">
                            {formatRupiah(t.sisaTagihan)}
                          </strong>
                        </div>
                      </div>

                      {t.pembayaran && t.pembayaran.length > 0 && (
                        <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                            Riwayat Pembayaran ({t.pembayaran.length}x)
                          </p>
                          <div className="divide-y divide-slate-200/70 text-xs">
                            {t.pembayaran.map((p: any) => (
                              <div key={p.id} className="py-1.5 flex items-center justify-between">
                                <div>
                                  <span className="font-mono font-bold text-slate-700">
                                    {p.noTransaksi}
                                  </span>{' '}
                                  <span className="text-slate-500">
                                    ({new Date(p.tanggalBayar).toLocaleDateString('id-ID')} •{' '}
                                    {p.metodeBayar})
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-emerald-700">
                                  {formatRupiah(p.nominalBayar)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* KONTEN TAB: PERPUSTAKAAN & LITERASI DIGITAL                     */}
        {/* ============================================================== */}
        {activeTab === 'perpustakaan' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Layanan Pustaka &amp; Sirkulasi Buku
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Pantau buku yang sedang dipinjam, batas tanggal jatuh tempo, dan jelajahi koleksi buku perpustakaan sekolah.
                </p>
              </div>
              <button
                onClick={() => fetchPustaka(pustakaSearch, pustakaKategori)}
                disabled={loadingPustaka}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingPustaka ? 'animate-spin text-blue-600' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {loadingPustaka && !pustakaData ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                <span className="text-xs">Memuat data perpustakaan...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. BUKU SEDANG DIPINJAM */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span>Buku Sedang Dipinjam ({pustakaData?.peminjamanAktif?.length || 0})</span>
                  </h3>

                  {!pustakaData?.peminjamanAktif || pustakaData.peminjamanAktif.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-slate-400 text-xs">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <span>Anda sedang tidak meminjam buku perpustakaan saat ini.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pustakaData.peminjamanAktif.map((item: any) => {
                        const isOverdue = item.status === 'terlambat'
                        return (
                          <div
                            key={item.id}
                            className={`rounded-2xl border p-5 bg-white shadow-sm transition space-y-3 ${
                              isOverdue
                                ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20'
                                : 'border-amber-200 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-bold text-blue-600">
                                  {item.noPeminjaman}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                  {item.buku.judul}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  {item.buku.pengarang} • {item.buku.penerbit}
                                </p>
                              </div>

                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                                  isOverdue
                                    ? 'bg-rose-100 text-rose-700 animate-pulse'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {isOverdue ? `Terlambat ${item.terlambatHari} Hari` : `Sisa ${item.sisaHari} Hari`}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Tgl Pinjam:</span>
                                <span className="font-semibold text-slate-700">
                                  {new Date(item.tanggalPinjam).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Batas Kembali:</span>
                                <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>
                                  {new Date(item.jatuhTempo).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                            </div>

                            {item.denda > 0 && (
                              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex justify-between items-center">
                                <span>Denda Keterlambatan:</span>
                                <strong className="font-mono text-sm">{formatRupiah(item.denda)}</strong>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 2. JELAJAHI KATALOG BUKU PERPUSTAKAAN */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span>Jelajahi Koleksi Buku Pustaka Sekolah</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cek ketersediaan buku sebelum meminjam ke ruang perpustakaan.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Cari judul atau pengarang..."
                        value={pustakaSearch}
                        onChange={(e) => setPustakaSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') fetchPustaka(pustakaSearch, pustakaKategori)
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        onClick={() => fetchPustaka(pustakaSearch, pustakaKategori)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
                      >
                        Cari
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {pustakaData?.katalogBuku?.map((b: any) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition bg-slate-50/50 flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                              {b.kategori}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                b.isAvailable
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {b.isAvailable ? `Tersedia (${b.jumlahTersedia})` : 'Habis'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                            {b.judul}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1">
                            Oleh: {b.pengarang}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 flex justify-between font-mono">
                          <span>Lokasi: {b.lokasiRak}</span>
                          <span>Kode: {b.kodeBuku}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. RIWAYAT PEMINJAMAN SELESAI */}
                {pustakaData?.riwayatPeminjaman && pustakaData.riwayatPeminjaman.length > 0 && (
                  <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Riwayat Peminjaman Selesai ({pustakaData.riwayatPeminjaman.length})</span>
                    </h3>

                    <div className="divide-y divide-slate-100 text-xs">
                      {pustakaData.riwayatPeminjaman.map((r: any) => (
                        <div key={r.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">{r.buku.judul}</span>
                            <span className="text-slate-400 block text-[10px]">
                              Dipinjam: {new Date(r.tanggalPinjam).toLocaleDateString('id-ID')} • Dikembalikan:{' '}
                              {r.tanggalKembali ? new Date(r.tanggalKembali).toLocaleDateString('id-ID') : '-'}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            Selesai Dikembalikan
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 6B. TAB: KALENDER AKADEMIK & AGENDA SEKOLAH                     */}
        {/* ============================================================== */}
        {activeTab === 'kalender' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  <span>Kalender Akademik & Agenda Kegiatan Sekolah</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Jadwal penilaian, masa ujian (PTS/PAS), classmeeting, upacara, dan hari libur resmi sekolah.
                </p>
              </div>

              <button
                onClick={fetchKalender}
                disabled={loadingKalender}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingKalender ? 'animate-spin text-blue-600' : ''}`} />
                <span>Perbarui Agenda</span>
              </button>
            </div>

            {loadingKalender ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-sm font-semibold">Memuat agenda kegiatan sekolah...</p>
              </div>
            ) : kalenderEvents.length === 0 ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center text-slate-400">
                <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Belum ada agenda kegiatan yang dipublikasikan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kalenderEvents.map((item: any) => {
                  const startStr = new Date(item.tanggalMulai).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                  const endStr = new Date(item.tanggalSelesai).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                  const isSingle = item.tanggalMulai.slice(0, 10) === item.tanggalSelesai.slice(0, 10)

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-5 bg-white shadow-sm transition space-y-3 relative overflow-hidden ${
                        item.liburSekolah ? 'border-rose-200 bg-rose-50/15' : 'border-slate-200'
                      }`}
                      style={{ borderLeftWidth: '5px', borderLeftColor: item.warna || '#2563eb' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${item.warna || '#2563eb'}20`,
                              color: item.warna || '#2563eb',
                            }}
                          >
                            {item.kategori}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug pt-1">
                            {item.judul}
                          </h4>
                        </div>

                        {item.liburSekolah && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 whitespace-nowrap">
                            Libur Sekolah
                          </span>
                        )}
                      </div>

                      {item.deskripsi && (
                        <p className="text-xs text-slate-600 line-clamp-2">{item.deskripsi}</p>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">
                          📅 {isSingle ? startStr : `${startStr} s.d. ${endStr}`}
                        </span>
                        <span className="text-[10px] text-slate-400">TA {item.tahunAjaran}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* 7. MODAL PRATINJAU & CETAK SALINAN KUITANSI SAH               */}
      {/* ============================================================== */}
      <KuitansiModal
        isOpen={isKuitansiOpen}
        onClose={() => setIsKuitansiOpen(false)}
        data={selectedKuitansi}
      />
    </div>
  )
}
