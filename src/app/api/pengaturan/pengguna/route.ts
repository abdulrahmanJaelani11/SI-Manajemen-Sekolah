import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/pengaturan/pengguna', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const users = await prisma.secUser.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        email: true,
        roleId: true,
        pegawaiId: true,
        jenjangId: true,
        active: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            namaRole: true,
          },
        },
        pegawai: {
          select: {
            id: true,
            nama: true,
            nip: true,
            jenisPegawai: true,
            bidangStudi: true,
          },
        },
        jenjang: {
          select: {
            id: true,
            kode: true,
            nama: true,
          },
        },
      },
    })

    const [roles, pegawais, jenjangs] = await Promise.all([
      prisma.secRole.findMany({
        where: { active: true },
        orderBy: { id: 'asc' },
      }),
      prisma.pegawai.findMany({
        where: { active: true },
        orderBy: { nama: 'asc' },
        select: {
          id: true,
          nama: true,
          nip: true,
          jenisPegawai: true,
          bidangStudi: true,
        },
      }),
      prisma.refJenjang.findMany({
        where: { active: true },
        orderBy: { urutan: 'asc' },
        select: {
          id: true,
          kode: true,
          nama: true,
        },
      }),
    ])

    return apiSuccess({
      message: 'Data pengguna berhasil dimuat',
      data: { users, roles, pegawais, jenjangs },
    })
  } catch (error: any) {
    console.error('API User GET Error:', error)
    return apiError('Gagal memuat pengguna: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/pengaturan/pengguna', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { username, password, namaLengkap, email, roleId, pegawaiId, jenjangId } = body

    if (!username || !password || !namaLengkap || !roleId) {
      return apiError('Username, Password, Nama Lengkap, dan Role wajib diisi', 400)
    }

    if (String(password).trim().length < 6) {
      return apiError('Kata sandi harus memiliki panjang minimal 6 karakter', 400)
    }

    const cleanUsername = String(username).trim().toLowerCase()
    const existing = await prisma.secUser.findUnique({
      where: { username: cleanUsername },
    })
    if (existing) {
      return apiError(`Username "${cleanUsername}" sudah digunakan`, 409)
    }

    // Jika pegawaiId diisi, pastikan belum dipakai oleh akun lain
    const parsedPegawaiId = pegawaiId ? parseInt(pegawaiId, 10) : null
    if (parsedPegawaiId) {
      const existingPegawaiUser = await prisma.secUser.findUnique({
        where: { pegawaiId: parsedPegawaiId },
      })
      if (existingPegawaiUser) {
        return apiError('Profil Pegawai ini sudah ditautkan ke akun lain', 409)
      }
    }

    const hashedPassword = await hashPassword(password)

    const created = await prisma.secUser.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        namaLengkap: String(namaLengkap).trim(),
        email: email ? String(email).trim() : null,
        roleId: parseInt(roleId, 10),
        pegawaiId: parsedPegawaiId,
        jenjangId: jenjangId ? parseInt(jenjangId, 10) : null,
        active: true,
      },
      include: {
        role: true,
        pegawai: true,
        jenjang: true,
      },
    })

    return apiSuccess({
      message: 'Pengguna baru berhasil ditambahkan',
      data: {
        id: created.id,
        username: created.username,
        namaLengkap: created.namaLengkap,
        email: created.email,
        role: created.role,
        pegawai: created.pegawai,
        jenjang: created.jenjang,
        active: created.active,
      },
      status: 201,
    })
  } catch (error: any) {
    console.error('API User POST Error:', error)
    return apiError('Gagal menambahkan pengguna: ' + (error?.message || 'Server error'), 500)
  }
}
