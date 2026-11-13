import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/akademik/mapel', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const targetId = parseInt(id, 10)
    if (isNaN(targetId)) return apiError('ID mata pelajaran tidak valid', 400)

    const existing = await prisma.mataPelajaran.findUnique({ where: { id: targetId } })
    if (!existing) return apiError('Mata pelajaran tidak ditemukan', 404)

    const body = await request.json()
    const {
      kode,
      nama,
      kelompok,
      kkm,
      jenjangId,
      jurusanId,
      deskripsi,
      active,
    } = body

    const cleanKode = kode ? String(kode).trim().toUpperCase() : existing.kode
    const cleanNama = nama ? String(nama).trim() : existing.nama

    if (!cleanKode || !cleanNama) {
      return apiError('Kode dan Nama Mata Pelajaran wajib diisi', 400)
    }

    const dup = await prisma.mataPelajaran.findFirst({
      where: { kode: cleanKode, NOT: { id: targetId } },
    })
    if (dup) {
      return apiError(`Kode "${cleanKode}" sudah digunakan oleh mata pelajaran lain`, 400)
    }

    const updated = await prisma.mataPelajaran.update({
      where: { id: targetId },
      data: {
        kode: cleanKode,
        nama: cleanNama,
        kelompok: kelompok || existing.kelompok,
        kkm: kkm !== undefined ? Math.min(100, Math.max(0, Number(kkm))) : existing.kkm,
        jenjangId: jenjangId !== undefined ? (jenjangId ? Number(jenjangId) : null) : existing.jenjangId,
        jurusanId: jurusanId !== undefined ? (jurusanId ? Number(jurusanId) : null) : existing.jurusanId,
        deskripsi: deskripsi !== undefined ? (deskripsi ? String(deskripsi).trim() : null) : existing.deskripsi,
        active: active !== undefined ? Boolean(active) : existing.active,
      },
      include: {
        jenjang: true,
        jurusan: true,
      },
    })

    return apiSuccess({
      message: 'Mata pelajaran berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Mapel PUT Error:', error)
    return apiError('Gagal memperbarui mata pelajaran: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/akademik/mapel', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const targetId = parseInt(id, 10)
    if (isNaN(targetId)) return apiError('ID mata pelajaran tidak valid', 400)

    const existing = await prisma.mataPelajaran.findUnique({ where: { id: targetId } })
    if (!existing) return apiError('Mata pelajaran tidak ditemukan', 404)

    await prisma.mataPelajaran.delete({ where: { id: targetId } })

    return apiSuccess({
      message: 'Mata pelajaran berhasil dihapus',
      data: null,
    })
  } catch (error: any) {
    console.error('API Mapel DELETE Error:', error)
    return apiError('Gagal menghapus mata pelajaran: ' + (error?.message || 'Server error'), 500)
  }
}

