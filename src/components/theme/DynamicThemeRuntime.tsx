'use client'

import React, { useEffect } from 'react'

interface ThemeConfig {
  warnaPrimary?: string
  warnaPrimaryDark?: string
  warnaAccent?: string
  warnaSidebarStart?: string
  warnaSidebarEnd?: string
}

export function applyThemeVariables(theme: ThemeConfig) {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  if (theme.warnaPrimary) {
    root.style.setProperty('--primary', theme.warnaPrimary)
    root.style.setProperty('--sidebar-primary', theme.warnaPrimary)
    root.style.setProperty('--color-primary', theme.warnaPrimary)
  }

  if (theme.warnaPrimaryDark) {
    root.style.setProperty('--primary-emphasis', theme.warnaPrimaryDark)
    root.style.setProperty('--color-primaryemphasis', theme.warnaPrimaryDark)
  }

  if (theme.warnaAccent) {
    root.style.setProperty('--theme-accent', theme.warnaAccent)
    root.style.setProperty('--accent', theme.warnaAccent)
  }

  if (theme.warnaSidebarStart) {
    root.style.setProperty('--sidebar-start', theme.warnaSidebarStart)
  }

  if (theme.warnaSidebarEnd) {
    root.style.setProperty('--sidebar-end', theme.warnaSidebarEnd)
  }
}

export default function DynamicThemeRuntime() {
  useEffect(() => {
    // 1. Ambil dari cache localStorage jika ada untuk kecepatan instan
    const cachedTheme = localStorage.getItem('school_theme_config')
    if (cachedTheme) {
      try {
        const parsed = JSON.parse(cachedTheme)
        applyThemeVariables(parsed)
      } catch (e) {
        console.error('Error parsing cached theme:', e)
      }
    }

    // 2. Fetch data terbaru dari database
    const fetchLatestTheme = async () => {
      try {
        const res = await fetch('/api/pengaturan/sekolah')
        const json = await res.json()
        if (json.success && json.data) {
          const config: ThemeConfig = {
            warnaPrimary: json.data.warnaPrimary,
            warnaPrimaryDark: json.data.warnaPrimaryDark,
            warnaAccent: json.data.warnaAccent,
            warnaSidebarStart: json.data.warnaSidebarStart,
            warnaSidebarEnd: json.data.warnaSidebarEnd,
          }
          applyThemeVariables(config)
          localStorage.setItem('school_theme_config', JSON.stringify(config))

          // Sinkronkan cache identitas sekolah & title tab
          if (json.data.namaSekolah) {
            localStorage.setItem(
              'school_profile_cache',
              JSON.stringify({
                namaSekolah: json.data.namaSekolah,
                npsn: json.data.npsn || null,
                logoUrl: json.data.logoUrl || null,
              })
            )
            document.title = `${json.data.namaSekolah} | Sistem Informasi Sekolah`
          }
        }
      } catch (err) {
        console.error('Failed to load school theme from server:', err)
      }
    }

    fetchLatestTheme()

    // 3. Listener kustom jika ada update tema secara live dari Pengaturan Sekolah
    const handleThemeUpdate = (e: CustomEvent<ThemeConfig>) => {
      if (e.detail) {
        applyThemeVariables(e.detail)
        localStorage.setItem('school_theme_config', JSON.stringify(e.detail))
      }
    }

    const handleProfileUpdate = (e: CustomEvent<{ namaSekolah?: string; npsn?: string; logoUrl?: string }>) => {
      if (e.detail?.namaSekolah) {
        document.title = `${e.detail.namaSekolah} | Sistem Informasi Sekolah`
      }
    }

    window.addEventListener('school-theme-updated' as any, handleThemeUpdate as any)
    window.addEventListener('school-profile-updated' as any, handleProfileUpdate as any)

    return () => {
      window.removeEventListener('school-theme-updated' as any, handleThemeUpdate as any)
      window.removeEventListener('school-profile-updated' as any, handleProfileUpdate as any)
    }
  }, [])

  return null
}
