import prisma from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function cleanData() {
  console.log('--- Memulai Pembersihan Data Siswa & Transaksional ---');

  // 1. Catat baseline sebelum pembersihan
  const beforeCounts = {
    siswa: await prisma.siswa.count(),
    riwayatKelasSiswa: await prisma.riwayatKelasSiswa.count(),
    mutasiSiswa: await prisma.mutasiSiswa.count(),
    alumniTracer: await prisma.alumniTracer.count(),
    kedisiplinanSiswa: await prisma.kedisiplinanSiswa.count(),
    ppdbPendaftar: await prisma.ppdbPendaftar.count(),
    nilaiSiswa: await prisma.nilaiSiswa.count(),
    raporSiswa: await prisma.raporSiswa.count(),
    presensiSiswa: await prisma.presensiSiswa.count(),
    presensiPegawai: await prisma.presensiPegawai.count(),
    sppPembayaran: await prisma.sppPembayaran.count(),
    tagihanSiswa: await prisma.tagihanSiswa.count(),
    pembayaranTagihan: await prisma.pembayaranTagihan.count(),
    kasTransaksi: await prisma.kasTransaksi.count(),
    pustakaPeminjaman: await prisma.pustakaPeminjaman.count(),
    auditLog: await prisma.auditLog.count(),
  };

  console.log('Jumlah record sebelum pembersihan:', beforeCounts);

  // 2. Eksekusi pembersihan data dalam transaksi
  await prisma.$transaction(async (tx) => {
    // A. Hapus sirkulasi & keuangan turunan
    console.log('Menghapus data pembayaran tagihan & tagihan non-SPP...');
    await tx.pembayaranTagihan.deleteMany({});
    await tx.tagihanSiswa.deleteMany({});

    console.log('Menghapus data kasir pembayaran SPP...');
    await tx.sppPembayaran.deleteMany({});

    console.log('Menghapus buku kas umum transaksi...');
    await tx.kasTransaksi.deleteMany({});

    console.log('Menghapus sirkulasi peminjaman perpustakaan...');
    await tx.pustakaPeminjaman.deleteMany({});

    // B. Hapus data presensi
    console.log('Menghapus riwayat presensi siswa & pegawai...');
    await tx.presensiSiswa.deleteMany({});
    await tx.presensiPegawai.deleteMany({});

    // C. Hapus data akademik siswa (nilai, rapor, riwayat kelas)
    console.log('Menghapus nilai siswa & rapor...');
    await tx.nilaiSiswa.deleteMany({});
    await tx.raporSiswa.deleteMany({});
    await tx.riwayatKelasSiswa.deleteMany({});

    // D. Hapus data kesiswaan khusus (kedisiplinan, mutasi, alumni, PPDB)
    console.log('Menghapus kedisiplinan, mutasi, alumni & PPDB pendaftar...');
    await tx.kedisiplinanSiswa.deleteMany({});
    await tx.mutasiSiswa.deleteMany({});
    await tx.alumniTracer.deleteMany({});
    await tx.ppdbPendaftar.deleteMany({});

    // E. Hapus data induk siswa
    console.log('Menghapus seluruh data induk Siswa...');
    await tx.siswa.deleteMany({});

    // F. Hapus audit log transaksional
    console.log('Menghapus riwayat audit log...');
    await tx.auditLog.deleteMany({});

    // G. Pulihkan stok buku perpustakaan (jumlah_tersedia = jumlah_total)
    console.log('Memulihkan jumlah ketersediaan buku perpustakaan...');
    await tx.$executeRawUnsafe(`
      UPDATE pustaka_buku 
      SET jumlah_tersedia = jumlah_total;
    `);

    // H. Reset Auto-increment Sequences PostgreSQL ke 1
    console.log('Mereset auto-increment sequence ke 1...');
    const sequences = [
      'siswa_id_seq',
      'riwayat_kelas_siswa_id_seq',
      'mutasi_siswa_id_seq',
      'alumni_tracer_id_seq',
      'kedisiplinan_siswa_id_seq',
      'ppdb_pendaftar_id_seq',
      'nilai_siswa_id_seq',
      'rapor_siswa_id_seq',
      'presensi_siswa_id_seq',
      'presensi_pegawai_id_seq',
      'spp_pembayaran_id_seq',
      'tagihan_siswa_id_seq',
      'pembayaran_tagihan_id_seq',
      'kas_transaksi_id_seq',
      'pustaka_peminjaman_id_seq',
      'sec_audit_log_id_seq'
    ];

    for (const seq of sequences) {
      await tx.$executeRawUnsafe(`ALTER SEQUENCE "${seq}" RESTART WITH 1;`);
    }
  });

  // 3. Bersihkan berkas foto siswa pada direktori public/uploads/siswa
  const siswaUploadDir = path.join(process.cwd(), 'public', 'uploads', 'siswa');
  let deletedFilesCount = 0;
  if (fs.existsSync(siswaUploadDir)) {
    const files = fs.readdirSync(siswaUploadDir);
    for (const file of files) {
      const filePath = path.join(siswaUploadDir, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
        deletedFilesCount++;
        console.log(`Menghapus berkas foto: ${file}`);
      }
    }
  }

  // 4. Verifikasi jumlah record setelah pembersihan
  const afterCounts = {
    siswa: await prisma.siswa.count(),
    riwayatKelasSiswa: await prisma.riwayatKelasSiswa.count(),
    mutasiSiswa: await prisma.mutasiSiswa.count(),
    alumniTracer: await prisma.alumniTracer.count(),
    kedisiplinanSiswa: await prisma.kedisiplinanSiswa.count(),
    ppdbPendaftar: await prisma.ppdbPendaftar.count(),
    nilaiSiswa: await prisma.nilaiSiswa.count(),
    raporSiswa: await prisma.raporSiswa.count(),
    presensiSiswa: await prisma.presensiSiswa.count(),
    presensiPegawai: await prisma.presensiPegawai.count(),
    sppPembayaran: await prisma.sppPembayaran.count(),
    tagihanSiswa: await prisma.tagihanSiswa.count(),
    pembayaranTagihan: await prisma.pembayaranTagihan.count(),
    kasTransaksi: await prisma.kasTransaksi.count(),
    pustakaPeminjaman: await prisma.pustakaPeminjaman.count(),
    auditLog: await prisma.auditLog.count(),
  };

  // 5. Verifikasi master data tetap utuh
  const masterCounts = {
    secUser: await prisma.secUser.count(),
    secRole: await prisma.secRole.count(),
    sekolahProfil: await prisma.sekolahProfil.count(),
    pegawai: await prisma.pegawai.count(),
    kelas: await prisma.kelas.count(),
    jurusan: await prisma.jurusan.count(),
    mataPelajaran: await prisma.mataPelajaran.count(),
    pustakaBuku: await prisma.pustakaBuku.count(),
    sarprasBarang: await prisma.sarprasBarang.count(),
    sarprasRuangan: await prisma.sarprasRuangan.count(),
    sppTarif: await prisma.sppTarif.count(),
    jenisTagihan: await prisma.jenisTagihan.count(),
  };

  console.log('\n================ HASIL AKHIR ================');
  console.log('Record Siswa & Transaksional Setelah Pembersihan (Harus 0):', afterCounts);
  console.log('Master Data (Harus Utuh):', masterCounts);
  console.log(`Total berkas foto siswa yang dihapus: ${deletedFilesCount}`);
  console.log('==============================================');
}

cleanData()
  .catch((err) => {
    console.error('Error saat pembersihan data:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
