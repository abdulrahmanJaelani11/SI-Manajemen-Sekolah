'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Filter,
  Download,
  Printer,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  CreditCard,
  Layers,
  ChevronDown,
  Info,
  ExternalLink,
  Receipt,
  X,
  PieChart,
  SlidersHorizontal,
} from 'lucide-react'
import { formatRupiah, terbilang } from '@/lib/terbilang'
import { BukuKasItem } from '@/app/api/keuangan/laporan/route'

export default function LaporanKeuanganPage() {
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Data states
  const [bukuKas, setBukuKas] = useState<BukuKasItem[]>([])
  const [ringkasan, setRingkasan] = useState({
    saldoAwal: 0,
    totalSpp: 0,
    totalTagihan: 0,
    totalKasMasuk: 0,
    totalDebit: 0,
    totalKredit: 0,
    surplusDefisit: 0,
    saldoAkhir: 0,
    totalTransaksi: 0,
  })
  const [breakdown, setBreakdown] = useState<{
    kategori: Array<{ nama: string; jenis: 'masuk' | 'keluar'; total: number; count: number }>
    metode: Array<{ metode: string; total: number; count: number }>
  }>({ kategori: [], metode: [] })
  const [profilSekolah, setProfilSekolah] = useState<any>({
    namaSekolah: 'Sistem Manajemen Sekolah',
    npsn: '-',
    alamat: '-',
    telepon: '-',
    email: '-',
    website: '-',
    logoUrl: null,
  })
  const [tahunAjaranList, setTahunAjaranList] = useState<Array<{ id: number; nama: string; status: string }>>([])

  // Filter states
  const [presetPeriode, setPresetPeriode] = useState<'semua' | 'hari_ini' | 'bulan_ini' | 'tahun_aktif' | 'kustom'>('semua')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterSumber, setFilterSumber] = useState('all')
  const [filterMetode, setFilterMetode] = useState('all')
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // View state: 'buku_kas' | 'analisis'
  const [activeTab, setActiveTab] = useState<'buku_kas' | 'analisis'>('buku_kas')

  // Selected item modal detail
  const [selectedItem, setSelectedItem] = useState<BukuKasItem | null>(null)

  // Print modal & signatory state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [signatory, setSignatory] = useState({
    kota: 'Garut',
    tanggalSurat: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    namaKepsek: 'Dr. H. Ahmad Dahlan, M.Pd',
    nipKepsek: '19750812 200003 1 004',
    namaBendahara: 'Siti Aminah, S.E',
    nipBendahara: '19820415 200604 2 018',
  })

  // Pagination for ledger
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Fetch report data
  const fetchData = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (filterSumber && filterSumber !== 'all') params.set('sumber', filterSumber)
      if (filterMetode && filterMetode !== 'all') params.set('metode', filterMetode)
      if (filterTahunAjaran && filterTahunAjaran !== 'all') params.set('tahunAjaran', filterTahunAjaran)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/keuangan/laporan?${params.toString()}`)
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memuat laporan arus kas')
      }

      setBukuKas(json.data.bukuKas || [])
      setRingkasan(json.data.ringkasan)
      setBreakdown(json.data.breakdown)
      if (json.data.profilSekolah) setProfilSekolah(json.data.profilSekolah)
      if (json.data.tahunAjaranList) setTahunAjaranList(json.data.tahunAjaranList)
      setCurrentPage(1)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat memuat laporan')
    } finally {
      setLoading(false)
    }
  }

  // Effect to load on mount and when filters change
  useEffect(() => {
    fetchData()
  }, [startDate, endDate, filterSumber, filterMetode, filterTahunAjaran])

  // Handle Preset Periode click
  const applyPreset = (preset: 'semua' | 'hari_ini' | 'bulan_ini' | 'tahun_aktif' | 'kustom') => {
    setPresetPeriode(preset)
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`

    if (preset === 'semua') {
      setStartDate('')
      setEndDate('')
    } else if (preset === 'hari_ini') {
      setStartDate(todayStr)
      setEndDate(todayStr)
    } else if (preset === 'bulan_ini') {
      setStartDate(`${yyyy}-${mm}-01`)
      setEndDate(todayStr)
    } else if (preset === 'tahun_aktif') {
      // Tahun ajaran Indonesia mulai Juli
      const tahunMulai = today.getMonth() + 1 >= 7 ? yyyy : yyyy - 1
      setStartDate(`${tahunMulai}-07-01`)
      setEndDate(todayStr)
    }
  }

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  // Reset all filters
  const resetFilters = () => {
    setPresetPeriode('semua')
    setStartDate('')
    setEndDate('')
    setFilterSumber('all')
    setFilterMetode('all')
    setFilterTahunAjaran('all')
    setSearchQuery('')
  }

  // Filtered by live search on client if not already triggered
  const displayedItems = useMemo(() => {
    if (!searchQuery.trim()) return bukuKas
    const q = searchQuery.toLowerCase().trim()
    return bukuKas.filter(
      (item) =>
        item.noTransaksi.toLowerCase().includes(q) ||
        item.uraian.toLowerCase().includes(q) ||
        item.pihakTerkait.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.metode.toLowerCase().includes(q)
    )
  }, [bukuKas, searchQuery])

  // Paginated items
  const totalPages = Math.ceil(displayedItems.length / pageSize) || 1
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return displayedItems.slice(start, start + pageSize)
  }, [displayedItems, currentPage, pageSize])

  // Export to CSV
  const exportToCSV = () => {
    if (displayedItems.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor.')
      return
    }

    const headers = [
      'No',
      'Tanggal',
      'No Transaksi / Bukti',
      'Sumber Arus Kas',
      'Kategori Pos',
      'Uraian Transaksi',
      'Pihak Terkait (Siswa/Vendor/Donatur)',
      'Metode Pembayaran',
      'Penerimaan / Debit (Rp)',
      'Pengeluaran / Kredit (Rp)',
      'Saldo Berjalan (Rp)',
      'Petugas Pencatat',
    ]

    const rows = displayedItems.map((item, idx) => [
      idx + 1,
      new Date(item.tanggal).toLocaleDateString('id-ID'),
      `"${item.noTransaksi}"`,
      `"${item.sumber}"`,
      `"${item.kategori}"`,
      `"${item.uraian.replace(/"/g, '""')}"`,
      `"${item.pihakTerkait.replace(/"/g, '""')}"`,
      `"${item.metode}"`,
      item.debit,
      item.kredit,
      item.saldo,
      `"${item.petugas || '-'}"`,
    ])

    // Summary row
    rows.push([
      '',
      '',
      '"TOTAL KESELURUHAN"',
      '',
      '',
      '',
      '',
      '',
      ringkasan.totalDebit,
      ringkasan.totalKredit,
      ringkasan.saldoAkhir,
      '',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Laporan_Buku_Kas_${startDate || 'Awal'}_sd_${endDate || 'Kini'}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Trigger Print (Isolated Clean Document)
  const handlePrint = () => {
    const logoSrc = profilSekolah.logoUrl
      ? profilSekolah.logoUrl.startsWith('http')
        ? profilSekolah.logoUrl
        : `${typeof window !== 'undefined' ? window.location.origin : ''}${profilSekolah.logoUrl}`
      : ''

    const periodeText = startDate
      ? `${new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s.d. ${
          endDate
            ? new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
        }`
      : `Semua Transaksi (s.d. ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})`

    const itemsRows = displayedItems
      .map(
        (item, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #334155; padding: 6px 7px;">${idx + 1}</td>
          <td style="text-align: center; border: 1px solid #334155; padding: 6px 7px; white-space: nowrap;">
            ${new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </td>
          <td style="border: 1px solid #334155; padding: 6px 7px; font-family: monospace; font-size: 10.5px; font-weight: 600;">
            ${item.noTransaksi}
          </td>
          <td style="border: 1px solid #334155; padding: 6px 7px;">
            <div style="font-weight: 700; font-size: 11px;">${item.sumber}</div>
            <div style="font-size: 10px; color: #475569;">${item.kategori}</div>
          </td>
          <td style="border: 1px solid #334155; padding: 6px 7px;">
            <div style="font-weight: 600; color: #0f172a;">${item.uraian}</div>
            <div style="font-size: 10px; color: #475569;">Pihak Terkait: ${item.pihakTerkait} ${
          item.kelas && item.kelas !== '-' ? `(Kls ${item.kelas})` : ''
        }</div>
          </td>
          <td style="text-align: center; border: 1px solid #334155; padding: 6px 7px;">${item.metode}</td>
          <td style="text-align: right; border: 1px solid #334155; padding: 6px 7px; font-family: monospace; font-weight: 600; color: ${
            item.debit > 0 ? '#047857' : '#64748b'
          };">
            ${item.debit > 0 ? formatRupiah(item.debit) : '-'}
          </td>
          <td style="text-align: right; border: 1px solid #334155; padding: 6px 7px; font-family: monospace; font-weight: 600; color: ${
            item.kredit > 0 ? '#b91c1c' : '#64748b'
          };">
            ${item.kredit > 0 ? formatRupiah(item.kredit) : '-'}
          </td>
          <td style="text-align: right; border: 1px solid #334155; padding: 6px 7px; font-family: monospace; font-weight: 700; color: #0f172a;">
            ${formatRupiah(item.saldo)}
          </td>
        </tr>
      `
      )
      .join('')

    const saldoAwalRow = startDate
      ? `
        <tr style="background-color: #f1f5f9; font-weight: 700;">
          <td style="text-align: center; border: 1px solid #334155; padding: 6px 7px;">-</td>
          <td style="text-align: center; border: 1px solid #334155; padding: 6px 7px;">${new Date(startDate).toLocaleDateString(
            'id-ID'
          )}</td>
          <td style="border: 1px solid #334155; padding: 6px 7px; font-family: monospace; font-size: 10.5px;">SALDO-AWAL</td>
          <td style="border: 1px solid #334155; padding: 6px 7px;">Saldo Awal</td>
          <td style="border: 1px solid #334155; padding: 6px 7px;">Saldo Kas Kumulatif Sebelum Periode Berjalan</td>
          <td style="text-align: center; border: 1px solid #334155; padding: 6px 7px;">-</td>
          <td style="text-align: right; border: 1px solid #334155; padding: 6px 7px;">-</td>
          <td style="text-align: right; border: 1px solid #334155; padding: 6px 7px;">-</td>
          <td style="text-align: right; border: 1px solid #334155; padding: 6px 7px; font-family: monospace; font-weight: 800;">${formatRupiah(
            ringkasan.saldoAwal
          )}</td>
        </tr>
      `
      : ''

    const reportHtml = `
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Laporan Arus Kas & Buku Kas Terpadu - ${profilSekolah.namaSekolah}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 10mm 12mm;
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
              padding: 10px 15px;
              font-size: 11px;
              line-height: 1.4;
            }
            .kop {
              display: flex;
              align-items: center;
              border-bottom: 3px double #0f172a;
              padding-bottom: 12px;
              margin-bottom: 14px;
              gap: 16px;
            }
            .kop-logo {
              width: 70px;
              height: 70px;
              object-fit: contain;
              flex-shrink: 0;
            }
            .kop-text {
              flex: 1;
              text-align: center;
            }
            .kop-text h1 {
              font-size: 17px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
            }
            .kop-text p.npsn {
              font-size: 11px;
              font-weight: 600;
              color: #334155;
              margin-top: 2px;
            }
            .kop-text p.alamat {
              font-size: 10px;
              color: #475569;
              margin-top: 2px;
            }
            .doc-title {
              text-align: center;
              margin-bottom: 12px;
            }
            .doc-title h2 {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              text-decoration: underline;
              letter-spacing: 0.5px;
            }
            .doc-title p {
              font-size: 10.5px;
              color: #334155;
              font-weight: 600;
              margin-top: 3px;
            }
            .rekap-card {
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 10px 14px;
              margin-bottom: 14px;
              background-color: #f8fafc;
            }
            .rekap-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 30px;
              font-size: 11px;
            }
            .rekap-row {
              display: flex;
              justify-content: space-between;
              padding: 2px 0;
            }
            .rekap-sub {
              font-size: 10px;
              color: #64748b;
              padding-left: 14px;
            }
            .rekap-total {
              border-top: 2px solid #0f172a;
              padding-top: 4px;
              margin-top: 4px;
              font-weight: 800;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 10.5px;
            }
            th {
              background-color: #f1f5f9;
              color: #0f172a;
              padding: 7px 6px;
              border: 1px solid #334155;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 10px;
              text-align: center;
            }
            tfoot tr {
              background-color: #f1f5f9;
              font-weight: 800;
              border-top: 2px solid #0f172a;
            }
            tfoot td {
              padding: 7px 6px;
              border: 1px solid #334155;
            }
            .ttd-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              margin-top: 24px;
              page-break-inside: avoid;
              text-align: center;
              font-size: 11px;
            }
            .ttd-box {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .ttd-space {
              height: 65px;
            }
            .ttd-name {
              font-weight: 700;
              text-decoration: underline;
              text-transform: uppercase;
            }
            .ttd-nip {
              font-size: 10px;
              color: #334155;
            }
          </style>
        </head>
        <body>
          <div class="kop">
            ${logoSrc ? `<img src="${logoSrc}" class="kop-logo" alt="Logo" />` : ''}
            <div class="kop-text">
              <h1>${profilSekolah.namaSekolah || 'SISTEM MANAJEMEN SEKOLAH'}</h1>
              <p class="npsn">NPSN: ${profilSekolah.npsn || '-'} • Bentuk Pendidikan: ${
      profilSekolah.bentukPendidikan || 'Multi-Jenjang'
    }</p>
              <p class="alamat">${profilSekolah.alamat || '-'} • Telp: ${
      profilSekolah.telepon || '-'
    } • Email: ${profilSekolah.email || '-'}</p>
            </div>
          </div>

          <div class="doc-title">
            <h2>LAPORAN BUKU KAS UMUM & ARUS KAS SEKOLAH TERPADU</h2>
            <p>Periode: ${periodeText} ${
      filterTahunAjaran && filterTahunAjaran !== 'all' ? `• Tahun Ajaran: ${filterTahunAjaran}` : ''
    }</p>
          </div>

          <div class="rekap-card">
            <div style="font-weight: 800; text-transform: uppercase; font-size: 11px; margin-bottom: 6px; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
              Ringkasan Rekapitulasi Arus Kas:
            </div>
            <div class="rekap-grid">
              <div>
                <div class="rekap-row">
                  <span>A. Saldo Awal Kas Periode:</span>
                  <span style="font-family: monospace; font-weight: 700;">${formatRupiah(ringkasan.saldoAwal)}</span>
                </div>
                <div class="rekap-row">
                  <span style="font-weight: 700; color: #047857;">B. Total Penerimaan (Debit):</span>
                  <span style="font-family: monospace; font-weight: 800; color: #047857;">+${formatRupiah(
                    ringkasan.totalDebit
                  )}</span>
                </div>
                <div class="rekap-row rekap-sub">
                  <span>- Penerimaan Kasir SPP:</span>
                  <span style="font-family: monospace;">${formatRupiah(ringkasan.totalSpp)}</span>
                </div>
                <div class="rekap-row rekap-sub">
                  <span>- Penerimaan Tagihan Siswa:</span>
                  <span style="font-family: monospace;">${formatRupiah(ringkasan.totalTagihan)}</span>
                </div>
                <div class="rekap-row rekap-sub">
                  <span>- Kas Masuk Operasional Lain (BOS/Hibah):</span>
                  <span style="font-family: monospace;">${formatRupiah(ringkasan.totalKasMasuk)}</span>
                </div>
              </div>

              <div>
                <div class="rekap-row">
                  <span style="font-weight: 700; color: #b91c1c;">C. Total Pengeluaran (Kredit):</span>
                  <span style="font-family: monospace; font-weight: 800; color: #b91c1c;">-${formatRupiah(
                    ringkasan.totalKredit
                  )}</span>
                </div>
                <div class="rekap-row">
                  <span>D. Surplus / (Defisit) Berjalan:</span>
                  <span style="font-family: monospace; font-weight: 700;">${
                    ringkasan.surplusDefisit >= 0 ? '+' : ''
                  }${formatRupiah(ringkasan.surplusDefisit)}</span>
                </div>
                <div class="rekap-row rekap-total">
                  <span>E. SALDO AKHIR KAS (A + D):</span>
                  <span style="font-family: monospace; font-weight: 900; color: #0f172a; font-size: 13px;">${formatRupiah(
                    ringkasan.saldoAkhir
                  )}</span>
                </div>
                <div style="font-size: 10px; font-style: italic; color: #475569; margin-top: 4px;">
                  Terbilang: "${terbilang(ringkasan.saldoAkhir)}"
                </div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 32px;">No</th>
                <th style="width: 70px;">Tanggal</th>
                <th style="width: 110px;">No. Bukti</th>
                <th style="width: 120px;">Sumber / Pos</th>
                <th>Uraian & Pihak Terkait</th>
                <th style="width: 65px;">Metode</th>
                <th style="width: 95px; text-align: right;">Masuk / Debit</th>
                <th style="width: 95px; text-align: right;">Keluar / Kredit</th>
                <th style="width: 105px; text-align: right;">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody>
              ${saldoAwalRow}
              ${itemsRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6" style="text-align: right; text-transform: uppercase;">Total Transaksi (${
                  displayedItems.length
                } baris):</td>
                <td style="text-align: right; font-family: monospace; color: #047857;">${formatRupiah(
                  ringkasan.totalDebit
                )}</td>
                <td style="text-align: right; font-family: monospace; color: #b91c1c;">${formatRupiah(
                  ringkasan.totalKredit
                )}</td>
                <td style="text-align: right; font-family: monospace; font-size: 11px; font-weight: 900;">${formatRupiah(
                  ringkasan.saldoAkhir
                )}</td>
              </tr>
            </tfoot>
          </table>

          <div class="ttd-container">
            <div class="ttd-box">
              <p>Mengetahui,</p>
              <p style="font-weight: 700;">Kepala Sekolah</p>
              <div class="ttd-space"></div>
              <p class="ttd-name">${signatory.namaKepsek}</p>
              <p class="ttd-nip">NIP. ${signatory.nipKepsek}</p>
            </div>

            <div class="ttd-box">
              <p>${signatory.kota}, ${signatory.tanggalSurat}</p>
              <p style="font-weight: 700;">Bendahara Sekolah</p>
              <div class="ttd-space"></div>
              <p class="ttd-name">${signatory.namaBendahara}</p>
              <p class="ttd-nip">NIP. ${signatory.nipBendahara}</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `

    // Open dedicated window
    const printWindow = window.open('', '_blank', 'width=1100,height=850')
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(reportHtml)
      printWindow.document.close()
    } else {
      // Fallback via iframe if popup blocked
      let iframe = document.getElementById('print-iframe-keuangan') as HTMLIFrameElement
      if (!iframe) {
        iframe = document.createElement('iframe')
        iframe.id = 'print-iframe-keuangan'
        iframe.style.position = 'fixed'
        iframe.style.right = '0'
        iframe.style.bottom = '0'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = '0'
        document.body.appendChild(iframe)
      }
      const doc = iframe.contentWindow?.document || iframe.contentDocument
      if (doc) {
        doc.open()
        doc.write(reportHtml)
        doc.close()
        setTimeout(() => {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        }, 300)
      }
    }
  }

  return (
    <div className="space-y-6 pb-12 print:hidden">
      {/* ============================================================== */}
      {/* 1. HEADER SECTION (NON-PRINT) */}
      {/* ============================================================== */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
            <Wallet className="w-4 h-4" />
            <span>Manajemen Finansial Terintegrasi</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Laporan Arus Kas & Buku Kas Terpadu
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Konsolidasi otomatis seluruh penerimaan SPP, Tagihan Siswa, dan Kas Masuk/Keluar Operasional Sekolah.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium transition shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Laporan Resmi</span>
          </button>

          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition shadow-sm shadow-emerald-500/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={fetchData}
            title="Muat Ulang Data"
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="no-print p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. KPI SUMMARY CARDS (NON-PRINT) */}
      {/* ============================================================== */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SPP */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-blue-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-blue-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Penerimaan SPP
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {formatRupiah(ringkasan.totalSpp)}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Kasir SPP Bulanan Siswa (Sah)
          </p>
        </div>

        {/* Total Non-SPP */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-cyan-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-cyan-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              Tagihan Non-SPP
            </span>
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {formatRupiah(ringkasan.totalTagihan)}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Uang Gedung, Seragam & Cicilan
          </p>
        </div>

        {/* Total Kas Masuk Lain */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-emerald-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Kas Masuk Lainnya
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {formatRupiah(ringkasan.totalKasMasuk)}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Dana BOS, Hibah & Usaha Sekolah
          </p>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-rose-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-rose-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Pengeluaran Operasional
            </span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
            {formatRupiah(ringkasan.totalKredit)}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Honor, Listrik, Sarpras & ATK
          </p>
        </div>
      </div>

      {/* TOTAL ARUS KAS & SALDO AKHIR BAR */}
      <div className="no-print bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Saldo Awal Periode
            </span>
            <div className="text-lg font-bold text-slate-200 mt-0.5">
              {formatRupiah(ringkasan.saldoAwal)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Akumulasi sebelum filter</div>
          </div>

          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownCircle className="w-3.5 h-3.5" /> Total Penerimaan (Debit)
            </span>
            <div className="text-xl font-black text-emerald-300 mt-0.5">
              +{formatRupiah(ringkasan.totalDebit)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Konsolidasi 3 aliran masuk</div>
          </div>

          <div>
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpCircle className="w-3.5 h-3.5" /> Total Pengeluaran (Kredit)
            </span>
            <div className="text-xl font-black text-rose-300 mt-0.5">
              -{formatRupiah(ringkasan.totalKredit)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Seluruh pos pengeluaran kas</div>
          </div>

          <div className="bg-white/10 dark:bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Saldo Kas Kumulatif
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              {formatRupiah(ringkasan.saldoAkhir)}
            </div>
            <div className="text-xs text-amber-200/80 mt-0.5">
              Surplus Periode: {ringkasan.surplusDefisit >= 0 ? '+' : ''}
              {formatRupiah(ringkasan.surplusDefisit)}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. FILTER BAR (NON-PRINT) */}
      {/* ============================================================== */}
      <div className="no-print bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        {/* Preset Periode Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Preset Rentang Waktu:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'semua', label: 'Semua Waktu' },
              { id: 'hari_ini', label: 'Hari Ini' },
              { id: 'bulan_ini', label: 'Bulan Ini' },
              { id: 'tahun_aktif', label: 'Tahun Ajaran Berjalan' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  presetPeriode === p.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPresetPeriode('kustom')
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPresetPeriode('kustom')
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </div>

          {/* Filter Sumber */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sumber Aliran
            </label>
            <select
              value={filterSumber}
              onChange={(e) => setFilterSumber(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            >
              <option value="all">Semua Aliran Kas</option>
              <option value="spp">Hanya Kasir SPP</option>
              <option value="tagihan">Hanya Tagihan Siswa</option>
              <option value="kas_umum">Kas Umum (Masuk & Keluar)</option>
              <option value="kas_masuk">Hanya Kas Masuk Lain</option>
              <option value="kas_keluar">Hanya Pengeluaran Kas</option>
            </select>
          </div>

          {/* Filter Metode */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={filterMetode}
              onChange={(e) => setFilterMetode(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            >
              <option value="all">Semua Metode</option>
              <option value="Tunai">Tunai</option>
              <option value="Transfer">Bank / Transfer</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>

          {/* Filter Tahun Ajaran */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tahun Ajaran
            </label>
            <select
              value={filterTahunAjaran}
              onChange={(e) => setFilterTahunAjaran(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            >
              <option value="all">Semua Tahun Ajaran</option>
              {tahunAjaranList.map((ta) => (
                <option key={ta.id} value={ta.nama}>
                  {ta.nama} {ta.status === 'aktif' ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Search and Reset */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari no transaksi, uraian, pihak terkait, kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
            />
          </form>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-gray-500">
              Ditemukan <strong className="text-gray-800 dark:text-gray-200">{displayedItems.length}</strong> transaksi
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 transition"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. TABS VIEW: BUKU KAS vs ANALISIS (NON-PRINT) */}
      {/* ============================================================== */}
      <div className="no-print flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('buku_kas')}
            className={`pb-3 text-sm font-semibold transition relative ${
              activeTab === 'buku_kas'
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Buku Kas Terpadu (Ledger)</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                {displayedItems.length}
              </span>
            </div>
            {activeTab === 'buku_kas' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('analisis')}
            className={`pb-3 text-sm font-semibold transition relative ${
              activeTab === 'analisis'
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              <span>Rincian Pos Kategori & Metode</span>
            </div>
            {activeTab === 'analisis' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        </div>

        {/* Page size selector */}
        {activeTab === 'buku_kas' && (
          <div className="flex items-center gap-2 text-xs text-gray-500 pb-2">
            <span>Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
            >
              <option value="15">15 baris</option>
              <option value="25">25 baris</option>
              <option value="50">50 baris</option>
              <option value="100">100 baris</option>
              <option value="9999">Semua</option>
            </select>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 5. TAB CONTENT: BUKU KAS LEDGER TABLE (NON-PRINT) */}
      {/* ============================================================== */}
      {activeTab === 'buku_kas' && (
        <div className="no-print bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4 w-28">Tanggal</th>
                  <th className="py-3.5 px-4 w-36">No. Transaksi</th>
                  <th className="py-3.5 px-4 w-36">Sumber / Kategori</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Uraian & Pihak Terkait</th>
                  <th className="py-3.5 px-4 w-24">Metode</th>
                  <th className="py-3.5 px-4 w-32 text-right">Debit / Masuk</th>
                  <th className="py-3.5 px-4 w-32 text-right">Kredit / Keluar</th>
                  <th className="py-3.5 px-4 w-36 text-right">Saldo Berjalan</th>
                  <th className="py-3.5 px-4 w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium">
                {/* SALDO AWAL ROW IF FILTER HAS START DATE */}
                {startDate && (
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-bold">
                    <td className="py-3 px-4 text-center text-gray-400">-</td>
                    <td className="py-3 px-4">{new Date(startDate).toLocaleDateString('id-ID')}</td>
                    <td className="py-3 px-4 text-gray-400">SALDO-AWAL</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        Saldo Awal
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      Saldo awal kas kumulatif sebelum periode {new Date(startDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-4">-</td>
                    <td className="py-3 px-4 text-right text-gray-400">-</td>
                    <td className="py-3 px-4 text-right text-gray-400">-</td>
                    <td className="py-3 px-4 text-right font-black text-gray-900 dark:text-white">
                      {formatRupiah(ringkasan.saldoAwal)}
                    </td>
                    <td className="py-3 px-4 text-center">-</td>
                  </tr>
                )}

                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      <RotateCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      <span>Sedang memuat data buku kas terpadu...</span>
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      <Info className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <span>Tidak ada transaksi yang sesuai dengan filter yang dipilih.</span>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, index) => {
                    const rowNumber = (currentPage - 1) * pageSize + index + 1
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-750 transition group"
                      >
                        <td className="py-3 px-4 text-center text-gray-400 font-normal">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {new Date(item.tanggal).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {item.noTransaksi}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            {item.sumberBadge === 'spp' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                Kasir SPP
                              </span>
                            )}
                            {item.sumberBadge === 'tagihan' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                                Tagihan Siswa
                              </span>
                            )}
                            {item.sumberBadge === 'kas_masuk' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Kas Masuk Lain
                              </span>
                            )}
                            {item.sumberBadge === 'kas_keluar' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                Kas Keluar
                              </span>
                            )}
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                              {item.kategori}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-900 dark:text-white font-medium line-clamp-1">
                            {item.uraian}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <span>{item.pihakTerkait}</span>
                            {item.kelas && item.kelas !== '-' && (
                              <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-[10px]">
                                Kls {item.kelas}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {item.metode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.debit > 0 ? formatRupiah(item.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-rose-600 dark:text-rose-400">
                          {item.kredit > 0 ? formatRupiah(item.kredit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-gray-900 dark:text-white">
                          {formatRupiah(item.saldo)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedItem(item)}
                            title="Lihat Detail Transaksi"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700/50 font-bold border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                <tr>
                  <td colSpan={6} className="py-3.5 px-4 text-right uppercase tracking-wider text-[11px]">
                    Total Halaman / Periode:
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-black">
                    +{formatRupiah(ringkasan.totalDebit)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400 font-black">
                    -{formatRupiah(ringkasan.totalKredit)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-primary">
                    {formatRupiah(ringkasan.saldoAkhir)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 text-xs text-gray-500">
              <div>
                Menampilkan {(currentPage - 1) * pageSize + 1} s.d.{' '}
                {Math.min(currentPage * pageSize, displayedItems.length)} dari {displayedItems.length} data
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sebelumnya
                </button>
                <span className="px-2 font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. TAB CONTENT: ANALISIS KATEGORI & METODE (NON-PRINT) */}
      {/* ============================================================== */}
      {activeTab === 'analisis' && (
        <div className="no-print grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Breakdown Pos Kategori */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Rekapitulasi Arus Kas per Pos Kategori</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Distribusi nominal berdasarkan pos penerimaan dan pengeluaran pada periode terpilih.
            </p>

            <div className="space-y-3">
              {breakdown.kategori.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Tidak ada transaksi dalam periode ini.
                </div>
              ) : (
                breakdown.kategori.map((k, i) => {
                  const isMasuk = k.jenis === 'masuk'
                  const percentage =
                    ringkasan.totalDebit + ringkasan.totalKredit > 0
                      ? Math.round((k.total / (isMasuk ? ringkasan.totalDebit : ringkasan.totalKredit)) * 100)
                      : 0

                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isMasuk ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {k.nama}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-2">
                          <span>{k.count} Transaksi</span>
                          <span>•</span>
                          <span>{isMasuk ? 'Penerimaan / Masuk' : 'Pengeluaran / Keluar'}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-sm font-bold ${
                            isMasuk ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isMasuk ? '+' : '-'} {formatRupiah(k.total)}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          {percentage}% dari total {isMasuk ? 'penerimaan' : 'pengeluaran'}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Breakdown Metode Pembayaran */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>Distribusi Berdasarkan Kanal / Metode</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Komposisi perputaran uang melalui Tunai langsung, Rekening Bank, atau QRIS digital.
            </p>

            <div className="space-y-3">
              {breakdown.metode.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  Tidak ada transaksi dalam periode ini.
                </div>
              ) : (
                breakdown.metode.map((m, i) => {
                  const grandTotal = ringkasan.totalDebit + ringkasan.totalKredit
                  const percentage = grandTotal > 0 ? Math.round((m.total / grandTotal) * 100) : 0

                  return (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            Metode: {m.metode}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {m.count} Transaksi Terproses
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatRupiah(m.total)}
                        </div>
                        <div className="text-[10px] text-primary font-medium">
                          {percentage}% dari seluruh volume kas
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Quick summary box */}
            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Info className="w-4 h-4" />
                <span>Pencatatan Berprinsip Single-Entry Cash Flow</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Setiap pembayaran yang disahkan di kasir SPP maupun kasir cicilan non-SPP secara otomatis didebit ke buku kas umum ini tanpa perlu input ganda oleh bendahara sekolah.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MODAL DETAIL TRANSAKSI (NON-PRINT) */}
      {/* ============================================================== */}
      {selectedItem && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Detail Transaksi Finansial
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                  {selectedItem.noTransaksi}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <span className="text-gray-500">Waktu & Tanggal:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {new Date(selectedItem.tanggal).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <span className="text-gray-500">Sumber Aliran:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {selectedItem.sumber}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <span className="text-gray-500">Kategori Pos:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {selectedItem.kategori}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <span className="text-gray-500">Metode Pembayaran:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {selectedItem.metode}
                </p>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <span className="text-gray-500">Pihak Terkait:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {selectedItem.pihakTerkait} {selectedItem.kelas && selectedItem.kelas !== '-' ? `(Kelas ${selectedItem.kelas})` : ''}
                </p>
              </div>

              <div className="col-span-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <span className="text-gray-500">Uraian / Keterangan:</span>
                <p className="font-medium text-gray-800 dark:text-gray-200 mt-0.5 leading-relaxed">
                  {selectedItem.uraian}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                  Nominal Masuk (Debit):
                </span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedItem.debit > 0 ? formatRupiah(selectedItem.debit) : 'Rp 0'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                <span className="text-rose-700 dark:text-rose-300 font-semibold">
                  Nominal Keluar (Kredit):
                </span>
                <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  {selectedItem.kredit > 0 ? formatRupiah(selectedItem.kredit) : 'Rp 0'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
              <span>Dicatat oleh: <strong>{selectedItem.petugas || 'Sistem'}</strong></span>
              {selectedItem.lampiranUrl && (
                <a
                  href={selectedItem.lampiranUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Lihat Nota / Lampiran</span>
                </a>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. MODAL PRATINJAU CETAK / LAPORAN FORMAL (NON-PRINT) */}
      {/* ============================================================== */}
      {isPrintModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-primary" />
                  <span>Konfigurasi & Pratinjau Laporan Arus Kas Resmi</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Laporan akan dicetak dengan kop surat sekolah dan kolom pengesahan tanda tangan.
                </p>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pengaturan Penandatangan */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 space-y-3">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>Pengaturan Lembar Pengesahan Tanda Tangan:</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-gray-500 mb-1">Kota Tempat Pengesahan</label>
                  <input
                    type="text"
                    value={signatory.kota}
                    onChange={(e) => setSignatory({ ...signatory, kota: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Tanggal Dokumen</label>
                  <input
                    type="text"
                    value={signatory.tanggalSurat}
                    onChange={(e) => setSignatory({ ...signatory, tanggalSurat: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Nama Kepala Sekolah</label>
                  <input
                    type="text"
                    value={signatory.namaKepsek}
                    onChange={(e) => setSignatory({ ...signatory, namaKepsek: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">NIP Kepala Sekolah</label>
                  <input
                    type="text"
                    value={signatory.nipKepsek}
                    onChange={(e) => setSignatory({ ...signatory, nipKepsek: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Nama Bendahara</label>
                  <input
                    type="text"
                    value={signatory.namaBendahara}
                    onChange={(e) => setSignatory({ ...signatory, namaBendahara: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">NIP Bendahara</label>
                  <input
                    type="text"
                    value={signatory.nipBendahara}
                    onChange={(e) => setSignatory({ ...signatory, nipBendahara: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Ringkasan Dokumen */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama Sekolah:</span>
                <span className="font-bold text-gray-900 dark:text-white">{profilSekolah.namaSekolah}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rentang Transaksi:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {startDate ? new Date(startDate).toLocaleDateString('id-ID') : 'Awal Pembukuan'} s.d.{' '}
                  {endDate ? new Date(endDate).toLocaleDateString('id-ID') : 'Hari Ini'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah Transaksi:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {displayedItems.length} baris transaksi
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Saldo Akhir Kumulatif:</span>
                <span className="font-black text-primary text-sm">
                  {formatRupiah(ringkasan.saldoAkhir)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  handlePrint()
                  setIsPrintModalOpen(false)
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-md shadow-primary/20"
              >
                <Printer className="w-4 h-4" />
                <span>Buka Dialog Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

