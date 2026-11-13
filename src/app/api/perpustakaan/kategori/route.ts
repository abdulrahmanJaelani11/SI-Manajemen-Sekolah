import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/perpustakaan/buku', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const kategori = await prisma.kategoriBuku.findMany({
      include: {
        _count: {
          select: { buku: true },
        },
      },
      orderBy: { nama: 'asc' },
    })

    return apiSuccess({
      data: kategori.map((k) => ({
        id: k.id,
        kode: k.kode,
        nama: k.nama,
        keterangan: k.keterangan,
        active: k.active,
        jumlahBuku: k._count.buku,
      })),
    })
  } catch (error: any) {
    console.error('Error fetching kategori buku:', error)
    return apiError(error.message || 'Gagal memuat kategori buku', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/perpustakaan/buku', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { kode, nama, keterangan } = body

    if (!kode || !nama) {
      return apiError('Kode dan nama kategori wajib diisi', 400)
    }

    const cleanKode = kode.trim().toUpperCase()
    const existing = await prisma.kategoriBuku.findUnique({
      where: { kode: cleanKode },
    })
    if (existing) {
      return apiError(`Kategori dengan kode ${cleanKode} sudah terdaftar`, 409)
    }

    const kategori = await prisma.kategoriBuku.create({
      data: {
        kode: cleanKode,
        nama: nama.trim(),
        keterangan: keterangan?.trim() || null,
      },
    })

    return apiSuccess({
      data: kategori,
      message: 'Kategori buku berhasil ditambahkan',
      status: 201,
    })
  } catch (error: any) {
    console.error('Error creating kategori buku:', error)
    return apiError(error.message || 'Gagal menambahkan kategori buku', 500)
  }
}

