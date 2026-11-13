import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Daftar rute dashboard yang diproteksi otentikasi pegawai / administrator
const DASHBOARD_ROUTES = [
  '/',
  '/siswa',
  '/kelas',
  '/jurusan',
  '/pegawai',
  '/akademik',
  '/absensi',
  '/kesiswaan',
  '/spp',
  '/keuangan',
  '/perpustakaan',
  '/cms',
  '/pengaturan',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Abaikan file statis, _next, favicon, gambar, dan assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const authToken = request.cookies.get('auth_token')?.value
  const siswaToken = request.cookies.get('siswa_token')?.value

  // 2. Proteksi Halaman Portal Siswa Mandiri
  if (pathname.startsWith('/portal/siswa')) {
    if (!siswaToken) {
      const loginUrl = new URL('/portal/login-siswa', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // 3. Jika pengguna sudah login ke dashboard dan mengakses /auth/login, arahkan ke dashboard utama
  if (pathname === '/auth/login' && authToken) {
    const dashboardUrl = new URL('/', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // 4. Proteksi Rute Dashboard
  const isDashboardRoute = DASHBOARD_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isDashboardRoute) {
    if (!authToken) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua path request kecuali:
     * - api routes (diperiksa di level handler dengan response JSON standar)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

