import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export interface BukuKasItem {
  id: string
  noTransaksi: string
  tanggal: string
  sumber: 'SPP' | 'Tagihan Siswa' | 'Kas Umum (Masuk)' | 'Kas Umum (Keluar)'
  sumberBadge: 'spp' | 'tagihan' | 'kas_masuk' | 'kas_keluar'
  kategori: string
  uraian: string
  pihakTerkait: string
  kelas?: string
  metode: string
  debit: number
  kredit: number
  saldo: number
  petugas?: string
  lampiranUrl?: string
  refId: number
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/laporan', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') // YYYY-MM-DD
    const endDate = searchParams.get('endDate')     // YYYY-MM-DD
    const metode = searchParams.get('metode')       // 'all' | 'Tunai' | 'Transfer' | 'QRIS'
    const sumber = searchParams.get('sumber')       // 'all' | 'spp' | 'tagihan' | 'kas_umum' | 'kas_masuk' | 'kas_keluar'
    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const tahunAjaran = searchParams.get('tahunAjaran') // e.g. "2024/2025" or 'all'

    // Buat Date boundaries
    let startDateTime: Date | null = null
    let endDateTime: Date | null = null

    if (startDate) {
      startDateTime = new Date(`${startDate}T00:00:00.000Z`)
    }
    if (endDate) {
      endDateTime = new Date(`${endDate}T23:59:59.999Z`)
    }

    // 1. Hitung Saldo Awal (sebelum startDate jika ada startDate)
    let saldoAwal = 0
    let saldoAwalDebit = 0
    let saldoAwalKredit = 0

    if (startDateTime) {
      const [priorSpp, priorTagihan, priorKasMasuk, priorKasKeluar] = await Promise.all([
        prisma.sppPembayaran.aggregate({
          where: {
            status: 'lunas',
            tanggalBayar: { lt: startDateTime },
          },
          _sum: { nominalBayar: true },
        }),
        prisma.pembayaranTagihan.aggregate({
          where: {
            status: 'sah',
            tanggalBayar: { lt: startDateTime },
          },
          _sum: { nominalBayar: true },
        }),
        prisma.kasTransaksi.aggregate({
          where: {
            jenis: 'pemasukan',
            tanggal: { lt: startDateTime },
          },
          _sum: { nominal: true },
        }),
        prisma.kasTransaksi.aggregate({
          where: {
            jenis: 'pengeluaran',
            tanggal: { lt: startDateTime },
          },
          _sum: { nominal: true },
        }),
      ])

      const sppSum = Number(priorSpp._sum.nominalBayar || 0)
      const tagihanSum = Number(priorTagihan._sum.nominalBayar || 0)
      const kasMasukSum = Number(priorKasMasuk._sum.nominal || 0)
      const kasKeluarSum = Number(priorKasKeluar._sum.nominal || 0)

      saldoAwalDebit = sppSum + tagihanSum + kasMasukSum
      saldoAwalKredit = kasKeluarSum
      saldoAwal = saldoAwalDebit - saldoAwalKredit
    }

    // 2. Query Transaksi dalam rentang tanggal
    // Query SPP
    const shouldFetchSpp = !sumber || sumber === 'all' || sumber === 'spp'
    const sppWhere: any = { status: 'lunas' }
    if (startDateTime || endDateTime) {
      sppWhere.tanggalBayar = {}
      if (startDateTime) sppWhere.tanggalBayar.gte = startDateTime
      if (endDateTime) sppWhere.tanggalBayar.lte = endDateTime
    }
    if (metode && metode !== 'all') {
      if (metode === 'Transfer' || metode === 'Bank / Transfer') {
        sppWhere.metodeBayar = { in: ['Transfer', 'Bank / Transfer', 'Bank'] }
      } else {
        sppWhere.metodeBayar = { equals: metode, mode: 'insensitive' }
      }
    }
    if (tahunAjaran && tahunAjaran !== 'all') {
      sppWhere.tahunAjaran = tahunAjaran
    }

    // Query Tagihan Non-SPP
    const shouldFetchTagihan = !sumber || sumber === 'all' || sumber === 'tagihan'
    const tagihanWhere: any = { status: 'sah' }
    if (startDateTime || endDateTime) {
      tagihanWhere.tanggalBayar = {}
      if (startDateTime) tagihanWhere.tanggalBayar.gte = startDateTime
      if (endDateTime) tagihanWhere.tanggalBayar.lte = endDateTime
    }
    if (metode && metode !== 'all') {
      if (metode === 'Transfer' || metode === 'Bank / Transfer') {
        tagihanWhere.metodeBayar = { in: ['Transfer', 'Bank / Transfer', 'Bank'] }
      } else {
        tagihanWhere.metodeBayar = { equals: metode, mode: 'insensitive' }
      }
    }
    if (tahunAjaran && tahunAjaran !== 'all') {
      tagihanWhere.tagihan = { tahunAjaran }
    }

    // Query Kas Umum
    const shouldFetchKas = !sumber || sumber === 'all' || sumber === 'kas_umum' || sumber === 'kas_masuk' || sumber === 'kas_keluar'
    const kasWhere: any = {}
    if (sumber === 'kas_masuk') kasWhere.jenis = 'pemasukan'
    if (sumber === 'kas_keluar') kasWhere.jenis = 'pengeluaran'
    if (startDateTime || endDateTime) {
      kasWhere.tanggal = {}
      if (startDateTime) kasWhere.tanggal.gte = startDateTime
      if (endDateTime) kasWhere.tanggal.lte = endDateTime
    }
    if (metode && metode !== 'all') {
      if (metode === 'Transfer' || metode === 'Bank / Transfer') {
        kasWhere.metode = { in: ['Bank / Transfer', 'Transfer', 'Bank'] }
      } else {
        kasWhere.metode = { equals: metode, mode: 'insensitive' }
      }
    }

    const [sppList, tagihanList, kasList, profilSekolah, listTahunAjaran] = await Promise.all([
      shouldFetchSpp
        ? prisma.sppPembayaran.findMany({
            where: sppWhere,
            include: {
              siswa: { select: { id: true, nama: true, nis: true, kelas: { select: { namaKelas: true } } } },
              kelas: { select: { namaKelas: true } },
            },
            orderBy: { tanggalBayar: 'asc' },
          })
        : Promise.resolve([]),
      shouldFetchTagihan
        ? prisma.pembayaranTagihan.findMany({
            where: tagihanWhere,
            include: {
              tagihan: { select: { id: true, judul: true, tahunAjaran: true, jenis: { select: { nama: true } } } },
              siswa: { select: { id: true, nama: true, nis: true, kelas: { select: { namaKelas: true } } } },
            },
            orderBy: { tanggalBayar: 'asc' },
          })
        : Promise.resolve([]),
      shouldFetchKas
        ? prisma.kasTransaksi.findMany({
            where: kasWhere,
            include: {
              kategori: true,
            },
            orderBy: { tanggal: 'asc' },
          })
        : Promise.resolve([]),
      prisma.sekolahProfil.findFirst(),
      prisma.tahunAjaran.findMany({ orderBy: { tanggalMulai: 'desc' } }),
    ])

    // 3. Normalisasi data ke struktur BukuKasItem
    const rawItems: Omit<BukuKasItem, 'saldo'>[] = []

    // Map SPP
    for (const spp of sppList) {
      const nominal = Number(spp.nominalBayar)
      rawItems.push({
        id: `spp-${spp.id}`,
        noTransaksi: spp.noTransaksi,
        tanggal: spp.tanggalBayar.toISOString(),
        sumber: 'SPP',
        sumberBadge: 'spp',
        kategori: `SPP Bulan ${spp.bulan}`,
        uraian: `Iuran SPP Bulan ${spp.bulan} (T.A ${spp.tahunAjaran}) - ${spp.siswa.nama} (${spp.siswa.nis})`,
        pihakTerkait: `${spp.siswa.nama} (${spp.siswa.nis})`,
        kelas: spp.kelas?.namaKelas || spp.siswa.kelas?.namaKelas || '-',
        metode: spp.metodeBayar,
        debit: nominal,
        kredit: 0,
        petugas: spp.petugas || 'Kasir Keuangan',
        refId: spp.id,
      })
    }

    // Map Tagihan Non-SPP
    for (const tag of tagihanList) {
      const nominal = Number(tag.nominalBayar)
      const namaJenis = tag.tagihan?.jenis?.nama || 'Tagihan Non-SPP'
      rawItems.push({
        id: `tag-${tag.id}`,
        noTransaksi: tag.noTransaksi,
        tanggal: tag.tanggalBayar.toISOString(),
        sumber: 'Tagihan Siswa',
        sumberBadge: 'tagihan',
        kategori: namaJenis,
        uraian: `Pembayaran ${tag.tagihan.judul} - ${tag.siswa.nama} (${tag.siswa.nis})`,
        pihakTerkait: `${tag.siswa.nama} (${tag.siswa.nis})`,
        kelas: tag.siswa.kelas?.namaKelas || '-',
        metode: tag.metodeBayar,
        debit: nominal,
        kredit: 0,
        petugas: tag.petugas || 'Kasir Keuangan',
        refId: tag.id,
      })
    }

    // Map Kas Umum
    for (const kas of kasList) {
      const nominal = Number(kas.nominal)
      const isMasuk = kas.jenis === 'pemasukan'
      rawItems.push({
        id: `kas-${kas.id}`,
        noTransaksi: kas.noBukti,
        tanggal: kas.tanggal.toISOString(),
        sumber: isMasuk ? 'Kas Umum (Masuk)' : 'Kas Umum (Keluar)',
        sumberBadge: isMasuk ? 'kas_masuk' : 'kas_keluar',
        kategori: kas.kategori.nama,
        uraian: kas.uraian,
        pihakTerkait: kas.pihakTerkait || (isMasuk ? 'Penyetor / Donatur' : 'Penerima / Vendor'),
        metode: kas.metode,
        debit: isMasuk ? nominal : 0,
        kredit: !isMasuk ? nominal : 0,
        petugas: kas.dicatatOleh || 'Bendahara',
        lampiranUrl: kas.lampiranUrl || undefined,
        refId: kas.id,
      })
    }

    // 4. Filter search teks jika ada
    let filteredItems = rawItems
    if (search) {
      filteredItems = rawItems.filter((item) => {
        return (
          item.noTransaksi.toLowerCase().includes(search) ||
          item.uraian.toLowerCase().includes(search) ||
          item.pihakTerkait.toLowerCase().includes(search) ||
          item.kategori.toLowerCase().includes(search) ||
          (item.kelas && item.kelas.toLowerCase().includes(search)) ||
          item.metode.toLowerCase().includes(search)
        )
      })
    }

    // 5. Urutkan secara kronologis (tanggal ASC, lalu ID ASC)
    filteredItems.sort((a, b) => {
      const dateA = new Date(a.tanggal).getTime()
      const dateB = new Date(b.tanggal).getTime()
      if (dateA !== dateB) return dateA - dateB
      return a.noTransaksi.localeCompare(b.noTransaksi)
    })

    // 6. Hitung Running Balance (Saldo Berjalan)
    let currentBalance = saldoAwal
    const ledgerItems: BukuKasItem[] = filteredItems.map((item) => {
      currentBalance = currentBalance + item.debit - item.kredit
      return {
        ...item,
        saldo: currentBalance,
      }
    })

    // 7. Hitung Agregasi & Ringkasan KPI
    let totalSpp = 0
    let totalTagihan = 0
    let totalKasMasuk = 0
    let totalKredit = 0

    // Breakdown kategori
    const kategoriBreakdown: Record<string, { nama: string; jenis: 'masuk' | 'keluar'; total: number; count: number }> = {}
    // Breakdown metode
    const metodeBreakdown: Record<string, { metode: string; total: number; count: number }> = {}

    for (const item of filteredItems) {
      if (item.sumberBadge === 'spp') totalSpp += item.debit
      else if (item.sumberBadge === 'tagihan') totalTagihan += item.debit
      else if (item.sumberBadge === 'kas_masuk') totalKasMasuk += item.debit
      else if (item.sumberBadge === 'kas_keluar') totalKredit += item.kredit

      // Kategori aggregation
      const katKey = `${item.sumberBadge}_${item.kategori}`
      const nominal = item.debit > 0 ? item.debit : item.kredit
      const jenisKat: 'masuk' | 'keluar' = item.debit > 0 ? 'masuk' : 'keluar'
      if (!kategoriBreakdown[katKey]) {
        kategoriBreakdown[katKey] = { nama: item.kategori, jenis: jenisKat, total: 0, count: 0 }
      }
      kategoriBreakdown[katKey].total += nominal
      kategoriBreakdown[katKey].count += 1

      // Metode aggregation
      const normMetode = item.metode || 'Lainnya'
      if (!metodeBreakdown[normMetode]) {
        metodeBreakdown[normMetode] = { metode: normMetode, total: 0, count: 0 }
      }
      metodeBreakdown[normMetode].total += nominal
      metodeBreakdown[normMetode].count += 1
    }

    const totalDebit = totalSpp + totalTagihan + totalKasMasuk
    const surplusDefisit = totalDebit - totalKredit
    const saldoAkhir = saldoAwal + surplusDefisit

    return apiSuccess({
      data: {
        ringkasan: {
          saldoAwal,
          totalSpp,
          totalTagihan,
          totalKasMasuk,
          totalDebit,
          totalKredit,
          surplusDefisit,
          saldoAkhir,
          totalTransaksi: ledgerItems.length,
        },
        bukuKas: ledgerItems,
        breakdown: {
          kategori: Object.values(kategoriBreakdown).sort((a, b) => b.total - a.total),
          metode: Object.values(metodeBreakdown).sort((a, b) => b.total - a.total),
        },
        profilSekolah: profilSekolah || {
          namaSekolah: 'Sistem Manajemen Sekolah',
          npsn: '-',
          alamat: '-',
          telepon: '-',
          email: '-',
          website: '-',
          logoUrl: null,
        },
        tahunAjaranList: listTahunAjaran.map((ta) => ({
          id: ta.id,
          nama: ta.nama,
          status: ta.isActive ? 'aktif' : 'nonaktif',
        })),
        periode: {
          startDate: startDate || null,
          endDate: endDate || null,
          sumber: sumber || 'all',
          metode: metode || 'all',
          tahunAjaran: tahunAjaran || 'all',
        },
      },
    })
  } catch (error: any) {
    console.error('Error generating laporan arus kas:', error)
    return apiError(error.message || 'Gagal memproses laporan arus kas', 500)
  }
}
