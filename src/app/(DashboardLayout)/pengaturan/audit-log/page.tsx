'use client'

import React, { useEffect, useState } from 'react'
import {
  History,
  Search,
  RotateCcw,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  ShieldAlert,
  User,
  Globe,
  Monitor,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

interface AuditLogItem {
  id: number
  userId: number | null
  username: string | null
  namaUser: string | null
  role: string | null
  modul: string
  aksi: string
  deskripsi: string
  dataSebelum: string | null
  dataSesudah: string | null
  ipAddress: string | null
  userAgent: string | null
  status: string
  createdAt: string
}

interface StatsData {
  totalLogs: number
  totalToday: number
  totalChange: number
  totalAuth: number
  totalWarning: number
}

const MODUL_COLORS: Record<string, { label: string; badge: string }> = {
  AUTH: { label: 'Autentikasi & Akun', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' },
  AKADEMIK: { label: 'Akademik & Rapor', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  KEUANGAN: { label: 'Keuangan & SPP', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  KESISWAAN: { label: 'Kesiswaan & BK', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
  PERPUSTAKAAN: { label: 'Perpustakaan', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  SARPRAS: { label: 'Sarpras & Aset', badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' },
  CMS: { label: 'CMS & Web Portal', badge: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300' },
  PENGATURAN: { label: 'Pengaturan Sistem', badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  SISTEM: { label: 'Sistem Inti', badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
}

const AKSI_BADGES: Record<string, { label: string; color: string }> = {
  LOGIN: { label: 'Login', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  LOGOUT: { label: 'Logout', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  CREATE: { label: 'Tambah Data', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  UPDATE: { label: 'Ubah Data', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  DELETE: { label: 'Hapus Data', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  VOID: { label: 'Batal / Void', color: 'bg-red-50 text-red-700 border-red-200' },
  EXPORT: { label: 'Ekspor Data', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  IMPORT: { label: 'Impor Massal', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PRINT: { label: 'Cetak Dokumen', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  STATUS_CHANGE: { label: 'Ganti Status', color: 'bg-teal-50 text-teal-700 border-teal-200' },
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalLogs: 0,
    totalToday: 0,
    totalChange: 0,
    totalAuth: 0,
    totalWarning: 0,
  })
  const [userList, setUserList] = useState<{ username: string; namaUser: string | null }[]>([])
  const [loading, setLoading] = useState(true)

  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModul, setSelectedModul] = useState('all')
  const [selectedAksi, setSelectedAksi] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedUsername, setSelectedUsername] = useState('all')
  const [tanggalAwal, setTanggalAwal] = useState('')
  const [tanggalAkhir, setTanggalAkhir] = useState('')

  // Modal Snapshot Detail State
  const [detailLog, setDetailLog] = useState<AuditLogItem | null>(null)

  // Feedback State
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', String(limit))
      if (searchQuery) params.append('search', searchQuery)
      if (selectedModul !== 'all') params.append('modul', selectedModul)
      if (selectedAksi !== 'all') params.append('aksi', selectedAksi)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (selectedUsername !== 'all') params.append('username', selectedUsername)
      if (tanggalAwal) params.append('tanggalAwal', tanggalAwal)
      if (tanggalAkhir) params.append('tanggalAkhir', tanggalAkhir)

      const res = await fetch(`/api/pengaturan/audit-log?${params.toString()}`)
      const json = await res.json()

      if (res.ok && json.success) {
        setLogs(json.data.logs || [])
        setStats(json.data.stats || { totalLogs: 0, totalToday: 0, totalChange: 0, totalAuth: 0, totalWarning: 0 })
        if (json.data.pagination) {
          setTotalPages(json.data.pagination.totalPages || 1)
        }
        if (json.data.userList) {
          setUserList(json.data.userList)
        }
      } else {
        throw new Error(json.message || 'Gagal memuat log audit')
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Terjadi kesalahan sistem' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, limit, searchQuery, selectedModul, selectedAksi, selectedStatus, selectedUsername, tanggalAwal, tanggalAkhir])

  // Export CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert('Tidak ada log untuk diekspor.')
      return
    }

    const headers = ['Waktu', 'Pengguna', 'Role', 'Modul', 'Aksi', 'Status', 'IP Address', 'Deskripsi']
    const rows = logs.map((l) => [
      `"${new Date(l.createdAt).toLocaleString('id-ID')}"`,
      `"${l.namaUser || l.username || '-'}"`,
      `"${l.role || '-'}"`,
      `"${l.modul}"`,
      `"${l.aksi}"`,
      `"${l.status}"`,
      `"${l.ipAddress || '-'}"`,
      `"${l.deskripsi.replace(/"/g, '""')}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Audit_Trail_Sekolah_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Parse JSON helper
  const tryFormatJson = (str: string | null) => {
    if (!str) return null
    try {
      const obj = JSON.parse(str)
      return JSON.stringify(obj, null, 2)
    } catch {
      return str
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <History className="w-7 h-7 text-primary" />
            <span>Audit Trail & Log Pengawasan Keamanan</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Rekam jejak seluruh aktivitas staf, mutasi data keuangan, akademik, sirkulasi buku, sarpras, dan sesi autentikasi
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 shadow-xs transition"
            title="Muat ulang log"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 text-sm">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 rounded-lg hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Log Terekam</span>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalLogs} Log</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Sesuai filter pencarian</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-sm">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Aktivitas Hari Ini
          </span>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.totalToday} Aksi</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Aktivitas 24 jam terakhir</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-amber-100 dark:border-gray-700 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Perubahan Data
          </span>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.totalChange} Mutasi</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Create, Update, Delete</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Autentikasi & Login
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.totalAuth} Sesi</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Masuk & keluar akun</p>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-rose-100 dark:border-gray-700 shadow-sm">
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Peringatan / Gagal
          </span>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.totalWarning} Kejadian</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Akses ditolak / error</p>
        </div>
      </div>

      {/* 3. FILTER BAR DENGAN SEARCHABLE SELECT */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari deskripsi, username, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>

          {/* Filter Modul dengan SearchableSelect */}
          <div>
            <SearchableSelect
              options={[
                { value: 'all', label: 'Semua Modul Sistem' },
                { value: 'AUTH', label: 'Autentikasi & Akun', sublabel: 'Login, logout, sesi' },
                { value: 'AKADEMIK', label: 'Akademik & Rapor', sublabel: 'Nilai, kurikulum, kalender' },
                { value: 'KEUANGAN', label: 'Keuangan & SPP', sublabel: 'Kasir, kas umum, laporan' },
                { value: 'KESISWAAN', label: 'Kesiswaan & BK', sublabel: 'Kedisiplinan & alumni' },
                { value: 'PERPUSTAKAAN', label: 'Perpustakaan Digital', sublabel: 'Katalog & sirkulasi QR' },
                { value: 'SARPRAS', label: 'Sarpras & Aset', sublabel: 'Ruangan & inventaris' },
                { value: 'CMS', label: 'CMS & Web Publik', sublabel: 'Berita & galeri' },
                { value: 'PENGATURAN', label: 'Pengaturan Sistem', sublabel: 'Hak akses & profil' },
              ]}
              value={selectedModul}
              onChange={(val) => {
                setSelectedModul(val || 'all')
                setPage(1)
              }}
              placeholder="Pilih Modul..."
              searchPlaceholder="Cari modul..."
            />
          </div>

          {/* Filter Aksi dengan SearchableSelect */}
          <div>
            <SearchableSelect
              options={[
                { value: 'all', label: 'Semua Jenis Aksi' },
                { value: 'LOGIN', label: 'Login Masuk Akun' },
                { value: 'LOGOUT', label: 'Logout Keluar' },
                { value: 'CREATE', label: 'Perekaman Data Baru' },
                { value: 'UPDATE', label: 'Perubahan / Edit Data' },
                { value: 'DELETE', label: 'Penghapusan Data' },
                { value: 'VOID', label: 'Pembatalan Transaksi / Void' },
                { value: 'EXPORT', label: 'Ekspor Berkas' },
                { value: 'PRINT', label: 'Pencetakan Dokumen' },
              ]}
              value={selectedAksi}
              onChange={(val) => {
                setSelectedAksi(val || 'all')
                setPage(1)
              }}
              placeholder="Pilih Aksi..."
              searchPlaceholder="Cari jenis aksi..."
            />
          </div>

          {/* Filter Pengguna dengan SearchableSelect */}
          <div>
            <SearchableSelect
              options={[
                { value: 'all', label: 'Semua Pengguna' },
                ...userList.map((u) => ({
                  value: u.username,
                  label: u.namaUser || u.username,
                  sublabel: `@${u.username}`,
                })),
              ]}
              value={selectedUsername}
              onChange={(val) => {
                setSelectedUsername(val || 'all')
                setPage(1)
              }}
              placeholder="Pilih Pengguna..."
              searchPlaceholder="Cari staf / akun..."
            />
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Periode Tanggal:</span>
            <input
              type="date"
              value={tanggalAwal}
              onChange={(e) => setTanggalAwal(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none"
            />
            <span className="text-gray-400">s.d.</span>
            <input
              type="date"
              value={tanggalAkhir}
              onChange={(e) => setTanggalAkhir(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 outline-none"
            />
          </div>

          {(tanggalAwal || tanggalAkhir) && (
            <button
              onClick={() => {
                setTanggalAwal('')
                setTanggalAkhir('')
              }}
              className="text-xs text-rose-500 hover:underline font-semibold"
            >
              Reset Tanggal
            </button>
          )}
        </div>
      </div>

      {/* 4. AUDIT LOG TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-gray-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Waktu Kejadian</th>
                <th className="px-4 py-3">Pengguna & Peran</th>
                <th className="px-4 py-3">Modul & Aksi</th>
                <th className="px-4 py-3">Deskripsi Aktivitas</th>
                <th className="px-4 py-3">Alamat IP / Klien</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <RotateCcw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <span>Memuat catatan riwayat aktivitas staf...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <History className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Tidak ada log aktivitas yang cocok</p>
                    <p className="text-xs text-gray-400 mt-0.5">Coba sesuaikan filter waktu, modul, atau kata kunci pencarian.</p>
                  </td>
                </tr>
              ) : (
                logs.map((l) => {
                  const mod = MODUL_COLORS[l.modul] || MODUL_COLORS.SISTEM
                  const akt = AKSI_BADGES[l.aksi] || { label: l.aksi, color: 'bg-gray-50 text-gray-700' }
                  const hasSnapshot = Boolean(l.dataSebelum || l.dataSesudah)

                  return (
                    <tr key={l.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition">
                      {/* Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {new Date(l.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {new Date(l.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* User & Role */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                          {l.namaUser || l.username || 'Sistem'}
                        </div>
                        <div className="text-[10px] text-primary font-medium">
                          {l.role ? `[${l.role}]` : '@' + (l.username || 'system')}
                        </div>
                      </td>

                      {/* Modul & Aksi */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${mod.badge} mb-1`}>
                          {mod.label}
                        </span>
                        <div>
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md border ${akt.color}`}>
                            {akt.label}
                          </span>
                        </div>
                      </td>

                      {/* Deskripsi */}
                      <td className="px-4 py-3 max-w-xs text-gray-800 dark:text-gray-200">
                        <p className="line-clamp-2 leading-relaxed">{l.deskripsi}</p>
                      </td>

                      {/* IP & User Agent */}
                      <td className="px-4 py-3 whitespace-nowrap text-[11px] text-gray-500">
                        <div className="font-mono flex items-center gap-1 text-gray-700 dark:text-gray-300">
                          <Globe className="w-3 h-3 text-gray-400" />
                          <span>{l.ipAddress || '127.0.0.1'}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[140px]" title={l.userAgent || ''}>
                          {l.userAgent || 'Web Client'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {l.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Sukses</span>
                          </span>
                        ) : l.status === 'WARNING' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Peringatan</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <AlertCircle className="w-3 h-3" />
                            <span>Gagal</span>
                          </span>
                        )}
                      </td>

                      {/* Snapshot Button */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {hasSnapshot ? (
                          <button
                            onClick={() => setDetailLog(l)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-primary hover:text-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 transition font-semibold text-[11px]"
                            title="Lihat Snapshot Data Sebelum & Sesudah"
                          >
                            <Database className="w-3 h-3" />
                            <span>Detail Data</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-300 dark:text-gray-600">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. PAGINATION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700 gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
            >
              <option value={20}>20 log</option>
              <option value={50}>50 log</option>
              <option value={100}>100 log</option>
            </select>
            <span>dari {stats.totalLogs} total aktivitas</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 disabled:opacity-40"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-800 dark:text-gray-200 px-2">
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 disabled:opacity-40"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. MODAL DETAIL SNAPSHOT DATA */}
      {detailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <span className="text-[10px] font-mono text-primary font-bold">LOG #{detailLog.id}</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  Snapshot Perubahan Data Aktivitas
                </h3>
              </div>
              <button
                onClick={() => setDetailLog(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs space-y-1">
              <p className="font-semibold text-gray-800 dark:text-gray-200">{detailLog.deskripsi}</p>
              <div className="text-[11px] text-gray-500 flex items-center gap-3 pt-1">
                <span>Oleh: <strong>{detailLog.namaUser || detailLog.username}</strong> ({detailLog.role || '-'})</span>
                <span>•</span>
                <span>Waktu: {new Date(detailLog.createdAt).toLocaleString('id-ID')}</span>
                <span>•</span>
                <span>IP: {detailLog.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>

            {/* Side-by-side Snapshot Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Data Sebelum */}
              <div className="space-y-1.5">
                <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-rose-500" />
                  <span>Snapshot Sebelum Perubahan:</span>
                </span>
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800">
                  {tryFormatJson(detailLog.dataSebelum) || '// Tidak ada data snapshot sebelumnya (record baru dibuat)'}
                </pre>
              </div>

              {/* Data Sesudah */}
              <div className="space-y-1.5">
                <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Snapshot Setelah Perubahan:</span>
                </span>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800">
                  {tryFormatJson(detailLog.dataSesudah) || '// Tidak ada data snapshot setelahnya (record telah dihapus)'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
              <button
                type="button"
                onClick={() => setDetailLog(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold"
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

