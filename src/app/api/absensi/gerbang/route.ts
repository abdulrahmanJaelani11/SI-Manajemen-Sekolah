import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'
import { getWibNow, toDbDate, timeToMinutes } from '@/lib/absensi/date-utils'

async function getOrCreatePengaturan() {
  let config = await prisma.pengaturanPresensi.findFirst()
  if (!config) {
    config = await prisma.pengaturanPresensi.create({
      data: {
        jamMasukSiswa: '07:15',
        batasTerlambatSiswa: 0,
        jamPulangSiswa: '14:00',
        jamMasukPegawai: '07:00',
        jamPulangPegawai: '15:30',
      },
    })
  }
  return config
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/absensi/gerbang', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const { dateStr } = getWibNow()
    const targetDateStr = searchParams.get('tanggal') || dateStr
    const dbDate = toDbDate(targetDateStr)

    const [pengaturan, logs, totalSiswaAktif] = await Promise.all([
      getOrCreatePengaturan(),
      prisma.presensiSiswa.findMany({
        where: { tanggal: dbDate },
        orderBy: { updatedAt: 'desc' },
        include: {
          siswa: {
            select: {
              id: true,
              nis: true,
              nama: true,
              fotoUrl: true,
              jenjang: { select: { kode: true } },
              kelas: { select: { namaKelas: true } },
            },
          },
          kelas: {
            select: { namaKelas: true, jenjang: { select: { kode: true } } },
          },
        },
      }),
      prisma.siswa.count({ where: { status: 'aktif' } }),
    ])

    const totalHadirTepat = logs.filter((l) => l.status === 'hadir').length
    const totalTerlambat = logs.filter((l) => l.status === 'terlambat').length
    const totalPulang = logs.filter((l) => Boolean(l.jamPulang)).length
    const totalIzinSakitAlpa = logs.filter((l) =>
      ['sakit', 'izin', 'alpa'].includes(l.status)
    ).length
    const totalMasuk = totalHadirTepat + totalTerlambat
    const belumHadir = Math.max(0, totalSiswaAktif - logs.length)

    return apiSuccess({
      message: 'Data presensi gerbang berhasil dimuat',
      data: {
        tanggal: targetDateStr,
        pengaturan,
        logs,
        stats: {
          totalSiswaAktif,
          totalMasuk,
          totalHadirTepat,
          totalTerlambat,
          totalPulang,
          totalIzinSakitAlpa,
          belumHadir,
        },
      },
    })
  } catch (error: any) {
    console.error('API Presensi Gerbang GET Error:', error)
    return apiError('Gagal memuat data presensi gerbang: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/absensi/gerbang', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { code, mode = 'auto' } = body // mode: 'auto' | 'masuk' | 'pulang'

    let cleanNis = String(code || '').trim()
    if (cleanNis.toUpperCase().startsWith('SISWA:')) {
      cleanNis = cleanNis.substring(6).trim()
    }

    if (!cleanNis) {
      return apiError('Kode QR / NIS tidak valid atau kosong', 400)
    }

    const siswa = await prisma.siswa.findFirst({
      where: {
        OR: [{ nis: cleanNis }, { nisn: cleanNis }],
      },
      include: {
        jenjang: true,
        kelas: true,
      },
    })

    if (!siswa) {
      return apiError(`Siswa dengan NIS "${cleanNis}" tidak ditemukan di database.`, 404)
    }

    if (siswa.status !== 'aktif') {
      return apiError(
        `Siswa ${siswa.nama} berstatus "${siswa.status.toUpperCase()}" (bukan siswa aktif).`,
        400
      )
    }

    const { dateStr, timeStr, minutesOfDay } = getWibNow()
    const dbDate = toDbDate(dateStr)
    const pengaturan = await getOrCreatePengaturan()
    const petugasNama = auth.user.namaLengkap || auth.user.username

    const existing = await prisma.presensiSiswa.findUnique({
      where: {
        siswaId_tanggal: {
          siswaId: siswa.id,
          tanggal: dbDate,
        },
      },
    })

    // Tentukan aksi: MASUK atau PULANG
    let actionType: 'masuk' | 'pulang' = 'masuk'
    if (mode === 'pulang') {
      actionType = 'pulang'
    } else if (mode === 'auto' && existing && existing.jamMasuk && !existing.jamPulang) {
      actionType = 'pulang'
    }

    if (actionType === 'masuk') {
      if (existing && existing.jamMasuk) {
        return apiSuccess({
          message: `${siswa.nama} sudah tercatat masuk hari ini pukul ${existing.jamMasuk}`,
          data: {
            action: 'already_checked_in',
            duplicate: true,
            presensi: existing,
            siswa,
            lateMinutes: 0,
            waktuScan: existing.jamMasuk,
          },
        })
      }

      const batasMenit =
        timeToMinutes(pengaturan.jamMasukSiswa) + (pengaturan.batasTerlambatSiswa || 0)
      const lateMinutes = Math.max(0, minutesOfDay - batasMenit)
      const isLate = lateMinutes > 0
      const status = isLate ? 'terlambat' : 'hadir'
      const ket = isLate
        ? `Terlambat ${lateMinutes} menit (Scan QR)`
        : 'Tepat Waktu (Scan QR)'

      const saved = await prisma.presensiSiswa.upsert({
        where: {
          siswaId_tanggal: { siswaId: siswa.id, tanggal: dbDate },
        },
        update: {
          kelasId: siswa.kelasId,
          status,
          jamMasuk: timeStr,
          metode: 'qr_scan',
          keterangan: ket,
          petugas: petugasNama,
        },
        create: {
          siswaId: siswa.id,
          kelasId: siswa.kelasId,
          tanggal: dbDate,
          status,
          jamMasuk: timeStr,
          metode: 'qr_scan',
          keterangan: ket,
          petugas: petugasNama,
        },
      })

      return apiSuccess({
        message: isLate
          ? `${siswa.nama} tercatat MASUK (Terlambat ${lateMinutes} menit)`
          : `${siswa.nama} tercatat HADIR tepat waktu`,
        data: {
          action: 'masuk',
          duplicate: false,
          presensi: saved,
          siswa,
          lateMinutes,
          waktuScan: timeStr,
        },
      })
    } else {
      // Action: PULANG
      if (existing && existing.jamPulang) {
        return apiSuccess({
          message: `${siswa.nama} sudah tercatat pulang hari ini pukul ${existing.jamPulang}`,
          data: {
            action: 'already_checked_out',
            duplicate: true,
            presensi: existing,
            siswa,
            lateMinutes: 0,
            waktuScan: existing.jamPulang,
          },
        })
      }

      const saved = await prisma.presensiSiswa.upsert({
        where: {
          siswaId_tanggal: { siswaId: siswa.id, tanggal: dbDate },
        },
        update: {
          jamPulang: timeStr,
          petugas: petugasNama,
        },
        create: {
          siswaId: siswa.id,
          kelasId: siswa.kelasId,
          tanggal: dbDate,
          status: 'hadir',
          jamMasuk: timeStr,
          jamPulang: timeStr,
          metode: 'qr_scan',
          keterangan: 'Scan Pulang QR',
          petugas: petugasNama,
        },
      })

      return apiSuccess({
        message: `${siswa.nama} tercatat PULANG pukul ${timeStr}`,
        data: {
          action: 'pulang',
          duplicate: false,
          presensi: saved,
          siswa,
          lateMinutes: 0,
          waktuScan: timeStr,
        },
      })
    }
  } catch (error: any) {
    console.error('API Presensi Gerbang POST Error:', error)
    return apiError('Gagal memproses scan presensi: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/absensi/gerbang', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      jamMasukSiswa,
      batasTerlambatSiswa,
      jamPulangSiswa,
      jamMasukPegawai,
      jamPulangPegawai,
    } = body

    const current = await getOrCreatePengaturan()
    const updated = await prisma.pengaturanPresensi.update({
      where: { id: current.id },
      data: {
        jamMasukSiswa: jamMasukSiswa || current.jamMasukSiswa,
        batasTerlambatSiswa:
          batasTerlambatSiswa !== undefined
            ? Math.max(0, Number(batasTerlambatSiswa) || 0)
            : current.batasTerlambatSiswa,
        jamPulangSiswa: jamPulangSiswa || current.jamPulangSiswa,
        jamMasukPegawai: jamMasukPegawai || current.jamMasukPegawai,
        jamPulangPegawai: jamPulangPegawai || current.jamPulangPegawai,
      },
    })

    return apiSuccess({
      message: 'Pengaturan jam presensi berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Pengaturan Presensi PUT Error:', error)
    return apiError('Gagal menyimpan pengaturan presensi: ' + (error?.message || 'Server error'), 500)
  }
}

