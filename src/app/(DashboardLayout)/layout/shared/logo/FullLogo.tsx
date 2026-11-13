'use client'

import React, { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'

interface SchoolBrand {
  namaSekolah: string
  npsn?: string | null
  logoUrl?: string | null
}

interface FullLogoProps {
  variant?: 'sidebar' | 'default'
}

const DEFAULT_BRAND: SchoolBrand = {
  namaSekolah: 'Sistem Sekolah',
  npsn: null,
  logoUrl: null,
}

const FullLogo = ({ variant = 'default' }: FullLogoProps) => {
  const [brand, setBrand] = useState<SchoolBrand>(DEFAULT_BRAND)

  useEffect(() => {
    // 1. Muat instan dari localStorage cache agar tidak berkedip
    try {
      const cached = localStorage.getItem('school_profile_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.namaSekolah) {
          setBrand({
            namaSekolah: parsed.namaSekolah,
            npsn: parsed.npsn || null,
            logoUrl: parsed.logoUrl || null,
          })
        }
      }
    } catch {
      // Abaikan error parse cache
    }

    // 2. Sinkronkan data terbaru dari server
    const fetchBrand = async () => {
      try {
        const res = await fetch('/api/pengaturan/sekolah')
        const json = await res.json()
        if (json.success && json.data) {
          const freshBrand: SchoolBrand = {
            namaSekolah: json.data.namaSekolah || DEFAULT_BRAND.namaSekolah,
            npsn: json.data.npsn || null,
            logoUrl: json.data.logoUrl || null,
          }
          setBrand(freshBrand)
          localStorage.setItem('school_profile_cache', JSON.stringify(freshBrand))
        }
      } catch (err) {
        console.error('Failed to load school brand for logo:', err)
      }
    }

    fetchBrand()

    // 3. Listener live update saat admin menyimpan pengaturan sekolah
    const handleProfileUpdate = (e: CustomEvent<SchoolBrand>) => {
      if (e.detail) {
        const updated: SchoolBrand = {
          namaSekolah: e.detail.namaSekolah || DEFAULT_BRAND.namaSekolah,
          npsn: e.detail.npsn || null,
          logoUrl: e.detail.logoUrl || null,
        }
        setBrand(updated)
        localStorage.setItem('school_profile_cache', JSON.stringify(updated))
      }
    }

    window.addEventListener('school-profile-updated' as any, handleProfileUpdate as any)
    return () => {
      window.removeEventListener('school-profile-updated' as any, handleProfileUpdate as any)
    }
  }, [])

  const isSidebar = variant === 'sidebar'

  return (
    <div className="flex items-center gap-3 min-w-0 max-w-full">
      {/* Logo Sekolah */}
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-xs ${
          isSidebar
            ? 'bg-white p-1 border border-white/20'
            : 'bg-white p-1 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'
        }`}
      >
        {brand.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt={brand.namaSekolah}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#1E3A8A] text-white">
            <GraduationCap className="h-5 w-5 text-amber-400" />
          </div>
        )}
      </div>

      {/* Nama Sekolah & Subtitle */}
      <div className="min-w-0 flex-1 text-left">
        <span
          className={`block text-sm font-extrabold tracking-tight leading-tight truncate ${
            isSidebar ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}
          title={brand.namaSekolah}
        >
          {brand.namaSekolah}
        </span>
        <span
          className={`block text-[10px] font-medium tracking-wide truncate mt-0.5 ${
            isSidebar
              ? 'text-blue-200/80'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {brand.npsn ? `NPSN: ${brand.npsn}` : 'Panel Manajemen Sekolah'}
        </span>
      </div>
    </div>
  )
}

export default FullLogo
