import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET() {
  try {
    const list = await prisma.kegiatan.findMany({
      orderBy: { tanggal: 'desc' },
    })

    return apiSuccess({
      message: 'Data dokumentasi kegiatan berhasil dimuat',
      data: list,
    })
  } catch (error: any) {
    console.error('API Kegiatan GET Error:', error)
    return apiError('Gagal memuat kegiatan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { judul, deskripsi, fotoUrl, tanggal } = body

    if (!judul || !String(judul).trim()) {
      return apiError('Judul agenda/kegiatan wajib diisi', 400)
    }

    const created = await prisma.kegiatan.create({
      data: {
        judul: String(judul).trim(),
        deskripsi: deskripsi ? String(deskripsi).trim() : null,
        fotoUrl: fotoUrl ? String(fotoUrl).trim() : null,
        tanggal: tanggal ? new Date(tanggal) : null,
      },
    })

    return apiSuccess({
      message: 'Dokumentasi kegiatan berhasil ditambahkan',
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Kegiatan POST Error:', error)
    return apiError('Gagal menambahkan kegiatan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, judul, deskripsi, fotoUrl, tanggal } = body

    if (!id) {
      return apiError('ID kegiatan wajib disertakan', 400)
    }

    const updated = await prisma.kegiatan.update({
      where: { id: Number(id) },
      data: {
        ...(judul !== undefined ? { judul: String(judul).trim() } : {}),
        ...(deskripsi !== undefined ? { deskripsi: deskripsi ? String(deskripsi).trim() : null } : {}),
        ...(fotoUrl !== undefined ? { fotoUrl: fotoUrl ? String(fotoUrl).trim() : null } : {}),
        ...(tanggal !== undefined ? { tanggal: tanggal ? new Date(tanggal) : null } : {}),
      },
    })

    return apiSuccess({
      message: 'Kegiatan berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Kegiatan PUT Error:', error)
    return apiError('Gagal memperbarui kegiatan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('Parameter id wajib disertakan', 400)
    }

    await prisma.kegiatan.delete({
      where: { id: Number(id) },
    })

    return apiSuccess({
      message: 'Kegiatan berhasil dihapus',
    })
  } catch (error: any) {
    console.error('API Kegiatan DELETE Error:', error)
    return apiError('Gagal menghapus kegiatan: ' + (error?.message || 'Server error'), 500)
  }
}
