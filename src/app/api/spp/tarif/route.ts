import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get('jenjangId')
    const tahunAjaran = searchParams.get('tahunAjaran')

    const where: any = {}
    if (jenjangId) where.jenjangId = parseInt(jenjangId, 10)
    if (tahunAjaran) where.tahunAjaran = tahunAjaran

    const tarifList = await prisma.sppTarif.findMany({
      where,
      orderBy: [
        { jenjang: { urutan: 'asc' } },
        { tahunAjaran: 'desc' },
        { id: 'asc' },
      ],
      include: {
        jenjang: true,
        tingkat: true,
      },
    })

    return apiSuccess({
      message: 'Master tarif SPP berhasil dimuat',
      data: tarifList.map((t) => ({
        ...t,
        nominal: Number(t.nominal),
      })),
    })
  } catch (error: any) {
    console.error('API SPP Tarif GET Error:', error)
    return apiError('Gagal memuat master tarif SPP: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      jenjangId,
      tingkatId,
      tahunAjaran,
      namaTarif,
      nominal,
      keterangan,
    } = body

    if (!jenjangId || nominal === undefined || nominal === null) {
      return apiError('Jenjang dan besaran Nominal tarif wajib diisi', 400)
    }

    const created = await prisma.sppTarif.create({
      data: {
        jenjangId: parseInt(jenjangId, 10),
        tingkatId: tingkatId ? parseInt(tingkatId, 10) : null,
        tahunAjaran: tahunAjaran ? String(tahunAjaran).trim() : '2024/2025',
        namaTarif: namaTarif ? String(namaTarif).trim() : 'SPP Bulanan',
        nominal: parseFloat(nominal),
        keterangan: keterangan ? String(keterangan).trim() : null,
        active: true,
      },
      include: {
        jenjang: true,
        tingkat: true,
      },
    })

    return apiSuccess({
      message: 'Tarif SPP berhasil ditambahkan',
      data: {
        ...created,
        nominal: Number(created.nominal),
      },
      status: 201,
    })
  } catch (error: any) {
    console.error('API SPP Tarif POST Error:', error)
    return apiError('Gagal menambahkan tarif SPP: ' + (error?.message || 'Server error'), 500)
  }
}
