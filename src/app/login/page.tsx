import React from 'react'
import { Login } from '@/app/components/auth/Login'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Masuk Akun Sistem | Sistem Manajemen Sekolah',
  description: 'Portal masuk administrator, bendahara, guru, dan staf satuan pendidikan.',
}

export default function LoginPage() {
  return <Login />
}
