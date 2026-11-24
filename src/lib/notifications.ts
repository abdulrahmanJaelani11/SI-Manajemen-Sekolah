import prisma from '@/lib/prisma'

export interface CreateNotificationParams {
  userId?: number | null
  roleId?: number | null
  category: string
  type?: 'info' | 'warning' | 'danger' | 'success'
  title: string
  message: string
  url?: string | null
  createdBy?: string | null
}

/**
 * Menyimpan notifikasi baru ke database (persisten).
 * Bisa ditargetkan ke userId spesifik, roleId tertentu, atau broadcast umum (keduanya null).
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.secNotification.create({
      data: {
        userId: params.userId || null,
        roleId: params.roleId || null,
        category: params.category,
        type: params.type || 'info',
        title: params.title,
        message: params.message,
        url: params.url || null,
        createdBy: params.createdBy || 'Sistem',
      },
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

/**
 * Menandai satu notifikasi sebagai sudah dibaca di database.
 */
export async function markNotificationAsRead(id: number) {
  try {
    return await prisma.secNotification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return null
  }
}

/**
 * Menandai seluruh notifikasi yang relevan dengan user sebagai sudah dibaca.
 */
export async function markAllNotificationsAsRead(userId: number, roleId?: number) {
  try {
    return await prisma.secNotification.updateMany({
      where: {
        isRead: false,
        OR: [
          { userId },
          ...(roleId ? [{ roleId }] : []),
          { AND: [{ userId: null }, { roleId: null }] },
        ],
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    return null
  }
}
