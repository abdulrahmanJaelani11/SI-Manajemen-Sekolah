import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

const HARI_ORDER: Record<string, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/jadwal', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    let tahunAjaran = searchParams.get('tahunAjaran')?.trim()
    let semester = searchParams.get('semester')?.trim()
    const kelasIdParam = searchParams.get('kelasId')
    const guruIdParam = searchParams.get('guruId')

    const activePeriod = await prisma.tahunAjaran.findFirst({
      where: { isActive: true },
    })

    if (!tahunAjaran) tahunAjaran = activePeriod?.nama || '2024/2025'
    if (!semester) semester = activePeriod?.semester || 'Ganjil'

    const where: any = {
      tahunAjaran,
      semester,
    }
    if (kelasIdParam) where.kelasId = parseInt(kelasIdParam, 10)
    if (guruIdParam) where.guruId = parseInt(guruIdParam, 10)

    const [jadwalList, jamSlots, kelasList, mapelList, guruList, pengampuList, allPeriods] =
      await Promise.all([
        prisma.jadwalPelajaran.findMany({
          where,
          orderBy: [
            { urutanHari: 'asc' },
            { jamPelajaran: { urutan: 'asc' } },
          ],
          include: {
            jamPelajaran: true,
            kelas: { include: { jenjang: true } },
            mapel: true,
            guru: true,
          },
        }),
        prisma.jamPelajaran.findMany({
          orderBy: [{ urutan: 'asc' }, { jamMulai: 'asc' }],
        }),
        prisma.kelas.findMany({
          where: { active: true },
          orderBy: [{ jenjang: { urutan: 'asc' } }, { namaKelas: 'asc' }],
          include: { jenjang: true, jurusan: true },
        }),
        prisma.mataPelajaran.findMany({
          where: { active: true },
          orderBy: { nama: 'asc' },
        }),
        prisma.pegawai.findMany({
          where: { active: true },
          orderBy: [{ jenisPegawai: 'asc' }, { nama: 'asc' }],
        }),
        prisma.guruMapelKelas.findMany({
          where: { tahunAjaran, semester },
          include: { mapel: true, guru: true },
        }),
        prisma.tahunAjaran.findMany({
          orderBy: [{ nama: 'desc' }, { semester: 'asc' }],
        }),
      ])

    return apiSuccess({
      message: 'Data jadwal pelajaran berhasil dimuat',
      data: {
        tahunAjaran,
        semester,
        activePeriod,
        allPeriods,
        jadwalList,
        jamSlots,
        kelasList,
        mapelList,
        guruList,
        pengampuList,
      },
    })
  } catch (error: any) {
    console.error('API Jadwal GET Error:', error)
    return apiError('Gagal memuat jadwal pelajaran: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/akademik/jadwal', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      tahunAjaran,
      semester = 'Ganjil',
      hari,
      jamPelajaranId,
      kelasId,
      mapelId,
      guruId,
      ruangan,
    } = body

    if (!tahunAjaran || !hari || !jamPelajaranId || !kelasId || !mapelId || !guruId) {
      return apiError('Tahun ajaran, hari, jam pelajaran, kelas, mata pelajaran, dan guru wajib dipilih', 400)
    }

    const urutanHari = HARI_ORDER[hari]
    if (!urutanHari) {
      return apiError('Hari tidak valid (gunakan Senin s.d. Sabtu)', 400)
    }

    const targetSlot = await prisma.jamPelajaran.findUnique({
      where: { id: Number(jamPelajaranId) },
    })
    if (!targetSlot) {
      return apiError('Slot jam pelajaran tidak ditemukan', 404)
    }
    if (targetSlot.isIstirahat) {
      return apiError(`Slot "${targetSlot.namaSlot}" adalah waktu istirahat dan tidak dapat diisi jadwal pelajaran.`, 400)
    }

    // Cek Bentrok Guru (Anti-Conflict Detection)
    // Apakah guru tersebut sudah dijadwalkan mengajar kelas LAIN pada hari dan jam yang sama/beririsan?
    const guruSchedulesSameDay = await prisma.jadwalPelajaran.findMany({
      where: {
        tahunAjaran: String(tahunAjaran),
        semester: String(semester),
        hari: String(hari),
        guruId: Number(guruId),
        NOT: { kelasId: Number(kelasId) },
      },
      include: {
        jamPelajaran: true,
        kelas: { include: { jenjang: true } },
        mapel: true,
        guru: true,
      },
    })

    for (const existing of guruSchedulesSameDay) {
      const sameSlot = existing.jamPelajaranId === targetSlot.id
      const timeOverlap =
        targetSlot.jamMulai < existing.jamPelajaran.jamSelesai &&
        targetSlot.jamSelesai > existing.jamPelajaran.jamMulai

      if (sameSlot || timeOverlap) {
        return apiError(
          `Bentrok Jadwal Guru! ${existing.guru.nama} sudah terjadwal mengajar ${existing.mapel.nama} di kelas ${existing.kelas.jenjang?.kode || ''} ${existing.kelas.namaKelas} pada hari ${hari} pukul ${existing.jamPelajaran.jamMulai}–${existing.jamPelajaran.jamSelesai}.`,
          409
        )
      }
    }

    // Simpan / Upsert Jadwal pada slot kelas tersebut
    const saved = await prisma.jadwalPelajaran.upsert({
      where: {
        tahunAjaran_semester_hari_jamPelajaranId_kelasId: {
          tahunAjaran: String(tahunAjaran),
          semester: String(semester),
          hari: String(hari),
          jamPelajaranId: Number(jamPelajaranId),
          kelasId: Number(kelasId),
        },
      },
      update: {
        mapelId: Number(mapelId),
        guruId: Number(guruId),
        ruangan: ruangan ? String(ruangan).trim() : null,
        urutanHari,
      },
      create: {
        tahunAjaran: String(tahunAjaran),
        semester: String(semester),
        hari: String(hari),
        urutanHari,
        jamPelajaranId: Number(jamPelajaranId),
        kelasId: Number(kelasId),
        mapelId: Number(mapelId),
        guruId: Number(guruId),
        ruangan: ruangan ? String(ruangan).trim() : null,
      },
      include: {
        jamPelajaran: true,
        kelas: { include: { jenjang: true } },
        mapel: true,
        guru: true,
      },
    })

    return apiSuccess({
      message: 'Jadwal pelajaran berhasil disimpan tanpa bentrok',
      data: saved,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Jadwal POST Error:', error)
    return apiError('Gagal menyimpan jadwal pelajaran: ' + (error?.message || 'Server error'), 500)
  }
}

