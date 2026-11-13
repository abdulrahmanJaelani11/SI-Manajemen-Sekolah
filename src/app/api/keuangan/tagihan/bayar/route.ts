import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'
import { getWibNow } from '@/lib/absensi/date-utils'

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/tagihan', 'create')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { tagihanId, nominalBayar, metodeBayar, tanggalBayar, keterangan } = body

    if (!tagihanId) {
      return apiError('ID tagihan wajib disertakan.', 400)
    }

    const amount = Number(nominalBayar)
    if (Number.isNaN(amount) || amount <= 0) {
      return apiError('Nominal pembayaran harus lebih dari Rp 0.', 400)
    }

    const tagihan = await prisma.tagihanSiswa.findUnique({
      where: { id: Number(tagihanId) },
      include: { jenis: true, siswa: true },
    })

    if (!tagihan) {
      return apiError('Data tagihan tidak ditemukan.', 404)
    }
    if (tagihan.status === 'batal') {
      return apiError('Tagihan ini berstatus dibatalkan.', 400)
    }

    const wajibBayar = Math.max(0, Number(tagihan.nominalTagihan) - Number(tagihan.diskon))
    const currentPaid = Number(tagihan.totalTerbayar)
    const sisa = Math.max(0, wajibBayar - currentPaid)

    if (sisa <= 0) {
      return apiError('Tagihan ini sudah lunas seluruhnya.', 400)
    }
    if (!tagihan.jenis.bolehCicil && amount < sisa) {
      return apiError(
        `Jenis tagihan "${tagihan.jenis.nama}" wajib dibayar lunas sebesar Rp ${sisa.toLocaleString('id-ID')}.`,
        400
      )
    }
    if (amount > sisa) {
      return apiError(
        `Nominal bayar melebihi sisa kewajiban (maks. Rp ${sisa.toLocaleString('id-ID')}).`,
        400
      )
    }

    const { dateStr } = getWibNow()
    const ymd = dateStr.replace(/-/g, '')
    const lastPay = await prisma.pembayaranTagihan.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    })
    let seq = (lastPay?.id || 0) + 1
    let noTransaksi = `NSP-${ymd}-${String(seq).padStart(4, '0')}`
    while (
      await prisma.pembayaranTagihan.findUnique({ where: { noTransaksi }, select: { id: true } })
    ) {
      seq += 1
      noTransaksi = `NSP-${ymd}-${String(seq).padStart(4, '0')}`
    }

    const newPaid = currentPaid + amount
    const newSisa = Math.max(0, wajibBayar - newPaid)
    const newStatus = newSisa <= 0 ? 'lunas' : 'cicilan'
    const petugasNama = auth.user.namaLengkap || auth.user.username
    const parsedTgl = tanggalBayar ? new Date(tanggalBayar) : new Date()

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.pembayaranTagihan.create({
        data: {
          noTransaksi,
          tagihanId: tagihan.id,
          siswaId: tagihan.siswaId,
          nominalBayar: amount,
          tanggalBayar: Number.isNaN(parsedTgl.getTime()) ? new Date() : parsedTgl,
          metodeBayar: metodeBayar || 'Tunai',
          petugas: petugasNama,
          keterangan: keterangan ? String(keterangan).trim() : null,
          status: 'sah',
        },
      })

      await tx.tagihanSiswa.update({
        where: { id: tagihan.id },
        data: {
          totalTerbayar: newPaid,
          status: newStatus,
        },
      })

      return payment
    })

    return apiSuccess({
      message:
        newStatus === 'lunas'
          ? `Tagihan ${tagihan.kodeTagihan} LUNAS (${result.noTransaksi})`
          : `Cicilan Rp ${amount.toLocaleString('id-ID')} tercatat (${result.noTransaksi}), sisa Rp ${newSisa.toLocaleString('id-ID')}`,
      data: {
        ...result,
        nominalBayar: Number(result.nominalBayar),
        sisaTagihan: newSisa,
        statusTagihan: newStatus,
      },
      status: 201,
    })
  } catch (error: any) {
    console.error('API Tagihan Bayar POST Error:', error)
    return apiError('Gagal memproses pembayaran tagihan: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/keuangan/tagihan', 'delete')
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { pembayaranId } = body
    if (!pembayaranId) {
      return apiError('ID transaksi pembayaran wajib disertakan.', 400)
    }

    const payment = await prisma.pembayaranTagihan.findUnique({
      where: { id: Number(pembayaranId) },
      include: { tagihan: true },
    })

    if (!payment) {
      return apiError('Transaksi pembayaran tidak ditemukan.', 404)
    }
    if (payment.status === 'void') {
      return apiError('Transaksi ini sudah di-void sebelumnya.', 400)
    }

    const rollbackAmount = Number(payment.nominalBayar)
    const updatedPaid = Math.max(0, Number(payment.tagihan.totalTerbayar) - rollbackAmount)
    const wajibBayar = Math.max(
      0,
      Number(payment.tagihan.nominalTagihan) - Number(payment.tagihan.diskon)
    )
    const nextStatus =
      updatedPaid >= wajibBayar && wajibBayar > 0
        ? 'lunas'
        : updatedPaid > 0
          ? 'cicilan'
          : 'belum_bayar'

    await prisma.$transaction(async (tx) => {
      await tx.pembayaranTagihan.update({
        where: { id: payment.id },
        data: { status: 'void' },
      })

      await tx.tagihanSiswa.update({
        where: { id: payment.tagihanId },
        data: {
          totalTerbayar: updatedPaid,
          status: nextStatus,
        },
      })
    })

    return apiSuccess({
      message: `Transaksi ${payment.noTransaksi} dibatalkan (VOID) dan saldo tagihan diperbarui.`,
    })
  } catch (error: any) {
    console.error('API Tagihan Bayar VOID Error:', error)
    return apiError('Gagal melakukan void transaksi: ' + (error?.message || 'Server error'), 500)
  }
}

