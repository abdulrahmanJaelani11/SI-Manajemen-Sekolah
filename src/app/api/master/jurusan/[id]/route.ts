import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/jurusan', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const jurusanId = parseInt(id, 10)
    if (isNaN(jurusanId)) return apiError('ID tidak valid', 400)

    const body = await request.json()
    const { jenjangId, kodeJurusan, namaJurusan, keterangan, active } = body

    const updated = await prisma.jurusan.update({
      where: { id: jurusanId },
      data: {
        ...(jenjangId ? { jenjangId: parseInt(jenjangId, 10) } : {}),
        ...(kodeJurusan ? { kodeJurusan: String(kodeJurusan).trim().toUpperCase() } : {}),
        ...(namaJurusan ? { namaJurusan: String(namaJurusan).trim() } : {}),
        keterangan: keterangan !== undefined ? (keterangan ? String(keterangan).trim() : null) : undefined,
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    })

    return apiSuccess({
      message: 'Data jurusan berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Jurusan PUT Error:', error)
    return apiError('Gagal memperbarui jurusan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/jurusan', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const jurusanId = parseInt(id, 10)
    if (isNaN(jurusanId)) return apiError('ID tidak valid', 400)

    // Cek relasi kelas dan siswa
    const kelasCount = await prisma.kelas.count({ where: { jurusanId } })
    const siswaCount = await prisma.siswa.count({ where: { jurusanId } })

    if (kelasCount > 0 || siswaCount > 0) {
      return apiError(
        `Jurusan tidak dapat dihapus karena masih digunakan oleh ${kelasCount} rombel dan ${siswaCount} siswa`,
        400
      )
    }

    await prisma.jurusan.delete({
      where: { id: jurusanId },
    })

    return apiSuccess({
      message: 'Jurusan berhasil dihapus',
      data: null,
    })
  } catch (error: any) {
    console.error('API Jurusan DELETE Error:', error)
    return apiError('Gagal menghapus jurusan: ' + (error?.message || 'Server error'), 500)
  }
}
