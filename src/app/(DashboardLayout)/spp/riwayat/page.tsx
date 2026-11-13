'use client'

import React, { useState, useEffect } from 'react'
import {
  History,
  Search,
  Printer,
  Ban,
  CheckCircle2,
  AlertCircle,
  FileText,
  Filter,
} from 'lucide-react'
import { formatRupiah, BULAN_AKADEMIK } from '@/lib/terbilang'
import KuitansiModal from '@/components/spp/KuitansiModal'
import SearchableSelect from '@/components/ui/searchable-select'
import { usePermission } from '@/context/PermissionContext'

export default function RiwayatSppPage() {
  const { canDelete } = usePermission()
  const allowDelete = canDelete('/spp/riwayat')

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState<any>({ page: 1, limit: 25, total: 0, totalPages: 1 })

  // Filters
  const [search, setSearch] = useState('')
  const [tahunAjaran, setTahunAjaran] = useState('')
  const [bulan, setBulan] = useState('')
  const [status, setStatus] = useState('')
  const [metodeBayar, setMetodeBayar] = useState('')
  const [page, setPage] = useState(1)

  // Kuitansi Modal
  const [isKuitansiOpen, setIsKuitansiOpen] = useState(false)
  const [kuitansiData, setKuitansiData] = useState<any>(null)

  const fetchRiwayat = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (tahunAjaran) params.append('tahunAjaran', tahunAjaran)
      if (bulan) params.append('bulan', bulan)
      if (status) params.append('status', status)
      if (metodeBayar) params.append('metodeBayar', metodeBayar)
      params.append('page', String(page))

      const res = await fetch(`/api/spp/riwayat?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.data)
        if (data.meta) setMeta(data.meta)
      }
    } catch (err) {
      console.error('Fetch riwayat error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRiwayat()
    }, 250)
    return () => clearTimeout(timer)
  }, [search, tahunAjaran, bulan, status, metodeBayar, page])

  // Handle Void
  const handleVoidTransaksi = async (item: any) => {
    if (item.status === 'void') return

    const confirmed = window.confirm(
      `PERINGATAN VOID!\n\nApakah Anda yakin ingin MEMBATALKAN transaksi "${item.noTransaksi}" untuk siswa ${item.siswa.nama} (Bulan: ${item.bulan})?\n\nSetelah dibatalkan, status bulan ini akan kembali menjadi belum lunas.`
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/spp/transaksi/${item.noTransaksi}`, {
        method: 'DELETE',
      })
      const resJson = await res.json()
      if (!resJson.success) {
        alert(resJson.message || 'Gagal membatalkan transaksi')
        return
      }
      alert('Transaksi berhasil dibatalkan (VOID)')
      fetchRiwayat()
    } catch (err: any) {
      alert('Error saat membatalkan transaksi: ' + err.message)
    }
  }

  // Handle View Kuitansi
  const handleViewKuitansi = async (noTransaksi: string) => {
    try {
      const res = await fetch(`/api/spp/transaksi/${noTransaksi}`)
      const data = await res.json()
      if (data.success) {
        setKuitansiData(data.data)
        setIsKuitansiOpen(true)
      }
    } catch (err) {
      console.error('Error load kuitansi:', err)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Riwayat Pembayaran SPP
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Log seluruh transaksi kasir, cetak ulang kuitansi, dan pembatalan transaksi (void).
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no transaksi, nama siswa, atau kasir..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
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
              searchPlaceholder="Cari tahun..."
            />
          </div>

          <div>
            <SearchableSelect
              value={bulan}
              onChange={(val) => setBulan(val)}
              options={[
                { value: '', label: 'Semua Bulan' },
                ...BULAN_AKADEMIK.map((b) => ({
                  value: b.nama,
                  label: b.nama,
                })),
              ]}
              placeholder="Semua Bulan"
              searchPlaceholder="Cari bulan..."
            />
          </div>

          <div>
            <SearchableSelect
              value={status}
              onChange={(val) => setStatus(val)}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'lunas', label: 'Lunas' },
                { value: 'void', label: 'Void (Dibatalkan)' },
              ]}
              placeholder="Semua Status"
              searchPlaceholder="Cari status..."
            />
          </div>
        </div>
      </div>

      {/* Tabel Riwayat */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  No. Transaksi & Waktu
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Peserta Didik
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Bulan Bayar
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Nominal Setor
                </th>
                <th scope="col" className="px-4 py-3.5 text-center">
                  Metode
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Petugas Kasir
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
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Memuat riwayat transaksi kasir...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Tidak ada riwayat transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {item.noTransaksi}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(item.tanggalBayar).toLocaleString('id-ID')}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.siswa?.nama}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        NIS: {item.siswa?.nis} • {item.kelas?.namaKelas || '-'}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {item.bulan}
                      </span>
                      <p className="text-xs text-slate-500 font-mono">TA: {item.tahunAjaran}</p>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {formatRupiah(item.nominalBayar)}
                      </p>
                      {item.diskon > 0 && (
                        <p className="text-[10px] text-rose-500">
                          Diskon: {formatRupiah(item.diskon)}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.metodeBayar}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-300">
                      {item.petugas || '-'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                          item.status === 'lunas'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewKuitansi(item.noTransaksi)}
                          title="Cetak Kuitansi Resmi"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        {allowDelete && item.status === 'lunas' && (
                          <button
                            onClick={() => handleVoidTransaksi(item)}
                            title="Batalkan Transaksi (VOID)"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                          >
                            <Ban className="h-4 w-4" />
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

      {/* Modal Kuitansi */}
      <KuitansiModal
        isOpen={isKuitansiOpen}
        onClose={() => setIsKuitansiOpen(false)}
        data={kuitansiData}
      />
    </div>
  )
}
