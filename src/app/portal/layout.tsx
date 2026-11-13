import React from 'react'
import Link from 'next/link'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  LogIn,
  GraduationCap,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import prisma from '@/lib/prisma'

export const metadata = {
  title: 'Portal Resmi Lembaga Pendidikan | Sistem Informasi Sekolah',
  description: 'Portal resmi informasi akademik, warta, fasilitas, kegiatan, dan tata kelola terpadu.',
}

async function getSekolahProfil() {
  try {
    const profil = await prisma.sekolahProfil.findFirst()
    return profil || {
      namaSekolah: 'Sistem Informasi Manajemen Sekolah',
      npsn: '10203040',
      bentukPendidikan: 'Multi-Jenjang',
      alamat: 'Jl. Pendidikan Mandiri No. 45, Kompleks Pendidikan',
      telepon: '0812-3456-7890',
      email: 'info@sekolah.sch.id',
      website: 'https://sekolah.example.sch.id',
      logoUrl: null,
      warnaPrimary: '#5d87ff',
      warnaAccent: '#13deb9',
    }
  } catch {
    return {
      namaSekolah: 'Sistem Informasi Manajemen Sekolah',
      npsn: '10203040',
      bentukPendidikan: 'Multi-Jenjang',
      alamat: 'Jl. Pendidikan Mandiri No. 45, Kompleks Pendidikan',
      telepon: '0812-3456-7890',
      email: 'info@sekolah.sch.id',
      website: 'https://sekolah.example.sch.id',
      logoUrl: null,
      warnaPrimary: '#5d87ff',
      warnaAccent: '#13deb9',
    }
  }
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profil = await getSekolahProfil()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOPBAR INFORMASI KONTAK */}
      <div className="bg-[#1E3A8A] text-blue-100 text-xs py-2 px-4 sm:px-8 border-b border-blue-800/60 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            {profil.telepon && (
              <div className="flex items-center gap-1.5 hover:text-white transition">
                <Phone className="w-3.5 h-3.5 text-blue-300" />
                <span>{profil.telepon}</span>
              </div>
            )}
            {profil.email && (
              <div className="flex items-center gap-1.5 hover:text-white transition">
                <Mail className="w-3.5 h-3.5 text-blue-300" />
                <span>{profil.email}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-blue-200/80">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Senin - Sabtu: 07.00 - 15.30 WIB</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profil.npsn && (
              <span className="text-[11px] font-medium bg-blue-900/60 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-700/50">
                NPSN: {profil.npsn}
              </span>
            )}
            <Link
              href="/portal/login-siswa"
              className="flex items-center gap-1.5 text-blue-200 hover:text-white font-medium transition"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>Portal Siswa & Wali</span>
            </Link>
            <span className="text-blue-400/60">|</span>
            <Link
              href="/"
              className="flex items-center gap-1 text-blue-200 hover:text-white font-medium transition"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-300" />
              <span>Masuk Admin</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. NAVBAR UTAMA STICKY */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/portal" className="flex items-center gap-3.5 group">
            {profil.logoUrl ? (
              <img
                src={profil.logoUrl}
                alt={profil.namaSekolah}
                className="h-12 w-12 rounded-xl object-contain shadow-sm border border-slate-100 p-1 bg-white"
              />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center shadow-md shadow-blue-950/20 group-hover:scale-105 transition">
                <GraduationCap className="h-7 w-7 text-amber-400" />
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight group-hover:text-[#2563EB] transition">
                {profil.namaSekolah}
              </h1>
              <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Portal Resmi & Informasi Lembaga</span>
              </p>
            </div>
          </Link>

          {/* Navigasi Desktop */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-slate-700">
            <Link
              href="/portal"
              className="px-3.5 py-2 rounded-xl hover:text-[#2563EB] hover:bg-slate-50 transition"
            >
              Beranda
            </Link>
            <Link
              href="/portal/profil"
              className="px-3.5 py-2 rounded-xl hover:text-[#2563EB] hover:bg-slate-50 transition"
            >
              Profil & Visi Misi
            </Link>
            <Link
              href="/portal/guru"
              className="px-3.5 py-2 rounded-xl hover:text-[#2563EB] hover:bg-slate-50 transition"
            >
              Dewan Guru
            </Link>
            <Link
              href="/portal/berita"
              className="px-3.5 py-2 rounded-xl hover:text-[#2563EB] hover:bg-slate-50 transition"
            >
              Warta & Berita
            </Link>
            <Link
              href="/portal/fasilitas"
              className="px-3.5 py-2 rounded-xl hover:text-[#2563EB] hover:bg-slate-50 transition"
            >
              Fasilitas
            </Link>
            <Link
              href="/portal/kegiatan"
              className="px-3.5 py-2 rounded-xl hover:text-[#2563EB] hover:bg-slate-50 transition"
            >
              Kegiatan
            </Link>
            <Link
              href="/portal/ppdb"
              className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 border border-amber-200/80 transition"
            >
              PPDB Online
            </Link>
          </nav>

          {/* CTA Masuk Sistem */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/portal/login-siswa"
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#2563EB] hover:bg-blue-100 hover:border-blue-300 transition active:scale-95 shadow-xs"
            >
              <GraduationCap className="w-4 h-4 text-[#2563EB]" />
              <span>Portal Siswa</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue-950/20 hover:bg-[#1E3A8A]/90 hover:shadow-lg transition active:scale-95"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Portal Admin</span>
              <span className="sm:hidden">Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. KONTEN HALAMAN */}
      <main className="flex-1">{children}</main>

      {/* 4. FOOTER PUBLIK RESMI */}
      <footer className="bg-[#1E3A8A] text-blue-100 pt-16 pb-8 border-t border-blue-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-blue-800/50">
            {/* Kolom 1: Profil */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {profil.logoUrl ? (
                  <img
                    src={profil.logoUrl}
                    alt={profil.namaSekolah}
                    className="h-10 w-10 rounded-lg object-contain bg-white p-1"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-[#2563EB] text-white flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-amber-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {profil.namaSekolah}
                  </h3>
                  <span className="text-xs text-amber-400 font-semibold">NPSN: {profil.npsn || '-'}</span>
                </div>
              </div>
              <p className="text-xs text-blue-200/80 leading-relaxed">
                Membina generasi bangsa yang cerdas, kreatif, berakhlak mulia, serta siap beradaptasi dengan perkembangan teknologi masa depan.
              </p>
            </div>

            {/* Kolom 2: Tautan Pintas */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                Navigasi Cepat
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/portal" className="hover:text-amber-400 flex items-center gap-1.5 transition">
                    <ChevronRight className="w-3 h-3 text-blue-300" />
                    <span>Beranda Utama</span>
                  </Link>
                </li>
                <li>
                  <Link href="/portal/profil" className="hover:text-amber-400 flex items-center gap-1.5 transition">
                    <ChevronRight className="w-3 h-3 text-blue-300" />
                    <span>Sejarah & Visi Misi</span>
                  </Link>
                </li>
                <li>
                  <Link href="/portal/guru" className="hover:text-amber-400 flex items-center gap-1.5 transition">
                    <ChevronRight className="w-3 h-3 text-blue-300" />
                    <span>Direktori Pendidik</span>
                  </Link>
                </li>
                <li>
                  <Link href="/portal/berita" className="hover:text-amber-400 flex items-center gap-1.5 transition">
                    <ChevronRight className="w-3 h-3 text-blue-300" />
                    <span>Warta & Pengumuman</span>
                  </Link>
                </li>
                <li>
                  <Link href="/portal/fasilitas" className="hover:text-amber-400 flex items-center gap-1.5 transition">
                    <ChevronRight className="w-3 h-3 text-blue-300" />
                    <span>Sarana Prasarana Kampus</span>
                  </Link>
                </li>
                <li className="pt-1 border-t border-blue-800/50">
                  <Link href="/portal/ppdb" className="text-emerald-300 font-bold hover:text-emerald-200 flex items-center gap-1.5 transition">
                    <ChevronRight className="w-3 h-3 text-emerald-300" />
                    <span>PPDB Online (Daftar &amp; Cek Status)</span>
                  </Link>
                </li>
                <li>
                  <Link href="/portal/login-siswa" className="text-amber-400 font-bold hover:text-amber-300 flex items-center gap-1.5 transition">
                    <ChevronRight className="w-3 h-3 text-amber-400" />
                    <span>Portal Siswa &amp; Wali (Cek SPP)</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom 3: Layanan & Jam Operasional */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                Jam Operasional
              </h4>
              <div className="space-y-2 text-xs text-blue-200/80">
                <div className="flex justify-between border-b border-blue-800/50 pb-1.5">
                  <span>Senin - Kamis</span>
                  <span className="text-white font-medium">07:00 - 15:30 WIB</span>
                </div>
                <div className="flex justify-between border-b border-blue-800/50 pb-1.5">
                  <span>Jum&apos;at</span>
                  <span className="text-white font-medium">07:00 - 11:30 WIB</span>
                </div>
                <div className="flex justify-between border-b border-blue-800/50 pb-1.5">
                  <span>Sabtu</span>
                  <span className="text-white font-medium">07:30 - 14:00 WIB</span>
                </div>
                <div className="flex justify-between text-rose-300">
                  <span>Minggu & Libur Nasional</span>
                  <span className="font-medium">Tutup</span>
                </div>
              </div>
            </div>

            {/* Kolom 4: Kontak Kampus */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                Kontak & Lokasi
              </h4>
              <div className="space-y-2.5 text-xs text-blue-200/80">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{profil.alamat || 'Kompleks Kampus Terpadu'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{profil.telepon || '(021) 1234-5678'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{profil.email || 'info@sekolah.sch.id'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-blue-200/60 gap-4">
            <p>
              &copy; {new Date().getFullYear()} {profil.namaSekolah}. Hak Cipta Dilindungi Undang-Undang.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/portal/login-siswa" className="hover:text-amber-400 transition">
                Portal Siswa & Wali
              </Link>
              <span>•</span>
              <Link href="/" className="hover:text-white transition">
                Masuk Dashboard Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
