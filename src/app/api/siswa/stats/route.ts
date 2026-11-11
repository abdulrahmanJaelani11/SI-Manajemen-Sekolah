import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET() {
  try {
    const [
      totalSiswa,
      aktifTotal,
      alumniTotal,
      mutasiTotal,
      lakiTotal,
      perempuanTotal,
      jenjangStats,
    ] = await Promise.all([
      prisma.siswa.count(),
      prisma.siswa.count({ where: { status: 'aktif' } }),
      prisma.siswa.count({ where: { status: 'alumni' } }),
      prisma.siswa.count({ where: { status: 'mutasi' } }),
      prisma.siswa.count({ where: { jenisKelamin: 'L', status: 'aktif' } }),
      prisma.siswa.count({ where: { jenisKelamin: 'P', status: 'aktif' } }),
      prisma.refJenjang.findMany({
        where: { active: true },
        select: {
          id: true,
          kode: true,
          nama: true,
          _count: {
            select: {
              siswa: {
                where: { status: 'aktif' },
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
