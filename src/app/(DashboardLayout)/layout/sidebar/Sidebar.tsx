'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import SidebarContent from './sidebaritems'
import SimpleBar from 'simplebar-react'
import { Icon } from '@iconify/react'
import FullLogo from '../shared/logo/FullLogo'
import { usePermission } from '@/context/PermissionContext'
import { useInstitution } from '@/context/InstitutionContext'
import { AMSidebar } from 'tailwind-sidebar'
import 'tailwind-sidebar/styles.css'

// Pemetaan ikon Solar untuk setiap grup parent sub-menu
const GROUP_ICONS: Record<string, string> = {
  'Utama': 'solar:widget-2-linear',
  'Menu Utama': 'solar:widget-2-linear',
  'Akademik & Kurikulum': 'solar:book-bookmark-linear',
  'Akademik & Kesiswaan': 'solar:square-academic-cap-linear',
  'Kesiswaan & PPDB': 'solar:users-group-two-rounded-linear',
  'Presensi & Kehadiran': 'solar:calendar-mark-linear',
  'Keuangan & SPP': 'solar:wallet-money-linear',
  'Perpustakaan & Literasi': 'solar:book-2-linear',
  'Sarana & Prasarana': 'solar:buildings-2-linear',
  'CMS & Publikasi': 'solar:gallery-wide-linear',
  'CMS & Publikasi Web': 'solar:gallery-wide-linear',
  'Pengaturan Sistem': 'solar:settings-linear',
}

const normalizePath = (p?: string) => {
  if (!p) return ''
  const clean = p.split('?')[0].split('#')[0]
  return clean === '/' ? '/' : clean.replace(/\/+$/, '')
}

const isUrlActive = (url?: string, currentPath = '') => {
  if (!url) return false
  const cleanUrl = normalizePath(url)
  const cleanCurrent = normalizePath(currentPath)
  if (!cleanUrl) return false
  if (cleanUrl === '/') return cleanCurrent === '/'
  return cleanCurrent === cleanUrl || cleanCurrent.startsWith(cleanUrl + '/')
}

