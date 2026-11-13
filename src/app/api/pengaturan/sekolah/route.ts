import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET() {
  try {
    let profil = await prisma.sekolahProfil.findFirst()
    if (!profil) {
      profil = await prisma.sekolahProfil.create({
        data: {
          namaSekolah: 'Sistem Informasi Manajemen Sekolah Terpadu',
          npsn: '10203040',
          bentukPendidikan: 'Multi-Jenjang',
          warnaPrimary: '#5d87ff',
          warnaPrimaryDark: '#4570ea',
          warnaAccent: '#13deb9',
        },
      })
    }

    return apiSuccess({
      message: 'Profil sekolah berhasil dimuat',
      data: profil,
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

    let updated
    if (existing) {
      updated = await prisma.sekolahProfil.update({
        where: { id: existing.id },
        data: {
          ...(namaSekolah ? { namaSekolah: String(namaSekolah).trim() } : {}),
          npsn: npsn !== undefined ? (npsn ? String(npsn).trim() : null) : undefined,
          bentukPendidikan: bentukPendidikan !== undefined ? (bentukPendidikan ? String(bentukPendidikan).trim() : null) : undefined,
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
        },
      })
    } else {
      updated = await prisma.sekolahProfil.create({
        data: {
          namaSekolah: String(namaSekolah || 'Sistem Manajemen Sekolah').trim(),
          npsn,
          bentukPendidikan,
          sejarah,
          visiMisi,
          alamat,
          telepon,
          email,
          website,
          logoUrl,
          faviconUrl,
          warnaPrimary: warnaPrimary || '#5d87ff',
          warnaPrimaryDark: warnaPrimaryDark || '#4570ea',
          warnaAccent: warnaAccent || '#13deb9',
          warnaSidebarStart,
          warnaSidebarEnd,
          temaPreset: temaPreset || 'default',
        },
      })
    }

    return apiSuccess({
      message: 'Profil sekolah dan tema berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Profil Sekolah PUT Error:', error)
    return apiError('Gagal memperbarui profil sekolah: ' + (error?.message || 'Server error'), 500)
  }
}
