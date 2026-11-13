import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data Sarana & Prasarana (Sarpras)...')

  // 1. Kategori Barang
  const kategoriData = [
    { kode: 'ELK', nama: 'Elektronik & Komputer / IT', keterangan: 'Perangkat PC, laptop, proyektor, monitor, router, dan server' },
    { kode: 'MBL', nama: 'Mebel & Furnitur', keterangan: 'Meja, kursi siswa, lemari arsip, rak buku, dan loker' },
    { kode: 'LAB', nama: 'Peralatan Praktikum & Laboratorium', keterangan: 'Mikroskop, alat sains, tabung reaksi, kit otomotif/elektronika' },
    { kode: 'KLS', nama: 'Perlengkapan Ruang Kelas', keterangan: 'Papan tulis whiteboard/smartboard, jam dinding, dispenser, AC' },
    { kode: 'KND', nama: 'Kendaraan Operasional', keterangan: 'Bus sekolah, motor dinas, mobil operasional' },
    { kode: 'UMM', nama: 'Sarana Umum & Rumah Tangga', keterangan: 'Genset, pompa air, sound system upacara, alat kebersihan' },
  ]

  for (const kat of kategoriData) {
    await prisma.sarprasKategoriBarang.upsert({
      where: { kode: kat.kode },
      update: { nama: kat.nama, keterangan: kat.keterangan },
      create: kat,
    })
  }
  console.log('✅ Kategori barang berhasil di-seed')

  // 2. Ambil PIC Pegawai jika ada
  const guruList = await prisma.pegawai.findMany({ take: 3 })
  const pic1 = guruList[0]?.id || null
  const pic2 = guruList[1]?.id || pic1
  const pic3 = guruList[2]?.id || pic1

  // 3. Ruangan & Lokasi
  const ruanganData = [
    {
      kodeRuangan: 'R-LAB-KOMP1',
      namaRuangan: 'Laboratorium Komputer 1',
      gedung: 'Gedung B (Sains & Teknologi)',
      lantai: 2,
      kapasitas: 40,
      luasM2: 72,
      kategori: 'laboratorium',
      kondisi: 'baik',
      pjPegawaiId: pic1,
      keterangan: 'Dilengkapi 36 unit PC workstation, AC 2 PK, dan proyektor HDMI.',
    },
    {
      kodeRuangan: 'R-LAB-IPA',
      namaRuangan: 'Laboratorium IPA & Sains',
      gedung: 'Gedung B (Sains & Teknologi)',
      lantai: 1,
      kapasitas: 36,
      luasM2: 80,
      kategori: 'laboratorium',
      kondisi: 'baik',
      pjPegawaiId: pic2,
      keterangan: 'Peralatan biologi, kimia, mikroskop dan wastafel praktikum.',
    },
    {
      kodeRuangan: 'R-KLS-7A',
      namaRuangan: 'Ruang Kelas VII A',
      gedung: 'Gedung A (Utama)',
      lantai: 1,
      kapasitas: 36,
      luasM2: 56,
      kategori: 'kelas',
      kondisi: 'baik',
      pjPegawaiId: pic2,
      keterangan: 'Ruang kelas reguler dengan 36 pasang meja-kursi siswa dan whiteboard.',
    },
    {
      kodeRuangan: 'R-PERPUS',
      namaRuangan: 'Perpustakaan Utama',
      gedung: 'Gedung A (Utama)',
      lantai: 2,
      kapasitas: 60,
      luasM2: 120,
      kategori: 'perpustakaan',
      kondisi: 'baik',
      pjPegawaiId: pic3,
      keterangan: 'Ruang baca ber-AC, rak katalog buku, dan meja baca mandiri.',
    },
    {
      kodeRuangan: 'R-TU',
      namaRuangan: 'Ruang Tata Usaha & Kasir SPP',
      gedung: 'Gedung A (Utama)',
      lantai: 1,
      kapasitas: 15,
      luasM2: 48,
      kategori: 'kantor',
      kondisi: 'baik',
      pjPegawaiId: pic1,
      keterangan: 'Pusat pelayanan administrasi, loket kasir SPP, dan arsip dokumen.',
    },
    {
      kodeRuangan: 'R-BENGKEL',
      namaRuangan: 'Bengkel Praktik Siswa',
      gedung: 'Gedung C (Vokasi)',
      lantai: 1,
      kapasitas: 30,
      luasM2: 96,
      kategori: 'bengkel',
      kondisi: 'rusak_ringan',
      pjPegawaiId: pic3,
      keterangan: 'Tempat praktik kejuruan, perkakas mekanik, dan meja kerja kayu.',
    },
  ]

  for (const r of ruanganData) {
    await prisma.sarprasRuangan.upsert({
      where: { kodeRuangan: r.kodeRuangan },
      update: r,
      create: r,
    })
  }
  console.log('✅ Master ruangan berhasil di-seed')

  // Ambil data referensi ruangan dan kategori
  const rLab = await prisma.sarprasRuangan.findUnique({ where: { kodeRuangan: 'R-LAB-KOMP1' } })
  const rIpa = await prisma.sarprasRuangan.findUnique({ where: { kodeRuangan: 'R-LAB-IPA' } })
  const rKls = await prisma.sarprasRuangan.findUnique({ where: { kodeRuangan: 'R-KLS-7A' } })
  const rPerpus = await prisma.sarprasRuangan.findUnique({ where: { kodeRuangan: 'R-PERPUS' } })
  const rTu = await prisma.sarprasRuangan.findUnique({ where: { kodeRuangan: 'R-TU' } })

  const katElk = await prisma.sarprasKategoriBarang.findUnique({ where: { kode: 'ELK' } })
  const katMbl = await prisma.sarprasKategoriBarang.findUnique({ where: { kode: 'MBL' } })
  const katLab = await prisma.sarprasKategoriBarang.findUnique({ where: { kode: 'LAB' } })
  const katKls = await prisma.sarprasKategoriBarang.findUnique({ where: { kode: 'KLS' } })

  // 4. Inventaris Barang Aset
  const barangData = [
    {
      kodeBarang: 'AST-2024-0001',
      namaBarang: 'PC Desktop All-in-One Core i5',
      kategoriId: katElk!.id,
      ruanganId: rLab?.id,
      merk: 'Asus ExpertCenter',
      spesifikasi: 'Intel Core i5-12400, RAM 16GB DDR4, SSD 512GB NVMe, Layar 23.8" FHD IPS',
      noSeri: 'ASUS-AIO-2024-001',
      tahunPengadaan: 2024,
      sumberDana: 'BOS Reguler',
      hargaPerolehan: 9500000,
      jumlahTotal: 36,
      jumlahBaik: 34,
      jumlahRusakRingan: 2,
      jumlahRusakBerat: 0,
      jumlahAfkir: 0,
      kondisiUtama: 'baik',
      pjPegawaiId: pic1,
      fotoUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400',
      keterangan: 'Digunakan untuk praktikum TIK dan ujian berbasis komputer (CBT).',
    },
    {
      kodeBarang: 'AST-2024-0002',
      namaBarang: 'Proyektor LCD HDMI 3600 Lumens',
      kategoriId: katElk!.id,
      ruanganId: rLab?.id,
      merk: 'Epson EB-X500',
      spesifikasi: '3LCD Technology, XGA 1024x768, 3600 Lumens, HDMI & VGA Input',
      noSeri: 'EP-EBX500-9821',
      tahunPengadaan: 2024,
      sumberDana: 'BOS Reguler',
      hargaPerolehan: 6200000,
      jumlahTotal: 2,
      jumlahBaik: 2,
      jumlahRusakRingan: 0,
      jumlahRusakBerat: 0,
      jumlahAfkir: 0,
      kondisiUtama: 'baik',
      pjPegawaiId: pic1,
      fotoUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400',
      keterangan: 'Plafon mount terpasang di Lab Komputer 1 dan Ruang Rapat Guru.',
    },
    {
      kodeBarang: 'AST-2023-0003',
      namaBarang: 'Mikroskop Binokuler Siswa',
      kategoriId: katLab!.id,
      ruanganId: rIpa?.id,
      merk: 'Olympus CX23',
      spesifikasi: 'Perbesaran 40x - 1000x, lampu LED terintegrasi, lensa achromatic',
      noSeri: 'OLY-CX23-010',
      tahunPengadaan: 2023,
      sumberDana: 'BOS Kinerja',
      hargaPerolehan: 14500000,
      jumlahTotal: 8,
      jumlahBaik: 7,
      jumlahRusakRingan: 1,
      jumlahRusakBerat: 0,
      jumlahAfkir: 0,
      kondisiUtama: 'baik',
      pjPegawaiId: pic2,
      fotoUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
      keterangan: 'Disimpan di lemari kaca pengaman Lab IPA.',
    },
    {
      kodeBarang: 'AST-2024-0004',
      namaBarang: 'Set Meja Kursi Siswa Kayu Solid',
      kategoriId: katMbl!.id,
      ruanganId: rKls?.id,
      merk: 'Olympic School Series',
      spesifikasi: 'Rangka besi hollow tebal 1.2mm, daun meja kayu jati belanda dilapisi HPL',
      noSeri: 'MBL-KLS7A-01',
      tahunPengadaan: 2024,
      sumberDana: 'Komite Sekolah',
      hargaPerolehan: 450000,
      jumlahTotal: 36,
      jumlahBaik: 35,
      jumlahRusakRingan: 1,
      jumlahRusakBerat: 0,
      jumlahAfkir: 0,
      kondisiUtama: 'baik',
      pjPegawaiId: pic2,
      fotoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400',
      keterangan: 'Kebutuhan belajar mengajar harian ruang kelas VII A.',
    },
    {
      kodeBarang: 'AST-2023-0005',
      namaBarang: 'AC Split Inverter 2 PK',
      kategoriId: katKls!.id,
      ruanganId: rLab?.id,
      merk: 'Daikin Flash Inverter',
      spesifikasi: 'Kapasitas 18000 BTU, Refrigerant R32, hemat energi inverter',
      noSeri: 'DKN-FTKQ50-2023',
      tahunPengadaan: 2023,
      sumberDana: 'Yayasan',
      hargaPerolehan: 8200000,
      jumlahTotal: 2,
      jumlahBaik: 2,
      jumlahRusakRingan: 0,
      jumlahRusakBerat: 0,
      jumlahAfkir: 0,
      kondisiUtama: 'baik',
      pjPegawaiId: pic1,
      fotoUrl: 'https://images.unsplash.com/photo-1614633833026-0820552978b6?w=400',
      keterangan: 'Pendingin ruangan utama Lab Komputer 1.',
    },
    {
      kodeBarang: 'AST-2022-0006',
      namaBarang: 'Lemari Arsip Besi 2 Pintu',
      kategoriId: katMbl!.id,
      ruanganId: rTu?.id,
      merk: 'Lion 33 A',
      spesifikasi: 'Bahan plat baja 0.7mm, finishing powder coating abu-abu, kunci sentral',
      noSeri: 'LION-ARSP-04',
      tahunPengadaan: 2022,
      sumberDana: 'BOS Reguler',
      hargaPerolehan: 2800000,
      jumlahTotal: 4,
      jumlahBaik: 3,
      jumlahRusakRingan: 1,
      jumlahRusakBerat: 0,
      jumlahAfkir: 0,
      kondisiUtama: 'baik',
      pjPegawaiId: pic1,
      fotoUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400',
      keterangan: 'Penyimpanan buku induk dan berkas ijazah siswa.',
    },
    {
      kodeBarang: 'AST-2023-0007',
      namaBarang: 'Rak Buku Perpustakaan 2 Muka',
      kategoriId: katMbl!.id,
      ruanganId: rPerpus?.id,
      merk: 'Modera Library',
      spesifikasi: 'Bahan besi dan kayu MDF tahan rayap, 5 susun rak ganda bolak-balik',
      noSeri: 'MOD-RAK-01',
      tahunPengadaan: 2023,
      sumberDana: 'BOS Kinerja',
      hargaPerolehan: 3500000,
      jumlahTotal: 8,
      jumlahBaik: 8,
      jumlahRusakRingan: 0,
      jumlahRusakBerat: 0,
      jumlahAfkir: 0,
      kondisiUtama: 'baik',
      pjPegawaiId: pic3,
      fotoUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
      keterangan: 'Rak koleksi buku fiksi dan non-fiksi di ruang perpustakaan.',
    },
  ]

  for (const b of barangData) {
    await prisma.sarprasBarang.upsert({
      where: { kodeBarang: b.kodeBarang },
      update: b,
      create: b,
    })
  }
  console.log('✅ Inventaris barang aset berhasil di-seed')

  // 5. Daftarkan Menu RBAC jika belum ada
  const menuRuangan = await prisma.secMenu.upsert({
    where: { path: '/sarpras/ruangan' },
    update: { namaMenu: 'Master Ruangan & Lokasi', groupMenu: 'Sarana & Prasarana', icon: 'IconBuildingCommunity', urutan: 28 },
    create: { namaMenu: 'Master Ruangan & Lokasi', path: '/sarpras/ruangan', icon: 'IconBuildingCommunity', groupMenu: 'Sarana & Prasarana', urutan: 28 },
  })

  const menuBarang = await prisma.secMenu.upsert({
    where: { path: '/sarpras/barang' },
    update: { namaMenu: 'Inventaris & Aset Barang', groupMenu: 'Sarana & Prasarana', icon: 'IconArmchair', urutan: 29 },
    create: { namaMenu: 'Inventaris & Aset Barang', path: '/sarpras/barang', icon: 'IconArmchair', groupMenu: 'Sarana & Prasarana', urutan: 29 },
  })

  // Berikan hak akses penuh kepada role Administrator (roleId: 1)
  const adminRole = await prisma.secRole.findFirst({ where: { namaRole: 'Administrator' } })
  if (adminRole) {
    await prisma.secRoleMenu.upsert({
      where: { roleId_menuId: { roleId: adminRole.id, menuId: menuRuangan.id } },
      update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
      create: { roleId: adminRole.id, menuId: menuRuangan.id, canView: true, canCreate: true, canEdit: true, canDelete: true },
    })

    await prisma.secRoleMenu.upsert({
      where: { roleId_menuId: { roleId: adminRole.id, menuId: menuBarang.id } },
      update: { canView: true, canCreate: true, canEdit: true, canDelete: true },
      create: { roleId: adminRole.id, menuId: menuBarang.id, canView: true, canCreate: true, canEdit: true, canDelete: true },
    })
  }

  console.log('🎉 Seeding data Sarpras dan RBAC berhasil tuntas!')
}

main()
  .catch((e) => {
    console.error('Error seeding Sarpras:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
