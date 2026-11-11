'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Newspaper,
  Calendar,
  User,
  Search,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Tag,
} from 'lucide-react'

interface BeritaItem {
  id: number
  judul: string
  slug: string
  ringkasan: string | null
  deskripsi: string
  fotoUrl: string | null
  kategori: string | null
  penulis: string | null
  createdAt: string
}

const KATEGORI_LIST = ['Semua', 'Pengumuman', 'Akademik', 'Prestasi', 'Kegiatan']

export default function PortalBeritaPage() {
  const [beritaList, setBeritaList] = useState<BeritaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('Semua')

  const fetchBerita = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search.trim()) params.append('search', search.trim())
      if (kategori !== 'Semua') params.append('kategori', kategori)
      params.append('published', 'true')

      const res = await fetch(`/api/cms/berita?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setBeritaList(json.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBerita()
  }, [kategori])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBerita()
  }

  return (
    <div className="py-12 px-4 sm:px-8 max-w-7xl mx-auto space-y-10">
      {/* Header Halaman */}
      <div>
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Portal</span>
        </Link>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Warta & Pengumuman Sekolah
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Kumpulan berita resmi, liputan prestasi siswa, dan surat edaran sekolah.
        </p>
      </div>

      {/* Filter Kategori & Pencarian */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-y border-slate-200 py-4">
        <div className="flex flex-wrap items-center gap-2">
          {KATEGORI_LIST.map((kat) => (
            <button
              key={kat}
              onClick={() => setKategori(kat)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                kategori === kat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {kat}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari artikel berita..."
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs focus:border-blue-500 focus:outline-none shadow-sm"
          />
        </form>
      </div>

      {/* Daftar Grid Berita */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span>Memuat warta sekolah...</span>
          </div>
        </div>
      ) : beritaList.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <Newspaper className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="mt-3 text-base font-bold text-slate-700">Tidak ada berita yang ditemukan</h3>
          <p className="mt-1 text-xs text-slate-500">Coba gunakan kata kunci pencarian lain atau pilih kategori lain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {beritaList.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300"
            >
              <div>
                <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                  {item.fotoUrl ? (
                    <img
                      src={item.fotoUrl}
                      alt={item.judul}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-400">
                      <Newspaper className="h-10 w-10" />
                    </div>
                  )}
                  <span className="absolute top-4 left-4 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white shadow">
                    {item.kategori || 'Pengumuman'}
                  </span>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {item.penulis || 'Admin'}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 leading-snug">
                    <Link href={`/portal/berita/${item.slug}`}>{item.judul}</Link>
                  </h2>

                  <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {item.ringkasan || 'Klik selengkapnya untuk membaca warta lengkap.'}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-0">
                <Link
                  href={`/portal/berita/${item.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 group-hover:text-blue-700 transition"
                >
                  <span>Baca Selengkapnya</span>
                  <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
