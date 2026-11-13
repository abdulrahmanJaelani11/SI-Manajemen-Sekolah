import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

// GET /api/sarpras/kategori
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/sarpras/barang', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const kategori = await prisma.sarprasKategoriBarang.findMany({
      include: {
        _count: { select: { barang: true } },
      },
      orderBy: { nama: 'asc' },
    })

    const data = kategori.map((k) => ({
      id: k.id,
      kode: k.kode,
      nama: k.nama,
      keterangan: k.keterangan,
      count: k._count.barang,
    }))

    return apiSuccess({ data })
  } catch (error: any) {
    console.error('Error fetching kategori sarpras:', error)
    return apiError(error.message || 'Gagal mengambil kategori barang', 500)
  }
}

