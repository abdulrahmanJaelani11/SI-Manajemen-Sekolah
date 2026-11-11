import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import SidebarContent from './sidebaritems'
import SimpleBar from 'simplebar-react'
import { Icon } from '@iconify/react'
import FullLogo from '../shared/logo/FullLogo'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/context/PermissionContext'
import {
  AMLogo,
  AMMenu,
  AMMenuItem,
  AMSidebar,
  AMSubmenu,
} from 'tailwind-sidebar'
import 'tailwind-sidebar/styles.css'

interface SidebarItemType {
  heading?: string
  id?: number | string
  name?: string
  title?: string
  icon?: string
  url?: string
  children?: SidebarItemType[]
  disabled?: boolean
  isPro?: boolean
}

const renderSidebarItems = (
  items: SidebarItemType[],
  currentPath: string,
  onClose?: () => void,
  isSubItem: boolean = false
) => {
  return items.map((item, index) => {
    const isSelected = currentPath === item?.url
    const IconComp = item.icon || null

    const iconElement = IconComp ? (
      <Icon icon={IconComp} height={21} width={21} />
    ) : (
      <Icon icon={'ri:checkbox-blank-circle-line'} height={9} width={9} />
    )

    // Heading
    if (item.heading) {
      return (
        <div className='mb-1' key={item.heading}>
          <AMMenu
            subHeading={item.heading}
            ClassName='hide-menu leading-21 text-blue-300/70 dark:text-blue-300/70 font-bold uppercase text-xs'
          />
        </div>
      )
    }

    // Submenu
    if (item.children?.length) {
      return (
        <AMSubmenu
          key={item.id}
          icon={iconElement}
          title={item.name}
          ClassName='mt-0.5 text-blue-100 dark:text-blue-100'>
          {renderSidebarItems(item.children, currentPath, onClose, true)}
        </AMSubmenu>
      )
    }

    // Regular menu item
    const link = item.url?.startsWith('http') ? '#!' : item.url

    const itemClassNames = isSubItem
      ? `mt-0.5 text-blue-100 dark:text-blue-100 !hover:bg-transparent ${
          isSelected ? '!bg-transparent !text-white font-semibold' : ''
        } !px-1.5`
      : `mt-0.5 text-blue-100 dark:text-blue-100 hover:bg-blue-800/50 hover:text-white`

    return (
      <div onClick={onClose} key={index}>
        <AMMenuItem
          key={item.id}
          icon={iconElement}
          isSelected={isSelected}
          link={link || undefined}
          target='_self'
          badge={!!item.isPro}
          badgeColor='bg-lightsecondary'
          badgeTextColor='text-secondary'
          disabled={item.disabled}
          badgeContent={item.isPro ? 'Pro' : undefined}
          component={Link}
          className={`${itemClassNames} ${isSelected ? 'bg-[#2563EB] !text-white border-l-4 border-[#F59E0B] rounded-lg' : ''}`}>
          <span className='truncate flex-1'>{item.title || item.name}</span>
        </AMMenuItem>
      </div>
    )
  })
}

const SidebarLayout = ({ onClose }: { onClose?: () => void }) => {
  const pathname = usePathname()
  const { theme } = useTheme()
  const { canView, user } = usePermission()

  // Only allow "light" or "dark" for AMSidebar
  const sidebarMode = theme === 'light' || theme === 'dark' ? theme : undefined

  // Filter menu items berdasarkan izin peran RBAC
  const filteredSections = SidebarContent.map((section) => {
    const visibleChildren = (section.children || []).filter((child) => {
      if (!child.url) return true
      return canView(child.url)
    })
    return {
      ...section,
      children: visibleChildren,
    }
  }).filter((section) => section.children && section.children.length > 0)

  return (
    <AMSidebar
      collapsible='none'
      animation={true}
      showProfile={false}
      width={'270px'}
      showTrigger={false}
      mode={sidebarMode}
      className='fixed left-0 top-0 border-r border-blue-800/30 bg-[#1E3A8A] z-10 h-screen'>
      {/* Logo */}
      <div className='px-6 flex items-center brand-logo overflow-hidden border-b border-blue-800/40'>
        <AMLogo component={Link} href='/' img=''>
          <div className="dark">
            <FullLogo />
          </div>
        </AMLogo>
      </div>

      {/* Sidebar items */}
      <SimpleBar className='h-[calc(100vh-100px)]'>
        <div className='px-6'>
          {filteredSections.map((section, index) => (
            <div key={index}>
              {renderSidebarItems(
                [
                  ...(section.heading ? [{ heading: section.heading }] : []),
                  ...(section.children || []),
                ],
                pathname,
                onClose
              )}
            </div>
          ))}

          {/* Kartu Status Peran Pengguna Aktif */}
          <div className='mt-8 mb-6 overflow-hidden'>
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
                <span>SI-MAARIF v1.0.0</span>
                <span className='font-mono'>2024/2025</span>
              </div>
            </div>
          </div>
        </div>
      </SimpleBar>
    </AMSidebar>
  )
}

export default SidebarLayout
