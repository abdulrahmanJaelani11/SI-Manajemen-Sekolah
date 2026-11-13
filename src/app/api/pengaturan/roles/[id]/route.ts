import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requireAuth, requirePermission } from '@/lib/auth/api-guard'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = await requireAuth(request)
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const roleId = parseInt(id, 10)

    if (isNaN(roleId)) {
      return apiError('ID peran tidak valid', 400)
    }

    const role = await prisma.secRole.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            users: true,
            roleMenus: true,
          },
        },
      },
    })

    if (!role) {
      return apiError('Peran tidak ditemukan', 404)
    }

    return apiSuccess({
      message: 'Detail peran berhasil dimuat',
      data: role,
    })
  } catch (error: any) {
    console.error('API Role [id] GET Error:', error)
    return apiError('Gagal memuat detail peran: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const auth = await requirePermission(request, '/pengaturan/role', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const roleId = parseInt(id, 10)

    if (isNaN(roleId)) {
      return apiError('ID peran tidak valid', 400)
    }

    const role = await prisma.secRole.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      return apiError('Peran tidak ditemukan', 404)
    }

    const body = await request.json()
    const { namaRole, keterangan, active } = body

    if (!namaRole || !String(namaRole).trim()) {
      return apiError('Nama peran wajib diisi', 400)
    }

    const trimmedNama = String(namaRole).trim()

    // Proteksi: Administrator (id 1) tidak boleh dinonaktifkan
    if (roleId === 1 && active === false) {
      return apiError('Peran Administrator adalah peran sistem utama dan tidak boleh dinonaktifkan', 400)
    }

    // Cek duplikasi nama jika nama diubah
    if (trimmedNama.toLowerCase() !== role.namaRole.toLowerCase()) {
      const existing = await prisma.secRole.findFirst({
        where: {
          namaRole: {
            equals: trimmedNama,
            mode: 'insensitive',
          },
          id: { not: roleId },
        },
      })

      if (existing) {
        return apiError(`Peran dengan nama "${trimmedNama}" sudah digunakan`, 400)
      }
    }

    const updated = await prisma.secRole.update({
      where: { id: roleId },
      data: {
        namaRole: trimmedNama,
        keterangan: keterangan !== undefined ? (keterangan ? String(keterangan).trim() : null) : role.keterangan,
        active: active !== undefined ? Boolean(active) : role.active,
      },
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
      message: 'Peran berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Role [id] PUT Error:', error)
    return apiError('Gagal memperbarui peran: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const auth = await requirePermission(request, '/pengaturan/role', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const roleId = parseInt(id, 10)

    if (isNaN(roleId)) {
      return apiError('ID peran tidak valid', 400)
    }

    // Proteksi: Role 1 (Administrator) tidak boleh dihapus
    if (roleId === 1) {
      return apiError('Peran Administrator adalah peran sistem terproteksi dan tidak dapat dihapus', 400)
    }

    const role = await prisma.secRole.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!role) {
      return apiError('Peran tidak ditemukan', 404)
    }

    // Proteksi data: Jika ada pengguna aktif yang menggunakan peran ini
    if (role._count.users > 0) {
      return apiError(
        `Tidak dapat menghapus peran "${role.namaRole}" karena masih digunakan oleh ${role._count.users} akun pengguna. Silakan alihkan peran pengguna terkait terlebih dahulu.`,
        400
      )
    }

    // Hapus peran (SecRoleMenu akan otomatis terhapus karena Cascade)
    await prisma.secRole.delete({
      where: { id: roleId },
    })

    return apiSuccess({
      message: `Peran "${role.namaRole}" berhasil dihapus`,
      data: null,
    })
  } catch (error: any) {
    console.error('API Role [id] DELETE Error:', error)
    return apiError('Gagal menghapus peran: ' + (error?.message || 'Server error'), 500)
  }
}

