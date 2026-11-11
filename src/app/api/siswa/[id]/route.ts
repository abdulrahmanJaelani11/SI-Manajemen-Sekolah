import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import storage from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const siswaId = parseInt(id, 10)
    if (isNaN(siswaId)) return apiError('ID siswa tidak valid', 400)

    const siswa = await prisma.siswa.findUnique({
      where: { id: siswaId },
      include: {
        jenjang: true,
        kelas: {
          include: {
            tingkat: true,
          },
        },
        jurusan: true,
        sppPembayaran: {
          orderBy: [{ tahunAjaran: 'desc' }, { urutanBulan: 'desc' }],
          take: 12,
        },
      },
    })

    if (!siswa) {
      return apiError('Data siswa tidak ditemukan', 404)
    }

    return apiSuccess({
      message: 'Detail siswa berhasil dimuat',
      data: siswa,
    })
  } catch (error: any) {
    console.error('API Siswa Detail Error:', error)
    return apiError('Gagal memuat detail siswa: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const siswaId = parseInt(id, 10)
    if (isNaN(siswaId)) return apiError('ID siswa tidak valid', 400)

    const body = await request.json()
    const {
      jenjangId,
      kelasId,
      jurusanId,
      nis,
      nisn,
      nama,
      jenisKelamin,
      tahunMasuk,
      tahunKeluar,
      status,
      tempatLahir,
      tanggalLahir,
      alamat,
      telpSiswa,
      emailSiswa,
      namaWali,
      telpWali,
      pekerjaanWali,
      hubunganWali,
      prestasi,
      fotoUrl,
    } = body

    // Cek keberadaan siswa
    const existing = await prisma.siswa.findUnique({
      where: { id: siswaId },
    })
    if (!existing) return apiError('Data siswa tidak ditemukan', 404)

    // Cek keunikan NIS jika diubah
    if (nis && String(nis).trim() !== existing.nis) {
      const duplicate = await prisma.siswa.findUnique({
        where: { nis: String(nis).trim() },
      })
      if (duplicate) {
        return apiError(`Siswa dengan NIS "${nis}" sudah terdaftar`, 409)
      }
    }

    // Jika foto diganti, bersihkan foto lama
    if (fotoUrl && existing.fotoUrl && fotoUrl !== existing.fotoUrl) {
      await storage.delete(existing.fotoUrl)
    }

    const updated = await prisma.siswa.update({
      where: { id: siswaId },
      data: {
        ...(jenjangId ? { jenjangId: parseInt(jenjangId, 10) } : {}),
        kelasId: kelasId !== undefined ? (kelasId ? parseInt(kelasId, 10) : null) : undefined,
        jurusanId: jurusanId !== undefined ? (jurusanId ? parseInt(jurusanId, 10) : null) : undefined,
        ...(nis ? { nis: String(nis).trim() } : {}),
        nisn: nisn !== undefined ? (nisn ? String(nisn).trim() : null) : undefined,
        ...(nama ? { nama: String(nama).trim() } : {}),
        ...(jenisKelamin ? { jenisKelamin: jenisKelamin === 'P' ? 'P' : 'L' } : {}),
        tahunMasuk: tahunMasuk !== undefined ? (tahunMasuk ? parseInt(tahunMasuk, 10) : null) : undefined,
        tahunKeluar: tahunKeluar !== undefined ? (tahunKeluar ? parseInt(tahunKeluar, 10) : null) : undefined,
        ...(status ? { status } : {}),
        tempatLahir: tempatLahir !== undefined ? (tempatLahir ? String(tempatLahir).trim() : null) : undefined,
        tanggalLahir: tanggalLahir !== undefined ? (tanggalLahir ? new Date(tanggalLahir) : null) : undefined,
        alamat: alamat !== undefined ? (alamat ? String(alamat).trim() : null) : undefined,
        telpSiswa: telpSiswa !== undefined ? (telpSiswa ? String(telpSiswa).trim() : null) : undefined,
        emailSiswa: emailSiswa !== undefined ? (emailSiswa ? String(emailSiswa).trim() : null) : undefined,
        namaWali: namaWali !== undefined ? (namaWali ? String(namaWali).trim() : null) : undefined,
        telpWali: telpWali !== undefined ? (telpWali ? String(telpWali).trim() : null) : undefined,
        pekerjaanWali: pekerjaanWali !== undefined ? (pekerjaanWali ? String(pekerjaanWali).trim() : null) : undefined,
        hubunganWali: hubunganWali !== undefined ? (hubunganWali ? String(hubunganWali).trim() : 'Orang Tua') : undefined,
        prestasi: prestasi !== undefined ? (prestasi ? String(prestasi).trim() : null) : undefined,
        fotoUrl: fotoUrl !== undefined ? (fotoUrl ? String(fotoUrl).trim() : null) : undefined,
      },
      include: {
        jenjang: true,
        kelas: true,
        jurusan: true,
      },
    })

    return apiSuccess({
      message: 'Data siswa berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Siswa PUT Error:', error)
    return apiError('Gagal memperbarui siswa: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const siswaId = parseInt(id, 10)
    if (isNaN(siswaId)) return apiError('ID siswa tidak valid', 400)

    const existing = await prisma.siswa.findUnique({
      where: { id: siswaId },
      include: {
        _count: {
          select: { sppPembayaran: true },
        },
      },
    })

    if (!existing) return apiError('Data siswa tidak ditemukan', 404)

    if (existing._count.sppPembayaran > 0) {
      return apiError(
        `Siswa tidak dapat dihapus permanen karena memiliki riwayat ${existing._count.sppPembayaran} transaksi SPP. Ubah status siswa menjadi 'mutasi' atau 'alumni'.`,
        400
      )
    }

    if (existing.fotoUrl) {
      await storage.delete(existing.fotoUrl)
    }

    await prisma.siswa.delete({
      where: { id: siswaId },
    })

    return apiSuccess({
      message: 'Data siswa berhasil dihapus',
      data: null,
    })
  } catch (error: any) {
    console.error('API Siswa DELETE Error:', error)
    return apiError('Gagal menghapus siswa: ' + (error?.message || 'Server error'), 500)
  }
}
