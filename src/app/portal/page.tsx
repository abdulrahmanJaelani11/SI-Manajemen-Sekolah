import React from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import HeroSlider from '@/components/portal/HeroSlider'
import KeunggulanSection from '@/components/portal/KeunggulanSection'
import {
  Users,
  GraduationCap,
  Building2,
  Calendar,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Clock,
  Sparkles,
  CheckCircle2,
  BookOpen,
  CalendarDays,
  Newspaper,
  ChevronRight,
} from 'lucide-react'

async function getPortalData() {
  try {
    const [
      profil,
      carousels,
      keunggulan,
      berita,
      fasilitas,
      kegiatan,
      totalSiswa,
      totalPegawai,
      totalKelas,
      totalFasilitas,
    ] = await Promise.all([
      prisma.sekolahProfil.findFirst(),
      prisma.carousel.findMany({
        where: { active: true },
        orderBy: { urutan: 'asc' },
      }),
      prisma.keunggulan.findMany({
        where: { active: true },
        orderBy: { urutan: 'asc' },
      }),
      prisma.berita.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.fasilitas.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.kegiatan.findMany({
        orderBy: { tanggal: 'desc' },
        take: 3,
      }),
      prisma.siswa.count({
        where: { status: 'aktif' },
      }),
      prisma.pegawai.count({
        where: { active: true },
      }),
      prisma.kelas.count({
        where: { active: true },
      }),
      prisma.fasilitas.count(),
    ])

    return {
      profil: profil || {
        namaSekolah: 'Sistem Informasi Manajemen Sekolah Terpadu',
        npsn: '10203040',
        bentukPendidikan: 'Multi-Jenjang',
        sejarah:
          'Lembaga pendidikan formal terpadu yang berdedikasi mencetak generasi unggul, berakhlak mulia, dan siap bersaing di era digital.',
        visiMisi:
          'Visi: Menjadi institusi pendidikan berdaya saing global yang berkarakter kuat.\nMisi:\n1. Menyelenggarakan proses pembelajaran berbasis teknologi dan nilai integritas.\n2. Mengoptimalkan potensi peserta didik di bidang akademik dan non-akademik.\n3. Membangun tata kelola lembaga yang transparan, akuntabel, dan profesional.',
        alamat: 'Jl. Pendidikan Mandiri No. 45, Kompleks Pendidikan',
        telepon: '0812-3456-7890',
        email: 'info@manajemensekolah.sch.id',
        website: 'https://sekolah.example.sch.id',
        logoUrl: null,
      },
      carousels,
      keunggulan,
      berita,
      fasilitas,
      kegiatan,
      stats: {
        totalSiswa,
        totalPegawai,
        totalKelas,
        totalFasilitas,
      },
    }
  } catch (error) {
    console.error('Error fetching portal data:', error)
    return {
      profil: {
        namaSekolah: 'Sistem Informasi Manajemen Sekolah Terpadu',
        npsn: '10203040',
        bentukPendidikan: 'Multi-Jenjang',
        sejarah: 'Membina generasi bangsa yang cerdas, kreatif, dan berakhlak mulia.',
        visiMisi: 'Visi: Unggul dalam prestasi, santun dalam budi pekerti.',
        alamat: 'Jl. Pendidikan Mandiri No. 45',
        telepon: '0812-3456-7890',
        email: 'info@sekolah.sch.id',
        website: '',
        logoUrl: null,
      },
      carousels: [],
      keunggulan: [],
      berita: [],
      fasilitas: [],
      kegiatan: [],
      stats: {
        totalSiswa: 0,
        totalPegawai: 0,
        totalKelas: 0,
        totalFasilitas: 0,
      },
    }
  }
}

