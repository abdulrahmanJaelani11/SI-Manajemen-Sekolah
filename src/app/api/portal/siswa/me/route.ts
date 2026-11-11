import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'MAARIF_SUPER_SECRET_KEY_2024_2025'

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
      return apiError('Sesi siswa belum masuk atau telah berakhir', 401)
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch {
      return apiError('Token sesi tidak valid atau kadaluwarsa', 401)
    }

    if (!decoded || decoded.role !== 'siswa' || !decoded.siswaId) {
      return apiError('Sesi bukan sebagai peserta didik', 403)
    }

    const siswa = await prisma.siswa.findUnique({
      where: { id: decoded.siswaId },
      include: {
        jenjang: true,
        kelas: {
          include: {
            tingkat: true,
          },
        },
        jurusan: true,
      },
    })

    if (!siswa) {
      return apiError('Data siswa tidak ditemukan', 404)
    }

    return apiSuccess({
      message: 'Data siswa berhasil dimuat',
      data: siswa,
    })
  } catch (error: any) {
    console.error('API Siswa Me Error:', error)
    return apiError('Gagal memuat profil siswa: ' + (error?.message || 'Server error'), 500)
  }
}
