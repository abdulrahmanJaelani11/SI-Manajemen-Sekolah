import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { BULAN_AKADEMIK } from '@/lib/terbilang'

export async function GET() {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [
      totalSiswaAktif,
      totalPegawai,
      totalKelas,
      totalJurusan,
      totalPenerimaanAgg,
      hariIniAgg,
      transaksiHariIniGroup,
      jenjangList,
      recentTransactions,
      allActiveSiswa,
      allPayments,
      allTarif,
      sekolahProfil,
    ] = await Promise.all([
      prisma.siswa.count({ where: { status: 'aktif' } }),
      prisma.pegawai.count({ where: { active: true } }),
      prisma.kelas.count({ where: { active: true } }),
      prisma.jurusan.count({ where: { active: true } }),
      prisma.sppPembayaran.aggregate({
        _sum: { nominalBayar: true },
        where: { status: 'lunas' },
      }),
      prisma.sppPembayaran.aggregate({
        _sum: { nominalBayar: true },
        where: {
          status: 'lunas',
          tanggalBayar: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.sppPembayaran.groupBy({
        by: ['noTransaksi'],
        where: {
          status: 'lunas',
          tanggalBayar: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.refJenjang.findMany({
        where: { active: true },
        orderBy: { urutan: 'asc' },
        select: {
          id: true,
          kode: true,
          nama: true,
          _count: {
            select: { siswa: { where: { status: 'aktif' } } },
          },
        },
      }),
      prisma.sppPembayaran.findMany({
        where: { status: 'lunas' },
        take: 5,
        orderBy: { tanggalBayar: 'desc' },
        include: {
          siswa: true,
          kelas: true,
        },
      }),
      prisma.siswa.findMany({
        where: { status: 'aktif' },
        select: { id: true, jenjangId: true, kelasId: true, kelas: { select: { tingkatId: true } } },
      }),
      prisma.sppPembayaran.findMany({
        where: { status: 'lunas', tahunAjaran: '2024/2025' },
        select: { siswaId: true, urutanBulan: true },
      }),
      prisma.sppTarif.findMany({
        where: { active: true, tahunAjaran: '2024/2025' },
      }),
      prisma.sekolahProfil.findFirst(),
    ])

    // Hitung estimasi tunggakan
    const paidMap = new Map<number, Set<number>>()
    for (const p of allPayments) {
      if (!paidMap.has(p.siswaId)) paidMap.set(p.siswaId, new Set())
      paidMap.get(p.siswaId)!.add(p.urutanBulan)
    }

    let estimasiTunggakan = 0
    let totalSiswaNunggak = 0

    for (const s of allActiveSiswa) {
      const studentPaidSet = paidMap.get(s.id) || new Set()
      const unpaidCount = BULAN_AKADEMIK.filter((m) => !studentPaidSet.has(m.urutan)).length

      if (unpaidCount > 0) {
        totalSiswaNunggak++
        const tingkatId = s.kelas?.tingkatId
        const tarifObj =
          allTarif.find((t) => t.jenjangId === s.jenjangId && t.tingkatId === tingkatId) ||
          allTarif.find((t) => t.jenjangId === s.jenjangId && !t.tingkatId)
        const tarifNominal = tarifObj ? Number(tarifObj.nominal) : 150000
        estimasiTunggakan += unpaidCount * tarifNominal
      }
    }

    // Hitung tren penerimaan kas SPP per bulan akademik (Juli s.d. Juni)
    const bulananAgg = await prisma.sppPembayaran.groupBy({
      by: ['urutanBulan'],
      where: { status: 'lunas', tahunAjaran: '2024/2025' },
      _sum: { nominalBayar: true },
    })

    const bulananMap = new Map<number, number>()
    for (const b of bulananAgg) {
      bulananMap.set(b.urutanBulan, Number(b._sum.nominalBayar || 0))
    }

    const trenPenerimaanBulanan = BULAN_AKADEMIK.map((m) => ({
      urutan: m.urutan,
      bulan: m.nama,
      nominal: bulananMap.get(m.urutan) || 0,
    }))

    // Breakdown metode pembayaran
    const metodeAgg = await prisma.sppPembayaran.groupBy({
      by: ['metodeBayar'],
      where: { status: 'lunas' },
      _sum: { nominalBayar: true },
    })

    const metodeBreakdown = metodeAgg.map((m) => ({
      metode: m.metodeBayar || 'TUNAI',
      total: Number(m._sum.nominalBayar || 0),
    }))

    return apiSuccess({
      message: 'Statistik dashboard berhasil dimuat',
      data: {
        sekolah: sekolahProfil,
        akademik: {
          totalSiswaAktif,
          totalPegawai,
          totalKelas,
          totalJurusan,
          jenjangBreakdown: jenjangList.map((j) => ({
            id: j.id,
            kode: j.kode,
            nama: j.nama,
            totalSiswa: j._count.siswa,
          })),
        },
        finansial: {
          totalPenerimaan: Number(totalPenerimaanAgg._sum.nominalBayar || 0),
          penerimaanHariIni: Number(hariIniAgg._sum.nominalBayar || 0),
          transaksiHariIni: transaksiHariIniGroup.length,
          estimasiTunggakan,
          totalSiswaNunggak,
          trenPenerimaanBulanan,
          metodeBreakdown,
        },
        recentTransactions: recentTransactions.map((tx) => ({
          id: tx.id,
          noTransaksi: tx.noTransaksi,
          namaSiswa: tx.siswa.nama,
          nis: tx.siswa.nis,
          kelas: tx.kelas?.namaKelas || '-',
          bulan: tx.bulan,
          nominalBayar: Number(tx.nominalBayar),
          metodeBayar: tx.metodeBayar,
          tanggalBayar: tx.tanggalBayar,
          petugas: tx.petugas,
        })),
      },
    })
  } catch (error: any) {
    console.error('API Dashboard Stats Error:', error)
    return apiError('Gagal memuat statistik dashboard: ' + (error?.message || 'Server error'), 500)
  }
}
