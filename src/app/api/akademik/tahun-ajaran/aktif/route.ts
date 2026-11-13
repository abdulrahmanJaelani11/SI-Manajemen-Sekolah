import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET() {
  try {
    const [activePeriod, allPeriods] = await Promise.all([
      prisma.tahunAjaran.findFirst({
        where: { isActive: true },
        orderBy: { id: 'desc' },
      }),
      prisma.tahunAjaran.findMany({
        orderBy: [{ nama: 'desc' }, { semester: 'asc' }],
      }),
    ])

    const distinctYears = Array.from(
      new Set(allPeriods.map((p) => p.nama))
    )

    if (distinctYears.length === 0) {
      distinctYears.push('2024/2025')
    }

    return apiSuccess({
      message: 'Periode aktif berhasil dimuat',
      data: {
        activePeriod: activePeriod || {
          id: 0,
          nama: distinctYears[0],
          semester: 'Ganjil',
          isActive: true,
        },
        tahunList: distinctYears,
        periods: allPeriods,
      },
    })
  } catch (error: any) {
    console.error('API Tahun Ajaran Aktif GET Error:', error)
    return apiError('Gagal memuat tahun ajaran aktif: ' + (error?.message || 'Server error'), 500)
  }
}

