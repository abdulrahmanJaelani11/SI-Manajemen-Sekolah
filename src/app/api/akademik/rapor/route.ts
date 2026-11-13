import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/rapor', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const activePeriod = await prisma.tahunAjaran.findFirst({ where: { isActive: true } })

    const tahunAjaran = searchParams.get('tahunAjaran')?.trim() || activePeriod?.nama || '2024/2025'
    const semester = searchParams.get('semester')?.trim() || activePeriod?.semester || 'Ganjil'
    const kelasIdParam = searchParams.get('kelasId')

    const [kelasList, allPeriods, sekolahProfil, kepalaSekolah] = await Promise.all([
      prisma.kelas.findMany({
        where: { active: true },
        orderBy: [{ jenjang: { urutan: 'asc' } }, { namaKelas: 'asc' }],
        include: { jenjang: true, tingkat: true, jurusan: true },
      }),
      prisma.tahunAjaran.findMany({
        orderBy: [{ nama: 'desc' }, { semester: 'asc' }],
      }),
      prisma.sekolahProfil.findFirst(),
      prisma.pegawai.findFirst({
        where: { jenisPegawai: 'kepala_sekolah', active: true },
      }),
    ])

    let selectedKelas: any = null
    let rekapSiswa: any[] = []

    if (kelasIdParam) {
      const kelasId = parseInt(kelasIdParam, 10)
      if (!isNaN(kelasId)) {
        selectedKelas = kelasList.find((k) => k.id === kelasId) || null

        const [students, allGrades, allRapor] = await Promise.all([
          prisma.siswa.findMany({
            where: { kelasId, status: 'aktif' },
            orderBy: { nama: 'asc' },
            select: {
              id: true,
              nis: true,
              nisn: true,
              nama: true,
              jenisKelamin: true,
              tempatLahir: true,
              tanggalLahir: true,
              alamat: true,
              namaWali: true,
              fotoUrl: true,
            },
          }),
          prisma.nilaiSiswa.findMany({
            where: { kelasId, tahunAjaran, semester },
            orderBy: [{ mapel: { kelompok: 'asc' } }, { mapel: { nama: 'asc' } }],
            include: {
              mapel: true,
              guru: { select: { id: true, nama: true } },
            },
          }),
          prisma.raporSiswa.findMany({
            where: { kelasId, tahunAjaran, semester },
          }),
        ])

        const gradesBySiswa = new Map<number, any[]>()
        for (const g of allGrades) {
          if (!gradesBySiswa.has(g.siswaId)) gradesBySiswa.set(g.siswaId, [])
          gradesBySiswa.get(g.siswaId)!.push(g)
        }

        const raporBySiswa = new Map<number, any>()
        for (const r of allRapor) {
          raporBySiswa.set(r.siswaId, r)
        }

        const rawList = students.map((s) => {
          const nilaiList = gradesBySiswa.get(s.id) || []
          const totalNilai = nilaiList.reduce((acc, n) => acc + (n.nilaiAkhir || 0), 0)
          const rataRata =
            nilaiList.length > 0 ? Math.round((totalNilai / nilaiList.length) * 10) / 10 : 0
          const jumlahTuntas = nilaiList.filter(
            (n) => (n.nilaiAkhir || 0) >= (n.mapel?.kkm || 75)
          ).length
          const rapor = raporBySiswa.get(s.id) || {
            siswaId: s.id,
            kelasId,
            tahunAjaran,
            semester,
            sikapSpiritual: 'Baik',
            sikapSosial: 'Baik',
            sakit: 0,
            izin: 0,
            alpa: 0,
            ekstrakurikuler: '',
            catatanWali: '',
            keputusan: '',
            status: 'draft',
            tanggalTerbit: null,
          }

          return {
            siswa: s,
            nilaiList,
            jumlahMapel: nilaiList.length,
            jumlahTuntas,
            totalNilai: Math.round(totalNilai * 10) / 10,
            rataRata,
            rapor,
          }
        })

        // Hitung peringkat kelas berdasarkan rataRata desc
        const sortedForRank = [...rawList].sort((a, b) => b.rataRata - a.rataRata)
        const rankMap = new Map<number, number>()
        sortedForRank.forEach((item, idx) => {
          rankMap.set(item.siswa.id, item.jumlahMapel > 0 ? idx + 1 : 0)
        })

        rekapSiswa = rawList.map((item) => ({
          ...item,
          peringkat: rankMap.get(item.siswa.id) || 0,
        }))
      }
    }

    return apiSuccess({
      message: 'Data rekapitulasi & e-rapor berhasil dimuat',
      data: {
        tahunAjaran,
        semester,
        activePeriod,
        allPeriods,
        kelasList,
        selectedKelas,
        sekolahProfil,
        kepalaSekolah,
        rekapSiswa,
      },
    })
  } catch (error: any) {
    console.error('API Rapor GET Error:', error)
    return apiError('Gagal memuat data rapor: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/rapor', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      siswaId,
      kelasId,
      tahunAjaran,
      semester = 'Ganjil',
      sikapSpiritual = 'Baik',
      sikapSosial = 'Baik',
      sakit = 0,
      izin = 0,
      alpa = 0,
      ekstrakurikuler,
      catatanWali,
      keputusan,
      status = 'draft',
    } = body

    if (!siswaId || !kelasId || !tahunAjaran) {
      return apiError('Siswa, Kelas, dan Tahun Ajaran wajib diisi', 400)
    }

    const isPublished = status === 'diterbitkan'

    const saved = await prisma.raporSiswa.upsert({
      where: {
        siswaId_tahunAjaran_semester: {
          siswaId: Number(siswaId),
          tahunAjaran: String(tahunAjaran),
          semester: String(semester),
        },
      },
      update: {
        kelasId: Number(kelasId),
        sikapSpiritual: String(sikapSpiritual || 'Baik'),
        sikapSosial: String(sikapSosial || 'Baik'),
        sakit: Math.max(0, Number(sakit) || 0),
        izin: Math.max(0, Number(izin) || 0),
        alpa: Math.max(0, Number(alpa) || 0),
        ekstrakurikuler: ekstrakurikuler ? String(ekstrakurikuler).trim() : null,
        catatanWali: catatanWali ? String(catatanWali).trim() : null,
        keputusan: keputusan ? String(keputusan).trim() : null,
        status: isPublished ? 'diterbitkan' : 'draft',
        tanggalTerbit: isPublished ? new Date() : null,
      },
      create: {
        siswaId: Number(siswaId),
        kelasId: Number(kelasId),
        tahunAjaran: String(tahunAjaran),
        semester: String(semester),
        sikapSpiritual: String(sikapSpiritual || 'Baik'),
        sikapSosial: String(sikapSosial || 'Baik'),
        sakit: Math.max(0, Number(sakit) || 0),
        izin: Math.max(0, Number(izin) || 0),
        alpa: Math.max(0, Number(alpa) || 0),
        ekstrakurikuler: ekstrakurikuler ? String(ekstrakurikuler).trim() : null,
        catatanWali: catatanWali ? String(catatanWali).trim() : null,
        keputusan: keputusan ? String(keputusan).trim() : null,
        status: isPublished ? 'diterbitkan' : 'draft',
        tanggalTerbit: isPublished ? new Date() : null,
      },
    })

    return apiSuccess({
      message: isPublished
        ? 'Catatan rapor disimpan dan diterbitkan ke Portal Siswa'
        : 'Catatan rapor disimpan sebagai draft',
      data: saved,
    })
  } catch (error: any) {
    console.error('API Rapor POST Error:', error)
    return apiError('Gagal menyimpan data rapor: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/rapor', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { kelasId, tahunAjaran, semester = 'Ganjil', action } = body

    if (!kelasId || !tahunAjaran || !['publish_all', 'unpublish_all'].includes(action)) {
      return apiError('Parameter tidak valid', 400)
    }

    const kId = Number(kelasId)
    const cleanTa = String(tahunAjaran)
    const cleanSem = String(semester)
    const targetStatus = action === 'publish_all' ? 'diterbitkan' : 'draft'
    const tanggalTerbit = action === 'publish_all' ? new Date() : null

    const students = await prisma.siswa.findMany({
      where: { kelasId: kId, status: 'aktif' },
      select: { id: true },
    })

    await prisma.$transaction(async (tx) => {
      for (const s of students) {
        await tx.raporSiswa.upsert({
          where: {
            siswaId_tahunAjaran_semester: {
              siswaId: s.id,
              tahunAjaran: cleanTa,
              semester: cleanSem,
            },
          },
          update: {
            kelasId: kId,
            status: targetStatus,
            tanggalTerbit,
          },
          create: {
            siswaId: s.id,
            kelasId: kId,
            tahunAjaran: cleanTa,
            semester: cleanSem,
            status: targetStatus,
            tanggalTerbit,
          },
        })
      }
    })

    return apiSuccess({
      message:
        action === 'publish_all'
          ? `Seluruh rapor (${students.length} siswa) telah diterbitkan dan dapat dilihat di Portal Siswa.`
          : `Seluruh rapor (${students.length} siswa) dikembalikan ke status Draft.`,
      data: { count: students.length, status: targetStatus },
    })
  } catch (error: any) {
    console.error('API Rapor PATCH Error:', error)
    return apiError('Gagal memproses status penerbitan rapor: ' + (error?.message || 'Server error'), 500)
  }
}

