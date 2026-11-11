import { NextResponse } from 'next/server'
import { apiSuccess } from '@/lib/api-response'

export async function POST() {
  const response = apiSuccess({
    message: 'Logout sesi siswa berhasil',
    data: null,
  })

  response.cookies.set('siswa_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}
