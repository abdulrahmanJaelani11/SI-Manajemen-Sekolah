import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Daftar rute dashboard yang diproteksi otentikasi pegawai / administrator
const DASHBOARD_ROUTES = [
  '/dashboard',
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
  '/sarpras',
  '/cms',
  '/pengaturan',
  '/user-profile',
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

  // 2. Redirect legacy /portal ke base URL /
  if (pathname === '/portal' || pathname === '/portal/') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. Redirect legacy /auth/login ke /login
  if (pathname === '/auth/login' || pathname === '/auth/login/') {
    const loginUrl = new URL('/login', request.url)
    request.nextUrl.searchParams.forEach((val, key) => loginUrl.searchParams.set(key, val))
    return NextResponse.redirect(loginUrl)
  }

  // 4. Proteksi Halaman Portal Siswa Mandiri
  if (pathname.startsWith('/portal/siswa')) {
    if (!siswaToken) {
      const loginUrl = new URL('/portal/login-siswa', request.url)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // 5. Jika pengguna sudah login ke dashboard dan mengakses /login, arahkan ke dashboard utama
  if (pathname === '/login' && authToken) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // 6. Proteksi Rute Dashboard Pegawai / Administrator
  const isDashboardRoute = DASHBOARD_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isDashboardRoute) {
    if (!authToken) {
      const loginUrl = new URL('/login', request.url)
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
