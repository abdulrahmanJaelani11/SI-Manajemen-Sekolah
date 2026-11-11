import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tarifId = parseInt(id, 10)
    if (isNaN(tarifId)) return apiError('ID tidak valid', 400)

    const body = await request.json()
    const {
      jenjangId,
      tingkatId,
      tahunAjaran,
      namaTarif,
      nominal,
      keterangan,
      active,
    } = body

    const updated = await prisma.sppTarif.update({
      where: { id: tarifId },
      data: {
        ...(jenjangId ? { jenjangId: parseInt(jenjangId, 10) } : {}),
        tingkatId: tingkatId !== undefined ? (tingkatId ? parseInt(tingkatId, 10) : null) : undefined,
        ...(tahunAjaran ? { tahunAjaran: String(tahunAjaran).trim() } : {}),
        ...(namaTarif ? { namaTarif: String(namaTarif).trim() } : {}),
        ...(nominal !== undefined ? { nominal: parseFloat(nominal) } : {}),
        keterangan: keterangan !== undefined ? (keterangan ? String(keterangan).trim() : null) : undefined,
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    })

    return apiSuccess({
      message: 'Tarif SPP berhasil diperbarui',
      data: {
        ...updated,
        nominal: Number(updated.nominal),
      },
    })
  } catch (error: any) {
    console.error('API SPP Tarif PUT Error:', error)
    return apiError('Gagal memperbarui tarif SPP: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tarifId = parseInt(id, 10)
    if (isNaN(tarifId)) return apiError('ID tidak valid', 400)

    await prisma.sppTarif.delete({
      where: { id: tarifId },
    })

    return apiSuccess({
      message: 'Tarif SPP berhasil dihapus',
      data: null,
    })
  } catch (error: any) {
    console.error('API SPP Tarif DELETE Error:', error)
    return apiError('Gagal menghapus tarif SPP: ' + (error?.message || 'Server error'), 500)
  }
}
