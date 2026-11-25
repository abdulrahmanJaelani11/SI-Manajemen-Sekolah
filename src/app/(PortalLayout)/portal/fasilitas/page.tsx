import React from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import {
  Building2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'

export const metadata = {
  title: 'Sarana & Fasilitas Kampus | Portal Resmi Sekolah',
  description: 'Inventarisasi sarana prasarana modern pendukung kegiatan belajar mengajar.',
}

async function getFasilitas() {
  try {
    return await prisma.fasilitas.findMany({
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return []
  }
}

export default async function PortalFasilitasPage() {
  const fasilitas = await getFasilitas()

  return (
    <div className="py-12 px-4 sm:px-8 max-w-7xl mx-auto space-y-10">
      <div>
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Portal</span>
        </Link>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Sarana & Fasilitas Kampus
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Infrastruktur modern dan fasilitas komprehensif yang menunjang kenyamanan serta prestasi siswa.
        </p>
      </div>

      {fasilitas.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="mt-3 text-base font-bold text-slate-700">Belum ada data fasilitas yang ditambahkan</h3>
          <p className="mt-1 text-xs text-slate-500">Silakan kembali lagi nanti untuk melihat pembaruan inventaris.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {fasilitas.map((f) => (
            <div
              key={f.id}
              className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300"
            >
              <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                {f.fotoUrl ? (
                  <img
                    src={f.fotoUrl}
                    alt={f.nama}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-400">
                    <Building2 className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-md backdrop-blur-md ${
                      f.kondisi === 'Sangat Baik'
                        ? 'bg-emerald-600 text-white'
                        : f.kondisi === 'Baik'
                        ? 'bg-blue-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    <span>{f.kondisi || 'Baik'}</span>
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                  {f.nama}
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {f.deskripsi || 'Fasilitas penunjang aktivitas akademik dan pengembangan bakat.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
