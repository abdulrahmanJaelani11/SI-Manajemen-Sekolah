import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Menyiapkan sampel transaksi keuangan terpadu...')

  // 1. Cek apakah sudah ada pembayaran tagihan
  const countTagihanBayar = await prisma.pembayaranTagihan.count()
  if (countTagihanBayar === 0) {
    const tagihan = await prisma.tagihanSiswa.findFirst({
      where: { id: 2 },
      include: { siswa: true },
    })

    if (tagihan) {
      await prisma.pembayaranTagihan.create({
        data: {
          noTransaksi: 'BYR-TAG-20261112-0001',
          tagihanId: tagihan.id,
          siswaId: tagihan.siswaId,
          nominalBayar: 100000,
          metodeBayar: 'Transfer',
          petugas: 'Bendahara Sekolah',
          keterangan: 'Pembayaran cicilan ke-1 Biaya Ujian',
          status: 'sah',
          tanggalBayar: new Date('2026-11-10T09:30:00Z'),
        },
      })
      await prisma.tagihanSiswa.update({
        where: { id: tagihan.id },
        data: {
          totalTerbayar: 100000,
          status: 'cicilan',
        },
      })
      console.log('✅ Sampel Pembayaran Tagihan dibuat')
    }
  }

  // 2. Cek apakah sudah ada transaksi kas umum
  const countKas = await prisma.kasTransaksi.count()
  if (countKas === 0) {
    const katBOS = await prisma.kategoriKas.findFirst({ where: { kode: 'MSK-01' } })
    const katListrik = await prisma.kategoriKas.findFirst({ where: { kode: 'KLR-02' } })
    const katATK = await prisma.kategoriKas.findFirst({ where: { kode: 'KLR-03' } })

    if (katBOS) {
      await prisma.kasTransaksi.create({
        data: {
          noBukti: 'KM-20261101-0001',
          kategoriId: katBOS.id,
          jenis: 'pemasukan',
          tanggal: new Date('2026-11-01T08:00:00Z'),
          nominal: 25000000,
          metode: 'Bank / Transfer',
          pihakTerkait: 'Dinas Pendidikan Provinsi',
          uraian: 'Penerimaan Dana BOS Reguler Tahap II',
          dicatatOleh: 'Bendahara Sekolah',
        },
      })
    }

    if (katListrik) {
      await prisma.kasTransaksi.create({
        data: {
          noBukti: 'KK-20261105-0001',
          kategoriId: katListrik.id,
          jenis: 'pengeluaran',
          tanggal: new Date('2026-11-05T10:15:00Z'),
          nominal: 1850000,
          metode: 'Bank / Transfer',
          pihakTerkait: 'PLN & Indihome Telkom',
          uraian: 'Pembayaran tagihan listrik gedung utama & internet FO bulan Oktober',
          dicatatOleh: 'Bendahara Sekolah',
        },
      })
    }

    if (katATK) {
      await prisma.kasTransaksi.create({
        data: {
          noBukti: 'KK-20261109-0002',
          kategoriId: katATK.id,
          jenis: 'pengeluaran',
          tanggal: new Date('2026-11-09T14:20:00Z'),
          nominal: 420000,
          metode: 'Tunai',
          pihakTerkait: 'Toko Buku & ATK Barokah',
          uraian: 'Pembelian kertas HVS 5 rim, spidol whiteboard, dan tinta printer kantor TU',
          dicatatOleh: 'Bendahara Sekolah',
        },
      })
    }
    console.log('✅ Sampel Transaksi Kas Umum (Pemasukan BOS & Pengeluaran Operasional) dibuat')
  }

  console.log('🎉 Data keuangan terpadu siap!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

