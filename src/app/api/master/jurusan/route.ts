import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get('jenjangId')

    const where: any = {}
    if (jenjangId) {
      where.jenjangId = parseInt(jenjangId, 10)
    }

    const jurusan = await prisma.jurusan.findMany({
      where,
      orderBy: { kodeJurusan: 'asc' },
      include: {
        jenjang: true,
        _count: {
          select: { kelas: true, siswa: true },
        },
      },
    })

    return apiSuccess({
      message: 'Data jurusan berhasil dimuat',
      data: jurusan,
    })
  } catch (error: any) {
    console.error('API Jurusan GET Error:', error)
    return apiError('Gagal memuat data jurusan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jenjangId, kodeJurusan, namaJurusan, keterangan } = body

    if (!jenjangId || !kodeJurusan || !namaJurusan) {
      return apiError('Jenjang, Kode Jurusan, dan Nama Jurusan wajib diisi', 400)
    }

    const created = await prisma.jurusan.create({
      data: {
        jenjangId: parseInt(jenjangId, 10),
        kodeJurusan: String(kodeJurusan).trim().toUpperCase(),
        namaJurusan: String(namaJurusan).trim(),
        keterangan: keterangan ? String(keterangan).trim() : null,
        active: true,
      },
      include: {
        jenjang: true,
      },
    })

    return apiSuccess({
      message: 'Jurusan baru berhasil ditambahkan',
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Jurusan POST Error:', error)
    return apiError('Gagal menyimpan data jurusan: ' + (error?.message || 'Server error'), 500)
  }
}
