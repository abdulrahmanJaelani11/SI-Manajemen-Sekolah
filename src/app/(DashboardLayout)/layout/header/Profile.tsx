'use client'

import React from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { usePermission } from '@/context/PermissionContext'
import { LogOut, User, Settings, ShieldCheck } from 'lucide-react'

const Profile = () => {
  const { user, logout } = usePermission()

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      await logout()
    }
  }

  const initial = user?.namaLengkap ? user.namaLengkap.charAt(0).toUpperCase() : 'A'

  return (
    <div className='relative group/menu ps-4 shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className='hover:ring-2 hover:ring-primary/40 rounded-full flex items-center gap-2 p-1 cursor-pointer transition'>
            <div className='h-9 w-9 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm shadow-sm'>
              {initial}
            </div>
            <div className='hidden md:flex flex-col items-start text-left'>
              <span className='text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]'>
                {user?.namaLengkap || 'Administrator'}
              </span>
              <span className='text-[10px] font-semibold text-primary truncate max-w-[120px]'>
                {user?.roleName || 'Admin'}
              </span>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          className='w-64 p-3 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'>
          {/* Header Profil */}
          <div className='p-2 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3'>
            <div className='h-11 w-11 rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center font-bold text-base flex-shrink-0'>
              {initial}
            </div>
            <div className='overflow-hidden'>
              <h4 className='text-xs font-bold text-slate-900 dark:text-white truncate'>
                {user?.namaLengkap || 'Administrator'}
              </h4>
              <p className='text-[11px] text-slate-500 truncate'>
                @{user?.username || 'admin'}
              </p>
              <span className='mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'>
                {user?.roleName || 'Super Admin'}
              </span>
            </div>
          </div>

          <div className='py-2 space-y-1'>
            <DropdownMenuItem asChild>
              <Link
                href='/pengaturan/sekolah'
                className='px-3 py-2 flex items-center gap-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition'>
                <Settings className='h-4 w-4 text-slate-400' />
                <span>Pengaturan Sekolah & Tema</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href='/pengaturan/pengguna'
                className='px-3 py-2 flex items-center gap-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition'>
                <ShieldCheck className='h-4 w-4 text-slate-400' />
                <span>Kelola Akun Pengguna</span>
              </Link>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className='my-1' />

          <div className='pt-1'>
            <Button
              variant='outline'
              onClick={handleLogout}
              className='w-full rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 dark:border-red-900/40 dark:hover:bg-red-950/40 flex items-center justify-center gap-1.5'>
              <LogOut className='h-3.5 w-3.5' />
              <span>Keluar Sesi (Logout)</span>
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Profile
