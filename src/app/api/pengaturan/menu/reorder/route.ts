import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/pengaturan/menu', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { items } = body // Array of { id: number, urutan: number, groupMenu?: string }

    if (!Array.isArray(items) || items.length === 0) {
      return apiError('Data urutan menu harus berupa array tidak kosong', 400)
    }

    const updates = items.map((item) =>
      prisma.secMenu.update({
        where: { id: item.id },
        data: {
          urutan: item.urutan,
          ...(item.groupMenu ? { groupMenu: item.groupMenu } : {}),
        },
      })
    )

    await prisma.$transaction(updates)

    return apiSuccess({
      message: 'Urutan menu berhasil diperbarui',
      data: null,
    })
  } catch (error: any) {
    console.error('API Menu Reorder Error:', error)
    return apiError('Gagal memperbarui urutan menu: ' + (error?.message || 'Server error'), 500)
  }
}
