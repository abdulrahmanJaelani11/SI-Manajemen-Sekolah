import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import {
  Calendar,
  User,
  ArrowLeft,
  Share2,
  Newspaper,
  ChevronRight,
  Clock,
} from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const berita = await prisma.berita.findUnique({
    where: { slug },
  })

  if (!berita) {
    return {
      title: 'Berita Tidak Ditemukan',
    }
  }

  return {
    title: `${berita.judul} | Portal Resmi Sekolah`,
    description: berita.ringkasan || berita.judul,
  }
}

export default async function PortalBeritaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [berita, recentNews] = await Promise.all([
    prisma.berita.findUnique({
      where: { slug },
    }),
    prisma.berita.findMany({
      where: { published: true, NOT: { slug } },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ])

  if (!berita) {
    notFound()
  }

  return (
    <div className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Breadcrumb / Back Link */}
      <div className="mb-6">
        <Link
          href="/portal/berita"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Berita</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Konten Utama Artikel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-3">
            <span className="inline-block rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-600 border border-blue-200">
              {berita.kategori || 'Pengumuman'}
            </span>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              {berita.judul}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 border-b border-slate-200 pb-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {new Date(berita.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                Penulis: <strong className="text-slate-700">{berita.penulis || 'Admin Sekolah'}</strong>
              </span>
            </div>
          </div>

          {/* Banner Gambar Sampul */}
          {berita.fotoUrl && (
            <div className="relative overflow-hidden rounded-3xl bg-slate-100 shadow-md">
              <img
                src={berita.fotoUrl}
                alt={berita.judul}
                className="w-full max-h-[480px] object-cover"
              />
            </div>
          )}

          {/* Ringkasan Lead Paragraph */}
          {berita.ringkasan && (
            <div className="rounded-2xl bg-slate-100/70 p-5 text-sm font-semibold italic text-slate-700 border-l-4 border-blue-600 leading-relaxed">
              {berita.ringkasan}
            </div>
          )}

          {/* Body Konten */}
          <div
            className="prose max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4 pt-2"
            dangerouslySetInnerHTML={{ __html: berita.deskripsi }}
          />

          {/* Bagian Bawah Artikel */}
          <div className="border-t border-slate-200 pt-6 flex items-center justify-between">
            <Link
              href="/portal/berita"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Lihat Warta Lainnya</span>
            </Link>
          </div>
        </div>

        {/* Sidebar Rekomendasi Berita Lain */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Newspaper className="h-4 w-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Warta Sekolah Lainnya</h3>
            </div>

            <div className="space-y-4">
              {recentNews.length === 0 ? (
                <p className="text-xs text-slate-500">Tidak ada warta lain saat ini.</p>
              ) : (
                recentNews.map((item) => (
                  <Link
                    key={item.id}
                    href={`/portal/berita/${item.slug}`}
                    className="group flex gap-3 items-start hover:bg-slate-50 p-2 rounded-xl transition"
                  >
                    <div className="h-14 w-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                      {item.fotoUrl ? (
                        <img
                          src={item.fotoUrl}
                          alt={item.judul}
                          className="h-full w-full object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-400">
                          <Newspaper className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 leading-snug">
                        {item.judul}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
