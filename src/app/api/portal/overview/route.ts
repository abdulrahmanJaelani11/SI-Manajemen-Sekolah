import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET() {
  try {
    const [
      profil,
      carousels,
      keunggulan,
      berita,
      fasilitas,
      kegiatan,
      totalSiswa,
      totalPegawai,
      totalKelas,
      totalFasilitas,
    ] = await Promise.all([
      prisma.sekolahProfil.findFirst(),
      prisma.carousel.findMany({
        where: { active: true },
        orderBy: { urutan: 'asc' },
      }),
      prisma.keunggulan.findMany({
        where: { active: true },
        orderBy: { urutan: 'asc' },
      }),
      prisma.berita.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.fasilitas.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.kegiatan.findMany({
        orderBy: { tanggal: 'desc' },
        take: 3,
      }),
      prisma.siswa.count({
        where: { status: 'aktif' },
      }),
      prisma.pegawai.count({
        where: { active: true },
      }),
      prisma.kelas.count({
        where: { active: true },
      }),
      prisma.fasilitas.count(),
    ])

    return apiSuccess({
      message: 'Data portal publik berhasil dimuat',
      data: {
        profil: profil || {
          namaSekolah: 'Sistem Informasi Manajemen Sekolah',
          npsn: '10203040',
          bentukPendidikan: 'Multi-Jenjang',
          warnaPrimary: '#5d87ff',
          warnaPrimaryDark: '#4570ea',
          warnaAccent: '#13deb9',
        },
        carousels,
        keunggulan,
        berita,
        fasilitas,
        kegiatan,
        stats: {
          totalSiswa,
          totalPegawai,
          totalKelas,
          totalFasilitas,
        },
      },
    })
  } catch (error: any) {
    console.error('API Portal Overview GET Error:', error)
    return apiError('Gagal memuat konten portal publik: ' + (error?.message || 'Server error'), 500)
  }
}
