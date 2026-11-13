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

  // Auto transition every 6 seconds
  useEffect(() => {
    if (!slides || slides.length <= 1) return
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [slides])

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }

  // Fallback jika belum ada slide dari CMS
  if (!slides || slides.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#172554] text-white">
        {/* Dekorasi Cahaya Latar */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#3B82F6]/15 blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-[#F59E0B]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Kolom Kiri: Teks */}
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#FCD34D] text-xs sm:text-sm font-medium mb-2 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Pendidikan Unggul Berkelanjutan</span>
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
                Membangun Generasi Cerdas, Berkarakter & Berdaya Saing
              </h1>
              <p className="text-blue-100/90 text-base sm:text-lg leading-relaxed max-w-xl">
                Lembaga pendidikan formal terpadu yang memadukan keunggulan akademik, riset teknologi, dan budi pekerti luhur.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Link
                  href="/portal/profil"
                  className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-semibold px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all inline-flex items-center gap-2 active:scale-95"
                >
                  <span>Pelajari Selengkapnya</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </Link>
                <Link
                  href="#kontak"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-sm px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2 active:scale-95"
                >
                  <span>Hubungi Kami</span>
                </Link>
              </div>
            </div>

            {/* Kolom Kanan: Frame Ilustrasi */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border-2 border-white/15 bg-slate-900/40 shadow-2xl aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] flex items-center justify-center border-t-2 border-t-[#F59E0B]">
                <div className="text-center p-8">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 mb-3 backdrop-blur-md">
                    <GraduationCap className="h-9 w-9" />
                  </div>
                  <p className="text-sm font-bold text-white">Sistem Informasi Sekolah Terpadu</p>
                  <p className="text-xs text-blue-200/80 mt-1">Portal Resmi Akademik & Kesiswaan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const activeSlide = slides[current]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#172554] text-white">
      {/* Dekorasi Cahaya Latar Samar (Academic Trust Glow Effect) */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#3B82F6]/15 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-[#F59E0B]/10 blur-3xl pointer-events-none" />

      {/* Konten Hero 2 Kolom (Split Hero Layout) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ============================================================== */}
          {/* KOLOM KIRI: KONTEN TEKS & CTA SLIDE AKTIF                      */}
          {/* ============================================================== */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div key={`text-${activeSlide.id}`} className="space-y-4 animate-fade-in">
              {/* Badge Kategori Slide */}
              {activeSlide.badge && (
                <div>
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#FCD34D] text-xs sm:text-sm font-medium mb-1 backdrop-blur-sm">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{activeSlide.badge}</span>
                  </span>
                </div>
              )}

              {/* Judul Utama Slide */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                {activeSlide.judul}
              </h1>

              {/* Deskripsi Slide */}
              <p className="text-blue-100/90 text-base sm:text-lg leading-relaxed max-w-xl">
                {activeSlide.deskripsi}
              </p>

              {/* Tombol CTA Slide */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {activeSlide.link1Text && (
                  <a
                    href={activeSlide.link1Url || '#'}
                    className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-semibold px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all inline-flex items-center gap-2 active:scale-95 text-xs sm:text-sm"
                  >
                    <span>{activeSlide.link1Text}</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </a>
                )}
                {activeSlide.link2Text && (
                  <a
                    href={activeSlide.link2Url || '#'}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/25 backdrop-blur-sm px-6 py-3 rounded-xl transition-all inline-flex items-center gap-2 active:scale-95 text-xs sm:text-sm font-semibold"
                  >
                    <span>{activeSlide.link2Text}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* KOLOM KANAN: FRAME GAMBAR CAROUSEL JERNIH TANPA OVERLAY GELAP   */}
          {/* ============================================================== */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full relative rounded-2xl overflow-hidden border-2 border-white/15 bg-slate-900/40 shadow-2xl aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] group border-t-2 border-t-[#F59E0B]">
              {/* Slides Gambar Carousel Terang 100% */}
              {slides.map((s, idx) => (
                <div
                  key={s.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  {s.fotoUrl ? (
                    <img
                      src={s.fotoUrl}
                      alt={s.judul}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#1E3A8A] via-[#172554] to-[#2563EB] flex flex-col items-center justify-center text-white/50 p-6">
                      <GraduationCap className="w-16 h-16 text-amber-400/80 mb-2" />
                      <span className="text-xs text-blue-200/70 font-medium text-center">
                        {s.judul}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Tombol Navigasi Panah Kiri & Kanan di Dalam Frame */}
              {slides.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    aria-label="Previous Slide"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-[#1E3A8A]/75 hover:bg-[#2563EB] text-white border border-white/25 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    aria-label="Next Slide"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-[#1E3A8A]/75 hover:bg-[#2563EB] text-white border border-white/25 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Indikator Dot Carousel di Bagian Bawah Frame */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-[#0F172A]/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                    {slides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        aria-label={`Pindah ke slide ${idx + 1}`}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === current
                            ? 'w-7 bg-[#F59E0B] shadow-sm shadow-amber-500/50'
                            : 'w-2 bg-white/35 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

