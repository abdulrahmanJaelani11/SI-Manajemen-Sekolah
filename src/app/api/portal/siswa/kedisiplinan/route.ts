import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { verifyToken, JwtPayloadSiswa } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    let token: string | null = null
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    if (!token) {
      token = request.cookies.get('siswa_token')?.value || null
    }

    if (!token) {
      return apiError('Sesi siswa belum terotentikasi', 401)
    }

    const decoded = verifyToken<JwtPayloadSiswa>(token)
    if (!decoded || decoded.role !== 'siswa' || !decoded.siswaId) {
      return apiError('Token tidak valid atau bukan sesi siswa', 401)
    }

    const logs = await prisma.kedisiplinanSiswa.findMany({
      where: { siswaId: decoded.siswaId },
      include: { kategori: true },
      orderBy: [{ tanggal: 'desc' }, { id: 'desc' }],
    })

    const totalPoinPelanggaran = logs
      .filter((l) => l.jenis === 'pelanggaran')
      .reduce((sum, l) => sum + l.poin, 0)
    const totalPoinPrestasi = logs
      .filter((l) => l.jenis === 'prestasi')
      .reduce((sum, l) => sum + l.poin, 0)

    return apiSuccess({
      message: 'Riwayat kedisiplinan siswa berhasil dimuat',
      data: {
        logs,
        summary: {
          totalPelanggaranCount: logs.filter((l) => l.jenis === 'pelanggaran').length,
          totalPrestasiCount: logs.filter((l) => l.jenis === 'prestasi').length,
          totalPoinPelanggaran,
          totalPoinPrestasi,
          skorNet: totalPoinPrestasi - totalPoinPelanggaran,
          perluPerhatianBk: totalPoinPelanggaran >= 50,
        },
      },
    })
  } catch (error: any) {
    console.error('API Portal Siswa Kedisiplinan GET Error:', error)
    return apiError('Gagal memuat riwayat kedisiplinan: ' + (error?.message || 'Server error'), 500)
  }
}

