'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Sparkles,
  GraduationCap,
} from 'lucide-react'

interface SlideItem {
  id: number
  badge: string | null
  judul: string
  deskripsi: string | null
  fotoUrl: string | null
  link1Text: string | null
  link1Url: string | null
  link2Text: string | null
  link2Url: string | null
}

export default function HeroSlider({ slides }: { slides: SlideItem[] }) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto transition setiap 6 detik (pause saat kursor di atas carousel)
  useEffect(() => {
    if (!slides || slides.length <= 1 || isPaused) return
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [slides, isPaused])

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }

  // Fallback jika belum ada slide aktif dari CMS
  if (!slides || slides.length === 0) {
    return (
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#172554] text-white h-[460px] sm:h-[520px] lg:h-[600px] flex items-center justify-center">
        {/* Dekorasi Cahaya Latar Samar */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#3B82F6]/15 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-[#F59E0B]/10 blur-3xl pointer-events-none" />

        {/* Ikon Latar Belakang Samar */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-24 opacity-15">
          <GraduationCap className="h-44 w-44 text-blue-200" />
        </div>

        {/* Overlay Gradien Bawah Bernuansa Navy */}
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#0F172A]/95 via-[#1E3A8A]/65 to-transparent pointer-events-none" />

        {/* Konten Teks & CTA di Posisi Bottom-Center */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center text-center px-4 sm:px-6 pb-12 sm:pb-14 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#FCD34D] backdrop-blur-sm mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pendidikan Unggul Berkelanjutan</span>
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-snug mb-2 drop-shadow-sm">
            Membangun Generasi Cerdas, Berkarakter &amp; Berdaya Saing
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-blue-100/90 max-w-2xl line-clamp-2 mb-5">
            Lembaga pendidikan formal terpadu yang memadukan keunggulan akademik, riset teknologi, dan budi pekerti luhur.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/portal/profil"
              className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow-lg shadow-amber-500/20 transition-all inline-flex items-center gap-1.5 active:scale-95"
            >
              <span>Pelajari Selengkapnya</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </Link>
            <Link
              href="#kontak"
              className="bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md text-xs sm:text-sm px-5 py-2.5 rounded-lg transition-all inline-flex items-center gap-1.5 active:scale-95 font-semibold"
            >
              <span>Hubungi Kami</span>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden h-[460px] sm:h-[520px] lg:h-[600px] bg-[#0F172A] group"
    >
      {/* Dekorasi Cahaya Latar Samar */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#3B82F6]/15 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-[#F59E0B]/10 blur-3xl pointer-events-none" />

      {/* Slide Item (Gambar Penuh, Overlay Navy, Teks Bottom-Center) */}
      {slides.map((s, idx) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
          aria-hidden={idx !== current}
        >
          {/* Tampilkan gambar slide secara penuh */}
          {s.fotoUrl ? (
            <img
              src={s.fotoUrl}
              alt={s.judul}
              className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-[#1E3A8A] via-[#172554] to-[#2563EB] flex flex-col items-center justify-center text-white/40 pb-28">
              <GraduationCap className="w-20 h-20 text-amber-400/80 mb-2" />
            </div>
          )}

          {/* Overlay Gradien Bawah Bernuansa Navy (BUKAN Hitam Pekat) */}
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#0F172A]/95 via-[#1E3A8A]/65 to-transparent pointer-events-none" />

          {/* Konten Teks & CTA di Posisi Bottom-Center (Diperkecil & Ramping) */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center text-center px-4 sm:px-6 pb-12 sm:pb-14 max-w-3xl mx-auto">
            {/* Badge Kategori */}
            {s.badge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#FCD34D] backdrop-blur-sm mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{s.badge}</span>
              </span>
            )}

            {/* Judul Utama (Heading) */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-snug mb-2 drop-shadow-sm">
              {s.judul}
            </h1>

            {/* Subjudul / Deskripsi */}
            {s.deskripsi && (
              <p className="text-xs sm:text-sm md:text-base text-blue-100/90 max-w-2xl line-clamp-2 mb-5">
                {s.deskripsi}
              </p>
            )}

            {/* Grup Tombol CTA (Horizontal & Ringkas) */}
            {(s.link1Text || s.link2Text) && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {s.link1Text && (
                  <a
                    href={s.link1Url || '#'}
                    tabIndex={idx === current ? 0 : -1}
                    className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow-lg shadow-amber-500/20 transition-all inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <span>{s.link1Text}</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </a>
                )}
                {s.link2Text && (
                  <a
                    href={s.link2Url || '#'}
                    tabIndex={idx === current ? 0 : -1}
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md text-xs sm:text-sm px-5 py-2.5 rounded-lg transition-all inline-flex items-center gap-1.5 active:scale-95 font-semibold"
                  >
                    <span>{s.link2Text}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Tombol Navigasi Panah Kiri & Kanan */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 bg-[#1E3A8A]/70 hover:bg-[#2563EB] text-white border border-white/20 backdrop-blur-md w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 bg-[#1E3A8A]/70 hover:bg-[#2563EB] text-white border border-white/20 backdrop-blur-md w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Indikator Dot Carousel */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                aria-label={`Pindah ke slide ${idx + 1}`}
                className={`transition-all duration-300 ${
                  idx === current
                    ? 'bg-[#F59E0B] w-7 h-2 rounded-full shadow-sm shadow-amber-500/50'
                    : 'bg-white/40 hover:bg-white/70 w-2 h-2 rounded-full'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
