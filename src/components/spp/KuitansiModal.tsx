'use client'

import React from 'react'
import { Printer, X, CheckCircle2, ExternalLink } from 'lucide-react'
import { formatRupiah } from '@/lib/terbilang'

interface KuitansiModalProps {
  isOpen: boolean
  onClose: () => void
  data: {
    noTransaksi: string
    tanggalBayar: string | Date
    metodeBayar: string
    petugas?: string
    status: string
    tahunAjaran: string
    keterangan?: string
    totalTagihan: number
    totalDiskon: number
    totalDibayar: number
    terbilang: string
    siswa: {
      nama: string
      nis: string
      nisn?: string
      jenjang?: { kode: string; nama: string }
      kelas?: { namaKelas: string }
      jurusan?: { namaJurusan: string; kodeJurusan?: string }
      namaWali?: string
    }
    sekolah?: {
      namaSekolah: string
      npsn?: string
      alamat?: string
      telepon?: string
      email?: string
    }
    items: {
      bulan: string
      urutanBulan: number
      nominalTagihan: number
      diskon: number
      nominalBayar: number
    }[]
  } | null
}

export default function KuitansiModal({ isOpen, onClose, data }: KuitansiModalProps) {
  if (!isOpen || !data) return null

  const tanggalStr = new Date(data.tanggalBayar).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Cetak dokumen kuitansi secara murni dan terisolasi tanpa merender background web/dashboard
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=900')
    if (!printWindow) {
      alert('Pop-up terblokir oleh browser. Harap izinkan pop-up untuk mencetak kuitansi.')
      return
    }

    const itemsRows = data.items
      .map(
        (item, idx) => `
        <tr>
          <td style="padding: 9px 12px; text-align: center; border: 1px solid #cbd5e1; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 9px 12px; border: 1px solid #cbd5e1;">Iuran SPP Bulanan</td>
          <td style="padding: 9px 12px; border: 1px solid #cbd5e1; font-weight: 700;">${item.bulan}</td>
          <td style="padding: 9px 12px; text-align: right; border: 1px solid #cbd5e1; font-family: monospace;">${formatRupiah(item.nominalTagihan)}</td>
          <td style="padding: 9px 12px; text-align: right; border: 1px solid #cbd5e1; font-family: monospace; color: #64748b;">${item.diskon > 0 ? '-' + formatRupiah(item.diskon) : 'Rp 0'}</td>
          <td style="padding: 9px 12px; text-align: right; border: 1px solid #cbd5e1; font-family: monospace; font-weight: 700;">${formatRupiah(item.nominalBayar)}</td>
        </tr>
      `
      )
      .join('')

    const receiptHtml = `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Kuitansi Pembayaran - ${data.noTransaksi}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm 20mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            body {
              background: #fff;
              color: #0f172a;
              padding: 24px 30px;
              font-size: 13px;
              line-height: 1.5;
            }
            .kop {
              border-bottom: 3px double #0f172a;
              padding-bottom: 14px;
              margin-bottom: 20px;
              text-align: center;
            }
            .kop h1 {
              font-size: 21px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
            }
            .kop p {
              font-size: 11px;
              color: #475569;
              margin-top: 4px;
            }
            .title-box {
              text-align: center;
              margin-bottom: 22px;
            }
            .title-box h2 {
              font-size: 15px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              text-decoration: underline;
            }
            .title-box .nomor {
              font-family: monospace;
              font-size: 12px;
              color: #64748b;
              margin-top: 3px;
            }
            .info-grid {
              display: flex;
              justify-content: space-between;
              margin-bottom: 22px;
              font-size: 12.5px;
              gap: 20px;
            }
            .info-col {
              width: 50%;
            }
            .info-row {
              display: flex;
              margin-bottom: 5px;
            }
            .info-label {
              width: 130px;
              color: #64748b;
            }
            .info-value {
              font-weight: 600;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 12px;
            }
            th {
              background-color: #f8fafc;
              color: #334155;
              padding: 10px 12px;
              border: 1px solid #cbd5e1;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 11px;
            }
            .total-row {
              background-color: #f8fafc;
              border-top: 2px solid #0f172a;
              font-weight: 800;
            }
            .terbilang-box {
              margin-top: 16px;
              padding: 12px 16px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              font-size: 12px;
              font-style: italic;
            }
            .ttd-box {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
            }
            .ttd-col {
              width: 42%;
            }
            .ttd-space {
              height: 70px;
            }
            .ttd-name {
              font-weight: 700;
              text-decoration: underline;
            }
            .footer-note {
              margin-top: 40px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 10px;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="kop">
            <h1>${data.sekolah?.namaSekolah || 'SISTEM MANAJEMEN SEKOLAH TERPADU'}</h1>
            <p>${data.sekolah?.alamat || 'Jl. Pendidikan Nasional No. 100'} • Telp: ${data.sekolah?.telepon || '0812-3456-7890'} ${data.sekolah?.npsn ? ' • NPSN: ' + data.sekolah.npsn : ''}</p>
          </div>

          <div class="title-box">
            <h2>Kuitansi Pembayaran Iuran SPP</h2>
            <p class="nomor">No. Bukti Transaksi: ${data.noTransaksi}</p>
          </div>

          <div class="info-grid">
            <div class="info-col">
              <div class="info-row">
                <span class="info-label">Telah Terima Dari</span>
                <span class="info-value">: ${data.siswa.nama}</span>
              </div>
              <div class="info-row">
                <span class="info-label">NIS / NISN</span>
                <span class="info-value" style="font-family: monospace;">: ${data.siswa.nis} ${data.siswa.nisn ? '(' + data.siswa.nisn + ')' : ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Jenjang & Kelas</span>
                <span class="info-value">: ${data.siswa.jenjang?.kode || ''} - ${data.siswa.kelas?.namaKelas || 'Umum'}</span>
              </div>
            </div>

            <div class="info-col">
              <div class="info-row">
                <span class="info-label">Tahun Ajaran</span>
                <span class="info-value">: ${data.tahunAjaran}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Tanggal Setor</span>
                <span class="info-value">: ${tanggalStr}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Metode Bayar</span>
                <span class="info-value">: ${data.metodeBayar}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th>Pos Iuran</th>
                <th>Bulan</th>
                <th style="text-align: right;">Tagihan</th>
                <th style="text-align: right;">Potongan</th>
                <th style="text-align: right;">Nominal Disetor</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="5" style="padding: 10px 12px; text-align: right; text-transform: uppercase;">Total Pembayaran:</td>
                <td style="padding: 10px 12px; text-align: right; font-family: monospace; font-size: 13.5px; font-weight: 800; color: #0f172a;">${formatRupiah(data.totalDibayar)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="terbilang-box">
            <span style="font-style: normal; font-weight: 700; color: #475569;">Terbilang: </span>
            <span style="font-weight: 600; color: #0f172a;">"${data.terbilang}"</span>
          </div>

          <div class="ttd-box">
            <div class="ttd-col">
              <p style="color: #64748b;">Penyetor / Wali Murid,</p>
              <div class="ttd-space"></div>
              <p class="ttd-name">( ${data.siswa.namaWali || data.siswa.nama} )</p>
            </div>
            <div class="ttd-col">
              <p style="color: #64748b;">Petugas Kasir Keuangan,</p>
              <div class="ttd-space"></div>
              <p class="ttd-name">( ${data.petugas || 'Kasir Keuangan'} )</p>
            </div>
          </div>

          <div class="footer-note">
            * Kuitansi ini merupakan bukti setoran pembayaran sah yang diterbitkan oleh sistem komputer sekolah.
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(receiptHtml)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Toolbar Aksi Atas */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              Bukti Kuitansi Pembayaran SPP
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition-all"
            >
              <Printer className="h-4 w-4" />
              Cetak Dokumen Kuitansi
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PRATINJAU KUITANSI DI MODAL */}
        <div className="p-8 text-slate-900 bg-white">
          {/* Kop Sekolah */}
          <div className="border-b-2 border-slate-900 pb-4 text-center">
            <h1 className="text-xl font-extrabold uppercase tracking-wide">
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
          <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
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
            <table className="w-full text-left text-xs border border-slate-300">
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
                {data.items.map((item, idx) => (
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
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs italic">
            <span className="font-semibold not-italic text-slate-600">Terbilang: </span>
            <span className="font-medium text-slate-900">"{data.terbilang}"</span>
          </div>

          {/* Kolom Tanda Tangan */}
          <div className="mt-8 grid grid-cols-2 text-center text-xs">
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
    </div>
  )
}
