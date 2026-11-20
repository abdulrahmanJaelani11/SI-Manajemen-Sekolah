import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get('jenjangId')
    const kelasId = searchParams.get('kelasId')
    const scope = searchParams.get('scope')

    const baseWhere: any = {}
    if (kelasId) baseWhere.kelasId = parseInt(kelasId, 10)
    else if (jenjangId) baseWhere.jenjangId = parseInt(jenjangId, 10)

    if (scope === 'my_students') {
      const auth = await requirePermission(request, '/siswa', 'view')
      if (!auth.errorResponse && auth.user?.guruScope?.isGuru) {
        if (auth.user.guruScope.kelasIds.length > 0) {
          baseWhere.kelasId = { in: auth.user.guruScope.kelasIds }
        } else if (auth.user.guruScope.jenjangIds.length > 0) {
          baseWhere.jenjangId = { in: auth.user.guruScope.jenjangIds }
        }
      }
    }

    const [
      totalSiswa,
      aktifTotal,
      alumniTotal,
      mutasiTotal,
      lakiTotal,
      perempuanTotal,
      jenjangStats,
    ] = await Promise.all([
      prisma.siswa.count({ where: baseWhere }),
      prisma.siswa.count({ where: { ...baseWhere, status: 'aktif' } }),
      prisma.siswa.count({ where: { ...baseWhere, status: 'alumni' } }),
      prisma.siswa.count({ where: { ...baseWhere, status: 'mutasi' } }),
      prisma.siswa.count({ where: { ...baseWhere, jenisKelamin: 'L', status: 'aktif' } }),
      prisma.siswa.count({ where: { ...baseWhere, jenisKelamin: 'P', status: 'aktif' } }),
      prisma.refJenjang.findMany({
        where: { active: true },
        select: {
          id: true,
          kode: true,
          nama: true,
          _count: {
            select: {
              siswa: {
                where: { ...baseWhere, status: 'aktif' },
              },
            },
          },
        },
      }),
    ])

    return apiSuccess({
      message: 'Statistik kesiswaan berhasil dimuat',
      data: {
        totalSiswa,
        aktifTotal,
        alumniTotal,
        mutasiTotal,
        lakiTotal,
        perempuanTotal,
        jenjangBreakdown: jenjangStats.map((j) => ({
          jenjangId: j.id,
          kode: j.kode,
          nama: j.nama,
          totalSiswaAktif: j._count.siswa,
        })),
      },
    })
  } catch (error: any) {
    console.error('API Siswa Stats Error:', error)
    return apiError('Gagal memuat statistik kesiswaan: ' + (error?.message || 'Server error'), 500)
  }
}
