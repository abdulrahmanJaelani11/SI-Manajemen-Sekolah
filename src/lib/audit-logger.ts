import { NextRequest } from 'next/server'
import prisma from './prisma'

export interface LogAuditParams {
  request?: NextRequest
  userId?: number | null
  username?: string | null
  namaUser?: string | null
  role?: string | null
  modul:
    | 'AUTH'
    | 'AKADEMIK'
    | 'KEUANGAN'
    | 'KESISWAAN'
    | 'PERPUSTAKAAN'
    | 'SARPRAS'
    | 'CMS'
    | 'PENGATURAN'
    | 'SISTEM'
  aksi:
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'EXPORT'
    | 'IMPORT'
    | 'PRINT'
    | 'VOID'
    | 'STATUS_CHANGE'
  deskripsi: string
  dataSebelum?: any
  dataSesudah?: any
  status?: 'SUCCESS' | 'FAILED' | 'WARNING'
}

export async function logAudit({
  request,
  userId,
  username,
  namaUser,
  role,
  modul,
  aksi,
  deskripsi,
  dataSebelum,
  dataSesudah,
  status = 'SUCCESS',
}: LogAuditParams) {
  try {
    let ipAddress: string | null = null
    let userAgent: string | null = null

    if (request) {
      const forwarded = request.headers.get('x-forwarded-for')
      ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || '127.0.0.1'
      userAgent = request.headers.get('user-agent') || null
    }

    const strSebelum = dataSebelum
      ? typeof dataSebelum === 'string'
        ? dataSebelum
        : JSON.stringify(dataSebelum)
      : null

    const strSesudah = dataSesudah
      ? typeof dataSesudah === 'string'
        ? dataSesudah
        : JSON.stringify(dataSesudah)
      : null

    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        username: username || null,
        namaUser: namaUser || null,
        role: role || null,
        modul,
        aksi,
        deskripsi,
        dataSebelum: strSebelum,
        dataSesudah: strSesudah,
        ipAddress,
        userAgent,
        status,
      },
    })
  } catch (error) {
    // Audit logging should never break application flow
    console.error('Failed to write audit log:', error)
    return null
  }
}

