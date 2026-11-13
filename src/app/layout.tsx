import React from 'react'
import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './css/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import ServiceWorkerRegister from '@/app/components/service-worker/ServiceWorkerRegister'
import prisma from '@/lib/prisma'

import DynamicThemeRuntime from '@/components/theme/DynamicThemeRuntime'

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

export async function generateMetadata(): Promise<Metadata> {
  try {
    const profil = await prisma.sekolahProfil.findFirst()
    const namaSekolah = profil?.namaSekolah || 'Sistem Informasi Manajemen Sekolah Terpadu'
    return {
      title: `${namaSekolah} | Sistem Informasi Sekolah`,
      description: `Portal tata kelola terpadu kesiswaan, finansial kasir SPP 12 bulan, dan publikasi ${namaSekolah}.`,
    }
  } catch {
    return {
      title: 'Sistem Informasi Manajemen Sekolah Terpadu',
      description: 'Portal tata kelola terpadu kesiswaan, finansial kasir SPP 12 bulan, dan CMS publikasi sekolah.',
    }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let iconUrl = '/favicon.svg'
  try {
    const profil = await prisma.sekolahProfil.findFirst()
    if (profil?.faviconUrl) {
      iconUrl = profil.faviconUrl
    } else if (profil?.logoUrl) {
      iconUrl = profil.logoUrl
    }
  } catch {
    // Fallback to default favicon
  }

  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='icon' href={iconUrl} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1E3A8A" />
      </head>
      <body className={`${dmSans.className}`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange>
          <DynamicThemeRuntime />
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
