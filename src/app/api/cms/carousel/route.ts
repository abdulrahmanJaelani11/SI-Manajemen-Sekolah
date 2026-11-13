import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const carousels = await prisma.carousel.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { urutan: 'asc' },
    })

    return apiSuccess({
      message: 'Data banner carousel berhasil dimuat',
      data: carousels,
    })
  } catch (error: any) {
    console.error('API Carousel GET Error:', error)
    return apiError('Gagal memuat data carousel: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/cms/carousel', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { badge, judul, deskripsi, fotoUrl, link1Text, link1Url, link2Text, link2Url, urutan, active } = body

    if (!judul || !String(judul).trim()) {
      return apiError('Judul headline carousel wajib diisi', 400)
    }

    const created = await prisma.carousel.create({
      data: {
        badge: badge ? String(badge).trim() : 'Informasi Sekolah',
        judul: String(judul).trim(),
        deskripsi: deskripsi ? String(deskripsi).trim() : null,
        fotoUrl: fotoUrl ? String(fotoUrl).trim() : null,
        link1Text: link1Text ? String(link1Text).trim() : 'Pelajari Selengkapnya',
        link1Url: link1Url ? String(link1Url).trim() : '#profil',
        link2Text: link2Text ? String(link2Text).trim() : 'Hubungi Kami',
        link2Url: link2Url ? String(link2Url).trim() : '#kontak',
        urutan: urutan ? Number(urutan) : 1,
        active: active !== undefined ? Boolean(active) : true,
      },
    })

    return apiSuccess({
      message: 'Banner carousel berhasil ditambahkan',
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Carousel POST Error:', error)
    return apiError('Gagal menambahkan carousel: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/cms/carousel', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { id, badge, judul, deskripsi, fotoUrl, link1Text, link1Url, link2Text, link2Url, urutan, active } = body

    if (!id) {
      return apiError('ID banner carousel wajib disertakan', 400)
    }

    const updated = await prisma.carousel.update({
      where: { id: Number(id) },
      data: {
        ...(badge !== undefined ? { badge: badge ? String(badge).trim() : null } : {}),
        ...(judul !== undefined ? { judul: String(judul).trim() } : {}),
        ...(deskripsi !== undefined ? { deskripsi: deskripsi ? String(deskripsi).trim() : null } : {}),
        ...(fotoUrl !== undefined ? { fotoUrl: fotoUrl ? String(fotoUrl).trim() : null } : {}),
        ...(link1Text !== undefined ? { link1Text: link1Text ? String(link1Text).trim() : null } : {}),
        ...(link1Url !== undefined ? { link1Url: link1Url ? String(link1Url).trim() : null } : {}),
        ...(link2Text !== undefined ? { link2Text: link2Text ? String(link2Text).trim() : null } : {}),
        ...(link2Url !== undefined ? { link2Url: link2Url ? String(link2Url).trim() : null } : {}),
        ...(urutan !== undefined ? { urutan: Number(urutan) } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    })

    return apiSuccess({
      message: 'Banner carousel berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Carousel PUT Error:', error)
    return apiError('Gagal memperbarui carousel: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/cms/carousel', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('Parameter id wajib disertakan', 400)
    }

    await prisma.carousel.delete({
      where: { id: Number(id) },
    })

    return apiSuccess({
      message: 'Banner carousel berhasil dihapus',
    })
  } catch (error: any) {
    console.error('API Carousel DELETE Error:', error)
    return apiError('Gagal menghapus carousel: ' + (error?.message || 'Server error'), 500)
  }
}
