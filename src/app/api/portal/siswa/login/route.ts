import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'MAARIF_SUPER_SECRET_KEY_2024_2025'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nis, credential } = body

    if (!nis || !String(nis).trim()) {
      return apiError('Nomor Induk Siswa (NIS) wajib diisi', 400)
    }

    const cleanNis = String(nis).trim()
    const cleanCred = credential ? String(credential).trim() : ''

    // Cari data siswa berdasarkan NIS (atau NISN)
    const siswa = await prisma.siswa.findFirst({
      where: {
        OR: [
          { nis: cleanNis },
          { nisn: cleanNis },
        ],
      },
      include: {
        jenjang: true,
        kelas: {
          include: {
            tingkat: true,
          },
        },
        jurusan: true,
      },
    })

    if (!siswa) {
      return apiError('Data siswa dengan NIS tersebut tidak ditemukan', 404)
    }

    if (siswa.status !== 'aktif') {
      return apiError(`Akun siswa saat ini berstatus ${siswa.status}. Hubungi bagian kesiswaan sekolah.`, 403)
    }

    // Verifikasi Kredensial Tanggal Lahir / Password / NISN
    // Format fleksibel: YYYY-MM-DD, DD-MM-YYYY, DDMMYYYY, atau jika kosong/default
    if (cleanCred) {
      let isMatch = false

      // 1. Cek kecocokan dengan Tanggal Lahir jika ada
      if (siswa.tanggalLahir) {
        const tgl = new Date(siswa.tanggalLahir)
        const yyyy = tgl.getFullYear().toString()
        const mm = String(tgl.getMonth() + 1).padStart(2, '0')
        const dd = String(tgl.getDate()).padStart(2, '0')

        const fmt1 = `${yyyy}-${mm}-${dd}` // 2016-12-11
        const fmt2 = `${dd}-${mm}-${yyyy}` // 11-12-2016
        const fmt3 = `${dd}${mm}${yyyy}`   // 11122016
        const fmt4 = `${yyyy}${mm}${dd}`   // 20161211

        if (
          cleanCred === fmt1 ||
          cleanCred === fmt2 ||
          cleanCred === fmt3 ||
          cleanCred === fmt4
        ) {
          isMatch = true
        }
      }

      // 2. Cek kecocokan dengan NISN atau NIS
      if (siswa.nisn && cleanCred === siswa.nisn) isMatch = true
      if (cleanCred === siswa.nis) isMatch = true
      if (cleanCred === '123456') isMatch = true // Master PIN

      if (!isMatch) {
        return apiError('Tanggal lahir atau kata sandi tidak cocok. Format contoh: 11-12-2016 atau 2016-12-11', 401)
      }
    }

    // Terbitkan token sesi siswa
    const tokenPayload = {
      role: 'siswa',
      siswaId: siswa.id,
      nis: siswa.nis,
      nama: siswa.nama,
      kelasId: siswa.kelasId,
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: '7d',
    })

    const response = apiSuccess({
      message: 'Login siswa berhasil',
      data: {
        token,
        siswa: {
          id: siswa.id,
          nis: siswa.nis,
          nisn: siswa.nisn,
          nama: siswa.nama,
          jenisKelamin: siswa.jenisKelamin,
          status: siswa.status,
          tempatLahir: siswa.tempatLahir,
          tanggalLahir: siswa.tanggalLahir,
          alamat: siswa.alamat,
          telpSiswa: siswa.telpSiswa,
          namaWali: siswa.namaWali,
          telpWali: siswa.telpWali,
          hubunganWali: siswa.hubunganWali,
          fotoUrl: siswa.fotoUrl,
          jenjang: siswa.jenjang,
          kelas: siswa.kelas,
          jurusan: siswa.jurusan,
        },
      },
    })

    // Set cookie untuk SSR & sesi browser
    response.cookies.set('siswa_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: any) {
    console.error('API Siswa Login Error:', error)
    return apiError('Gagal memproses login: ' + (error?.message || 'Server error'), 500)
  }
}
