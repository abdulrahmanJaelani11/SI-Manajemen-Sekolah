import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'
import { PROTECTED_SYSTEM_PATHS } from '../route'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/pengaturan/menu', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const menuId = parseInt(id, 10)
    if (isNaN(menuId)) return apiError('ID menu tidak valid', 400)

    const existing = await prisma.secMenu.findUnique({ where: { id: menuId } })
    if (!existing) return apiError('Menu tidak ditemukan', 404)

    const body = await request.json()
    const { namaMenu, path, icon, groupMenu, urutan } = body

    let cleanPath = path ? String(path).trim() : existing.path
    if (cleanPath && !cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath
    }

    // Jika path diubah, periksa keunikan
    if (cleanPath !== existing.path) {
      if (PROTECTED_SYSTEM_PATHS.includes(existing.path)) {
        return apiError(`Rute sistem "${existing.path}" terproteksi dan tidak boleh diubah jalurnya.`, 403)
      }

      const duplicate = await prisma.secMenu.findUnique({
        where: { path: cleanPath },
      })
      if (duplicate && duplicate.id !== menuId) {
        return apiError(`Rute URL "${cleanPath}" sudah digunakan menu lain`, 409)
      }
    }

    const updated = await prisma.secMenu.update({
      where: { id: menuId },
      data: {
        ...(namaMenu ? { namaMenu: String(namaMenu).trim() } : {}),
        path: cleanPath,
        ...(icon !== undefined ? { icon: String(icon).trim() } : {}),
        ...(groupMenu !== undefined ? { groupMenu: String(groupMenu).trim() } : {}),
        ...(urutan !== undefined ? { urutan: parseInt(String(urutan), 10) || 0 } : {}),
      },
    })

    return apiSuccess({
      message: 'Menu berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Menu PUT Error:', error)
    return apiError('Gagal memperbarui menu: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requirePermission(request, '/pengaturan/menu', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const menuId = parseInt(id, 10)
    if (isNaN(menuId)) return apiError('ID menu tidak valid', 400)

    const existing = await prisma.secMenu.findUnique({ where: { id: menuId } })
    if (!existing) return apiError('Menu tidak ditemukan', 404)

    // Proteksi rute inti sistem
    if (PROTECTED_SYSTEM_PATHS.includes(existing.path)) {
      return apiError(
        `Menu "${existing.namaMenu}" (${existing.path}) merupakan rute sistem vital yang tidak boleh dihapus.`,
        403
      )
    }

    // Hapus keterkaitan di sec_role_menu lalu hapus sec_menu
    await prisma.$transaction([
      prisma.secRoleMenu.deleteMany({ where: { menuId } }),
      prisma.secMenu.delete({ where: { id: menuId } }),
    ])

    return apiSuccess({
      message: `Menu "${existing.namaMenu}" berhasil dihapus`,
      data: null,
    })
  } catch (error: any) {
    console.error('API Menu DELETE Error:', error)
    return apiError('Gagal menghapus menu: ' + (error?.message || 'Server error'), 500)
  }
}
