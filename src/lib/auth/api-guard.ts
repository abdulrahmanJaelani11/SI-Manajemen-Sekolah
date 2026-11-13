import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, AuthenticatedUser } from './get-current-user'
import { hasPermission, RbacAction } from './rbac'
import { apiError } from '../api-response'

type GuardResult =
  | { user: AuthenticatedUser; errorResponse: null }
  | { user: null; errorResponse: NextResponse }

/**
 * Memastikan request memiliki token autentikasi pengguna yang valid.
 */
export async function requireAuth(request: NextRequest): Promise<GuardResult> {
  const user = await getCurrentUser(request)

  if (!user) {
    return {
      user: null,
      errorResponse: apiError('Otentikasi diperlukan. Sesi tidak ditemukan atau telah kedaluwarsa.', 401),
    }
  }

  return { user, errorResponse: null }
}

/**
 * Memastikan request memiliki izin spesifik pada suatu menu berdasarkan RBAC.
 */
export async function requirePermission(
  request: NextRequest,
  menuPath: string,
  action: RbacAction = 'view'
): Promise<GuardResult> {
  const auth = await requireAuth(request)
  if (auth.errorResponse) {
    return auth
  }

  const { user } = auth
  const allowed = hasPermission(user, menuPath, action)

  if (!allowed) {
    return {
      user: null,
      errorResponse: apiError(
        `Akses ditolak. Peran "${user.roleName}" tidak memiliki hak akses [${action.toUpperCase()}] untuk menu ${menuPath}.`,
        403
      ),
    }
  }

  return { user, errorResponse: null }
}

/**
 * Memastikan request hanya dapat dilakukan oleh peran Administrator utama.
 */
export async function requireAdmin(request: NextRequest): Promise<GuardResult> {
  const auth = await requireAuth(request)
  if (auth.errorResponse) {
    return auth
  }

  const { user } = auth
  const isAdmin = user.roleName.toLowerCase() === 'administrator' || user.roleId === 1

  if (!isAdmin) {
    return {
      user: null,
      errorResponse: apiError('Akses ditolak. Tindakan ini hanya dapat dilakukan oleh Administrator.', 403),
    }
  }

  return { user, errorResponse: null }
}

