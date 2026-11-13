import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'
import { getWibNow, toDbDate } from '@/lib/absensi/date-utils'

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/absensi/kelas', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const { dateStr } = getWibNow()
    const mode = searchParams.get('mode') || 'harian' // 'harian' | 'rekap'
    const tanggalStr = searchParams.get('tanggal') || dateStr
    const bulanStr = searchParams.get('bulan') || dateStr.slice(0, 7) // YYYY-MM
    const kelasIdParam = searchParams.get('kelasId')

    const [kelasList, activePeriod] = await Promise.all([
      prisma.kelas.findMany({
        where: { active: true },
        orderBy: [{ jenjang: { urutan: 'asc' } }, { namaKelas: 'asc' }],
        include: { jenjang: true, jurusan: true },
      }),
      prisma.tahunAjaran.findFirst({ where: { isActive: true } }),
    ])

    let rows: any[] = []
    let rekapRows: any[] = []

    if (kelasIdParam) {
      const kelasId = parseInt(kelasIdParam, 10)
      if (!isNaN(kelasId)) {
        const students = await prisma.siswa.findMany({
          where: { kelasId, status: 'aktif' },
          orderBy: { nama: 'asc' },
          select: {
            id: true,
            nis: true,
            nama: true,
            jenisKelamin: true,
            fotoUrl: true,
          },
        })

        if (mode === 'harian') {
          const dbDate = toDbDate(tanggalStr)
          const existingList = await prisma.presensiSiswa.findMany({
            where: {
              kelasId,
              tanggal: dbDate,
            },
          })
          const mapBySiswa = new Map<number, any>()
          for (const item of existingList) {
            mapBySiswa.set(item.siswaId, item)
          }

          rows = students.map((s) => {
            const p = mapBySiswa.get(s.id)
            return {
              siswaId: s.id,
              nis: s.nis,
              nama: s.nama,
              jenisKelamin: s.jenisKelamin,
              fotoUrl: s.fotoUrl,
              presensiId: p?.id || null,
              status: p?.status || '',
              jamMasuk: p?.jamMasuk || '',
              jamPulang: p?.jamPulang || '',
              metode: p?.metode || 'manual',
              keterangan: p?.keterangan || '',
              sudahAbsen: Boolean(p),
            }
          })
        } else {
          // Mode Rekap Bulanan (YYYY-MM)
          const [yr, mo] = bulanStr.split('-').map((x) => parseInt(x, 10))
          const startDate = new Date(Date.UTC(yr, mo - 1, 1))
          const endDate = new Date(Date.UTC(yr, mo, 0))

          const logs = await prisma.presensiSiswa.findMany({
            where: {
              siswaId: { in: students.map((s) => s.id) },
              tanggal: { gte: startDate, lte: endDate },
            },
          })

          const statsMap = new Map<number, any>()
          for (const s of students) {
            statsMap.set(s.id, {
              siswaId: s.id,
              nis: s.nis,
              nama: s.nama,
              hadir: 0,
              terlambat: 0,
              sakit: 0,
              izin: 0,
              alpa: 0,
              total: 0,
            })
          }

          for (const l of logs) {
            const st = statsMap.get(l.siswaId)
            if (!st) continue
            if (l.status === 'hadir') st.hadir++
            else if (l.status === 'terlambat') st.terlambat++
            else if (l.status === 'sakit') st.sakit++
            else if (l.status === 'izin') st.izin++
            else if (l.status === 'alpa') st.alpa++
            st.total++
          }

          rekapRows = Array.from(statsMap.values())
        }
      }
    }

    return apiSuccess({
      message: 'Data absensi kelas berhasil dimuat',
      data: {
        tanggal: tanggalStr,
        bulan: bulanStr,
        kelasList,
        activePeriod,
        rows,
        rekapRows,
      },
    })
  } catch (error: any) {
    console.error('API Absensi Kelas GET Error:', error)
    return apiError('Gagal memuat absensi kelas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/absensi/kelas', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { tanggal, kelasId, entries } = body

    if (!tanggal || !kelasId || !Array.isArray(entries) || entries.length === 0) {
      return apiError('Tanggal, Kelas, dan daftar absensi siswa wajib diisi', 400)
    }

    const dbDate = toDbDate(tanggal)
    const kId = Number(kelasId)
    const petugasNama = auth.user.namaLengkap || auth.user.username

    let savedCount = 0
    await prisma.$transaction(async (tx) => {
      for (const item of entries) {
        if (!item.status || !['hadir', 'terlambat', 'sakit', 'izin', 'alpa'].includes(item.status)) {
          continue
        }

        await tx.presensiSiswa.upsert({
          where: {
            siswaId_tanggal: {
              siswaId: Number(item.siswaId),
              tanggal: dbDate,
            },
          },
          update: {
            kelasId: kId,
            status: item.status,
            jamMasuk: item.jamMasuk ? String(item.jamMasuk).trim() : null,
            jamPulang: item.jamPulang ? String(item.jamPulang).trim() : null,
            keterangan: item.keterangan ? String(item.keterangan).trim() : null,
            petugas: petugasNama,
          },
          create: {
            siswaId: Number(item.siswaId),
            kelasId: kId,
            tanggal: dbDate,
            status: item.status,
            jamMasuk: item.jamMasuk ? String(item.jamMasuk).trim() : null,
            jamPulang: item.jamPulang ? String(item.jamPulang).trim() : null,
            metode: 'manual',
            keterangan: item.keterangan ? String(item.keterangan).trim() : null,
            petugas: petugasNama,
          },
        })
        savedCount++
      }
    })

    return apiSuccess({
      message: `Berhasil menyimpan presensi ${savedCount} siswa untuk tanggal ${tanggal}`,
      data: { savedCount },
    })
  } catch (error: any) {
    console.error('API Absensi Kelas POST Error:', error)
    return apiError('Gagal menyimpan absensi kelas: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/absensi/kelas', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { kelasId, tahunAjaran, semester, bulan } = body

    if (!kelasId) {
      return apiError('Kelas wajib dipilih untuk sinkronisasi E-Rapor', 400)
    }

    const kId = Number(kelasId)
    const activePeriod = await prisma.tahunAjaran.findFirst({ where: { isActive: true } })
    const ta = tahunAjaran || activePeriod?.nama || '2024/2025'
    const sem = semester || activePeriod?.semester || 'Ganjil'

    const students = await prisma.siswa.findMany({
      where: { kelasId: kId, status: 'aktif' },
      select: { id: true },
    })

    // Jika periode aktif punya rentang tanggal, pakai rentang itu; kalau tidak pakai semua presensi tahun berjalan / bulan
    const dateFilter: any = {}
    if (bulan && /^\d{4}-\d{2}$/.test(bulan)) {
      const [yr, mo] = bulan.split('-').map((x: string) => parseInt(x, 10))
      dateFilter.gte = new Date(Date.UTC(yr, mo - 1, 1))
      dateFilter.lte = new Date(Date.UTC(yr, mo, 0))
    } else if (activePeriod?.tanggalMulai && activePeriod?.tanggalSelesai) {
      dateFilter.gte = activePeriod.tanggalMulai
      dateFilter.lte = activePeriod.tanggalSelesai
    }

    const logs = await prisma.presensiSiswa.findMany({
      where: {
        siswaId: { in: students.map((s) => s.id) },
        ...(Object.keys(dateFilter).length > 0 ? { tanggal: dateFilter } : {}),
        status: { in: ['sakit', 'izin', 'alpa'] },
      },
    })

    const countMap = new Map<number, { sakit: number; izin: number; alpa: number }>()
    for (const s of students) {
      countMap.set(s.id, { sakit: 0, izin: 0, alpa: 0 })
    }
    for (const l of logs) {
      const entry = countMap.get(l.siswaId)
      if (!entry) continue
      if (l.status === 'sakit') entry.sakit++
      else if (l.status === 'izin') entry.izin++
      else if (l.status === 'alpa') entry.alpa++
    }

    await prisma.$transaction(async (tx) => {
      for (const s of students) {
        const counts = countMap.get(s.id) || { sakit: 0, izin: 0, alpa: 0 }
        await tx.raporSiswa.upsert({
          where: {
            siswaId_tahunAjaran_semester: {
              siswaId: s.id,
              tahunAjaran: ta,
              semester: sem,
            },
          },
          update: {
            kelasId: kId,
            sakit: counts.sakit,
            izin: counts.izin,
            alpa: counts.alpa,
          },
          create: {
            siswaId: s.id,
            kelasId: kId,
            tahunAjaran: ta,
            semester: sem,
            sakit: counts.sakit,
            izin: counts.izin,
            alpa: counts.alpa,
          },
        })
      }
    })

    return apiSuccess({
      message: `Data ketidakhadiran (Sakit/Izin/Alpa) untuk ${students.length} siswa berhasil disinkronkan ke E-Rapor (${ta} ${sem}).`,
      data: { syncedCount: students.length },
    })
  } catch (error: any) {
    console.error('API Sync Absensi Rapor Error:', error)
    return apiError('Gagal menyinkronkan ke E-Rapor: ' + (error?.message || 'Server error'), 500)
  }
}

