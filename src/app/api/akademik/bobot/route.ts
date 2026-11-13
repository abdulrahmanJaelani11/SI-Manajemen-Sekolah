import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'
import { calculateNilaiAkhir, getPredikat } from '@/lib/akademik/grade-utils'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/nilai', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const activePeriod = await prisma.tahunAjaran.findFirst({ where: { isActive: true } })
    const tahunAjaran = searchParams.get('tahunAjaran') || activePeriod?.nama || '2024/2025'
    const semester = searchParams.get('semester') || activePeriod?.semester || 'Ganjil'

    const bobot = await prisma.bobotPenilaian.findUnique({
      where: {
        tahunAjaran_semester: { tahunAjaran, semester },
      },
    })

    return apiSuccess({
      message: 'Bobot penilaian berhasil dimuat',
      data: bobot || {
        tahunAjaran,
        semester,
        bobotTugas: 40,
        bobotPts: 25,
        bobotPas: 35,
      },
    })
  } catch (error: any) {
    console.error('API Bobot GET Error:', error)
    return apiError('Gagal memuat bobot penilaian: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/nilai', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { tahunAjaran, semester = 'Ganjil', bobotTugas, bobotPts, bobotPas } = body

    const wTugas = Number(bobotTugas)
    const wPts = Number(bobotPts)
    const wPas = Number(bobotPas)

    if (
      isNaN(wTugas) ||
      isNaN(wPts) ||
      isNaN(wPas) ||
      wTugas < 0 ||
      wPts < 0 ||
      wPas < 0 ||
      wTugas + wPts + wPas !== 100
    ) {
      return apiError('Total bobot (Tugas + PTS + PAS) harus tepat 100%', 400)
    }

    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.bobotPenilaian.upsert({
        where: {
          tahunAjaran_semester: {
            tahunAjaran: String(tahunAjaran),
            semester: String(semester),
          },
        },
        update: { bobotTugas: wTugas, bobotPts: wPts, bobotPas: wPas },
        create: {
          tahunAjaran: String(tahunAjaran),
          semester: String(semester),
          bobotTugas: wTugas,
          bobotPts: wPts,
          bobotPas: wPas,
        },
      })

      // Hitung ulang nilai akhir yang sudah ada pada periode ini
      const existingGrades = await tx.nilaiSiswa.findMany({
        where: { tahunAjaran: String(tahunAjaran), semester: String(semester) },
        include: { mapel: { select: { kkm: true } } },
      })

      for (const g of existingGrades) {
        const nilaiAkhir = calculateNilaiAkhir(g.nilaiTugas, g.nilaiPts, g.nilaiPas, {
          bobotTugas: wTugas,
          bobotPts: wPts,
          bobotPas: wPas,
        })
        const predikat = getPredikat(nilaiAkhir, g.mapel?.kkm || 75)
        await tx.nilaiSiswa.update({
          where: { id: g.id },
          data: { nilaiAkhir, predikat },
        })
      }

      return saved
    })

    return apiSuccess({
      message: 'Bobot penilaian berhasil disimpan dan nilai akhir diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Bobot PUT Error:', error)
    return apiError('Gagal menyimpan bobot penilaian: ' + (error?.message || 'Server error'), 500)
  }
}

