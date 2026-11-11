import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)
    if (isNaN(userId)) return apiError('ID tidak valid', 400)

    const body = await request.json()
    const { username, password, namaLengkap, email, roleId, active } = body

    const existing = await prisma.secUser.findUnique({ where: { id: userId } })
    if (!existing) return apiError('Pengguna tidak ditemukan', 404)

    // Cek username jika diubah
    if (username && username.trim().toLowerCase() !== existing.username) {
      const duplicate = await prisma.secUser.findUnique({
        where: { username: username.trim().toLowerCase() },
      })
      if (duplicate) return apiError('Username sudah digunakan pengguna lain', 409)
    }

    const updateData: any = {
      ...(username ? { username: username.trim().toLowerCase() } : {}),
      ...(namaLengkap ? { namaLengkap: String(namaLengkap).trim() } : {}),
      email: email !== undefined ? (email ? String(email).trim() : null) : undefined,
      ...(roleId ? { roleId: parseInt(roleId, 10) } : {}),
      ...(active !== undefined ? { active: Boolean(active) } : {}),
    }

    // Jika password baru diisi
    if (password && String(password).trim().length > 0) {
      updateData.password = await hashPassword(String(password).trim())
    }

    const updated = await prisma.secUser.update({
      where: { id: userId },
      data: updateData,
      include: { role: true },
    })

    return apiSuccess({
      message: 'Data pengguna berhasil diperbarui',
      data: {
        id: updated.id,
        username: updated.username,
        namaLengkap: updated.namaLengkap,
        email: updated.email,
        role: updated.role,
        active: updated.active,
      },
    })
  } catch (error: any) {
    console.error('API User PUT Error:', error)
    return apiError('Gagal memperbarui pengguna: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id, 10)
    if (isNaN(userId)) return apiError('ID tidak valid', 400)

    const existing = await prisma.secUser.findUnique({ where: { id: userId } })
    if (!existing) return apiError('Pengguna tidak ditemukan', 404)

    // Proteksi akun admin utama
    if (existing.username === 'admin') {
      return apiError('Akun Administrator utama tidak dapat dihapus', 403)
    }

    await prisma.secUser.delete({ where: { id: userId } })

    return apiSuccess({
      message: 'Pengguna berhasil dihapus',
      data: null,
    })
  } catch (error: any) {
    console.error('API User DELETE Error:', error)
    return apiError('Gagal menghapus pengguna: ' + (error?.message || 'Server error'), 500)
  }
}
