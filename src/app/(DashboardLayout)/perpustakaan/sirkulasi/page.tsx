'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  QrCode,
  Plus,
  Search,
  RotateCcw,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  ArrowRightLeft,
  X,
  CreditCard,
  Check,
  MapPin,
  ExternalLink,
  DollarSign,
} from 'lucide-react'
import QrScannerModal from '@/components/spp/QrScannerModal'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'
import { formatRupiah } from '@/lib/terbilang'

interface SirkulasiItem {
  id: number
  noPeminjaman: string
  bukuId: number
  buku: {
    id: number
    kodeBuku: string
    judul: string
    pengarang: string
    penerbit: string
    coverUrl: string | null
    lokasiRak: string
    kategori: { nama: string }
  }
  siswaId: number
  siswa: {
    id: number
    nama: string
    nis: string
    nisn: string | null
    fotoUrl: string | null
    kelas: { namaKelas: string } | null
  }
  tanggalPinjam: string
  jatuhTempo: string
  tanggalKembali: string | null
  status: 'dipinjam' | 'kembali' | 'terlambat' | string
  denda: number
  dendaDibayar: boolean
  terlambatHari: number
  petugas: string
  catatan: string | null
}

export default function SirkulasiPerpustakaanPage() {
  const { canCreate, canEdit } = usePermission()
  const allowCreate = canCreate('/perpustakaan/sirkulasi')
  const allowEdit = canEdit('/perpustakaan/sirkulasi')

  const [loading, setLoading] = useState(true)
  const [sirkulasiList, setSirkulasiList] = useState<SirkulasiItem[]>([])
  const [stats, setStats] = useState({
    totalSirkulasi: 0,
    countDipinjam: 0,
    countTerlambat: 0,
    countKembali: 0,
    totalDenda: 0,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // QR Scanner Modal State
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false)

  // New Loan Modal State
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false)
  const [bookListOptions, setBookListOptions] = useState<any[]>([])
  const [studentListOptions, setStudentListOptions] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [selectedBook, setSelectedBook] = useState<any | null>(null)
  const [durasiHari, setDurasiHari] = useState(7)
  const [catatanPinjam, setCatatanPinjam] = useState('')
  const [savingLoan, setSavingLoan] = useState(false)

  // Return Book Modal State
  const [returnTarget, setReturnTarget] = useState<SirkulasiItem | null>(null)
  const [dendaDibayar, setDendaDibayar] = useState(true)
  const [catatanKembali, setCatatanKembali] = useState('')
  const [processingReturn, setProcessingReturn] = useState(false)

  // Fetch sirkulasi data
  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/perpustakaan/sirkulasi?${params.toString()}`)
      const json = await res.json()

      if (res.ok && json.success) {
        setSirkulasiList(json.data.sirkulasi || [])
        setStats(json.data.stats)
      } else {
        throw new Error(json.message || 'Gagal memuat data sirkulasi')
      }
    } catch (err: any) {
      console.error(err)
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat data sirkulasi' })
    } finally {
      setLoading(false)
    }
  }

  // Load books & students for modal selection
  const loadOptions = async () => {
    try {
      const [resBooks, resStudents] = await Promise.all([
        fetch('/api/perpustakaan/buku?tersediaOnly=true'),
        fetch('/api/siswa?limit=200&status=aktif'),
      ])
      const jsonBooks = await resBooks.json()
      const jsonStudents = await resStudents.json()

      if (jsonBooks.success) setBookListOptions(jsonBooks.data.buku || [])
      if (jsonStudents.success) setStudentListOptions(jsonStudents.data || [])
    } catch (e) {
      console.error('Error loading options:', e)
    }
  }

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  // Open Loan Modal
  const handleOpenLoanModal = () => {
    setSelectedStudent(null)
    setSelectedBook(null)
    setDurasiHari(7)
    setCatatanPinjam('')
    setIsLoanModalOpen(true)
    loadOptions()
  }

  // Handle Scan QR from student card
  const handleScanQrSuccess = async (decodedText: string) => {
    setIsQrScannerOpen(false)
    const scannedCode = decodedText.trim()

    // Try to find student by NIS or matching QR code
    try {
      const res = await fetch(`/api/siswa?search=${encodeURIComponent(scannedCode)}`)
      const json = await res.json()

      if (res.ok && json.success && json.data?.length > 0) {
        const student = json.data[0]
        setSelectedStudent(student)
        setIsLoanModalOpen(true)
        loadOptions()
        setFeedback({
          type: 'success',
          message: `QR Kartu Pelajar berhasil dikenali: ${student.nama} (NIS: ${student.nis})`,
        })
      } else {
        setFeedback({
          type: 'error',
          message: `Siswa dengan kode QR/NIS "${scannedCode}" tidak ditemukan di database`,
        })
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Gagal mencari data siswa dari scan QR' })
    }
  }

  // Submit New Loan
  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !selectedBook) {
      setFeedback({ type: 'error', message: 'Siswa peminjam dan buku wajib dipilih' })
      return
    }

    try {
      setSavingLoan(true)
      const res = await fetch('/api/perpustakaan/sirkulasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bukuId: selectedBook.id,
          siswaId: selectedStudent.id,
          durasiHari,
          catatan: catatanPinjam,
        }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memproses peminjaman')
      }

      setFeedback({ type: 'success', message: json.message || 'Peminjaman buku berhasil dicatat' })
      setIsLoanModalOpen(false)
      fetchData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memproses peminjaman' })
    } finally {
      setSavingLoan(false)
    }
  }

  // Submit Book Return
  const handleProcessReturn = async () => {
    if (!returnTarget) return

    try {
      setProcessingReturn(true)
      const res = await fetch(`/api/perpustakaan/sirkulasi/${returnTarget.id}/kembali`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dendaDibayar,
          catatan: catatanKembali,
        }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memproses pengembalian')
      }

      setFeedback({ type: 'success', message: json.message || 'Buku telah berhasil dikembalikan' })
      setReturnTarget(null)
      fetchData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal mengembalikan buku' })
    } finally {
      setProcessingReturn(false)
    }
  }

  // Client search filter
  const displayedSirkulasi = useMemo(() => {
    if (!searchQuery.trim()) return sirkulasiList
    const q = searchQuery.toLowerCase().trim()
    return sirkulasiList.filter(
      (s) =>
        s.noPeminjaman.toLowerCase().includes(q) ||
        s.buku.judul.toLowerCase().includes(q) ||
        s.buku.kodeBuku.toLowerCase().includes(q) ||
        s.siswa.nama.toLowerCase().includes(q) ||
        s.siswa.nis.toLowerCase().includes(q)
    )
  }, [sirkulasiList, searchQuery])

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Sirkulasi & Layanan Pustaka</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Sirkulasi Peminjaman & Pengembalian Buku
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Layanan peminjaman cepat terintegrasi Scan QR Kartu Pelajar, pelacakan jatuh tempo, dan denda otomatis.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {allowCreate && (
            <>
              {/* Scan QR Button */}
              <button
                onClick={() => setIsQrScannerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-semibold transition shadow-sm"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Scan QR Kartu Pelajar</span>
              </button>

              {/* Pinjam Baru Button */}
              <button
                onClick={handleOpenLoanModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition shadow-sm shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                <span>Pinjam Buku Baru</span>
              </button>
            </>
          )}

          <button
            onClick={fetchData}
            title="Muat Ulang Data"
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 text-sm">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 rounded-lg hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sedang Dipinjam */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Sedang Dipinjam
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.countDipinjam} Buku</div>
          <p className="text-xs text-gray-400 mt-1">Status aktif dalam masa pinjam</p>
        </div>

        {/* Terlambat (Overdue) */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-rose-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Terlambat / Overdue
            </span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.countTerlambat} Buku</div>
          <p className="text-xs text-gray-400 mt-1">Melebihi batas tanggal jatuh tempo</p>
        </div>

        {/* Sudah Dikembalikan */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Selesai Dikembalikan
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.countKembali} Peminjaman
          </div>
          <p className="text-xs text-gray-400 mt-1">Koleksi kembali ke rak pustaka</p>
        </div>

        {/* Akumulasi Denda */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-purple-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Total Denda Keterlambatan
            </span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatRupiah(stats.totalDenda)}
          </div>
          <p className="text-xs text-gray-400 mt-1">Tarif Rp 1.000 / hari keterlambatan</p>
        </div>
      </div>

      {/* 3. FILTER TABS & SEARCH */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'dipinjam', label: `Sedang Dipinjam (${stats.countDipinjam})` },
              { id: 'terlambat', label: `Terlambat (${stats.countTerlambat})` },
              { id: 'kembali', label: `Sudah Dikembalikan (${stats.countKembali})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === tab.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor pinjam, siswa, NIS, judul buku, atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>

          <div className="text-xs text-gray-500 self-end sm:self-auto">
            Ditemukan <strong className="text-gray-800 dark:text-gray-200">{displayedSirkulasi.length}</strong> transaksi
          </div>
        </div>
      </div>

      {/* 4. TABLE SIRKULASI */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-32">No. Pinjam</th>
                <th className="py-3.5 px-4 min-w-[180px]">Siswa Peminjam</th>
                <th className="py-3.5 px-4 min-w-[220px]">Buku & Kode</th>
                <th className="py-3.5 px-4 w-28">Tgl Pinjam</th>
                <th className="py-3.5 px-4 w-32">Jatuh Tempo</th>
                <th className="py-3.5 px-4 w-28 text-center">Status</th>
                <th className="py-3.5 px-4 w-24 text-right">Denda</th>
                <th className="py-3.5 px-4 w-32 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    <span>Sedang memuat data sirkulasi perpustakaan...</span>
                  </td>
                </tr>
              ) : displayedSirkulasi.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <span>Tidak ada data sirkulasi yang sesuai dengan kriteria.</span>
                  </td>
                </tr>
              ) : (
                displayedSirkulasi.map((item, idx) => {
                  const isKembali = item.status === 'kembali'
                  const isTerlambat = item.status === 'terlambat'

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-750 transition">
                      <td className="py-3.5 px-4 text-center text-gray-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {item.noPeminjaman}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{item.siswa.nama}</div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono">NIS: {item.siswa.nis}</span>
                          {item.siswa.kelas && (
                            <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-[10px]">
                              Kls {item.siswa.kelas.namaKelas}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                          {item.buku.judul}
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5 font-mono">
                          <span>{item.buku.kodeBuku}</span>
                          <span>•</span>
                          <span className="font-sans text-[10px] text-primary">{item.buku.lokasiRak}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {new Date(item.tanggalPinjam).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className={isTerlambat ? 'text-rose-600 font-bold' : 'text-gray-700 dark:text-gray-300'}>
                          {new Date(item.jatuhTempo).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {isTerlambat && (
                          <span className="text-[10px] text-rose-500 font-bold">
                            Terlambat {item.terlambatHari} hari
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isKembali ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Dikembalikan
                          </span>
                        ) : isTerlambat ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                            Terlambat
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Dipinjam
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-semibold">
                        {item.denda > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400">{formatRupiah(item.denda)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {!isKembali ? (
                          <button
                            onClick={() => {
                              setReturnTarget(item)
                              setDendaDibayar(true)
                              setCatatanKembali('')
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Kembalikan</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400">
                            Kembali{' '}
                            {item.tanggalKembali
                              ? new Date(item.tanggalKembali).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                })
                              : ''}
                          </span>
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

      {/* 5. MODAL PINJAM BUKU BARU */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Formulir Peminjaman Buku</h3>
                <p className="text-xs text-gray-500">Pilih siswa peminjam dan buku yang akan dipinjam</p>
              </div>
              <button
                onClick={() => setIsLoanModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLoan} className="space-y-4 text-xs">
              {/* Siswa Selector / Scan QR */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-700 dark:text-gray-300">
                    Siswa Peminjam <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoanModalOpen(false)
                      setIsQrScannerOpen(true)
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan Kartu Siswa</span>
                  </button>
                </div>

                <SearchableSelect
                  options={studentListOptions.map((s) => ({
                    value: String(s.id),
                    label: `${s.nama} (${s.nis})`,
                    sublabel: s.kelas ? `Kelas ${s.kelas.namaKelas}` : 'Tanpa Kelas',
                    badge: s.nis,
                  }))}
                  value={selectedStudent?.id ? String(selectedStudent.id) : ''}
                  onChange={(val) => {
                    const st = studentListOptions.find((s) => s.id === Number(val))
                    setSelectedStudent(st || null)
                  }}
                  placeholder="-- Pilih atau Cari Siswa --"
                  searchPlaceholder="Ketik nama atau NIS siswa..."
                  required
                />

                {selectedStudent && (
                  <div className="mt-2 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-900 dark:text-blue-200">{selectedStudent.nama}</span>
                      <span className="text-blue-700 dark:text-blue-300 ml-2">NIS: {selectedStudent.nis}</span>
                    </div>
                    <span className="text-blue-600 font-semibold">Aktif</span>
                  </div>
                )}
              </div>

              {/* Buku Selector */}
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Pilih Buku Pustaka <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={bookListOptions.map((b) => ({
                    value: String(b.id),
                    label: b.judul,
                    sublabel: `Kode: ${b.kodeBuku} • Lokasi: ${b.lokasiRak}`,
                    badge: `${b.jumlahTersedia} di rak`,
                  }))}
                  value={selectedBook?.id ? String(selectedBook.id) : ''}
                  onChange={(val) => {
                    const bk = bookListOptions.find((b) => b.id === Number(val))
                    setSelectedBook(bk || null)
                  }}
                  placeholder="-- Pilih atau Cari Buku --"
                  searchPlaceholder="Ketik judul buku atau kode..."
                  required
                />

                {selectedBook && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] space-y-1">
                    <div className="font-bold text-emerald-900 dark:text-emerald-200">{selectedBook.judul}</div>
                    <div className="text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                      <span>Pengarang: {selectedBook.pengarang}</span>
                      <span>•</span>
                      <span>Lokasi: {selectedBook.lokasiRak}</span>
                      <span>•</span>
                      <span className="font-bold">Sisa di Rak: {selectedBook.jumlahTersedia}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Durasi & Jatuh Tempo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Durasi Peminjaman
                  </label>
                  <select
                    value={durasiHari}
                    onChange={(e) => setDurasiHari(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  >
                    <option value={3}>3 Hari</option>
                    <option value={7}>7 Hari (1 Minggu - Standar)</option>
                    <option value={14}>14 Hari (2 Minggu)</option>
                    <option value={30}>30 Hari (1 Bulan)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Estimasi Jatuh Tempo
                  </label>
                  <div className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-bold">
                    {new Date(Date.now() + durasiHari * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Catatan / Keperluan</label>
                <input
                  type="text"
                  placeholder="Contoh: Tugas kelompok, belajar mandiri..."
                  value={catatanPinjam}
                  onChange={(e) => setCatatanPinjam(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingLoan || !selectedStudent || !selectedBook}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {savingLoan ? 'Menyimpan...' : 'Sah-kan Peminjaman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL KONFIRMASI PENGEMBALIAN BUKU */}
      {returnTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span>Konfirmasi Pengembalian Buku</span>
              </h3>
              <button
                onClick={() => setReturnTarget(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Peminjam:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {returnTarget.siswa.nama} ({returnTarget.siswa.nis})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Judul Buku:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                  {returnTarget.buku.judul}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Jatuh Tempo:</span>
                <span>{new Date(returnTarget.jatuhTempo).toLocaleDateString('id-ID')}</span>
              </div>

              {returnTarget.status === 'terlambat' || new Date() > new Date(returnTarget.jatuhTempo) ? (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-rose-600 font-bold flex justify-between items-center">
                  <span>Denda Keterlambatan:</span>
                  <span className="text-sm">
                    {formatRupiah(
                      Math.max(
                        1000,
                        Math.ceil(
                          (new Date().getTime() - new Date(returnTarget.jatuhTempo).getTime()) /
                            (1000 * 60 * 60 * 24)
                        ) * 1000
                      )
                    )}
                  </span>
                </div>
              ) : (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-emerald-600 font-semibold flex justify-between">
                  <span>Status Waktu:</span>
                  <span>Tepat Waktu (Bebas Denda)</span>
                </div>
              )}
            </div>

            {returnTarget.status === 'terlambat' || new Date() > new Date(returnTarget.jatuhTempo) ? (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={dendaDibayar}
                  onChange={(e) => setDendaDibayar(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>Siswa telah melunasi denda secara tunai ke perpustakaan</span>
              </label>
            ) : null}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Catatan Kondisi Buku (Opsional)
              </label>
              <input
                type="text"
                placeholder="Kondisi buku baik, utuh, tanpa coretan..."
                value={catatanKembali}
                onChange={(e) => setCatatanKembali(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReturnTarget(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={processingReturn}
                onClick={handleProcessReturn}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {processingReturn ? 'Memproses...' : 'Proses Pengembalian'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. QR CODE SCANNER MODAL */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScan={handleScanQrSuccess}
      />
    </div>
  )
}

