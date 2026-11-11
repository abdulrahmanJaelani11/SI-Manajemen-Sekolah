import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleIdParam = searchParams.get('roleId')
    const roleId = roleIdParam ? parseInt(roleIdParam, 10) : 1

    const [menus, roleMenus, role] = await Promise.all([
      prisma.secMenu.findMany({
        orderBy: { urutan: 'asc' },
      }),
      prisma.secRoleMenu.findMany({
        where: { roleId },
      }),
      prisma.secRole.findUnique({
        where: { id: roleId },
      }),
    ])

    const permissionMap = new Map<number, any>()
    for (const rm of roleMenus) {
      permissionMap.set(rm.menuId, rm)
    }

    const matrix = menus.map((m) => {
      const perm = permissionMap.get(m.id)
      return {
        menuId: m.id,
        namaMenu: m.namaMenu,
        path: m.path,
        icon: m.icon,
        groupMenu: m.groupMenu,
        canView: perm ? perm.canView : false,
        canCreate: perm ? perm.canCreate : false,
        canEdit: perm ? perm.canEdit : false,
        canDelete: perm ? perm.canDelete : false,
      }
    })

    return apiSuccess({
      message: 'Matriks izin hak akses berhasil dimuat',
      data: {
        role,
        matrix,
      },
    })
  } catch (error: any) {
    console.error('API Hak Akses GET Error:', error)
    return apiError('Gagal memuat matriks hak akses: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roleId, permissions } = body

    if (!roleId || !Array.isArray(permissions)) {
      return apiError('Role ID dan daftar perizinan wajib disertakan', 400)
    }

    const parsedRoleId = parseInt(roleId, 10)

    // Simpan dalam transaksi Prisma
    await prisma.$transaction(
      permissions.map((p: any) =>
        prisma.secRoleMenu.upsert({
          where: {
            roleId_menuId: {
              roleId: parsedRoleId,
              menuId: parseInt(p.menuId, 10),
            },
          },
          update: {
            canView: Boolean(p.canView),
            canCreate: Boolean(p.canCreate),
            canEdit: Boolean(p.canEdit),
            canDelete: Boolean(p.canDelete),
          },
          create: {
            roleId: parsedRoleId,
            menuId: parseInt(p.menuId, 10),
            canView: Boolean(p.canView),
            canCreate: Boolean(p.canCreate),
            canEdit: Boolean(p.canEdit),
            canDelete: Boolean(p.canDelete),
          },
        })
      )
    )

    return apiSuccess({
      message: 'Matriks izin perizinan berhasil disimpan',
      data: null,
    })
  } catch (error: any) {
    console.error('API Hak Akses POST Error:', error)
    return apiError('Gagal menyimpan matriks hak akses: ' + (error?.message || 'Server error'), 500)
  }
}
