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
      include: { jenjang: true, kelas: true },
    })
    if (!siswa) {
      return apiError('Data siswa tidak ditemukan', 404)
    }

    const { searchParams } = new URL(request.url)
    const activePeriod = await prisma.tahunAjaran.findFirst({ where: { isActive: true } })
    const tahunAjaran = searchParams.get('tahunAjaran')?.trim() || activePeriod?.nama || '2024/2025'
    const semester = searchParams.get('semester')?.trim() || activePeriod?.semester || 'Ganjil'

    const rapor = await prisma.raporSiswa.findUnique({
      where: {
        siswaId_tahunAjaran_semester: {
          siswaId: siswa.id,
          tahunAjaran,
          semester,
        },
      },
      include: {
        kelas: { include: { jenjang: true } },
      },
    })

    if (!rapor || rapor.status !== 'diterbitkan') {
      return apiSuccess({
        message: 'Rapor belum diterbitkan oleh wali kelas',
        data: {
          published: false,
          tahunAjaran,
          semester,
          rapor: null,
          nilaiList: [],
          summary: { rataRata: 0, jumlahMapel: 0, jumlahTuntas: 0 },
        },
      })
    }

    const nilaiList = await prisma.nilaiSiswa.findMany({
      where: {
        siswaId: siswa.id,
        tahunAjaran,
        semester,
      },
      orderBy: [{ mapel: { kelompok: 'asc' } }, { mapel: { nama: 'asc' } }],
      include: {
        mapel: true,
        guru: { select: { id: true, nama: true } },
      },
    })

    const total = nilaiList.reduce((acc, n) => acc + (n.nilaiAkhir || 0), 0)
    const rataRata = nilaiList.length > 0 ? Math.round((total / nilaiList.length) * 10) / 10 : 0
    const jumlahTuntas = nilaiList.filter((n) => (n.nilaiAkhir || 0) >= (n.mapel?.kkm || 75)).length

    return apiSuccess({
      message: 'E-Rapor semester berhasil dimuat',
      data: {
        published: true,
        tahunAjaran,
        semester,
        rapor,
        nilaiList,
        summary: {
          rataRata,
          jumlahMapel: nilaiList.length,
          jumlahTuntas,
        },
      },
    })
  } catch (error: any) {
    console.error('API Portal Siswa Rapor GET Error:', error)
    return apiError('Gagal memuat E-Rapor siswa: ' + (error?.message || 'Server error'), 500)
  }
}

