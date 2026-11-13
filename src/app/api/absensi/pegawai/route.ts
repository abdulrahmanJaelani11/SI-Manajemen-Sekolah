import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'
import { getWibNow, toDbDate } from '@/lib/absensi/date-utils'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/absensi/pegawai', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const { dateStr } = getWibNow()
    const mode = searchParams.get('mode') || 'harian'
    const tanggalStr = searchParams.get('tanggal') || dateStr
    const bulanStr = searchParams.get('bulan') || dateStr.slice(0, 7)

    const [pegawaiList, pengaturan] = await Promise.all([
      prisma.pegawai.findMany({
        where: { active: true },
        orderBy: [{ jenisPegawai: 'asc' }, { nama: 'asc' }],
      }),
      prisma.pengaturanPresensi.findFirst(),
    ])

    let rows: any[] = []
    let rekapRows: any[] = []

    if (mode === 'harian') {
      const dbDate = toDbDate(tanggalStr)
      const existing = await prisma.presensiPegawai.findMany({
        where: { tanggal: dbDate },
      })
      const mapByPegawai = new Map<number, any>()
      for (const item of existing) mapByPegawai.set(item.pegawaiId, item)

      rows = pegawaiList.map((p) => {
        const log = mapByPegawai.get(p.id)
        return {
          pegawaiId: p.id,
          nip: p.nip,
          nama: p.nama,
          jenisPegawai: p.jenisPegawai,
          jabatan: p.jabatan || p.bidangStudi || '-',
          fotoUrl: p.fotoUrl,
          status: log?.status || '',
          jamMasuk: log?.jamMasuk || '',
          jamPulang: log?.jamPulang || '',
          keterangan: log?.keterangan || '',
          sudahAbsen: Boolean(log),
        }
      })
    } else {
      const [yr, mo] = bulanStr.split('-').map((x) => parseInt(x, 10))
      const startDate = new Date(Date.UTC(yr, mo - 1, 1))
      const endDate = new Date(Date.UTC(yr, mo, 0))

      const logs = await prisma.presensiPegawai.findMany({
        where: {
          pegawaiId: { in: pegawaiList.map((p) => p.id) },
          tanggal: { gte: startDate, lte: endDate },
        },
      })

      const statsMap = new Map<number, any>()
      for (const p of pegawaiList) {
        statsMap.set(p.id, {
          pegawaiId: p.id,
          nip: p.nip,
          nama: p.nama,
          jenisPegawai: p.jenisPegawai,
          hadir: 0,
          terlambat: 0,
          sakit: 0,
          izin: 0,
          cuti: 0,
          alpa: 0,
          total: 0,
        })
      }

      for (const l of logs) {
        const st = statsMap.get(l.pegawaiId)
        if (!st) continue
        if (l.status === 'hadir') st.hadir++
        else if (l.status === 'terlambat') st.terlambat++
        else if (l.status === 'sakit') st.sakit++
        else if (l.status === 'izin') st.izin++
        else if (l.status === 'cuti') st.cuti++
        else if (l.status === 'alpa') st.alpa++
        st.total++
      }

      rekapRows = Array.from(statsMap.values())
    }

    return apiSuccess({
      message: 'Data presensi pegawai berhasil dimuat',
      data: {
        tanggal: tanggalStr,
        bulan: bulanStr,
        pengaturan,
        rows,
        rekapRows,
      },
    })
  } catch (error: any) {
    console.error('API Presensi Pegawai GET Error:', error)
    return apiError('Gagal memuat presensi pegawai: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/absensi/pegawai', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { tanggal, entries } = body

    if (!tanggal || !Array.isArray(entries) || entries.length === 0) {
      return apiError('Tanggal dan daftar presensi pegawai wajib diisi', 400)
    }

    const dbDate = toDbDate(tanggal)
    const petugasNama = auth.user.namaLengkap || auth.user.username

    let savedCount = 0
    await prisma.$transaction(async (tx) => {
      for (const item of entries) {
        if (
          !item.status ||
          !['hadir', 'terlambat', 'sakit', 'izin', 'cuti', 'alpa'].includes(item.status)
        ) {
          continue
        }

        await tx.presensiPegawai.upsert({
          where: {
            pegawaiId_tanggal: {
              pegawaiId: Number(item.pegawaiId),
              tanggal: dbDate,
            },
          },
          update: {
            status: item.status,
            jamMasuk: item.jamMasuk ? String(item.jamMasuk).trim() : null,
            jamPulang: item.jamPulang ? String(item.jamPulang).trim() : null,
            keterangan: item.keterangan ? String(item.keterangan).trim() : null,
            petugas: petugasNama,
          },
          create: {
            pegawaiId: Number(item.pegawaiId),
            tanggal: dbDate,
            status: item.status,
            jamMasuk: item.jamMasuk ? String(item.jamMasuk).trim() : null,
            jamPulang: item.jamPulang ? String(item.jamPulang).trim() : null,
            keterangan: item.keterangan ? String(item.keterangan).trim() : null,
            petugas: petugasNama,
          },
        })
        savedCount++
      }
    })

    return apiSuccess({
      message: `Berhasil menyimpan presensi ${savedCount} guru/pegawai untuk tanggal ${tanggal}`,
      data: { savedCount },
    })
  } catch (error: any) {
    console.error('API Presensi Pegawai POST Error:', error)
    return apiError('Gagal menyimpan presensi pegawai: ' + (error?.message || 'Server error'), 500)
  }
}

