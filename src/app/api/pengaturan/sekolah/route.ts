import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET() {
  try {
    let profil = await prisma.sekolahProfil.findFirst({
      include: {
        jenjangUtama: {
          select: { id: true, kode: true, nama: true, active: true },
        },
      },
    })

    if (!profil) {
      profil = await prisma.sekolahProfil.create({
        data: {
          namaSekolah: 'Sistem Informasi Manajemen Sekolah Terpadu',
          npsn: '10203040',
          bentukPendidikan: 'Multi-Jenjang',
          modeJenjang: 'MULTI',
          warnaPrimary: '#5d87ff',
          warnaPrimaryDark: '#4570ea',
          warnaAccent: '#13deb9',
        },
        include: {
          jenjangUtama: {
            select: { id: true, kode: true, nama: true, active: true },
          },
        },
      })
    }

    const daftarJenjang = await prisma.refJenjang.findMany({
      orderBy: { urutan: 'asc' },
      select: { id: true, kode: true, nama: true, active: true, urutan: true },
    })

    return apiSuccess({
      message: 'Profil sekolah berhasil dimuat',
      data: {
        ...profil,
        daftarJenjang,
      },
    })
  } catch (error: any) {
    console.error('API Profil Sekolah GET Error:', error)
    return apiError('Gagal memuat profil sekolah: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/pengaturan/sekolah', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      namaSekolah,
      npsn,
      bentukPendidikan,
      modeJenjang,
      jenjangUtamaId,
      activeJenjangIds,
      sejarah,
      visiMisi,
      alamat,
      telepon,
      email,
      website,
      logoUrl,
      faviconUrl,
      warnaPrimary,
      warnaPrimaryDark,
      warnaAccent,
      warnaSidebarStart,
      warnaSidebarEnd,
      temaPreset,
    } = body

    const existing = await prisma.sekolahProfil.findFirst()

    const targetMode = modeJenjang === 'SINGLE' ? 'SINGLE' : (modeJenjang === 'MULTI' ? 'MULTI' : (existing?.modeJenjang || 'MULTI'))
    let targetJenjangUtamaId = jenjangUtamaId !== undefined ? (jenjangUtamaId ? Number(jenjangUtamaId) : null) : existing?.jenjangUtamaId

    if (targetMode === 'SINGLE' && !targetJenjangUtamaId) {
      return apiError('Mode Single-Jenjang memerlukan pilihan Jenjang Utama Sekolah.', 400)
    }

    // Eksekusi pembaruan dalam transaksi
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update atau create SekolahProfil
      const profilData = {
        ...(namaSekolah ? { namaSekolah: String(namaSekolah).trim() } : {}),
        npsn: npsn !== undefined ? (npsn ? String(npsn).trim() : null) : undefined,
        bentukPendidikan: bentukPendidikan !== undefined ? (bentukPendidikan ? String(bentukPendidikan).trim() : null) : undefined,
        modeJenjang: targetMode,
        jenjangUtamaId: targetJenjangUtamaId,
        sejarah: sejarah !== undefined ? (sejarah ? String(sejarah).trim() : null) : undefined,
        visiMisi: visiMisi !== undefined ? (visiMisi ? String(visiMisi).trim() : null) : undefined,
        alamat: alamat !== undefined ? (alamat ? String(alamat).trim() : null) : undefined,
        telepon: telepon !== undefined ? (telepon ? String(telepon).trim() : null) : undefined,
        email: email !== undefined ? (email ? String(email).trim() : null) : undefined,
        website: website !== undefined ? (website ? String(website).trim() : null) : undefined,
        logoUrl: logoUrl !== undefined ? (logoUrl ? String(logoUrl).trim() : null) : undefined,
        faviconUrl: faviconUrl !== undefined ? (faviconUrl ? String(faviconUrl).trim() : null) : undefined,
        ...(warnaPrimary ? { warnaPrimary: String(warnaPrimary).trim() } : {}),
        ...(warnaPrimaryDark ? { warnaPrimaryDark: String(warnaPrimaryDark).trim() } : {}),
        ...(warnaAccent ? { warnaAccent: String(warnaAccent).trim() } : {}),
        warnaSidebarStart: warnaSidebarStart !== undefined ? (warnaSidebarStart ? String(warnaSidebarStart).trim() : null) : undefined,
        warnaSidebarEnd: warnaSidebarEnd !== undefined ? (warnaSidebarEnd ? String(warnaSidebarEnd).trim() : null) : undefined,
        ...(temaPreset ? { temaPreset: String(temaPreset).trim() } : {}),
      }

      let updatedProfil
      if (existing) {
        updatedProfil = await tx.sekolahProfil.update({
          where: { id: existing.id },
          data: profilData,
          include: {
            jenjangUtama: {
              select: { id: true, kode: true, nama: true, active: true },
            },
          },
        })
      } else {
        updatedProfil = await tx.sekolahProfil.create({
          data: {
            namaSekolah: String(namaSekolah || 'Sistem Manajemen Sekolah').trim(),
            warnaPrimary: warnaPrimary || '#5d87ff',
            warnaPrimaryDark: warnaPrimaryDark || '#4570ea',
            warnaAccent: warnaAccent || '#13deb9',
            temaPreset: temaPreset || 'default',
            ...profilData,
          },
          include: {
            jenjangUtama: {
              select: { id: true, kode: true, nama: true, active: true },
            },
          },
        })
      }

      // 2. Sinkronisasi status active pada RefJenjang
      if (targetMode === 'SINGLE' && targetJenjangUtamaId) {
        // Pada single jenjang, hanya jenjang utama yang aktif
        await tx.refJenjang.updateMany({
          where: { id: targetJenjangUtamaId },
          data: { active: true },
        })
        await tx.refJenjang.updateMany({
          where: { id: { not: targetJenjangUtamaId } },
          data: { active: false },
        })
      } else if (targetMode === 'MULTI' && Array.isArray(activeJenjangIds) && activeJenjangIds.length > 0) {
        const validIds = activeJenjangIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
        await tx.refJenjang.updateMany({
          where: { id: { in: validIds } },
          data: { active: true },
        })
        await tx.refJenjang.updateMany({
          where: { id: { notIn: validIds } },
          data: { active: false },
        })
      }

      const daftarJenjang = await tx.refJenjang.findMany({
        orderBy: { urutan: 'asc' },
        select: { id: true, kode: true, nama: true, active: true, urutan: true },
      })

      return {
        ...updatedProfil,
        daftarJenjang,
      }
    })

    return apiSuccess({
      message: 'Profil sekolah dan konfigurasi mode satuan pendidikan berhasil diperbarui',
      data: result,
    })
  } catch (error: any) {
    console.error('API Profil Sekolah PUT Error:', error)
    return apiError('Gagal memperbarui profil sekolah: ' + (error?.message || 'Server error'), 500)
  }
}
