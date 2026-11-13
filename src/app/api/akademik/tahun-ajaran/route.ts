import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/tahun-ajaran', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const [periods, activePeriod, totalSiswaAktif, totalKelas] = await Promise.all([
      prisma.tahunAjaran.findMany({
        orderBy: [{ nama: 'desc' }, { semester: 'asc' }],
      }),
      prisma.tahunAjaran.findFirst({
        where: { isActive: true },
      }),
      prisma.siswa.count({ where: { status: 'aktif' } }),
      prisma.kelas.count({ where: { active: true } }),
    ])

    return apiSuccess({
      message: 'Data tahun ajaran berhasil dimuat',
      data: {
        periods,
        activePeriod,
        stats: {
          totalPeriode: periods.length,
          totalSiswaAktif,
          totalKelas,
        },
      },
    })
  } catch (error: any) {
    console.error('API Tahun Ajaran GET Error:', error)
    return apiError('Gagal memuat daftar tahun ajaran: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/tahun-ajaran', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      nama,
      semester = 'Ganjil',
      tanggalMulai,
      tanggalSelesai,
      isActive = false,
      keterangan,
    } = body

    const cleanNama = String(nama || '').trim()
    if (!cleanNama || !/^\d{4}\/\d{4}$/.test(cleanNama)) {
      return apiError('Format Tahun Ajaran harus seperti YYYY/YYYY (contoh: 2025/2026)', 400)
    }

    if (semester !== 'Ganjil' && semester !== 'Genap') {
      return apiError('Semester harus bernilai "Ganjil" atau "Genap"', 400)
    }

    const duplicate = await prisma.tahunAjaran.findUnique({
      where: {
        nama_semester: {
          nama: cleanNama,
          semester,
        },
      },
    })

    if (duplicate) {
      return apiError(`Periode ${cleanNama} Semester ${semester} sudah terdaftar.`, 400)
    }

    const created = await prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.tahunAjaran.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        })
      }

      return tx.tahunAjaran.create({
        data: {
          nama: cleanNama,
          semester,
          tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : null,
          tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : null,
          isActive: Boolean(isActive),
          keterangan: keterangan ? String(keterangan).trim() : null,
        },
      })
    })

    return apiSuccess({
      message: 'Periode tahun ajaran berhasil ditambahkan',
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Tahun Ajaran POST Error:', error)
    return apiError('Gagal menambah tahun ajaran: ' + (error?.message || 'Server error'), 500)
  }
}

