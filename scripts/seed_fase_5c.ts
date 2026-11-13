import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data Kalender Akademik & Audit Trail (Fase 5C)...')

  // 1. Seed Agenda Kalender Akademik
  const currentYear = new Date().getFullYear()
  const kalenderData = [
    {
      judul: 'Awal Tahun Pelajaran & MPLS Siswa Baru',
      deskripsi: 'Masa Pengenalan Lingkungan Sekolah bagi peserta didik baru dan apel pembukaan semester ganjil.',
      tanggalMulai: new Date(`${currentYear}-07-15`),
      tanggalSelesai: new Date(`${currentYear}-07-19`),
      kategori: 'akademik',
      warna: '#3b82f6', // biru
      tahunAjaran: `${currentYear}/${currentYear + 1}`,
      semester: 'ganjil',
      sasaran: 'semua',
      liburSekolah: false,
      isPublic: true,
    },
    {
      judul: 'Upacara Peringatan HUT Kemerdekaan RI ke-81',
      deskripsi: 'Upacara bendera wajib di lapangan utama sekolah diikuti seluruh dewan guru, staf, dan siswa.',
      tanggalMulai: new Date(`${currentYear}-08-17`),
      tanggalSelesai: new Date(`${currentYear}-08-17`),
      kategori: 'upacara',
      warna: '#ef4444', // merah
      tahunAjaran: `${currentYear}/${currentYear + 1}`,
      semester: 'ganjil',
      sasaran: 'semua',
      liburSekolah: false,
      isPublic: true,
    },
    {
      judul: 'Penilaian Tengah Semester (PTS) Ganjil',
      deskripsi: 'Pelaksanaan ujian tengah semester ganjil berbasis komputer (CBT) dan kertas mandiri.',
      tanggalMulai: new Date(`${currentYear}-09-23`),
      tanggalSelesai: new Date(`${currentYear}-09-28`),
      kategori: 'ujian',
      warna: '#f59e0b', // amber
      tahunAjaran: `${currentYear}/${currentYear + 1}`,
      semester: 'ganjil',
      sasaran: 'siswa',
      liburSekolah: false,
      isPublic: true,
    },
    {
      judul: 'Rapat Evaluasi Tengah Semester & Kinerja Guru',
      deskripsi: 'Rapat koordinasi dewan guru dan kepala sekolah evaluasi ketercapaian kurikulum dan rapor sisipan.',
      tanggalMulai: new Date(`${currentYear}-10-05`),
      tanggalSelesai: new Date(`${currentYear}-10-05`),
      kategori: 'rapat',
      warna: '#8b5cf6', // ungu
      tahunAjaran: `${currentYear}/${currentYear + 1}`,
      semester: 'ganjil',
      sasaran: 'guru',
      liburSekolah: false,
      isPublic: false,
    },
    {
      judul: 'Penilaian Akhir Semester (PAS) Ganjil',
      deskripsi: 'Ujian komprehensif semester ganjil seluruh mata pelajaran kurikulum merdeka.',
      tanggalMulai: new Date(`${currentYear}-11-25`),
      tanggalSelesai: new Date(`${currentYear}-12-04`),
      kategori: 'ujian',
      warna: '#ef4444', // merah
      tahunAjaran: `${currentYear}/${currentYear + 1}`,
      semester: 'ganjil',
      sasaran: 'siswa',
      liburSekolah: false,
      isPublic: true,
    },
    {
      judul: 'Pekan Olahraga, Seni & Classmeeting Siswa',
      deskripsi: 'Kompetisi antar kelas, pentas seni ekstrakurikuler, dan turnamen futsal/voli.',
      tanggalMulai: new Date(`${currentYear}-12-09`),
      tanggalSelesai: new Date(`${currentYear}-12-13`),
      kategori: 'kegiatan',
      warna: '#10b981', // emerald
      tahunAjaran: `${currentYear}/${currentYear + 1}`,
      semester: 'ganjil',
      sasaran: 'siswa',
      liburSekolah: false,
      isPublic: true,
    },
    {
      judul: 'Penyerahan Buku Laporan Hasil Belajar (E-Rapor)',
      deskripsi: 'Pengambilan rapor semester ganjil oleh orang tua / wali murid di ruang kelas masing-masing.',
      tanggalMulai: new Date(`${currentYear}-12-20`),
      tanggalSelesai: new Date(`${currentYear}-12-20`),
      kategori: 'akademik',
      warna: '#06b6d4', // cyan
      tahunAjaran: `${currentYear}/${currentYear + 1}`,
      semester: 'ganjil',
      sasaran: 'wali_murid',
      liburSekolah: false,
      isPublic: true,
    },
    {
      judul: 'Libur Akhir Semester Ganjil',
      deskripsi: 'Libur pembelajaran akhir semester ganjil bagi seluruh peserta didik.',
      tanggalMulai: new Date(`${currentYear}-12-23`),
      tanggalSelesai: new Date(`${currentYear + 1}-01-04`),
      kategori: 'libur',
      warna: '#64748b', // slate
      tahunAjaran: `${currentYear}/${currentYear + 1}`,
      semester: 'ganjil',
      sasaran: 'semua',
      liburSekolah: true,
      isPublic: true,
    },
  ]

  for (const item of kalenderData) {
    const existing = await prisma.akademikKalender.findFirst({
      where: { judul: item.judul, tahunAjaran: item.tahunAjaran },
    })
    if (!existing) {
      await prisma.akademikKalender.create({ data: item })
    }
  }
  console.log('✅ Agenda kalender akademik berhasil di-seed')

  // 2. Seed Sample Audit Trail Logs
  const auditLogs = [
    {
      username: 'admin',
      namaUser: 'Administrator Utama',
      role: 'Administrator',
      modul: 'AUTH',
      aksi: 'LOGIN',
      deskripsi: 'Pengguna Administrator Utama berhasil melakukan autentikasi login ke sistem.',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'SUCCESS',
      createdAt: new Date(Date.now() - 3600000 * 4),
    },
    {
      username: 'admin',
      namaUser: 'Administrator Utama',
      role: 'Administrator',
      modul: 'KEUANGAN',
      aksi: 'CREATE',
      deskripsi: 'Pencatatan transaksi penerimaan kas masuk SPP siswa nomor TRX-202611-0021 senilai Rp 250.000.',
      dataSesudah: JSON.stringify({ noTransaksi: 'TRX-202611-0021', nominal: 250000, siswa: 'Arif Yusup' }),
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'SUCCESS',
      createdAt: new Date(Date.now() - 3600000 * 3),
    },
    {
      username: 'guru_matematika',
      namaUser: 'Budi Santoso, S.Pd',
      role: 'Guru Mapel',
      modul: 'AKADEMIK',
      aksi: 'UPDATE',
      deskripsi: 'Penginputan rekapitulasi nilai akhir mata pelajaran Matematika kelas X RPL 1.',
      dataSebelum: JSON.stringify({ jumlahSiswa: 36, rataRata: 74.2 }),
      dataSesudah: JSON.stringify({ jumlahSiswa: 36, rataRata: 82.5 }),
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'SUCCESS',
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      username: 'petugas_perpus',
      namaUser: 'Siti Rohmah, A.Md',
      role: 'Petugas Perpustakaan',
      modul: 'PERPUSTAKAAN',
      aksi: 'CREATE',
      deskripsi: 'Perekaman peminjaman buku sirkulasi "Pemrograman Next.js" nomor pinjam PJM-202611-0008.',
      ipAddress: '192.168.1.88',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'SUCCESS',
      createdAt: new Date(Date.now() - 3600000 * 1),
    },
    {
      username: 'admin_sarpras',
      namaUser: 'Ahmad Fauzi, S.T',
      role: 'Pengelola Sarpras',
      modul: 'SARPRAS',
      aksi: 'UPDATE',
      deskripsi: 'Perubahan status kondisi aset PC Lab Komputer AST-2024-0001 dari Rusak Ringan ke Baik.',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      status: 'SUCCESS',
      createdAt: new Date(Date.now() - 1800000),
    },
  ]

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log })
  }
  console.log('✅ Log audit trail berhasil di-seed')

  // 3. Daftarkan Menu RBAC
  const menuKalender = await prisma.secMenu.upsert({
    where: { path: '/akademik/kalender' },
    update: { namaMenu: 'Kalender & Agenda Sekolah', groupMenu: 'Akademik & Kurikulum', icon: 'IconCalendarEvent', urutan: 15 },
    create: { namaMenu: 'Kalender & Agenda Sekolah', path: '/akademik/kalender', icon: 'IconCalendarEvent', groupMenu: 'Akademik & Kurikulum', urutan: 15 },
  })

  const menuAudit = await prisma.secMenu.upsert({
    where: { path: '/pengaturan/audit-log' },
    update: { namaMenu: 'Audit Trail & Log Pengawasan', groupMenu: 'Pengaturan Sistem', icon: 'IconHistory', urutan: 39 },
    create: { namaMenu: 'Audit Trail & Log Pengawasan', path: '/pengaturan/audit-log', icon: 'IconHistory', groupMenu: 'Pengaturan Sistem', urutan: 39 },
  })

  // Berikan hak akses penuh kepada Administrator
  const adminRole = await prisma.secRole.findFirst({ where: { namaRole: 'Administrator' } })
  if (adminRole) {
    await prisma.secRoleMenu.upsert({
      where: { roleId_menuId: { roleId: adminRole.id, menuId: menuKalender.id } },
      update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
      create: { roleId: adminRole.id, menuId: menuKalender.id, canView: true, canCreate: true, canEdit: true, canDelete: true },
    })

    await prisma.secRoleMenu.upsert({
      where: { roleId_menuId: { roleId: adminRole.id, menuId: menuAudit.id } },
      update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
      create: { roleId: adminRole.id, menuId: menuAudit.id, canView: true, canCreate: true, canEdit: true, canDelete: true },
    })
  }

  console.log('🎉 Seeding data Tahap 5C selesai!')
}

main()
  .catch((e) => {
    console.error('Error seeding Fase 5C:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

