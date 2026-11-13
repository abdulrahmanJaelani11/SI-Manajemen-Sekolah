import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

const VALID_STATUSES = ['menunggu', 'verifikasi', 'diterima', 'cadangan', 'ditolak']

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/ppdb', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const gelombangId = searchParams.get('gelombangId')
    const jenjangId = searchParams.get('jenjangId')
    const statusSeleksi = searchParams.get('statusSeleksi')
    const search = (searchParams.get('search') || '').trim()

    const where: any = {}
    if (gelombangId && gelombangId !== 'all') where.gelombangId = Number(gelombangId)
    if (jenjangId && jenjangId !== 'all') where.jenjangId = Number(jenjangId)
    if (statusSeleksi && statusSeleksi !== 'all') where.statusSeleksi = statusSeleksi
    if (search) {
      where.OR = [
        { noPendaftaran: { contains: search, mode: 'insensitive' } },
        { nama: { contains: search, mode: 'insensitive' } },
        { asalSekolah: { contains: search, mode: 'insensitive' } },
        { nisn: { contains: search, mode: 'insensitive' } },
        { namaWali: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [pendaftarList, allStatsRaw, gelombangList, jenjangList, jurusanList, kelasList] =
      await Promise.all([
        prisma.ppdbPendaftar.findMany({
          where,
          include: {
            gelombang: true,
            jenjang: true,
            jurusan: true,
            siswa: {
              select: {
                id: true,
                nis: true,
                nama: true,
                kelas: { select: { id: true, namaKelas: true } },
              },
            },
          },
          orderBy: { tanggalDaftar: 'desc' },
        }),
        prisma.ppdbPendaftar.findMany({
          select: { statusSeleksi: true, siswaId: true },
        }),
        prisma.ppdbGelombang.findMany({
          include: { _count: { select: { pendaftar: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.refJenjang.findMany({ where: { active: true }, orderBy: { urutan: 'asc' } }),
        prisma.jurusan.findMany({ where: { active: true }, orderBy: { namaJurusan: 'asc' } }),
        prisma.kelas.findMany({
          where: { active: true },
          include: { jenjang: true, jurusan: true },
          orderBy: [{ jenjangId: 'asc' }, { namaKelas: 'asc' }],
        }),
      ])

    const stats = {
      total: allStatsRaw.length,
      menunggu: allStatsRaw.filter((r) => r.statusSeleksi === 'menunggu').length,
      verifikasi: allStatsRaw.filter((r) => r.statusSeleksi === 'verifikasi').length,
      diterima: allStatsRaw.filter((r) => r.statusSeleksi === 'diterima').length,
      cadangan: allStatsRaw.filter((r) => r.statusSeleksi === 'cadangan').length,
      ditolak: allStatsRaw.filter((r) => r.statusSeleksi === 'ditolak').length,
      sudahJadiSiswa: allStatsRaw.filter((r) => r.siswaId !== null).length,
    }

    return apiSuccess({
      message: 'Data PPDB berhasil dimuat',
      data: {
        pendaftarList,
        stats,
        gelombangList: gelombangList.map((g) => ({
          ...g,
          biayaDaftar: Number(g.biayaDaftar),
          jumlahPendaftar: g._count.pendaftar,
        })),
        jenjangList,
        jurusanList,
        kelasList,
      },
    })
  } catch (error: any) {
    console.error('API Kesiswaan PPDB GET Error:', error)
    return apiError('Gagal memuat data PPDB: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/ppdb', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { id, statusSeleksi, catatanPanitia } = body

    if (!id) {
      return apiError('ID pendaftar wajib disertakan.', 400)
    }

    if (statusSeleksi && !VALID_STATUSES.includes(statusSeleksi)) {
      return apiError('Status seleksi tidak valid.', 400)
    }

    const existing = await prisma.ppdbPendaftar.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return apiError('Data pendaftar tidak ditemukan.', 404)
    }

    if (existing.siswaId && statusSeleksi && statusSeleksi !== 'diterima') {
      return apiError(
        'Pendaftar ini sudah dikonversi menjadi Siswa aktif, status tidak dapat diubah selain Diterima.',
        400
      )
    }

    const petugasNama = auth.user.namaLengkap || auth.user.username

    const updated = await prisma.ppdbPendaftar.update({
      where: { id: existing.id },
      data: {
        statusSeleksi: statusSeleksi || existing.statusSeleksi,
        catatanPanitia:
          catatanPanitia !== undefined
            ? catatanPanitia
              ? String(catatanPanitia).trim()
              : null
            : existing.catatanPanitia,
        diverifikasiOleh: petugasNama,
      },
      include: {
        gelombang: true,
        jenjang: true,
        jurusan: true,
        siswa: {
          select: { id: true, nis: true, nama: true, kelas: { select: { id: true, namaKelas: true } } },
        },
      },
    })

    return apiSuccess({
      message: `Status seleksi ${updated.nama} diperbarui menjadi ${updated.statusSeleksi.toUpperCase()}`,
      data: updated,
    })
  } catch (error: any) {
    console.error('API Kesiswaan PPDB PATCH Error:', error)
    return apiError('Gagal memperbarui status seleksi: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/ppdb', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))
    if (!id) {
      return apiError('ID pendaftar wajib disertakan.', 400)
    }

    const existing = await prisma.ppdbPendaftar.findUnique({ where: { id } })
    if (!existing) {
      return apiError('Data pendaftar tidak ditemukan.', 404)
    }

    if (existing.siswaId) {
      return apiError(
        'Tidak dapat menghapus data pendaftar yang sudah didaftarkan menjadi Siswa aktif.',
        400
      )
    }

    await prisma.ppdbPendaftar.delete({ where: { id } })
    return apiSuccess({ message: `Pendaftaran ${existing.nama} (${existing.noPendaftaran}) dihapus` })
  } catch (error: any) {
    console.error('API Kesiswaan PPDB DELETE Error:', error)
    return apiError('Gagal menghapus data pendaftar: ' + (error?.message || 'Server error'), 500)
  }
}
