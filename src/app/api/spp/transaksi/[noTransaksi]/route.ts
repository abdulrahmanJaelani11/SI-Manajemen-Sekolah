import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { terbilang } from '@/lib/terbilang'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noTransaksi: string }> }
) {
  try {
    const { noTransaksi } = await params
    if (!noTransaksi) return apiError('Nomor transaksi wajib disertakan', 400)

    const [items, profilSekolah] = await Promise.all([
      prisma.sppPembayaran.findMany({
        where: { noTransaksi },
        include: {
          siswa: {
            include: {
              jenjang: true,
              kelas: true,
              jurusan: true,
            },
          },
          kelas: true,
        },
        orderBy: { urutanBulan: 'asc' },
      }),
      prisma.sekolahProfil.findFirst(),
    ])

    if (!items || items.length === 0) {
      return apiError('Data transaksi kuitansi tidak ditemukan', 404)
    }

    const firstItem = items[0]
    const totalTagihan = items.reduce((acc, i) => acc + Number(i.nominalTagihan), 0)
    const totalDiskon = items.reduce((acc, i) => acc + Number(i.diskon), 0)
    const totalDibayar = items.reduce((acc, i) => acc + Number(i.nominalBayar), 0)

    return apiSuccess({
      message: 'Detail kuitansi transaksi berhasil dimuat',
      data: {
        noTransaksi: firstItem.noTransaksi,
        tanggalBayar: firstItem.tanggalBayar,
        metodeBayar: firstItem.metodeBayar,
        petugas: firstItem.petugas,
        status: firstItem.status,
        tahunAjaran: firstItem.tahunAjaran,
        keterangan: firstItem.keterangan,
        siswa: firstItem.siswa,
        sekolah: profilSekolah || {
          namaSekolah: 'Sistem Manajemen Sekolah',
          alamat: 'Jl. Pendidikan Nasional',
          telepon: '0812-3456-7890',
        },
        items: items.map((i) => ({
          id: i.id,
          bulan: i.bulan,
          urutanBulan: i.urutanBulan,
          nominalTagihan: Number(i.nominalTagihan),
          diskon: Number(i.diskon),
          nominalBayar: Number(i.nominalBayar),
        })),
        totalTagihan,
        totalDiskon,
        totalDibayar,
        terbilang: terbilang(totalDibayar),
      },
    })
  } catch (error: any) {
    console.error('API Transaksi Kuitansi Error:', error)
    return apiError('Gagal memuat kuitansi: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noTransaksi: string }> }
) {
  try {
    const { noTransaksi } = await params
    if (!noTransaksi) return apiError('Nomor transaksi wajib disertakan', 400)

    const items = await prisma.sppPembayaran.findMany({
      where: { noTransaksi },
    })

    if (items.length === 0) {
      return apiError('Transaksi tidak ditemukan', 404)
    }

    if (items[0].status === 'void') {
      return apiError('Transaksi ini sudah berstatus void (dibatalkan)', 400)
    }

    // Ubah status menjadi void
    await prisma.sppPembayaran.updateMany({
      where: { noTransaksi },
      data: {
        status: 'void',
      },
    })

    return apiSuccess({
      message: `Transaksi "${noTransaksi}" berhasil dibatalkan (VOID)`,
      data: null,
    })
  } catch (error: any) {
    console.error('API Transaksi Void Error:', error)
    return apiError('Gagal membatalkan transaksi: ' + (error?.message || 'Server error'), 500)
  }
}
