import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Memulai seeding basis data sistem manajemen sekolah...')

  // 1. Seed Roles
  const rolesData = [
    { namaRole: 'Administrator', keterangan: 'Akses penuh ke seluruh sistem' },
    { namaRole: 'Tata Usaha', keterangan: 'Pengelolaan kesiswaan, kelas, jurusan, dan pegawai' },
    { namaRole: 'Bendahara', keterangan: 'Pengelolaan kasir SPP, tarif, tunggakan, dan laporan keuangan' },
    { namaRole: 'Guru', keterangan: 'Akses informasi data kesiswaan dan kelas' },
  ]

  const rolesMap = new Map<string, number>()
  for (const r of rolesData) {
    const role = await prisma.secRole.upsert({
      where: { namaRole: r.namaRole },
      update: { keterangan: r.keterangan },
      create: { namaRole: r.namaRole, keterangan: r.keterangan, active: true },
    })
    rolesMap.set(r.namaRole, role.id)
  }
  console.log('✅ Roles berhasil dibuat/diperbarui')

  // 2. Seed Admin User
  const adminRoleId = rolesMap.get('Administrator')!
  const passwordHash = await bcrypt.hash('admin123', 10)

  const adminUser = await prisma.secUser.upsert({
    where: { username: 'admin' },
    update: {
      roleId: adminRoleId,
    },
    create: {
      username: 'admin',
      password: passwordHash,
      namaLengkap: 'Administrator Utama',
      email: 'admin@sekolah.sch.id',
      roleId: adminRoleId,
      active: true,
    },
  })
  console.log(`✅ Akun Admin berhasil disiapkan: username: "${adminUser.username}", password: "admin123"`)

  // 3. Seed Menus
  const menusData = [
    { namaMenu: 'Dashboard Utama', path: '/', icon: 'IconDashboard', groupMenu: 'Utama', urutan: 1 },
    { namaMenu: 'Data Peserta Didik', path: '/siswa', icon: 'IconSchool', groupMenu: 'Akademik & Kesiswaan', urutan: 2 },
    { namaMenu: 'Rombongan Belajar & Kelas', path: '/kelas', icon: 'IconBuildingBank', groupMenu: 'Akademik & Kesiswaan', urutan: 3 },
    { namaMenu: 'Program Jurusan & Keahlian', path: '/jurusan', icon: 'IconCertificate', groupMenu: 'Akademik & Kesiswaan', urutan: 4 },
    { namaMenu: 'Guru & Tenaga Pendidik', path: '/pegawai', icon: 'IconUsers', groupMenu: 'Akademik & Kesiswaan', urutan: 5 },
    { namaMenu: 'Kasir Pembayaran SPP', path: '/spp/kasir', icon: 'IconCash', groupMenu: 'Keuangan & SPP', urutan: 6 },
    { namaMenu: 'Riwayat Transaksi SPP', path: '/spp/riwayat', icon: 'IconReceipt2', groupMenu: 'Keuangan & SPP', urutan: 7 },
    { namaMenu: 'Rekapitulasi Tunggakan', path: '/spp/tunggakan', icon: 'IconReportMoney', groupMenu: 'Keuangan & SPP', urutan: 8 },
    { namaMenu: 'Master Tarif Iuran SPP', path: '/spp/tarif', icon: 'IconCoin', groupMenu: 'Keuangan & SPP', urutan: 9 },
    { namaMenu: 'Banner Hero Carousel', path: '/cms/carousel', icon: 'IconSlideshow', groupMenu: 'CMS & Publikasi', urutan: 10 },
    { namaMenu: 'Pilar Keunggulan', path: '/cms/keunggulan', icon: 'IconAward', groupMenu: 'CMS & Publikasi', urutan: 11 },
    { namaMenu: 'Publikasi Berita', path: '/cms/berita', icon: 'IconNews', groupMenu: 'CMS & Publikasi', urutan: 12 },
    { namaMenu: 'Sarana & Fasilitas', path: '/cms/fasilitas', icon: 'IconBuilding', groupMenu: 'CMS & Publikasi', urutan: 13 },
    { namaMenu: 'Dokumentasi Kegiatan', path: '/cms/kegiatan', icon: 'IconCalendarEvent', groupMenu: 'CMS & Publikasi', urutan: 14 },
    { namaMenu: 'Manajemen Akun Pengguna', path: '/pengaturan/pengguna', icon: 'IconUserCheck', groupMenu: 'Pengaturan Sistem', urutan: 15 },
    { namaMenu: 'Matriks Peran & Hak Akses', path: '/pengaturan/hak-akses', icon: 'IconShieldLock', groupMenu: 'Pengaturan Sistem', urutan: 16 },
    { namaMenu: 'Profil & Kustomisasi Tema', path: '/pengaturan/sekolah', icon: 'IconSettings', groupMenu: 'Pengaturan Sistem', urutan: 17 },
  ]

  const createdMenus: { id: number; path: string }[] = []
  for (const m of menusData) {
    const menu = await prisma.secMenu.upsert({
      where: { path: m.path },
      update: {
        namaMenu: m.namaMenu,
        icon: m.icon,
        groupMenu: m.groupMenu,
        urutan: m.urutan,
      },
      create: m,
    })
    createdMenus.push({ id: menu.id, path: menu.path })
  }
  console.log(`✅ ${createdMenus.length} Menu sistem berhasil disiapkan`)

  // 4. Seed Permissions untuk Administrator (Full Access)
  for (const menu of createdMenus) {
    await prisma.secRoleMenu.upsert({
      where: {
        roleId_menuId: {
          roleId: adminRoleId,
          menuId: menu.id,
        },
      },
      update: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
      create: {
        roleId: adminRoleId,
        menuId: menu.id,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
    })
  }

  // Seed Permissions untuk Bendahara (Fokus Kasir & Finansial)
  const bendaharaRoleId = rolesMap.get('Bendahara')
  if (bendaharaRoleId) {
    for (const menu of createdMenus) {
      const isFinansial = menu.path.startsWith('/spp')
      const isDashboard = menu.path === '/'
      const isSiswaView = menu.path === '/siswa' || menu.path === '/kelas'
      
      await prisma.secRoleMenu.upsert({
        where: {
          roleId_menuId: {
            roleId: bendaharaRoleId,
            menuId: menu.id,
          },
        },
        update: {
          canView: isFinansial || isDashboard || isSiswaView,
          canCreate: isFinansial,
          canEdit: isFinansial,
          canDelete: menu.path === '/spp/riwayat', // Void transaksi
        },
        create: {
          roleId: bendaharaRoleId,
          menuId: menu.id,
          canView: isFinansial || isDashboard || isSiswaView,
          canCreate: isFinansial,
          canEdit: isFinansial,
          canDelete: menu.path === '/spp/riwayat',
        },
      })
    }
  }
  console.log('✅ Matriks izin RBAC berhasil disiapkan')

  // 5. Seed Profil Sekolah
  const existingProfil = await prisma.sekolahProfil.findFirst()
  if (!existingProfil) {
    await prisma.sekolahProfil.create({
      data: {
        namaSekolah: 'Sistem Informasi Manajemen Sekolah Terpadu',
        npsn: '10203040',
        bentukPendidikan: 'Multi-Jenjang',
        sejarah:
          'Lembaga pendidikan formal terpadu yang berdedikasi mencetak generasi unggul, berakhlak mulia, dan siap bersaing di era digital.',
        visiMisi:
          'Visi: Menjadi institusi pendidikan berdaya saing global yang berkarakter kuat.\nMisi:\n1. Menyelenggarakan proses pembelajaran berbasis teknologi dan nilai integritas.\n2. Mengoptimalkan potensi peserta didik di bidang akademik dan non-akademik.\n3. Membangun tata kelola lembaga yang transparan, akuntabel, dan profesional.',
        alamat: 'Jl. Pendidikan Mandiri No. 45, Kompleks Pendidikan',
        telepon: '0812-3456-7890',
        email: 'info@manajemensekolah.sch.id',
        website: 'https://sekolah.example.sch.id',
        warnaPrimary: '#5d87ff',
        warnaPrimaryDark: '#4570ea',
        warnaAccent: '#13deb9',
        warnaSidebarStart: '#1e293b',
        warnaSidebarEnd: '#0f172a',
        temaPreset: 'default',
      },
    })
    console.log('✅ Profil Sekolah default berhasil dibuat')
  }

  // 6. Seed Master Jenjang & Tingkat & Jurusan
  const jenjangList = [
    {
      kode: 'SD',
      nama: 'Sekolah Dasar',
      urutan: 1,
      tingkat: ['1', '2', '3', '4', '5', '6'],
      jurusan: [],
    },
    {
      kode: 'SMP',
      nama: 'Sekolah Menengah Pertama',
      urutan: 2,
      tingkat: ['VII', 'VIII', 'IX'],
      jurusan: [],
    },
    {
      kode: 'SMA',
      nama: 'Sekolah Menengah Atas',
      urutan: 3,
      tingkat: ['X', 'XI', 'XII'],
      jurusan: [
        { kode: 'MIPA', nama: 'Matematika dan Ilmu Pengetahuan Alam' },
        { kode: 'IPS', nama: 'Ilmu Pengetahuan Sosial' },
      ],
    },
    {
      kode: 'SMK',
      nama: 'Sekolah Menengah Kejuruan',
      urutan: 4,
      tingkat: ['X', 'XI', 'XII'],
      jurusan: [
        { kode: 'RPL', nama: 'Rekayasa Perangkat Lunak' },
        { kode: 'TKJ', nama: 'Teknik Komputer dan Jaringan' },
        { kode: 'AKL', nama: 'Akuntansi dan Keuangan Lembaga' },
      ],
    },
  ]

  for (const j of jenjangList) {
    const jenjangRecord = await prisma.refJenjang.upsert({
      where: { kode: j.kode },
      update: { nama: j.nama, urutan: j.urutan },
      create: { kode: j.kode, nama: j.nama, urutan: j.urutan, active: true },
    })

    // Seed Tingkat
    for (let idx = 0; idx < j.tingkat.length; idx++) {
      const t = j.tingkat[idx]
      const existingTingkat = await prisma.refTingkat.findFirst({
        where: { jenjangId: jenjangRecord.id, tingkat: t },
      })
      if (!existingTingkat) {
        await prisma.refTingkat.create({
          data: {
            jenjangId: jenjangRecord.id,
            tingkat: t,
            urutan: idx + 1,
          },
        })
      }
    }

    // Seed Jurusan
    for (const jur of j.jurusan) {
      const existingJurusan = await prisma.jurusan.findFirst({
        where: { jenjangId: jenjangRecord.id, kodeJurusan: jur.kode },
      })
      if (!existingJurusan) {
        await prisma.jurusan.create({
          data: {
            jenjangId: jenjangRecord.id,
            kodeJurusan: jur.kode,
            namaJurusan: jur.nama,
            active: true,
          },
        })
      }
    }
  }
  console.log('✅ Master Jenjang (SD, SMP, SMA, SMK), Tingkat, dan Jurusan berhasil disiapkan')

  // 7. Seed CMS Carousel
  const countCarousel = await prisma.carousel.count()
  if (countCarousel === 0) {
    await prisma.carousel.createMany({
      data: [
        {
          badge: 'Tahun Ajaran Baru 2024/2025',
          judul: 'Penerimaan Peserta Didik Baru (PPDB) Resmi Dibuka',
          deskripsi: 'Bergabunglah bersama lembaga pendidikan berkarakter unggul, modern, dan berwawasan teknologi masa depan.',
          fotoUrl: '/images/hero/slider-1.jpg',
          link1Text: 'Daftar Sekarang',
          link1Url: '#kontak',
          link2Text: 'Profil Sekolah',
          link2Url: '/portal/profil',
          urutan: 1,
          active: true,
        },
        {
          badge: 'Prestasi & Keunggulan',
          judul: 'Membina Generasi Cerdas, Kreatif, dan Berakhlak Mulia',
          deskripsi: 'Menyediakan ekosistem pembelajaran holistik yang memadukan keunggulan akademik, sains teknologi, dan budi pekerti.',
          fotoUrl: '/images/hero/slider-2.jpg',
          link1Text: 'Lihat Fasilitas',
          link1Url: '/portal/fasilitas',
          link2Text: 'Galeri Kegiatan',
          link2Url: '/portal/kegiatan',
          urutan: 2,
          active: true,
        },
      ],
    })
    console.log('✅ Sample Banner Carousel berhasil disiapkan')
  }

  // 8. Seed CMS Pilar Keunggulan
  const countKeunggulan = await prisma.keunggulan.count()
  if (countKeunggulan === 0) {
    await prisma.keunggulan.createMany({
      data: [
        {
          judul: 'Kurikulum Berstandar Nasional',
          deskripsi: 'Implementasi Kurikulum Merdeka yang fleksibel, berfokus pada materi esensial dan pengembangan karakter.',
          icon: 'BookOpen',
          urutan: 1,
          active: true,
        },
        {
          judul: 'Pendidik Profesional & Berdedikasi',
          deskripsi: 'Didukung oleh dewan guru bersertifikasi, berkompeten, dan ramah terhadap kebutuhan perkembangan peserta didik.',
          icon: 'Award',
          urutan: 2,
          active: true,
        },
        {
          judul: 'Sarana & Lab Modern',
          deskripsi: 'Laboratorium komputer canggih, multimedia interaktif, perpustakaan digital, serta ruang kelas berpendingin udara.',
          icon: 'Building2',
          urutan: 3,
          active: true,
        },
        {
          judul: 'Prestasi & Ekstrakurikuler',
          deskripsi: 'Wadah penyaluran bakat melalui belasan cabang ekstrakurikuler seni, sains olimpiade, olahraga, dan kepemimpinan.',
          icon: 'Trophy',
          urutan: 4,
          active: true,
        },
      ],
    })
    console.log('✅ 4 Pilar Keunggulan berhasil disiapkan')
  }

  // 9. Seed Berita / Warta
  const countBerita = await prisma.berita.count()
  if (countBerita === 0) {
    await prisma.berita.createMany({
      data: [
        {
          judul: 'Sosialisasi Implementasi Pembelajaran Digital Interaktif Berbasis AI',
          slug: 'sosialisasi-pembelajaran-digital-interaktif',
          ringkasan: 'Sekolah menggelar workshop terpadu bagi seluruh dewan guru untuk memanfaatkan platform pembelajaran modern.',
          deskripsi: '<p>Dalam rangka meningkatkan efektivitas belajar mengajar di era modern, sekolah secara resmi meluncurkan inisiatif pembelajaran digital interaktif. Program ini mencakup penyediaan smart classroom, modul e-learning terpadu, dan pelatihan bagi para pendidik.</p><p>Kepala Sekolah menyampaikan bahwa adaptasi teknologi merupakan langkah krusial agar peserta didik siap bersaing secara global dengan tetap mengedepankan nilai moral dan integritas.</p>',
          kategori: 'Akademik',
          penulis: 'Humas Sekolah',
          published: true,
        },
        {
          judul: 'Kontingen Siswa Raih Medali Emas Olimpiade Sains & Teknologi 2024',
          slug: 'kontingen-siswa-raih-medali-emas-olimpiade-2024',
          ringkasan: 'Prestasi membanggakan kembali ditorehkan oleh siswa-siswi terbaik dalam ajang kompetisi sains tingkat wilayah.',
          deskripsi: '<p>Prestasi gemilang berhasil diraih oleh tim delegasi sekolah dalam ajang Olimpiade Sains dan Teknologi Terpadu 2024. Setelah melalui babak penyisihan yang ketat, tim berhasil membawa pulang medali emas pada kategori Informatika Terapan dan Fisika Terapan.</p><p>Apresiasi setinggi-tingginya diberikan kepada para pembina dan orang tua atas dukungan tanpa henti.</p>',
          kategori: 'Prestasi',
          penulis: 'Tim Kesiswaan',
          published: true,
        },
        {
          judul: 'Jadwal Asesmen Sumatif Akhir Semester Genap Tahun Ajaran 2024/2025',
          slug: 'jadwal-asesmen-sumatif-semester-genap-2024-2025',
          ringkasan: 'Pemberitahuan resmi mengenai jadwal pelaksanaan ujian akhir semester dan tata tertib bagi seluruh jenjang.',
          deskripsi: '<p>Diberitahukan kepada seluruh peserta didik dan wali murid bahwa Asesmen Sumatif Akhir Semester Genap akan dilaksanakan mulai tanggal 10 Juni hingga 22 Juni 2024. Seluruh siswa diharapkan menjaga kesehatan dan menyelesaikan administrasi akademik tepat waktu.</p>',
          kategori: 'Pengumuman',
          penulis: 'Bagian Kurikulum',
          published: true,
        },
      ],
    })
    console.log('✅ Sample Berita & Pengumuman berhasil disiapkan')
  }

  // 10. Seed Fasilitas
  const countFasilitas = await prisma.fasilitas.count()
  if (countFasilitas === 0) {
    await prisma.fasilitas.createMany({
      data: [
        {
          nama: 'Laboratorium Komputer & Riset TI',
          deskripsi: 'Dilengkapi 40 unit PC berspesifikasi tinggi, akses internet serat optik gigabit, dan software multimedia terkini.',
          kondisi: 'Sangat Baik',
        },
        {
          nama: 'Perpustakaan Digital Terpadu',
          deskripsi: 'Koleksi ribuan buku fisik dan e-book berlisensi, ruang baca hening ber-AC, serta terminal komputer penelusuran pustaka.',
          kondisi: 'Sangat Baik',
        },
        {
          nama: 'Gedung Olahraga Serbaguna & Lapangan',
          deskripsi: 'Fasilitas lapangan futsal, basket, voli, dan bulutangkis dengan standar keselamatan dan penerangan malam hari.',
          kondisi: 'Baik',
        },
        {
          nama: 'Masjid & Sarana Ibadah Kampus',
          deskripsi: 'Masjid berkapasitas 800 jamaah untuk pelaksanaan sholat berjamaah, kajian keagamaan, dan pembiasaan ibadah harian.',
          kondisi: 'Sangat Baik',
        },
      ],
    })
    console.log('✅ Sample Sarana & Fasilitas berhasil disiapkan')
  }

  // 11. Seed Kegiatan
  const countKegiatan = await prisma.kegiatan.count()
  if (countKegiatan === 0) {
    await prisma.kegiatan.createMany({
      data: [
        {
          judul: 'Latihan Dasar Kepemimpinan Siswa (LDKS) & Kemah Pramuka',
          deskripsi: 'Kegiatan pembentukan kepribadian, kemandirian, kepemimpinan, dan kerja sama tim untuk pengurus OSIS dan pramuka.',
          tanggal: new Date('2024-08-17'),
        },
        {
          judul: 'Pentas Seni, Budaya, dan Expo Kewirausahaan Siswa',
          deskripsi: 'Ajang kreasi seni musik, tari nusantara, teater, dan bazar produk kreatif hasil karya inovatif siswa.',
          tanggal: new Date('2024-10-28'),
        },
        {
          judul: 'Peringatan Hari Guru Nasional & Apresiasi Pendidik Teladan',
          deskripsi: 'Upacara khidmat dan penganugerahan penghargaan kepada guru berprestasi dan staf berdedikasi tinggi.',
          tanggal: new Date('2024-11-25'),
        },
      ],
    })
    console.log('✅ Sample Dokumentasi Kegiatan berhasil disiapkan')
  }

  console.log('🎉 Seeding basis data selesai dengan sukses!')
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
