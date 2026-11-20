import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET() {
  try {
    const profil = await prisma.sekolahProfil.findFirst({
      select: {
        namaSekolah: true,
        modeJenjang: true,
        jenjangUtamaId: true,
        jenjangUtama: {
          select: {
            id: true,
            kode: true,
            nama: true,
            active: true,
          },
        },
      },
    })

    const activeJenjangList = await prisma.refJenjang.findMany({
      where: { active: true },
      orderBy: { urutan: 'asc' },
      select: {
        id: true,
        kode: true,
        nama: true,
        urutan: true,
        tingkat: {
          orderBy: { urutan: 'asc' },
          select: { id: true, tingkat: true, urutan: true },
        },
        jurusan: {
          where: { active: true },
          orderBy: { kodeJurusan: 'asc' },
          select: { id: true, kodeJurusan: true, namaJurusan: true },
        },
      },
    })

    const modeJenjang = profil?.modeJenjang || 'MULTI'
    const isSingleJenjang = modeJenjang === 'SINGLE'

    // Tentukan default jenjang
    let defaultJenjangId = profil?.jenjangUtamaId || null
    let jenjangUtama = profil?.jenjangUtama || null

    if (isSingleJenjang) {
      if (!defaultJenjangId && activeJenjangList.length > 0) {
        defaultJenjangId = activeJenjangList[0].id
        jenjangUtama = {
          id: activeJenjangList[0].id,
          kode: activeJenjangList[0].kode,
          nama: activeJenjangList[0].nama,
          active: true,
        }
      }
    }

    // Periksa apakah jenjang aktif menyediakan jurusan (khususnya SMK)
    const hasJurusan = activeJenjangList.some(
      (j) => j.kode.toUpperCase() === 'SMK' || (j.jurusan && j.jurusan.length > 0)
    )

    return apiSuccess({
      message: 'Mode sekolah berhasil dimuat',
      data: {
        namaSekolah: profil?.namaSekolah || 'Sistem Manajemen Sekolah',
        modeJenjang,
        isSingleJenjang,
        defaultJenjangId,
        jenjangUtama,
        activeJenjangList,
        hasJurusan,
      },
    })
  } catch (error: any) {
    console.error('API Sekolah Mode Error:', error)
    return apiError('Gagal memuat mode sekolah: ' + (error?.message || 'Server error'), 500)
  }
}
