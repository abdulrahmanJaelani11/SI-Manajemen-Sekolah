import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const kategori = searchParams.get('kategori') || ''
    const publishedParam = searchParams.get('published')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : 50

    const where: any = {}

    if (publishedParam !== null && publishedParam !== undefined && publishedParam !== 'all') {
      where.published = publishedParam === 'true'
    }

    if (kategori && kategori !== 'semua') {
      where.kategori = kategori
    }

    if (search.trim()) {
      where.OR = [
        { judul: { contains: search.trim(), mode: 'insensitive' } },
        { ringkasan: { contains: search.trim(), mode: 'insensitive' } },
        { penulis: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    const beritaList = await prisma.berita.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return apiSuccess({
      message: 'Data berita & publikasi berhasil dimuat',
      data: beritaList,
    })
  } catch (error: any) {
    console.error('API Berita GET Error:', error)
    return apiError('Gagal memuat berita: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/cms/berita', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { judul, ringkasan, deskripsi, fotoUrl, kategori, penulis, published, slug } = body

    if (!judul || !String(judul).trim()) {
      return apiError('Judul berita wajib diisi', 400)
    }
    if (!deskripsi || !String(deskripsi).trim()) {
      return apiError('Konten deskripsi berita wajib diisi', 400)
    }

    let baseSlug = slug && String(slug).trim() ? slugify(String(slug)) : slugify(String(judul))
    if (!baseSlug) baseSlug = 'berita-' + Date.now()

    // Cek keunikan slug
    let finalSlug = baseSlug
    let counter = 1
    while (await prisma.berita.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`
      counter++
    }

    const created = await prisma.berita.create({
      data: {
        judul: String(judul).trim(),
        slug: finalSlug,
        ringkasan: ringkasan ? String(ringkasan).trim() : null,
        deskripsi: String(deskripsi).trim(),
        fotoUrl: fotoUrl ? String(fotoUrl).trim() : null,
        kategori: kategori ? String(kategori).trim() : 'Pengumuman',
        penulis: penulis ? String(penulis).trim() : 'Admin Sekolah',
        published: published !== undefined ? Boolean(published) : true,
      },
    })

    return apiSuccess({
      message: 'Berita baru berhasil dipublikasikan',
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Berita POST Error:', error)
    return apiError('Gagal membuat berita: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/cms/berita', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { id, judul, ringkasan, deskripsi, fotoUrl, kategori, penulis, published, slug } = body

    if (!id) {
      return apiError('ID berita wajib disertakan', 400)
    }

    const existing = await prisma.berita.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return apiError('Berita tidak ditemukan', 404)
    }

    let finalSlug = existing.slug
    if (slug && slug !== existing.slug) {
      let testSlug = slugify(String(slug))
      let counter = 1
      while (
        await prisma.berita.findFirst({
          where: { slug: testSlug, NOT: { id: existing.id } },
        })
      ) {
        testSlug = `${slugify(String(slug))}-${counter}`
        counter++
      }
      finalSlug = testSlug
    }

    const updated = await prisma.berita.update({
      where: { id: Number(id) },
      data: {
        ...(judul !== undefined ? { judul: String(judul).trim() } : {}),
        slug: finalSlug,
        ...(ringkasan !== undefined ? { ringkasan: ringkasan ? String(ringkasan).trim() : null } : {}),
        ...(deskripsi !== undefined ? { deskripsi: String(deskripsi).trim() } : {}),
        ...(fotoUrl !== undefined ? { fotoUrl: fotoUrl ? String(fotoUrl).trim() : null } : {}),
        ...(kategori !== undefined ? { kategori: String(kategori).trim() } : {}),
        ...(penulis !== undefined ? { penulis: String(penulis).trim() } : {}),
        ...(published !== undefined ? { published: Boolean(published) } : {}),
      },
    })

    return apiSuccess({
      message: 'Berita berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Berita PUT Error:', error)
    return apiError('Gagal memperbarui berita: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/cms/berita', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return apiError('Parameter id wajib disertakan', 400)
    }

    await prisma.berita.delete({
      where: { id: Number(id) },
    })

    return apiSuccess({
      message: 'Berita berhasil dihapus',
    })
  } catch (error: any) {
    console.error('API Berita DELETE Error:', error)
    return apiError('Gagal menghapus berita: ' + (error?.message || 'Server error'), 500)
  }
}
