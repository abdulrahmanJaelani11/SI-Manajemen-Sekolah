'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Sparkles,
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

  if (!slides || slides.length === 0) {
    return (
      <div className="relative overflow-hidden bg-slate-950 py-24 px-4 text-white sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A]/80 to-[#2563EB]/60" />
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-semibold text-blue-300 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Pendidikan Unggul Berkelanjutan</span>
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Membangun Generasi Cerdas, Berkarakter & Berdaya Saing
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300">
            Lembaga pendidikan formal terpadu yang memadukan keunggulan akademik, riset teknologi, dan budi pekerti luhur.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/portal/profil"
              className="rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition"
            >
              Pelajari Selengkapnya
            </Link>
            <Link
              href="#kontak"
              className="rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const activeSlide = slides[current]

  return (
    <div className="relative h-[520px] sm:h-[580px] lg:h-[620px] w-full overflow-hidden bg-slate-950">
      {/* Background Image & Overlay */}
      {slides.map((s, idx) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {s.fotoUrl ? (
            <img
              src={s.fotoUrl}
              alt={s.judul}
              className="h-full w-full object-cover scale-105 transform animate-pulse duration-[10000ms]"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950" />
          )}

          {/* Deep Dark & Color Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        </div>
      ))}

      {/* Slide Content */}
      <div className="relative z-20 max-w-7xl mx-auto h-full px-4 sm:px-8 flex flex-col justify-center">
        <div className="max-w-2xl space-y-5 animate-fade-in">
          {activeSlide.badge && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-bold tracking-wide text-blue-300 border border-blue-400/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>{activeSlide.badge}</span>
            </span>
          )}

          <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
            {activeSlide.judul}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed drop-shadow line-clamp-3">
            {activeSlide.deskripsi}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            {activeSlide.link1Text && (
              <a
                href={activeSlide.link1Url || '#'}
                className="flex items-center gap-2 rounded-xl bg-[#F59E0B] px-6 py-3 text-xs sm:text-sm font-bold text-slate-900 shadow-xl shadow-amber-500/30 hover:bg-amber-600 transition active:scale-95"
              >
                <span>{activeSlide.link1Text}</span>
                <ArrowRight className="w-4 h-4 text-slate-900" />
              </a>
            )}
            {activeSlide.link2Text && (
              <a
                href={activeSlide.link2Url || '#'}
                className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition active:scale-95"
              >
                <span>{activeSlide.link2Text}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Navigasi Panah Kiri & Kanan */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-90"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-90"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === current ? 'w-8 bg-[#F59E0B]' : 'w-2.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
