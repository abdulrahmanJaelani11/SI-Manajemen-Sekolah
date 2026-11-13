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
      const res = apiError('Sesi siswa belum masuk atau telah berakhir', 401)
      res.cookies.set('siswa_token', '', { path: '/', maxAge: 0 })
      return res
    }

    const decoded = verifyToken<JwtPayloadSiswa>(token)

    if (!decoded || decoded.role !== 'siswa' || !decoded.siswaId) {
      const res = apiError('Sesi tidak valid atau bukan sebagai peserta didik', 403)
      res.cookies.set('siswa_token', '', { path: '/', maxAge: 0 })
      return res
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
      const res = apiError('Data siswa tidak ditemukan', 404)
      res.cookies.set('siswa_token', '', { path: '/', maxAge: 0 })
      return res
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
