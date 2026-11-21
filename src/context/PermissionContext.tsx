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

export interface GuruScope {
  isGuru: boolean
  pegawaiId: number | null
  namaPegawai: string | null
  kelasIds: number[]
  jenjangIds: number[]
  kelasNames: string[]
  jenjangKodes: string[]
  isWaliKelas: boolean
  waliKelasNames: string[]
}

export interface UserSession {
  userId: number
  username: string
  namaLengkap: string
  roleId: number
  roleName: string
  email?: string | null
  pegawaiId?: number | null
  jenjangId?: number | null
  jenjang?: { id: number; kode: string; nama: string } | null
  pegawai?: {
    id: number
    nip: string | null
    nama: string
    jenisPegawai: string
    bidangStudi: string | null
  } | null
  guruScope?: GuruScope
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

// Path utilitas umum dalam dashboard yang dapat diakses oleh semua pengguna terautentikasi
const PUBLIC_DASHBOARD_PATHS = ['/user-profile']

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

  // Helper untuk mencocokkan permission path dengan target path
  const findPermission = (path?: string): PermissionItem | undefined => {
    if (!path || !user?.permissions) return undefined
    const cleanPath = path.split('?')[0].replace(/\/$/, '') || '/'

    return user.permissions.find((p) => {
      const pClean = p.menuPath.replace(/\/$/, '') || '/'
      return pClean === cleanPath || (pClean !== '/' && (cleanPath.startsWith(pClean + '/') || cleanPath === pClean))
    })
  }

  // Evaluasi Hak Akses View (Strict RBAC / Default Deny)
  const canView = (path?: string): boolean => {
    if (!path) return true
    if (!user) return false // Pengguna belum terautentikasi tidak diizinkan
    if (isAdmin) return true
    if (!user.permissions || user.permissions.length === 0) return false

    const cleanPath = path.split('?')[0].replace(/\/$/, '') || '/'

    // Halaman profil pengguna selalu dapat diakses oleh user aktif
    if (PUBLIC_DASHBOARD_PATHS.some((p) => cleanPath === p || cleanPath.startsWith(p + '/'))) {
      return true
    }

    const matched = findPermission(cleanPath)

    // Strict RBAC: Hanya izinkan jika eksplisit terdaftar di role dan canView bernilai true
    return matched ? Boolean(matched.canView) : false
  }

  const canCreate = (path?: string): boolean => {
    if (!path) return true
    if (!user) return false
    if (isAdmin) return true
    if (!user?.permissions) return false

    const matched = findPermission(path)
    return matched ? Boolean(matched.canCreate) : false
  }

  const canEdit = (path?: string): boolean => {
    if (!path) return true
    if (!user) return false
    if (isAdmin) return true
    if (!user?.permissions) return false

    const matched = findPermission(path)
    return matched ? Boolean(matched.canEdit) : false
  }

  const canDelete = (path?: string): boolean => {
    if (!path) return true
    if (!user) return false
    if (isAdmin) return true
    if (!user?.permissions) return false

    const matched = findPermission(path)
    return matched ? Boolean(matched.canDelete) : false
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
