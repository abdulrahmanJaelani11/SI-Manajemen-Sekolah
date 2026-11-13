import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/mutasi', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const jenisMutasi = searchParams.get('jenisMutasi')
    const search = (searchParams.get('search') || '').trim()

    const where: any = {}
    if (jenisMutasi && jenisMutasi !== 'all') where.jenisMutasi = jenisMutasi
    if (search) {
      where.OR = [
        { nomorSurat: { contains: search, mode: 'insensitive' } },
        { sekolahAsalTujuan: { contains: search, mode: 'insensitive' } },
        { alasan: { contains: search, mode: 'insensitive' } },
        { siswa: { nama: { contains: search, mode: 'insensitive' } } },
        { siswa: { nis: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [logs, allCountsRaw, siswaAktifList, jenjangList, jurusanList, kelasList] =
      await Promise.all([
        prisma.mutasiSiswa.findMany({
          where,
          include: {
            siswa: {
              select: {
                id: true,
                nis: true,
                nisn: true,
                nama: true,
                jenisKelamin: true,
                status: true,
                jenjang: { select: { kode: true, nama: true } },
                kelas: { select: { id: true, namaKelas: true } },
              },
            },
          },
          orderBy: [{ tanggalMutasi: 'desc' }, { id: 'desc' }],
        }),
        prisma.mutasiSiswa.findMany({
          select: { jenisMutasi: true },
        }),
        prisma.siswa.findMany({
          where: { status: 'aktif' },
          select: {
            id: true,
            nis: true,
            nama: true,
            jenjangId: true,
            kelasId: true,
            jenjang: { select: { kode: true } },
            kelas: { select: { id: true, namaKelas: true } },
          },
          orderBy: { nama: 'asc' },
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
      totalMutasi: allCountsRaw.length,
      mutasiKeluar: allCountsRaw.filter((r) => r.jenisMutasi === 'keluar').length,
      mutasiMasuk: allCountsRaw.filter((r) => r.jenisMutasi === 'masuk').length,
      dropOut: allCountsRaw.filter((r) => r.jenisMutasi === 'drop_out').length,
    }

    return apiSuccess({
      message: 'Data mutasi siswa berhasil dimuat',
      data: {
        logs,
        stats,
        siswaAktifList,
        jenjangList,
        jurusanList,
        kelasList,
      },
    })
  } catch (error: any) {
    console.error('API Mutasi GET Error:', error)
    return apiError('Gagal memuat data mutasi: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/mutasi', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      jenisMutasi, // "keluar" | "drop_out" | "masuk"
      tanggalMutasi,
      nomorSurat,
      sekolahAsalTujuan,
      alasan,
      // Untuk keluar / drop_out:
      siswaId,
      // Untuk mutasi masuk:
      siswaBaru,
    } = body

    if (!jenisMutasi || !['keluar', 'masuk', 'drop_out'].includes(jenisMutasi)) {
      return apiError('Jenis mutasi tidak valid (keluar / masuk / drop_out).', 400)
    }

    if (!tanggalMutasi || !alasan?.trim()) {
      return apiError('Tanggal mutasi dan alasan/keterangan resmi wajib diisi.', 400)
    }

    const parsedDate = new Date(tanggalMutasi)
    if (Number.isNaN(parsedDate.getTime())) {
      return apiError('Format tanggal mutasi tidak valid.', 400)
    }

    const petugasNama = auth.user.namaLengkap || auth.user.username

    if (jenisMutasi === 'keluar' || jenisMutasi === 'drop_out') {
      if (!siswaId) {
        return apiError('Pilih siswa yang akan dimutasi.', 400)
      }

      const siswa = await prisma.siswa.findUnique({
        where: { id: Number(siswaId) },
        include: { jenjang: true, kelas: true },
      })

      if (!siswa) {
        return apiError('Data siswa tidak ditemukan.', 404)
      }
      if (siswa.status !== 'aktif') {
        return apiError(
          `Siswa ${siswa.nama} saat ini berstatus "${siswa.status}" (bukan siswa aktif).`,
          400
        )
      }

      const kelasTerakhir = siswa.kelas
        ? `${siswa.jenjang?.kode || ''} ${siswa.kelas.namaKelas}`.trim()
        : siswa.jenjang?.kode || '-'

      const newStatus = jenisMutasi === 'drop_out' ? 'drop_out' : 'mutasi'
      const tahunKeluar = parsedDate.getFullYear()

      const created = await prisma.$transaction(async (tx) => {
        await tx.siswa.update({
          where: { id: siswa.id },
          data: {
            status: newStatus,
            tahunKeluar,
            kelasId: null,
          },
        })

        return tx.mutasiSiswa.create({
          data: {
            siswaId: siswa.id,
            jenisMutasi,
            tanggalMutasi: parsedDate,
            nomorSurat: nomorSurat ? String(nomorSurat).trim() : null,
            sekolahAsalTujuan: sekolahAsalTujuan ? String(sekolahAsalTujuan).trim() : null,
            alasan: String(alasan).trim(),
            kelasTerakhir,
            diprosesOleh: petugasNama,
          },
          include: {
            siswa: { select: { id: true, nis: true, nama: true, status: true } },
          },
        })
      })

      return apiSuccess({
        message: `Mutasi ${jenisMutasi === 'drop_out' ? 'Berhenti/DO' : 'Keluar'} untuk ${siswa.nama} berhasil diproses`,
        data: created,
        status: 201,
      })
    } else {
      // MUTASI MASUK (Siswa pindahan dari sekolah lain)
      const s = siswaBaru || {}
      if (!s.jenjangId || !s.nis?.trim() || !s.nama?.trim() || !s.jenisKelamin) {
        return apiError(
          'Jenjang, NIS, Nama Lengkap, dan Jenis Kelamin siswa pindahan wajib diisi.',
          400
        )
      }

      const cleanNis = String(s.nis).trim()
      const dupNis = await prisma.siswa.findUnique({ where: { nis: cleanNis } })
      if (dupNis) {
        return apiError(`NIS "${cleanNis}" sudah terdaftar di sistem.`, 409)
      }

      const parsedKelasId = s.kelasId ? Number(s.kelasId) : null
      let kelasLabel = '-'
      if (parsedKelasId) {
        const kelas = await prisma.kelas.findUnique({
          where: { id: parsedKelasId },
          include: { jenjang: true },
        })
        if (!kelas) {
          return apiError('Kelas penempatan tidak ditemukan.', 404)
        }
        if (kelas.jenjangId !== Number(s.jenjangId)) {
          return apiError('Kelas penempatan tidak sesuai jenjang siswa.', 400)
        }
        kelasLabel = `${kelas.jenjang.kode} ${kelas.namaKelas}`
      }

      const created = await prisma.$transaction(async (tx) => {
        const newSiswa = await tx.siswa.create({
          data: {
            jenjangId: Number(s.jenjangId),
            kelasId: parsedKelasId,
            jurusanId: s.jurusanId ? Number(s.jurusanId) : null,
            nis: cleanNis,
            nisn: s.nisn ? String(s.nisn).trim() : null,
            nama: String(s.nama).trim(),
            jenisKelamin: s.jenisKelamin === 'P' ? 'P' : 'L',
            tahunMasuk: parsedDate.getFullYear(),
            status: 'aktif',
            tempatLahir: s.tempatLahir ? String(s.tempatLahir).trim() : null,
            tanggalLahir: s.tanggalLahir ? new Date(s.tanggalLahir) : null,
            alamat: s.alamat ? String(s.alamat).trim() : null,
            namaWali: s.namaWali ? String(s.namaWali).trim() : null,
            telpWali: s.telpWali ? String(s.telpWali).trim() : null,
          },
        })

        return tx.mutasiSiswa.create({
          data: {
            siswaId: newSiswa.id,
            jenisMutasi: 'masuk',
            tanggalMutasi: parsedDate,
            nomorSurat: nomorSurat ? String(nomorSurat).trim() : null,
            sekolahAsalTujuan: sekolahAsalTujuan ? String(sekolahAsalTujuan).trim() : null,
            alasan: String(alasan).trim(),
            kelasTerakhir: kelasLabel,
            diprosesOleh: petugasNama,
          },
          include: {
            siswa: { select: { id: true, nis: true, nama: true, status: true } },
          },
        })
      })

      return apiSuccess({
        message: `Siswa pindahan ${created.siswa.nama} (NIS ${created.siswa.nis}) berhasil didaftarkan`,
        data: created,
        status: 201,
      })
    }
  } catch (error: any) {
    console.error('API Mutasi POST Error:', error)
    return apiError('Gagal memproses mutasi siswa: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/mutasi', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))
    const restoreSiswa = searchParams.get('restore') === '1'

    if (!id) {
      return apiError('ID catatan mutasi wajib disertakan.', 400)
    }

    const existing = await prisma.mutasiSiswa.findUnique({ where: { id } })
    if (!existing) {
      return apiError('Catatan mutasi tidak ditemukan.', 404)
    }

    await prisma.$transaction(async (tx) => {
      if (restoreSiswa && (existing.jenisMutasi === 'keluar' || existing.jenisMutasi === 'drop_out')) {
        await tx.siswa.update({
          where: { id: existing.siswaId },
          data: { status: 'aktif', tahunKeluar: null },
        })
      }
      await tx.mutasiSiswa.delete({ where: { id } })
    })

    return apiSuccess({
      message: restoreSiswa
        ? 'Catatan mutasi dihapus dan status siswa dikembalikan menjadi aktif'
        : 'Catatan mutasi berhasil dihapus',
    })
  } catch (error: any) {
    console.error('API Mutasi DELETE Error:', error)
    return apiError('Gagal menghapus catatan mutasi: ' + (error?.message || 'Server error'), 500)
  }
}

