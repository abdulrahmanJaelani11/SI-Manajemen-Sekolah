import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { verifyToken, JwtPayloadSiswa } from '@/lib/auth/jwt'

const BULAN_AKADEMIK = [
  { urutan: 1, nama: 'Juli' },
  { urutan: 2, nama: 'Agustus' },
  { urutan: 3, nama: 'September' },
  { urutan: 4, nama: 'Oktober' },
  { urutan: 5, nama: 'November' },
  { urutan: 6, nama: 'Desember' },
  { urutan: 7, nama: 'Januari' },
  { urutan: 8, nama: 'Februari' },
  { urutan: 9, nama: 'Maret' },
  { urutan: 10, nama: 'April' },
  { urutan: 11, nama: 'Mei' },
  { urutan: 12, nama: 'Juni' },
]

export async function GET(request: NextRequest) {
  try {
    let token: string | null = null

    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    if (!token) {
      token = request.cookies.get('siswa_token')?.value || null
    }

    if (!token) {
      return apiError('Sesi tidak terotentikasi', 401)
    }

    const decoded = verifyToken<JwtPayloadSiswa>(token)

    if (!decoded || decoded.role !== 'siswa' || !decoded.siswaId) {
      return apiError('Token tidak valid atau bukan sesi siswa', 401)
    }

    const siswaId = decoded.siswaId

    const { searchParams } = new URL(request.url)
    const tahunAjaran = searchParams.get('tahunAjaran') || '2024/2025'

    // Ambil data siswa
    const siswa = await prisma.siswa.findUnique({
      where: { id: siswaId },
      include: {
        jenjang: true,
        kelas: {
          include: {
            tingkat: true,
          },
        },
      },
    })

    if (!siswa) {
      return apiError('Siswa tidak ditemukan', 404)
    }

    // Cari Tarif SPP yang berlaku
    const tingkatId = siswa.kelas?.tingkatId || null
    let tarifRecord = await prisma.sppTarif.findFirst({
      where: {
        jenjangId: siswa.jenjangId,
        tingkatId: tingkatId,
        tahunAjaran: tahunAjaran,
        active: true,
      },
    })

    if (!tarifRecord) {
      tarifRecord = await prisma.sppTarif.findFirst({
        where: {
          jenjangId: siswa.jenjangId,
          tingkatId: null,
          tahunAjaran: tahunAjaran,
          active: true,
        },
      })
    }

    const nominalTarif = tarifRecord ? parseFloat(tarifRecord.nominal.toString()) : 150000

    // Ambil seluruh data pembayaran SPP siswa
    const pembayaranList = await prisma.sppPembayaran.findMany({
      where: {
        siswaId: siswa.id,
        tahunAjaran: tahunAjaran,
        status: 'lunas',
      },
      orderBy: { urutanBulan: 'asc' },
    })

    const pembayaranMap = new Map<number, any>()
    for (const p of pembayaranList) {
      pembayaranMap.set(p.urutanBulan, p)
    }

    // Bangun data status 12 bulan
    let totalTerbayar = 0
    let totalTunggakan = 0
    let bulanLunasCount = 0
    let bulanNunggakCount = 0

    const bulanStatus = BULAN_AKADEMIK.map((b) => {
      const bayar = pembayaranMap.get(b.urutan)

      if (bayar) {
        const nominal = parseFloat(bayar.nominalBayar.toString())
        totalTerbayar += nominal
        bulanLunasCount++

        return {
          urutan: b.urutan,
          bulan: b.nama,
          status: 'lunas',
          nominalTarif: parseFloat(bayar.nominalTagihan.toString()) || nominalTarif,
          diskon: parseFloat(bayar.diskon.toString()) || 0,
          nominalBayar: nominal,
          tanggalBayar: bayar.tanggalBayar,
          noTransaksi: bayar.noTransaksi,
          metodeBayar: bayar.metodeBayar,
          petugas: bayar.petugas,
        }
      } else {
        totalTunggakan += nominalTarif
        bulanNunggakCount++

        return {
          urutan: b.urutan,
          bulan: b.nama,
          status: 'belum_bayar',
          nominalTarif: nominalTarif,
          diskon: 0,
          nominalBayar: 0,
          tanggalBayar: null,
          noTransaksi: null,
          metodeBayar: null,
          petugas: null,
        }
      }
    })

    // Kelompokkan riwayat per transaksi kuitansi
    const txMap = new Map<string, any>()
    for (const p of pembayaranList) {
      if (!txMap.has(p.noTransaksi)) {
        txMap.set(p.noTransaksi, {
          noTransaksi: p.noTransaksi,
          tanggalBayar: p.tanggalBayar,
          metodeBayar: p.metodeBayar,
          petugas: p.petugas,
          keterangan: p.keterangan,
          bulanItems: [],
          totalNominal: 0,
        })
      }
      const tx = txMap.get(p.noTransaksi)
      tx.bulanItems.push({
        bulan: p.bulan,
        urutanBulan: p.urutanBulan,
        nominalTagihan: parseFloat(p.nominalTagihan.toString()),
        diskon: parseFloat(p.diskon.toString()),
        nominalBayar: parseFloat(p.nominalBayar.toString()),
      })
      tx.totalNominal += parseFloat(p.nominalBayar.toString())
    }

    const riwayatTransaksi = Array.from(txMap.values()).sort(
      (a, b) => new Date(b.tanggalBayar).getTime() - new Date(a.tanggalBayar).getTime()
    )

    return apiSuccess({
      message: 'Status tagihan SPP siswa berhasil dimuat',
      data: {
        siswa: {
          id: siswa.id,
          nama: siswa.nama,
          nis: siswa.nis,
          jenjang: siswa.jenjang.nama,
          kelas: siswa.kelas?.namaKelas || 'Belum Ditentukan',
          waliKelas: siswa.kelas?.waliKelas || '-',
        },
        tahunAjaran,
        nominalTarif,
        summary: {
          totalTerbayar,
          totalTunggakan,
          bulanLunasCount,
          bulanNunggakCount,
        },
        bulanStatus,
        riwayatTransaksi,
      },
    })
  } catch (error: any) {
    console.error('API Siswa SPP Error:', error)
    return apiError('Gagal memuat status SPP: ' + (error?.message || 'Server error'), 500)
  }
}
