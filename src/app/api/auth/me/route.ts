import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return apiError('Sesi tidak valid atau telah berakhir', 401)
    }

    return apiSuccess({
      message: 'Sesi pengguna valid',
      data: user,
    })
  } catch (error: any) {
    console.error('API Auth Me Error:', error)
    return apiError('Gagal memverifikasi sesi: ' + (error?.message || 'Server error'), 500)
  }
}
