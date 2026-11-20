'use client'

import React, { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 350)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!visible) return null

  return (
    <button
      onClick={scrollToTop}
      aria-label="Kembali ke atas"
      className="fixed bottom-6 right-6 z-50 p-3 rounded-2xl bg-[#1E3A8A] text-white hover:bg-[#2563EB] shadow-xl shadow-blue-900/30 border border-white/20 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 animate-fade-in group"
    >
      <ChevronUp className="w-5 h-5 text-amber-300 group-hover:-translate-y-0.5 transition-transform duration-200" />
    </button>
  )
}
