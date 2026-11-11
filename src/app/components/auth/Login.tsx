'use client'

import React, { useState } from 'react'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import CardBox from '../shared/CardBox'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, LogIn, Lock, User } from 'lucide-react'

export const Login = () => {
  const router = useRouter()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const json = await res.json()

      if (json.success) {
        // Simpan data user ke localStorage jika perlu
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(json.data.user))
          localStorage.setItem('token', json.data.token)
        }
        router.push('/')
        router.refresh()
      } else {
        setErrorMessage(json.message || 'Username atau kata sandi tidak valid')
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan koneksi server: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className='min-h-screen w-full flex justify-center items-center bg-[#1E3A8A]/5 p-4'>
        <div className='w-full max-w-md'>
          <CardBox>
            <div className='flex justify-center mb-4'>
              <FullLogo />
            </div>
            <p className='text-sm text-muted-foreground text-center mb-6'>
              Masuk ke Sistem Manajemen Informasi & Tata Kelola Sekolah
            </p>

            {errorMessage && (
              <div className='mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-900/40 dark:text-red-300'>
                <AlertCircle className='h-4 w-4 flex-shrink-0' />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <Label htmlFor='username1' className='font-medium text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400'>
                  Username
                </Label>
                <div className='relative mt-1'>
                  <Input
                    id='username1'
                    type='text'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder='Masukkan username'
                    required
                    className='pl-3'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='password1' className='font-medium text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400'>
                  Kata Sandi
                </Label>
                <div className='relative mt-1'>
                  <Input
                    id='password1'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Masukkan kata sandi'
                    required
                    className='pl-3'
                  />
                </div>
              </div>

              <div className='flex flex-wrap gap-4 items-center justify-between my-2 text-xs'>
                <div className='flex items-center gap-2'>
                  <Checkbox id='remember' defaultChecked />
                  <Label htmlFor='remember' className='cursor-pointer text-slate-600 dark:text-slate-400'>
                    Ingat sesi saya
                  </Label>
                </div>
                <span className='text-muted-foreground text-[11px] font-mono'>
                  Default: admin / admin123
                </span>
              </div>

              <Button type='submit' disabled={loading} className='w-full gap-2 mt-2'>
                <LogIn className='h-4 w-4' />
                <span>{loading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
              </Button>
            </form>

            <div className='mt-6 border-t border-slate-100 pt-4 text-center dark:border-slate-800'>
              <Link
                href='/portal'
                className='text-xs font-semibold text-primary hover:underline'
              >
                ← Kembali ke Halaman Portal Publik
              </Link>
            </div>
          </CardBox>
        </div>
      </div>
    </>
  )
}
