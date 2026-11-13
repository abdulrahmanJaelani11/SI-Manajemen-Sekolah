import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Memulai sinkronisasi menu dan data awal Perpustakaan (Fase 5A)...')

  // 1. Menu Sistem
  const menus = [
    {
      namaMenu: 'Katalog Buku & Pustaka',
      path: '/perpustakaan/buku',
      icon: 'IconBook',
      groupMenu: 'Perpustakaan & Literasi',
      urutan: 26,
    },
    {
      namaMenu: 'Sirkulasi & Scan QR',
      path: '/perpustakaan/sirkulasi',
      icon: 'IconQrcode',
      groupMenu: 'Perpustakaan & Literasi',
      urutan: 27,
    },
  ]

  const createdMenus = []
  for (const m of menus) {
    const menu = await prisma.secMenu.upsert({
      where: { path: m.path },
      update: m,
      create: m,
    })
    createdMenus.push(menu)
  }

  // 2. Beri hak akses ke Administrator, Tata Usaha, dan Guru
  const roles = await prisma.secRole.findMany({
    where: { namaRole: { in: ['Administrator', 'Tata Usaha', 'Guru'] } },
  })

  for (const role of roles) {
    for (const menu of createdMenus) {
      const isGuru = role.namaRole === 'Guru'
      await prisma.secRoleMenu.upsert({
        where: {
          roleId_menuId: {
            roleId: role.id,
            menuId: menu.id,
          },
        },
        update: {
          canView: true,
          canCreate: !isGuru,
          canEdit: !isGuru,
          canDelete: role.namaRole === 'Administrator',
        },
        create: {
          roleId: role.id,
          menuId: menu.id,
          canView: true,
          canCreate: !isGuru,
          canEdit: !isGuru,
          canDelete: role.namaRole === 'Administrator',
        },
      })
    }
  }
  console.log('✅ Menu dan izin RBAC Perpustakaan berhasil disiapkan')

  // 3. Seed Kategori Buku
  const kategoriData = [
    { kode: 'PEL-01', nama: 'Buku Pelajaran & Tematik', keterangan: 'Buku teks wajib kurikulum nasional' },
    { kode: 'NVL-01', nama: 'Fiksi & Novel Sastra', keterangan: 'Karya fiksi, antologi cerpen, dan novel' },
    { kode: 'SAI-01', nama: 'Sains & Teknologi Komputer', keterangan: 'Ilmu komputer, teknologi informasi, dan IPA' },
    { kode: 'REF-01', nama: 'Referensi & Ensiklopedia', keterangan: 'Kamus, ensiklopedia umum, dan pedoman resmi' },
    { kode: 'AGM-01', nama: 'Agama & Akhlak Mulia', keterangan: 'Budi pekerti, sirah, dan panduan ibadah' },
    { kode: 'SEJ-01', nama: 'Sejarah & Sosial Humaniora', keterangan: 'Sejarah Indonesia, biografi tokoh, dan sosiologi' },
  ]

  const kategoriMap = new Map<string, number>()
  for (const k of kategoriData) {
    const kat = await prisma.kategoriBuku.upsert({
      where: { kode: k.kode },
      update: { nama: k.nama, keterangan: k.keterangan },
      create: k,
    })
    kategoriMap.set(kat.kode, kat.id)
  }
  console.log('✅ 6 Kategori Buku Perpustakaan berhasil disiapkan')

  // 4. Seed Sampel Buku
  const sampleBooks = [
    {
      kodeBuku: 'BK-2026-0001',
      judul: 'Matematika Tingkat Lanjut SMA/SMK Kelas X',
      pengarang: 'Budi Raharjo, M.Sc',
      penerbit: 'Pusat Kurikulum & Perbukuan Kemendikbudristek',
      tahunTerbit: 2024,
      isbn: '978-602-244-890-1',
      kategoriId: kategoriMap.get('PEL-01')!,
      lokasiRak: 'Rak A-01',
      jumlahTotal: 25,
      jumlahTersedia: 24,
      deskripsi: 'Buku teks utama matematika semester ganjil dan genap untuk jenjang menengah.',
    },
    {
      kodeBuku: 'BK-2026-0002',
      judul: 'Laskar Pelangi',
      pengarang: 'Andrea Hirata',
      penerbit: 'Bentang Pustaka',
      tahunTerbit: 2018,
      isbn: '978-979-1227-89-6',
      kategoriId: kategoriMap.get('NVL-01')!,
      lokasiRak: 'Rak B-03',
      jumlahTotal: 5,
      jumlahTersedia: 4,
      deskripsi: 'Novel inspiratif tentang perjuangan sepuluh anak di Belitung dalam menempuh pendidikan.',
    },
    {
      kodeBuku: 'BK-2026-0003',
      judul: 'Pemrograman Web Modern dengan Next.js & TypeScript',
      pengarang: 'Abdul Rahman Jaelani, S.Kom',
      penerbit: 'Informatika Bandung',
      tahunTerbit: 2025,
      isbn: '978-623-7131-45-2',
      kategoriId: kategoriMap.get('SAI-01')!,
      lokasiRak: 'Rak C-02',
      jumlahTotal: 8,
      jumlahTersedia: 8,
      deskripsi: 'Panduan komprehensif membangun aplikasi web fullstack berskala enterprise.',
    },
    {
      kodeBuku: 'BK-2026-0004',
      judul: 'Ensiklopedia Sains dan Teknologi Dunia',
      pengarang: 'Tim Redaksi Sains',
      penerbit: 'Tira Pustaka Nusantara',
      tahunTerbit: 2023,
      isbn: '978-979-583-112-0',
      kategoriId: kategoriMap.get('REF-01')!,
      lokasiRak: 'Rak D-01',
      jumlahTotal: 3,
      jumlahTersedia: 3,
      deskripsi: 'Rujukan ilmu pengetahuan alam, penemuan peradaban, dan teknologi modern.',
    },
    {
      kodeBuku: 'BK-2026-0005',
      judul: 'Bumi Manusia (Tetralogi Buru)',
      pengarang: 'Pramoedya Ananta Toer',
      penerbit: 'Lentera Dipantara',
      tahunTerbit: 2020,
      isbn: '978-979-97312-3-4',
      kategoriId: kategoriMap.get('NVL-01')!,
      lokasiRak: 'Rak B-04',
      jumlahTotal: 4,
      jumlahTersedia: 4,
      deskripsi: 'Karya sastra kanon Indonesia berlatar masa kolonial awal abad ke-20.',
    },
  ]

  const bukuMap = new Map<string, number>()
  for (const b of sampleBooks) {
    const buku = await prisma.pustakaBuku.upsert({
      where: { kodeBuku: b.kodeBuku },
      update: b,
      create: b,
    })
    bukuMap.set(buku.kodeBuku, buku.id)
  }
  console.log('✅ 5 Sampel Judul Buku Pustaka berhasil disiapkan')

  // 5. Seed Sampel Peminjaman (1 Aktif, 1 Selesai)
  const siswa = await prisma.siswa.findFirst({
    where: { status: 'aktif' },
  })

  if (siswa) {
    const b1 = bukuMap.get('BK-2026-0001')
    const b2 = bukuMap.get('BK-2026-0002')

    // Peminjaman 1: Masih dipinjam
    if (b1) {
      await prisma.pustakaPeminjaman.upsert({
        where: { noPeminjaman: 'PJM-202611-0001' },
        update: {},
        create: {
          noPeminjaman: 'PJM-202611-0001',
          bukuId: b1,
          siswaId: siswa.id,
          tanggalPinjam: new Date('2026-11-08T08:00:00Z'),
          jatuhTempo: new Date('2026-11-15T08:00:00Z'),
          status: 'dipinjam',
          petugas: 'Staf Perpustakaan',
          catatan: 'Peminjaman buku paket untuk tugas kelompok',
        },
      })
    }

    // Peminjaman 2: Masih dipinjam
    if (b2) {
      await prisma.pustakaPeminjaman.upsert({
        where: { noPeminjaman: 'PJM-202611-0002' },
        update: {},
        create: {
          noPeminjaman: 'PJM-202611-0002',
          bukuId: b2,
          siswaId: siswa.id,
          tanggalPinjam: new Date('2026-11-10T09:30:00Z'),
          jatuhTempo: new Date('2026-11-17T09:30:00Z'),
          status: 'dipinjam',
          petugas: 'Staf Perpustakaan',
          catatan: 'Membaca mandiri waktu istirahat',
        },
      })
    }
    console.log(`✅ 2 Sampel Sirkulasi Peminjaman untuk siswa ${siswa.nama} berhasil disiapkan`)
  }

  console.log('🎉 Seed & sinkronisasi data Fase 5A selesai!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

