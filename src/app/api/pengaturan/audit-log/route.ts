import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { requirePermission } from '@/lib/auth/api-guard'

// GET /api/pengaturan/audit-log
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, '/pengaturan/audit-log', 'view')
    if (auth.errorResponse) return auth.errorResponse

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit')) || 20))
    const search = (searchParams.get('search') || '').trim()
    const modul = (searchParams.get('modul') || '').trim()
    const aksi = (searchParams.get('aksi') || '').trim()
    const status = (searchParams.get('status') || '').trim()
    const username = (searchParams.get('username') || '').trim()
    const tanggalAwal = searchParams.get('tanggalAwal')
    const tanggalAkhir = searchParams.get('tanggalAkhir')

    const where: any = {}

    if (modul && modul !== 'all') {
      where.modul = modul
    }
    if (aksi && aksi !== 'all') {
      where.aksi = aksi
    }
    if (status && status !== 'all') {
      where.status = status
    }
    if (username && username !== 'all') {
      where.username = username
    }

    if (tanggalAwal && tanggalAkhir) {
      const start = new Date(tanggalAwal)
      const end = new Date(tanggalAkhir)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { gte: start, lte: end }
    } else if (tanggalAwal) {
      where.createdAt = { gte: new Date(tanggalAwal) }
    } else if (tanggalAkhir) {
      const end = new Date(tanggalAkhir)
      end.setHours(23, 59, 59, 999)
      where.createdAt = { lte: end }
    }

    if (search) {
      where.OR = [
        { deskripsi: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { namaUser: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
      ]
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [logs, totalCount, totalToday, totalChange, totalAuth, totalWarning, listUsers] =
      await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where }),
        prisma.auditLog.count({
          where: { createdAt: { gte: startOfToday } },
        }),
        prisma.auditLog.count({
          where: { aksi: { in: ['CREATE', 'UPDATE', 'DELETE', 'VOID'] } },
        }),
        prisma.auditLog.count({
          where: { aksi: { in: ['LOGIN', 'LOGOUT'] } },
        }),
        prisma.auditLog.count({
          where: { status: { in: ['FAILED', 'WARNING'] } },
        }),
        prisma.auditLog.findMany({
          where: { username: { not: null } },
          select: { username: true, namaUser: true },
          distinct: ['username'],
        }),
      ])

    return apiSuccess({
      data: {
        logs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        stats: {
          totalLogs: totalCount,
          totalToday,
          totalChange,
          totalAuth,
          totalWarning,
        },
        userList: listUsers,
      },
    })
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return apiError(error.message || 'Gagal memuat log audit aktivitas', 500)
  }
}

