import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

const TARIF_DENDA_PER_HARI = 1000

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/perpustakaan/sirkulasi', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const loanId = Number(id)
    if (isNaN(loanId)) return apiError('ID Peminjaman tidak valid', 400)

    const loan = await prisma.pustakaPeminjaman.findUnique({
      where: { id: loanId },
      include: {
        buku: true,
        siswa: true,
      },
    })

    if (!loan) return apiError('Data peminjaman tidak ditemukan', 404)
    if (loan.status === 'kembali') {
      return apiError('Buku ini sudah dikembalikan sebelumnya', 400)
    }

    const body = await request.json().catch(() => ({}))
    const { dendaDibayar, catatan } = body

    const now = new Date()
    let denda = 0
    let terlambatHari = 0

    if (now > new Date(loan.jatuhTempo)) {
      const diffMs = now.getTime() - new Date(loan.jatuhTempo).getTime()
      terlambatHari = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      denda = terlambatHari * TARIF_DENDA_PER_HARI
    }

    const [updatedLoan] = await prisma.$transaction([
      prisma.pustakaPeminjaman.update({
        where: { id: loanId },
        data: {
          status: 'kembali',
          tanggalKembali: now,
          denda,
          dendaDibayar: Boolean(dendaDibayar || denda === 0),
          catatan: catatan ? `${loan.catatan ? loan.catatan + ' | ' : ''}${catatan}` : loan.catatan,
        },
        include: {
          buku: true,
          siswa: true,
        },
      }),
      prisma.pustakaBuku.update({
        where: { id: loan.bukuId },
        data: {
          jumlahTersedia: { increment: 1 },
        },
      }),
    ])

    return apiSuccess({
      data: updatedLoan,
      message: `Buku "${loan.buku.judul}" telah berhasil dikembalikan oleh ${loan.siswa.nama}.${
        denda > 0
          ? ` Terlambat ${terlambatHari} hari, denda: Rp ${denda.toLocaleString('id-ID')}`
          : ''
      }`,
    })
  } catch (error: any) {
    console.error('Error pengembalian buku:', error)
    return apiError(error.message || 'Gagal memproses pengembalian buku', 500)
  }
}

