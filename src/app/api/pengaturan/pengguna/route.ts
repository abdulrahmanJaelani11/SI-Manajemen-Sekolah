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
        active: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            namaRole: true,
          },
        },
      },
    })

    const roles = await prisma.secRole.findMany({
      where: { active: true },
      orderBy: { id: 'asc' },
    })

    return apiSuccess({
      message: 'Data pengguna berhasil dimuat',
      data: { users, roles },
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
    const { username, password, namaLengkap, email, roleId } = body

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

    const hashedPassword = await hashPassword(password)

    const created = await prisma.secUser.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        namaLengkap: String(namaLengkap).trim(),
        email: email ? String(email).trim() : null,
        roleId: parseInt(roleId, 10),
        active: true,
      },
      include: {
        role: true,
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
        active: created.active,
      },
      status: 201,
    })
  } catch (error: any) {
    console.error('API User POST Error:', error)
    return apiError('Gagal menambahkan pengguna: ' + (error?.message || 'Server error'), 500)
  }
}
