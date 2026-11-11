'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { usePermission } from '@/context/PermissionContext'
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  Home,
  LogOut,
  AlertTriangle,
} from 'lucide-react'

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading, canView, logout } = usePermission()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm font-medium">Memverifikasi otorisasi peran...</span>
        </div>
      </div>
    )
  }

  // Jika tidak memiliki izin melihat halaman ini
  const allowed = canView(pathname)

  if (!allowed) {
    return (
      <div className="mx-auto my-12 max-w-2xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl dark:border-red-900/40 dark:bg-slate-900">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <ShieldAlert className="h-10 w-10 stroke-[1.8]" />
        </div>

        <span className="mt-6 inline-block rounded-full bg-red-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-red-700 dark:bg-red-900/40 dark:text-red-300">
          403 Akses Ditolak (Forbidden)
        </span>

        <h2 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
          Wewenang Akses Terbatas
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Akun Anda saat ini terdaftar sebagai peran{' '}
          <strong className="text-red-600 dark:text-red-400">
            {user?.roleName || 'Pengguna Terbatas'}
          </strong>
          , yang tidak memiliki izin untuk melihat modul{' '}
          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {pathname}
          </code>
          .
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 transition"
          >
            <Home className="h-4 w-4" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <button
            onClick={() => logout()}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Ganti Akun Login</span>
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Jika Anda memerlukan akses ke halaman ini, silakan hubungi Administrator Sistem untuk memperbarui matriks izin pada menu <strong>Peran & Hak Akses</strong>.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
