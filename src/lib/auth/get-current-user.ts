import { NextRequest } from 'next/server'
import { verifyToken, JwtPayloadUser } from './jwt'
import prisma from '../prisma'

export interface GuruScope {
  isGuru: boolean
  pegawaiId: number | null
  namaPegawai: string | null
  kelasIds: number[]
  jenjangIds: number[]
  kelasNames: string[]
  jenjangKodes: string[]
  isWaliKelas: boolean
  waliKelasNames: string[]
}

export interface AuthenticatedUser extends JwtPayloadUser {
  email?: string | null
  pegawaiId?: number | null
  jenjangId?: number | null
  jenjang?: { id: number; kode: string; nama: string } | null
  pegawai?: {
    id: number
    nip: string | null
    nama: string
    jenisPegawai: string
    bidangStudi: string | null
  } | null
  guruScope?: GuruScope
  permissions: {
    menuPath: string
    menuName: string
    canView: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
  }[]
}

export async function getCurrentUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  let token: string | null = null

  // 1. Cek Header Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  // 2. Cek Cookie jika header tidak tersedia
  if (!token) {
    const cookieToken = request.cookies.get('auth_token')?.value
    if (cookieToken) {
      token = cookieToken
    }
  }

  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  // Ambil data user terkini dan izin perannya dari database
  try {
    const user = await prisma.secUser.findUnique({
      where: { id: decoded.userId, active: true },
      include: {
        role: {
          include: {
            roleMenus: {
              include: {
                menu: true,
              },
            },
          },
        },
        jenjang: true,
        pegawai: {
          include: {
            mengajarMapel: {
              include: {
                kelas: {
                  include: {
                    jenjang: true,
                  },
                },
                mapel: true,
              },
            },
          },
        },
      },
    })

    if (!user || !user.role || !user.role.active) {
      return null
    }

    const permissions = user.role.roleMenus.map((rm) => ({
      menuPath: rm.menu.path,
      menuName: rm.menu.namaMenu,
      canView: rm.canView,
      canCreate: rm.canCreate,
      canEdit: rm.canEdit,
      canDelete: rm.canDelete,
    }))

    // Hitung cakupan penugasan guru (GuruScope)
    const isGuruRole = user.role.namaRole.toLowerCase().includes('guru') || user.role.namaRole.toLowerCase().includes('wali')
    const hasPegawai = !!user.pegawai
    const isGuru = isGuruRole || hasPegawai

    let guruScope: GuruScope | undefined = undefined

    if (isGuru) {
      const kelasMap = new Map<number, string>()
      const jenjangMap = new Map<number, string>()
      const waliKelasNames: string[] = []

      // 1. Dari penugasan jam mengajar (GuruMapelKelas)
      if (user.pegawai?.mengajarMapel) {
        for (const m of user.pegawai.mengajarMapel) {
          if (m.kelas) {
            kelasMap.set(m.kelas.id, m.kelas.namaKelas)
            if (m.kelas.jenjang) {
              jenjangMap.set(m.kelas.jenjang.id, m.kelas.jenjang.kode)
            }
          }
        }
      }

      // 2. Dari penugasan Wali Kelas
      const possibleNames = [user.namaLengkap, user.pegawai?.nama].filter(Boolean) as string[]
      if (possibleNames.length > 0) {
        const waliKelasList = await prisma.kelas.findMany({
          where: {
            active: true,
            waliKelas: {
              in: possibleNames,
              mode: 'insensitive',
            },
          },
          include: { jenjang: true },
        })

        for (const wk of waliKelasList) {
          kelasMap.set(wk.id, wk.namaKelas)
          waliKelasNames.push(wk.namaKelas)
          if (wk.jenjang) {
            jenjangMap.set(wk.jenjang.id, wk.jenjang.kode)
          }
        }
      }

      // 3. Tambahkan jenjang utama jika user memiliki jenjangId
      if (user.jenjang) {
        jenjangMap.set(user.jenjang.id, user.jenjang.kode)
      }

      guruScope = {
        isGuru: true,
        pegawaiId: user.pegawaiId || null,
        namaPegawai: user.pegawai?.nama || null,
        kelasIds: Array.from(kelasMap.keys()),
        jenjangIds: Array.from(jenjangMap.keys()),
        kelasNames: Array.from(kelasMap.values()),
        jenjangKodes: Array.from(jenjangMap.values()),
        isWaliKelas: waliKelasNames.length > 0,
        waliKelasNames,
      }
    }

    return {
      userId: user.id,
      username: user.username,
      namaLengkap: user.namaLengkap,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.namaRole,
      pegawaiId: user.pegawaiId,
      jenjangId: user.jenjangId,
      jenjang: user.jenjang ? { id: user.jenjang.id, kode: user.jenjang.kode, nama: user.jenjang.nama } : null,
      pegawai: user.pegawai
        ? {
            id: user.pegawai.id,
            nip: user.pegawai.nip,
            nama: user.pegawai.nama,
            jenisPegawai: user.pegawai.jenisPegawai,
            bidangStudi: user.pegawai.bidangStudi,
          }
        : null,
      guruScope,
      permissions,
    }
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}