const SidebarLayout = ({ onClose }: { onClose?: () => void }) => {
  const pathname = usePathname()
  const { theme } = useTheme()
  const { canView, user } = usePermission()
  const { hasJurusan } = useInstitution()
  const [activePeriodLabel, setActivePeriodLabel] = useState('2024/2025')
  const [menuSections, setMenuSections] = useState<any[]>(SidebarContent)

  // Inisialisasi awal grup yang terbuka langsung dari rute saat ini
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const section of SidebarContent) {
      if (!section.heading || section.heading === 'Utama' || section.heading === 'Menu Utama') continue
      if (section.children?.some((child: any) => isUrlActive(child.url, pathname))) {
        initial[section.heading] = true
      }
    }
    return initial
  })

  useEffect(() => {
    const fetchActivePeriod = async () => {
      try {
        const res = await fetch('/api/akademik/tahun-ajaran/aktif')
        const json = await res.json()
        if (json.success && json.data?.activePeriod) {
          const ap = json.data.activePeriod
          setActivePeriodLabel(`${ap.nama} • ${ap.semester}`)
        }
      } catch {
        // ignore fallback
      }
    }
    fetchActivePeriod()
    window.addEventListener('tahun-ajaran-updated', fetchActivePeriod)
    return () => window.removeEventListener('tahun-ajaran-updated', fetchActivePeriod)
  }, [])

  // Sinkronisasi navigasi menu dinamis dari database
  useEffect(() => {
    const fetchDynamicMenus = async () => {
      try {
        const res = await fetch('/api/menus/sidebar')
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setMenuSections(json.data)
        }
      } catch (err) {
        console.error('Sidebar dynamic menu fetch error:', err)
      }
    }

    fetchDynamicMenus()
    window.addEventListener('menu-updated', fetchDynamicMenus)
    return () => window.removeEventListener('menu-updated', fetchDynamicMenus)
  }, [])

  // Only allow "light" or "dark" for AMSidebar
  const sidebarMode = theme === 'light' || theme === 'dark' ? theme : undefined

  // Filter menu items berdasarkan izin peran RBAC dan ketersediaan kejuruan (hasJurusan)
  const filteredSections = useMemo(() => {
    return menuSections
      .map((section) => {
        const visibleChildren = (section.children || []).filter((child: any) => {
          if (!child.url) return true
          if (child.url === '/jurusan' && !hasJurusan) return false
          return canView(child.url)
        })
        return {
          ...section,
          children: visibleChildren,
        }
      })
      .filter((section) => section.children && section.children.length > 0)
  }, [menuSections, hasJurusan, canView])

  // Otomatis buka sub-menu yang halaman aktifnya sedang dikunjungi saat pathname berubah
  useEffect(() => {
    if (!pathname) return

    for (const section of filteredSections) {
      if (!section.heading || section.heading === 'Utama' || section.heading === 'Menu Utama') continue
      if (!section.children) continue

      const containsActive = section.children.some((child: any) =>
        isUrlActive(child.url, pathname)
      )

      if (containsActive) {
        const heading = section.heading
        setOpenGroups((prev) => {
          // Cegah pembuatan objek baru jika sudah terbuka agar tidak memicu re-render berlebih
          if (prev[heading]) return prev
          return {
            ...prev,
            [heading]: true,
          }
        })
        break
      }
    }
  }, [pathname, filteredSections])

  const toggleGroup = useCallback((heading: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [heading]: !prev[heading],
    }))
  }, [])

  return (
    <AMSidebar
      collapsible='none'
      animation={true}
      showProfile={false}
      width={'270px'}
      showTrigger={false}
      mode={sidebarMode}
      className='fixed left-0 top-0 border-r border-blue-800/30 bg-[#1E3A8A] z-10 h-screen'>
      {/* Logo Sekolah */}
      <div className='px-5 py-4 flex items-center overflow-hidden border-b border-blue-800/40'>
        <Link href='/dashboard' onClick={() => onClose?.()} className='w-full block hover:opacity-95 transition'>
          <FullLogo variant='sidebar' />
        </Link>
      </div>

      {/* Sidebar items with Submenu Collapsible Architecture */}
      <SimpleBar className='h-[calc(100vh-100px)]'>
        <div className='px-3 py-3 space-y-1.5'>
          {filteredSections.map((section, index) => {
            const isMainMenu = section.heading === 'Utama' || section.heading === 'Menu Utama'

            // Menu Utama (Dashboard) ditampilkan langsung sebagai menu utama teratas
            if (isMainMenu) {
              return (
                <div key={index} className='space-y-1 mb-2'>
                  {section.children.map((child: any) => {
                    const isSelected = isUrlActive(child.url, pathname)
                    return (
                      <Link
                        key={child.id || child.url}
                        href={child.url || '/dashboard'}
                        prefetch={true}
                        onClick={() => onClose?.()}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                          isSelected
                            ? 'bg-[#2563EB] text-white shadow-md shadow-blue-900/40 font-bold border-l-4 border-[#F59E0B]'
                            : 'text-blue-100 hover:bg-blue-800/50 hover:text-white font-medium'
                        }`}>
                        <Icon
                          icon={child.icon || 'solar:widget-2-linear'}
                          height={20}
                          width={20}
                          className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-blue-200'}`}
                        />
                        <span className='whitespace-normal break-words leading-tight flex-1'>{child.name}</span>
                      </Link>
                    )
                  })}
                </div>
              )
            }

            // Grup Modul sebagai Parent Sub-Menu (bisa dibuka/tutup)
            const isOpen = !!openGroups[section.heading]
            const hasActiveChild = (section.children || []).some((child: any) =>
              isUrlActive(child.url, pathname)
            )
            const groupIcon = GROUP_ICONS[section.heading] || 'solar:folder-with-files-linear'

            return (
              <div key={index} className='mb-1'>
                {/* Tombol Parent Sub-Menu */}
                <button
                  type='button'
                  onClick={() => toggleGroup(section.heading)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none group text-left ${
                    hasActiveChild
                      ? 'bg-blue-800/60 text-white shadow-xs'
                      : 'text-blue-100/90 hover:bg-blue-800/40 hover:text-white'
                  }`}
                  aria-expanded={isOpen}>
                  <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                    <span
                      className={`flex items-center justify-center h-7 w-7 rounded-lg transition-colors flex-shrink-0 ${
                        hasActiveChild
                          ? 'bg-amber-400/20 text-amber-300'
                          : 'bg-blue-900/60 text-blue-300 group-hover:text-white group-hover:bg-blue-800/60'
                      }`}>
                      <Icon icon={groupIcon} height={17} width={17} />
                    </span>
                    <span className='whitespace-normal break-words text-[11px] font-bold tracking-tight uppercase leading-snug flex-1'>
                      {section.heading}
                    </span>
                  </div>

                  <div className='flex items-center gap-1.5 flex-shrink-0 ml-1'>
                    {hasActiveChild && (
                      <span className='h-1.5 w-1.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30' />
                    )}
                    <span className='text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-blue-900/60 text-blue-300/80'>
                      {section.children.length}
                    </span>
                    <Icon
                      icon='solar:alt-arrow-down-linear'
                      height={14}
                      width={14}
                      className={`text-blue-300/80 transition-transform duration-200 ease-in-out ${
                        isOpen ? 'rotate-180 text-white' : 'rotate-0'
                      }`}
                    />
                  </div>
                </button>

                {/* Daftar Child / Sub-Menu */}
                {isOpen && (
                  <div className='mt-1 mb-2 ml-4 pl-2.5 border-l-2 border-blue-700/50 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150'>
                    {section.children.map((child: any) => {
                      const isSelected = isUrlActive(child.url, pathname)
                      const childIcon = child.icon || 'solar:menu-dots-square-linear'

                      return (
                        <Link
                          key={child.id || child.url}
                          href={child.url || '/dashboard'}
                          prefetch={true}
                          onClick={() => onClose?.()}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                            isSelected
                              ? 'bg-[#2563EB] text-white font-bold border-l-4 border-[#F59E0B] shadow-xs'
                              : 'text-blue-200/90 hover:text-white hover:bg-blue-800/40 font-medium'
                          }`}>
                          <Icon
                            icon={childIcon}
                            height={16}
                            width={16}
                            className={`flex-shrink-0 ${
                              isSelected ? 'text-amber-300' : 'text-blue-300/70'
                            }`}
                          />
                          <span className='whitespace-normal break-words leading-tight flex-1'>{child.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Kartu Status Peran Pengguna Aktif */}
          <div className='mt-6 mb-6 overflow-hidden'>
            <div className='flex flex-col bg-blue-900/60 rounded-xl p-4 border border-blue-700/40'>
              <div className='flex items-center justify-between'>
                <span className='text-[11px] font-bold uppercase tracking-wider text-amber-400'>
                  Peran Aktif
                </span>
                <span className='inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
              </div>
              <p className='text-sm font-bold text-white dark:text-white mt-1 truncate'>
                {user?.roleName || 'Administrator'}
              </p>
              <p className='text-xs text-blue-200/70 truncate'>
                {user?.namaLengkap || 'Pengguna Sistem'}
              </p>
              <div className='mt-3 pt-2.5 border-t border-blue-700/30 flex items-center justify-between text-[11px] text-blue-300/60'>
                <span>SIM Sekolah v1.0</span>
                <span className='font-mono'>{activePeriodLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </SimpleBar>
    </AMSidebar>
  )
}

export default SidebarLayout
