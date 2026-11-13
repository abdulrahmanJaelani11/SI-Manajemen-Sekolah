import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/ppdb', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const gelombangList = await prisma.ppdbGelombang.findMany({
      include: {
        _count: {
          select: { pendaftar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return apiSuccess({
      message: 'Daftar gelombang PPDB berhasil dimuat',
      data: gelombangList.map((g) => ({
        ...g,
        biayaDaftar: Number(g.biayaDaftar),
        jumlahPendaftar: g._count.pendaftar,
      })),
    })
  } catch (error: any) {
    console.error('API PPDB Gelombang GET Error:', error)
    return apiError('Gagal memuat gelombang PPDB: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/ppdb', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      nama,
      tahunAjaran,
      tanggalMulai,
      tanggalSelesai,
      kuotaTotal,
      biayaDaftar,
      syaratText,
      isActive,
    } = body

    if (!nama?.trim() || !tahunAjaran?.trim() || !tanggalMulai || !tanggalSelesai) {
      return apiError('Nama gelombang, tahun ajaran, tanggal mulai, dan tanggal selesai wajib diisi.', 400)
    }

    const start = new Date(tanggalMulai)
    const end = new Date(`${String(tanggalSelesai).slice(0, 10)}T23:59:59.999Z`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return apiError('Rentang tanggal mulai dan selesai tidak valid.', 400)
    }

    const created = await prisma.ppdbGelombang.create({
      data: {
        nama: String(nama).trim(),
        tahunAjaran: String(tahunAjaran).trim(),
        tanggalMulai: start,
        tanggalSelesai: end,
        kuotaTotal: Math.max(1, Number(kuotaTotal) || 100),
        biayaDaftar: Math.max(0, Number(biayaDaftar) || 0),
        syaratText: syaratText ? String(syaratText).trim() : null,
        isActive: isActive !== false,
      },
    })

    return apiSuccess({
      message: `Gelombang "${created.nama}" berhasil ditambahkan`,
      data: { ...created, biayaDaftar: Number(created.biayaDaftar) },
      status: 201,
    })
  } catch (error: any) {
    console.error('API PPDB Gelombang POST Error:', error)
    return apiError('Gagal membuat gelombang PPDB: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/ppdb', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      id,
      nama,
      tahunAjaran,
      tanggalMulai,
      tanggalSelesai,
      kuotaTotal,
      biayaDaftar,
      syaratText,
      isActive,
    } = body

    if (!id) {
      return apiError('ID gelombang wajib disertakan.', 400)
    }

    const existing = await prisma.ppdbGelombang.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return apiError('Gelombang PPDB tidak ditemukan.', 404)
    }

    const start = tanggalMulai ? new Date(tanggalMulai) : existing.tanggalMulai
    const end = tanggalSelesai
      ? new Date(`${String(tanggalSelesai).slice(0, 10)}T23:59:59.999Z`)
      : existing.tanggalSelesai

    if (end < start) {
      return apiError('Tanggal selesai tidak boleh sebelum tanggal mulai.', 400)
    }

    const updated = await prisma.ppdbGelombang.update({
      where: { id: existing.id },
      data: {
        nama: nama !== undefined ? String(nama).trim() : existing.nama,
        tahunAjaran: tahunAjaran !== undefined ? String(tahunAjaran).trim() : existing.tahunAjaran,
        tanggalMulai: start,
        tanggalSelesai: end,
        kuotaTotal: kuotaTotal !== undefined ? Math.max(1, Number(kuotaTotal)) : existing.kuotaTotal,
        biayaDaftar: biayaDaftar !== undefined ? Math.max(0, Number(biayaDaftar)) : existing.biayaDaftar,
        syaratText: syaratText !== undefined ? (syaratText ? String(syaratText).trim() : null) : existing.syaratText,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    })

    return apiSuccess({
      message: `Gelombang "${updated.nama}" berhasil diperbarui`,
      data: { ...updated, biayaDaftar: Number(updated.biayaDaftar) },
    })
  } catch (error: any) {
    console.error('API PPDB Gelombang PUT Error:', error)
    return apiError('Gagal memperbarui gelombang PPDB: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/ppdb', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))
    if (!id) {
      return apiError('ID gelombang wajib disertakan.', 400)
    }

    const existing = await prisma.ppdbGelombang.findUnique({
      where: { id },
      include: { _count: { select: { pendaftar: true } } },
    })

    if (!existing) {
      return apiError('Gelombang PPDB tidak ditemukan.', 404)
    }

    if (existing._count.pendaftar > 0) {
      return apiError(
        `Tidak dapat menghapus gelombang ini karena sudah memiliki ${existing._count.pendaftar} pendaftar. Nonaktifkan saja bila sudah ditutup.`,
        400
      )
    }

    await prisma.ppdbGelombang.delete({ where: { id } })
    return apiSuccess({ message: `Gelombang "${existing.nama}" berhasil dihapus` })
  } catch (error: any) {
    console.error('API PPDB Gelombang DELETE Error:', error)
    return apiError('Gagal menghapus gelombang PPDB: ' + (error?.message || 'Server error'), 500)
  }
}
