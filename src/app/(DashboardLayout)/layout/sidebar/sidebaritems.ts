import { uniqueId } from 'lodash'

export interface ChildItem {
  id?: number | string
  name?: string
  icon?: string
  children?: ChildItem[]
  item?: unknown
  url?: string
  color?: string
  disabled?: boolean
  subtitle?: string
  badge?: boolean
  badgeType?: string
  isPro?: boolean
}

export interface MenuItem {
  heading?: string
  name?: string
  icon?: string
  id?: number | string
  to?: string
  items?: MenuItem[]
  children?: ChildItem[]
  url?: string
  disabled?: boolean
  subtitle?: string
  badgeType?: string
  badge?: boolean
  isPro?: boolean
}

const SidebarContent: MenuItem[] = [
  // ==================== 1. MENU UTAMA ====================
  {
    heading: 'Menu Utama',
    children: [
      {
        name: 'Dashboard',
        icon: 'solar:widget-2-linear',
        id: uniqueId(),
        url: '/',
        isPro: false,
      },
    ],
  },

  // ==================== 2. AKADEMIK & KESISWAAN ====================
  {
    heading: 'Akademik & Kesiswaan',
    children: [
      {
        name: 'Data Siswa',
        icon: 'solar:users-group-two-rounded-linear',
        id: uniqueId(),
        url: '/siswa',
        isPro: false,
      },
      {
        name: 'Rombel & Kelas',
        icon: 'solar:buildings-2-linear',
        id: uniqueId(),
        url: '/kelas',
        isPro: false,
      },
      {
        name: 'Program Jurusan',
        icon: 'solar:diploma-linear',
        id: uniqueId(),
        url: '/jurusan',
        isPro: false,
      },
      {
        name: 'Guru & Pegawai',
        icon: 'solar:user-speak-rounded-linear',
        id: uniqueId(),
        url: '/pegawai',
        isPro: false,
      },
      {
        name: 'Tahun Ajaran & Semester',
        icon: 'solar:calendar-mark-linear',
        id: uniqueId(),
        url: '/akademik/tahun-ajaran',
        isPro: false,
      },
      {
        name: 'Mata Pelajaran',
        icon: 'solar:book-2-linear',
        id: uniqueId(),
        url: '/akademik/mapel',
        isPro: false,
      },
      {
        name: 'Jadwal Pelajaran',
        icon: 'solar:clock-square-linear',
        id: uniqueId(),
        url: '/akademik/jadwal',
        isPro: false,
      },
      {
        name: 'Input Nilai Siswa',
        icon: 'solar:checklist-minimalistic-linear',
        id: uniqueId(),
        url: '/akademik/nilai',
        isPro: false,
      },
      {
        name: 'Rekap & E-Rapor',
        icon: 'solar:diploma-verified-linear',
        id: uniqueId(),
        url: '/akademik/rapor',
        isPro: false,
      },
      {
        name: 'Kenaikan Kelas',
        icon: 'solar:round-arrow-up-linear',
        id: uniqueId(),
        url: '/akademik/kenaikan-kelas',
        isPro: false,
      },
      {
        name: 'Kalender & Agenda Sekolah',
        icon: 'solar:calendar-date-linear',
        id: uniqueId(),
        url: '/akademik/kalender',
        isPro: false,
      },
    ],
  },

  // ==================== 2B. PRESENSI & KEHADIRAN ====================
  {
    heading: 'Presensi & Kehadiran',
    children: [
      {
        name: 'Presensi Gerbang (QR)',
        icon: 'solar:qr-code-linear',
        id: uniqueId(),
        url: '/absensi/gerbang',
        isPro: false,
      },
      {
        name: 'Absensi & Rekap Kelas',
        icon: 'solar:user-check-rounded-linear',
        id: uniqueId(),
        url: '/absensi/kelas',
        isPro: false,
      },
      {
        name: 'Presensi Guru & Pegawai',
        icon: 'solar:clock-circle-linear',
        id: uniqueId(),
        url: '/absensi/pegawai',
        isPro: false,
      },
    ],
  },

  // ==================== 2C. KESISWAAN & PPDB ====================
  {
    heading: 'Kesiswaan & PPDB',
    children: [
      {
        name: 'PPDB Online & Seleksi',
        icon: 'solar:user-plus-rounded-linear',
        id: uniqueId(),
        url: '/kesiswaan/ppdb',
        isPro: false,
      },
      {
        name: 'Kedisiplinan & Poin BK',
        icon: 'solar:shield-warning-linear',
        id: uniqueId(),
        url: '/kesiswaan/kedisiplinan',
        isPro: false,
      },
      {
        name: 'Mutasi Siswa',
        icon: 'solar:transfer-horizontal-linear',
        id: uniqueId(),
        url: '/kesiswaan/mutasi',
        isPro: false,
      },
      {
        name: 'Buku Induk & Alumni',
        icon: 'solar:square-academic-cap-linear',
        id: uniqueId(),
        url: '/kesiswaan/alumni',
        isPro: false,
      },
    ],
  },

  // ==================== 3. KEUANGAN & KASIR SPP ====================
  {
    heading: 'Keuangan & SPP',
    children: [
      {
        name: 'Kasir Pembayaran SPP',
        icon: 'solar:wallet-money-linear',
        id: uniqueId(),
        url: '/spp/kasir',
        isPro: false,
      },
      {
        name: 'Riwayat Transaksi',
        icon: 'solar:history-linear',
        id: uniqueId(),
        url: '/spp/riwayat',
        isPro: false,
      },
      {
        name: 'Rekap Tunggakan',
        icon: 'solar:card-2-linear',
        id: uniqueId(),
        url: '/spp/tunggakan',
        isPro: false,
      },
      {
        name: 'Master Tarif SPP',
        icon: 'solar:tag-price-linear',
        id: uniqueId(),
        url: '/spp/tarif',
        isPro: false,
      },
      {
        name: 'Tagihan Non-SPP & Cicilan',
        icon: 'solar:bill-list-linear',
        id: uniqueId(),
        url: '/keuangan/tagihan',
        isPro: false,
      },
      {
        name: 'Kas Umum & Pengeluaran',
        icon: 'solar:safe-square-linear',
        id: uniqueId(),
        url: '/keuangan/kas-umum',
        isPro: false,
      },
      {
        name: 'Laporan Arus Kas Terpadu',
        icon: 'solar:chart-square-linear',
        id: uniqueId(),
        url: '/keuangan/laporan',
        isPro: false,
      },
    ],
  },

  // ==================== 4. PERPUSTAKAAN & LITERASI ====================
  {
    heading: 'Perpustakaan & Literasi',
    children: [
      {
        name: 'Katalog Buku & Pustaka',
        icon: 'solar:book-2-linear',
        id: uniqueId(),
        url: '/perpustakaan/buku',
        isPro: false,
      },
      {
        name: 'Sirkulasi & Scan QR',
        icon: 'solar:scanner-linear',
        id: uniqueId(),
        url: '/perpustakaan/sirkulasi',
        isPro: false,
      },
    ],
  },

  // ==================== 5. SARANA & PRASARANA (SARPRAS) ====================
  {
    heading: 'Sarana & Prasarana',
    children: [
      {
        name: 'Master Ruangan & Lokasi',
        icon: 'solar:buildings-2-linear',
        id: uniqueId(),
        url: '/sarpras/ruangan',
        isPro: false,
      },
      {
        name: 'Inventaris & Aset Barang',
        icon: 'solar:armchair-2-linear',
        id: uniqueId(),
        url: '/sarpras/barang',
        isPro: false,
      },
    ],
  },

  // ==================== 6. CMS & PUBLIKASI WEB ====================
  {
    heading: 'CMS & Publikasi Web',
    children: [
      {
        name: 'Hero Carousel',
        icon: 'solar:gallery-wide-linear',
        id: uniqueId(),
        url: '/cms/carousel',
        isPro: false,
      },
      {
        name: 'Pilar Keunggulan',
        icon: 'solar:medal-ribbon-star-linear',
        id: uniqueId(),
        url: '/cms/keunggulan',
        isPro: false,
      },
      {
        name: 'Publikasi Berita',
        icon: 'solar:document-text-linear',
        id: uniqueId(),
        url: '/cms/berita',
        isPro: false,
      },
      {
        name: 'Sarana & Fasilitas',
        icon: 'solar:city-linear',
        id: uniqueId(),
        url: '/cms/fasilitas',
        isPro: false,
      },
      {
        name: 'Dokumentasi Kegiatan',
        icon: 'solar:calendar-date-linear',
        id: uniqueId(),
        url: '/cms/kegiatan',
        isPro: false,
      },
      {
        name: 'Lihat Portal Publik ↗',
        icon: 'solar:globus-linear',
        id: uniqueId(),
        url: '/portal',
        isPro: false,
      },
    ],
  },

  // ==================== 7. PENGATURAN SISTEM ====================
  {
    heading: 'Pengaturan Sistem',
    children: [
      {
        name: 'Akun Pengguna',
        icon: 'solar:user-id-linear',
        id: uniqueId(),
        url: '/pengaturan/pengguna',
        isPro: false,
      },
      {
        name: 'Manajemen Peran',
        icon: 'solar:shield-user-linear',
        id: uniqueId(),
        url: '/pengaturan/role',
        isPro: false,
      },
      {
        name: 'Matriks Hak Akses',
        icon: 'solar:shield-keyhole-linear',
        id: uniqueId(),
        url: '/pengaturan/hak-akses',
        isPro: false,
      },
      {
        name: 'Profil & Tema Sekolah',
        icon: 'solar:settings-linear',
        id: uniqueId(),
        url: '/pengaturan/sekolah',
        isPro: false,
      },
      {
        name: 'Audit Trail & Log Aktivitas',
        icon: 'solar:history-linear',
        id: uniqueId(),
        url: '/pengaturan/audit-log',
        isPro: false,
      },
    ],
  },
]

export default SidebarContent
