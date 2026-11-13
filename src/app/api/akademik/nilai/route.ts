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

    const tahunAjaran = searchParams.get('tahunAjaran')?.trim() || activePeriod?.nama || '2024/2025'
    const semester = searchParams.get('semester')?.trim() || activePeriod?.semester || 'Ganjil'
    const kelasIdParam = searchParams.get('kelasId')
    const mapelIdParam = searchParams.get('mapelId')

    const [kelasList, mapelList, allPeriods, bobotRecord] = await Promise.all([
      prisma.kelas.findMany({
        where: { active: true },
        orderBy: [{ jenjang: { urutan: 'asc' } }, { namaKelas: 'asc' }],
        include: { jenjang: true, jurusan: true },
      }),
      prisma.mataPelajaran.findMany({
        where: { active: true },
        orderBy: { nama: 'asc' },
      }),
      prisma.tahunAjaran.findMany({
        orderBy: [{ nama: 'desc' }, { semester: 'asc' }],
      }),
      prisma.bobotPenilaian.findUnique({
        where: {
          tahunAjaran_semester: { tahunAjaran, semester },
        },
      }),
    ])

    const bobot = bobotRecord || {
      tahunAjaran,
      semester,
      bobotTugas: 40,
      bobotPts: 25,
      bobotPas: 35,
    }

    let siswaRows: any[] = []
    let pengampuInfo: any = null
    let selectedMapel: any = null

    if (kelasIdParam && mapelIdParam) {
      const kelasId = parseInt(kelasIdParam, 10)
      const mapelId = parseInt(mapelIdParam, 10)

      if (!isNaN(kelasId) && !isNaN(mapelId)) {
        const [students, existingGrades, pengampu, mapel] = await Promise.all([
          prisma.siswa.findMany({
            where: { kelasId, status: 'aktif' },
            orderBy: { nama: 'asc' },
            select: { id: true, nis: true, nisn: true, nama: true, jenisKelamin: true, fotoUrl: true },
          }),
          prisma.nilaiSiswa.findMany({
            where: {
              kelasId,
              mapelId,
              tahunAjaran,
              semester,
            },
          }),
          prisma.guruMapelKelas.findUnique({
            where: {
              kelasId_mapelId_tahunAjaran_semester: {
                kelasId,
                mapelId,
                tahunAjaran,
                semester,
              },
            },
            include: { guru: { select: { id: true, nama: true, nip: true } } },
          }),
          prisma.mataPelajaran.findUnique({ where: { id: mapelId } }),
        ])

        selectedMapel = mapel
        pengampuInfo = pengampu

        const gradeMap = new Map<number, any>()
        for (const g of existingGrades) {
          gradeMap.set(g.siswaId, g)
        }

        siswaRows = students.map((s) => {
          const g = gradeMap.get(s.id)
          return {
            siswaId: s.id,
            nis: s.nis,
            nisn: s.nisn,
            nama: s.nama,
            jenisKelamin: s.jenisKelamin,
            fotoUrl: s.fotoUrl,
            nilaiTugas: g ? g.nilaiTugas : 0,
            nilaiPts: g ? g.nilaiPts : 0,
            nilaiPas: g ? g.nilaiPas : 0,
            nilaiAkhir: g ? g.nilaiAkhir : 0,
            predikat: g ? g.predikat : 'D',
            deskripsi: g?.deskripsi || '',
            sudahDinilai: Boolean(g),
            updatedAt: g?.updatedAt || null,
          }
        })
      }
    }

    return apiSuccess({
      message: 'Data penilaian siswa berhasil dimuat',
      data: {
        tahunAjaran,
        semester,
        activePeriod,
        allPeriods,
        bobot,
        kelasList,
        mapelList,
        selectedMapel,
        pengampuInfo,
        siswaRows,
      },
    })
  } catch (error: any) {
    console.error('API Nilai GET Error:', error)
    return apiError('Gagal memuat data penilaian: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/nilai', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      kelasId,
      mapelId,
      guruId,
      tahunAjaran,
      semester = 'Ganjil',
      entries,
    } = body

    if (!kelasId || !mapelId || !tahunAjaran || !Array.isArray(entries) || entries.length === 0) {
      return apiError('Kelas, Mata Pelajaran, Tahun Ajaran, dan daftar nilai siswa wajib diisi', 400)
    }

    const cleanTa = String(tahunAjaran).trim()
    const cleanSem = String(semester)
    const kId = Number(kelasId)
    const mId = Number(mapelId)

    const [mapel, bobotRecord, pengampu] = await Promise.all([
      prisma.mataPelajaran.findUnique({ where: { id: mId } }),
      prisma.bobotPenilaian.findUnique({
        where: { tahunAjaran_semester: { tahunAjaran: cleanTa, semester: cleanSem } },
      }),
      prisma.guruMapelKelas.findUnique({
        where: {
          kelasId_mapelId_tahunAjaran_semester: {
            kelasId: kId,
            mapelId: mId,
            tahunAjaran: cleanTa,
            semester: cleanSem,
          },
        },
      }),
    ])

    if (!mapel) return apiError('Mata pelajaran tidak ditemukan', 404)

    const bobot = bobotRecord || { bobotTugas: 40, bobotPts: 25, bobotPas: 35 }
    const kkm = mapel.kkm || 75
    const resolvedGuruId = guruId ? Number(guruId) : pengampu?.guruId || null
    const updatedByName = auth.user.namaLengkap || auth.user.username

    const clamp = (n: any) => Math.min(100, Math.max(0, Number(n) || 0))

    await prisma.$transaction(async (tx) => {
      for (const item of entries) {
        const siswaId = Number(item.siswaId)
        if (!siswaId || isNaN(siswaId)) continue

        const nTugas = clamp(item.nilaiTugas)
        const nPts = clamp(item.nilaiPts)
        const nPas = clamp(item.nilaiPas)
        const nilaiAkhir = calculateNilaiAkhir(nTugas, nPts, nPas, bobot)
        const predikat = getPredikat(nilaiAkhir, kkm)

        await tx.nilaiSiswa.upsert({
          where: {
            siswaId_mapelId_tahunAjaran_semester: {
              siswaId,
              mapelId: mId,
              tahunAjaran: cleanTa,
              semester: cleanSem,
            },
          },
          update: {
            kelasId: kId,
            guruId: resolvedGuruId,
            nilaiTugas: nTugas,
            nilaiPts: nPts,
            nilaiPas: nPas,
            nilaiAkhir,
            predikat,
            deskripsi: item.deskripsi ? String(item.deskripsi).trim() : null,
            updatedBy: updatedByName,
          },
          create: {
            siswaId,
            kelasId: kId,
            mapelId: mId,
            guruId: resolvedGuruId,
            tahunAjaran: cleanTa,
            semester: cleanSem,
            nilaiTugas: nTugas,
            nilaiPts: nPts,
            nilaiPas: nPas,
            nilaiAkhir,
            predikat,
            deskripsi: item.deskripsi ? String(item.deskripsi).trim() : null,
            updatedBy: updatedByName,
          },
        })
      }
    })

    return apiSuccess({
      message: `Berhasil menyimpan nilai ${entries.length} siswa untuk mata pelajaran ${mapel.nama}`,
      data: { savedCount: entries.length },
    })
  } catch (error: any) {
    console.error('API Nilai POST Error:', error)
    return apiError('Gagal menyimpan nilai siswa: ' + (error?.message || 'Server error'), 500)
  }
}

