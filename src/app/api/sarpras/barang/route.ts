import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

// GET /api/sarpras/barang
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/sarpras/barang', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const search = (searchParams.get('search') || '').trim()
    const kategoriId = searchParams.get('kategoriId')
    const ruanganId = searchParams.get('ruanganId')
    const kondisi = (searchParams.get('kondisi') || '').trim()
    const sumberDana = (searchParams.get('sumberDana') || '').trim()

    const where: any = {}

    if (kategoriId && kategoriId !== 'all') {
      where.kategoriId = Number(kategoriId)
    }
    if (ruanganId && ruanganId !== 'all') {
      where.ruanganId = Number(ruanganId)
    }
    if (kondisi && kondisi !== 'all') {
      where.kondisiUtama = kondisi
    }
    if (sumberDana && sumberDana !== 'all') {
      where.sumberDana = { contains: sumberDana, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { kodeBarang: { contains: search, mode: 'insensitive' } },
        { namaBarang: { contains: search, mode: 'insensitive' } },
        { merk: { contains: search, mode: 'insensitive' } },
        { spesifikasi: { contains: search, mode: 'insensitive' } },
        { noSeri: { contains: search, mode: 'insensitive' } },
        { sumberDana: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [barangList, allBarang, kategoriList, ruanganList, listSumberDana] = await Promise.all([
      prisma.sarprasBarang.findMany({
        where,
        include: {
          kategori: { select: { id: true, kode: true, nama: true } },
          ruangan: { select: { id: true, kodeRuangan: true, namaRuangan: true, gedung: true, lantai: true } },
          pjPegawai: { select: { id: true, nama: true, jabatan: true } },
        },
        orderBy: [{ kodeBarang: 'asc' }],
      }),
      prisma.sarprasBarang.findMany({
        select: {
          id: true,
          jumlahTotal: true,
          jumlahBaik: true,
          jumlahRusakRingan: true,
          jumlahRusakBerat: true,
          jumlahAfkir: true,
          hargaPerolehan: true,
        },
      }),
      prisma.sarprasKategoriBarang.findMany({
        select: { id: true, kode: true, nama: true },
        orderBy: { nama: 'asc' },
      }),
      prisma.sarprasRuangan.findMany({
        where: { active: true },
        select: { id: true, kodeRuangan: true, namaRuangan: true, gedung: true },
        orderBy: [{ gedung: 'asc' }, { namaRuangan: 'asc' }],
      }),
      prisma.sarprasBarang.findMany({
        where: { sumberDana: { not: null } },
        select: { sumberDana: true },
        distinct: ['sumberDana'],
      }),
    ])

    // KPI Aggregation
    const totalJenisBarang = allBarang.length
    let totalFisikUnit = 0
    let unitBaik = 0
    let unitRusak = 0
    let totalNilaiPerolehan = 0

    allBarang.forEach((b) => {
      totalFisikUnit += b.jumlahTotal
      unitBaik += b.jumlahBaik
      unitRusak += b.jumlahRusakRingan + b.jumlahRusakBerat + b.jumlahAfkir
      const harga = Number(b.hargaPerolehan || 0)
      totalNilaiPerolehan += harga * b.jumlahTotal
    })

    return apiSuccess({
      data: {
        barang: barangList,
        stats: {
          totalJenisBarang,
          totalFisikUnit,
          unitBaik,
          unitRusak,
          totalNilaiPerolehan,
        },
        kategoriList,
        ruanganList,
        sumberDanaList: listSumberDana.map((s) => s.sumberDana).filter(Boolean),
      },
    })
  } catch (error: any) {
    console.error('Error fetching barang sarpras:', error)
    return apiError(error.message || 'Gagal memuat inventaris barang sarpras', 500)
  }
}

// POST /api/sarpras/barang
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/sarpras/barang', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    let {
      kodeBarang,
      namaBarang,
      kategoriId,
      ruanganId,
      merk,
      spesifikasi,
      noSeri,
      tahunPengadaan,
      sumberDana,
      hargaPerolehan,
      jumlahTotal,
      jumlahBaik,
      jumlahRusakRingan,
      jumlahRusakBerat,
      jumlahAfkir,
      kondisiUtama,
      pjPegawaiId,
      fotoUrl,
      keterangan,
    } = body

    if (!namaBarang || !kategoriId) {
      return apiError('Nama barang dan kategori aset wajib diisi', 400)
    }

    // Auto generate kode barang jika belum diisi
    if (!kodeBarang || !kodeBarang.trim()) {
      const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '')
      const count = await prisma.sarprasBarang.count()
      kodeBarang = `AST-${yearMonth}-${String(count + 1).padStart(4, '0')}`
    } else {
      kodeBarang = kodeBarang.trim().toUpperCase()
      // Cek duplikasi kode
      const exists = await prisma.sarprasBarang.findUnique({
        where: { kodeBarang },
      })
      if (exists) {
        return apiError(`Kode aset barang "${kodeBarang}" sudah digunakan`, 409)
      }
    }

    // Kalkulasi jumlah jika hanya total diisi
    const tot = Math.max(1, Number(jumlahTotal) || 1)
    const baik = jumlahBaik !== undefined ? Number(jumlahBaik) : tot
    const rusakRingan = Number(jumlahRusakRingan) || 0
    const rusakBerat = Number(jumlahRusakBerat) || 0
    const afkir = Number(jumlahAfkir) || 0

    // Tentukan kondisi utama jika tidak ditentukan
    let finalKondisi = kondisiUtama || 'baik'
    if (baik === 0 && (rusakRingan > 0 || rusakBerat > 0)) {
      finalKondisi = rusakBerat > 0 ? 'rusak_berat' : 'rusak_ringan'
    } else if (baik === 0 && afkir > 0) {
      finalKondisi = 'afkir'
    }

    const created = await prisma.sarprasBarang.create({
      data: {
        kodeBarang,
        namaBarang: namaBarang.trim(),
        kategoriId: Number(kategoriId),
        ruanganId: ruanganId ? Number(ruanganId) : null,
        merk: merk ? merk.trim() : null,
        spesifikasi: spesifikasi ? spesifikasi.trim() : null,
        noSeri: noSeri ? noSeri.trim() : null,
        tahunPengadaan: tahunPengadaan ? Number(tahunPengadaan) : new Date().getFullYear(),
        sumberDana: sumberDana ? sumberDana.trim() : 'BOS Reguler',
        hargaPerolehan: hargaPerolehan ? Number(hargaPerolehan) : 0,
        jumlahTotal: tot,
        jumlahBaik: baik,
        jumlahRusakRingan: rusakRingan,
        jumlahRusakBerat: rusakBerat,
        jumlahAfkir: afkir,
        kondisiUtama: finalKondisi,
        pjPegawaiId: pjPegawaiId ? Number(pjPegawaiId) : null,
        fotoUrl: fotoUrl ? fotoUrl.trim() : null,
        keterangan: keterangan ? keterangan.trim() : null,
      },
      include: {
        kategori: true,
        ruangan: true,
        pjPegawai: true,
      },
    })

    return apiSuccess({
      data: created,
      message: 'Data aset barang berhasil ditambahkan',
      status: 201,
    })
  } catch (error: any) {
    console.error('Error creating barang:', error)
    return apiError(error.message || 'Gagal menambahkan aset barang', 500)
  }
}

