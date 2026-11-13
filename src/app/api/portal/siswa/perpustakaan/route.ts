import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { verifyToken, JwtPayloadSiswa } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    let token: string | null = null
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
    if (!token) {
      token = request.cookies.get('siswa_token')?.value || null
    }

    if (!token) {
      return apiError('Sesi siswa belum terotentikasi', 401)
    }

    const decoded = verifyToken<JwtPayloadSiswa>(token)
    if (!decoded || decoded.role !== 'siswa' || !decoded.siswaId) {
      return apiError('Token tidak valid atau bukan sesi siswa', 401)
    }

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim()
    const kategoriId = searchParams.get('kategoriId')

    const now = new Date()

    // 1. Peminjaman siswa
    const myLoans = await prisma.pustakaPeminjaman.findMany({
      where: {
        siswaId: decoded.siswaId,
      },
      include: {
        buku: {
          include: {
            kategori: true,
          },
        },
      },
      orderBy: [{ tanggalPinjam: 'desc' }],
    })

    const peminjamanAktif = myLoans
      .filter((l) => l.status === 'dipinjam' || l.status === 'terlambat')
      .map((l) => {
        const isOverdue = now > new Date(l.jatuhTempo)
        const sisaHari = Math.ceil(
          (new Date(l.jatuhTempo).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return {
          id: l.id,
          noPeminjaman: l.noPeminjaman,
          buku: l.buku,
          tanggalPinjam: l.tanggalPinjam.toISOString(),
          jatuhTempo: l.jatuhTempo.toISOString(),
          status: isOverdue ? 'terlambat' : l.status,
          sisaHari: isOverdue ? 0 : sisaHari,
          terlambatHari: isOverdue ? Math.abs(sisaHari) : 0,
          denda: Number(l.denda),
        }
      })

    const riwayatPeminjaman = myLoans
      .filter((l) => l.status === 'kembali')
      .map((l) => ({
        id: l.id,
        noPeminjaman: l.noPeminjaman,
        buku: l.buku,
        tanggalPinjam: l.tanggalPinjam.toISOString(),
        jatuhTempo: l.jatuhTempo.toISOString(),
        tanggalKembali: l.tanggalKembali ? l.tanggalKembali.toISOString() : null,
        status: l.status,
        denda: Number(l.denda),
        dendaDibayar: l.dendaDibayar,
      }))

    // 2. Katalog buku perpustakaan untuk dijelajahi siswa
    const bookWhere: any = {}
    if (kategoriId && kategoriId !== 'all') {
      bookWhere.kategoriId = Number(kategoriId)
    }
    if (search) {
      bookWhere.OR = [
        { judul: { contains: search, mode: 'insensitive' } },
        { pengarang: { contains: search, mode: 'insensitive' } },
        { penerbit: { contains: search, mode: 'insensitive' } },
        { kodeBuku: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [katalogBuku, listKategori] = await Promise.all([
      prisma.pustakaBuku.findMany({
        where: bookWhere,
        include: {
          kategori: { select: { id: true, nama: true } },
        },
        orderBy: { judul: 'asc' },
        take: 50,
      }),
      prisma.kategoriBuku.findMany({
        orderBy: { nama: 'asc' },
      }),
    ])

    return apiSuccess({
      data: {
        peminjamanAktif,
        riwayatPeminjaman,
        katalogBuku: katalogBuku.map((b) => ({
          id: b.id,
          kodeBuku: b.kodeBuku,
          judul: b.judul,
          pengarang: b.pengarang || '-',
          penerbit: b.penerbit || '-',
          tahunTerbit: b.tahunTerbit,
          kategori: b.kategori.nama,
          lokasiRak: b.lokasiRak || '-',
          jumlahTotal: b.jumlahTotal,
          jumlahTersedia: b.jumlahTersedia,
          isAvailable: b.jumlahTersedia > 0,
          coverUrl: b.coverUrl,
          deskripsi: b.deskripsi,
        })),
        kategoriList: listKategori.map((k) => ({
          id: k.id,
          nama: k.nama,
        })),
      },
    })
  } catch (error: any) {
    console.error('Error fetching portal perpustakaan siswa:', error)
    return apiError(error.message || 'Gagal memuat data perpustakaan siswa', 500)
  }
}

