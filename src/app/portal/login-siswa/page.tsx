'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  GraduationCap,
  LogIn,
  KeyRound,
  UserCheck,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react'

export default function LoginSiswaPage() {
  const router = useRouter()
  const [nis, setNis] = useState('1234524')
  const [credential, setCredential] = useState('11-12-2016')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/portal/siswa/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nis, credential }),
      })
      const json = await res.json()

      if (json.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('siswa_session', JSON.stringify(json.data.siswa))
          localStorage.setItem('siswa_token', json.data.token)
        }
        router.push('/portal/siswa')
        router.refresh()
      } else {
        setErrorMsg(json.message || 'NIS atau tanggal lahir tidak valid')
      }
    } catch (err: any) {
      setErrorMsg('Gagal terhubung ke server: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-4 py-12 antialiased selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Tombol Kembali ke Beranda */}
        <div>
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#2563EB] hover:text-[#1E3A8A] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Halaman Beranda Portal</span>
          </Link>
        </div>

        {/* Kartu Form Login */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-900/5">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E3A8A] text-white shadow-lg shadow-blue-950/20">
              <GraduationCap className="h-9 w-9 text-amber-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Portal Siswa & Wali Murid
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pantau status iuran SPP 12 bulan, histori kuitansi resmi, dan biodata santri/siswa secara mandiri.
            </p>
          </div>

          {/* Notifikasi Error */}
          {errorMsg && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-red-50 p-3.5 text-xs text-red-600 border border-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Nomor Induk Siswa (NIS / NISN)
              </label>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  required
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="Contoh: 1234524"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium focus:border-blue-600 focus:bg-white focus:outline-none shadow-sm"
                />
                <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Tanggal Lahir / PIN Kredensial
              </label>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder="Format: DD-MM-YYYY (Contoh: 11-12-2016)"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-4 text-sm font-medium focus:border-blue-600 focus:bg-white focus:outline-none shadow-sm"
                />
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Format: <code>DD-MM-YYYY</code> (misal: <code>11-12-2016</code>) atau default PIN <code>123456</code>.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-[#F59E0B] py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/25 hover:bg-amber-600 transition active:scale-95 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4 text-slate-900" />
              <span>{loading ? 'Memverifikasi Data Siswa...' : 'Masuk ke Portal Siswa'}</span>
            </button>
          </form>

          {/* Panduan Akun Bantuan */}
          <div className="mt-6 rounded-2xl bg-blue-50/60 p-4 border border-blue-100 flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-900 leading-relaxed">
              <strong>Info Akses Wali Murid:</strong> Pastikan Anda menggunakan NIS yang terdaftar pada buku rapor atau kartu pelajar siswa. Hubungi bagian tata usaha jika memerlukan verifikasi data.
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-slate-400">
          <p>
            Anda pengurus atau pengajar?{' '}
            <Link href="/" className="font-bold text-blue-600 hover:underline">
              Masuk sebagai Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
