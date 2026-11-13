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

    const siswa = await prisma.siswa.findUnique({
      where: { id: decoded.siswaId },
      include: {
        jenjang: true,
        kelas: true,
      },
    })

    if (!siswa) {
      return apiError('Data siswa tidak ditemukan', 404)
    }

    const activePeriod = await prisma.tahunAjaran.findFirst({
      where: { isActive: true },
    })

    const tahunAjaran = activePeriod?.nama || '2024/2025'
    const semester = activePeriod?.semester || 'Ganjil'

    const jamSlots = await prisma.jamPelajaran.findMany({
      orderBy: [{ urutan: 'asc' }, { jamMulai: 'asc' }],
    })

    let jadwalList: any[] = []
    if (siswa.kelasId) {
      jadwalList = await prisma.jadwalPelajaran.findMany({
        where: {
          kelasId: siswa.kelasId,
          tahunAjaran,
          semester,
        },
        orderBy: [
          { urutanHari: 'asc' },
          { jamPelajaran: { urutan: 'asc' } },
        ],
        include: {
          jamPelajaran: true,
          mapel: true,
          guru: {
            select: { id: true, nama: true, nip: true },
          },
        },
      })
    }

    return apiSuccess({
      message: 'Jadwal pelajaran kelas berhasil dimuat',
      data: {
        tahunAjaran,
        semester,
        kelas: siswa.kelas,
        jenjang: siswa.jenjang,
        jamSlots,
        jadwalList,
      },
    })
  } catch (error: any) {
    console.error('API Portal Siswa Jadwal GET Error:', error)
    return apiError('Gagal memuat jadwal pelajaran: ' + (error?.message || 'Server error'), 500)
  }
}

