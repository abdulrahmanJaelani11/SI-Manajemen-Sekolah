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
    { namaMenu: 'Tahun Ajaran & Semester', path: '/akademik/tahun-ajaran', icon: 'IconCalendarTime', groupMenu: 'Akademik & Kesiswaan', urutan: 6 },
    { namaMenu: 'Mata Pelajaran & Pengampu', path: '/akademik/mapel', icon: 'IconBook', groupMenu: 'Akademik & Kesiswaan', urutan: 7 },
    { namaMenu: 'Jadwal Pelajaran', path: '/akademik/jadwal', icon: 'IconCalendarClock', groupMenu: 'Akademik & Kesiswaan', urutan: 8 },
    { namaMenu: 'Input Nilai Siswa', path: '/akademik/nilai', icon: 'IconFileCheck', groupMenu: 'Akademik & Kesiswaan', urutan: 9 },
    { namaMenu: 'Rekap Nilai & E-Rapor', path: '/akademik/rapor', icon: 'IconCertificate2', groupMenu: 'Akademik & Kesiswaan', urutan: 10 },
    { namaMenu: 'Kenaikan Kelas & Kelulusan', path: '/akademik/kenaikan-kelas', icon: 'IconTrendingUp', groupMenu: 'Akademik & Kesiswaan', urutan: 11 },
    { namaMenu: 'Presensi Gerbang (Scan QR)', path: '/absensi/gerbang', icon: 'IconQrcode', groupMenu: 'Presensi & Kehadiran', urutan: 12 },
    { namaMenu: 'Absensi Harian & Rekap Kelas', path: '/absensi/kelas', icon: 'IconUserCheck', groupMenu: 'Presensi & Kehadiran', urutan: 13 },
    { namaMenu: 'Presensi Guru & Pegawai', path: '/absensi/pegawai', icon: 'IconClockCheck', groupMenu: 'Presensi & Kehadiran', urutan: 14 },
    { namaMenu: 'PPDB Online & Seleksi', path: '/kesiswaan/ppdb', icon: 'IconUserPlus', groupMenu: 'Kesiswaan & PPDB', urutan: 15 },
    { namaMenu: 'Kedisiplinan & Poin BK', path: '/kesiswaan/kedisiplinan', icon: 'IconShieldAlert', groupMenu: 'Kesiswaan & PPDB', urutan: 16 },
    { namaMenu: 'Mutasi Siswa', path: '/kesiswaan/mutasi', icon: 'IconArrowsTransferUp', groupMenu: 'Kesiswaan & PPDB', urutan: 17 },
    { namaMenu: 'Buku Induk & Alumni', path: '/kesiswaan/alumni', icon: 'IconSchool', groupMenu: 'Kesiswaan & PPDB', urutan: 18 },
    { namaMenu: 'Kasir Pembayaran SPP', path: '/spp/kasir', icon: 'IconCash', groupMenu: 'Keuangan & SPP', urutan: 19 },
    { namaMenu: 'Riwayat Transaksi SPP', path: '/spp/riwayat', icon: 'IconReceipt2', groupMenu: 'Keuangan & SPP', urutan: 20 },
    { namaMenu: 'Rekapitulasi Tunggakan', path: '/spp/tunggakan', icon: 'IconReportMoney', groupMenu: 'Keuangan & SPP', urutan: 21 },
    { namaMenu: 'Master Tarif Iuran SPP', path: '/spp/tarif', icon: 'IconCoin', groupMenu: 'Keuangan & SPP', urutan: 22 },
    { namaMenu: 'Tagihan Non-SPP & Cicilan', path: '/keuangan/tagihan', icon: 'IconFileInvoice', groupMenu: 'Keuangan & SPP', urutan: 23 },
    { namaMenu: 'Kas Umum & Pengeluaran', path: '/keuangan/kas-umum', icon: 'IconCashBanknote', groupMenu: 'Keuangan & SPP', urutan: 24 },
    { namaMenu: 'Laporan Arus Kas Terpadu', path: '/keuangan/laporan', icon: 'IconReportAnalytics', groupMenu: 'Keuangan & SPP', urutan: 25 },
    { namaMenu: 'Katalog Buku & Pustaka', path: '/perpustakaan/buku', icon: 'IconBook', groupMenu: 'Perpustakaan & Literasi', urutan: 26 },
    { namaMenu: 'Sirkulasi & Scan QR', path: '/perpustakaan/sirkulasi', icon: 'IconQrcode', groupMenu: 'Perpustakaan & Literasi', urutan: 27 },
    { namaMenu: 'Master Ruangan & Lokasi', path: '/sarpras/ruangan', icon: 'IconBuildingCommunity', groupMenu: 'Sarana & Prasarana', urutan: 28 },
    { namaMenu: 'Inventaris & Aset Barang', path: '/sarpras/barang', icon: 'IconArmchair', groupMenu: 'Sarana & Prasarana', urutan: 29 },
    { namaMenu: 'Banner Hero Carousel', path: '/cms/carousel', icon: 'IconSlideshow', groupMenu: 'CMS & Publikasi', urutan: 30 },
    { namaMenu: 'Pilar Keunggulan', path: '/cms/keunggulan', icon: 'IconAward', groupMenu: 'CMS & Publikasi', urutan: 31 },
    { namaMenu: 'Publikasi Berita', path: '/cms/berita', icon: 'IconNews', groupMenu: 'CMS & Publikasi', urutan: 32 },
    { namaMenu: 'Sarana & Fasilitas', path: '/cms/fasilitas', icon: 'IconBuilding', groupMenu: 'CMS & Publikasi', urutan: 33 },
    { namaMenu: 'Dokumentasi Kegiatan', path: '/cms/kegiatan', icon: 'IconCalendarEvent', groupMenu: 'CMS & Publikasi', urutan: 34 },
    { namaMenu: 'Manajemen Akun Pengguna', path: '/pengaturan/pengguna', icon: 'IconUserCheck', groupMenu: 'Pengaturan Sistem', urutan: 35 },
    { namaMenu: 'Manajemen Peran & Wewenang', path: '/pengaturan/role', icon: 'IconShieldCheck', groupMenu: 'Pengaturan Sistem', urutan: 36 },
    { namaMenu: 'Matriks Peran & Hak Akses', path: '/pengaturan/hak-akses', icon: 'IconShieldLock', groupMenu: 'Pengaturan Sistem', urutan: 37 },
    { namaMenu: 'Profil & Kustomisasi Tema', path: '/pengaturan/sekolah', icon: 'IconSettings', groupMenu: 'Pengaturan Sistem', urutan: 38 },
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
      const isFinansial = menu.path.startsWith('/spp') || menu.path.startsWith('/keuangan')
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
          canDelete: menu.path === '/spp/riwayat' || menu.path.startsWith('/keuangan'), // Void transaksi
        },
        create: {
          roleId: bendaharaRoleId,
          menuId: menu.id,
          canView: isFinansial || isDashboard || isSiswaView,
          canCreate: isFinansial,
          canEdit: isFinansial,
          canDelete: menu.path === '/spp/riwayat' || menu.path.startsWith('/keuangan'),
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

  // 9. Seed Tahun Ajaran & Semester Default
  const existingTA = await prisma.tahunAjaran.count()
  if (existingTA === 0) {
    await prisma.tahunAjaran.createMany({
      data: [
        {
          nama: '2024/2025',
          semester: 'Ganjil',
          tanggalMulai: new Date('2024-07-15'),
          tanggalSelesai: new Date('2024-12-20'),
          isActive: true,
          keterangan: 'Semester Ganjil Tahun Ajaran 2024/2025',
        },
        {
          nama: '2024/2025',
          semester: 'Genap',
          tanggalMulai: new Date('2025-01-06'),
          tanggalSelesai: new Date('2025-06-20'),
          isActive: false,
          keterangan: 'Semester Genap Tahun Ajaran 2024/2025',
        },
        {
          nama: '2025/2026',
          semester: 'Ganjil',
          tanggalMulai: new Date('2025-07-14'),
          tanggalSelesai: new Date('2025-12-19'),
          isActive: false,
          keterangan: 'Persiapan Tahun Ajaran 2025/2026 Semester Ganjil',
        },
      ],
    })
    console.log('✅ Periode Tahun Ajaran default berhasil disiapkan')
  }

  // 10. Seed Slot Jam Pelajaran & Mata Pelajaran Default
  const existingSlots = await prisma.jamPelajaran.count()
  if (existingSlots === 0) {
    await prisma.jamPelajaran.createMany({
      data: [
        { urutan: 1, namaSlot: 'Jam ke-1', jamMulai: '07:00', jamSelesai: '07:45', isIstirahat: false },
        { urutan: 2, namaSlot: 'Jam ke-2', jamMulai: '07:45', jamSelesai: '08:30', isIstirahat: false },
        { urutan: 3, namaSlot: 'Jam ke-3', jamMulai: '08:30', jamSelesai: '09:15', isIstirahat: false },
        { urutan: 4, namaSlot: 'Istirahat 1', jamMulai: '09:15', jamSelesai: '09:35', isIstirahat: true },
        { urutan: 5, namaSlot: 'Jam ke-4', jamMulai: '09:35', jamSelesai: '10:20', isIstirahat: false },
        { urutan: 6, namaSlot: 'Jam ke-5', jamMulai: '10:20', jamSelesai: '11:05', isIstirahat: false },
        { urutan: 7, namaSlot: 'Jam ke-6', jamMulai: '11:05', jamSelesai: '11:50', isIstirahat: false },
        { urutan: 8, namaSlot: 'Istirahat 2 / Dzuhur', jamMulai: '11:50', jamSelesai: '12:30', isIstirahat: true },
        { urutan: 9, namaSlot: 'Jam ke-7', jamMulai: '12:30', jamSelesai: '13:15', isIstirahat: false },
        { urutan: 10, namaSlot: 'Jam ke-8', jamMulai: '13:15', jamSelesai: '14:00', isIstirahat: false },
      ],
    })
  }

  const existingMapel = await prisma.mataPelajaran.count()
  if (existingMapel === 0) {
    await prisma.mataPelajaran.createMany({
      data: [
        { kode: 'PAI-01', nama: 'Pendidikan Agama & Budi Pekerti', kelompok: 'Umum', kkm: 75 },
        { kode: 'PKN-01', nama: 'Pendidikan Pancasila', kelompok: 'Umum', kkm: 75 },
        { kode: 'BIN-01', nama: 'Bahasa Indonesia', kelompok: 'Umum', kkm: 75 },
        { kode: 'MTK-01', nama: 'Matematika', kelompok: 'Umum', kkm: 75 },
        { kode: 'IPA-01', nama: 'Ilmu Pengetahuan Alam (IPA)', kelompok: 'Umum', kkm: 75 },
        { kode: 'IPS-01', nama: 'Ilmu Pengetahuan Sosial (IPS)', kelompok: 'Umum', kkm: 75 },
        { kode: 'BIG-01', nama: 'Bahasa Inggris', kelompok: 'Umum', kkm: 75 },
        { kode: 'PJOK-01', nama: 'Pendidikan Jasmani & Kesehatan', kelompok: 'Umum', kkm: 75 },
        { kode: 'INF-01', nama: 'Informatika / Komputer', kelompok: 'Kejuruan', kkm: 78 },
        { kode: 'MULOK-01', nama: 'Bahasa Daerah / Muatan Lokal', kelompok: 'Muatan Lokal', kkm: 75 },
      ],
    })
  }

  const existingGelombang = await prisma.ppdbGelombang.count()
  if (existingGelombang === 0) {
    await prisma.ppdbGelombang.create({
      data: {
        nama: 'Gelombang 1 - Jalur Reguler & Prestasi',
        tahunAjaran: '2025/2026',
        tanggalMulai: new Date('2025-01-01T00:00:00.000Z'),
        tanggalSelesai: new Date('2027-06-30T23:59:59.000Z'),
        kuotaTotal: 150,
        biayaDaftar: 0,
        syaratText:
          '1. Scan/Foto Kartu Keluarga (KK)\n2. Pas Foto berwarna 3x4\n3. Scan/Foto Ijazah atau Surat Keterangan Lulus / Rapor terakhir',
        isActive: true,
      },
    })
  }

  const existingKategoriPoin = await prisma.kategoriPoinSiswa.count()
  if (existingKategoriPoin === 0) {
    await prisma.kategoriPoinSiswa.createMany({
      data: [
        { kode: 'PLG-01', nama: 'Terlambat Masuk Sekolah Tanpa Izin', jenis: 'pelanggaran', tingkat: 'ringan', poin: 5 },
        { kode: 'PLG-02', nama: 'Seragam / Atribut Tidak Lengkap', jenis: 'pelanggaran', tingkat: 'ringan', poin: 5 },
        { kode: 'PLG-03', nama: 'Membolos / Meninggalkan Pelajaran', jenis: 'pelanggaran', tingkat: 'sedang', poin: 15 },
        { kode: 'PLG-04', nama: 'Mengganggu Ketertiban / Merusak Fasilitas', jenis: 'pelanggaran', tingkat: 'sedang', poin: 20 },
        { kode: 'PLG-05', nama: 'Pelanggaran Berat Tata Tertib Sekolah', jenis: 'pelanggaran', tingkat: 'berat', poin: 50 },
        { kode: 'PRS-01', nama: 'Juara Lomba Tingkat Sekolah', jenis: 'prestasi', tingkat: 'sekolah', poin: 15 },
        { kode: 'PRS-02', nama: 'Juara Lomba Tingkat Kota / Kabupaten', jenis: 'prestasi', tingkat: 'kota', poin: 25 },
        { kode: 'PRS-03', nama: 'Juara Lomba Tingkat Provinsi', jenis: 'prestasi', tingkat: 'provinsi', poin: 40 },
        { kode: 'PRS-04', nama: 'Juara Lomba Tingkat Nasional', jenis: 'prestasi', tingkat: 'nasional', poin: 60 },
      ],
    })
  }

  const existingJenisTagihan = await prisma.jenisTagihan.count()
  if (existingJenisTagihan === 0) {
    await prisma.jenisTagihan.createMany({
      data: [
        { kode: 'UGD-01', nama: 'Uang Pangkal / Pengembangan Gedung', nominalDefault: 1500000, bolehCicil: true },
        { kode: 'SRG-01', nama: 'Paket Seragam Sekolah & Atribut', nominalDefault: 450000, bolehCicil: true },
        { kode: 'DU-01', nama: 'Biaya Daftar Ulang Tahunan', nominalDefault: 300000, bolehCicil: true },
        { kode: 'UJN-01', nama: 'Biaya Ujian Semester / Akhir', nominalDefault: 200000, bolehCicil: false },
        { kode: 'KGT-01', nama: 'Kegiatan Kesiswaan / Study Tour', nominalDefault: 350000, bolehCicil: true },
      ],
    })
  }

  const existingKategoriKas = await prisma.kategoriKas.count()
  if (existingKategoriKas === 0) {
    await prisma.kategoriKas.createMany({
      data: [
        { kode: 'MSK-01', nama: 'Dana BOS / Bantuan Pemerintah', jenis: 'pemasukan' },
        { kode: 'MSK-02', nama: 'Donasi / Hibah / Sumbangan', jenis: 'pemasukan' },
        { kode: 'MSK-03', nama: 'Pemasukan Sewa / Unit Usaha Sekolah', jenis: 'pemasukan' },
        { kode: 'KLR-01', nama: 'Honorarium & Kesejahteraan Pegawai', jenis: 'pengeluaran' },
        { kode: 'KLR-02', nama: 'Tagihan Listrik, Air & Internet', jenis: 'pengeluaran' },
        { kode: 'KLR-03', nama: 'ATK & Perlengkapan Operasional Kantor', jenis: 'pengeluaran' },
        { kode: 'KLR-04', nama: 'Pemeliharaan Gedung & Sarpras', jenis: 'pengeluaran' },
        { kode: 'KLR-05', nama: 'Biaya Kegiatan Siswa & Lomba', jenis: 'pengeluaran' },
      ],
    })
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
