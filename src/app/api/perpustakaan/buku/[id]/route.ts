import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/perpustakaan/buku', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const bookId = Number(id)
    if (isNaN(bookId)) return apiError('ID Buku tidak valid', 400)

    const buku = await prisma.pustakaBuku.findUnique({
      where: { id: bookId },
      include: {
        kategori: true,
        peminjaman: {
          include: {
            siswa: {
              select: {
                id: true,
                nama: true,
                nis: true,
                kelas: { select: { namaKelas: true } },
              },
            },
          },
          orderBy: { tanggalPinjam: 'desc' },
          take: 20,
        },
      },
    })

    if (!buku) return apiError('Buku tidak ditemukan', 404)

    return apiSuccess({ data: buku })
  } catch (error: any) {
    console.error('Error fetching detail buku:', error)
    return apiError(error.message || 'Gagal memuat detail buku', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/perpustakaan/buku', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const bookId = Number(id)
    if (isNaN(bookId)) return apiError('ID Buku tidak valid', 400)

    const existing = await prisma.pustakaBuku.findUnique({
      where: { id: bookId },
    })
    if (!existing) return apiError('Buku tidak ditemukan', 404)

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

    // Jika jumlahTotal diubah, perhitungkan selisih untuk jumlahTersedia
    let newJumlahTotal = existing.jumlahTotal
    let newJumlahTersedia = existing.jumlahTersedia

    if (jumlahTotal !== undefined) {
      const parsedQty = Math.max(1, Number(jumlahTotal))
      const diff = parsedQty - existing.jumlahTotal
      newJumlahTotal = parsedQty
      newJumlahTersedia = Math.max(0, existing.jumlahTersedia + diff)
    }

    const updated = await prisma.pustakaBuku.update({
      where: { id: bookId },
      data: {
        judul: judul?.trim() ?? existing.judul,
        pengarang: pengarang !== undefined ? pengarang?.trim() : existing.pengarang,
        penerbit: penerbit !== undefined ? penerbit?.trim() : existing.penerbit,
        tahunTerbit: tahunTerbit !== undefined ? Number(tahunTerbit) : existing.tahunTerbit,
        isbn: isbn !== undefined ? isbn?.trim() : existing.isbn,
        kategoriId: kategoriId !== undefined ? Number(kategoriId) : existing.kategoriId,
        lokasiRak: lokasiRak !== undefined ? lokasiRak?.trim() : existing.lokasiRak,
        jumlahTotal: newJumlahTotal,
        jumlahTersedia: newJumlahTersedia,
        coverUrl: coverUrl !== undefined ? coverUrl?.trim() : existing.coverUrl,
        deskripsi: deskripsi !== undefined ? deskripsi?.trim() : existing.deskripsi,
      },
      include: {
        kategori: true,
      },
    })

    return apiSuccess({
      data: updated,
      message: 'Data buku berhasil diperbarui',
    })
  } catch (error: any) {
    console.error('Error updating buku:', error)
    return apiError(error.message || 'Gagal memperbarui data buku', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/perpustakaan/buku', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const bookId = Number(id)
    if (isNaN(bookId)) return apiError('ID Buku tidak valid', 400)

    // Cek apakah ada peminjaman aktif
    const activeBorrow = await prisma.pustakaPeminjaman.findFirst({
      where: {
        bukuId: bookId,
        status: { in: ['dipinjam', 'terlambat'] },
      },
    })

    if (activeBorrow) {
      return apiError(
        'Buku tidak dapat dihapus karena masih sedang dipinjam oleh siswa',
        400
      )
    }

    await prisma.pustakaBuku.delete({
      where: { id: bookId },
    })

    return apiSuccess({
      message: 'Buku berhasil dihapus dari perpustakaan',
    })
  } catch (error: any) {
    console.error('Error deleting buku:', error)
    return apiError(error.message || 'Gagal menghapus buku', 500)
  }
}
