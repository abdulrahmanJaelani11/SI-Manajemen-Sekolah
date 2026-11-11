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
  const [activeTab, setActiveTab] = useState<'spp' | 'biodata' | 'pembayaran'>('spp')

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
        const res = await fetch('/api/portal/siswa/me')
        const json = await res.json()

        if (json.success && json.data) {
          setSiswa(json.data)
        } else {
          // Token tidak ada atau invalid
          router.push('/portal/login-siswa')
        }
      } catch (err) {
        console.error('Gagal verifikasi sesi:', err)
        router.push('/portal/login-siswa')
      } finally {
        setLoadingAuth(false)
      }
    }

    checkSession()
  }, [router])

  // 2. Muat Data SPP Siswa berdasarkan Tahun Ajaran
  const fetchSpp = async (thn: string) => {
    setLoadingSpp(true)
    try {
      const res = await fetch(`/api/portal/siswa/spp?tahunAjaran=${encodeURIComponent(thn)}`)
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

  useEffect(() => {
    if (siswa) {
      fetchSpp(tahunAjaran)
    }
  }, [siswa, tahunAjaran])

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
      router.push('/portal/login-siswa')
      router.refresh()
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
    return null
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
