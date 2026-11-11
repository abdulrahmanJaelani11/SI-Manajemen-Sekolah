'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { formatRupiah } from '@/lib/terbilang'

export default function KuitansiStandalonePage() {
  const params = useParams()
  const router = useRouter()
  const noTransaksi = params.noTransaksi as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!noTransaksi) return

    const fetchKuitansi = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/spp/transaksi/${noTransaksi}`)
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          setError(json.message || 'Kuitansi tidak ditemukan')
        }
      } catch (err: any) {
        setError('Gagal memuat kuitansi: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchKuitansi()
  }, [noTransaksi])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        Memuat dokumen kuitansi...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-600 font-semibold">{error || 'Data tidak ditemukan'}</p>
        <button
          onClick={() => router.push('/spp/kasir')}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
        >
          Kembali ke Kasir
        </button>
      </div>
    )
  }

  const tanggalStr = new Date(data.tanggalBayar).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 pb-12 print:p-0 print:pb-0">
      {/* Toolbar Aksi (Sembunyi saat dicetak) */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-emerald-700"
        >
          <Printer className="h-4 w-4" />
          Cetak Dokumen Kuitansi (Ctrl+P)
        </button>
      </div>

      {/* DOKUMEN KUITANSI RESMI */}
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 shadow-lg print:border-none print:shadow-none print:p-4 print:max-w-none">
        {/* Kop Sekolah */}
        <div className="border-b-2 border-slate-900 pb-4 text-center">
          <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
            {data.sekolah?.namaSekolah || 'SISTEM MANAJEMEN SEKOLAH TERPADU'}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {data.sekolah?.alamat || 'Jl. Pendidikan Nasional No. 100'} • Telp: {data.sekolah?.telepon || '0812-3456-7890'}
            {data.sekolah?.npsn ? ` • NPSN: ${data.sekolah.npsn}` : ''}
          </p>
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 underline">
            KUITANSI PEMBAYARAN IURAN SPP
          </h2>
          <p className="font-mono text-xs text-slate-500 mt-0.5">
            Nomor: {data.noTransaksi}
          </p>
        </div>

        {/* Data Identitas */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-slate-900">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-28 text-slate-500">Telah Terima Dari</span>
              <span className="font-semibold">: {data.siswa.nama}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500">NIS / NISN</span>
              <span className="font-mono">: {data.siswa.nis} {data.siswa.nisn ? `(${data.siswa.nisn})` : ''}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500">Jenjang & Kelas</span>
              <span>: {data.siswa.jenjang?.kode} - {data.siswa.kelas?.namaKelas || '-'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex">
              <span className="w-28 text-slate-500">Tahun Ajaran</span>
              <span className="font-medium">: {data.tahunAjaran}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500">Tanggal Bayar</span>
              <span>: {tanggalStr}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500">Metode Bayar</span>
              <span className="font-medium">: {data.metodeBayar}</span>
            </div>
          </div>
        </div>

        {/* Rincian Pembayaran Tabel */}
        <div className="mt-6">
          <table className="w-full text-left text-xs border border-slate-300 text-slate-900">
            <thead className="bg-slate-100 font-semibold uppercase text-slate-700 border-b border-slate-300">
              <tr>
                <th className="p-2.5 w-12 text-center">No</th>
                <th className="p-2.5">Pos Pembayaran</th>
                <th className="p-2.5">Bulan</th>
                <th className="p-2.5 text-right">Tagihan</th>
                <th className="p-2.5 text-right">Potongan</th>
                <th className="p-2.5 text-right">Nominal Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="p-2.5 text-center font-mono">{idx + 1}</td>
                  <td className="p-2.5 font-medium">Iuran SPP Bulanan</td>
                  <td className="p-2.5 font-semibold text-slate-900">{item.bulan}</td>
                  <td className="p-2.5 text-right font-mono">{formatRupiah(item.nominalTagihan)}</td>
                  <td className="p-2.5 text-right font-mono text-slate-500">
                    {item.diskon > 0 ? `-${formatRupiah(item.diskon)}` : 'Rp 0'}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                    {formatRupiah(item.nominalBayar)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-semibold">
              <tr>
                <td colSpan={5} className="p-2.5 text-right uppercase">
                  Total Pembayaran:
                </td>
                <td className="p-2.5 text-right font-mono text-sm font-bold text-slate-950">
                  {formatRupiah(data.totalDibayar)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terbilang */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs italic text-slate-900">
          <span className="font-semibold not-italic text-slate-600">Terbilang: </span>
          <span className="font-medium text-slate-900">"{data.terbilang}"</span>
        </div>

        {/* Kolom Tanda Tangan */}
        <div className="mt-8 grid grid-cols-2 text-center text-xs text-slate-900">
          <div>
            <p className="text-slate-500">Penyetor / Wali Murid,</p>
            <div className="h-16" />
            <p className="font-semibold underline">
              ( {data.siswa.namaWali || data.siswa.nama} )
            </p>
          </div>
          <div>
            <p className="text-slate-500">Petugas Kasir Keuangan,</p>
            <div className="h-16" />
            <p className="font-semibold underline">
              ( {data.petugas || 'Petugas Tata Usaha'} )
            </p>
          </div>
        </div>

        {/* Catatan Kaki */}
        <div className="mt-8 border-t border-dashed border-slate-300 pt-2 text-center text-[10px] text-slate-400">
          * Kuitansi ini merupakan bukti setoran pembayaran sah yang diterbitkan oleh sistem komputer sekolah.
        </div>
      </div>
    </div>
  )
}
