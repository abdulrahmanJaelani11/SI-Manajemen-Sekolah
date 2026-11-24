import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requireAuth } from '@/lib/auth/api-guard'
import { getWibNow, toDbDate } from '@/lib/absensi/date-utils'
import {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/notifications'

export interface NotificationItem {
  id: string
  dbId?: number
  category: string
  type: 'danger' | 'warning' | 'info' | 'success'
  title: string
  subtitle: string
  url: string
  isRead: boolean
  count?: number
  createdAt: string
  isPersistent?: boolean
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.errorResponse) return auth.errorResponse

    const { user } = auth
    const roleName = user.roleName?.toLowerCase() || ''
    const isAdmin =
      roleName.includes('admin') ||
      roleName.includes('kepala') ||
      user.roleId === 1
    const isWaliKelas =
      Boolean(user.guruScope?.isWaliKelas) || roleName.includes('wali')
    const isBendahara =
      roleName.includes('bendahara') ||
      roleName.includes('keuangan') ||
      roleName.includes('kasir')
    const isBk =
      roleName.includes('bk') ||
      roleName.includes('bimbingan') ||
      roleName.includes('konseling')
    const isPerpus =
      roleName.includes('perpus') || roleName.includes('pustaka')

    const now = new Date()
    const { dateStr } = getWibNow()
    const todayDbDate = toDbDate(dateStr)

    const notifications: NotificationItem[] = []

    // ========================================================
    // A. NOTIFIKASI PERSISTEN DARI DATABASE (sec_notification)
    // ========================================================
    try {
      const dbNotifications = await prisma.secNotification.findMany({
        where: {
          OR: [
            { userId: user.userId },
            ...(user.roleId ? [{ roleId: user.roleId }] : []),
            { AND: [{ userId: null }, { roleId: null }] },
          ],
        },
        orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
        take: 20,
      })

      for (const n of dbNotifications) {
        notifications.push({
          id: `db-${n.id}`,
          dbId: n.id,
          category: n.category,
          type: (n.type as any) || 'info',
          title: n.title,
          subtitle: n.message,
          url: n.url || '#',
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
          isPersistent: true,
        })
      }
    } catch (err) {
      console.error('Fetch persistent notifications error:', err)
    }

    // ========================================================
    // B. NOTIFIKASI OTOMATIS BERBASIS KONDISI DATA OPERASIONAL
    // ========================================================

    // 1. PPDB Online Baru Menunggu Verifikasi (Admin, Kepala Sekolah)
    if (isAdmin) {
      try {
        const ppdbPendingCount = await prisma.ppdbPendaftar.count({
          where: { statusSeleksi: 'menunggu' },
        })

        if (ppdbPendingCount > 0) {
          notifications.push({
            id: 'ppdb-pending',
            category: 'Kesiswaan & PPDB',
            type: 'warning',
            title: `${ppdbPendingCount} Pendaftar PPDB Menunggu Verifikasi`,
            subtitle: 'Ada calon siswa baru yang berkas pendaftarannya perlu ditinjau.',
            url: '/kesiswaan/ppdb',
            isRead: false,
            count: ppdbPendingCount,
            createdAt: now.toISOString(),
          })
        }
      } catch (err) {
        console.error('Notification PPDB error:', err)
      }
    }

    // 2. Presensi Siswa Alpa Hari Ini (Wali Kelas, Admin, BK)
    if (isAdmin || isWaliKelas || isBk) {
      try {
        const kelasFilter =
          isWaliKelas && user.guruScope?.kelasIds?.length
            ? { kelasId: { in: user.guruScope.kelasIds } }
            : {}

        const alpaToday = await prisma.presensiSiswa.findMany({
          where: {
            tanggal: todayDbDate,
            status: 'alpa',
            ...kelasFilter,
          },
          include: {
            siswa: { select: { nama: true } },
            kelas: { select: { namaKelas: true } },
          },
          take: 5,
        })

        if (alpaToday.length > 0) {
          const names = alpaToday.map((a) => a.siswa.nama).slice(0, 2).join(', ')
          const remaining = alpaToday.length > 2 ? ` (+${alpaToday.length - 2} lainnya)` : ''
          notifications.push({
            id: 'presensi-alpa',
            category: 'Presensi & Kehadiran',
            type: 'danger',
            title: `${alpaToday.length} Siswa Alpa Hari Ini`,
            subtitle: `${names}${remaining}. Perlu konfirmasi ke wali murid.`,
            url: '/absensi/kelas',
            isRead: false,
            count: alpaToday.length,
            createdAt: now.toISOString(),
          })
        }
      } catch (err) {
        console.error('Notification Presensi error:', err)
      }
    }

    // 3. Catatan Pelanggaran Siswa Dalam Pembinaan BK (BK, Wali Kelas, Admin)
    if (isAdmin || isBk || isWaliKelas) {
      try {
        const kelasFilter =
          isWaliKelas && user.guruScope?.kelasIds?.length
            ? { siswa: { kelasId: { in: user.guruScope.kelasIds } } }
            : {}

        const pelanggaranList = await prisma.kedisiplinanSiswa.findMany({
          where: {
            jenis: 'pelanggaran',
            statusBk: { in: ['tercatat', 'pembinaan'] },
            ...kelasFilter,
          },
          include: {
            siswa: { select: { nama: true } },
            kategori: { select: { nama: true } },
          },
          orderBy: { tanggal: 'desc' },
          take: 3,
        })

        if (pelanggaranList.length > 0) {
          const first = pelanggaranList[0]
          notifications.push({
            id: 'bk-pelanggaran',
            category: 'Kedisiplinan & BK',
            type: 'warning',
            title: `${pelanggaranList.length} Catatan Pelanggaran Dalam Pembinaan`,
            subtitle: `${first.siswa.nama} • ${first.kategori.nama} (${first.poin} Poin)`,
            url: '/kesiswaan/kedisiplinan',
            isRead: false,
            count: pelanggaranList.length,
            createdAt: first.tanggal.toISOString(),
          })
        }
      } catch (err) {
        console.error('Notification BK error:', err)
      }
    }

    // 4. Peminjaman Buku Perpustakaan Terlambat / Jatuh Tempo (Perpus, Admin)
    if (isAdmin || isPerpus) {
      try {
        const bukuOverdue = await prisma.pustakaPeminjaman.findMany({
          where: {
            OR: [
              { status: 'terlambat' },
              { status: 'dipinjam', jatuhTempo: { lt: now } },
            ],
          },
          include: {
            buku: { select: { judul: true } },
            siswa: { select: { nama: true } },
          },
          take: 3,
        })

        if (bukuOverdue.length > 0) {
          const first = bukuOverdue[0]
          notifications.push({
            id: 'perpus-overdue',
            category: 'Perpustakaan & Literasi',
            type: 'danger',
            title: `${bukuOverdue.length} Peminjaman Buku Jatuh Tempo`,
            subtitle: `"${first.buku.judul}" dipinjam oleh ${first.siswa.nama}`,
            url: '/perpustakaan/sirkulasi',
            isRead: false,
            count: bukuOverdue.length,
            createdAt: first.jatuhTempo.toISOString(),
          })
        }
      } catch (err) {
        console.error('Notification Perpus error:', err)
      }
    }

    // 5. Tagihan Siswa Jatuh Tempo / Belum Bayar (Bendahara, Kasir, Admin)
    if (isAdmin || isBendahara) {
      try {
        const overdueTagihan = await prisma.tagihanSiswa.findMany({
          where: {
            status: { in: ['belum_bayar', 'cicilan'] },
            jatuhTempo: { lt: now },
          },
          include: {
            siswa: { select: { nama: true } },
          },
          take: 3,
        })

        if (overdueTagihan.length > 0) {
          const first = overdueTagihan[0]
          notifications.push({
            id: 'tagihan-overdue',
            category: 'Keuangan & Tagihan',
            type: 'danger',
            title: `${overdueTagihan.length} Tagihan Non-SPP Lewat Jatuh Tempo`,
            subtitle: `${first.judul} • ${first.siswa.nama}`,
            url: '/keuangan/tagihan',
            isRead: false,
            count: overdueTagihan.length,
            createdAt: first.createdAt.toISOString(),
          })
        } else {
          // Jika tidak ada yang jatuh tempo, cek tagihan aktif belum lunas
          const unpaidCount = await prisma.tagihanSiswa.count({
            where: { status: 'belum_bayar' },
          })
          if (unpaidCount > 0) {
            notifications.push({
              id: 'tagihan-unpaid',
              category: 'Keuangan & Tagihan',
              type: 'info',
              title: `${unpaidCount} Tagihan Siswa Belum Diselesaikan`,
              subtitle: 'Menanti penerimaan pembayaran di loket kasir sekolah.',
              url: '/keuangan/tagihan',
              isRead: false,
              count: unpaidCount,
              createdAt: now.toISOString(),
            })
          }
        }
      } catch (err) {
        console.error('Notification Keuangan error:', err)
      }
    }

    // Urutkan: belum dibaca terlebih dahulu, lalu berdasarkan tanggal terbaru
    notifications.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const unreadCount = notifications.filter((n) => !n.isRead).length

    return apiSuccess({
      message: 'Notifikasi berhasil dimuat',
      data: {
        notifications,
        unreadCount,
        timestamp: now.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('API Notifications Error:', error)
    return apiError('Gagal memuat notifikasi: ' + (error?.message || 'Server error'), 500)
  }
}

/**
 * Endpoint PATCH untuk memperbarui status notifikasi:
 * - { action: 'mark_all_read' }
 * - { action: 'mark_read', id: number | string }
 * - { action: 'delete', id: number }
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { action, id } = body

    if (action === 'mark_all_read') {
      await markAllNotificationsAsRead(auth.user.userId, auth.user.roleId)
      return apiSuccess({ message: 'Semua notifikasi persisten berhasil ditandai sudah dibaca' })
    }

    if (action === 'mark_read' && id) {
      const numId = typeof id === 'number' ? id : parseInt(String(id).replace('db-', ''), 10)
      if (!isNaN(numId)) {
        await markNotificationAsRead(numId)
      }
      return apiSuccess({ message: 'Notifikasi berhasil ditandai dibaca' })
    }

    if (action === 'delete' && id) {
      const numId = typeof id === 'number' ? id : parseInt(String(id).replace('db-', ''), 10)
      if (!isNaN(numId)) {
        await prisma.secNotification.delete({ where: { id: numId } }).catch(() => null)
      }
      return apiSuccess({ message: 'Notifikasi berhasil dihapus' })
    }

    return apiError('Aksi tidak valid', 400)
  } catch (error: any) {
    return apiError('Gagal memproses status notifikasi: ' + (error?.message || 'Server error'), 500)
  }
}

/**
 * Endpoint POST untuk menyiarkan notifikasi / pengumuman baru (Admin / Otoritas)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const { category, type, title, message, url, roleId, userId } = body

    if (!title || !message) {
      return apiError('Judul dan pesan notifikasi wajib diisi', 400)
    }

    const created = await createNotification({
      category: category || 'Pengumuman',
      type: type || 'info',
      title,
      message,
      url: url || null,
      roleId: roleId ? Number(roleId) : null,
      userId: userId ? Number(userId) : null,
      createdBy: auth.user.namaLengkap || auth.user.username,
    })

    return apiSuccess({
      message: 'Notifikasi berhasil dibuat dan disiarkan',
      data: created,
    })
  } catch (error: any) {
    return apiError('Gagal membuat notifikasi: ' + (error?.message || 'Server error'), 500)
  }
}
