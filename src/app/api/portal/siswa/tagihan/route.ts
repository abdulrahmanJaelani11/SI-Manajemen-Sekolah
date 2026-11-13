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

    const tagihanRaw = await prisma.tagihanSiswa.findMany({
      where: {
        siswaId: decoded.siswaId,
        status: { not: 'batal' },
      },
      include: {
        jenis: true,
        pembayaran: {
          where: { status: 'sah' },
          orderBy: [{ tanggalBayar: 'desc' }, { id: 'desc' }],
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    })

    let totalWajibBayar = 0
    let totalTerbayar = 0
    let totalSisa = 0

    const tagihanList = tagihanRaw.map((t) => {
      const nominalTagihan = Number(t.nominalTagihan)
      const diskon = Number(t.diskon)
      const wajibBayar = Math.max(0, nominalTagihan - diskon)
      const terbayar = Number(t.totalTerbayar)
      const sisaTagihan = Math.max(0, wajibBayar - terbayar)

      totalWajibBayar += wajibBayar
      totalTerbayar += terbayar
      totalSisa += sisaTagihan

      return {
        ...t,
        nominalTagihan,
        diskon,
        totalTerbayar: terbayar,
        wajibBayar,
        sisaTagihan,
        pembayaran: t.pembayaran.map((p) => ({
          ...p,
          nominalBayar: Number(p.nominalBayar),
        })),
      }
    })

    return apiSuccess({
      message: 'Data tagihan Non-SPP siswa berhasil dimuat',
      data: {
        tagihanList,
        summary: {
          totalTagihan: tagihanList.length,
          totalWajibBayar,
          totalTerbayar,
          totalSisa,
        },
      },
    })
  } catch (error: any) {
    console.error('API Portal Siswa Tagihan GET Error:', error)
    return apiError('Gagal memuat tagihan Non-SPP: ' + (error?.message || 'Server error'), 500)
  }
}

