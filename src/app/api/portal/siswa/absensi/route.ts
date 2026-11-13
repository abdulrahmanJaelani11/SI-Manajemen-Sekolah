import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { verifyToken, JwtPayloadSiswa } from '@/lib/auth/jwt'
import { getWibNow } from '@/lib/absensi/date-utils'

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

    const { searchParams } = new URL(request.url)
    const { dateStr } = getWibNow()
    const bulanStr = searchParams.get('bulan') || dateStr.slice(0, 7)

    const [yr, mo] = bulanStr.split('-').map((x) => parseInt(x, 10))
    const startDate = new Date(Date.UTC(yr, mo - 1, 1))
    const endDate = new Date(Date.UTC(yr, mo, 0))

    const logs = await prisma.presensiSiswa.findMany({
      where: {
        siswaId: decoded.siswaId,
        tanggal: { gte: startDate, lte: endDate },
      },
      orderBy: { tanggal: 'desc' },
    })

    const hadir = logs.filter((l) => l.status === 'hadir').length
    const terlambat = logs.filter((l) => l.status === 'terlambat').length
    const sakit = logs.filter((l) => l.status === 'sakit').length
    const izin = logs.filter((l) => l.status === 'izin').length
    const alpa = logs.filter((l) => l.status === 'alpa').length
    const totalMasuk = hadir + terlambat
    const totalLogs = logs.length
    const persenHadir = totalLogs > 0 ? Math.round((totalMasuk / totalLogs) * 100) : 0

    return apiSuccess({
      message: 'Riwayat presensi siswa berhasil dimuat',
      data: {
        bulan: bulanStr,
        logs,
        summary: {
          hadir,
          terlambat,
          sakit,
          izin,
          alpa,
          totalMasuk,
          totalLogs,
          persenHadir,
        },
      },
    })
  } catch (error: any) {
    console.error('API Portal Siswa Absensi GET Error:', error)
    return apiError('Gagal memuat riwayat presensi: ' + (error?.message || 'Server error'), 500)
  }
}

