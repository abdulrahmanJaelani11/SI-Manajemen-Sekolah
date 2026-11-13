import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'
import { logAudit } from '@/lib/audit-logger'

// GET /api/akademik/kalender/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/akademik/kalender', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const eventId = Number(id)
    if (isNaN(eventId)) return apiError('ID agenda tidak valid', 400)

    const event = await prisma.akademikKalender.findUnique({
      where: { id: eventId },
    })

    if (!event) return apiError('Agenda kalender tidak ditemukan', 404)

    return apiSuccess({ data: event })
  } catch (error: any) {
    console.error('Error fetching event detail:', error)
    return apiError(error.message || 'Gagal mengambil detail agenda', 500)
  }
}

// PUT /api/akademik/kalender/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/akademik/kalender', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const eventId = Number(id)
    if (isNaN(eventId)) return apiError('ID agenda tidak valid', 400)

    const existing = await prisma.akademikKalender.findUnique({
      where: { id: eventId },
    })
    if (!existing) return apiError('Agenda kalender tidak ditemukan', 404)

    const body = await request.json()
    const {
      judul,
      deskripsi,
      tanggalMulai,
      tanggalSelesai,
      kategori,
      warna,
      tahunAjaran,
      semester,
      sasaran,
      liburSekolah,
      isPublic,
    } = body

    if (!judul || !tanggalMulai || !tanggalSelesai) {
      return apiError('Judul agenda, tanggal mulai, dan tanggal selesai wajib diisi', 400)
    }

    const startDate = new Date(tanggalMulai)
    const endDate = new Date(tanggalSelesai)

    if (endDate < startDate) {
      return apiError('Tanggal selesai tidak boleh lebih awal dari tanggal mulai', 400)
    }

    const updated = await prisma.akademikKalender.update({
      where: { id: eventId },
      data: {
        judul: judul.trim(),
        deskripsi: deskripsi !== undefined ? (deskripsi ? deskripsi.trim() : null) : undefined,
        tanggalMulai: startDate,
        tanggalSelesai: endDate,
        kategori: kategori || 'akademik',
        warna: warna || '#3b82f6',
        tahunAjaran: tahunAjaran ? tahunAjaran.trim() : undefined,
        semester: semester || 'ganjil',
        sasaran: sasaran || 'semua',
        liburSekolah: liburSekolah !== undefined ? Boolean(liburSekolah) : false,
        isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
      },
    })

    // Rekam Audit Trail
    await logAudit({
      request,
      userId: auth.user.userId,
      username: auth.user.username,
      namaUser: auth.user.namaLengkap,
      role: auth.user.roleName,
      modul: 'AKADEMIK',
      aksi: 'UPDATE',
      deskripsi: `Memperbarui agenda kalender akademik "${updated.judul}"`,
      dataSebelum: existing,
      dataSesudah: updated,
    })

    return apiSuccess({
      data: updated,
      message: 'Agenda kalender berhasil diperbarui',
    })
  } catch (error: any) {
    console.error('Error updating kalender event:', error)
    return apiError(error.message || 'Gagal memperbarui agenda kalender', 500)
  }
}

// DELETE /api/akademik/kalender/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/akademik/kalender', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const eventId = Number(id)
    if (isNaN(eventId)) return apiError('ID agenda tidak valid', 400)

    const existing = await prisma.akademikKalender.findUnique({
      where: { id: eventId },
    })
    if (!existing) return apiError('Agenda kalender tidak ditemukan', 404)

    await prisma.akademikKalender.delete({
      where: { id: eventId },
    })

    // Rekam Audit Trail
    await logAudit({
      request,
      userId: auth.user.userId,
      username: auth.user.username,
      namaUser: auth.user.namaLengkap,
      role: auth.user.roleName,
      modul: 'AKADEMIK',
      aksi: 'DELETE',
      deskripsi: `Menghapus agenda kalender akademik "${existing.judul}" (${existing.tahunAjaran})`,
      dataSebelum: existing,
    })

    return apiSuccess({
      message: 'Agenda kalender berhasil dihapus',
    })
  } catch (error: any) {
    console.error('Error deleting kalender event:', error)
    return apiError(error.message || 'Gagal menghapus agenda kalender', 500)
  }
}

