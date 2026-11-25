import React from 'react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import {
  Users,
  User,
  BookOpen,
  ArrowLeft,
  Mail,
  GraduationCap,
} from 'lucide-react'

export const metadata = {
  title: 'Direktori Dewan Guru & Staf | Portal Resmi Sekolah',
  description: 'Mengenal para pendidik dan tenaga kependidikan berdedikasi tinggi.',
}

async function getPegawai() {
  try {
    return await prisma.pegawai.findMany({
      where: { active: true },
      orderBy: { nama: 'asc' },
    })
  } catch {
    return []
  }
}

export default async function PortalGuruPage() {
  const pegawai = await getPegawai()

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
          Direktori Dewan Guru & Staf Pendidik
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Mengenal tim tenaga pendidik profesional dan staf tata usaha yang mengabdikan diri membina generasi bangsa.
        </p>
      </div>

      {pegawai.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <Users className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="mt-3 text-base font-bold text-slate-700">Belum ada data guru/staf yang ditambahkan</h3>
          <p className="mt-1 text-xs text-slate-500">Data dewan guru akan segera diperbarui oleh pengelola sistem.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {pegawai.map((p) => (
            <div
              key={p.id}
              className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col items-center text-center"
            >
              <div className="relative h-28 w-28 rounded-full overflow-hidden bg-slate-100 ring-4 ring-slate-50 group-hover:ring-blue-100 transition shadow-md">
                {p.fotoUrl ? (
                  <img
                    src={p.fotoUrl}
                    alt={p.nama}
                    className="h-full w-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
                    <User className="h-12 w-12" />
                  </div>
                )}
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                {p.nama}
              </h3>

              <span className="mt-1 inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-600 border border-blue-100">
                {p.jabatan || (p.jenisPegawai === 'guru' ? 'Guru Pengajar' : 'Tenaga Kependidikan')}
              </span>

              {p.bidangStudi && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                  <span>{p.bidangStudi}</span>
                </div>
              )}

              {p.nip && (
                <p className="mt-1 text-[11px] font-mono text-slate-400">
                  NIP: {p.nip}
                </p>
              )}

              {p.email && (
                <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate max-w-[180px]">{p.email}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
