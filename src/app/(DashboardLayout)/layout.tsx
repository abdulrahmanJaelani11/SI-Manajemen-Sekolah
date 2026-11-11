'use client'

import Header from './layout/header/Header'
import Sidebar from './layout/sidebar/Sidebar'
import { PermissionProvider } from '@/context/PermissionContext'
import RouteGuard from '@/components/auth/RouteGuard'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <PermissionProvider>
      <div className='flex w-full min-h-screen'>
        <div className='page-wrapper flex w-full'>
          {/* Header/sidebar */}
          <div className='xl:block hidden'>
            <Sidebar />
          </div>
          <div className='body-wrapper w-full bg-slate-100/80'>
            {/* Top Header  */}
            <Header />
            {/* Body Content with RBAC Protection */}
            <div className={`container mx-auto px-6 py-30`}>
              <RouteGuard>{children}</RouteGuard>
            </div>
          </div>
        </div>
      </div>
    </PermissionProvider>
  )
}
