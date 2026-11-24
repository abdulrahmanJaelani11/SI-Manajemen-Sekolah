import { NextRequest } from 'next/server'
import { apiSuccess } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { logAudit } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (user) {
      await logAudit({
        request,
        userId: user.userId,
        username: user.username,
        namaUser: user.namaLengkap,
        role: user.roleName,
        modul: 'AUTH',
        aksi: 'LOGOUT',
        deskripsi: `Pengguna ${user.namaLengkap} (@${user.username}) keluar dari sistem`,
        status: 'SUCCESS',
      })
    }
  } catch {
    // ignore
  }

  const response = apiSuccess({
    message: 'Logout berhasil',
    data: null,
  })

  // Hapus cookie sesi
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}
