import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/kedisiplinan', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const kategoriList = await prisma.kategoriPoinSiswa.findMany({
      include: {
        _count: { select: { catatan: true } },
      },
      orderBy: [{ jenis: 'asc' }, { poin: 'asc' }, { kode: 'asc' }],
    })

    return apiSuccess({
      message: 'Master kategori poin kedisiplinan berhasil dimuat',
      data: kategoriList,
    })
  } catch (error: any) {
    console.error('API Kedisiplinan Kategori GET Error:', error)
    return apiError('Gagal memuat kategori poin: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/kedisiplinan', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { kode, nama, jenis, tingkat, poin, active } = body

    if (!kode?.trim() || !nama?.trim() || !jenis) {
      return apiError('Kode, nama kategori, dan jenis (pelanggaran/prestasi) wajib diisi.', 400)
    }

    const cleanJenis = jenis === 'prestasi' ? 'prestasi' : 'pelanggaran'
    const cleanKode = String(kode).trim().toUpperCase()

    const dup = await prisma.kategoriPoinSiswa.findUnique({ where: { kode: cleanKode } })
    if (dup) {
      return apiError(`Kode kategori "${cleanKode}" sudah terdaftar.`, 409)
    }

    const created = await prisma.kategoriPoinSiswa.create({
      data: {
        kode: cleanKode,
        nama: String(nama).trim(),
        jenis: cleanJenis,
        tingkat: tingkat ? String(tingkat).trim().toLowerCase() : cleanJenis === 'prestasi' ? 'sekolah' : 'ringan',
        poin: Math.max(1, Number(poin) || 5),
        active: active !== false,
      },
    })

    return apiSuccess({
      message: `Kategori "${created.nama}" berhasil ditambahkan`,
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Kedisiplinan Kategori POST Error:', error)
    return apiError('Gagal menambahkan kategori poin: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/kedisiplinan', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { id, kode, nama, jenis, tingkat, poin, active } = body

    if (!id) {
      return apiError('ID kategori wajib disertakan.', 400)
    }

    const existing = await prisma.kategoriPoinSiswa.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return apiError('Kategori poin tidak ditemukan.', 404)
    }

    const cleanKode = kode ? String(kode).trim().toUpperCase() : existing.kode
    if (cleanKode !== existing.kode) {
      const dup = await prisma.kategoriPoinSiswa.findUnique({ where: { kode: cleanKode } })
      if (dup) {
        return apiError(`Kode kategori "${cleanKode}" sudah digunakan.`, 409)
      }
    }

    const updated = await prisma.kategoriPoinSiswa.update({
      where: { id: existing.id },
      data: {
        kode: cleanKode,
        nama: nama !== undefined ? String(nama).trim() : existing.nama,
        jenis: jenis !== undefined ? (jenis === 'prestasi' ? 'prestasi' : 'pelanggaran') : existing.jenis,
        tingkat: tingkat !== undefined ? String(tingkat).trim().toLowerCase() : existing.tingkat,
        poin: poin !== undefined ? Math.max(1, Number(poin)) : existing.poin,
        active: active !== undefined ? Boolean(active) : existing.active,
      },
    })

    return apiSuccess({
      message: `Kategori "${updated.nama}" berhasil diperbarui`,
      data: updated,
    })
  } catch (error: any) {
    console.error('API Kedisiplinan Kategori PUT Error:', error)
    return apiError('Gagal memperbarui kategori poin: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/kedisiplinan', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))
    if (!id) {
      return apiError('ID kategori wajib disertakan.', 400)
    }

    const existing = await prisma.kategoriPoinSiswa.findUnique({
      where: { id },
      include: { _count: { select: { catatan: true } } },
    })

    if (!existing) {
      return apiError('Kategori poin tidak ditemukan.', 404)
    }

    if (existing._count.catatan > 0) {
      return apiError(
        `Tidak dapat menghapus kategori ini karena sudah digunakan pada ${existing._count.catatan} catatan siswa.`,
        400
      )
    }

    await prisma.kategoriPoinSiswa.delete({ where: { id } })
    return apiSuccess({ message: `Kategori "${existing.nama}" dihapus` })
  } catch (error: any) {
    console.error('API Kedisiplinan Kategori DELETE Error:', error)
    return apiError('Gagal menghapus kategori poin: ' + (error?.message || 'Server error'), 500)
  }
}

