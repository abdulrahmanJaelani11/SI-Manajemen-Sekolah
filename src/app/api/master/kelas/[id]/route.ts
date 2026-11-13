import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/kelas', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const kelasId = parseInt(id, 10)
    if (isNaN(kelasId)) return apiError('ID kelas tidak valid', 400)

    const body = await request.json()
    const {
      jenjangId,
      tingkatId,
      jurusanId,
      namaKelas,
      waliKelas,
      tahunAjaran,
      kapasitas,
      active,
    } = body

    const updated = await prisma.kelas.update({
      where: { id: kelasId },
      data: {
        ...(jenjangId ? { jenjangId: parseInt(jenjangId, 10) } : {}),
        ...(tingkatId ? { tingkatId: parseInt(tingkatId, 10) } : {}),
        jurusanId: jurusanId !== undefined ? (jurusanId ? parseInt(jurusanId, 10) : null) : undefined,
        ...(namaKelas ? { namaKelas: String(namaKelas).trim() } : {}),
        waliKelas: waliKelas !== undefined ? (waliKelas ? String(waliKelas).trim() : null) : undefined,
        ...(tahunAjaran ? { tahunAjaran: String(tahunAjaran).trim() } : {}),
        ...(kapasitas !== undefined ? { kapasitas: parseInt(kapasitas, 10) } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
      include: {
        jenjang: true,
        tingkat: true,
        jurusan: true,
      },
    })

    return apiSuccess({
      message: 'Data rombel kelas berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Kelas PUT Error:', error)
    return apiError('Gagal memperbarui rombel kelas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/kelas', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const kelasId = parseInt(id, 10)
    if (isNaN(kelasId)) return apiError('ID kelas tidak valid', 400)

    const siswaCount = await prisma.siswa.count({ where: { kelasId } })
    if (siswaCount > 0) {
      return apiError(
        `Rombel kelas tidak dapat dihapus karena masih menaungi ${siswaCount} siswa. Pindahkan siswa terlebih dahulu.`,
        400
      )
    }

    await prisma.kelas.delete({
      where: { id: kelasId },
    })

    return apiSuccess({
      message: 'Rombel kelas berhasil dihapus',
      data: null,
    })
  } catch (error: any) {
    console.error('API Kelas DELETE Error:', error)
    return apiError('Gagal menghapus rombel kelas: ' + (error?.message || 'Server error'), 500)
  }
}
