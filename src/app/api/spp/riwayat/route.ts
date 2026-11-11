import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const jenjangId = searchParams.get('jenjangId')
    const kelasId = searchParams.get('kelasId')
    const tahunAjaran = searchParams.get('tahunAjaran')
    const bulan = searchParams.get('bulan')
    const status = searchParams.get('status')
    const metodeBayar = searchParams.get('metodeBayar')

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)))
    const skip = (page - 1) * limit

    const where: any = {}

    if (tahunAjaran) where.tahunAjaran = tahunAjaran
    if (bulan) where.bulan = bulan
    if (status) where.status = status
    if (metodeBayar) where.metodeBayar = metodeBayar

    if (kelasId) where.kelasId = parseInt(kelasId, 10)
    if (jenjangId) {
      where.siswa = { jenjangId: parseInt(jenjangId, 10) }
    }

    if (search) {
      where.OR = [
        { noTransaksi: { contains: search, mode: 'insensitive' } },
        { siswa: { nama: { contains: search, mode: 'insensitive' } } },
        { siswa: { nis: { contains: search, mode: 'insensitive' } } },
        { petugas: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [total, items] = await Promise.all([
      prisma.sppPembayaran.count({ where }),
      prisma.sppPembayaran.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ tanggalBayar: 'desc' }, { id: 'desc' }],
        include: {
          siswa: {
            include: {
              jenjang: true,
            },
          },
          kelas: true,
        },
      }),
    ])

    return apiSuccess({
      message: 'Riwayat pembayaran SPP berhasil dimuat',
      data: items.map((item) => ({
        ...item,
        nominalTagihan: Number(item.nominalTagihan),
        diskon: Number(item.diskon),
        nominalBayar: Number(item.nominalBayar),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('API SPP Riwayat Error:', error)
    return apiError('Gagal memuat riwayat pembayaran: ' + (error?.message || 'Server error'), 500)
  }
}
