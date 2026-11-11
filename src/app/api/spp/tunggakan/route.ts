import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { BULAN_AKADEMIK } from '@/lib/terbilang'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get('jenjangId')
    const kelasId = searchParams.get('kelasId')
    const tahunAjaran = searchParams.get('tahunAjaran') || '2024/2025'
    const search = searchParams.get('search')?.trim() || ''

    const whereSiswa: any = { status: 'aktif' }
    if (jenjangId) whereSiswa.jenjangId = parseInt(jenjangId, 10)
    if (kelasId) whereSiswa.kelasId = parseInt(kelasId, 10)
    if (search) {
      whereSiswa.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { nis: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Ambil seluruh siswa aktif yang cocok
    const siswaList = await prisma.siswa.findMany({
      where: whereSiswa,
      include: {
        jenjang: true,
        kelas: {
          include: {
            tingkat: true,
          },
        },
        jurusan: true,
      },
      orderBy: [{ jenjang: { urutan: 'asc' } }, { nama: 'asc' }],
    })

    if (siswaList.length === 0) {
      return apiSuccess({
        message: 'Tidak ada data kesiswaan',
        data: {
          items: [],
          summary: {
            totalSiswaNunggak: 0,
            totalBulanNunggak: 0,
            totalEstimasiPiutang: 0,
          },
        },
      })
    }

    const siswaIds = siswaList.map((s) => s.id)

    // Ambil seluruh pembayaran lunas untuk siswa-siswa tersebut
    const payments = await prisma.sppPembayaran.findMany({
      where: {
        siswaId: { in: siswaIds },
        tahunAjaran,
        status: 'lunas',
      },
      select: {
        siswaId: true,
        urutanBulan: true,
        bulan: true,
      },
    })

    // Petakan pembayaran per siswaId -> Set of paid urutanBulan
    const paidMap = new Map<number, Set<number>>()
    for (const p of payments) {
      if (!paidMap.has(p.siswaId)) {
        paidMap.set(p.siswaId, new Set())
      }
      paidMap.get(p.siswaId)!.add(p.urutanBulan)
    }

    // Ambil master tarif untuk estimasi
    const allTarif = await prisma.sppTarif.findMany({
      where: { tahunAjaran, active: true },
    })

    // Hitung tunggakan tiap siswa
    const tunggakanList: any[] = []
    let grandTotalPiutang = 0
    let grandTotalBulanNunggak = 0

    for (const s of siswaList) {
      const studentPaidSet = paidMap.get(s.id) || new Set()

      // Cari tarif siswa
      let tarifNominal = 150000
      const tingkatId = s.kelas?.tingkatId
      const matchedTarif =
        allTarif.find((t) => t.jenjangId === s.jenjangId && t.tingkatId === tingkatId) ||
        allTarif.find((t) => t.jenjangId === s.jenjangId && !t.tingkatId)

      if (matchedTarif) {
        tarifNominal = Number(matchedTarif.nominal)
      }

      // Cari bulan-bulan yang belum dibayar
      const unpaidMonths = BULAN_AKADEMIK.filter((m) => !studentPaidSet.has(m.urutan))

      if (unpaidMonths.length > 0) {
        const nominalTunggakan = unpaidMonths.length * tarifNominal
        grandTotalPiutang += nominalTunggakan
        grandTotalBulanNunggak += unpaidMonths.length

        tunggakanList.push({
          siswaId: s.id,
          nis: s.nis,
          nama: s.nama,
          jenjang: s.jenjang?.kode,
          kelas: s.kelas?.namaKelas || 'Belum Masuk Kelas',
          jurusan: s.jurusan?.kodeJurusan,
          namaWali: s.namaWali,
          telpWali: s.telpWali,
          tarifNominal,
          jumlahBulanNunggak: unpaidMonths.length,
          bulanNunggakList: unpaidMonths.map((m) => m.nama),
          totalTunggakanNominal: nominalTunggakan,
        })
      }
    }

    // Urutkan dari tunggakan terbanyak
    tunggakanList.sort((a, b) => b.totalTunggakanNominal - a.totalTunggakanNominal)

    return apiSuccess({
      message: 'Rekapitulasi tunggakan SPP berhasil dimuat',
      data: {
        items: tunggakanList,
        summary: {
          totalSiswaNunggak: tunggakanList.length,
          totalBulanNunggak: grandTotalBulanNunggak,
          totalEstimasiPiutang: grandTotalPiutang,
        },
      },
    })
  } catch (error: any) {
    console.error('API SPP Tunggakan Error:', error)
    return apiError('Gagal memuat rekapitulasi tunggakan: ' + (error?.message || 'Server error'), 500)
  }
}
