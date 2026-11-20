import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export const PROTECTED_SYSTEM_PATHS = [
  '/',
  '/siswa',
  '/kelas',
  '/jurusan',
  '/pegawai',
  '/pengaturan/pengguna',
  '/pengaturan/role',
  '/pengaturan/hak-akses',
  '/pengaturan/menu',
  '/pengaturan/sekolah',
]

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/pengaturan/menu', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const group = searchParams.get('group')?.trim() || ''

    const where: any = {}
    if (group) {
      where.groupMenu = group
    }
    if (search) {
      where.OR = [
        { namaMenu: { contains: search, mode: 'insensitive' } },
        { path: { contains: search, mode: 'insensitive' } },
        { groupMenu: { contains: search, mode: 'insensitive' } },
      ]
    }

    const menus = await prisma.secMenu.findMany({
      where,
      orderBy: [
        { groupMenu: 'asc' },
        { urutan: 'asc' },
        { namaMenu: 'asc' },
      ],
      include: {
        _count: {
          select: {
            roleMenus: {
              where: { canView: true },
            },
          },
        },
      },
    })

    // Ambil daftar unik seluruh grup menu
    const allGroupsRaw = await prisma.secMenu.findMany({
      select: { groupMenu: true },
      distinct: ['groupMenu'],
      orderBy: { groupMenu: 'asc' },
    })
    const groups = allGroupsRaw.map((g) => g.groupMenu || 'Lainnya').filter(Boolean)

    const formattedMenus = menus.map((m) => ({
      id: m.id,
      namaMenu: m.namaMenu,
      path: m.path,
      icon: m.icon || 'solar:file-linear',
      groupMenu: m.groupMenu || 'Lainnya',
      urutan: m.urutan,
      rolesAllowedCount: m._count.roleMenus,
      isProtected: PROTECTED_SYSTEM_PATHS.includes(m.path),
    }))

    return apiSuccess({
      message: 'Daftar menu sistem berhasil dimuat',
      data: {
        menus: formattedMenus,
        groups,
        total: menus.length,
      },
    })
  } catch (error: any) {
    console.error('API Menu GET Error:', error)
    return apiError('Gagal memuat data menu: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/pengaturan/menu', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { namaMenu, path, icon, groupMenu, urutan } = body

    if (!namaMenu || !path) {
      return apiError('Nama menu dan rute URL (Path) wajib diisi', 400)
    }

    let cleanPath = String(path).trim()
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath
    }

    // Cek keunikan path
    const existing = await prisma.secMenu.findUnique({
      where: { path: cleanPath },
    })
    if (existing) {
      return apiError(`Rute URL "${cleanPath}" sudah terdaftar pada menu "${existing.namaMenu}"`, 409)
    }

    // Tentukan urutan default jika tidak diisi
    let parsedUrutan = parseInt(String(urutan), 10)
    if (isNaN(parsedUrutan)) {
      const lastInGroup = await prisma.secMenu.findFirst({
        where: { groupMenu: groupMenu ? String(groupMenu).trim() : 'Lainnya' },
        orderBy: { urutan: 'desc' },
        select: { urutan: true },
      })
      parsedUrutan = (lastInGroup?.urutan || 0) + 1
    }

    const newMenu = await prisma.secMenu.create({
      data: {
        namaMenu: String(namaMenu).trim(),
        path: cleanPath,
        icon: icon ? String(icon).trim() : 'solar:widget-2-linear',
        groupMenu: groupMenu ? String(groupMenu).trim() : 'Lainnya',
        urutan: parsedUrutan,
      },
    })

    // Otomatis berikan izin penuh kepada peran Administrator
    const adminRole = await prisma.secRole.findFirst({
      where: {
        OR: [
          { id: 1 },
          { namaRole: { equals: 'Administrator', mode: 'insensitive' } },
        ],
      },
    })

    if (adminRole) {
      await prisma.secRoleMenu.upsert({
        where: {
          roleId_menuId: {
            roleId: adminRole.id,
            menuId: newMenu.id,
          },
        },
        create: {
          roleId: adminRole.id,
          menuId: newMenu.id,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        },
        update: {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        },
      })
    }

    return apiSuccess({
      message: 'Menu baru berhasil ditambahkan',
      data: newMenu,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Menu POST Error:', error)
    return apiError('Gagal menambahkan menu: ' + (error?.message || 'Server error'), 500)
  }
}
