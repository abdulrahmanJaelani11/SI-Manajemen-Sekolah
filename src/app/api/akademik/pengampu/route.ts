import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/mapel', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const tahunAjaran = searchParams.get('tahunAjaran')
    const semester = searchParams.get('semester')
    const kelasId = searchParams.get('kelasId')
    const guruId = searchParams.get('guruId')

    const where: any = {}
    if (tahunAjaran) where.tahunAjaran = tahunAjaran
    if (semester) where.semester = semester
    if (kelasId) where.kelasId = parseInt(kelasId, 10)
    if (guruId) where.guruId = parseInt(guruId, 10)

    const items = await prisma.guruMapelKelas.findMany({
      where,
      orderBy: [
        { kelas: { jenjang: { urutan: 'asc' } } },
        { kelas: { namaKelas: 'asc' } },
        { mapel: { nama: 'asc' } },
      ],
      include: {
        kelas: { include: { jenjang: true } },
        mapel: true,
        guru: true,
      },
    })

    return apiSuccess({
      message: 'Data penugasan guru pengampu berhasil dimuat',
      data: items,
    })
  } catch (error: any) {
    console.error('API Pengampu GET Error:', error)
    return apiError('Gagal memuat data pengampu: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/mapel', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      kelasId,
      mapelId,
      guruId,
      tahunAjaran,
      semester = 'Ganjil',
      jamPerMinggu = 2,
    } = body

    if (!kelasId || !mapelId || !guruId || !tahunAjaran) {
      return apiError('Kelas, Mata Pelajaran, Guru Pengampu, dan Tahun Ajaran wajib diisi', 400)
    }

    const upserted = await prisma.guruMapelKelas.upsert({
      where: {
        kelasId_mapelId_tahunAjaran_semester: {
          kelasId: Number(kelasId),
          mapelId: Number(mapelId),
          tahunAjaran: String(tahunAjaran).trim(),
          semester: String(semester),
        },
      },
      update: {
        guruId: Number(guruId),
        jamPerMinggu: Math.max(1, Number(jamPerMinggu) || 2),
      },
      create: {
        kelasId: Number(kelasId),
        mapelId: Number(mapelId),
        guruId: Number(guruId),
        tahunAjaran: String(tahunAjaran).trim(),
        semester: String(semester),
        jamPerMinggu: Math.max(1, Number(jamPerMinggu) || 2),
      },
      include: {
        kelas: { include: { jenjang: true } },
        mapel: true,
        guru: true,
      },
    })

    return apiSuccess({
      message: 'Penugasan guru pengampu berhasil disimpan',
      data: upserted,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Pengampu POST Error:', error)
    return apiError('Gagal menyimpan penugasan pengampu: ' + (error?.message || 'Server error'), 500)
  }
}

