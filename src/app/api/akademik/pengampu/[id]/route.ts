import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/akademik/mapel', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const targetId = parseInt(id, 10)
    if (isNaN(targetId)) return apiError('ID penugasan tidak valid', 400)

    await prisma.guruMapelKelas.delete({ where: { id: targetId } })

    return apiSuccess({
      message: 'Penugasan guru pengampu berhasil dihapus',
      data: null,
    })
  } catch (error: any) {
    console.error('API Pengampu DELETE Error:', error)
    return apiError('Gagal menghapus penugasan: ' + (error?.message || 'Server error'), 500)
  }
}

