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
    ],
  },

  // ==================== 4. CMS & PUBLIKASI WEB ====================
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

  // ==================== 5. PENGATURAN SISTEM ====================
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
    ],
  },
]

export default SidebarContent
