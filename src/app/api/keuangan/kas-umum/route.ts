import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/kas-umum', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const jenis = searchParams.get('jenis')
    const kategoriId = searchParams.get('kategoriId')
    const metode = searchParams.get('metode')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = (searchParams.get('search') || '').trim()

    const where: any = {}
    if (jenis && jenis !== 'all') where.jenis = jenis
    if (kategoriId && kategoriId !== 'all') where.kategoriId = Number(kategoriId)
    if (metode && metode !== 'all') where.metode = metode
    if (startDate || endDate) {
      where.tanggal = {}
      if (startDate) where.tanggal.gte = new Date(`${startDate}T00:00:00.000Z`)
      if (endDate) where.tanggal.lte = new Date(`${endDate}T23:59:59.999Z`)
    }
    if (search) {
      where.OR = [
        { noBukti: { contains: search, mode: 'insensitive' } },
        { uraian: { contains: search, mode: 'insensitive' } },
        { pihakTerkait: { contains: search, mode: 'insensitive' } },
        { kategori: { nama: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [transaksiRaw, allTotalsRaw, kategoriList] = await Promise.all([
      prisma.kasTransaksi.findMany({
        where,
        include: { kategori: true },
        orderBy: [{ tanggal: 'desc' }, { id: 'desc' }],
      }),
      prisma.kasTransaksi.findMany({
        select: { jenis: true, nominal: true },
      }),
      prisma.kategoriKas.findMany({
        include: { _count: { select: { transaksi: true } } },
        orderBy: [{ jenis: 'asc' }, { kode: 'asc' }],
      }),
    ])

    let totalPemasukan = 0
    let totalPengeluaran = 0
    for (const r of allTotalsRaw) {
      if (r.jenis === 'pemasukan') {
        totalPemasukan += Number(r.nominal)
      } else {
        totalPengeluaran += Number(r.nominal)
      }
    }

    return apiSuccess({
      message: 'Data kas umum berhasil dimuat',
      data: {
        transaksiList: transaksiRaw.map((t) => ({
          ...t,
          nominal: Number(t.nominal),
        })),
        stats: {
          totalPemasukan,
          totalPengeluaran,
          saldoKasUmum: totalPemasukan - totalPengeluaran,
          totalTransaksi: allTotalsRaw.length,
        },
        kategoriList,
      },
    })
  } catch (error: any) {
    console.error('API Kas Umum GET Error:', error)
    return apiError('Gagal memuat kas umum: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/kas-umum', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { kategoriId, tanggal, nominal, metode, pihakTerkait, uraian, lampiranUrl } = body

    if (!kategoriId || !tanggal || !uraian?.trim()) {
      return apiError('Kategori kas, tanggal transaksi, dan uraian wajib diisi.', 400)
    }

    const parsedNominal = Number(nominal)
    if (Number.isNaN(parsedNominal) || parsedNominal <= 0) {
      return apiError('Nominal transaksi harus lebih dari Rp 0.', 400)
    }

    const parsedDate = new Date(tanggal)
    if (Number.isNaN(parsedDate.getTime())) {
      return apiError('Format tanggal transaksi tidak valid.', 400)
    }

    const kategori = await prisma.kategoriKas.findUnique({ where: { id: Number(kategoriId) } })
    if (!kategori) {
      return apiError('Kategori kas tidak ditemukan.', 404)
    }

    const prefix = kategori.jenis === 'pemasukan' ? 'KM' : 'KK'
    const ymd = String(tanggal).slice(0, 10).replace(/-/g, '')
    const lastRow = await prisma.kasTransaksi.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    })
    let seq = (lastRow?.id || 0) + 1
    let noBukti = `${prefix}-${ymd}-${String(seq).padStart(4, '0')}`
    while (await prisma.kasTransaksi.findUnique({ where: { noBukti }, select: { id: true } })) {
      seq += 1
      noBukti = `${prefix}-${ymd}-${String(seq).padStart(4, '0')}`
    }

    const created = await prisma.kasTransaksi.create({
      data: {
        noBukti,
        kategoriId: kategori.id,
        jenis: kategori.jenis,
        tanggal: parsedDate,
        nominal: parsedNominal,
        metode: metode || 'Tunai',
        pihakTerkait: pihakTerkait ? String(pihakTerkait).trim() : null,
        uraian: String(uraian).trim(),
        lampiranUrl: lampiranUrl ? String(lampiranUrl).trim() : null,
        dicatatOleh: auth.user.namaLengkap || auth.user.username,
      },
      include: { kategori: true },
    })

    return apiSuccess({
      message: `Transaksi ${created.noBukti} berhasil dicatat`,
      data: { ...created, nominal: Number(created.nominal) },
      status: 201,
    })
  } catch (error: any) {
    console.error('API Kas Umum POST Error:', error)
    return apiError('Gagal mencatat transaksi kas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/kas-umum', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { id, kategoriId, tanggal, nominal, metode, pihakTerkait, uraian, lampiranUrl } = body

    if (!id) {
      return apiError('ID transaksi wajib disertakan.', 400)
    }

    const existing = await prisma.kasTransaksi.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return apiError('Transaksi kas tidak ditemukan.', 404)
    }

    let targetJenis = existing.jenis
    let targetKatId = existing.kategoriId
    if (kategoriId !== undefined && Number(kategoriId) !== existing.kategoriId) {
      const kat = await prisma.kategoriKas.findUnique({ where: { id: Number(kategoriId) } })
      if (!kat) return apiError('Kategori kas baru tidak ditemukan.', 404)
      targetKatId = kat.id
      targetJenis = kat.jenis
    }

    const parsedNominal = nominal !== undefined ? Number(nominal) : Number(existing.nominal)
    if (Number.isNaN(parsedNominal) || parsedNominal <= 0) {
      return apiError('Nominal transaksi tidak valid.', 400)
    }

    const updated = await prisma.kasTransaksi.update({
      where: { id: existing.id },
      data: {
        kategoriId: targetKatId,
        jenis: targetJenis,
        tanggal: tanggal ? new Date(tanggal) : existing.tanggal,
        nominal: parsedNominal,
        metode: metode || existing.metode,
        pihakTerkait:
          pihakTerkait !== undefined
            ? pihakTerkait
              ? String(pihakTerkait).trim()
              : null
            : existing.pihakTerkait,
        uraian: uraian !== undefined ? String(uraian).trim() : existing.uraian,
        lampiranUrl:
          lampiranUrl !== undefined
            ? lampiranUrl
              ? String(lampiranUrl).trim()
              : null
            : existing.lampiranUrl,
      },
      include: { kategori: true },
    })

    return apiSuccess({
      message: `Transaksi ${updated.noBukti} berhasil diperbarui`,
      data: { ...updated, nominal: Number(updated.nominal) },
    })
  } catch (error: any) {
    console.error('API Kas Umum PUT Error:', error)
    return apiError('Gagal memperbarui transaksi kas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/kas-umum', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))
    if (!id) {
      return apiError('ID transaksi wajib disertakan.', 400)
    }

    const existing = await prisma.kasTransaksi.findUnique({ where: { id } })
    if (!existing) {
      return apiError('Transaksi kas tidak ditemukan.', 404)
    }

    await prisma.kasTransaksi.delete({ where: { id } })
    return apiSuccess({ message: `Transaksi ${existing.noBukti} berhasil dihapus` })
  } catch (error: any) {
    console.error('API Kas Umum DELETE Error:', error)
    return apiError('Gagal menghapus transaksi kas: ' + (error?.message || 'Server error'), 500)
  }
}

