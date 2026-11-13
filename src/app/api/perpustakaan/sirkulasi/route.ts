import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

const TARIF_DENDA_PER_HARI = 1000 // Rp 1.000 / hari keterlambatan

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/perpustakaan/sirkulasi', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = (searchParams.get('search') || '').trim()
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 1. Sinkronisasi status terlambat dan kalkulasi denda untuk peminjaman aktif yang melewati jatuh tempo
    const now = new Date()
    const activeOverdue = await prisma.pustakaPeminjaman.findMany({
      where: {
        status: 'dipinjam',
        jatuhTempo: { lt: now },
      },
    })

    for (const p of activeOverdue) {
      const diffMs = now.getTime() - new Date(p.jatuhTempo).getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      const nominalDenda = diffDays * TARIF_DENDA_PER_HARI

      await prisma.pustakaPeminjaman.update({
        where: { id: p.id },
        data: {
          status: 'terlambat',
          denda: nominalDenda,
        },
      })
    }

    // 2. Query data sirkulasi
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (startDate || endDate) {
      where.tanggalPinjam = {}
      if (startDate) where.tanggalPinjam.gte = new Date(`${startDate}T00:00:00.000Z`)
      if (endDate) where.tanggalPinjam.lte = new Date(`${endDate}T23:59:59.999Z`)
    }
    if (search) {
      where.OR = [
        { noPeminjaman: { contains: search, mode: 'insensitive' } },
        { buku: { judul: { contains: search, mode: 'insensitive' } } },
        { buku: { kodeBuku: { contains: search, mode: 'insensitive' } } },
        { siswa: { nama: { contains: search, mode: 'insensitive' } } },
        { siswa: { nis: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [loans, statsCounts] = await Promise.all([
      prisma.pustakaPeminjaman.findMany({
        where,
        include: {
          buku: {
            select: {
              id: true,
              kodeBuku: true,
              judul: true,
              pengarang: true,
              penerbit: true,
              coverUrl: true,
              lokasiRak: true,
              kategori: { select: { nama: true } },
            },
          },
          siswa: {
            select: {
              id: true,
              nama: true,
              nis: true,
              nisn: true,
              fotoUrl: true,
              kelas: { select: { namaKelas: true } },
            },
          },
        },
        orderBy: [{ status: 'asc' }, { tanggalPinjam: 'desc' }],
      }),
      prisma.pustakaPeminjaman.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { denda: true },
      }),
    ])

    let countDipinjam = 0
    let countTerlambat = 0
    let countKembali = 0
    let totalDenda = 0

    for (const stat of statsCounts) {
      if (stat.status === 'dipinjam') countDipinjam = stat._count.id
      if (stat.status === 'terlambat') {
        countTerlambat = stat._count.id
        totalDenda += Number(stat._sum.denda || 0)
      }
      if (stat.status === 'kembali') countKembali = stat._count.id
    }

    return apiSuccess({
      data: {
        sirkulasi: loans.map((l) => {
          const isOverdue =
            l.status === 'terlambat' ||
            (l.status === 'dipinjam' && new Date(l.jatuhTempo) < now)
          const terlambatHari = isOverdue
            ? Math.max(
                1,
                Math.ceil(
                  ((l.tanggalKembali ? new Date(l.tanggalKembali).getTime() : now.getTime()) -
                    new Date(l.jatuhTempo).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              )
            : 0

          return {
            id: l.id,
            noPeminjaman: l.noPeminjaman,
            bukuId: l.bukuId,
            buku: l.buku,
            siswaId: l.siswaId,
            siswa: l.siswa,
            tanggalPinjam: l.tanggalPinjam.toISOString(),
            jatuhTempo: l.jatuhTempo.toISOString(),
            tanggalKembali: l.tanggalKembali ? l.tanggalKembali.toISOString() : null,
            status: l.status,
            denda: Number(l.denda),
            dendaDibayar: l.dendaDibayar,
            terlambatHari,
            petugas: l.petugas || 'Staf Perpustakaan',
            catatan: l.catatan,
          }
        }),
        stats: {
          totalSirkulasi: loans.length,
          countDipinjam,
          countTerlambat,
          countKembali,
          totalDenda,
        },
      },
    })
  } catch (error: any) {
    console.error('Error fetching sirkulasi peminjaman:', error)
    return apiError(error.message || 'Gagal memuat data sirkulasi perpustakaan', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/perpustakaan/sirkulasi', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { bukuId, siswaId, nis, durasiHari, catatan, petugas } = body

    if (!bukuId) {
      return apiError('Buku wajib dipilih untuk peminjaman', 400)
    }

    // 1. Tentukan siswa (bisa lewat siswaId langsung atau scan QR nis)
    let targetSiswaId = siswaId ? Number(siswaId) : null

    if (!targetSiswaId && nis) {
      const cleanNis = String(nis).trim()
      const siswaFound = await prisma.siswa.findUnique({
        where: { nis: cleanNis },
        select: { id: true, nama: true, status: true },
      })

      if (!siswaFound) {
        return apiError(`Siswa dengan NIS/QR "${cleanNis}" tidak ditemukan`, 404)
      }
      if (siswaFound.status !== 'aktif') {
        return apiError(`Siswa ${siswaFound.nama} tidak aktif (${siswaFound.status})`, 400)
      }
      targetSiswaId = siswaFound.id
    }

    if (!targetSiswaId) {
      return apiError('Data siswa (ID atau scan QR NIS) wajib disertakan', 400)
    }

    // 2. Cek ketersediaan buku
    const targetBook = await prisma.pustakaBuku.findUnique({
      where: { id: Number(bukuId) },
    })

    if (!targetBook) {
      return apiError('Buku tidak ditemukan', 404)
    }

    if (targetBook.jumlahTersedia <= 0) {
      return apiError(`Stok buku "${targetBook.judul}" sedang habis / seluruh eksemplar sedang dipinjam`, 400)
    }

    // 3. Cek apakah siswa ini sudah meminjam judul buku yang sama dan belum dikembalikan
    const existingBorrow = await prisma.pustakaPeminjaman.findFirst({
      where: {
        bukuId: targetBook.id,
        siswaId: targetSiswaId,
        status: { in: ['dipinjam', 'terlambat'] },
      },
    })

    if (existingBorrow) {
      return apiError(`Siswa ini sudah meminjam buku "${targetBook.judul}" dan belum mengembalikannya`, 400)
    }

    // 4. Hitung tanggal jatuh tempo (default 7 hari)
    const pinjamDays = Math.max(1, Number(durasiHari) || 7)
    const tglPinjam = new Date()
    const tglJatuhTempo = new Date(tglPinjam.getTime() + pinjamDays * 24 * 60 * 60 * 1000)

    // Generate noPeminjaman
    const yyyymm = `${tglPinjam.getFullYear()}${String(tglPinjam.getMonth() + 1).padStart(2, '0')}`
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const noPeminjaman = `PJM-${yyyymm}-${randomSuffix}`

    // 5. Simpan transaksi peminjaman & kurangi stok buku dalam Prisma Transaction
    const [peminjaman] = await prisma.$transaction([
      prisma.pustakaPeminjaman.create({
        data: {
          noPeminjaman,
          bukuId: targetBook.id,
          siswaId: targetSiswaId,
          tanggalPinjam: tglPinjam,
          jatuhTempo: tglJatuhTempo,
          status: 'dipinjam',
          petugas: petugas || 'Staf Perpustakaan',
          catatan: catatan?.trim() || null,
        },
        include: {
          buku: true,
          siswa: true,
        },
      }),
      prisma.pustakaBuku.update({
        where: { id: targetBook.id },
        data: {
          jumlahTersedia: { decrement: 1 },
        },
      }),
    ])

    return apiSuccess({
      data: peminjaman,
      message: `Peminjaman buku "${targetBook.judul}" untuk ${peminjaman.siswa.nama} berhasil dicatat (Jatuh tempo: ${tglJatuhTempo.toLocaleDateString(
        'id-ID'
      )})`,
      status: 201,
    })
  } catch (error: any) {
    console.error('Error creating peminjaman:', error)
    return apiError(error.message || 'Gagal memproses peminjaman buku', 500)
  }
}

