import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import storage from '@/lib/storage'
import { requirePermission } from '@/lib/auth/api-guard'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/siswa', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const siswaId = parseInt(id, 10)
    if (isNaN(siswaId)) return apiError('ID siswa tidak valid', 400)

    const existing = await prisma.siswa.findUnique({
      where: { id: siswaId },
    })

    if (!existing) return apiError('Data siswa tidak ditemukan', 404)

    if (existing.fotoUrl) {
      await storage.delete(existing.fotoUrl)
    }

    const updated = await prisma.siswa.update({
      where: { id: siswaId },
      data: {
        fotoUrl: null,
      },
    })

    return apiSuccess({
      message: 'Foto profil siswa berhasil dihapus',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Siswa Foto DELETE Error:', error)
    return apiError('Gagal menghapus foto siswa: ' + (error?.message || 'Server error'), 500)
  }
}
