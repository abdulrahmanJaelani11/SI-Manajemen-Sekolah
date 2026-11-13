import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/ppdb', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { pendaftarId, nis, kelasId } = body

    if (!pendaftarId) {
      return apiError('ID pendaftar wajib diisi.', 400)
    }

    const pendaftar = await prisma.ppdbPendaftar.findUnique({
      where: { id: Number(pendaftarId) },
      include: { gelombang: true, jenjang: true, jurusan: true },
    })

    if (!pendaftar) {
      return apiError('Data pendaftar PPDB tidak ditemukan.', 404)
    }

    if (pendaftar.siswaId) {
      return apiError('Pendaftar ini sudah dikonversi menjadi data Siswa aktif sebelumnya.', 400)
    }

    if (pendaftar.statusSeleksi !== 'diterima') {
      return apiError('Hanya pendaftar berstatus DITERIMA yang dapat didaftarkan menjadi Siswa.', 400)
    }

    const parsedKelasId = kelasId ? Number(kelasId) : null
    if (parsedKelasId) {
      const kelas = await prisma.kelas.findUnique({ where: { id: parsedKelasId } })
      if (!kelas) {
        return apiError('Kelas penempatan yang dipilih tidak ditemukan.', 404)
      }
      if (kelas.jenjangId !== pendaftar.jenjangId) {
        return apiError(
          `Kelas ${kelas.namaKelas} bukan berada pada jenjang ${pendaftar.jenjang.nama}.`,
          400
        )
      }
    }

    // Generate NIS otomatis bila tidak diisi manual
    const yearMatch = (pendaftar.gelombang.tahunAjaran || '').match(/\d{4}/)
    const tahunMasuk = yearMatch ? Number(yearMatch[0]) : new Date().getFullYear()

    let finalNis = nis ? String(nis).trim() : ''
    if (!finalNis) {
      const yy = String(tahunMasuk).slice(-2)
      let seq = pendaftar.id
      finalNis = `${yy}${String(pendaftar.jenjangId).padStart(2, '0')}${String(seq).padStart(4, '0')}`
      while (await prisma.siswa.findUnique({ where: { nis: finalNis }, select: { id: true } })) {
        seq += 1
        finalNis = `${yy}${String(pendaftar.jenjangId).padStart(2, '0')}${String(seq).padStart(4, '0')}`
      }
    } else {
      const duplicateNis = await prisma.siswa.findUnique({
        where: { nis: finalNis },
        select: { id: true },
      })
      if (duplicateNis) {
        return apiError(`NIS "${finalNis}" sudah digunakan oleh siswa lain.`, 409)
      }
    }

    const createdSiswa = await prisma.$transaction(async (tx) => {
      const newSiswa = await tx.siswa.create({
        data: {
          jenjangId: pendaftar.jenjangId,
          kelasId: parsedKelasId,
          jurusanId: pendaftar.jurusanId,
          nis: finalNis,
          nisn: pendaftar.nisn,
          nama: pendaftar.nama,
          jenisKelamin: pendaftar.jenisKelamin,
          tahunMasuk,
          status: 'aktif',
          tempatLahir: pendaftar.tempatLahir,
          tanggalLahir: pendaftar.tanggalLahir,
          alamat: pendaftar.alamat,
          telpSiswa: pendaftar.noHpSiswa,
          emailSiswa: pendaftar.emailSiswa,
          namaWali: pendaftar.namaWali,
          telpWali: pendaftar.telpWali,
          pekerjaanWali: pendaftar.pekerjaanWali,
          hubunganWali: pendaftar.hubunganWali,
          fotoUrl: pendaftar.fotoUrl,
        },
        include: {
          jenjang: true,
          kelas: true,
          jurusan: true,
        },
      })

      await tx.ppdbPendaftar.update({
        where: { id: pendaftar.id },
        data: {
          siswaId: newSiswa.id,
          diverifikasiOleh: auth.user.namaLengkap || auth.user.username,
        },
      })

      return newSiswa
    })

    return apiSuccess({
      message: `${createdSiswa.nama} berhasil didaftarkan menjadi Siswa aktif dengan NIS ${createdSiswa.nis}`,
      data: createdSiswa,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Kesiswaan PPDB Enroll Error:', error)
    return apiError('Gagal mengonversi pendaftar ke Siswa: ' + (error?.message || 'Server error'), 500)
  }
}
