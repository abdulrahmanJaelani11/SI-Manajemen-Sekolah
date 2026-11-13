'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface PermissionItem {
  menuPath: string
  menuName: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface UserSession {
  userId: number
  username: string
  namaLengkap: string
  roleId: number
  roleName: string
  email?: string | null
  permissions: PermissionItem[]
}

export interface PermissionContextType {
  user: UserSession | null
  loading: boolean
  canView: (path: string) => boolean
  canCreate: (path: string) => boolean
  canEdit: (path: string) => boolean
  canDelete: (path: string) => boolean
  isAdmin: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const PermissionContext = createContext<PermissionContextType>({
  user: null,
  loading: true,
  canView: () => true,
  canCreate: () => true,
  canEdit: () => true,
  canDelete: () => true,
  isAdmin: true,
  logout: async () => {},
  refreshUser: async () => {},
})

// Menu yang memerlukan proteksi otorisasi khusus
const PROTECTED_SYSTEM_PATHS = [
  '/',
  '/siswa',
  '/kelas',
  '/jurusan',
  '/pegawai',
  '/spp/kasir',
  '/spp/riwayat',
  '/spp/tunggakan',
  '/spp/tarif',
  '/cms/carousel',
  '/cms/keunggulan',
  '/cms/berita',
  '/cms/fasilitas',
  '/cms/kegiatan',
  '/pengaturan/pengguna',
  '/pengaturan/hak-akses',
  '/pengaturan/sekolah',
]

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const json = await res.json()

      if (json.success && json.data) {
        setUser(json.data)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(json.data))
        }
      } else {
        // Hapus sesi pengguna jika server menolak / unauthenticated
        setUser(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
      }
    } catch {
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const isAdmin = !!user && (user.roleName?.toLowerCase() === 'administrator' || user.roleId === 1)

  // Evaluasi Hak Akses View
  const canView = (path?: string): boolean => {
    if (!path) return true
    if (!user) return false // Pengguna belum terautentikasi tidak diizinkan
    if (isAdmin) return true
    if (!user.permissions || user.permissions.length === 0) return false

    // Bersihkan path
    const cleanPath = path.split('?')[0]

    // Cek apakah path termasuk menu sistem terdaftar
    const matched = user.permissions.find(
      (p) => p.menuPath === cleanPath || (p.menuPath !== '/' && cleanPath.startsWith(p.menuPath))
    )

    if (matched) {
      return matched.canView
    }

    // Jika path tidak ada dalam proteksi RBAC, izinkan
    const isProtected = PROTECTED_SYSTEM_PATHS.some(
      (p) => p === cleanPath || (p !== '/' && cleanPath.startsWith(p))
    )

    return !isProtected
  }

  const canCreate = (path?: string): boolean => {
    if (!path) return true
    if (!user) return false
    if (isAdmin) return true
    if (!user?.permissions) return false

    const cleanPath = path.split('?')[0]
    const matched = user.permissions.find(
      (p) => p.menuPath === cleanPath || (p.menuPath !== '/' && cleanPath.startsWith(p.menuPath))
    )
    return matched ? matched.canCreate : false
  }

  const canEdit = (path?: string): boolean => {
    if (!path) return true
    if (!user) return false
    if (isAdmin) return true
    if (!user?.permissions) return false

    const cleanPath = path.split('?')[0]
    const matched = user.permissions.find(
      (p) => p.menuPath === cleanPath || (p.menuPath !== '/' && cleanPath.startsWith(p.menuPath))
    )
    return matched ? matched.canEdit : false
  }

  const canDelete = (path?: string): boolean => {
    if (!path) return true
    if (!user) return false
    if (isAdmin) return true
    if (!user?.permissions) return false

    const cleanPath = path.split('?')[0]
    const matched = user.permissions.find(
      (p) => p.menuPath === cleanPath || (p.menuPath !== '/' && cleanPath.startsWith(p.menuPath))
    )
    return matched ? matched.canDelete : false
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error(e)
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
      setUser(null)
      router.push('/auth/login')
      router.refresh()
    }
  }

  return (
    <PermissionContext.Provider
      value={{
        user,
        loading,
        canView,
        canCreate,
        canEdit,
        canDelete,
        isAdmin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermission() {
  return useContext(PermissionContext)
}
