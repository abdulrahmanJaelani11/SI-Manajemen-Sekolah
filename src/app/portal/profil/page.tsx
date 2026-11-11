import React from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import {
  GraduationCap,
  Building2,
  CheckCircle2,
  Compass,
  History,
  Target,
  ArrowLeft,
  Sparkles,
} from 'lucide-react'

async function getProfilData() {
  try {
    const profil = await prisma.sekolahProfil.findFirst()
    return profil || {
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
    }
  } catch {
    return null
  }
}

export default async function PortalProfilPage() {
  const profil = await getProfilData()

  return (
    <div className="py-12 px-4 sm:px-8 max-w-5xl mx-auto space-y-12">
      {/* Tombol Kembali & Breadcrumb */}
      <div>
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Portal</span>
        </Link>
        <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Profil, Sejarah & Visi Misi Lembaga
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Mengenal lebih dekat perjalanan, nilai luhur, dan komitmen kelembagaan {profil?.namaSekolah}.
        </p>
      </div>

      {/* Kartu Identitas Singkat */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Identitas Satuan Pendidikan
            </span>
            <h2 className="text-2xl font-bold text-white">{profil?.namaSekolah}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-blue-100 pt-1">
              <span>NPSN: {profil?.npsn || '-'}</span>
              <span>•</span>
              <span>Bentuk Pendidikan: {profil?.bentukPendidikan || 'Multi-Jenjang'}</span>
              <span>•</span>
              <span>Status: Terakreditasi Unggul</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sejarah & Latar Belakang */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sejarah Pendirian & Kilas Balik</h2>
            <p className="text-xs text-slate-500">Tonggak perjalanan dan dedikasi lembaga bagi dunia pendidikan</p>
          </div>
        </div>

        <div className="text-sm sm:text-base text-slate-600 leading-relaxed space-y-4 pt-2">
          {profil?.sejarah ? (
            <p className="whitespace-pre-line">{profil.sejarah}</p>
          ) : (
            <p>
              Lembaga ini didirikan dengan tekad mulia memberikan akses pendidikan berkualitas tinggi bagi seluruh lapisan masyarakat. Berawal dari fasilitas sederhana, komitmen yang teguh telah mendorong kami berkembang menjadi institusi modern yang menaungi ratusan peserta didik berprestasi.
            </p>
          )}
        </div>
      </section>

      {/* Visi, Misi, & Tujuan */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Visi */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Visi Lembaga</h3>
              <p className="text-xs text-slate-500">Arah strategis masa depan</p>
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-50/50 p-5 border border-emerald-100/60 text-sm font-semibold text-emerald-950 leading-relaxed">
            &ldquo;Menjadi institusi pendidikan berdaya saing global yang berkarakter kuat, berakhlak mulia, dan unggul dalam inovasi sains teknologi.&rdquo;
          </div>
        </div>

        {/* Misi */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Misi Lembaga</h3>
              <p className="text-xs text-slate-500">Langkah operasional pendidikan</p>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-slate-600 space-y-2.5">
            {profil?.visiMisi ? (
              <p className="whitespace-pre-line">{profil.visiMisi}</p>
            ) : (
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Menyelenggarakan proses pembelajaran berbasis teknologi dan nilai integritas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Mengoptimalkan potensi peserta didik di bidang akademik dan non-akademik.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>Membangun tata kelola lembaga yang transparan, akuntabel, dan profesional.</span>
                </li>
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
