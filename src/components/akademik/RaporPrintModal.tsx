'use client'

import React from 'react'
import { Printer, X, Award, CheckCircle2, Building2 } from 'lucide-react'
import { getPredikatLabel } from '@/lib/akademik/grade-utils'

interface RaporPrintModalProps {
  isOpen: boolean
  onClose: () => void
  data: {
    siswa: any
    kelas: any
    tahunAjaran: string
    semester: string
    nilaiList: any[]
    rapor: any
    rataRata: number
    peringkat: number
    sekolah?: any
    kepalaSekolah?: any
  } | null
}

export default function RaporPrintModal({
  isOpen,
  onClose,
  data,
}: RaporPrintModalProps) {
  if (!isOpen || !data) return null

  const {
    siswa,
    kelas,
    tahunAjaran,
    semester,
    nilaiList,
    rapor,
    rataRata,
    peringkat,
    sekolah,
    kepalaSekolah,
  } = data

  const schoolName = sekolah?.namaSekolah || 'SISTEM INFORMASI MANAJEMEN SEKOLAH'
  const schoolAddress = sekolah?.alamat || 'Jl. Pendidikan No. 1, Indonesia'
  const schoolNpsn = sekolah?.npsn || '-'
  const kepsekName = kepalaSekolah?.nama || 'Kepala Sekolah'
  const kepsekNip = kepalaSekolah?.nip || '-'
  const waliName = kelas?.waliKelas || 'Wali Kelas'

  const tanggalCetak = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=950')
    if (!printWindow) {
      alert('Pop-up terblokir. Harap izinkan pop-up untuk mencetak rapor.')
      return
    }

    const gradeRowsHtml =
      nilaiList.length > 0
        ? nilaiList
            .map(
              (n, i) => `
          <tr>
            <td style="padding: 7px 8px; text-align: center; border: 1px solid #334155;">${i + 1}</td>
            <td style="padding: 7px 10px; border: 1px solid #334155;">
              <strong>${n.mapel?.nama || '-'}</strong>
              <div style="font-size: 9px; color: #64748b;">${n.mapel?.kelompok || ''}</div>
            </td>
            <td style="padding: 7px 8px; text-align: center; border: 1px solid #334155; font-family: monospace;">${n.mapel?.kkm || 75}</td>
            <td style="padding: 7px 8px; text-align: center; border: 1px solid #334155; font-family: monospace; font-weight: 700;">${n.nilaiAkhir}</td>
            <td style="padding: 7px 8px; text-align: center; border: 1px solid #334155; font-weight: 700;">${n.predikat}</td>
            <td style="padding: 7px 10px; border: 1px solid #334155; font-size: 10.5px;">${
              n.deskripsi || getPredikatLabel(n.predikat)
            }</td>
          </tr>
        `
            )
            .join('')
        : `
          <tr>
            <td colspan="6" style="padding: 16px; text-align: center; border: 1px solid #334155; color: #64748b;">Belum ada nilai mata pelajaran yang diinput pada periode ini.</td>
          </tr>
        `

    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Rapor Siswa - ${siswa.nama} (${tahunAjaran} ${semester})</title>
        <style>
          @page { size: A4 portrait; margin: 14mm 15mm; }
          * { box-sizing: border-box; font-family: "Times New Roman", Georgia, serif; }
          body { color: #0f172a; margin: 0; padding: 0; font-size: 12px; line-height: 1.4; }
          .kop-surat {
            display: flex;
            align-items: center;
            gap: 16px;
            border-bottom: 3px double #0f172a;
            padding-bottom: 10px;
            margin-bottom: 16px;
          }
          .kop-logo { width: 64px; height: 64px; object-fit: contain; }
          .kop-text { flex: 1; text-align: center; }
          .kop-text h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; }
          .kop-text p { margin: 2px 0; font-size: 11px; color: #334155; }
          .doc-title { text-align: center; margin: 12px 0 18px; }
          .doc-title h2 { margin: 0; font-size: 15px; text-transform: uppercase; text-decoration: underline; }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 24px;
            margin-bottom: 16px;
            font-size: 12px;
          }
          .info-row { display: flex; }
          .info-label { width: 120px; font-weight: bold; }
          .info-sep { width: 14px; }
          .section-title { font-size: 12.5px; font-weight: bold; margin: 14px 0 6px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
          th { background-color: #f1f5f9; border: 1px solid #334155; padding: 7px 8px; text-align: center; font-weight: bold; }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px; }
          .box { border: 1px solid #334155; padding: 8px 10px; min-height: 60px; font-size: 11.5px; }
          .signatures {
            margin-top: 32px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            text-align: center;
            font-size: 11.5px;
            page-break-inside: avoid;
          }
          .sig-space { height: 58px; }
          .sig-name { font-weight: bold; text-decoration: underline; }
          @media print {
            th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="kop-surat">
          ${sekolah?.logoUrl ? `<img src="${sekolah.logoUrl}" alt="Logo" class="kop-logo" />` : ''}
          <div class="kop-text">
            <h1>${schoolName}</h1>
            <p>${schoolAddress}</p>
            <p>NPSN: ${schoolNpsn} ${sekolah?.telepon ? `• Telp: ${sekolah.telepon}` : ''} ${sekolah?.email ? `• Email: ${sekolah.email}` : ''}</p>
          </div>
        </div>

        <div class="doc-title">
          <h2>LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR)</h2>
        </div>

        <div class="info-grid">
          <div class="info-row"><span class="info-label">Nama Siswa</span><span class="info-sep">:</span><span><strong>${siswa.nama}</strong></span></div>
          <div class="info-row"><span class="info-label">Kelas / Rombel</span><span class="info-sep">:</span><span>${kelas?.jenjang?.kode || ''} - ${kelas?.namaKelas || '-'}</span></div>
          <div class="info-row"><span class="info-label">NIS / NISN</span><span class="info-sep">:</span><span>${siswa.nis} / ${siswa.nisn || '-'}</span></div>
          <div class="info-row"><span class="info-label">Semester</span><span class="info-sep">:</span><span>${semester}</span></div>
          <div class="info-row"><span class="info-label">Tahun Ajaran</span><span class="info-sep">:</span><span>${tahunAjaran}</span></div>
          <div class="info-row"><span class="info-label">Peringkat Kelas</span><span class="info-sep">:</span><span>${peringkat > 0 ? `Peringkat ke-${peringkat} (Rata-rata: ${rataRata})` : '-'}</span></div>
        </div>

        <div class="section-title">A. Sikap Spiritual & Sosial</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30%;">Aspek Sikap</th>
              <th style="width: 20%;">Predikat</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 6px 10px; border: 1px solid #334155;">1. Sikap Spiritual</td>
              <td style="padding: 6px 10px; text-align: center; border: 1px solid #334155; font-weight: bold;">${rapor?.sikapSpiritual || 'Baik'}</td>
              <td style="padding: 6px 10px; border: 1px solid #334155;">Menunjukkan sikap taat beribadah dan bersyukur dalam kegiatan sekolah.</td>
            </tr>
            <tr>
              <td style="padding: 6px 10px; border: 1px solid #334155;">2. Sikap Sosial</td>
              <td style="padding: 6px 10px; text-align: center; border: 1px solid #334155; font-weight: bold;">${rapor?.sikapSosial || 'Baik'}</td>
              <td style="padding: 6px 10px; border: 1px solid #334155;">Menunjukkan sikap disiplin, jujur, santun, dan kerja sama yang baik.</td>
            </tr>
          </tbody>
        </table>

        <div class="section-title">B. Capaian Kompetensi Mata Pelajaran</div>
        <table>
          <thead>
            <tr>
              <th style="width: 36px;">No</th>
              <th>Mata Pelajaran</th>
              <th style="width: 55px;">KKM</th>
              <th style="width: 65px;">Nilai</th>
              <th style="width: 65px;">Predikat</th>
              <th style="width: 34%;">Deskripsi Capaian</th>
            </tr>
          </thead>
          <tbody>
            ${gradeRowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 7px 10px; border: 1px solid #334155; text-align: right; font-weight: bold;">Nilai Rata-rata Keseluruhan</td>
              <td style="padding: 7px 8px; border: 1px solid #334155; text-align: center; font-family: monospace; font-weight: bold;">${rataRata}</td>
              <td colspan="2" style="padding: 7px 10px; border: 1px solid #334155;">Total ${nilaiList.length} Mata Pelajaran Dinilai</td>
            </tr>
          </tfoot>
        </table>

        <div class="two-col">
          <div>
            <div class="section-title">C. Ketidakhadiran</div>
            <table>
              <tr>
                <td style="padding: 5px 10px; border: 1px solid #334155;">Sakit</td>
                <td style="padding: 5px 10px; border: 1px solid #334155; text-align: center; width: 70px;"><strong>${rapor?.sakit || 0}</strong> hari</td>
              </tr>
              <tr>
                <td style="padding: 5px 10px; border: 1px solid #334155;">Izin</td>
                <td style="padding: 5px 10px; border: 1px solid #334155; text-align: center;"><strong>${rapor?.izin || 0}</strong> hari</td>
              </tr>
              <tr>
                <td style="padding: 5px 10px; border: 1px solid #334155;">Tanpa Keterangan (Alpa)</td>
                <td style="padding: 5px 10px; border: 1px solid #334155; text-align: center;"><strong>${rapor?.alpa || 0}</strong> hari</td>
              </tr>
            </table>
          </div>

          <div>
            <div class="section-title">D. Ekstrakurikuler & Catatan Wali</div>
            <div class="box">
              ${rapor?.ekstrakurikuler ? `<div><strong>Ekstrakurikuler:</strong> ${rapor.ekstrakurikuler}</div>` : ''}
              <div style="margin-top: 4px;"><strong>Catatan Wali Kelas:</strong> ${
                rapor?.catatanWali || 'Pertahankan prestasi dan tingkatkan terus semangat belajar.'
              }</div>
              ${rapor?.keputusan ? `<div style="margin-top: 6px;"><strong>Keputusan:</strong> ${rapor.keputusan}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="signatures">
          <div>
            <p>Mengetahui,</p>
            <p>Orang Tua / Wali Murid</p>
            <div class="sig-space"></div>
            <p class="sig-name">${siswa.namaWali || '....................................'}</p>
          </div>
          <div>
            <p>Mengetahui,</p>
            <p>Kepala Sekolah</p>
            <div class="sig-space"></div>
            <p class="sig-name">${kepsekName}</p>
            <p style="margin-top: 2px;">NIP. ${kepsekNip}</p>
          </div>
          <div>
            <p>${tanggalCetak}</p>
            <p>Wali Kelas</p>
            <div class="sig-space"></div>
            <p class="sig-name">${waliName}</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 250);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pratinjau E-Rapor Resmi — {siswa.nama}
              </h3>
              <p className="text-xs text-slate-500">
                TA {tahunAjaran} • Semester {semester} • Kelas {kelas?.jenjang?.kode} {kelas?.namaKelas}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Lembar Rapor</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preview Paper */}
        <div className="flex-1 overflow-y-auto bg-slate-100/80 p-6 dark:bg-slate-950/50">
          <div className="mx-auto max-w-3xl rounded-xl border border-slate-300 bg-white p-8 shadow-sm text-slate-900">
            {/* Kop */}
            <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4 mb-5">
              {sekolah?.logoUrl ? (
                <img src={sekolah.logoUrl} alt="Logo" className="h-14 w-14 object-contain" />
              ) : (
                <Building2 className="h-12 w-12 text-blue-800" />
              )}
              <div className="flex-1 text-center">
                <h2 className="text-lg font-black uppercase tracking-wide">{schoolName}</h2>
                <p className="text-xs text-slate-600">{schoolAddress}</p>
                <p className="text-[11px] text-slate-500">NPSN: {schoolNpsn}</p>
              </div>
            </div>

            {/* Identitas */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div><strong>Nama:</strong> {siswa.nama}</div>
              <div><strong>Kelas:</strong> {kelas?.jenjang?.kode} - {kelas?.namaKelas}</div>
              <div><strong>NIS / NISN:</strong> {siswa.nis} / {siswa.nisn || '-'}</div>
              <div><strong>Periode:</strong> {tahunAjaran} ({semester})</div>
              <div><strong>Rata-rata Nilai:</strong> <span className="font-mono font-bold text-blue-700">{rataRata}</span></div>
              <div><strong>Peringkat Kelas:</strong> {peringkat > 0 ? `#${peringkat}` : '-'}</div>
            </div>

            {/* Nilai Tabel */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Capaian Nilai Mata Pelajaran
            </h4>
            <table className="w-full border-collapse text-xs mb-5">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2 text-center w-10">No</th>
                  <th className="border border-slate-300 p-2 text-left">Mata Pelajaran</th>
                  <th className="border border-slate-300 p-2 text-center w-14">KKM</th>
                  <th className="border border-slate-300 p-2 text-center w-16">Nilai</th>
                  <th className="border border-slate-300 p-2 text-center w-16">Predikat</th>
                  <th className="border border-slate-300 p-2 text-left">Deskripsi Capaian</th>
                </tr>
              </thead>
              <tbody>
                {nilaiList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border border-slate-300 p-6 text-center text-slate-400">
                      Belum ada nilai yang diinput.
                    </td>
                  </tr>
                ) : (
                  nilaiList.map((n, idx) => (
                    <tr key={n.id}>
                      <td className="border border-slate-300 p-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 font-semibold">{n.mapel?.nama}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono">{n.mapel?.kkm || 75}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono font-bold">{n.nilaiAkhir}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{n.predikat}</td>
                      <td className="border border-slate-300 p-2 text-[11px]">
                        {n.deskripsi || getPredikatLabel(n.predikat)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Sikap, Absensi & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-lg border border-slate-300 p-3 space-y-1">
                <p className="font-bold border-b border-slate-200 pb-1 mb-1">Sikap & Ketidakhadiran</p>
                <p>Sikap Spiritual: <strong>{rapor?.sikapSpiritual || 'Baik'}</strong></p>
                <p>Sikap Sosial: <strong>{rapor?.sikapSosial || 'Baik'}</strong></p>
                <p className="pt-1">
                  Sakit: <strong>{rapor?.sakit || 0}</strong> • Izin: <strong>{rapor?.izin || 0}</strong> • Alpa:{' '}
                  <strong>{rapor?.alpa || 0}</strong>
                </p>
              </div>
              <div className="rounded-lg border border-slate-300 p-3 space-y-1">
                <p className="font-bold border-b border-slate-200 pb-1 mb-1">Catatan Wali Kelas</p>
                <p>{rapor?.catatanWali || 'Pertahankan prestasi belajar.'}</p>
                {rapor?.ekstrakurikuler && (
                  <p className="text-[11px] text-slate-600 pt-1">
                    <strong>Ekstrakurikuler:</strong> {rapor.ekstrakurikuler}
                  </p>
                )}
                {rapor?.keputusan && (
                  <p className="text-[11px] font-bold text-blue-700 pt-1">
                    Keputusan: {rapor.keputusan}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

