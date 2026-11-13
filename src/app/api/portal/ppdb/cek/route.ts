import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getClientIp, checkRateLimit } from '@/lib/auth/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateCheck = checkRateLimit(`ppdb_cek_${ip}`, 25, 15 * 60 * 1000)
    if (!rateCheck.allowed) {
      return apiError(
        `Terlalu banyak percobaan pengecekan. Silakan coba lagi dalam ${rateCheck.resetInSeconds} detik.`,
        429
      )
    }

    const body = await request.json()
    const { noPendaftaran, tanggalLahir } = body

    if (!noPendaftaran?.trim() || !tanggalLahir?.trim()) {
      return apiError('Nomor Pendaftaran dan Tanggal Lahir wajib diisi.', 400)
    }

    const cleanNo = String(noPendaftaran).trim().toUpperCase()
    const applicant = await prisma.ppdbPendaftar.findUnique({
      where: { noPendaftaran: cleanNo },
      include: {
        gelombang: true,
        jenjang: true,
        jurusan: true,
        siswa: {
          include: {
            kelas: true,
          },
        },
      },
    })

    if (!applicant) {
      return apiError(
        `Data pendaftar dengan nomor "${cleanNo}" tidak ditemukan.`,
        404
      )
    }

    // Verifikasi kecocokan tanggal lahir (YYYY-MM-DD)
    const expectedDate = new Date(applicant.tanggalLahir).toISOString().slice(0, 10)
    const inputDate = new Date(tanggalLahir)
    if (Number.isNaN(inputDate.getTime())) {
      return apiError('Format tanggal lahir tidak valid.', 400)
    }
    const formattedInput = inputDate.toISOString().slice(0, 10)

    if (expectedDate !== formattedInput) {
      return apiError('Tanggal lahir tidak sesuai dengan data pendaftaran.', 401)
    }

    return apiSuccess({
      message: 'Status pendaftaran PPDB ditemukan',
      data: applicant,
    })
  } catch (error: any) {
    console.error('API Portal PPDB Cek Error:', error)
    return apiError('Gagal memeriksa status PPDB: ' + (error?.message || 'Server error'), 500)
  }
}

