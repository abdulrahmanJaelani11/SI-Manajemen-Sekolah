import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/akademik/tahun-ajaran', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const targetId = parseInt(id, 10)
    if (isNaN(targetId)) return apiError('ID tahun ajaran tidak valid', 400)

    const existing = await prisma.tahunAjaran.findUnique({ where: { id: targetId } })
    if (!existing) return apiError('Periode tahun ajaran tidak ditemukan', 404)

    const body = await request.json()
    const {
      nama,
      semester,
      tanggalMulai,
      tanggalSelesai,
      isActive,
      keterangan,
    } = body

    const cleanNama = nama ? String(nama).trim() : existing.nama
    const nextSemester = semester || existing.semester

    if (!/^\d{4}\/\d{4}$/.test(cleanNama)) {
      return apiError('Format Tahun Ajaran harus YYYY/YYYY (contoh: 2025/2026)', 400)
    }

    if (nextSemester !== 'Ganjil' && nextSemester !== 'Genap') {
      return apiError('Semester harus "Ganjil" atau "Genap"', 400)
    }

    // Cek duplikat dengan ID lain
    const duplicate = await prisma.tahunAjaran.findFirst({
      where: {
        nama: cleanNama,
        semester: nextSemester,
        NOT: { id: targetId },
      },
    })
    if (duplicate) {
      return apiError(`Periode ${cleanNama} Semester ${nextSemester} sudah ada.`, 400)
    }

    // Jangan biarkan menonaktifkan satu-satunya periode yang sedang aktif
    if (existing.isActive && isActive === false) {
      return apiError(
        'Tidak dapat menonaktifkan periode yang sedang aktif secara langsung. Aktifkan periode lain untuk menggantikannya.',
        400
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isActive === true) {
        await tx.tahunAjaran.updateMany({
          where: { isActive: true, NOT: { id: targetId } },
          data: { isActive: false },
        })
      }

      return tx.tahunAjaran.update({
        where: { id: targetId },
        data: {
          nama: cleanNama,
          semester: nextSemester,
          tanggalMulai: tanggalMulai !== undefined ? (tanggalMulai ? new Date(tanggalMulai) : null) : existing.tanggalMulai,
          tanggalSelesai: tanggalSelesai !== undefined ? (tanggalSelesai ? new Date(tanggalSelesai) : null) : existing.tanggalSelesai,
          isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
          keterangan: keterangan !== undefined ? (keterangan ? String(keterangan).trim() : null) : existing.keterangan,
        },
      })
    })

    return apiSuccess({
      message: 'Periode tahun ajaran berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Tahun Ajaran PUT Error:', error)
    return apiError('Gagal memperbarui tahun ajaran: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/akademik/tahun-ajaran', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const targetId = parseInt(id, 10)
    if (isNaN(targetId)) return apiError('ID tahun ajaran tidak valid', 400)

    const existing = await prisma.tahunAjaran.findUnique({ where: { id: targetId } })
    if (!existing) return apiError('Periode tahun ajaran tidak ditemukan', 404)

    const updated = await prisma.$transaction(async (tx) => {
      await tx.tahunAjaran.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })

      return tx.tahunAjaran.update({
        where: { id: targetId },
        data: { isActive: true },
      })
    })

    return apiSuccess({
      message: `Periode ${updated.nama} (Semester ${updated.semester}) kini menjadi Tahun Ajaran Aktif`,
      data: updated,
    })
  } catch (error: any) {
    console.error('API Tahun Ajaran PATCH Error:', error)
    return apiError('Gagal mengaktifkan periode tahun ajaran: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/akademik/tahun-ajaran', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const targetId = parseInt(id, 10)
    if (isNaN(targetId)) return apiError('ID tahun ajaran tidak valid', 400)

    const existing = await prisma.tahunAjaran.findUnique({ where: { id: targetId } })
    if (!existing) return apiError('Periode tahun ajaran tidak ditemukan', 404)

    if (existing.isActive) {
      return apiError('Periode yang sedang aktif tidak boleh dihapus. Alihkan periode aktif ke tahun ajaran lain terlebih dahulu.', 400)
    }

    await prisma.tahunAjaran.delete({ where: { id: targetId } })

    return apiSuccess({
      message: 'Periode tahun ajaran berhasil dihapus',
      data: null,
    })
  } catch (error: any) {
    console.error('API Tahun Ajaran DELETE Error:', error)
    return apiError('Gagal menghapus tahun ajaran: ' + (error?.message || 'Server error'), 500)
  }
}

