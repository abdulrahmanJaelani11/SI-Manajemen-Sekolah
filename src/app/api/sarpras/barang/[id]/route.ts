import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

// GET /api/sarpras/barang/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/sarpras/barang', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const barangId = Number(id)
    if (isNaN(barangId)) return apiError('ID barang tidak valid', 400)

    const barang = await prisma.sarprasBarang.findUnique({
      where: { id: barangId },
      include: {
        kategori: true,
        ruangan: true,
        pjPegawai: true,
      },
    })

    if (!barang) return apiError('Data aset barang tidak ditemukan', 404)

    return apiSuccess({ data: barang })
  } catch (error: any) {
    console.error('Error fetching barang detail:', error)
    return apiError(error.message || 'Gagal mengambil detail aset barang', 500)
  }
}

// PUT /api/sarpras/barang/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/sarpras/barang', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const barangId = Number(id)
    if (isNaN(barangId)) return apiError('ID barang tidak valid', 400)

    const body = await request.json()
    let {
      kodeBarang,
      namaBarang,
      kategoriId,
      ruanganId,
      merk,
      spesifikasi,
      noSeri,
      tahunPengadaan,
      sumberDana,
      hargaPerolehan,
      jumlahTotal,
      jumlahBaik,
      jumlahRusakRingan,
      jumlahRusakBerat,
      jumlahAfkir,
      kondisiUtama,
      pjPegawaiId,
      fotoUrl,
      keterangan,
    } = body

    if (!namaBarang || !kategoriId) {
      return apiError('Nama barang dan kategori aset wajib diisi', 400)
    }

    if (kodeBarang) {
      kodeBarang = kodeBarang.trim().toUpperCase()
      const existing = await prisma.sarprasBarang.findFirst({
        where: {
          kodeBarang,
          NOT: { id: barangId },
        },
      })
      if (existing) {
        return apiError(`Kode aset "${kodeBarang}" sudah digunakan oleh barang lain`, 409)
      }
    }

    const tot = Math.max(1, Number(jumlahTotal) || 1)
    const baik = jumlahBaik !== undefined ? Number(jumlahBaik) : tot
    const rusakRingan = Number(jumlahRusakRingan) || 0
    const rusakBerat = Number(jumlahRusakBerat) || 0
    const afkir = Number(jumlahAfkir) || 0

    let finalKondisi = kondisiUtama || 'baik'
    if (baik === 0 && (rusakRingan > 0 || rusakBerat > 0)) {
      finalKondisi = rusakBerat > 0 ? 'rusak_berat' : 'rusak_ringan'
    } else if (baik === 0 && afkir > 0) {
      finalKondisi = 'afkir'
    }

    const updated = await prisma.sarprasBarang.update({
      where: { id: barangId },
      data: {
        ...(kodeBarang ? { kodeBarang } : {}),
        namaBarang: namaBarang.trim(),
        kategoriId: Number(kategoriId),
        ruanganId: ruanganId ? Number(ruanganId) : null,
        merk: merk ? merk.trim() : null,
        spesifikasi: spesifikasi ? spesifikasi.trim() : null,
        noSeri: noSeri ? noSeri.trim() : null,
        tahunPengadaan: tahunPengadaan ? Number(tahunPengadaan) : undefined,
        sumberDana: sumberDana ? sumberDana.trim() : 'BOS Reguler',
        hargaPerolehan: hargaPerolehan !== undefined ? Number(hargaPerolehan) : 0,
        jumlahTotal: tot,
        jumlahBaik: baik,
        jumlahRusakRingan: rusakRingan,
        jumlahRusakBerat: rusakBerat,
        jumlahAfkir: afkir,
        kondisiUtama: finalKondisi,
        pjPegawaiId: pjPegawaiId ? Number(pjPegawaiId) : null,
        fotoUrl: fotoUrl ? fotoUrl.trim() : null,
        keterangan: keterangan ? keterangan.trim() : null,
      },
      include: {
        kategori: true,
        ruangan: true,
        pjPegawai: true,
      },
    })

    return apiSuccess({
      data: updated,
      message: 'Data aset barang berhasil diperbarui',
    })
  } catch (error: any) {
    console.error('Error updating barang:', error)
    return apiError(error.message || 'Gagal memperbarui data aset barang', 500)
  }
}

// DELETE /api/sarpras/barang/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/sarpras/barang', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const barangId = Number(id)
    if (isNaN(barangId)) return apiError('ID barang tidak valid', 400)

    await prisma.sarprasBarang.delete({
      where: { id: barangId },
    })

    return apiSuccess({ message: 'Aset barang berhasil dihapus dari inventaris' })
  } catch (error: any) {
    console.error('Error deleting barang:', error)
    return apiError(error.message || 'Gagal menghapus aset barang', 500)
  }
}

