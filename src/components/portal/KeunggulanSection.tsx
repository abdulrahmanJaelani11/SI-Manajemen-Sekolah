'use client'

import React from 'react'
import {
  Award,
  BookOpen,
  Building2,
  Trophy,
  Star,
  ShieldCheck,
  HeartHandshake,
  Compass,
  Users,
  Sparkles,
} from 'lucide-react'

interface KeunggulanItem {
  id: number
  judul: string
  deskripsi: string | null
  icon: string
  urutan: number
}

const ICON_MAP: Record<string, React.ElementType> = {
  Award,
  BookOpen,
  Building2,
  Trophy,
  Star,
  ShieldCheck,
  HeartHandshake,
  Compass,
  Users,
  Sparkles,
}

export default function KeunggulanSection({ items }: { items: KeunggulanItem[] }) {
  if (!items || items.length === 0) return null

  return (
    <section className="relative -mt-12 z-30 max-w-7xl mx-auto px-4 sm:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((item) => {
          const IconComp = ICON_MAP[item.icon] || Award

          return (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/5 border border-slate-100 hover:border-[#2563EB]/40 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 transition duration-300"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition duration-300 shadow-sm">
                  <IconComp className="h-6 w-6 stroke-[1.8]" />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-[#2563EB] transition leading-snug">
                  {item.judul}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {item.deskripsi}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-[#F59E0B] transition">
                <span>Pilar Keunggulan #{item.urutan}</span>
                <span className="opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
