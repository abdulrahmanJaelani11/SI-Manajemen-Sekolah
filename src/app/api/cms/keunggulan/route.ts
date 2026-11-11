import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const list = await prisma.keunggulan.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { urutan: 'asc' },
    })

    return apiSuccess({
      message: 'Data kartu keunggulan berhasil dimuat',
      data: list,
    })
  } catch (error: any) {
    console.error('API Keunggulan GET Error:', error)
    return apiError('Gagal memuat data keunggulan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { judul, deskripsi, icon, urutan, active } = body

    if (!judul || !String(judul).trim()) {
      return apiError('Judul kartu keunggulan wajib diisi', 400)
    }

    const created = await prisma.keunggulan.create({
      data: {
        judul: String(judul).trim(),
        deskripsi: deskripsi ? String(deskripsi).trim() : null,
        icon: icon ? String(icon).trim() : 'Award',
        urutan: urutan ? Number(urutan) : 1,
        active: active !== undefined ? Boolean(active) : true,
      },
    })

    return apiSuccess({
      message: 'Kartu keunggulan berhasil ditambahkan',
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Keunggulan POST Error:', error)
    return apiError('Gagal menambahkan keunggulan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, judul, deskripsi, icon, urutan, active } = body

    if (!id) {
      return apiError('ID keunggulan wajib disertakan', 400)
    }

    const updated = await prisma.keunggulan.update({
      where: { id: Number(id) },
      data: {
        ...(judul !== undefined ? { judul: String(judul).trim() } : {}),
        ...(deskripsi !== undefined ? { deskripsi: deskripsi ? String(deskripsi).trim() : null } : {}),
        ...(icon !== undefined ? { icon: String(icon).trim() } : {}),
        ...(urutan !== undefined ? { urutan: Number(urutan) } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    })

    return apiSuccess({
      message: 'Kartu keunggulan berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Keunggulan PUT Error:', error)
    return apiError('Gagal memperbarui keunggulan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('Parameter id wajib disertakan', 400)
    }

    await prisma.keunggulan.delete({
      where: { id: Number(id) },
    })

    return apiSuccess({
      message: 'Kartu keunggulan berhasil dihapus',
    })
  } catch (error: any) {
    console.error('API Keunggulan DELETE Error:', error)
    return apiError('Gagal menghapus keunggulan: ' + (error?.message || 'Server error'), 500)
  }
}
