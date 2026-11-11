import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const jenisPegawai = searchParams.get('jenisPegawai')
    const active = searchParams.get('active')

    const where: any = {}
    if (jenisPegawai) where.jenisPegawai = jenisPegawai
    if (active !== null && active !== undefined) where.active = active === 'true'

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search, mode: 'insensitive' } },
        { jabatan: { contains: search, mode: 'insensitive' } },
        { bidangStudi: { contains: search, mode: 'insensitive' } },
      ]
    }

    const pegawaiList = await prisma.pegawai.findMany({
      where,
      orderBy: [{ active: 'desc' }, { nama: 'asc' }],
    })

    const stats = {
      total: await prisma.pegawai.count(),
      guru: await prisma.pegawai.count({ where: { jenisPegawai: 'guru', active: true } }),
      stafTu: await prisma.pegawai.count({ where: { jenisPegawai: 'staf_tu', active: true } }),
      pimpinan: await prisma.pegawai.count({ where: { jenisPegawai: 'kepala_sekolah', active: true } }),
    }

    return apiSuccess({
      message: 'Data pegawai berhasil dimuat',
      data: pegawaiList,
      meta: { stats },
    })
  } catch (error: any) {
    console.error('API Pegawai GET Error:', error)
    return apiError('Gagal memuat data pegawai: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nip,
      nama,
      jenisKelamin,
      jenisPegawai,
      jabatan,
      bidangStudi,
      kontak,
      email,
      alamat,
      fotoUrl,
      statusKepegawaian,
    } = body

    if (!nama) {
      return apiError('Nama lengkap pegawai wajib diisi', 400)
    }

    if (nip) {
      const existing = await prisma.pegawai.findUnique({
        where: { nip: String(nip).trim() },
      })
      if (existing) {
        return apiError(`Pegawai dengan NIP "${nip}" sudah terdaftar`, 409)
      }
    }

    const created = await prisma.pegawai.create({
      data: {
        nip: nip ? String(nip).trim() : null,
        nama: String(nama).trim(),
        jenisKelamin: jenisKelamin === 'P' ? 'P' : 'L',
        jenisPegawai: jenisPegawai || 'guru',
        jabatan: jabatan ? String(jabatan).trim() : null,
        bidangStudi: bidangStudi ? String(bidangStudi).trim() : null,
        kontak: kontak ? String(kontak).trim() : null,
        email: email ? String(email).trim() : null,
        alamat: alamat ? String(alamat).trim() : null,
        fotoUrl: fotoUrl ? String(fotoUrl).trim() : null,
        statusKepegawaian: statusKepegawaian || 'tetap',
        active: true,
      },
    })

    return apiSuccess({
      message: 'Data pegawai berhasil ditambahkan',
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Pegawai POST Error:', error)
    return apiError('Gagal menambahkan data pegawai: ' + (error?.message || 'Server error'), 500)
  }
}
