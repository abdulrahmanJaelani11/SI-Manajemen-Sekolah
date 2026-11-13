import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

const VALID_KARIR = [
  'kuliah',
  'bekerja',
  'wirausaha',
  'melanjutkan_sekolah',
  'belum_diketahui',
]

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/alumni', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get('jenjangId')
    const tahunLulus = searchParams.get('tahunLulus')
    const statusKarir = searchParams.get('statusKarir')
    const search = (searchParams.get('search') || '').trim()

    const where: any = { status: 'alumni' }
    if (jenjangId && jenjangId !== 'all') where.jenjangId = Number(jenjangId)
    if (tahunLulus && tahunLulus !== 'all') where.tahunKeluar = Number(tahunLulus)
    if (search) {
      where.OR = [
        { nis: { contains: search, mode: 'insensitive' } },
        { nisn: { contains: search, mode: 'insensitive' } },
        { nama: { contains: search, mode: 'insensitive' } },
        { alumniTracer: { instansiTujuan: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [alumniRaw, allAlumniStats, jenjangList] = await Promise.all([
      prisma.siswa.findMany({
        where,
        include: {
          jenjang: true,
          jurusan: true,
          riwayatKelas: {
            where: { jenisAksi: 'lulus' },
            include: { kelasAsal: true },
            orderBy: { tanggalProses: 'desc' },
            take: 1,
          },
          alumniTracer: true,
        },
        orderBy: [{ tahunKeluar: 'desc' }, { nama: 'asc' }],
      }),
      prisma.siswa.findMany({
        where: { status: 'alumni' },
        select: {
          id: true,
          tahunKeluar: true,
          alumniTracer: { select: { statusKarir: true, tahunLulus: true } },
        },
      }),
      prisma.refJenjang.findMany({ where: { active: true }, orderBy: { urutan: 'asc' } }),
    ])

    const filteredAlumni =
      statusKarir && statusKarir !== 'all'
        ? alumniRaw.filter(
            (a) => (a.alumniTracer?.statusKarir || 'belum_diketahui') === statusKarir
          )
        : alumniRaw

    const tahunSet = new Set<number>()
    for (const row of allAlumniStats) {
      const y = row.alumniTracer?.tahunLulus || row.tahunKeluar
      if (y) tahunSet.add(y)
    }

    const stats = {
      totalAlumni: allAlumniStats.length,
      melanjutkanStudi: allAlumniStats.filter((r) => {
        const st = r.alumniTracer?.statusKarir
        return st === 'kuliah' || st === 'melanjutkan_sekolah'
      }).length,
      bekerjaWirausaha: allAlumniStats.filter((r) => {
        const st = r.alumniTracer?.statusKarir
        return st === 'bekerja' || st === 'wirausaha'
      }).length,
      belumDilacak: allAlumniStats.filter(
        (r) => !r.alumniTracer || r.alumniTracer.statusKarir === 'belum_diketahui'
      ).length,
    }

    return apiSuccess({
      message: 'Data direktori alumni berhasil dimuat',
      data: {
        alumniList: filteredAlumni,
        stats,
        tahunOptions: Array.from(tahunSet).sort((a, b) => b - a),
        jenjangList,
      },
    })
  } catch (error: any) {
    console.error('API Alumni GET Error:', error)
    return apiError('Gagal memuat data alumni: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/kesiswaan/alumni', 'edit')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      siswaId,
      tahunLulus,
      statusKarir,
      instansiTujuan,
      jabatanJurusan,
      kontakTerbaru,
      emailTerbaru,
      kotaDomisili,
      catatan,
    } = body

    if (!siswaId) {
      return apiError('ID alumni wajib disertakan.', 400)
    }

    const siswa = await prisma.siswa.findUnique({ where: { id: Number(siswaId) } })
    if (!siswa || siswa.status !== 'alumni') {
      return apiError('Data alumni tidak ditemukan atau siswa belum berstatus alumni.', 404)
    }

    const cleanKarir = VALID_KARIR.includes(statusKarir) ? statusKarir : 'belum_diketahui'
    const cleanTahun = Number(tahunLulus) || siswa.tahunKeluar || new Date().getFullYear()

    const saved = await prisma.$transaction(async (tx) => {
      if (siswa.tahunKeluar !== cleanTahun) {
        await tx.siswa.update({
          where: { id: siswa.id },
          data: { tahunKeluar: cleanTahun },
        })
      }

      return tx.alumniTracer.upsert({
        where: { siswaId: siswa.id },
        update: {
          tahunLulus: cleanTahun,
          statusKarir: cleanKarir,
          instansiTujuan: instansiTujuan ? String(instansiTujuan).trim() : null,
          jabatanJurusan: jabatanJurusan ? String(jabatanJurusan).trim() : null,
          kontakTerbaru: kontakTerbaru ? String(kontakTerbaru).trim() : null,
          emailTerbaru: emailTerbaru ? String(emailTerbaru).trim() : null,
          kotaDomisili: kotaDomisili ? String(kotaDomisili).trim() : null,
          catatan: catatan ? String(catatan).trim() : null,
        },
        create: {
          siswaId: siswa.id,
          tahunLulus: cleanTahun,
          statusKarir: cleanKarir,
          instansiTujuan: instansiTujuan ? String(instansiTujuan).trim() : null,
          jabatanJurusan: jabatanJurusan ? String(jabatanJurusan).trim() : null,
          kontakTerbaru: kontakTerbaru ? String(kontakTerbaru).trim() : null,
          emailTerbaru: emailTerbaru ? String(emailTerbaru).trim() : null,
          kotaDomisili: kotaDomisili ? String(kotaDomisili).trim() : null,
          catatan: catatan ? String(catatan).trim() : null,
        },
      })
    })

    return apiSuccess({
      message: `Data tracer study alumni ${siswa.nama} berhasil diperbarui`,
      data: saved,
    })
  } catch (error: any) {
    console.error('API Alumni PATCH Error:', error)
    return apiError('Gagal memperbarui tracer alumni: ' + (error?.message || 'Server error'), 500)
  }
}

