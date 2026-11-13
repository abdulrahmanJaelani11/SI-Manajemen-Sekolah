import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

// GET /api/portal/kalender
// Endpoint publik tanpa login untuk menampilkan agenda kegiatan sekolah & kalender akademik
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bulan = searchParams.get('bulan')
    const tahun = searchParams.get('tahun')
    const kategori = searchParams.get('kategori')

    const where: any = { isPublic: true }

    if (kategori && kategori !== 'all') {
      where.kategori = kategori
    }

    if (bulan && tahun) {
      const m = Number(bulan)
      const y = Number(tahun)
      const startOfMonth = new Date(Date.UTC(y, m - 1, 1))
      const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59))

      where.OR = [
        {
          tanggalMulai: { lte: endOfMonth },
          tanggalSelesai: { gte: startOfMonth },
        },
      ]
    }

    const events = await prisma.akademikKalender.findMany({
      where,
      orderBy: [{ tanggalMulai: 'asc' }],
    })

    return apiSuccess({
      data: events,
    })
  } catch (error: any) {
    console.error('Error fetching public kalender:', error)
    return apiError('Gagal memuat agenda kalender sekolah', 500)
  }
}

