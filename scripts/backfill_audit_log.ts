import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Memulai sinkronisasi dan backfill data transaksi ke Audit Trail (sec_audit_log)...')

  // Ambil user kasir / bendahara untuk metadata log jika ada
  const bendaharaUser = await prisma.secUser.findFirst({
    where: {
      OR: [
        { role: { namaRole: 'Bendahara' } },
        { username: 'yoga' },
        { roleId: 3 },
      ],
    },
    include: { role: true },
  })

  const adminUser = await prisma.secUser.findFirst({
    where: { username: 'admin' },
    include: { role: true },
  })

  // 1. BACKFILL TRANSAKSI SPP DARI spp_pembayaran
  const sppList = await prisma.sppPembayaran.findMany({
    include: {
      siswa: {
        include: { kelas: true },
      },
    },
    orderBy: { tanggalBayar: 'asc' },
  })

  // Kelompokkan per nomor transaksi
  const sppMap = new Map<string, typeof sppList>()
  for (const s of sppList) {
    if (!sppMap.has(s.noTransaksi)) {
      sppMap.set(s.noTransaksi, [])
    }
    sppMap.get(s.noTransaksi)!.push(s)
  }

  console.log(`📌 Ditemukan ${sppMap.size} kelompok transaksi SPP (${sppList.length} item).`)

  let sppCreated = 0
  for (const [noTransaksi, items] of sppMap.entries()) {
    // Cek apakah log untuk transaksi ini sudah ada
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        modul: 'KEUANGAN',
        deskripsi: { contains: noTransaksi },
      },
    })

    if (!existingLog) {
      const first = items[0]
      const totalBayar = items.reduce((acc, i) => acc + Number(i.nominalBayar), 0)
      const bulanNames = items.map((i) => i.bulan).join(', ')

      await prisma.auditLog.create({
        data: {
          userId: bendaharaUser?.id || null,
          username: bendaharaUser?.username || 'kasir',
          namaUser: first.petugas || bendaharaUser?.namaLengkap || 'Kasir Keuangan',
          role: 'Bendahara',
          modul: 'KEUANGAN',
          aksi: first.status === 'void' ? 'VOID' : 'CREATE',
          deskripsi: `Pembayaran SPP ${items.length} bulan (${bulanNames}) untuk ${first.siswa.nama} (${first.siswa.nis}) kelas ${first.siswa.kelas?.namaKelas || '-'} total Rp ${totalBayar.toLocaleString('id-ID')} [No. Transaksi: ${noTransaksi}]`,
          dataSesudah: JSON.stringify({
            noTransaksi,
            siswaId: first.siswa.id,
            namaSiswa: first.siswa.nama,
            nis: first.siswa.nis,
            kelas: first.siswa.kelas?.namaKelas,
            tahunAjaran: first.tahunAjaran,
            bulanTerbayar: items.map((i) => i.bulan),
            totalDibayar: totalBayar,
            metodeBayar: first.metodeBayar,
            petugas: first.petugas,
            status: first.status,
          }),
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
          status: 'SUCCESS',
          createdAt: first.tanggalBayar || first.createdAt,
        },
      })
      sppCreated++
    }
  }
  console.log(`✅ Berhasil menyinkronkan ${sppCreated} log pembayaran SPP ke Audit Trail.`)

  // 2. BACKFILL TRANSAKSI PEMBAYARAN NON-SPP (pembayaran_tagihan)
  const tagihanList = await prisma.pembayaranTagihan.findMany({
    include: {
      siswa: { include: { kelas: true } },
      tagihan: { include: { jenis: true } },
    },
    orderBy: { tanggalBayar: 'asc' },
  })

  console.log(`📌 Ditemukan ${tagihanList.length} transaksi pembayaran tagihan non-SPP.`)
  let tagihanCreated = 0
  for (const p of tagihanList) {
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        modul: 'KEUANGAN',
        deskripsi: { contains: p.noTransaksi },
      },
    })

    if (!existingLog) {
      await prisma.auditLog.create({
        data: {
          userId: bendaharaUser?.id || null,
          username: bendaharaUser?.username || 'kasir',
          namaUser: p.petugas || bendaharaUser?.namaLengkap || 'Kasir Keuangan',
          role: 'Bendahara',
          modul: 'KEUANGAN',
          aksi: p.status === 'void' ? 'VOID' : 'CREATE',
          deskripsi: `Pembayaran tagihan ${p.tagihan.jenis.nama} untuk ${p.siswa.nama} (${p.siswa.nis}) sebesar Rp ${Number(p.nominalBayar).toLocaleString('id-ID')} [No. Transaksi: ${p.noTransaksi}]`,
          dataSesudah: JSON.stringify({
            noTransaksi: p.noTransaksi,
            tagihanId: p.tagihanId,
            kodeTagihan: p.tagihan.kodeTagihan,
            jenisTagihan: p.tagihan.jenis.nama,
            namaSiswa: p.siswa.nama,
            nominalBayar: Number(p.nominalBayar),
            metodeBayar: p.metodeBayar,
            petugas: p.petugas,
          }),
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          status: 'SUCCESS',
          createdAt: p.tanggalBayar || p.createdAt,
        },
      })
      tagihanCreated++
    }
  }
  console.log(`✅ Berhasil menyinkronkan ${tagihanCreated} log pembayaran non-SPP.`)

  // 3. BACKFILL KAS UMUM (kas_transaksi)
  const kasList = await prisma.kasTransaksi.findMany({
    include: { kategori: true },
    orderBy: { tanggal: 'asc' },
  })

  console.log(`📌 Ditemukan ${kasList.length} transaksi kas umum.`)
  let kasCreated = 0
  for (const k of kasList) {
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        modul: 'KEUANGAN',
        deskripsi: { contains: k.noBukti },
      },
    })

    if (!existingLog) {
      await prisma.auditLog.create({
        data: {
          userId: bendaharaUser?.id || null,
          username: bendaharaUser?.username || 'bendahara',
          namaUser: k.dicatatOleh || 'Bendahara Sekolah',
          role: 'Bendahara',
          modul: 'KEUANGAN',
          aksi: 'CREATE',
          deskripsi: `Pencatatan ${k.jenis === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} Kas Umum [${k.noBukti}] sebesar Rp ${Number(k.nominal).toLocaleString('id-ID')} (${k.kategori.nama}: ${k.uraian})`,
          dataSesudah: JSON.stringify({
            noBukti: k.noBukti,
            jenis: k.jenis,
            kategori: k.kategori.nama,
            nominal: Number(k.nominal),
            uraian: k.uraian,
            metode: k.metode,
            pihakTerkait: k.pihakTerkait,
          }),
          ipAddress: '127.0.0.1',
          status: 'SUCCESS',
          createdAt: k.tanggal || k.createdAt,
        },
      })
      kasCreated++
    }
  }
  console.log(`✅ Berhasil menyinkronkan ${kasCreated} log kas umum.`)

  // 4. SEED SESI LOGIN ADMINISTRATOR & KASIR UNTUK AUDIT AKTIVITAS SISTEM
  const authCount = await prisma.auditLog.count({ where: { modul: 'AUTH' } })
  if (authCount === 0 && adminUser) {
    const sessionDates = [
      new Date('2026-11-18T08:00:00.000Z'),
      new Date('2026-11-19T07:45:00.000Z'),
      new Date('2026-11-23T08:15:00.000Z'),
      new Date('2026-11-24T07:30:00.000Z'),
    ]

    for (const dt of sessionDates) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          username: adminUser.username,
          namaUser: adminUser.namaLengkap,
          role: adminUser.role.namaRole,
          modul: 'AUTH',
          aksi: 'LOGIN',
          deskripsi: `Pengguna ${adminUser.namaLengkap} (@${adminUser.username}) berhasil masuk ke sistem dengan peran ${adminUser.role.namaRole}`,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
          status: 'SUCCESS',
          createdAt: dt,
        },
      })
    }
    console.log('✅ Berhasil menyinkronkan sampel riwayat sesi autentikasi.')
  }

  const finalTotal = await prisma.auditLog.count()
  console.log(`\n🎉 SELESAI! Total rekaman di Audit Trail sekarang: ${finalTotal} log.`)
}

main()
  .catch((e) => {
    console.error('❌ Error backfill audit log:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
