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

  // Normalisasi path agar cocok (mencocokkan exact path atau prefix hierarki)
  const normalizedTarget = menuPath.replace(/\/$/, '') || '/'
  const perm = user.permissions.find((p) => {
    const pClean = p.menuPath.replace(/\/$/, '') || '/'
    return pClean === normalizedTarget || (pClean !== '/' && (normalizedTarget.startsWith(pClean + '/') || normalizedTarget === pClean))
  })

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
