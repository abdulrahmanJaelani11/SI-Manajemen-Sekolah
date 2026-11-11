import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { comparePassword } from '@/lib/auth/password'
import { signToken } from '@/lib/auth/jwt'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return apiError('Username dan password wajib diisi', 400)
    }

    const user = await prisma.secUser.findUnique({
      where: { username: String(username).trim() },
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
      },
    })

    if (!user) {
      return apiError('Username atau kata sandi tidak valid', 401)
    }

    if (!user.active) {
      return apiError('Akun Anda dinonaktifkan, hubungi administrator', 403)
    }

    if (!user.role || !user.role.active) {
      return apiError('Peran akun Anda tidak aktif', 403)
    }

    const isMatch = await comparePassword(password, user.password)
    if (!isMatch) {
      return apiError('Username atau kata sandi tidak valid', 401)
    }

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      namaLengkap: user.namaLengkap,
      roleId: user.roleId,
      roleName: user.role.namaRole,
    }

    const token = signToken(tokenPayload)

    const permissions = user.role.roleMenus.map((rm) => ({
      menuPath: rm.menu.path,
      menuName: rm.menu.namaMenu,
      canView: rm.canView,
      canCreate: rm.canCreate,
      canEdit: rm.canEdit,
      canDelete: rm.canDelete,
    }))

    const response = apiSuccess({
      message: 'Login berhasil',
      data: {
        token,
        user: {
          ...tokenPayload,
          email: user.email,
          permissions,
        },
      },
    })

    // Set cookie untuk SSR / middleware compatibility
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 hari
    })

    return response
  } catch (error: any) {
    console.error('API Login Error:', error)
    return apiError('Gagal memproses login: ' + (error?.message || 'Server error'), 500)
  }
}
