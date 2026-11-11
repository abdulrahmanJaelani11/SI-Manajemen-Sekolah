'use client'

import React, { useState, useEffect } from 'react'
import {
  AlertCircle,
  Search,
  Download,
  CalendarX,
  Users,
  Wallet,
  ArrowRight,
  Phone,
} from 'lucide-react'
import { formatRupiah } from '@/lib/terbilang'
import Link from 'next/link'
import SearchableSelect from '@/components/ui/searchable-select'

export default function TunggakanSppPage() {
  const [dataTunggakan, setDataTunggakan] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({
    totalSiswaNunggak: 0,
    totalBulanNunggak: 0,
    totalEstimasiPiutang: 0,
  })
  const [masterJenjang, setMasterJenjang] = useState<any[]>([])
  const [masterKelas, setMasterKelas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedJenjang, setSelectedJenjang] = useState('')
  const [selectedKelas, setSelectedKelas] = useState('')
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025')

  const fetchTunggakan = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedJenjang) params.append('jenjangId', selectedJenjang)
      if (selectedKelas) params.append('kelasId', selectedKelas)
      if (tahunAjaran) params.append('tahunAjaran', tahunAjaran)

      const res = await fetch(`/api/spp/tunggakan?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setDataTunggakan(data.data.items)
        setSummary(data.data.summary)
      }
    } catch (err) {
      console.error('Fetch tunggakan error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMaster = async () => {
    try {
      const [resJ, resK] = await Promise.all([
        fetch('/api/master/jenjang'),
        fetch('/api/master/kelas'),
      ])
      const dataJ = await resJ.json()
      const dataK = await resK.json()
      if (dataJ.success) setMasterJenjang(dataJ.data)
      if (dataK.success) setMasterKelas(dataK.data)
    } catch (err) {
      console.error('Fetch master error:', err)
    }
  }

  useEffect(() => {
    fetchMaster()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTunggakan()
    }, 250)
    return () => clearTimeout(timer)
  }, [search, selectedJenjang, selectedKelas, tahunAjaran])

  // Download CSV Tunggakan
  const handleExportCsv = () => {
    const headers = ['NIS', 'Nama Siswa', 'Jenjang', 'Kelas', 'Wali Murid', 'Kontak Wali', 'Bulan Nunggak', 'Daftar Bulan', 'Estimasi Tunggakan (Rp)']
    const rows = dataTunggakan.map((item) => [
      `"${item.nis}"`,
      `"${item.nama}"`,
      `"${item.jenjang || ''}"`,
      `"${item.kelas || ''}"`,
      `"${item.namaWali || ''}"`,
      `"${item.telpWali || ''}"`,
      `"${item.jumlahBulanNunggak}"`,
      `"${item.bulanNunggakList.join(', ')}"`,
      `"${item.totalTunggakanNominal}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `rekap_tunggakan_spp_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Rekapitulasi Tunggakan SPP
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitoring piutang dan rekapitulasi siswa yang belum melunasi kewajiban iuran SPP.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={dataTunggakan.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Ekspor CSV Tunggakan
        </button>
      </div>

      {/* 3 Metrik Tunggakan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Siswa Menunggak</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400">
            {summary.totalSiswaNunggak} Siswa
          </p>
          <p className="text-xs text-slate-500">Memiliki tagihan aktif</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Akumulasi Bulan Nunggak</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <CalendarX className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {summary.totalBulanNunggak} Bulan
          </p>
          <p className="text-xs text-slate-500">Total bulan belum tertagih</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Estimasi Total Piutang</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {formatRupiah(summary.totalEstimasiPiutang)}
          </p>
          <p className="text-xs text-slate-500">Potensi penerimaan kas masuk</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa atau NIS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                ...masterKelas
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
        </div>
      </div>

      {/* Tabel Siswa Nunggak */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  Peserta Didik
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Jenjang & Rombel
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  Bulan Nunggak
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Rincian Bulan Belum Bayar
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Estimasi Tagihan
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Kontak Wali
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
                    Menganalisis data tunggakan SPP...
                  </td>
                </tr>
              ) : dataTunggakan.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-emerald-600 font-medium">
                    Luar biasa! Tidak ada siswa yang memiliki tunggakan SPP pada kriteria ini.
                  </td>
                </tr>
              ) : (
                dataTunggakan.map((item) => (
                  <tr
                    key={item.siswaId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.nama}
                      </p>
                      <p className="font-mono text-xs text-slate-500">
                        NIS: {item.nis}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {item.kelas}
                      </p>
                      <p className="text-xs text-slate-500">{item.jenjang}</p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                        {item.jumlahBulanNunggak} Bulan
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.bulanNunggakList.map((bln: string, i: number) => (
                          <span
                            key={i}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {bln}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                      {formatRupiah(item.totalTunggakanNominal)}
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <p className="text-slate-800 dark:text-slate-200">{item.namaWali || '-'}</p>
                      <p className="text-slate-500 font-mono">{item.telpWali || '-'}</p>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/spp/kasir`}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                      >
                        <span>Bayar Kasir</span>
                        <ArrowRight className="h-3 w-3" />
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
  )
}
