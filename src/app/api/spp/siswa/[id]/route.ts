import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { BULAN_AKADEMIK } from '@/lib/terbilang'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    return apiSuccess({
      message: 'Status 12 bulan SPP siswa berhasil dimuat',
      data: {
        siswa,
        tahunAjaran,
        tarifNominal,
        months: monthsStatus,
        summary: {
          totalBulanTerbayar: totalTerbayar,
          totalBulanTunggakan: totalTunggakanBulan,
          totalEstimasiTunggakan,
        },
      },
    })
  } catch (error: any) {
    console.error('API Siswa SPP Status Error:', error)
    return apiError('Gagal memuat status SPP siswa: ' + (error?.message || 'Server error'), 500)
  }
}
