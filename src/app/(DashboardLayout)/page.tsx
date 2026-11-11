'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  GraduationCap,
  Building2,
  Award,
  Coins,
  Receipt,
  Wallet,
  AlertTriangle,
  ArrowRight,
  Printer,
  Clock,
  Sparkles,
  Calendar,
  Globe,
  TrendingUp,
  PieChart,
} from 'lucide-react'
import Link from 'next/link'
import { formatRupiah } from '@/lib/terbilang'
import KuitansiModal from '@/components/spp/KuitansiModal'
import TrenKasChart from '@/components/dashboard/TrenKasChart'
import RasioKasDonut from '@/components/dashboard/RasioKasDonut'
import JenjangDonutChart from '@/components/dashboard/JenjangDonutChart'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  // Kuitansi Modal
  const [isKuitansiOpen, setIsKuitansiOpen] = useState(false)
  const [kuitansiData, setKuitansiData] = useState<any>(null)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats')
        const data = await res.json()
        if (data.success) {
          setStats(data.data)
        }
      } catch (err) {
        console.error('Fetch dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  // Sapaan Waktu Otomatis
  const getGreeting = () => {
    if (!currentTime) return 'Selamat Datang'
    const hours = currentTime.getHours()
    if (hours < 11) return 'Selamat Pagi'
    if (hours < 15) return 'Selamat Siang'
    if (hours < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }

  const handleOpenKuitansi = async (noTransaksi: string) => {
    try {
      const res = await fetch(`/api/spp/transaksi/${noTransaksi}`)
      const json = await res.json()
      if (json.success) {
        setKuitansiData(json.data)
        setIsKuitansiOpen(true)
      }
    } catch (err) {
      console.error('Load kuitansi error:', err)
    }
  }

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const formattedClock = currentTime
    ? currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB'
    : ''

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Welcome Card (Warna Putih Bersih) & Real-time Clock */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A]/10 border border-[#1E3A8A]/20 px-3 py-1 text-xs font-semibold text-[#1E3A8A] dark:bg-blue-950/60 dark:border-blue-900/60 dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5 text-[#2563EB] dark:text-blue-400" />
              <span>Sistem Manajemen Tata Kelola & Finansial Sekolah</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {getGreeting()}, Administrator!
            </h1>
            <p className="mt-1 max-w-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {stats?.sekolah?.namaSekolah || 'Sistem Informasi Manajemen Sekolah Terpadu'} • Tahun Ajaran 2024/2025
            </p>
            <div className="mt-3.5 flex items-center gap-2">
              <a
                href="/portal"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition shadow-xs"
              >
                <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Kunjungi Portal Publik Sekolah ↗</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col items-start rounded-xl border border-slate-100 bg-slate-50/90 p-3.5 dark:border-slate-800 dark:bg-slate-800/60 sm:items-end">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-xl font-black tracking-wider text-slate-900 dark:text-white">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{formattedClock}</span>
            </div>
          </div>
        </div>

        {/* Aksesoris Visual Dekoratif Halus */}
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-[#1E3A8A]/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 h-48 w-48 rounded-full bg-[#2563EB]/5 blur-3xl pointer-events-none" />
      </div>

      {/* 2. Quick Shortcuts (Jalan Pintas Aksi Utama) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/spp/kasir"
          className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Loket SPP</p>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">Kasir Cepat</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
        </Link>

        <Link
          href="/siswa"
          className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Kesiswaan</p>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">Olah Siswa</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
        </Link>

        <Link
          href="/spp/tunggakan"
          className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-rose-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Monitoring</p>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">Tunggakan</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-rose-600 transition-all" />
        </Link>

        <Link
          href="/pengaturan/sekolah"
          className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-indigo-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Kustomisasi</p>
              <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">Profil & Tema</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
        </Link>
      </div>

      {/* 3. 4 Metrik Kasir & Finansial SPP */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Ringkasan Finansial & Kasir SPP
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Penerimaan Hari Ini</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Coins className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(stats?.finansial?.penerimaanHariIni || 0)}
            </p>
            <p className="text-xs text-slate-500">Kas masuk hari ini</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-[#2563EB]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Transaksi Hari Ini</span>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats?.finansial?.transaksiHariIni || 0} Struk
            </p>
            <p className="text-xs text-slate-500">Kuitansi berhasil terbit</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-[#1E3A8A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Akumulasi Kas SPP</span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {formatRupiah(stats?.finansial?.totalPenerimaan || 0)}
            </p>
            <p className="text-xs text-slate-500">Total seluruh dana terhimpun</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-rose-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Estimasi Piutang SPP</span>
              <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-xl font-extrabold text-rose-600 dark:text-rose-400">
              {formatRupiah(stats?.finansial?.estimasiTunggakan || 0)}
            </p>
            <p className="text-xs text-slate-500">
              Dari {stats?.finansial?.totalSiswaNunggak || 0} santri/siswa nunggak
            </p>
          </div>
        </div>
      </div>

      {/* 4. VISUALISASI GRAFIK FINANSIAL (Tren Kas 12 Bulan & Rasio Donut) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom 1 & 2: Tren Realisasi Kas Masuk (12 Bulan) */}
        <div className="lg:col-span-2">
          <TrenKasChart
            data={stats?.finansial?.trenPenerimaanBulanan}
            totalPenerimaan={stats?.finansial?.totalPenerimaan || 0}
          />
        </div>

        {/* Kolom 3: Rasio Donut Kolektibilitas Kas vs Tunggakan */}
        <div>
          <RasioKasDonut
            totalPenerimaan={stats?.finansial?.totalPenerimaan || 0}
            estimasiTunggakan={stats?.finansial?.estimasiTunggakan || 0}
          />
        </div>
      </div>

      {/* 5. 4 Metrik Kesiswaan & Akademik */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Ringkasan Akademik & Kesiswaan
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Link
            href="/siswa"
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-400 transition-colors dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-[#2563EB]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Siswa Aktif</span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.akademik?.totalSiswaAktif || 0} Siswa
            </p>
            <p className="text-xs text-slate-500">Peserta didik aktif</p>
          </Link>

          <Link
            href="/pegawai"
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-400 transition-colors dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-emerald-500"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Guru & Tenaga Kerja</span>
              <GraduationCap className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.akademik?.totalPegawai || 0} Pegawai
            </p>
            <p className="text-xs text-slate-500">Dewan guru & staf TU</p>
          </Link>

          <Link
            href="/kelas"
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-purple-400 transition-colors dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-purple-500"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Rombongan Belajar</span>
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.akademik?.totalKelas || 0} Rombel
            </p>
            <p className="text-xs text-slate-500">Kelas aktif operasional</p>
          </Link>

          <Link
            href="/jurusan"
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-amber-400 transition-colors dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-[#F59E0B]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Program Jurusan</span>
              <Award className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {stats?.akademik?.totalJurusan || 0} Jurusan
            </p>
            <p className="text-xs text-slate-500">Kompetensi keahlian</p>
          </Link>
        </div>
      </div>

      {/* 6. VISUALISASI DEMOGRAFI & TABEL TRANSAKSI MUTAKHIR */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kolom 1: Donut Chart Distribusi Siswa per Jenjang */}
        <div>
          <JenjangDonutChart
            jenjangList={stats?.akademik?.jenjangBreakdown}
            totalSiswa={stats?.akademik?.totalSiswaAktif || 0}
          />
        </div>

        {/* Kolom 2 & 3: Tabel 5 Transaksi SPP Terbaru */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  5 Transaksi SPP Terbaru
                </h3>
                <p className="text-xs text-slate-500">Aktivitas loket kasir paling mutakhir</p>
              </div>
              <Link
                href="/spp/riwayat"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-100/90 border-b border-slate-200 text-[11px] uppercase text-[#1E3A8A] font-semibold dark:border-slate-800 dark:bg-slate-800/60 dark:text-blue-300">
                  <tr>
                    <th className="py-2.5 px-3">No. Transaksi</th>
                    <th className="py-2.5">Siswa</th>
                    <th className="py-2.5">Bulan</th>
                    <th className="py-2.5 text-right">Nominal</th>
                    <th className="py-2.5 text-center">Metode</th>
                    <th className="py-2.5 text-right px-3">Kuitansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {!stats?.recentTransactions || stats.recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada transaksi SPP yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    stats.recentTransactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {tx.noTransaksi}
                        </td>
                        <td className="py-2.5">
                          <p className="font-semibold text-slate-900 dark:text-white">{tx.namaSiswa}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{tx.kelas}</p>
                        </td>
                        <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          {tx.bulan}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatRupiah(tx.nominalBayar)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {tx.metodeBayar}
                          </span>
                        </td>
                        <td className="py-2.5 text-right px-3">
                          <button
                            onClick={() => handleOpenKuitansi(tx.noTransaksi)}
                            title="Cetak Kuitansi Resmi"
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Kuitansi Resmi */}
      <KuitansiModal
        isOpen={isKuitansiOpen}
        onClose={() => setIsKuitansiOpen(false)}
        data={kuitansiData}
      />
    </div>
  )
}
