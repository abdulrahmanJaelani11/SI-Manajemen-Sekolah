import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/kenaikan-kelas', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const kelasAsalIdParam = searchParams.get('kelasAsalId')
    const search = searchParams.get('search')?.trim() || ''

    // 1. Daftar semua kelas aktif beserta info jenjang, tingkat, dan jumlah siswa aktif
    const kelasList = await prisma.kelas.findMany({
      where: { active: true },
      orderBy: [
        { jenjang: { urutan: 'asc' } },
        { tingkat: { urutan: 'asc' } },
        { namaKelas: 'asc' },
      ],
      include: {
        jenjang: true,
        tingkat: true,
        jurusan: true,
        _count: {
          select: {
            siswa: {
              where: { status: 'aktif' },
            },
          },
        },
      },
    })

    // 2. Jika ada kelasAsalId yang dipilih, ambil daftar siswa aktif di kelas tersebut
    let siswaList: any[] = []
    if (kelasAsalIdParam) {
      const kelasAsalId = parseInt(kelasAsalIdParam, 10)
      if (!isNaN(kelasAsalId)) {
        siswaList = await prisma.siswa.findMany({
          where: {
            kelasId: kelasAsalId,
            status: 'aktif',
          },
          orderBy: { nama: 'asc' },
          select: {
            id: true,
            nis: true,
            nisn: true,
            nama: true,
            jenisKelamin: true,
            fotoUrl: true,
            status: true,
            tahunMasuk: true,
          },
        })
      }
    }

    // 3. Riwayat Kenaikan / Kelulusan terbaru
    const historyWhere: any = {}
    if (search) {
      historyWhere.OR = [
        { siswa: { nama: { contains: search, mode: 'insensitive' } } },
        { siswa: { nis: { contains: search, mode: 'insensitive' } } },
        { catatan: { contains: search, mode: 'insensitive' } },
      ]
    }

    const riwayatList = await prisma.riwayatKelasSiswa.findMany({
      where: historyWhere,
      take: 100,
      orderBy: { tanggalProses: 'desc' },
      include: {
        siswa: {
          select: { id: true, nis: true, nama: true, status: true },
        },
        kelasAsal: {
          include: { jenjang: true },
        },
        kelasTujuan: {
          include: { jenjang: true },
        },
      },
    })

    // 4. Periode tahun ajaran aktif
    const activePeriod = await prisma.tahunAjaran.findFirst({
      where: { isActive: true },
    })

    return apiSuccess({
      message: 'Data kenaikan kelas berhasil dimuat',
      data: {
        kelasList,
        siswaList,
        riwayatList,
        activePeriod,
      },
    })
  } catch (error: any) {
    console.error('API Kenaikan Kelas GET Error:', error)
    return apiError('Gagal memuat data kenaikan kelas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/kenaikan-kelas', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      mode, // 'naik_kelas' | 'pindah_kelas' | 'lulus'
      siswaIds,
      kelasAsalId,
      kelasTujuanId,
      tahunKeluar,
      tahunAjaranTujuan,
      catatan,
    } = body

    if (!['naik_kelas', 'pindah_kelas', 'lulus'].includes(mode)) {
      return apiError('Mode proses tidak valid (naik_kelas, pindah_kelas, atau lulus)', 400)
    }

    if (!Array.isArray(siswaIds) || siswaIds.length === 0) {
      return apiError('Pilih minimal satu siswa untuk diproses', 400)
    }

    const validSiswaIds = siswaIds
      .map((id: any) => Number(id))
      .filter((id: number) => !isNaN(id) && id > 0)

    if (validSiswaIds.length === 0) {
      return apiError('Daftar ID siswa tidak valid', 400)
    }

    let kelasAsal: any = null
    if (kelasAsalId) {
      kelasAsal = await prisma.kelas.findUnique({ where: { id: Number(kelasAsalId) } })
    }

    let kelasTujuan: any = null
    if (mode === 'naik_kelas' || mode === 'pindah_kelas') {
      if (!kelasTujuanId) {
        return apiError('Kelas tujuan wajib dipilih', 400)
      }
      if (kelasAsalId && Number(kelasTujuanId) === Number(kelasAsalId)) {
        return apiError('Kelas tujuan tidak boleh sama dengan kelas asal', 400)
      }
      kelasTujuan = await prisma.kelas.findUnique({
        where: { id: Number(kelasTujuanId) },
        include: {
          _count: {
            select: { siswa: { where: { status: 'aktif' } } },
          },
        },
      })
      if (!kelasTujuan) {
        return apiError('Kelas tujuan tidak ditemukan', 404)
      }
    }

    const targetTahunKeluar = tahunKeluar ? Number(tahunKeluar) : new Date().getFullYear()
    const targetTaTujuan =
      tahunAjaranTujuan ||
      kelasTujuan?.tahunAjaran ||
      (await prisma.tahunAjaran.findFirst({ where: { isActive: true } }))?.nama ||
      `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

    const petugasNama = auth.user.namaLengkap || auth.user.username

    const result = await prisma.$transaction(async (tx) => {
      const students = await tx.siswa.findMany({
        where: {
          id: { in: validSiswaIds },
          status: 'aktif',
        },
      })

      if (students.length === 0) {
        throw new Error('Tidak ada siswa aktif yang valid untuk diproses')
      }

      if (mode === 'lulus') {
        await tx.siswa.updateMany({
          where: { id: { in: students.map((s) => s.id) } },
          data: {
            status: 'alumni',
            tahunKeluar: targetTahunKeluar,
            kelasId: null,
          },
        })
      } else {
        await tx.siswa.updateMany({
          where: { id: { in: students.map((s) => s.id) } },
          data: {
            kelasId: kelasTujuan.id,
            jenjangId: kelasTujuan.jenjangId,
            jurusanId: kelasTujuan.jurusanId ?? null,
          },
        })
      }

      // Catat riwayat untuk setiap siswa
      const logRecords = students.map((s) => ({
        siswaId: s.id,
        kelasAsalId: s.kelasId || (kelasAsal ? kelasAsal.id : null),
        kelasTujuanId: mode === 'lulus' ? null : kelasTujuan.id,
        tahunAjaranAsal: kelasAsal?.tahunAjaran || null,
        tahunAjaranTujuan: targetTaTujuan,
        jenisAksi: mode,
        catatan:
          catatan?.trim() ||
          (mode === 'lulus'
            ? `Dinyatakan lulus menjadi Alumni angkatan ${targetTahunKeluar}`
            : mode === 'naik_kelas'
            ? `Kenaikan kelas ke ${kelasTujuan.namaKelas}`
            : `Pindah rombel ke ${kelasTujuan.namaKelas}`),
        diprosesOleh: petugasNama,
      }))

      await tx.riwayatKelasSiswa.createMany({
        data: logRecords,
      })

      return {
        processedCount: students.length,
        mode,
      }
    })

    return apiSuccess({
      message:
        mode === 'lulus'
          ? `Berhasil meluluskan ${result.processedCount} siswa menjadi Alumni (${targetTahunKeluar}).`
          : `Berhasil memindahkan ${result.processedCount} siswa ke kelas ${kelasTujuan.namaKelas}.`,
      data: result,
    })
  } catch (error: any) {
    console.error('API Kenaikan Kelas POST Error:', error)
    return apiError('Gagal memproses kenaikan kelas: ' + (error?.message || 'Server error'), 500)
  }
}

