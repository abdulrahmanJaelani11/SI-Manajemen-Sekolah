import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const kelasId = parseInt(id, 10)
    if (isNaN(kelasId)) return apiError('ID kelas tidak valid', 400)

    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
      include: {
        jenjang: true,
        tingkat: true,
        jurusan: true,
        siswa: {
          orderBy: { nama: 'asc' },
          select: {
            id: true,
            nis: true,
            nisn: true,
            nama: true,
            jenisKelamin: true,
            status: true,
            telpSiswa: true,
            fotoUrl: true,
          },
        },
      },
    })

    if (!kelas) {
      return apiError('Data rombel kelas tidak ditemukan', 404)
    }

    return apiSuccess({
      message: `Daftar siswa di kelas ${kelas.namaKelas} berhasil dimuat`,
      data: kelas,
    })
  } catch (error: any) {
    console.error('API Kelas Siswa Error:', error)
    return apiError('Gagal memuat siswa kelas: ' + (error?.message || 'Server error'), 500)
  }
}
