import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET() {
  try {
    const list = await prisma.fasilitas.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess({
      message: 'Data fasilitas berhasil dimuat',
      data: list,
    })
  } catch (error: any) {
    console.error('API Fasilitas GET Error:', error)
    return apiError('Gagal memuat data fasilitas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama, deskripsi, fotoUrl, kondisi } = body

    if (!nama || !String(nama).trim()) {
      return apiError('Nama sarana/fasilitas wajib diisi', 400)
    }

    const created = await prisma.fasilitas.create({
      data: {
        nama: String(nama).trim(),
        deskripsi: deskripsi ? String(deskripsi).trim() : null,
        fotoUrl: fotoUrl ? String(fotoUrl).trim() : null,
        kondisi: kondisi ? String(kondisi).trim() : 'Baik',
      },
    })

    return apiSuccess({
      message: 'Fasilitas berhasil ditambahkan',
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Fasilitas POST Error:', error)
    return apiError('Gagal menambahkan fasilitas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nama, deskripsi, fotoUrl, kondisi } = body

    if (!id) {
      return apiError('ID fasilitas wajib disertakan', 400)
    }

    const updated = await prisma.fasilitas.update({
      where: { id: Number(id) },
      data: {
        ...(nama !== undefined ? { nama: String(nama).trim() } : {}),
        ...(deskripsi !== undefined ? { deskripsi: deskripsi ? String(deskripsi).trim() : null } : {}),
        ...(fotoUrl !== undefined ? { fotoUrl: fotoUrl ? String(fotoUrl).trim() : null } : {}),
        ...(kondisi !== undefined ? { kondisi: String(kondisi).trim() } : {}),
      },
    })

    return apiSuccess({
      message: 'Fasilitas berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Fasilitas PUT Error:', error)
    return apiError('Gagal memperbarui fasilitas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('Parameter id wajib disertakan', 400)
    }

    await prisma.fasilitas.delete({
      where: { id: Number(id) },
    })

    return apiSuccess({
      message: 'Fasilitas berhasil dihapus',
    })
  } catch (error: any) {
    console.error('API Fasilitas DELETE Error:', error)
    return apiError('Gagal menghapus fasilitas: ' + (error?.message || 'Server error'), 500)
  }
}
