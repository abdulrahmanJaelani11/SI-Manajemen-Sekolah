import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET() {
  try {
    const jenjang = await prisma.refJenjang.findMany({
      where: { active: true },
      orderBy: { urutan: 'asc' },
      include: {
        tingkat: {
          orderBy: { urutan: 'asc' },
        },
        jurusan: {
          where: { active: true },
          orderBy: { kodeJurusan: 'asc' },
        },
      },
    })

    return apiSuccess({
      message: 'Data master jenjang berhasil diambil',
      data: jenjang,
    })
  } catch (error: any) {
    console.error('API Master Jenjang Error:', error)
    return apiError('Gagal memuat data jenjang: ' + (error?.message || 'Server error'), 500)
  }
}
