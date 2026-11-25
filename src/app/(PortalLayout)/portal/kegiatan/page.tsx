import React from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import {
  CalendarDays,
  Calendar,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

export const metadata = {
  title: 'Galeri Kegiatan & Agenda Siswa | Portal Resmi Sekolah',
  description: 'Dokumentasi ragam agenda seremonial, ekstrakurikuler, dan pentas kreasi santri/siswa.',
}

async function getKegiatan() {
  try {
    return await prisma.kegiatan.findMany({
      orderBy: { tanggal: 'desc' },
    })
  } catch {
    return []
  }
}

export default async function PortalKegiatanPage() {
  const kegiatan = await getKegiatan()

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
          Galeri Kegiatan & Agenda Sekolah
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Dokumentasi jejak langkah, keseruan, dan prestasi siswa dalam berbagai aktivitas akademik dan non-akademik.
        </p>
      </div>

      {kegiatan.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <CalendarDays className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="mt-3 text-base font-bold text-slate-700">Belum ada agenda kegiatan yang didokumentasikan</h3>
          <p className="mt-1 text-xs text-slate-500">Nantikan informasi keseruan acara dan agenda berikutnya.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {kegiatan.map((k) => (
            <div
              key={k.id}
              className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                  {k.fotoUrl ? (
                    <img
                      src={k.fotoUrl}
                      alt={k.judul}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-400">
                      <CalendarDays className="h-12 w-12" />
                    </div>
                  )}

                  {k.tanggal && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                      <Calendar className="h-3.5 w-3.5 text-blue-400" />
                      <span>
                        {new Date(k.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                    {k.judul}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {k.deskripsi || 'Dokumentasi kegiatan resmi lembaga.'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
