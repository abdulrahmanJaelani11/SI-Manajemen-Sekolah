import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requireAuth, requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('q') || ''
    const status = searchParams.get('status') || 'all'

    const where: any = {}

    if (search.trim()) {
      where.OR = [
        { namaRole: { contains: search.trim(), mode: 'insensitive' } },
        { keterangan: { contains: search.trim(), mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.active = true
    } else if (status === 'inactive') {
      where.active = false
    }

    const roles = await prisma.secRole.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            roleMenus: {
              where: {
                OR: [
                  { canView: true },
                  { canCreate: true },
                  { canEdit: true },
                  { canDelete: true },
                ],
              },
            },
          },
        },
      },
    })

    return apiSuccess({
      message: 'Data peran berhasil dimuat',
      data: roles,
    })
  } catch (error: any) {
    console.error('API Roles GET Error:', error)
    return apiError('Gagal memuat peran: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/pengaturan/role', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { namaRole, keterangan, active = true, cloneRoleId } = body

    if (!namaRole || !String(namaRole).trim()) {
      return apiError('Nama peran (role) wajib diisi', 400)
    }

    const trimmedNama = String(namaRole).trim()

    // Cek apakah nama role sudah digunakan
    const existing = await prisma.secRole.findFirst({
      where: {
        namaRole: {
          equals: trimmedNama,
          mode: 'insensitive',
        },
      },
    })

    if (existing) {
      return apiError(`Peran dengan nama "${trimmedNama}" sudah ada`, 400)
    }

    // Buat peran baru
    const createdRole = await prisma.secRole.create({
      data: {
        namaRole: trimmedNama,
        keterangan: keterangan ? String(keterangan).trim() : null,
        active: Boolean(active),
      },
    })

    // Jika ada cloneRoleId, salin hak akses dari peran acuan
    if (cloneRoleId) {
      const parsedCloneId = parseInt(String(cloneRoleId), 10)
      if (!isNaN(parsedCloneId)) {
        const sourcePermissions = await prisma.secRoleMenu.findMany({
          where: { roleId: parsedCloneId },
        })

        if (sourcePermissions.length > 0) {
          await prisma.secRoleMenu.createMany({
            data: sourcePermissions.map((sp) => ({
              roleId: createdRole.id,
              menuId: sp.menuId,
              canView: sp.canView,
              canCreate: sp.canCreate,
              canEdit: sp.canEdit,
              canDelete: sp.canDelete,
            })),
          })
        }
      }
    }

    const result = await prisma.secRole.findUnique({
      where: { id: createdRole.id },
      include: {
        _count: {
          select: {
            users: true,
            roleMenus: true,
          },
        },
      },
    })

    return apiSuccess({
      message: 'Peran baru berhasil ditambahkan',
      data: result,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Roles POST Error:', error)
    return apiError('Gagal menambahkan peran: ' + (error?.message || 'Server error'), 500)
  }
}
