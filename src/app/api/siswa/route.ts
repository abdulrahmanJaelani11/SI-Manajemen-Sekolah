import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const jenjangId = searchParams.get('jenjangId')
    const kelasId = searchParams.get('kelasId')
    const jurusanId = searchParams.get('jurusanId')
    const status = searchParams.get('status')
    const jenisKelamin = searchParams.get('jenisKelamin')

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    const where: any = {}

    if (jenjangId) where.jenjangId = parseInt(jenjangId, 10)
    if (kelasId) where.kelasId = parseInt(kelasId, 10)
    if (jurusanId) where.jurusanId = parseInt(jurusanId, 10)
    if (status) where.status = status
    if (jenisKelamin) where.jenisKelamin = jenisKelamin

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { nis: { contains: search, mode: 'insensitive' } },
        { nisn: { contains: search, mode: 'insensitive' } },
        { namaWali: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [total, items] = await Promise.all([
      prisma.siswa.count({ where }),
      prisma.siswa.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ jenjang: { urutan: 'asc' } }, { nama: 'asc' }],
        include: {
          jenjang: true,
          kelas: {
            include: {
              tingkat: true,
            },
          },
          jurusan: true,
        },
      }),
    ])

    return apiSuccess({
      message: 'Data siswa berhasil dimuat',
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('API Siswa GET Error:', error)
    return apiError('Gagal memuat daftar siswa: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      jenjangId,
      kelasId,
      jurusanId,
      nis,
      nisn,
      nama,
      jenisKelamin,
      tahunMasuk,
      status,
      tempatLahir,
      tanggalLahir,
      alamat,
      telpSiswa,
      emailSiswa,
      namaWali,
      telpWali,
      pekerjaanWali,
      hubunganWali,
      prestasi,
      fotoUrl,
    } = body

    if (!jenjangId || !nis || !nama || !jenisKelamin) {
      return apiError('Jenjang, NIS, Nama Lengkap, dan Jenis Kelamin wajib diisi', 400)
    }

    // Cek keunikan NIS
    const existingNis = await prisma.siswa.findUnique({
      where: { nis: String(nis).trim() },
    })
    if (existingNis) {
      return apiError(`Siswa dengan NIS "${nis}" sudah terdaftar di sistem`, 409)
    }

    const created = await prisma.siswa.create({
      data: {
        jenjangId: parseInt(jenjangId, 10),
        kelasId: kelasId ? parseInt(kelasId, 10) : null,
        jurusanId: jurusanId ? parseInt(jurusanId, 10) : null,
        nis: String(nis).trim(),
        nisn: nisn ? String(nisn).trim() : null,
        nama: String(nama).trim(),
        jenisKelamin: jenisKelamin === 'P' ? 'P' : 'L',
        tahunMasuk: tahunMasuk ? parseInt(tahunMasuk, 10) : new Date().getFullYear(),
        status: status || 'aktif',
        tempatLahir: tempatLahir ? String(tempatLahir).trim() : null,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
        alamat: alamat ? String(alamat).trim() : null,
        telpSiswa: telpSiswa ? String(telpSiswa).trim() : null,
        emailSiswa: emailSiswa ? String(emailSiswa).trim() : null,
        namaWali: namaWali ? String(namaWali).trim() : null,
        telpWali: telpWali ? String(telpWali).trim() : null,
        pekerjaanWali: pekerjaanWali ? String(pekerjaanWali).trim() : null,
        hubunganWali: hubunganWali ? String(hubunganWali).trim() : 'Orang Tua',
        prestasi: prestasi ? String(prestasi).trim() : null,
        fotoUrl: fotoUrl ? String(fotoUrl).trim() : null,
      },
      include: {
        jenjang: true,
        kelas: true,
        jurusan: true,
      },
    })

    return apiSuccess({
      message: 'Data siswa baru berhasil ditambahkan',
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Siswa POST Error:', error)
    return apiError('Gagal menambahkan siswa: ' + (error?.message || 'Server error'), 500)
  }
}
