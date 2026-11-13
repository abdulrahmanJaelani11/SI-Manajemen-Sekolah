import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'
import { logAudit } from '@/lib/audit-logger'

// GET /api/akademik/kalender
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/kalender', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim()
    const kategori = (searchParams.get('kategori') || '').trim()
    const tahunAjaran = (searchParams.get('tahunAjaran') || '').trim()
    const sasaran = (searchParams.get('sasaran') || '').trim()
    const bulan = searchParams.get('bulan') // 1 - 12
    const tahun = searchParams.get('tahun') // YYYY

    const where: any = {}

    if (kategori && kategori !== 'all') {
      where.kategori = kategori
    }
    if (tahunAjaran && tahunAjaran !== 'all') {
      where.tahunAjaran = tahunAjaran
    }
    if (sasaran && sasaran !== 'all') {
      where.sasaran = sasaran
    }

    // Filter rentang bulan & tahun jika dipilih
    if (bulan && tahun) {
      const m = Number(bulan)
      const y = Number(tahun)
      const startOfMonth = new Date(Date.UTC(y, m - 1, 1))
      const endOfMonth = new Date(Date.UTC(y, m, 0, 23, 59, 59))

      where.OR = [
        {
          tanggalMulai: { lte: endOfMonth },
          tanggalSelesai: { gte: startOfMonth },
        },
      ]
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { judul: { contains: search, mode: 'insensitive' } },
            { deskripsi: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    const [events, allEvents, listTahunAjaran] = await Promise.all([
      prisma.akademikKalender.findMany({
        where,
        orderBy: [{ tanggalMulai: 'asc' }, { id: 'asc' }],
      }),
      prisma.akademikKalender.findMany({
        select: {
          id: true,
          kategori: true,
          liburSekolah: true,
          tanggalMulai: true,
          tanggalSelesai: true,
        },
      }),
      prisma.akademikKalender.findMany({
        select: { tahunAjaran: true },
        distinct: ['tahunAjaran'],
      }),
    ])

    // KPI Stats
    const totalAgenda = allEvents.length
    const totalUjian = allEvents.filter((e) => e.kategori === 'ujian').length
    const totalLibur = allEvents.filter((e) => e.liburSekolah || e.kategori === 'libur').length
    const totalKegiatan = allEvents.filter((e) => ['kegiatan', 'ekstrakurikuler', 'upacara'].includes(e.kategori)).length

    return apiSuccess({
      data: {
        events,
        stats: {
          totalAgenda,
          totalUjian,
          totalLibur,
          totalKegiatan,
        },
        tahunAjaranList: listTahunAjaran.map((t) => t.tahunAjaran).filter(Boolean),
      },
    })
  } catch (error: any) {
    console.error('Error fetching kalender:', error)
    return apiError(error.message || 'Gagal memuat kalender akademik', 500)
  }
}

// POST /api/akademik/kalender
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/kalender', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      judul,
      deskripsi,
      tanggalMulai,
      tanggalSelesai,
      kategori,
      warna,
      tahunAjaran,
      semester,
      sasaran,
      liburSekolah,
      isPublic,
    } = body

    if (!judul || !tanggalMulai || !tanggalSelesai) {
      return apiError('Judul agenda, tanggal mulai, dan tanggal selesai wajib diisi', 400)
    }

    const startDate = new Date(tanggalMulai)
    const endDate = new Date(tanggalSelesai)

    if (endDate < startDate) {
      return apiError('Tanggal selesai tidak boleh lebih awal dari tanggal mulai', 400)
    }

    const created = await prisma.akademikKalender.create({
      data: {
        judul: judul.trim(),
        deskripsi: deskripsi ? deskripsi.trim() : null,
        tanggalMulai: startDate,
        tanggalSelesai: endDate,
        kategori: kategori || 'akademik',
        warna: warna || '#3b82f6',
        tahunAjaran: tahunAjaran ? tahunAjaran.trim() : '2024/2025',
        semester: semester || 'ganjil',
        sasaran: sasaran || 'semua',
        liburSekolah: Boolean(liburSekolah),
        isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
      },
    })

    // Rekam Audit Trail
    await logAudit({
      request,
      userId: auth.user.userId,
      username: auth.user.username,
      namaUser: auth.user.namaLengkap,
      role: auth.user.roleName,
      modul: 'AKADEMIK',
      aksi: 'CREATE',
      deskripsi: `Menambahkan agenda kalender akademik baru "${created.judul}" (${created.tahunAjaran})`,
      dataSesudah: created,
    })

    return apiSuccess({
      data: created,
      message: 'Agenda kalender akademik berhasil ditambahkan',
      status: 201,
    })
  } catch (error: any) {
    console.error('Error creating kalender event:', error)
    return apiError(error.message || 'Gagal menambahkan agenda kalender', 500)
  }
}

