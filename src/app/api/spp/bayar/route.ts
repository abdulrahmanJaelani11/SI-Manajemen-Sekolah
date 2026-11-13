import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { terbilang } from '@/lib/terbilang'
import { requirePermission } from '@/lib/auth/api-guard'

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/spp/kasir', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const {
      siswaId,
      tahunAjaran,
      bulanList,
      diskon = 0,
      metodeBayar = 'Tunai',
      petugas = auth.user.namaLengkap || 'Kasir Keuangan',
      keterangan,
    } = body

    if (!siswaId || !Array.isArray(bulanList) || bulanList.length === 0) {
      return apiError('Siswa dan minimal satu pilihan bulan pembayaran wajib ditentukan', 400)
    }

    const parsedSiswaId = parseInt(siswaId, 10)
    const parsedDiskon = parseFloat(diskon) || 0

    // Cek siswa
    const siswa = await prisma.siswa.findUnique({
      where: { id: parsedSiswaId },
      include: {
        jenjang: true,
        kelas: true,
      },
    })
    if (!siswa) {
      return apiError('Data siswa tidak ditemukan', 404)
    }

    const selectedUrutanList = bulanList.map((b: any) => b.urutanBulan)

    // Cek apakah ada bulan yang sudah pernah dibayar dan lunas
    const existingPaid = await prisma.sppPembayaran.findMany({
      where: {
        siswaId: parsedSiswaId,
        tahunAjaran: String(tahunAjaran).trim(),
        urutanBulan: { in: selectedUrutanList },
        status: 'lunas',
      },
    })

    if (existingPaid.length > 0) {
      const alreadyPaidNames = existingPaid.map((p) => p.bulan).join(', ')
      return apiError(
        `Pembayaran gagal: Bulan (${alreadyPaidNames}) sudah tercatat lunas sebelumnya.`,
        409
      )
    }

    // Generate Nomor Transaksi Unik: TRX-YYYYMMDD-XXXX
    const now = new Date()
    const yyyymmdd =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
    const noTransaksi = `TRX-${yyyymmdd}-${randomSuffix}`

    // Hitung subtotal dan alokasi diskon jika ada
    const totalSubtotal = bulanList.reduce(
      (acc: number, b: any) => acc + (parseFloat(b.nominal) || 0),
      0
    )
    const diskonPerBulan = bulanList.length > 0 ? parsedDiskon / bulanList.length : 0

    // Simpan dalam database transaction
    const createdPayments = await prisma.$transaction(
      bulanList.map((b: any) => {
        const nominalTagihan = parseFloat(b.nominal) || 0
        const diskonItem = Math.min(nominalTagihan, diskonPerBulan)
        const nominalBayar = Math.max(0, nominalTagihan - diskonItem)

        return prisma.sppPembayaran.create({
          data: {
            noTransaksi,
            siswaId: parsedSiswaId,
            kelasId: siswa.kelasId || null,
            tahunAjaran: String(tahunAjaran).trim(),
            bulan: String(b.bulan),
            urutanBulan: parseInt(b.urutanBulan, 10),
            nominalTagihan,
            diskon: diskonItem,
            nominalBayar,
            tanggalBayar: now,
            metodeBayar: String(metodeBayar),
            petugas: String(petugas),
            keterangan: keterangan ? String(keterangan).trim() : null,
            status: 'lunas',
          },
        })
      })
    )

    const totalDibayar = createdPayments.reduce(
      (acc, p) => acc + Number(p.nominalBayar),
      0
    )

    return apiSuccess({
      message: `Pembayaran SPP ${bulanList.length} bulan berhasil diproses`,
      data: {
        noTransaksi,
        siswa: {
          id: siswa.id,
          nama: siswa.nama,
          nis: siswa.nis,
          jenjang: siswa.jenjang?.kode,
          kelas: siswa.kelas?.namaKelas,
        },
        tahunAjaran,
        bulanTerbayar: createdPayments.map((p) => p.bulan),
        totalTagihan: totalSubtotal,
        diskon: parsedDiskon,
        totalDibayar,
        terbilang: terbilang(totalDibayar),
        tanggalBayar: now,
        metodeBayar,
        petugas,
        items: createdPayments,
      },
      status: 201,
    })
  } catch (error: any) {
    console.error('API SPP Bayar Error:', error)
    return apiError('Gagal memproses transaksi kasir SPP: ' + (error?.message || 'Server error'), 500)
  }
}
