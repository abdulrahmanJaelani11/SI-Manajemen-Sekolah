import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/tagihan', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const jenisList = await prisma.jenisTagihan.findMany({
      include: { _count: { select: { tagihan: true } } },
      orderBy: [{ kode: 'asc' }],
    })

    return apiSuccess({
      message: 'Daftar jenis tagihan Non-SPP berhasil dimuat',
      data: jenisList.map((j) => ({
        ...j,
        nominalDefault: Number(j.nominalDefault),
      })),
    })
  } catch (error: any) {
    console.error('API Jenis Tagihan GET Error:', error)
    return apiError('Gagal memuat jenis tagihan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/tagihan', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { kode, nama, nominalDefault, bolehCicil, keterangan, active } = body

    if (!kode?.trim() || !nama?.trim()) {
      return apiError('Kode dan nama pos tagihan wajib diisi.', 400)
    }

    const cleanKode = String(kode).trim().toUpperCase()
    const dup = await prisma.jenisTagihan.findUnique({ where: { kode: cleanKode } })
    if (dup) {
      return apiError(`Kode pos tagihan "${cleanKode}" sudah terdaftar.`, 409)
    }

    const created = await prisma.jenisTagihan.create({
      data: {
        kode: cleanKode,
        nama: String(nama).trim(),
        nominalDefault: Math.max(0, Number(nominalDefault) || 0),
        bolehCicil: bolehCicil !== false,
        keterangan: keterangan ? String(keterangan).trim() : null,
        active: active !== false,
      },
    })

    return apiSuccess({
      message: `Pos tagihan "${created.nama}" berhasil ditambahkan`,
      data: { ...created, nominalDefault: Number(created.nominalDefault) },
      status: 201,
    })
  } catch (error: any) {
    console.error('API Jenis Tagihan POST Error:', error)
    return apiError('Gagal membuat jenis tagihan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/tagihan', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { id, kode, nama, nominalDefault, bolehCicil, keterangan, active } = body

    if (!id) {
      return apiError('ID jenis tagihan wajib disertakan.', 400)
    }

    const existing = await prisma.jenisTagihan.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return apiError('Jenis tagihan tidak ditemukan.', 404)
    }

    const cleanKode = kode ? String(kode).trim().toUpperCase() : existing.kode
    if (cleanKode !== existing.kode) {
      const dup = await prisma.jenisTagihan.findUnique({ where: { kode: cleanKode } })
      if (dup) {
        return apiError(`Kode pos tagihan "${cleanKode}" sudah digunakan.`, 409)
      }
    }

    const updated = await prisma.jenisTagihan.update({
      where: { id: existing.id },
      data: {
        kode: cleanKode,
        nama: nama !== undefined ? String(nama).trim() : existing.nama,
        nominalDefault:
          nominalDefault !== undefined
            ? Math.max(0, Number(nominalDefault) || 0)
            : existing.nominalDefault,
        bolehCicil: bolehCicil !== undefined ? Boolean(bolehCicil) : existing.bolehCicil,
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
      message: `Pos tagihan "${updated.nama}" berhasil diperbarui`,
      data: { ...updated, nominalDefault: Number(updated.nominalDefault) },
    })
  } catch (error: any) {
    console.error('API Jenis Tagihan PUT Error:', error)
    return apiError('Gagal memperbarui jenis tagihan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/tagihan', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))
    if (!id) {
      return apiError('ID jenis tagihan wajib disertakan.', 400)
    }

    const existing = await prisma.jenisTagihan.findUnique({
      where: { id },
      include: { _count: { select: { tagihan: true } } },
    })
    if (!existing) {
      return apiError('Jenis tagihan tidak ditemukan.', 404)
    }
    if (existing._count.tagihan > 0) {
      return apiError(
        `Tidak dapat menghapus jenis tagihan ini karena sudah memiliki ${existing._count.tagihan} tagihan siswa.`,
        400
      )
    }

    await prisma.jenisTagihan.delete({ where: { id } })
    return apiSuccess({ message: `Pos tagihan "${existing.nama}" dihapus` })
  } catch (error: any) {
    console.error('API Jenis Tagihan DELETE Error:', error)
    return apiError('Gagal menghapus jenis tagihan: ' + (error?.message || 'Server error'), 500)
  }
}

