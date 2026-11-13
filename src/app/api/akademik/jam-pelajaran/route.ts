import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/jadwal', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const slots = await prisma.jamPelajaran.findMany({
      orderBy: [{ urutan: 'asc' }, { jamMulai: 'asc' }],
      include: { jenjang: true },
    })

    return apiSuccess({
      message: 'Slot jam pelajaran berhasil dimuat',
      data: slots,
    })
  } catch (error: any) {
    console.error('API Jam Pelajaran GET Error:', error)
    return apiError('Gagal memuat slot jam pelajaran: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/jadwal', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      urutan,
      namaSlot,
      jamMulai,
      jamSelesai,
      isIstirahat = false,
      jenjangId,
    } = body

    if (!namaSlot || !jamMulai || !jamSelesai) {
      return apiError('Nama slot, jam mulai, dan jam selesai wajib diisi', 400)
    }

    const created = await prisma.jamPelajaran.create({
      data: {
        urutan: Number(urutan) || 1,
        namaSlot: String(namaSlot).trim(),
        jamMulai: String(jamMulai).trim(),
        jamSelesai: String(jamSelesai).trim(),
        isIstirahat: Boolean(isIstirahat),
        jenjangId: jenjangId ? Number(jenjangId) : null,
      },
    })

    return apiSuccess({
      message: 'Slot jam pelajaran berhasil ditambahkan',
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Jam Pelajaran POST Error:', error)
    return apiError('Gagal menambah slot jam pelajaran: ' + (error?.message || 'Server error'), 500)
  }
}

