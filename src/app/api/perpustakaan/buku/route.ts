import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/perpustakaan/buku', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim()
    const kategoriId = searchParams.get('kategoriId')
    const tersediaOnly = searchParams.get('tersediaOnly') === 'true'
    const rak = (searchParams.get('rak') || '').trim()

    const where: any = {}
    if (kategoriId && kategoriId !== 'all') {
      where.kategoriId = Number(kategoriId)
    }
    if (tersediaOnly) {
      where.jumlahTersedia = { gt: 0 }
    }
    if (rak && rak !== 'all') {
      where.lokasiRak = { contains: rak, mode: 'insensitive' }
    }
    if (search) {
      where.OR = [
        { kodeBuku: { contains: search, mode: 'insensitive' } },
        { judul: { contains: search, mode: 'insensitive' } },
        { pengarang: { contains: search, mode: 'insensitive' } },
        { penerbit: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        { lokasiRak: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [bukuList, allTotals, kategoriList] = await Promise.all([
      prisma.pustakaBuku.findMany({
        where,
        include: {
          kategori: { select: { id: true, kode: true, nama: true } },
          _count: {
            select: {
              peminjaman: {
                where: { status: { in: ['dipinjam', 'terlambat'] } },
              },
            },
          },
        },
        orderBy: [{ judul: 'asc' }, { id: 'desc' }],
      }),
      prisma.pustakaBuku.aggregate({
        _sum: {
          jumlahTotal: true,
          jumlahTersedia: true,
        },
        _count: {
          id: true,
        },
      }),
      prisma.kategoriBuku.findMany({
        include: { _count: { select: { buku: true } } },
        orderBy: { nama: 'asc' },
      }),
    ])

    const totalJudul = allTotals._count.id || 0
    const totalEksemplar = allTotals._sum.jumlahTotal || 0
    const totalTersedia = allTotals._sum.jumlahTersedia || 0
    const totalDipinjam = totalEksemplar - totalTersedia

    return apiSuccess({
      data: {
        buku: bukuList.map((b) => ({
          id: b.id,
          kodeBuku: b.kodeBuku,
          judul: b.judul,
          pengarang: b.pengarang || '-',
          penerbit: b.penerbit || '-',
          tahunTerbit: b.tahunTerbit || null,
          isbn: b.isbn || '-',
          kategoriId: b.kategoriId,
          kategori: b.kategori,
          lokasiRak: b.lokasiRak || '-',
          jumlahTotal: b.jumlahTotal,
          jumlahTersedia: b.jumlahTersedia,
          sedangDipinjam: b._count.peminjaman,
          coverUrl: b.coverUrl,
          deskripsi: b.deskripsi,
        })),
        stats: {
          totalJudul,
          totalEksemplar,
          totalTersedia,
          totalDipinjam,
        },
        kategoriList: kategoriList.map((k) => ({
          id: k.id,
          kode: k.kode,
          nama: k.nama,
          count: k._count.buku,
        })),
      },
    })
  } catch (error: any) {
    console.error('Error fetching katalog buku:', error)
    return apiError(error.message || 'Gagal memuat katalog buku perpustakaan', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/perpustakaan/buku', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      judul,
      pengarang,
      penerbit,
      tahunTerbit,
      isbn,
      kategoriId,
      lokasiRak,
      jumlahTotal,
      coverUrl,
      deskripsi,
    } = body

    if (!judul || !kategoriId) {
      return apiError('Judul buku dan kategori wajib diisi', 400)
    }

    const totalQty = Math.max(1, Number(jumlahTotal) || 1)

    // Generate kodeBuku otomatis jika tidak disediakan
    const currentYear = new Date().getFullYear()
    const countBooksThisYear = await prisma.pustakaBuku.count()
    const kodeBuku = `BK-${currentYear}-${String(countBooksThisYear + 1).padStart(4, '0')}`

    const newBook = await prisma.pustakaBuku.create({
      data: {
        kodeBuku,
        judul: judul.trim(),
        pengarang: pengarang?.trim() || null,
        penerbit: penerbit?.trim() || null,
        tahunTerbit: tahunTerbit ? Number(tahunTerbit) : null,
        isbn: isbn?.trim() || null,
        kategoriId: Number(kategoriId),
        lokasiRak: lokasiRak?.trim() || null,
        jumlahTotal: totalQty,
        jumlahTersedia: totalQty,
        coverUrl: coverUrl?.trim() || null,
        deskripsi: deskripsi?.trim() || null,
      },
      include: {
        kategori: true,
      },
    })

    return apiSuccess({
      data: newBook,
      message: `Buku "${newBook.judul}" berhasil didaftarkan dengan kode ${newBook.kodeBuku}`,
      status: 201,
    })
  } catch (error: any) {
    console.error('Error creating buku:', error)
    return apiError(error.message || 'Gagal menambahkan data buku', 500)
  }
}

