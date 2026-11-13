import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

// GET /api/sarpras/ruangan
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/sarpras/ruangan', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim()
    const gedung = (searchParams.get('gedung') || '').trim()
    const kategori = (searchParams.get('kategori') || '').trim()
    const kondisi = (searchParams.get('kondisi') || '').trim()

    const where: any = { active: true }

    if (gedung && gedung !== 'all') {
      where.gedung = { contains: gedung, mode: 'insensitive' }
    }
    if (kategori && kategori !== 'all') {
      where.kategori = kategori
    }
    if (kondisi && kondisi !== 'all') {
      where.kondisi = kondisi
    }
    if (search) {
      where.OR = [
        { kodeRuangan: { contains: search, mode: 'insensitive' } },
        { namaRuangan: { contains: search, mode: 'insensitive' } },
        { gedung: { contains: search, mode: 'insensitive' } },
        { keterangan: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [ruanganList, allRuangan, listGedung] = await Promise.all([
      prisma.sarprasRuangan.findMany({
        where,
        include: {
          pjPegawai: {
            select: { id: true, nama: true, nip: true, jabatan: true, kontak: true },
          },
          barang: {
            select: {
              id: true,
              namaBarang: true,
              jumlahTotal: true,
              hargaPerolehan: true,
              kondisiUtama: true,
            },
          },
          _count: {
            select: { barang: true },
          },
        },
        orderBy: [{ gedung: 'asc' }, { kodeRuangan: 'asc' }],
      }),
      prisma.sarprasRuangan.findMany({
        where: { active: true },
        select: {
          id: true,
          kapasitas: true,
          kondisi: true,
          barang: {
            select: {
              jumlahTotal: true,
              hargaPerolehan: true,
            },
          },
        },
      }),
      prisma.sarprasRuangan.findMany({
        where: { active: true, gedung: { not: null } },
        select: { gedung: true },
        distinct: ['gedung'],
      }),
    ])

    // Hitung KPI
    const totalRuangan = allRuangan.length
    const totalKapasitas = allRuangan.reduce((sum, r) => sum + (r.kapasitas || 0), 0)
    const kondisiBaik = allRuangan.filter((r) => r.kondisi === 'baik').length
    const butuhPerbaikan = allRuangan.filter((r) => r.kondisi !== 'baik').length

    // Hitung total barang dan nilai aset per ruangan
    const formatted = ruanganList.map((r) => {
      const totalUnitBarang = r.barang.reduce((s, b) => s + b.jumlahTotal, 0)
      const totalNilaiAset = r.barang.reduce((s, b) => {
        const hrg = Number(b.hargaPerolehan || 0)
        return s + hrg * b.jumlahTotal
      }, 0)

      return {
        id: r.id,
        kodeRuangan: r.kodeRuangan,
        namaRuangan: r.namaRuangan,
        gedung: r.gedung,
        lantai: r.lantai,
        kapasitas: r.kapasitas,
        luasM2: r.luasM2 ? Number(r.luasM2) : null,
        kategori: r.kategori,
        kondisi: r.kondisi,
        pjPegawaiId: r.pjPegawaiId,
        pjPegawai: r.pjPegawai,
        keterangan: r.keterangan,
        jumlahJenisBarang: r._count.barang,
        totalUnitBarang,
        totalNilaiAset,
        barang: r.barang,
        createdAt: r.createdAt,
      }
    })

    return apiSuccess({
      data: {
        ruangan: formatted,
        stats: {
          totalRuangan,
          totalKapasitas,
          kondisiBaik,
          butuhPerbaikan,
        },
        gedungList: listGedung.map((g) => g.gedung).filter(Boolean),
      },
    })
  } catch (error: any) {
    console.error('Error fetching ruangan:', error)
    return apiError(error.message || 'Gagal memuat data ruangan sarpras', 500)
  }
}

// POST /api/sarpras/ruangan
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/sarpras/ruangan', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      kodeRuangan,
      namaRuangan,
      gedung,
      lantai,
      kapasitas,
      luasM2,
      kategori,
      kondisi,
      pjPegawaiId,
      keterangan,
    } = body

    if (!kodeRuangan || !namaRuangan) {
      return apiError('Kode ruangan dan nama ruangan wajib diisi', 400)
    }

    // Cek duplikasi kode ruangan
    const exists = await prisma.sarprasRuangan.findUnique({
      where: { kodeRuangan: kodeRuangan.trim().toUpperCase() },
    })
    if (exists) {
      return apiError(`Kode ruangan "${kodeRuangan}" sudah terdaftar`, 409)
    }

    const created = await prisma.sarprasRuangan.create({
      data: {
        kodeRuangan: kodeRuangan.trim().toUpperCase(),
        namaRuangan: namaRuangan.trim(),
        gedung: gedung ? gedung.trim() : null,
        lantai: lantai ? Number(lantai) : 1,
        kapasitas: kapasitas ? Number(kapasitas) : 36,
        luasM2: luasM2 ? Number(luasM2) : null,
        kategori: kategori || 'kelas',
        kondisi: kondisi || 'baik',
        pjPegawaiId: pjPegawaiId ? Number(pjPegawaiId) : null,
        keterangan: keterangan ? keterangan.trim() : null,
      },
      include: {
        pjPegawai: { select: { id: true, nama: true, jabatan: true } },
      },
    })

    return apiSuccess({
      data: created,
      message: 'Data ruangan berhasil ditambahkan',
      status: 201,
    })
  } catch (error: any) {
    console.error('Error creating ruangan:', error)
    return apiError(error.message || 'Gagal menambahkan data ruangan', 500)
  }
}

