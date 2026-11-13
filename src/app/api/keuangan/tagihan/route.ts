import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

function serializeTagihan(t: any) {
  const nominalTagihan = Number(t.nominalTagihan)
  const diskon = Number(t.diskon)
  const totalTerbayar = Number(t.totalTerbayar)
  const wajibBayar = Math.max(0, nominalTagihan - diskon)
  const sisaTagihan = Math.max(0, wajibBayar - totalTerbayar)

  return {
    ...t,
    nominalTagihan,
    diskon,
    totalTerbayar,
    wajibBayar,
    sisaTagihan,
    jenis: t.jenis
      ? { ...t.jenis, nominalDefault: Number(t.jenis.nominalDefault) }
      : t.jenis,
    pembayaran: (t.pembayaran || []).map((p: any) => ({
      ...p,
      nominalBayar: Number(p.nominalBayar),
    })),
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/tagihan', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const jenisId = searchParams.get('jenisId')
    const kelasId = searchParams.get('kelasId')
    const status = searchParams.get('status')
    const tahunAjaran = searchParams.get('tahunAjaran')
    const search = (searchParams.get('search') || '').trim()

    const where: any = {}
    if (jenisId && jenisId !== 'all') where.jenisId = Number(jenisId)
    if (status && status !== 'all') where.status = status
    if (tahunAjaran && tahunAjaran !== 'all') where.tahunAjaran = tahunAjaran
    if (kelasId && kelasId !== 'all') {
      where.siswa = { kelasId: Number(kelasId) }
    }
    if (search) {
      where.OR = [
        { kodeTagihan: { contains: search, mode: 'insensitive' } },
        { judul: { contains: search, mode: 'insensitive' } },
        { siswa: { nama: { contains: search, mode: 'insensitive' } } },
        { siswa: { nis: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [tagihanRaw, allTagihanStats, jenisList, siswaList, kelasList, tahunAjaranList] =
      await Promise.all([
        prisma.tagihanSiswa.findMany({
          where,
          include: {
            siswa: {
              select: {
                id: true,
                nis: true,
                nama: true,
                jenjang: { select: { kode: true } },
                kelas: { select: { id: true, namaKelas: true } },
              },
            },
            jenis: true,
            pembayaran: {
              orderBy: [{ tanggalBayar: 'desc' }, { id: 'desc' }],
            },
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        }),
        prisma.tagihanSiswa.findMany({
          where: { status: { not: 'batal' } },
          select: { nominalTagihan: true, diskon: true, totalTerbayar: true, status: true },
        }),
        prisma.jenisTagihan.findMany({
          include: { _count: { select: { tagihan: true } } },
          orderBy: { kode: 'asc' },
        }),
        prisma.siswa.findMany({
          where: { status: 'aktif' },
          select: {
            id: true,
            nis: true,
            nama: true,
            jenjang: { select: { kode: true } },
            kelas: { select: { id: true, namaKelas: true } },
          },
          orderBy: { nama: 'asc' },
        }),
        prisma.kelas.findMany({
          where: { active: true },
          include: { jenjang: true },
          orderBy: [{ jenjangId: 'asc' }, { namaKelas: 'asc' }],
        }),
        prisma.tahunAjaran.findMany({ orderBy: { nama: 'desc' } }),
      ])

    let totalNominalTagihan = 0
    let totalTerbayar = 0
    let totalSisaPiutang = 0
    for (const row of allTagihanStats) {
      const net = Math.max(0, Number(row.nominalTagihan) - Number(row.diskon))
      const paid = Number(row.totalTerbayar)
      totalNominalTagihan += net
      totalTerbayar += paid
      totalSisaPiutang += Math.max(0, net - paid)
    }

    const stats = {
      totalTagihanCount: allTagihanStats.length,
      totalNominalTagihan,
      totalTerbayar,
      totalSisaPiutang,
      jumlahLunas: allTagihanStats.filter((r) => r.status === 'lunas').length,
      jumlahCicilan: allTagihanStats.filter((r) => r.status === 'cicilan').length,
      jumlahBelumBayar: allTagihanStats.filter((r) => r.status === 'belum_bayar').length,
    }

    return apiSuccess({
      message: 'Data tagihan Non-SPP berhasil dimuat',
      data: {
        tagihanList: tagihanRaw.map(serializeTagihan),
        stats,
        jenisList: jenisList.map((j) => ({ ...j, nominalDefault: Number(j.nominalDefault) })),
        siswaList,
        kelasList,
        tahunAjaranList,
      },
    })
  } catch (error: any) {
    console.error('API Tagihan GET Error:', error)
    return apiError('Gagal memuat data tagihan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/tagihan', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      targetMode = 'individu', // 'individu' | 'kelas' | 'semua_aktif'
      siswaId,
      kelasId,
      jenisId,
      tahunAjaran,
      judul,
      nominalTagihan,
      diskon,
      jatuhTempo,
      keterangan,
      skipDuplicates = true,
    } = body

    if (!jenisId || !tahunAjaran?.trim() || !judul?.trim()) {
      return apiError('Jenis tagihan, tahun ajaran, dan judul tagihan wajib diisi.', 400)
    }

    const jenis = await prisma.jenisTagihan.findUnique({ where: { id: Number(jenisId) } })
    if (!jenis) {
      return apiError('Jenis tagihan tidak ditemukan.', 404)
    }

    const parsedNominal = Number(nominalTagihan)
    if (Number.isNaN(parsedNominal) || parsedNominal <= 0) {
      return apiError('Nominal tagihan harus lebih besar dari 0.', 400)
    }

    const parsedDiskon = Math.max(0, Number(diskon) || 0)
    if (parsedDiskon > parsedNominal) {
      return apiError('Diskon tidak boleh melebihi nominal tagihan.', 400)
    }

    const parsedDue = jatuhTempo ? new Date(jatuhTempo) : null
    if (parsedDue && Number.isNaN(parsedDue.getTime())) {
      return apiError('Format tanggal jatuh tempo tidak valid.', 400)
    }

    // Kumpulkan target siswa
    let targetSiswaIds: number[] = []
    if (targetMode === 'individu') {
      if (!siswaId) return apiError('Pilih siswa terlebih dahulu.', 400)
      targetSiswaIds = [Number(siswaId)]
    } else if (targetMode === 'kelas') {
      if (!kelasId) return apiError('Pilih kelas target terlebih dahulu.', 400)
      const list = await prisma.siswa.findMany({
        where: { status: 'aktif', kelasId: Number(kelasId) },
        select: { id: true },
      })
      targetSiswaIds = list.map((s) => s.id)
    } else if (targetMode === 'semua_aktif') {
      const list = await prisma.siswa.findMany({
        where: { status: 'aktif' },
        select: { id: true },
      })
      targetSiswaIds = list.map((s) => s.id)
    } else {
      return apiError('Mode target tagihan tidak valid.', 400)
    }

    if (targetSiswaIds.length === 0) {
      return apiError('Tidak ada siswa aktif yang ditemukan untuk target ini.', 400)
    }

    let finalIds = targetSiswaIds
    let skipped = 0
    if (skipDuplicates) {
      const existing = await prisma.tagihanSiswa.findMany({
        where: {
          siswaId: { in: targetSiswaIds },
          jenisId: jenis.id,
          tahunAjaran: String(tahunAjaran).trim(),
          status: { not: 'batal' },
        },
        select: { siswaId: true },
      })
      const existingSet = new Set(existing.map((e) => e.siswaId))
      finalIds = targetSiswaIds.filter((id) => !existingSet.has(id))
      skipped = targetSiswaIds.length - finalIds.length
    }

    if (finalIds.length === 0) {
      return apiError(
        `Seluruh ${targetSiswaIds.length} siswa target sudah memiliki tagihan "${jenis.nama}" untuk tahun ajaran ${tahunAjaran}.`,
        409
      )
    }

    const petugas = auth.user.namaLengkap || auth.user.username
    const yearTag = new Date().getFullYear()
    const lastInv = await prisma.tagihanSiswa.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    })
    let seq = (lastInv?.id || 0) + 1

    const initialStatus = parsedNominal - parsedDiskon <= 0 ? 'lunas' : 'belum_bayar'

    const createdList = await prisma.$transaction(async (tx) => {
      const results: any[] = []
      for (const sId of finalIds) {
        let kodeTagihan = `INV-${yearTag}-${String(seq).padStart(4, '0')}`
        while (await tx.tagihanSiswa.findUnique({ where: { kodeTagihan }, select: { id: true } })) {
          seq += 1
          kodeTagihan = `INV-${yearTag}-${String(seq).padStart(4, '0')}`
        }
        seq += 1

        const row = await tx.tagihanSiswa.create({
          data: {
            kodeTagihan,
            siswaId: sId,
            jenisId: jenis.id,
            tahunAjaran: String(tahunAjaran).trim(),
            judul: String(judul).trim(),
            nominalTagihan: parsedNominal,
            diskon: parsedDiskon,
            totalTerbayar: 0,
            jatuhTempo: parsedDue,
            status: initialStatus,
            keterangan: keterangan ? String(keterangan).trim() : null,
            dibuatOleh: petugas,
          },
        })
        results.push(row)
      }
      return results
    })

    return apiSuccess({
      message: `${createdList.length} tagihan berhasil dibuat${skipped > 0 ? ` (${skipped} dilewati karena sudah ada)` : ''}`,
      data: {
        createdCount: createdList.length,
        skippedCount: skipped,
      },
      status: 201,
    })
  } catch (error: any) {
    console.error('API Tagihan POST Error:', error)
    return apiError('Gagal membuat tagihan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/tagihan', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get('id'))
    if (!id) {
      return apiError('ID tagihan wajib disertakan.', 400)
    }

    const existing = await prisma.tagihanSiswa.findUnique({ where: { id } })
    if (!existing) {
      return apiError('Tagihan tidak ditemukan.', 404)
    }

    if (Number(existing.totalTerbayar) > 0) {
      return apiError(
        'Tidak dapat menghapus tagihan yang sudah memiliki pembayaran masuk. Void transaksi pembayarannya terlebih dahulu.',
        400
      )
    }

    await prisma.tagihanSiswa.delete({ where: { id } })
    return apiSuccess({ message: `Tagihan ${existing.kodeTagihan} berhasil dihapus` })
  } catch (error: any) {
    console.error('API Tagihan DELETE Error:', error)
    return apiError('Gagal menghapus tagihan: ' + (error?.message || 'Server error'), 500)
  }
}

