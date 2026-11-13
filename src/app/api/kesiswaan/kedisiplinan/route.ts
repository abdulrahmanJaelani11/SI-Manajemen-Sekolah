import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

const VALID_STATUS_BK = ['tercatat', 'pembinaan', 'selesai']

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/kedisiplinan', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const jenis = searchParams.get('jenis')
    const statusBk = searchParams.get('statusBk')
    const kelasId = searchParams.get('kelasId')
    const search = (searchParams.get('search') || '').trim()

    const where: any = {}
    if (jenis && jenis !== 'all') where.jenis = jenis
    if (statusBk && statusBk !== 'all') where.statusBk = statusBk
    if (kelasId && kelasId !== 'all') {
      where.siswa = { kelasId: Number(kelasId) }
    }
    if (search) {
      where.OR = [
        { deskripsi: { contains: search, mode: 'insensitive' } },
        { siswa: { nama: { contains: search, mode: 'insensitive' } } },
        { siswa: { nis: { contains: search, mode: 'insensitive' } } },
        { kategori: { nama: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [logs, allLogsForRekap, siswaList, kelasList, kategoriList] = await Promise.all([
      prisma.kedisiplinanSiswa.findMany({
        where,
        include: {
          siswa: {
            select: {
              id: true,
              nis: true,
              nama: true,
              fotoUrl: true,
              kelas: { select: { id: true, namaKelas: true } },
              jenjang: { select: { kode: true } },
            },
          },
          kategori: true,
        },
        orderBy: [{ tanggal: 'desc' }, { id: 'desc' }],
      }),
      prisma.kedisiplinanSiswa.findMany({
        include: {
          siswa: {
            select: {
              id: true,
              nis: true,
              nama: true,
              kelas: { select: { id: true, namaKelas: true } },
              jenjang: { select: { kode: true } },
            },
          },
        },
      }),
      prisma.siswa.findMany({
        where: { status: 'aktif' },
        select: {
          id: true,
          nis: true,
          nama: true,
          kelas: { select: { id: true, namaKelas: true } },
          jenjang: { select: { kode: true } },
        },
        orderBy: { nama: 'asc' },
      }),
      prisma.kelas.findMany({
        where: { active: true },
        include: { jenjang: true },
        orderBy: [{ jenjangId: 'asc' }, { namaKelas: 'asc' }],
      }),
      prisma.kategoriPoinSiswa.findMany({
        orderBy: [{ jenis: 'asc' }, { poin: 'asc' }],
      }),
    ])

    // Rekap skor per siswa
    const rekapMap = new Map<
      number,
      {
        siswaId: number
        nis: string
        nama: string
        kelasNama: string
        jenjangKode: string
        jumlahPelanggaran: number
        poinPelanggaran: number
        jumlahPrestasi: number
        poinPrestasi: number
        skorNet: number
        perluPerhatianBk: boolean
      }
    >()

    for (const row of allLogsForRekap) {
      let entry = rekapMap.get(row.siswaId)
      if (!entry) {
        entry = {
          siswaId: row.siswaId,
          nis: row.siswa.nis,
          nama: row.siswa.nama,
          kelasNama: row.siswa.kelas?.namaKelas || '-',
          jenjangKode: row.siswa.jenjang?.kode || '-',
          jumlahPelanggaran: 0,
          poinPelanggaran: 0,
          jumlahPrestasi: 0,
          poinPrestasi: 0,
          skorNet: 0,
          perluPerhatianBk: false,
        }
        rekapMap.set(row.siswaId, entry)
      }

      if (row.jenis === 'prestasi') {
        entry.jumlahPrestasi += 1
        entry.poinPrestasi += row.poin
      } else {
        entry.jumlahPelanggaran += 1
        entry.poinPelanggaran += row.poin
      }
      entry.skorNet = entry.poinPrestasi - entry.poinPelanggaran
      entry.perluPerhatianBk = entry.poinPelanggaran >= 50
    }

    const rekapSiswa = Array.from(rekapMap.values()).sort(
      (a, b) => b.poinPelanggaran - a.poinPelanggaran || b.poinPrestasi - a.poinPrestasi
    )

    const stats = {
      totalPelanggaran: allLogsForRekap.filter((r) => r.jenis === 'pelanggaran').length,
      totalPrestasi: allLogsForRekap.filter((r) => r.jenis === 'prestasi').length,
      dalamPembinaan: allLogsForRekap.filter((r) => r.statusBk === 'pembinaan').length,
      siswaPerluPerhatian: rekapSiswa.filter((r) => r.perluPerhatianBk).length,
    }

    return apiSuccess({
      message: 'Data kedisiplinan siswa berhasil dimuat',
      data: {
        logs,
        rekapSiswa,
        stats,
        siswaList,
        kelasList,
        kategoriList,
      },
    })
  } catch (error: any) {
    console.error('API Kedisiplinan GET Error:', error)
    return apiError('Gagal memuat data kedisiplinan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/kedisiplinan', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { siswaId, kategoriId, tanggal, deskripsi, tindakLanjut, statusBk } = body

    if (!siswaId || !kategoriId || !deskripsi?.trim()) {
      return apiError('Siswa, kategori poin, dan deskripsi kejadian wajib diisi.', 400)
    }

    const [siswa, kategori] = await Promise.all([
      prisma.siswa.findUnique({ where: { id: Number(siswaId) } }),
      prisma.kategoriPoinSiswa.findUnique({ where: { id: Number(kategoriId) } }),
    ])

    if (!siswa) {
      return apiError('Siswa tidak ditemukan.', 404)
    }
    if (!kategori) {
      return apiError('Kategori poin tidak ditemukan.', 404)
    }

    const cleanStatus = VALID_STATUS_BK.includes(statusBk) ? statusBk : 'tercatat'
    const parsedTanggal = tanggal ? new Date(tanggal) : new Date()
    if (Number.isNaN(parsedTanggal.getTime())) {
      return apiError('Format tanggal kejadian tidak valid.', 400)
    }

    const created = await prisma.kedisiplinanSiswa.create({
      data: {
        siswaId: siswa.id,
        kategoriId: kategori.id,
        tanggal: parsedTanggal,
        jenis: kategori.jenis,
        poin: kategori.poin,
        deskripsi: String(deskripsi).trim(),
        tindakLanjut: tindakLanjut ? String(tindakLanjut).trim() : null,
        statusBk: cleanStatus,
        dicatatOleh: auth.user.namaLengkap || auth.user.username,
      },
      include: {
        siswa: { select: { id: true, nis: true, nama: true } },
        kategori: true,
      },
    })

    return apiSuccess({
      message: `Catatan ${created.jenis} untuk ${created.siswa.nama} (${created.poin} poin) berhasil disimpan`,
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Kedisiplinan POST Error:', error)
    return apiError('Gagal menyimpan catatan kedisiplinan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/kedisiplinan', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { id, deskripsi, tindakLanjut, statusBk } = body

    if (!id) {
      return apiError('ID catatan wajib disertakan.', 400)
    }

    const existing = await prisma.kedisiplinanSiswa.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return apiError('Catatan kedisiplinan tidak ditemukan.', 404)
    }

    if (statusBk && !VALID_STATUS_BK.includes(statusBk)) {
      return apiError('Status pembinaan BK tidak valid.', 400)
    }

    const updated = await prisma.kedisiplinanSiswa.update({
      where: { id: existing.id },
      data: {
        deskripsi: deskripsi !== undefined ? String(deskripsi).trim() : existing.deskripsi,
        tindakLanjut:
          tindakLanjut !== undefined
            ? tindakLanjut
              ? String(tindakLanjut).trim()
              : null
            : existing.tindakLanjut,
        statusBk: statusBk || existing.statusBk,
      },
    })

    return apiSuccess({
      message: 'Tindak lanjut catatan BK berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Kedisiplinan PATCH Error:', error)
    return apiError('Gagal memperbarui catatan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/kedisiplinan', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))
    if (!id) {
      return apiError('ID catatan wajib disertakan.', 400)
    }

    const existing = await prisma.kedisiplinanSiswa.findUnique({ where: { id } })
    if (!existing) {
      return apiError('Catatan kedisiplinan tidak ditemukan.', 404)
    }

    await prisma.kedisiplinanSiswa.delete({ where: { id } })
    return apiSuccess({ message: 'Catatan kedisiplinan berhasil dihapus' })
  } catch (error: any) {
    console.error('API Kedisiplinan DELETE Error:', error)
    return apiError('Gagal menghapus catatan: ' + (error?.message || 'Server error'), 500)
  }
}

