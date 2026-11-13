import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/kas-umum', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const kategoriList = await prisma.kategoriKas.findMany({
      include: { _count: { select: { transaksi: true } } },
      orderBy: [{ jenis: 'asc' }, { kode: 'asc' }],
    })

    return apiSuccess({
      message: 'Kategori kas umum berhasil dimuat',
      data: kategoriList,
    })
  } catch (error: any) {
    console.error('API Kategori Kas GET Error:', error)
    return apiError('Gagal memuat kategori kas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/kas-umum', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { kode, nama, jenis, keterangan, active } = body

    if (!kode?.trim() || !nama?.trim() || !jenis) {
      return apiError('Kode, nama pos kas, dan jenis (pemasukan/pengeluaran) wajib diisi.', 400)
    }

    const cleanKode = String(kode).trim().toUpperCase()
    const dup = await prisma.kategoriKas.findUnique({ where: { kode: cleanKode } })
    if (dup) {
      return apiError(`Kode pos kas "${cleanKode}" sudah terdaftar.`, 409)
    }

    const created = await prisma.kategoriKas.create({
      data: {
        kode: cleanKode,
        nama: String(nama).trim(),
        jenis: jenis === 'pemasukan' ? 'pemasukan' : 'pengeluaran',
        keterangan: keterangan ? String(keterangan).trim() : null,
        active: active !== false,
      },
    })

    return apiSuccess({
      message: `Pos kas "${created.nama}" berhasil ditambahkan`,
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Kategori Kas POST Error:', error)
    return apiError('Gagal membuat kategori kas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/kas-umum', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { id, kode, nama, jenis, keterangan, active } = body

    if (!id) {
      return apiError('ID kategori kas wajib disertakan.', 400)
    }

    const existing = await prisma.kategoriKas.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return apiError('Kategori kas tidak ditemukan.', 404)
    }

    const cleanKode = kode ? String(kode).trim().toUpperCase() : existing.kode
    if (cleanKode !== existing.kode) {
      const dup = await prisma.kategoriKas.findUnique({ where: { kode: cleanKode } })
      if (dup) {
        return apiError(`Kode pos kas "${cleanKode}" sudah digunakan.`, 409)
      }
    }

    const updated = await prisma.kategoriKas.update({
      where: { id: existing.id },
      data: {
        kode: cleanKode,
        nama: nama !== undefined ? String(nama).trim() : existing.nama,
        jenis:
          jenis !== undefined
            ? jenis === 'pemasukan'
              ? 'pemasukan'
              : 'pengeluaran'
            : existing.jenis,
        keterangan:
          keterangan !== undefined
            ? keterangan
              ? String(keterangan).trim()
              : null
            : existing.keterangan,
        active: active !== undefined ? Boolean(active) : existing.active,
      },
    })

    return apiSuccess({
      message: `Pos kas "${updated.nama}" berhasil diperbarui`,
      data: updated,
    })
  } catch (error: any) {
    console.error('API Kategori Kas PUT Error:', error)
    return apiError('Gagal memperbarui kategori kas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/kas-umum', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))
    if (!id) {
      return apiError('ID kategori kas wajib disertakan.', 400)
    }

    const existing = await prisma.kategoriKas.findUnique({
      where: { id },
      include: { _count: { select: { transaksi: true } } },
    })
    if (!existing) {
      return apiError('Kategori kas tidak ditemukan.', 404)
    }
    if (existing._count.transaksi > 0) {
      return apiError(
        `Tidak dapat menghapus pos kas ini karena sudah memiliki ${existing._count.transaksi} transaksi.`,
        400
      )
    }

    await prisma.kategoriKas.delete({ where: { id } })
    return apiSuccess({ message: `Pos kas "${existing.nama}" dihapus` })
  } catch (error: any) {
    console.error('API Kategori Kas DELETE Error:', error)
    return apiError('Gagal menghapus kategori kas: ' + (error?.message || 'Server error'), 500)
  }
}

