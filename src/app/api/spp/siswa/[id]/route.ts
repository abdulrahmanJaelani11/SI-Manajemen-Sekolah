import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { BULAN_AKADEMIK } from '@/lib/terbilang'
import { requireAuth } from '@/lib/auth/api-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const siswaId = parseInt(id, 10)
    if (isNaN(siswaId)) return apiError('ID siswa tidak valid', 400)

    const { searchParams } = new URL(request.url)
    const tahunAjaran = searchParams.get('tahunAjaran') || '2024/2025'

    const siswa = await prisma.siswa.findUnique({
      where: { id: siswaId },
      include: {
        jenjang: true,
        kelas: {
          include: {
            tingkat: true,
          },
        },
        jurusan: true,
      },
    })

    if (!siswa) {
      return apiError('Data siswa tidak ditemukan', 404)
    }

    // Cari ketetapan tarif SPP yang berlaku
    let tarifNominal = 150000 // default fallback
    const tingkatId = siswa.kelas?.tingkatId

    // 1. Cek tarif spesifik tingkat
    if (tingkatId) {
      const tarifTingkat = await prisma.sppTarif.findFirst({
        where: {
          jenjangId: siswa.jenjangId,
          tingkatId,
          tahunAjaran,
          active: true,
        },
      })
      if (tarifTingkat) {
        tarifNominal = Number(tarifTingkat.nominal)
      } else {
        // 2. Cek tarif umum jenjang (tingkatId = null)
        const tarifUmum = await prisma.sppTarif.findFirst({
          where: {
            jenjangId: siswa.jenjangId,
            tingkatId: null,
            tahunAjaran,
            active: true,
          },
        })
        if (tarifUmum) {
          tarifNominal = Number(tarifUmum.nominal)
        }
      }
    } else {
      const tarifUmum = await prisma.sppTarif.findFirst({
        where: {
          jenjangId: siswa.jenjangId,
          tahunAjaran,
          active: true,
        },
      })
      if (tarifUmum) tarifNominal = Number(tarifUmum.nominal)
    }

    // Ambil pembayaran siswa pada tahun ajaran ini yang lunas
    const payments = await prisma.sppPembayaran.findMany({
      where: {
        siswaId,
        tahunAjaran,
        status: 'lunas',
      },
      orderBy: { urutanBulan: 'asc' },
    })

    const paymentMap = new Map<number, any>()
    for (const p of payments) {
      paymentMap.set(p.urutanBulan, p)
    }

    // Susun grid 12 bulan (Juli s.d. Juni)
    const monthsStatus = BULAN_AKADEMIK.map((item) => {
      const paid = paymentMap.get(item.urutan)
      if (paid) {
        return {
          urutan: item.urutan,
          bulan: item.nama,
          status: 'paid',
          noTransaksi: paid.noTransaksi,
          nominalTagihan: Number(paid.nominalTagihan),
          diskon: Number(paid.diskon),
          nominalBayar: Number(paid.nominalBayar),
          tanggalBayar: paid.tanggalBayar,
          metodeBayar: paid.metodeBayar,
          petugas: paid.petugas,
        }
      }

      return {
        urutan: item.urutan,
        bulan: item.nama,
        status: 'unpaid',
        noTransaksi: null,
        nominalTagihan: tarifNominal,
        diskon: 0,
        nominalBayar: 0,
        tanggalBayar: null,
        metodeBayar: null,
        petugas: null,
      }
    })

    const totalTerbayar = monthsStatus.filter((m) => m.status === 'paid').length
    const totalTunggakanBulan = 12 - totalTerbayar
    const totalEstimasiTunggakan = totalTunggakanBulan * tarifNominal
    const totalNominalTerbayar = payments.reduce((acc, p) => acc + Number(p.nominalBayar), 0)

    // Riwayat transaksi per kuitansi
    const txMap = new Map<string, any>()
    for (const p of payments) {
      if (!txMap.has(p.noTransaksi)) {
        txMap.set(p.noTransaksi, {
          noTransaksi: p.noTransaksi,
          tanggalBayar: p.tanggalBayar,
          metodeBayar: p.metodeBayar,
          petugas: p.petugas,
          keterangan: p.keterangan,
          totalNominal: 0,
          totalDiskon: 0,
          bulanItems: [],
        })
      }
      const tx = txMap.get(p.noTransaksi)
      tx.bulanItems.push({
        bulan: p.bulan,
        urutanBulan: p.urutanBulan,
        nominalTagihan: Number(p.nominalTagihan),
        diskon: Number(p.diskon),
        nominalBayar: Number(p.nominalBayar),
      })
      tx.totalNominal += Number(p.nominalBayar)
      tx.totalDiskon += Number(p.diskon)
    }

    const riwayatTransaksi = Array.from(txMap.values()).sort(
      (a, b) => new Date(b.tanggalBayar).getTime() - new Date(a.tanggalBayar).getTime()
    )

    // Daftar Tahun Ajaran yang tersedia
    const [tarifYears, paymentYears] = await Promise.all([
      prisma.sppTarif.findMany({
        where: { jenjangId: siswa.jenjangId },
        select: { tahunAjaran: true },
        distinct: ['tahunAjaran'],
      }),
      prisma.sppPembayaran.findMany({
        where: { siswaId },
        select: { tahunAjaran: true },
        distinct: ['tahunAjaran'],
      }),
    ])

    const listTahunAjaran = Array.from(
      new Set([
        '2024/2025',
        '2023/2024',
        ...tarifYears.map((t) => t.tahunAjaran),
        ...paymentYears.map((p) => p.tahunAjaran),
      ])
    ).sort().reverse()

    return apiSuccess({
      message: 'Status 12 bulan SPP siswa berhasil dimuat',
      data: {
        siswa,
        tahunAjaran,
        tarifNominal,
        months: monthsStatus,
        riwayatTransaksi,
        listTahunAjaran,
        summary: {
          totalBulanTerbayar: totalTerbayar,
          totalBulanTunggakan: totalTunggakanBulan,
          totalNominalTerbayar,
          totalEstimasiTunggakan,
        },
      },
    })
  } catch (error: any) {
    console.error('API Siswa SPP Status Error:', error)
    return apiError('Gagal memuat status SPP siswa: ' + (error?.message || 'Server error'), 500)
  }
}
