import { AuthenticatedUser } from './get-current-user'

export type RbacAction = 'view' | 'create' | 'edit' | 'delete'

export function hasPermission(
  user: AuthenticatedUser | null,
  menuPath: string,
  action: RbacAction = 'view'
): boolean {
  if (!user) return false

  // Role Administrator selalu memiliki hak akses penuh
  if (user.roleName.toLowerCase() === 'administrator') {
    return true
  }

  // Normalisasi path agar cocok (misal mencocokkan prefix atau path exact)
  const normalizedTarget = menuPath.replace(/\/$/, '')
  const perm = user.permissions.find(
    (p) => p.menuPath.replace(/\/$/, '') === normalizedTarget
  )

  if (!perm) return false

  switch (action) {
    case 'view':
      return perm.canView
    case 'create':
      return perm.canCreate
    case 'edit':
      return perm.canEdit
    case 'delete':
      return perm.canDelete
    default:
      return false
  }
}