export default async function PortalHomePage() {
  const data = await getPortalData()
  const { profil, carousels, keunggulan, berita, fasilitas, kegiatan, stats } = data

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SLIDER SECTION */}
      <HeroSlider slides={carousels} />

      {/* 2. 4 PILAR KEUNGGULAN SECTION */}
      <KeunggulanSection items={keunggulan} />

      {/* 3. SAMBUTAN & PROFIL SINGKAT DENGAN STATISTIK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-8" id="profil">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Kolom Kiri: Narasi Profil & Sambutan */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A]/10 px-3.5 py-1 text-xs font-bold text-[#1E3A8A] border border-[#1E3A8A]/20">
              <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Tentang Lembaga Kami</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Membangun Ekosistem Pendidikan Modern & Berkarakter
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {profil.sejarah ||
                'Kami berkomitmen memberikan pengalaman pembelajaran terbaik dengan memadukan kurikulum nasional, penguatan karakter, serta literasi teknologi digital mutakhir untuk mencetak insan cendekia masa depan.'}
            </p>

            {/* Poin Visi Misi Ringkas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-slate-700">
                  Pembelajaran Berbasis Riset & Praktik
                </span>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-slate-700">
                  Penguatan Budi Pekerti & Nilai Luhur
                </span>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-slate-700">
                  Fasilitas & Laboratorium Berstandar
                </span>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200/60">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-slate-700">
                  Ekstrakurikuler & Pembinaan Bakat
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/portal/profil"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#2563EB] hover:text-[#1E3A8A] group transition"
              >
                <span>Baca Selengkapnya Profil & Visi Misi Lembaga</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition" />
              </Link>
            </div>
          </div>

          {/* Kolom Kanan: 4 Kartu Statistik Metrik */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] p-6 text-white shadow-xl shadow-blue-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                  <GraduationCap className="h-6 w-6 text-amber-300" />
                </div>
                <p className="mt-4 text-3xl font-black">{stats.totalSiswa}</p>
                <p className="mt-1 text-xs font-medium text-blue-100">Peserta Didik Aktif</p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-xl shadow-emerald-500/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                  <Users className="h-6 w-6" />
                </div>
                <p className="mt-4 text-3xl font-black">{stats.totalPegawai}</p>
                <p className="mt-1 text-xs font-medium text-emerald-100">Dewan Guru & Staf</p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-xl shadow-amber-500/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                  <BookOpen className="h-6 w-6" />
                </div>
                <p className="mt-4 text-3xl font-black">{stats.totalKelas}</p>
                <p className="mt-1 text-xs font-medium text-amber-100">Rombel Kelas Belajar</p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 p-6 text-white shadow-xl shadow-purple-500/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                  <Building2 className="h-6 w-6" />
                </div>
                <p className="mt-4 text-3xl font-black">{stats.totalFasilitas}</p>
                <p className="mt-1 text-xs font-medium text-purple-100">Sarana & Prasarana</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3.5. BANNER LAYANAN MANDIRI SANTRI & WALI MURID */}
      <section className="bg-gradient-to-r from-[#1E3A8A] via-[#172554] to-[#1E3A8A] text-white py-14 px-4 sm:px-8 border-y border-blue-900/60">
        <div className="max-w-7xl mx-auto rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-10 backdrop-blur-md relative overflow-hidden shadow-2xl">
          <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3.5">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-400/30">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Layanan Mandiri Wali Murid (Parent & Student Portal)
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Cek Status Iuran SPP 12 Bulan & Cetak Kuitansi Resmi dari Rumah
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Orang tua dan wali murid kini dapat memantau status iuran bulanan peserta didik secara transparan dan mencetak salinan kuitansi sah tanpa antre. Cukup masuk menggunakan Nomor Induk Siswa (NIS) dan tanggal lahir.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Matriks SPP 12 Bulan Real-Time</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Salinan Kuitansi Sah Ber-Barcode</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>Rekening Giro & Konfirmasi WA</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-2.5 justify-center">
              <Link
                href="/portal/login-siswa"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-900 shadow-xl shadow-amber-500/25 hover:bg-amber-600 transition active:scale-95 text-center"
              >
                <GraduationCap className="h-5 w-5 text-slate-900" />
                <span>Masuk Portal Siswa / Wali</span>
              </Link>
              <p className="text-[11px] text-center text-slate-400">
                Gunakan NIS siswa (contoh: 1234524) untuk mulai login
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WARTA & BERITA TERKINI SECTION */}
      <section className="bg-slate-100/70 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                <Newspaper className="h-4 w-4" />
                <span>Kabar Terkini</span>
              </div>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Warta & Pengumuman Sekolah
              </h2>
            </div>
            <Link
              href="/portal/berita"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              <span>Lihat Semua Berita</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {berita.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <p className="text-sm text-slate-500">Belum ada publikasi berita terbaru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {berita.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300"
                >
                  <div>
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
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
                      <span className="absolute top-3 left-3 rounded-full bg-[#2563EB] px-3 py-1 text-[11px] font-bold text-white shadow">
                        {item.kategori || 'Pengumuman'}
                      </span>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#2563EB] transition line-clamp-2 leading-snug">
                        <Link href={`/portal/berita/${item.slug}`}>{item.judul}</Link>
                      </h3>

                      <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {item.ringkasan || 'Klik selengkapnya untuk membaca warta sekolah.'}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-0">
                    <Link
                      href={`/portal/berita/${item.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] group-hover:text-[#1E3A8A] transition"
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
      </section>

      {/* 5. SARANA & FASILITAS UNGGULAN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
              <Building2 className="h-4 w-4" />
              <span>Infrastruktur Kampus</span>
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sarana & Fasilitas Belajar
            </h2>
          </div>
          <Link
            href="/portal/fasilitas"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            <span>Lihat Semua Fasilitas</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {fasilitas.map((f) => (
            <div
              key={f.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                {f.fotoUrl ? (
                  <img
                    src={f.fotoUrl}
                    alt={f.nama}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <Building2 className="h-10 w-10" />
                  </div>
                )}
                <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
                  {f.kondisi || 'Baik'}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-slate-900 text-sm">{f.nama}</h3>
                <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {f.deskripsi || 'Fasilitas penunjang aktivitas belajar mengajar.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. GALERI DOKUMENTASI KEGIATAN */}
      <section className="bg-[#1E3A8A] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <CalendarDays className="h-4 w-4" />
                <span>Dokumentasi Agenda</span>
              </div>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Aktivitas & Kreativitas Siswa
              </h2>
            </div>
            <Link
              href="/portal/kegiatan"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-300 hover:text-amber-200 transition"
            >
              <span>Lihat Semua Kegiatan</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kegiatan.map((k) => (
              <div
                key={k.id}
                className="group relative overflow-hidden rounded-2xl bg-blue-950/80 border border-blue-800/50 shadow-xl"
              >
                <div className="relative h-60 w-full overflow-hidden">
                  {k.fotoUrl ? (
                    <img
                      src={k.fotoUrl}
                      alt={k.judul}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-slate-500">
                      <CalendarDays className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-5 flex flex-col justify-end">
                    {k.tanggal && (
                      <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(k.tanggal).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                    )}
                    <h3 className="mt-1 text-base font-bold text-white line-clamp-2">
                      {k.judul}
                    </h3>
                    <p className="mt-1 text-xs text-slate-300 line-clamp-2">
                      {k.deskripsi}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. LOKASI, KONTAK, DAN CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8" id="kontak">
        <div className="rounded-3xl bg-gradient-to-br from-[#1E3A8A] via-[#1E3A8A] to-[#2563EB] text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="inline-block rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3.5 py-1 text-xs font-bold tracking-wide uppercase">
                Hubungi & Kunjungi Kampus
              </span>
              <h2 className="text-2xl sm:text-4xl font-black leading-tight text-white">
                Mari Menjadi Bagian Dari Generasi Berprestasi Bersama Kami
              </h2>
              <p className="text-sm text-blue-100 max-w-xl">
                Buka pintu masa depan yang gemilang untuk putra-putri Anda. Hubungi bagian tata usaha kami untuk informasi pendaftaran, kurikulum, dan beasiswa.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                  <Phone className="h-4 w-4 text-emerald-400" />
                  <span>{profil.telepon || '0812-3456-7890'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                  <Mail className="h-4 w-4 text-amber-400" />
                  <span>{profil.email || 'info@sekolah.sch.id'}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <Link
                href="/"
                className="w-full text-center rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#1E3A8A] shadow-xl hover:bg-slate-100 transition active:scale-95"
              >
                Akses Dashboard Manajemen
              </Link>
              <Link
                href="/portal/profil"
                className="w-full text-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 transition active:scale-95"
              >
                Kunjungi Profil Sekolah
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
