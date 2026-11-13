'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Wallet,
  CalendarCheck,
  Receipt,
  Coins,
  Search,
  CheckCircle2,
  AlertCircle,
  Printer,
  CreditCard,
  User,
  ArrowRight,
  ShieldCheck,
  ScanLine,
  QrCode,
  X,
  Sparkles,
} from 'lucide-react'
import { formatRupiah, terbilang } from '@/lib/terbilang'
import KuitansiModal from '@/components/spp/KuitansiModal'
import QrScannerModal from '@/components/spp/QrScannerModal'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

function KasirSppContent() {
  const { canCreate } = usePermission()
  const allowCreate = canCreate('/spp/kasir')
  const searchParams = useSearchParams()
  const preselectedSiswaId = searchParams.get('siswaId')
  // Stats
  const [stats, setStats] = useState<any>({
    totalPenerimaan: 0,
    penerimaanHariIni: 0,
    totalTransaksiHariIni: 0,
    totalBulanTerbayar: 0,
  })

  // Siswa Search & Autocomplete
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null)

  // Status 12 Bulan
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025')
  const [tahunOptions, setTahunOptions] = useState<string[]>(['2024/2025', '2025/2026', '2023/2024'])
  const [loadingGrid, setLoadingGrid] = useState(false)
  const [sppData, setSppData] = useState<any>(null)

  // Kasir Checkout State
  const [selectedMonths, setSelectedMonths] = useState<any[]>([])
  const [diskon, setDiskon] = useState<number>(0)
  const [metodeBayar, setMetodeBayar] = useState('Tunai')
  const [petugas, setPetugas] = useState('Kasir Keuangan')
  const [catatan, setCatatan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Kuitansi Modal State
  const [isKuitansiOpen, setIsKuitansiOpen] = useState(false)
  const [kuitansiData, setKuitansiData] = useState<any>(null)

  // QR & Barcode Scanner States
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scanFeedback, setScanFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Fetch SPP Stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/spp/stats')
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch (err) {
      console.error('Fetch SPP stats error:', err)
    }
  }

  useEffect(() => {
    fetchStats()
    fetch('/api/akademik/tahun-ajaran/aktif')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          if (json.data.activePeriod?.nama) {
            setTahunAjaran(json.data.activePeriod.nama)
          }
          if (json.data.tahunList?.length > 0) {
            setTahunOptions(json.data.tahunList)
          }
        }
      })
      .catch(() => {})
  }, [])

  // Autocomplete Search Siswa
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/siswa?search=${encodeURIComponent(searchQuery)}&limit=6`)
        const data = await res.json()
        if (data.success) setSearchResults(data.data)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch Student 12 Month SPP Grid
  const loadSiswaGrid = async (siswaId: number, ta: string) => {
    setLoadingGrid(true)
    setSelectedMonths([])
    setErrorMessage('')
    try {
      const res = await fetch(`/api/spp/siswa/${siswaId}?tahunAjaran=${ta}`)
      const data = await res.json()
      if (data.success) {
        setSppData(data.data)
      }
    } catch (err) {
      console.error('Fetch student grid error:', err)
    } finally {
      setLoadingGrid(false)
    }
  }

  const handleSelectSiswa = (siswa: any) => {
    setSelectedSiswa(siswa)
    setSearchQuery('')
    setSearchResults([])
    loadSiswaGrid(siswa.id, tahunAjaran)
  }

  // Handle QR / Barcode Scan Lookup (Camera & Hardware USB Scanner)
  const handleScanLookup = async (rawCode: string) => {
    let cleanCode = rawCode.trim()
    if (cleanCode.toUpperCase().startsWith('SISWA:')) {
      cleanCode = cleanCode.substring(6).trim()
    }
    if (!cleanCode) return

    setScanFeedback(null)
    try {
      // 1. Cari berdasarkan NIS yang tepat (exact NIS)
      const res = await fetch(`/api/siswa?nis=${encodeURIComponent(cleanCode)}`)
      const json = await res.json()
      if (json.success && json.data && json.data.length > 0) {
        const found = json.data[0]
        handleSelectSiswa(found)
        setScanFeedback({
          type: 'success',
          message: `Kartu siswa terdeteksi: ${found.nama} (NIS: ${found.nis})`,
        })
        return
      }

      // 2. Fallback pencarian search string
      const res2 = await fetch(`/api/siswa?search=${encodeURIComponent(cleanCode)}&limit=1`)
      const json2 = await res2.json()
      if (json2.success && json2.data && json2.data.length > 0) {
        const found = json2.data[0]
        handleSelectSiswa(found)
        setScanFeedback({
          type: 'success',
          message: `Kartu siswa terdeteksi: ${found.nama} (NIS: ${found.nis})`,
        })
        return
      }

      setScanFeedback({
        type: 'error',
        message: `Siswa dengan NIS / Kode "${cleanCode}" tidak ditemukan dalam database.`,
      })
    } catch (err) {
      console.error('Scan lookup error:', err)
      setScanFeedback({
        type: 'error',
        message: 'Gagal memproses kode pemindaian kartu.',
      })
    }
  }

  // Handle Enter Key di Input Pencarian (Scanner USB Hardware mengirim Enter)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (searchQuery.trim()) {
        handleScanLookup(searchQuery)
      }
    }
  }

  // Auto-select siswa jika dipassing lewat URL (?siswaId=...)
  useEffect(() => {
    if (preselectedSiswaId) {
      fetch(`/api/siswa/${preselectedSiswaId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            handleSelectSiswa(json.data)
          }
        })
        .catch(console.error)
    }
  }, [preselectedSiswaId])

  // Toggle Checkbox Bulan
  const handleToggleMonth = (monthItem: any) => {
    if (monthItem.status === 'paid') return

    const exists = selectedMonths.some((m) => m.urutan === monthItem.urutan)
    if (exists) {
      setSelectedMonths(selectedMonths.filter((m) => m.urutan !== monthItem.urutan))
    } else {
      setSelectedMonths(
        [...selectedMonths, monthItem].sort((a, b) => a.urutan - b.urutan)
      )
    }
  }

  // Subtotal & Total
  const subtotal = selectedMonths.reduce((acc, m) => acc + (m.nominalTagihan || 0), 0)
  const totalBayar = Math.max(0, subtotal - (diskon || 0))

  // Submit Payment
  const handleProcessPayment = async () => {
    if (!selectedSiswa || selectedMonths.length === 0) return

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const payload = {
        siswaId: selectedSiswa.id,
        tahunAjaran,
        bulanList: selectedMonths.map((m) => ({
          bulan: m.bulan,
          urutanBulan: m.urutan,
          nominal: m.nominalTagihan,
        })),
        diskon,
        metodeBayar,
        petugas,
        keterangan: catatan,
      }

      const res = await fetch('/api/spp/bayar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const resJson = await res.json()

      if (!resJson.success) {
        setErrorMessage(resJson.message || 'Gagal memproses pembayaran')
        return
      }

      // Refresh Stats & Siswa Grid
      fetchStats()
      loadSiswaGrid(selectedSiswa.id, tahunAjaran)

      // Ambil data kuitansi lengkap untuk dicetak
      const resKuitansi = await fetch(`/api/spp/transaksi/${resJson.data.noTransaksi}`)
      const kuitansiJson = await resKuitansi.json()
      if (kuitansiJson.success) {
        setKuitansiData(kuitansiJson.data)
        setIsKuitansiOpen(true)
      }

      // Reset Form State
      setSelectedMonths([])
      setDiskon(0)
      setCatatan('')
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan jaringan: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // View existing receipt for paid month
  const handleOpenReceiptForMonth = async (noTransaksi: string) => {
    try {
      const res = await fetch(`/api/spp/transaksi/${noTransaksi}`)
      const json = await res.json()
      if (json.success) {
        setKuitansiData(json.data)
        setIsKuitansiOpen(true)
      }
    } catch (err) {
      console.error('Error load receipt:', err)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kasir Pembayaran SPP
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sistem loket kasir pembayaran SPP 12 bulan real-time, multi-bulan instan, dan cetak kuitansi resmi.
          </p>
        </div>
      </div>

      {/* 4 Metrik Finansial Kasir */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Penerimaan Hari Ini</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatRupiah(stats.penerimaanHariIni)}
          </p>
          <p className="text-xs text-slate-500">Setoran kas masuk hari ini</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Transaksi Hari Ini</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {stats.totalTransaksiHariIni} Struk
          </p>
          <p className="text-xs text-slate-500">Kuitansi berhasil diterbitkan</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Akumulasi Kas SPP</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {formatRupiah(stats.totalPenerimaan)}
          </p>
          <p className="text-xs text-slate-500">Keseluruhan dana iuran masuk</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Bulan Terbayar</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.totalBulanTerbayar} Bulan
          </p>
          <p className="text-xs text-slate-500">Total setoran bulan terverifikasi</p>
        </div>
      </div>

      {/* Bagian Pencarian & Panel Siswa */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Cari Peserta Didik (Ketik Nama / NIS atau Scan Kartu Siswa)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ketik nama / NIS (misal: 1234524) lalu tekan Enter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Tombol Kamera Scan QR */}
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition flex-shrink-0"
              title="Buka Kamera Pemindai QR Kartu Siswa"
            >
              <ScanLine className="h-4 w-4" />
              <span>Scan QR Kartu</span>
            </button>
          </div>

          {/* Autocomplete Dropdown List */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
              {searchResults.map((siswa) => (
                <button
                  key={siswa.id}
                  onClick={() => handleSelectSiswa(siswa)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-blue-50/70 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {siswa.nama.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{siswa.nama}</p>
                      <p className="text-xs text-slate-500 font-mono">NIS: {siswa.nis}</p>
                    </div>
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {siswa.jenjang?.kode} - {siswa.kelas?.namaKelas || 'Tanpa Kelas'}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Petunjuk & Status Hardware Scanner */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Siap memindai otomatis via <strong>Scanner Barcode/QR USB</strong> & kamera laptop/HP
            </span>
            {isSearching && <span className="text-blue-500 font-medium">Mencari...</span>}
          </div>

          {/* Scan Feedback Banner */}
          {scanFeedback && (
            <div
              className={`mt-3 flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-semibold ${
                scanFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {scanFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{scanFeedback.message}</span>
              </div>
              <button
                onClick={() => setScanFeedback(null)}
                className="text-slate-400 hover:text-slate-600 ml-2"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Ringkasan Profil Siswa Terpilih */}
        {selectedSiswa && (
          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-blue-950/60 dark:bg-blue-950/20">
            <div className="flex items-center gap-3.5">
              {selectedSiswa.fotoUrl ? (
                <img
                  src={selectedSiswa.fotoUrl}
                  alt={selectedSiswa.nama}
                  className="h-14 w-14 rounded-full object-cover border-2 border-white shadow dark:border-slate-800"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow text-lg">
                  {selectedSiswa.nama.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedSiswa.nama}
                  </h3>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {selectedSiswa.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                  NIS: {selectedSiswa.nis} • {selectedSiswa.jenjang?.kode} -{' '}
                  {selectedSiswa.kelas?.namaKelas || 'Belum Masuk Rombel'}
                  {selectedSiswa.jurusan ? ` (${selectedSiswa.jurusan.kodeJurusan})` : ''}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Wali: {selectedSiswa.namaWali || '-'} • Kontak: {selectedSiswa.telpWali || selectedSiswa.telpSiswa || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center w-48">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                T.A:
              </span>
              <SearchableSelect
                value={tahunAjaran}
                onChange={(val) => {
                  setTahunAjaran(val)
                  loadSiswaGrid(selectedSiswa.id, val)
                }}
                options={tahunOptions.map((t) => ({
                  value: t,
                  label: t,
                }))}
                placeholder="Pilih Tahun Ajaran"
                searchPlaceholder="Cari..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Grid 12 Bulan Pembayaran & Panel Checkout */}
      {selectedSiswa ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Kolom Kiri: Grid 12 Bulan (Juli s.d. Juni) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Status 12 Bulan SPP
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tahun Ajaran {tahunAjaran} • Tarif Bulanan:{' '}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatRupiah(sppData?.tarifNominal || 150000)}
                    </span>
                  </p>
                </div>
                {sppData?.summary && (
                  <div className="flex gap-2 text-xs">
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Lunas: {sppData.summary.totalBulanTerbayar}
                    </span>
                    <span className="rounded-lg bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      Tunggakan: {sppData.summary.totalBulanTunggakan}
                    </span>
                  </div>
                )}
              </div>

              {loadingGrid ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  Memuat data transaksi 12 bulan...
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {sppData?.months?.map((m: any) => {
                    const isSelected = selectedMonths.some((sm) => sm.urutan === m.urutan)
                    const isPaid = m.status === 'paid'

                    return (
                      <div
                        key={m.urutan}
                        onClick={() => handleToggleMonth(m)}
                        className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                          isPaid
                            ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                            : isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500 dark:border-blue-500 dark:bg-blue-950/40 cursor-pointer'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-mono text-slate-400">#{m.urutan}</span>
                          {isPaid ? (
                            <span className="flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                              <CheckCircle2 className="h-3 w-3" /> LUNAS
                            </span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleMonth(m)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          )}
                        </div>

                        <div className="my-2">
                          <h4 className="font-bold text-slate-900 dark:text-white">{m.bulan}</h4>
                          <p className="font-mono text-xs text-slate-600 dark:text-slate-300">
                            {formatRupiah(isPaid ? m.nominalBayar : m.nominalTagihan)}
                          </p>
                        </div>

                        {isPaid ? (
                          <div className="flex items-center justify-between border-t border-emerald-200/60 pt-2 text-[10px] text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300">
                            <span className="truncate">{new Date(m.tanggalBayar).toLocaleDateString('id-ID')}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenReceiptForMonth(m.noTransaksi)
                              }}
                              title="Cetak Kuitansi"
                              className="rounded p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="border-t border-slate-100 pt-1 text-[10px] text-slate-400 dark:border-slate-800">
                            {isSelected ? 'Terpilih untuk bayar' : 'Klik untuk bayar'}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Panel Checkout Kasir */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 pb-3 dark:border-slate-800">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Form Pembayaran Kasir
              </h3>

              {errorMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {selectedMonths.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2 text-slate-300" />
                  <p className="text-xs">
                    Centang salah satu atau beberapa bulan pada grid untuk memproses transaksi kasir.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4 text-sm">
                  {/* Daftar Bulan Terpilih */}
                  <div>
                    <span className="text-xs font-semibold text-slate-500">
                      Bulan Dipilih ({selectedMonths.length} Bulan):
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedMonths.map((m) => (
                        <span
                          key={m.urutan}
                          className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        >
                          {m.bulan}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                    <span className="text-slate-500">Subtotal Tagihan:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatRupiah(subtotal)}
                    </span>
                  </div>

                  {/* Diskon / Beasiswa */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Potongan / Keringanan (Diskon Rp):
                    </label>
                    <input
                      type="number"
                      value={diskon || ''}
                      onChange={(e) => setDiskon(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Total Akhir */}
                  <div className="rounded-xl bg-slate-900 p-4 text-white dark:bg-slate-800">
                    <span className="text-xs text-slate-400">Total Yang Harus Dibayar:</span>
                    <p className="mt-0.5 font-mono text-2xl font-extrabold text-emerald-400">
                      {formatRupiah(totalBayar)}
                    </p>
                    <p className="mt-1 text-[11px] italic text-slate-300 truncate">
                      "{terbilang(totalBayar)}"
                    </p>
                  </div>

                  {/* Metode Bayar */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Metode Pembayaran:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Tunai', 'Transfer', 'QRIS'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMetodeBayar(m)}
                          className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                            metodeBayar === m
                              ? 'border-blue-600 bg-blue-600 text-white shadow'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Petugas Kasir */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Kasir Penerima:
                    </label>
                    <input
                      type="text"
                      value={petugas}
                      onChange={(e) => setPetugas(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Catatan */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Keterangan / Catatan Transaksi:
                    </label>
                    <input
                      type="text"
                      placeholder="Catatan tambahan (opsional)"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Tombol Eksekusi Bayar */}
                  {allowCreate ? (
                    <button
                      onClick={handleProcessPayment}
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 focus:outline-none disabled:opacity-50 transition-all"
                    >
                      <ShieldCheck className="h-5 w-5" />
                      {isSubmitting ? 'Memproses Transaksi...' : `Bayar & Terbitkan Kuitansi (${formatRupiah(totalBayar)})`}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                      Mode Lihat Saja: Akun Anda tidak memiliki hak akses [CREATE] untuk memproses pembayaran kasir SPP.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-16 text-center dark:border-slate-800">
          <User className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-2" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
            Belum Ada Siswa Yang Dipilih
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Gunakan kolom pencarian di atas untuk memilih siswa dan menampilkan status pembayaran SPP 12 bulannya.
          </p>
        </div>
      )}

      {/* Modal Kuitansi Resmi */}
      <KuitansiModal
        isOpen={isKuitansiOpen}
        onClose={() => setIsKuitansiOpen(false)}
        data={kuitansiData}
      />

      {/* Modal Scanner QR Kamera */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanLookup}
      />
    </div>
  )
}

export default function KasirSppPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          Memuat kasir SPP...
        </div>
      }
    >
      <KasirSppContent />
    </Suspense>
  )
}
