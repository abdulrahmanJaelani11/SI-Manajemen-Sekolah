import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get('jenjangId')
    const tingkatId = searchParams.get('tingkatId')
    const active = searchParams.get('active')

    const where: any = {}
    if (jenjangId) where.jenjangId = parseInt(jenjangId, 10)
    if (tingkatId) where.tingkatId = parseInt(tingkatId, 10)
    if (active !== null && active !== undefined) where.active = active === 'true'

    const kelasList = await prisma.kelas.findMany({
      where,
      orderBy: [
        { jenjang: { urutan: 'asc' } },
        { tingkat: { urutan: 'asc' } },
        { namaKelas: 'asc' },
      ],
      include: {
        jenjang: true,
        tingkat: true,
        jurusan: true,
        _count: {
          select: { siswa: true },
        },
      },
    })

    return apiSuccess({
      message: 'Data rombel kelas berhasil dimuat',
      data: kelasList,
    })
  } catch (error: any) {
    console.error('API Kelas GET Error:', error)
    return apiError('Gagal memuat data rombel kelas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kelas', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      jenjangId,
      tingkatId,
      jurusanId,
      namaKelas,
      waliKelas,
      tahunAjaran,
      kapasitas,
    } = body

    if (!jenjangId || !tingkatId || !namaKelas) {
      return apiError('Jenjang, Tingkat, dan Nama Rombel Kelas wajib diisi', 400)
    }

    const created = await prisma.kelas.create({
      data: {
        jenjangId: parseInt(jenjangId, 10),
        tingkatId: parseInt(tingkatId, 10),
        jurusanId: jurusanId ? parseInt(jurusanId, 10) : null,
        namaKelas: String(namaKelas).trim(),
        waliKelas: waliKelas ? String(waliKelas).trim() : null,
        tahunAjaran: tahunAjaran ? String(tahunAjaran).trim() : '2024/2025',
        kapasitas: kapasitas ? parseInt(kapasitas, 10) : 36,
        active: true,
      },
      include: {
        jenjang: true,
        tingkat: true,
        jurusan: true,
      },
    })

    return apiSuccess({
      message: 'Rombel kelas berhasil ditambahkan',
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Kelas POST Error:', error)
    return apiError('Gagal menambahkan rombel kelas: ' + (error?.message || 'Server error'), 500)
  }
}
