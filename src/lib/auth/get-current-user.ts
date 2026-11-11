import { NextRequest } from 'next/server'
import { verifyToken, JwtPayloadUser } from './jwt'
import prisma from '../prisma'

export interface AuthenticatedUser extends JwtPayloadUser {
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

    return {
      userId: user.id,
      username: user.username,
      namaLengkap: user.namaLengkap,
      roleId: user.roleId,
      roleName: user.role.namaRole,
      permissions,
    }
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}
