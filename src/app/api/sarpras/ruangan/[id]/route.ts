import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

// GET /api/sarpras/ruangan/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/sarpras/ruangan', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const ruanganId = Number(id)
    if (isNaN(ruanganId)) return apiError('ID ruangan tidak valid', 400)

    const ruangan = await prisma.sarprasRuangan.findUnique({
      where: { id: ruanganId },
      include: {
        pjPegawai: true,
        barang: {
          include: {
            kategori: { select: { id: true, kode: true, nama: true } },
          },
          orderBy: { namaBarang: 'asc' },
        },
      },
    })

    if (!ruangan) return apiError('Data ruangan tidak ditemukan', 404)

    return apiSuccess({ data: ruangan })
  } catch (error: any) {
    console.error('Error fetching ruangan detail:', error)
    return apiError(error.message || 'Gagal mengambil detail ruangan', 500)
  }
}

// PUT /api/sarpras/ruangan/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/sarpras/ruangan', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const ruanganId = Number(id)
    if (isNaN(ruanganId)) return apiError('ID ruangan tidak valid', 400)

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

    // Pastikan kode unik (kecuali milik diri sendiri)
    const existing = await prisma.sarprasRuangan.findFirst({
      where: {
        kodeRuangan: kodeRuangan.trim().toUpperCase(),
        NOT: { id: ruanganId },
      },
    })
    if (existing) {
      return apiError(`Kode ruangan "${kodeRuangan}" sudah digunakan oleh ruangan lain`, 409)
    }

    const updated = await prisma.sarprasRuangan.update({
      where: { id: ruanganId },
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
      data: updated,
      message: 'Data ruangan berhasil diperbarui',
    })
  } catch (error: any) {
    console.error('Error updating ruangan:', error)
    return apiError(error.message || 'Gagal memperbarui data ruangan', 500)
  }
}

// DELETE /api/sarpras/ruangan/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/sarpras/ruangan', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const ruanganId = Number(id)
    if (isNaN(ruanganId)) return apiError('ID ruangan tidak valid', 400)

    // Cek apakah masih ada barang yang terhubung ke ruangan ini
    const barangCount = await prisma.sarprasBarang.count({
      where: { ruanganId },
    })

    if (barangCount > 0) {
      return apiError(
        `Tidak dapat menghapus ruangan karena masih terdapat ${barangCount} aset barang yang ditempatkan di ruangan ini. Pindahkan atau hapus aset barang terlebih dahulu.`,
        400
      )
    }

    await prisma.sarprasRuangan.delete({
      where: { id: ruanganId },
    })

    return apiSuccess({ message: 'Ruangan berhasil dihapus' })
  } catch (error: any) {
    console.error('Error deleting ruangan:', error)
    return apiError(error.message || 'Gagal menghapus data ruangan', 500)
  }
}

