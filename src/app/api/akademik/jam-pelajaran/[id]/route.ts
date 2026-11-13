import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/akademik/jadwal', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const targetId = parseInt(id, 10)
    if (isNaN(targetId)) return apiError('ID slot tidak valid', 400)

    const body = await request.json()
    const { urutan, namaSlot, jamMulai, jamSelesai, isIstirahat, jenjangId } = body

    const updated = await prisma.jamPelajaran.update({
      where: { id: targetId },
      data: {
        urutan: urutan !== undefined ? Number(urutan) : undefined,
        namaSlot: namaSlot ? String(namaSlot).trim() : undefined,
        jamMulai: jamMulai ? String(jamMulai).trim() : undefined,
        jamSelesai: jamSelesai ? String(jamSelesai).trim() : undefined,
        isIstirahat: isIstirahat !== undefined ? Boolean(isIstirahat) : undefined,
        jenjangId: jenjangId !== undefined ? (jenjangId ? Number(jenjangId) : null) : undefined,
      },
    })

    return apiSuccess({
      message: 'Slot jam pelajaran berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Jam Pelajaran PUT Error:', error)
    return apiError('Gagal memperbarui slot jam: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/akademik/jadwal', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const targetId = parseInt(id, 10)
    if (isNaN(targetId)) return apiError('ID slot tidak valid', 400)

    await prisma.jamPelajaran.delete({ where: { id: targetId } })

    return apiSuccess({
      message: 'Slot jam pelajaran berhasil dihapus',
      data: null,
    })
  } catch (error: any) {
    console.error('API Jam Pelajaran DELETE Error:', error)
    return apiError('Gagal menghapus slot jam: ' + (error?.message || 'Server error'), 500)
  }
}

