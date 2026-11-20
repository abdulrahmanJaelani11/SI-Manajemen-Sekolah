'use client'

import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  Printer,
  X,
  CreditCard,
  QrCode,
  GraduationCap,
  Building2,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'

export interface SiswaCardItem {
  id: number
  nis: string
  nisn?: string | null
  nama: string
  jenisKelamin: string
  tempatLahir?: string | null
  tanggalLahir?: string | Date | null
  alamat?: string | null
  fotoUrl?: string | null
  tahunMasuk?: number | null
  status?: string
  jenjang?: { kode: string; nama: string } | null
  kelas?: { namaKelas: string; tingkat?: { tingkat: string } } | null
  jurusan?: { namaJurusan: string; kodeJurusan?: string } | null
}

export interface SekolahInfo {
  namaSekolah?: string
  npsn?: string | null
  alamat?: string | null
  telepon?: string | null
  email?: string | null
  website?: string | null
  logoUrl?: string | null
}

interface KartuPelajarMasalModalProps {
  isOpen: boolean
  onClose: () => void
  siswaList: SiswaCardItem[]
  sekolah?: SekolahInfo | null
}

export default function KartuPelajarMasalModal({
  isOpen,
  onClose,
  siswaList,
  sekolah,
}: KartuPelajarMasalModalProps) {
  const [printLayout, setPrintLayout] = useState<'front_only' | 'pair_side_by_side' | 'back_only'>('front_only')
  const [qrMap, setQrMap] = useState<Record<string, string>>({})
  const [loadingQr, setLoadingQr] = useState(true)
  const [previewIndex, setPreviewIndex] = useState(0)

  // School profile defaults
  const schoolName = sekolah?.namaSekolah || 'SISTEM MANAJEMEN SEKOLAH TERPADU'
  const schoolNpsn = sekolah?.npsn ? `NPSN: ${sekolah.npsn}` : ''
  const schoolAddress = sekolah?.alamat || 'Jl. Pendidikan No. 1, Kota Pelajar, Indonesia'
  const schoolLogo = sekolah?.logoUrl || ''

  // Generate QR Codes in batch for all selected students
  useEffect(() => {
    if (!isOpen || siswaList.length === 0) return

    setLoadingQr(true)
    const map: Record<string, string> = {}

    Promise.all(
      siswaList.map(async (s) => {
        try {
          const url = await QRCode.toDataURL(`SISWA:${s.nis}`, {
            width: 320,
            margin: 1,
            errorCorrectionLevel: 'H',
            color: { dark: '#0f172a', light: '#ffffff' },
          })
          map[s.nis] = url
        } catch (e) {
          console.error('Error generating QR for', s.nis, e)
        }
      })
    ).then(() => {
      setQrMap(map)
      setLoadingQr(false)
    })
  }, [isOpen, siswaList])

  if (!isOpen || siswaList.length === 0) return null

  const currentPreviewSiswa = siswaList[previewIndex] || siswaList[0]

  const formatTtl = (siswa: SiswaCardItem) => {
    if (siswa.tempatLahir && siswa.tanggalLahir) {
      const tgl = new Date(siswa.tanggalLahir).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      return `${siswa.tempatLahir}, ${tgl}`
    } else if (siswa.tanggalLahir) {
      return new Date(siswa.tanggalLahir).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } else if (siswa.tempatLahir) {
      return siswa.tempatLahir
    }
    return '-'
  }

  const formatRombel = (siswa: SiswaCardItem) => {
    const jenjang = siswa.jenjang?.kode || 'SEKOLAH'
    const kelas = siswa.kelas?.namaKelas || 'Umum'
    const jurusan = siswa.jurusan?.kodeJurusan ? ` (${siswa.jurusan.kodeJurusan})` : ''
    return `${jenjang} - ${kelas}${jurusan}`
  }

  // Handle Clean Isolated Multi-Card Print
  const handlePrintBatch = () => {
    const printWindow = window.open('', '_blank', 'width=1000,height=750')
    if (!printWindow) {
      alert('Pop-up pencetakan terblokir oleh browser. Harap izinkan pop-up untuk mencetak kartu.')
      return
    }

    let cardsHtml = ''

    siswaList.forEach((siswa) => {
      const qrUrl = qrMap[siswa.nis] || ''
      const ttl = formatTtl(siswa)
      const rombel = formatRombel(siswa)

      const frontCardHtml = `
        <div class="id-card">
          <div class="card-front-header">
            ${
              schoolLogo
                ? `<img src="${schoolLogo}" alt="Logo" class="school-logo" />`
                : `<div class="school-logo-fallback">SM</div>`
            }
            <div class="header-text">
              <h3>${schoolName}</h3>
              <p>${schoolNpsn || 'KARTU IDENTITAS RESMI'}</p>
            </div>
            <span class="card-badge">SISWA</span>
          </div>

          <div class="card-front-body">
            <div class="student-photo-box">
              ${
                siswa.fotoUrl
                  ? `<img src="${siswa.fotoUrl}" alt="${siswa.nama}" class="student-photo" />`
                  : `<div class="student-photo-placeholder">${siswa.nama.charAt(0).toUpperCase()}</div>`
              }
            </div>

            <div class="student-details">
              <div class="student-name">${siswa.nama}</div>
              <div class="detail-row">
                <span class="detail-label">NIS</span>
                <span class="detail-sep">:</span>
                <span class="detail-val font-mono">${siswa.nis}</span>
              </div>
              ${
                siswa.nisn
                  ? `
                <div class="detail-row">
                  <span class="detail-label">NISN</span>
                  <span class="detail-sep">:</span>
                  <span class="detail-val font-mono">${siswa.nisn}</span>
                </div>
              `
                  : ''
              }
              <div class="detail-row">
                <span class="detail-label">Rombel / Kelas</span>
                <span class="detail-sep">:</span>
                <span class="detail-val">${rombel}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">TTL</span>
                <span class="detail-sep">:</span>
                <span class="detail-val">${ttl}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Jenis Kelamin</span>
                <span class="detail-sep">:</span>
                <span class="detail-val">${siswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Berlaku</span>
                <span class="detail-sep">:</span>
                <span class="detail-val">Selama Menjadi Siswa</span>
              </div>
            </div>
          </div>

          <div class="card-front-footer">
            <span>${schoolAddress}</span>
            <span>TA. ${new Date().getFullYear()}/${new Date().getFullYear() + 1}</span>
          </div>
        </div>
      `

      const backCardHtml = `
        <div class="id-card">
          <div class="card-back-header">
            KETENTUAN KARTU TANDA PELAJAR
          </div>

          <div class="card-back-body">
            <div class="qr-side">
              ${
                qrUrl
                  ? `<img src="${qrUrl}" alt="QR" class="qr-img" />`
                  : '<div style="width: 22mm; height: 22mm; background: #eee;"></div>'
              }
              <div class="qr-caption">${siswa.nis}</div>
              <div class="qr-subtext">Scan SPP & Presensi</div>
            </div>

            <div class="rules-side">
              <ol class="rules-list">
                <li>Kartu ini adalah bukti identitas sah siswa dan wajib dibawa setiap hari sekolah.</li>
                <li>Gunakan QR Code di samping untuk pembayaran kasir SPP dan absensi gerbang.</li>
                <li>Dilarang mencoret, menggandakan, atau memindahtangankan kartu ini.</li>
                <li>Jika menemukan kartu ini, mohon kembalikan ke tata usaha sekolah.</li>
              </ol>

              <div class="signature-box">
                <div class="signature-inner">
                  <p>Diterbitkan Oleh,</p>
                  <p>Kepala Sekolah</p>
                  <div class="signature-space"></div>
                  <p class="kepsek-name">${sekolah?.namaSekolah ? 'Kepala ' + sekolah.namaSekolah : 'Kepala Sekolah'}</p>
                  <p>NIP. -</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card-back-footer">
            Sistem Manajemen Sekolah Terpadu • Dokumen Sah
          </div>
        </div>
      `

      if (printLayout === 'front_only') {
        cardsHtml += frontCardHtml
      } else if (printLayout === 'back_only') {
        cardsHtml += backCardHtml
      } else if (printLayout === 'pair_side_by_side') {
        cardsHtml += `
          <div class="pair-wrapper">
            ${frontCardHtml}
            ${backCardHtml}
          </div>
        `
      }
    })

    const printHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Cetak Massal Kartu Pelajar - ${schoolName} (${siswaList.length} Siswa)</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 8mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background-color: #ffffff;
            color: #0f172a;
          }
          .sheet-container {
            display: grid;
            grid-template-columns: ${printLayout === 'pair_side_by_side' ? '1fr' : 'repeat(2, 85.6mm)'};
            gap: 5mm 6mm;
            justify-content: center;
          }
          .pair-wrapper {
            display: flex;
            gap: 4mm;
            justify-content: center;
            page-break-inside: avoid;
            margin-bottom: 4mm;
          }
          /* CR-80 Standard ID Card: 85.6mm x 53.98mm */
          .id-card {
            width: 85.6mm;
            height: 53.98mm;
            border-radius: 3.2mm;
            border: 1px solid #94a3b8;
            overflow: hidden;
            background: #ffffff;
            position: relative;
            display: flex;
            flex-direction: column;
            page-break-inside: avoid;
          }
          /* Tampak Depan */
          .card-front-header {
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
            color: #ffffff;
            padding: 5px 8px;
            display: flex;
            align-items: center;
            gap: 6px;
            border-bottom: 2px solid #fbbf24;
          }
          .school-logo {
            width: 26px;
            height: 26px;
            object-fit: contain;
            background: #ffffff;
            border-radius: 4px;
            padding: 2px;
          }
          .school-logo-fallback {
            width: 26px;
            height: 26px;
            background: #ffffff;
            color: #1e3a8a;
            font-size: 11px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
          }
          .header-text {
            flex: 1;
            line-height: 1.1;
          }
          .header-text h3 {
            font-size: 8.5pt;
            font-weight: 800;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            color: #ffffff !important;
          }
          .header-text p {
            font-size: 6pt;
            color: #e0e7ff !important;
            opacity: 0.95;
          }
          .card-badge {
            background: #fbbf24;
            color: #78350f;
            font-size: 5.5pt;
            font-weight: 800;
            padding: 2px 4px;
            border-radius: 3px;
            text-transform: uppercase;
            flex-shrink: 0;
          }
          .card-front-body {
            flex: 1;
            padding: 6px 8px;
            display: flex;
            gap: 8px;
            align-items: center;
            background: #ffffff;
          }
          .student-photo-box {
            width: 22mm;
            height: 28mm;
            border-radius: 2.5mm;
            border: 1.5px solid #2563eb;
            overflow: hidden;
            background: #f1f5f9;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .student-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .student-photo-placeholder {
            font-size: 24pt;
            font-weight: bold;
            color: #94a3b8;
          }
          .student-details {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
            font-size: 6.5pt;
            color: #334155;
          }
          .student-name {
            font-size: 8.5pt;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.1;
            margin-bottom: 2px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 2px;
          }
          .detail-row {
            display: flex;
            line-height: 1.25;
          }
          .detail-label {
            width: 20mm;
            color: #64748b;
            font-weight: 600;
            flex-shrink: 0;
          }
          .detail-sep {
            margin-right: 3px;
          }
          .detail-val {
            font-weight: 700;
            color: #0f172a;
          }
          .font-mono {
            font-family: monospace;
          }
          .card-front-footer {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 3px 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 5pt;
            color: #64748b;
          }
          /* Tampak Belakang */
          .card-back-header {
            background: #0f172a;
            color: #ffffff;
            padding: 4px 8px;
            text-align: center;
            font-size: 7pt;
            font-weight: 800;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #3b82f6;
          }
          .card-back-body {
            flex: 1;
            padding: 6px 8px;
            display: flex;
            gap: 8px;
            align-items: center;
            background: #ffffff;
          }
          .qr-side {
            width: 28mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            flex-shrink: 0;
            border-right: 1px dashed #cbd5e1;
            padding-right: 4px;
          }
          .qr-img {
            width: 22mm;
            height: 22mm;
            object-fit: contain;
          }
          .qr-caption {
            font-family: monospace;
            font-size: 6pt;
            font-weight: 800;
            color: #0f172a;
            margin-top: 1px;
          }
          .qr-subtext {
            font-size: 4.5pt;
            color: #64748b;
          }
          .rules-side {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            font-size: 5.5pt;
            color: #334155;
          }
          .rules-list {
            padding-left: 10px;
            margin-bottom: 4px;
            line-height: 1.25;
          }
          .rules-list li {
            margin-bottom: 1.5px;
          }
          .signature-box {
            display: flex;
            justify-content: flex-end;
            text-align: right;
            font-size: 5pt;
            line-height: 1.2;
            color: #475569;
          }
          .signature-inner {
            text-align: center;
            min-width: 28mm;
          }
          .signature-space {
            height: 16px;
          }
          .kepsek-name {
            font-weight: 700;
            color: #0f172a;
            text-decoration: underline;
          }
          .card-back-footer {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 2.5px 8px;
            text-align: center;
            font-size: 4.5pt;
            color: #64748b;
          }
          @media print {
            body {
              background: transparent !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="sheet-container">
          ${cardsHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(printHtml)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Cetak Kartu Pelajar Massal</span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  {siswaList.length} Siswa Terpilih
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencetakan lembar kartu siswa CR-80 standar ber-QR Code dengan layout lembar A4 hemat kertas.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Controls: Layout Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Format Tampilan Cetak Lembar A4
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tentukan bagaimana sisi kartu akan ditata pada lembaran kertas.
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setPrintLayout('front_only')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  printLayout === 'front_only'
                    ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Depan Saja (8-10 Kartu/A4)
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('pair_side_by_side')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  printLayout === 'pair_side_by_side'
                    ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Depan & Belakang Bersanding
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout('back_only')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  printLayout === 'back_only'
                    ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Belakang Saja
              </button>
            </div>
          </div>

          {/* Interactive Single Preview with Carousel / Navigation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Pratinjau Desain Kartu ({previewIndex + 1} dari {siswaList.length} Siswa)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewIndex((prev) => Math.max(0, prev - 1))}
                  disabled={previewIndex === 0}
                  className="rounded-lg p-1 text-slate-500 border border-slate-200 hover:bg-slate-100 disabled:opacity-30 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {currentPreviewSiswa.nis} • {currentPreviewSiswa.nama}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewIndex((prev) => Math.min(siswaList.length - 1, prev + 1))}
                  disabled={previewIndex === siswaList.length - 1}
                  className="rounded-lg p-1 text-slate-500 border border-slate-200 hover:bg-slate-100 disabled:opacity-30 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Visual Card Display */}
            <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-6 dark:border-slate-800 dark:bg-slate-950/50">
              {/* Tampak Depan Preview */}
              {(printLayout === 'front_only' || printLayout === 'pair_side_by_side') && (
                <div className="relative h-[230px] w-[360px] sm:h-[240px] sm:w-[380px] rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 flex flex-col justify-between select-none">
                  {/* Header Depan */}
                  <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 px-4 py-2.5 text-white flex items-center gap-3 border-b-2 border-amber-400">
                    {schoolLogo ? (
                      <img
                        src={schoolLogo}
                        alt="Logo"
                        className="h-8 w-8 object-contain rounded-md bg-white p-0.5 shadow-xs"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-blue-800 font-bold text-xs shadow-xs">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4
                        style={{ color: '#ffffff' }}
                        className="text-[11px] font-extrabold uppercase tracking-wide truncate text-white drop-shadow-xs"
                      >
                        {schoolName}
                      </h4>
                      <p
                        style={{ color: '#dbeafe' }}
                        className="text-[9px] text-blue-100 truncate font-medium"
                      >
                        {schoolNpsn || 'KARTU IDENTITAS RESMI'}
                      </p>
                    </div>
                    <span className="rounded bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase text-amber-950">
                      SISWA
                    </span>
                  </div>

                  {/* Body Depan */}
                  <div className="flex-1 px-4 py-3 flex items-center gap-4">
                    {/* Foto */}
                    <div className="relative h-28 w-22 flex-shrink-0 rounded-xl overflow-hidden border-2 border-blue-500 bg-slate-100 shadow-sm dark:border-blue-400 dark:bg-slate-800 flex items-center justify-center">
                      {currentPreviewSiswa.fotoUrl ? (
                        <img
                          src={currentPreviewSiswa.fotoUrl}
                          alt={currentPreviewSiswa.nama}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-3xl font-extrabold text-blue-600/70">
                          {currentPreviewSiswa.nama.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Detail Teks */}
                    <div className="flex-1 min-w-0 space-y-1 text-[11px]">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-xs truncate border-b border-slate-200 dark:border-slate-800 pb-1">
                        {currentPreviewSiswa.nama}
                      </h3>
                      <div className="grid grid-cols-[55px_auto] gap-x-1.5 text-slate-600 dark:text-slate-300 leading-tight">
                        <span className="text-slate-400 font-medium">NIS</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {currentPreviewSiswa.nis}
                        </span>

                        {currentPreviewSiswa.nisn && (
                          <>
                            <span className="text-slate-400 font-medium">NISN</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">
                              {currentPreviewSiswa.nisn}
                            </span>
                          </>
                        )}

                        <span className="text-slate-400 font-medium">Kelas</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">
                          {formatRombel(currentPreviewSiswa)}
                        </span>

                        <span className="text-slate-400 font-medium">TTL</span>
                        <span className="truncate">{formatTtl(currentPreviewSiswa)}</span>

                        <span className="text-slate-400 font-medium">Gender</span>
                        <span>{currentPreviewSiswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Depan */}
                  <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-200 text-[9px] text-slate-400 dark:bg-slate-800/80 dark:border-slate-800 flex justify-between items-center">
                    <span className="truncate max-w-[240px]">{schoolAddress}</span>
                    <span className="font-semibold text-slate-500">
                      TA. {new Date().getFullYear()}/{new Date().getFullYear() + 1}
                    </span>
                  </div>
                </div>
              )}

              {/* Tampak Belakang Preview */}
              {(printLayout === 'back_only' || printLayout === 'pair_side_by_side') && (
                <div className="relative h-[230px] w-[360px] sm:h-[240px] sm:w-[380px] rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 flex flex-col justify-between select-none">
                  {/* Header Belakang */}
                  <div className="bg-slate-900 px-4 py-2 text-white text-center border-b-2 border-blue-500">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-100">
                      KETENTUAN KARTU TANDA PELAJAR
                    </h4>
                  </div>

                  {/* Body Belakang */}
                  <div className="flex-1 px-4 py-3 flex items-center gap-4">
                    {/* QR Box */}
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 w-28 flex-shrink-0">
                      {qrMap[currentPreviewSiswa.nis] ? (
                        <img
                          src={qrMap[currentPreviewSiswa.nis]}
                          alt="QR Code Siswa"
                          className="h-20 w-20 object-contain rounded-md"
                        />
                      ) : (
                        <div className="h-20 w-20 bg-slate-200 animate-pulse rounded-md" />
                      )}
                      <span className="mt-1 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200">
                        {currentPreviewSiswa.nis}
                      </span>
                      <span className="text-[8px] text-slate-400 text-center leading-none">
                        Scan SPP & Presensi
                      </span>
                    </div>

                    {/* Rules & Signature */}
                    <div className="flex-1 flex flex-col justify-between h-full text-[9px] text-slate-600 dark:text-slate-300">
                      <ol className="list-decimal list-outside pl-3 space-y-1 text-[8.5px] leading-tight">
                        <li>Kartu ini adalah identitas resmi dan wajib dibawa setiap hari sekolah.</li>
                        <li>Scan QR Code untuk pembayaran SPP dan presensi harian siswa.</li>
                        <li>Dilarang merusak, memalsukan, atau memindahtangankan kartu ini.</li>
                        <li>Jika hilang, segera lapor ke bagian Tata Usaha sekolah.</li>
                      </ol>

                      {/* Signature */}
                      <div className="text-right text-[8px] leading-tight text-slate-500 pt-1">
                        <p>Kepala Sekolah,</p>
                        <div className="h-5" />
                        <p className="font-bold underline text-slate-800 dark:text-slate-200">
                          {sekolah?.namaSekolah ? 'Kepala ' + sekolah.namaSekolah : 'Kepala Sekolah'}
                        </p>
                        <p>NIP. -</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Belakang */}
                  <div className="bg-slate-50 px-4 py-1.5 border-t border-slate-200 text-[8.5px] text-slate-400 text-center dark:bg-slate-800/80 dark:border-slate-800">
                    Sistem Manajemen Sekolah Terpadu • Dokumen Sah
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl bg-blue-50/80 p-3.5 text-xs text-blue-900 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
            <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold">Kualitas Cetak Maksimal:</span>
              <p className="mt-0.5 text-blue-800 dark:text-blue-300 leading-relaxed text-[11px]">
                Sistem akan menyusun {siswaList.length} kartu ke dalam lembaran A4 berstandar ID Card internasional (CR-80: 85,6 mm × 54 mm) dengan garis potong putus-putus. Disarankan menggunakan kertas foto tebal (*Glossy Photo Paper*) atau kertas PVC laminasi kartu.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {loadingQr ? 'Sedang menyiapkan QR Code siswa...' : `Siap mencetak ${siswaList.length} kartu pelajar.`}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePrintBatch}
              disabled={loadingQr}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak {siswaList.length} Kartu Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
