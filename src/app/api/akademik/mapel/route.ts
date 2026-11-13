import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/mapel', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const kelompok = searchParams.get('kelompok')?.trim() || ''
    const jenjangId = searchParams.get('jenjangId')

    const where: any = {}
    if (kelompok) where.kelompok = kelompok
    if (jenjangId) where.jenjangId = parseInt(jenjangId, 10)
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { kode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [mapelList, jenjangList, jurusanList, kelasList, guruList, activePeriod] =
      await Promise.all([
        prisma.mataPelajaran.findMany({
          where,
          orderBy: [{ kelompok: 'asc' }, { nama: 'asc' }],
          include: {
            jenjang: true,
            jurusan: true,
            _count: {
              select: { pengampu: true, jadwal: true },
            },
          },
        }),
        prisma.refJenjang.findMany({
          where: { active: true },
          orderBy: { urutan: 'asc' },
        }),
        prisma.jurusan.findMany({
          where: { active: true },
          orderBy: { namaJurusan: 'asc' },
        }),
        prisma.kelas.findMany({
          where: { active: true },
          orderBy: [{ jenjang: { urutan: 'asc' } }, { namaKelas: 'asc' }],
          include: { jenjang: true, jurusan: true },
        }),
        prisma.pegawai.findMany({
          where: { active: true },
          orderBy: [{ jenisPegawai: 'asc' }, { nama: 'asc' }],
        }),
        prisma.tahunAjaran.findFirst({ where: { isActive: true } }),
      ])

    return apiSuccess({
      message: 'Data mata pelajaran berhasil dimuat',
      data: {
        mapelList,
        jenjangList,
        jurusanList,
        kelasList,
        guruList,
        activePeriod,
      },
    })
  } catch (error: any) {
    console.error('API Mapel GET Error:', error)
    return apiError('Gagal memuat mata pelajaran: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/mapel', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      kode,
      nama,
      kelompok = 'Umum',
      kkm = 75,
      jenjangId,
      jurusanId,
      deskripsi,
      active = true,
    } = body

    const cleanKode = String(kode || '').trim().toUpperCase()
    const cleanNama = String(nama || '').trim()

    if (!cleanKode || !cleanNama) {
      return apiError('Kode dan Nama Mata Pelajaran wajib diisi', 400)
    }

    const exists = await prisma.mataPelajaran.findUnique({
      where: { kode: cleanKode },
    })
    if (exists) {
      return apiError(`Kode mata pelajaran "${cleanKode}" sudah terdaftar`, 400)
    }

    const created = await prisma.mataPelajaran.create({
      data: {
        kode: cleanKode,
        nama: cleanNama,
        kelompok,
        kkm: Math.min(100, Math.max(0, Number(kkm) || 75)),
        jenjangId: jenjangId ? Number(jenjangId) : null,
        jurusanId: jurusanId ? Number(jurusanId) : null,
        deskripsi: deskripsi ? String(deskripsi).trim() : null,
        active: Boolean(active),
      },
      include: {
        jenjang: true,
        jurusan: true,
      },
    })

    return apiSuccess({
      message: 'Mata pelajaran berhasil ditambahkan',
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Mapel POST Error:', error)
    return apiError('Gagal menambahkan mata pelajaran: ' + (error?.message || 'Server error'), 500)
  }
}

