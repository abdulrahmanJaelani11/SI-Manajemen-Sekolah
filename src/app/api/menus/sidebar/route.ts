import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

// Urutan prioritas grup menu agar susunan sidebar logis dan teratur
const GROUP_ORDER: Record<string, number> = {
  'Utama': 1,
  'Akademik & Kesiswaan': 2,
  'Akademik & Kurikulum': 3,
  'Kesiswaan & PPDB': 4,
  'Presensi & Kehadiran': 5,
  'Keuangan & SPP': 6,
  'Perpustakaan & Literasi': 7,
  'Sarana & Prasarana': 8,
  'CMS & Publikasi': 9,
  'Pengaturan Sistem': 10,
}

// Map ikon lama (Tabler) ke Solar Icons agar tampilan seragam dan konsisten
const ICON_FALLBACK_MAP: Record<string, string> = {
  'IconDashboard': 'solar:widget-2-linear',
  'IconSchool': 'solar:users-group-two-rounded-linear',
  'IconBuildingBank': 'solar:buildings-2-linear',
  'IconCertificate': 'solar:diploma-linear',
  'IconUsers': 'solar:user-speak-rounded-linear',
  'IconCalendarTime': 'solar:calendar-mark-linear',
  'IconTrendingUp': 'solar:chart-2-linear',
  'IconBook': 'solar:book-2-linear',
  'IconCalendarClock': 'solar:clock-square-linear',
  'IconFileCheck': 'solar:document-text-linear',
  'IconCertificate2': 'solar:diploma-verified-linear',
  'IconCalendarEvent': 'solar:calendar-date-linear',
  'IconSlideshow': 'solar:gallery-wide-linear',
  'IconAward': 'solar:medal-ribbon-star-linear',
  'IconNews': 'solar:document-text-linear',
  'IconBuilding': 'solar:city-linear',
  'IconUserPlus': 'solar:user-plus-linear',
  'IconShieldAlert': 'solar:shield-warning-linear',
  'IconArrowsTransferUp': 'solar:transfer-vertical-linear',
  'IconCash': 'solar:wallet-money-linear',
  'IconReceipt2': 'solar:bill-list-linear',
  'IconReportMoney': 'solar:dollar-minimalistic-linear',
  'IconCoin': 'solar:hand-money-linear',
  'IconFileInvoice': 'solar:bill-check-linear',
  'IconCashBanknote': 'solar:wad-of-money-linear',
  'IconReportAnalytics': 'solar:chart-square-linear',
  'IconShield': 'solar:shield-user-linear',
  'IconUserCheck': 'solar:user-id-linear',
  'IconShieldLock': 'solar:shield-keyhole-linear',
  'IconSettings': 'solar:settings-linear',
  'IconHistory': 'solar:history-linear',
  'IconQrcode': 'solar:qr-code-linear',
  'IconClockCheck': 'solar:stopwatch-play-linear',
  'IconBuildingCommunity': 'solar:buildings-3-linear',
  'IconArmchair': 'solar:box-minimalistic-linear',
}

export async function GET(request: NextRequest) {
  try {
    const menus = await prisma.secMenu.findMany({
      orderBy: [
        { urutan: 'asc' },
        { id: 'asc' },
      ],
    })

    // Kelompokkan menu berdasarkan groupMenu
    const groupMap = new Map<string, any[]>()

    for (const m of menus) {
      const groupName = m.groupMenu || 'Lainnya'
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, [])
      }

      // Resolusi icon agar serasi dengan format Solar Icons
      let resolvedIcon = m.icon || 'solar:widget-2-linear'
      if (ICON_FALLBACK_MAP[resolvedIcon]) {
        resolvedIcon = ICON_FALLBACK_MAP[resolvedIcon]
      }

      groupMap.get(groupName)!.push({
        id: m.id,
        name: m.namaMenu,
        url: m.path,
        icon: resolvedIcon,
        urutan: m.urutan,
      })
    }

    // Urutkan grup sesuai urutan baku GROUP_ORDER
    const sections = Array.from(groupMap.entries())
      .sort((a, b) => {
        const orderA = GROUP_ORDER[a[0]] || 99
        const orderB = GROUP_ORDER[b[0]] || 99
        return orderA - orderB
      })
      .map(([heading, children]) => ({
        heading,
        children: children.sort((a, b) => a.urutan - b.urutan),
      }))

    return apiSuccess({
      message: 'Sidebar navigation loaded successfully',
      data: sections,
    })
  } catch (error: any) {
    console.error('API Sidebar Menus Error:', error)
    return apiError('Gagal memuat navigasi menu: ' + (error?.message || 'Server error'), 500)
  }
}
