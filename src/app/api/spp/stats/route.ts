import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET() {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [
      totalPenerimaanAgg,
      hariIniAgg,
      totalBulanTerbayar,
      transaksiHariIniCount,
    ] = await Promise.all([
      prisma.sppPembayaran.aggregate({
        _sum: { nominalBayar: true },
        where: { status: 'lunas' },
      }),
      prisma.sppPembayaran.aggregate({
        _sum: { nominalBayar: true },
        where: {
          status: 'lunas',
          tanggalBayar: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.sppPembayaran.count({
        where: { status: 'lunas' },
      }),
      prisma.sppPembayaran.groupBy({
        by: ['noTransaksi'],
        where: {
          status: 'lunas',
          tanggalBayar: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
    ])

    return apiSuccess({
      message: 'Statistik kasir SPP berhasil dimuat',
      data: {
        totalPenerimaan: Number(totalPenerimaanAgg._sum.nominalBayar || 0),
        penerimaanHariIni: Number(hariIniAgg._sum.nominalBayar || 0),
        totalBulanTerbayar,
        totalTransaksiHariIni: transaksiHariIniCount.length,
      },
    })
  } catch (error: any) {
    console.error('API SPP Stats Error:', error)
    return apiError('Gagal memuat statistik kasir SPP: ' + (error?.message || 'Server error'), 500)
  }
}
