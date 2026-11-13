'use client'

import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  Printer,
  Download,
  X,
  CreditCard,
  QrCode,
  GraduationCap,
  Building2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

interface SiswaData {
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
  kelas?: { namaKelas: string } | null
  jurusan?: { namaJurusan: string; kodeJurusan?: string } | null
}

interface SekolahData {
  namaSekolah?: string
  npsn?: string | null
  alamat?: string | null
  telepon?: string | null
  email?: string | null
  website?: string | null
  logoUrl?: string | null
}

interface KartuSiswaModalProps {
  isOpen: boolean
  onClose: () => void
  siswa: SiswaData | null
  sekolah?: SekolahData | null
}

export default function KartuSiswaModal({
  isOpen,
  onClose,
  siswa,
  sekolah,
}: KartuSiswaModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both')
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate QR Code data URL when student changes
  useEffect(() => {
    if (!siswa || !isOpen) return

    setIsGenerating(true)
    const payload = `SISWA:${siswa.nis}`

    QRCode.toDataURL(payload, {
      width: 400,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrDataUrl(url)
      })
      .catch((err) => {
        console.error('Failed to generate QR Code:', err)
      })
      .finally(() => {
        setIsGenerating(false)
      })
  }, [siswa, isOpen])

  if (!isOpen || !siswa) return null

  // School profile defaults
  const schoolName = sekolah?.namaSekolah || 'SISTEM MANAJEMEN SEKOLAH TERPADU'
  const schoolNpsn = sekolah?.npsn ? `NPSN: ${sekolah.npsn}` : ''
  const schoolAddress =
    sekolah?.alamat || 'Jl. Pendidikan No. 1, Kota Pelajar, Indonesia'
  const schoolLogo = sekolah?.logoUrl || ''

  // Format Tanggal Lahir
  let ttlText = '-'
  if (siswa.tempatLahir && siswa.tanggalLahir) {
    const tgl = new Date(siswa.tanggalLahir).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    ttlText = `${siswa.tempatLahir}, ${tgl}`
  } else if (siswa.tanggalLahir) {
    ttlText = new Date(siswa.tanggalLahir).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } else if (siswa.tempatLahir) {
    ttlText = siswa.tempatLahir
  }

  // Format Kelas & Jenjang
  const rombelText = `${siswa.jenjang?.kode || 'SEKOLAH'} - ${
    siswa.kelas?.namaKelas || 'Umum'
  }${siswa.jurusan ? ` (${siswa.jurusan.kodeJurusan})` : ''}`

  // Download QR Code PNG
  const handleDownloadQR = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `QR_Siswa_${siswa.nis}_${siswa.nama.replace(/\s+/g, '_')}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle Isolated Clean Print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=650')
    if (!printWindow) {
      alert('Pop-up terblokir oleh browser. Harap izinkan pop-up untuk mencetak kartu.')
      return
    }

    const printHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Kartu Siswa - ${siswa.nama} (${siswa.nis})</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
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
            background-color: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
          }
          .print-header h2 {
            font-size: 16px;
            color: #1e293b;
            font-weight: 700;
          }
          .print-header p {
            font-size: 11px;
            color: #64748b;
          }
          .cards-sheet {
            display: flex;
            flex-wrap: wrap;
            gap: 24px;
            justify-content: center;
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
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
            width: 22mm;
            color: #64748b;
            font-weight: 600;
          }
          .detail-sep {
            margin-right: 3px;
          }
          .detail-val {
            font-weight: 700;
            color: #0f172a;
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
              background: #ffffff;
              padding: 0;
            }
            .print-header {
              display: none;
            }
            .id-card {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h2>KARTU TANDA PELAJAR RESMI</h2>
          <p>Potong mengikuti garis tepi kartu standar (85.6 mm × 53.98 mm / CR-80)</p>
        </div>

        <div class="cards-sheet">
          <!-- SISI DEPAN -->
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
                  <span class="detail-val" style="font-family: monospace;">${siswa.nis}</span>
                </div>
                ${
                  siswa.nisn
                    ? `
                  <div class="detail-row">
                    <span class="detail-label">NISN</span>
                    <span class="detail-sep">:</span>
                    <span class="detail-val" style="font-family: monospace;">${siswa.nisn}</span>
                  </div>
                `
                    : ''
                }
                <div class="detail-row">
                  <span class="detail-label">Rombel / Kelas</span>
                  <span class="detail-sep">:</span>
                  <span class="detail-val">${rombelText}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">TTL</span>
                  <span class="detail-sep">:</span>
                  <span class="detail-val">${ttlText}</span>
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

          <!-- SISI BELAKANG -->
          <div class="id-card">
            <div class="card-back-header">
              KETENTUAN KARTU TANDA PELAJAR
            </div>

            <div class="card-back-body">
              <div class="qr-side">
                ${
                  qrDataUrl
                    ? `<img src="${qrDataUrl}" alt="QR" class="qr-img" />`
                    : '<div style="width: 22mm; height: 22mm; background: #eee;"></div>'
                }
                <span class="qr-caption">${siswa.nis}</span>
                <span class="qr-subtext">Scan SPP & Presensi</span>
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
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.write(printHtml)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Kartu Tanda Pelajar Ber-QR Code
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identitas resmi siswa dengan QR Code standar untuk scan kasir SPP & presensi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              title="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* View Controls & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-6 py-3 border-b border-slate-200 dark:bg-slate-800/40 dark:border-slate-800">
          <div className="flex items-center gap-1.5 rounded-xl bg-white p-1 border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
            <button
              onClick={() => setActiveSide('both')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeSide === 'both'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              Kedua Sisi (Depan & Belakang)
            </button>
            <button
              onClick={() => setActiveSide('front')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeSide === 'front'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              Tampak Depan
            </button>
            <button
              onClick={() => setActiveSide('back')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeSide === 'back'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              Tampak Belakang
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadQR}
              disabled={!qrDataUrl}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
              title="Unduh file gambar QR Code"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Unduh QR</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={!qrDataUrl}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Kartu Siswa</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body - Card Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70 dark:bg-slate-950/50">
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-8">
              {/* ======================================================== */}
              {/* TAMPAK DEPAN KARTU (FRONT) */}
              {/* ======================================================== */}
              {(activeSide === 'both' || activeSide === 'front') && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tampak Depan (Front)
                  </span>
                  <div className="relative h-[230px] w-[360px] sm:h-[240px] sm:w-[380px] rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 flex flex-col justify-between">
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
                        {siswa.fotoUrl ? (
                          <img
                            src={siswa.fotoUrl}
                            alt={siswa.nama}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-3xl font-extrabold text-blue-600/70">
                            {siswa.nama.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Detail Teks */}
                      <div className="flex-1 min-w-0 space-y-1 text-[11px]">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-xs truncate border-b border-slate-200 dark:border-slate-800 pb-1">
                          {siswa.nama}
                        </h3>
                        <div className="grid grid-cols-[55px_auto] gap-x-1.5 text-slate-600 dark:text-slate-300 leading-tight">
                          <span className="text-slate-400 font-medium">NIS</span>
                          <span className="font-bold font-mono text-slate-900 dark:text-white">
                            {siswa.nis}
                          </span>

                          {siswa.nisn && (
                            <>
                              <span className="text-slate-400 font-medium">NISN</span>
                              <span className="font-mono text-slate-800 dark:text-slate-200">
                                {siswa.nisn}
                              </span>
                            </>
                          )}

                          <span className="text-slate-400 font-medium">Kelas</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">
                            {rombelText}
                          </span>

                          <span className="text-slate-400 font-medium">TTL</span>
                          <span className="truncate">{ttlText}</span>

                          <span className="text-slate-400 font-medium">Gender</span>
                          <span>{siswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
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
                </div>
              )}

              {/* ======================================================== */}
              {/* TAMPAK BELAKANG KARTU (BACK) */}
              {/* ======================================================== */}
              {(activeSide === 'both' || activeSide === 'back') && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tampak Belakang (Back)
                  </span>
                  <div className="relative h-[230px] w-[360px] sm:h-[240px] sm:w-[380px] rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 flex flex-col justify-between">
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
                        {qrDataUrl ? (
                          <img
                            src={qrDataUrl}
                            alt="QR Code Siswa"
                            className="h-20 w-20 object-contain rounded-md"
                          />
                        ) : (
                          <div className="h-20 w-20 bg-slate-200 animate-pulse rounded-md" />
                        )}
                        <span className="mt-1 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200">
                          {siswa.nis}
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
                </div>
              )}
            </div>

            {/* Note Info */}
            <div className="flex items-center gap-2 rounded-xl bg-blue-50/70 border border-blue-200/80 px-4 py-2 text-xs text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-blue-300 max-w-xl text-center">
              <Sparkles className="h-4 w-4 flex-shrink-0 text-blue-600" />
              <span>
                Kartu didesain presisi sesuai standar kartu ID (CR-80 / 85.6mm × 53.98mm). Klik <strong>Cetak Kartu Siswa</strong> untuk mencetak langsung ke kertas foto, art carton, atau mesin printer PVC ID Card.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

