import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/akademik/jadwal', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const targetId = parseInt(id, 10)
    if (isNaN(targetId)) return apiError('ID jadwal tidak valid', 400)

    await prisma.jadwalPelajaran.delete({ where: { id: targetId } })

    return apiSuccess({
      message: 'Slot jadwal pelajaran berhasil dikosongkan',
      data: null,
    })
  } catch (error: any) {
    console.error('API Jadwal DELETE Error:', error)
    return apiError('Gagal menghapus jadwal: ' + (error?.message || 'Server error'), 500)
  }
}

