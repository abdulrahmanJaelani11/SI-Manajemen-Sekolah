'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Upload,
  FileText,
  Printer,
  GraduationCap,
  Calendar,
  Sparkles,
  Users,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'

const STATUS_BADGE: Record<string, { label: string; style: string; desc: string }> = {
  menunggu: {
    label: 'MENUNGGU VERIFIKASI',
    style: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Berkas pendaftaran Anda telah diterima dan sedang dalam antrean pemeriksaan panitia PPDB.',
  },
  verifikasi: {
    label: 'DALAM PROSES SELEKSI',
    style: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Berkas Anda telah terverifikasi dan sedang dalam tahap seleksi panitia.',
  },
  diterima: {
    label: 'LULUS / DITERIMA',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    desc: 'Selamat! Anda dinyatakan DITERIMA sebagai calon peserta didik baru. Silakan ikuti instruksi daftar ulang dari panitia.',
  },
  cadangan: {
    label: 'CADANGAN',
    style: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Anda berada pada daftar cadangan. Panitia akan menghubungi apabila kuota terpenuhi/tersedia.',
  },
  ditolak: {
    label: 'TIDAK LULUS / DITOLAK',
    style: 'bg-rose-50 text-rose-700 border-rose-200',
    desc: 'Mohon maaf, pendaftaran Anda belum dapat diterima pada gelombang ini.',
  },
}

function UploadField({
  label,
  hint,
  value,
  uploading,
  onUpload,
}: {
  label: string
  hint: string
  value: string
  uploading: boolean
  onUpload: (file: File) => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-800">{label}</span>
        {value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Terunggah</span>
          </a>
        ) : (
          <span className="text-[11px] text-slate-400">Opsional</span>
        )}
      </div>
      <p className="text-[11px] text-slate-500">{hint}</p>
      <label className="mt-1 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition">
        <Upload className="h-3.5 w-3.5 text-blue-600" />
        <span>{uploading ? 'Mengunggah...' : value ? 'Ganti Berkas' : 'Pilih Berkas (JPG/PNG/PDF)'}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(file)
          }}
        />
      </label>
    </div>
  )
}

export default function PortalPpdbPage() {
  const [activeTab, setActiveTab] = useState<'daftar' | 'cek'>('daftar')
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [gelombangList, setGelombangList] = useState<any[]>([])
  const [jenjangList, setJenjangList] = useState<any[]>([])
  const [jurusanList, setJurusanList] = useState<any[]>([])
  const [profil, setProfil] = useState<any>(null)

  // Form Pendaftaran
  const [form, setForm] = useState({
    gelombangId: '',
    jenjangId: '',
    jurusanId: '',
    jalurPendaftaran: 'Reguler',
    nama: '',
    jenisKelamin: 'L',
    nisn: '',
    nik: '',
    tempatLahir: '',
    tanggalLahir: '',
    alamat: '',
    asalSekolah: '',
    nilaiRataRapor: '',
    noHpSiswa: '',
    emailSiswa: '',
    namaWali: '',
    telpWali: '',
    pekerjaanWali: '',
    hubunganWali: 'Orang Tua',
    fotoUrl: '',
    berkasKkUrl: '',
    berkasIjazahUrl: '',
  })
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<any>(null)

  // Form Cek Status Seleksi
  const [cekNo, setCekNo] = useState('')
  const [cekTglLahir, setCekTglLahir] = useState('')
  const [checking, setChecking] = useState(false)
  const [cekError, setCekError] = useState<string | null>(null)
  const [cekResult, setCekResult] = useState<any>(null)

  const loadInfo = async () => {
    setLoadingInfo(true)
    try {
      const res = await fetch('/api/portal/ppdb')
      const json = await res.json()
      if (json.success && json.data) {
        const waves = json.data.gelombangList || []
        const jenjangs = json.data.jenjangList || []
        setGelombangList(waves)
        setJenjangList(jenjangs)
        setJurusanList(json.data.jurusanList || [])
        setProfil(json.data.profil)

        const openWave = waves.find((w: any) => w.isOpenToday) || waves[0]
        setForm((prev) => ({
          ...prev,
          gelombangId: prev.gelombangId || (openWave ? String(openWave.id) : ''),
          jenjangId: prev.jenjangId || (jenjangs[0] ? String(jenjangs[0].id) : ''),
        }))
      }
    } catch (err) {
      console.error('Gagal memuat PPDB info:', err)
    } finally {
      setLoadingInfo(false)
    }
  }

  useEffect(() => {
    loadInfo()
  }, [])

  const selectedWave = useMemo(
    () => gelombangList.find((g) => String(g.id) === String(form.gelombangId)) || null,
    [gelombangList, form.gelombangId]
  )

  const filteredJurusan = useMemo(
    () => jurusanList.filter((j) => String(j.jenjangId) === String(form.jenjangId)),
    [jurusanList, form.jenjangId]
  )

  const handleUploadFile = async (
    field: 'fotoUrl' | 'berkasKkUrl' | 'berkasIjazahUrl',
    file: File
  ) => {
    setUploadingField(field)
    setFormError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/portal/ppdb/upload', {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      if (json.success && json.data?.url) {
        setForm((prev) => ({ ...prev, [field]: json.data.url }))
      } else {
        setFormError(json.message || 'Gagal mengunggah berkas')
      }
    } catch (err: any) {
      setFormError('Gagal mengunggah berkas: ' + err.message)
    } finally {
      setUploadingField(null)
    }
  }

  const handleSubmitPpdb = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/portal/ppdb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setReceiptData(json.data)
        loadInfo()
      } else {
        setFormError(json.message || 'Gagal mengirim formulir pendaftaran.')
      }
    } catch (err: any) {
      setFormError('Kesalahan jaringan: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCekStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    setCekError(null)
    setCekResult(null)
    setChecking(true)
    try {
      const res = await fetch('/api/portal/ppdb/cek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noPendaftaran: cekNo, tanggalLahir: cekTglLahir }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        setCekResult(json.data)
      } else {
        setCekError(json.message || 'Data pendaftaran tidak ditemukan.')
      }
    } catch (err: any) {
      setCekError('Terjadi kesalahan koneksi: ' + err.message)
    } finally {
      setChecking(false)
    }
  }

  const renderPrintableReceipt = (data: any) => {
    const statusInfo = STATUS_BADGE[data.statusSeleksi] || STATUS_BADGE.menunggu
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Bukti Pendaftaran PPDB Online</span>
            </span>
            <h2 className="mt-2 text-2xl font-black text-slate-900">
              {profil?.namaSekolah || 'Sekolah Terpadu'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {data.gelombang?.nama} ({data.gelombang?.tahunAjaran})
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Nomor Pendaftaran
            </p>
            <p className="text-xl font-black font-mono text-[#1E3A8A]">
              {data.noPendaftaran}
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 print:hidden transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak Bukti Daftar</span>
            </button>
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${statusInfo.style}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black tracking-wide">STATUS: {statusInfo.label}</span>
            <span className="text-xs font-semibold">
              Tanggal Daftar: {new Date(data.tanggalDaftar).toLocaleDateString('id-ID')}
            </span>
          </div>
          <p className="text-xs mt-1.5 opacity-90">{statusInfo.desc}</p>
          {data.catatanPanitia && (
            <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-xs font-semibold">
              Catatan Panitia: {data.catatanPanitia}
            </p>
          )}
        </div>

        {data.siswa && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-extrabold text-emerald-800">
                Terdaftar Sebagai Peserta Didik Aktif
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                NIS: <strong className="font-mono">{data.siswa.nis}</strong>
                {data.siswa.kelas ? ` • Kelas: ${data.siswa.kelas.namaKelas}` : ''}
              </p>
            </div>
            <a
              href="/portal/login-siswa"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 print:hidden"
            >
              <GraduationCap className="h-4 w-4" />
              <span>Masuk Portal Siswa</span>
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-2xl bg-slate-50 p-4 space-y-2 border border-slate-100">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
              Data Calon Siswa
            </h3>
            <p><span className="text-slate-500">Nama Lengkap:</span> <strong>{data.nama}</strong></p>
            <p>
              <span className="text-slate-500">TTL:</span>{' '}
              {data.tempatLahir}, {new Date(data.tanggalLahir).toLocaleDateString('id-ID')}
            </p>
            <p>
              <span className="text-slate-500">Jenis Kelamin:</span>{' '}
              {data.jenisKelamin === 'P' ? 'Perempuan' : 'Laki-laki'}
            </p>
            <p><span className="text-slate-500">NISN:</span> {data.nisn || '-'}</p>
            <p><span className="text-slate-500">Asal Sekolah:</span> {data.asalSekolah}</p>
            <p><span className="text-slate-500">Alamat:</span> {data.alamat}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 space-y-2 border border-slate-100">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
              Pilihan Program &amp; Wali
            </h3>
            <p>
              <span className="text-slate-500">Jenjang Tujuan:</span>{' '}
              <strong>{data.jenjang?.nama}</strong>
            </p>
            <p>
              <span className="text-slate-500">Jurusan / Peminatan:</span>{' '}
              {data.jurusan ? `${data.jurusan.kodeJurusan} - ${data.jurusan.namaJurusan}` : '-'}
            </p>
            <p><span className="text-slate-500">Jalur Masuk:</span> {data.jalurPendaftaran}</p>
            <p>
              <span className="text-slate-500">Nama Wali:</span>{' '}
              <strong>{data.namaWali}</strong> ({data.hubunganWali})
            </p>
            <p><span className="text-slate-500">Kontak Wali:</span> {data.telpWali}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Banner PPDB */}
      <section className="bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-[#2563EB] text-white py-12 px-4 sm:px-8 print:hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-amber-300 border border-white/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Penerimaan Peserta Didik Baru Online</span>
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">
              PPDB Online {profil?.namaSekolah || 'Sekolah Terpadu'}
            </h1>
            <p className="mt-2 text-sm text-blue-100 max-w-2xl">
              Daftarkan putra-putri Anda secara mandiri dari rumah, unggah berkas persyaratan, dan pantau hasil seleksi secara transparan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/20">
            <button
              type="button"
              onClick={() => setActiveTab('daftar')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === 'daftar'
                  ? 'bg-white text-[#1E3A8A] shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Formulir Pendaftaran</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cek')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === 'cek'
                  ? 'bg-white text-[#1E3A8A] shadow-sm'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Cek Status Seleksi</span>
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-8 space-y-6">
        {/* TAB 1: FORMULIR PENDAFTARAN */}
        {activeTab === 'daftar' && (
          <>
            {receiptData ? (
              <div className="space-y-4">
                {renderPrintableReceipt(receiptData)}
                <div className="flex justify-center print:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptData(null)
                      setForm((prev) => ({
                        ...prev,
                        nama: '',
                        nisn: '',
                        nik: '',
                        tempatLahir: '',
                        tanggalLahir: '',
                        alamat: '',
                        asalSekolah: '',
                        nilaiRataRapor: '',
                        noHpSiswa: '',
                        emailSiswa: '',
                        namaWali: '',
                        telpWali: '',
                        pekerjaanWali: '',
                        fotoUrl: '',
                        berkasKkUrl: '',
                        berkasIjazahUrl: '',
                      }))
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Daftarkan Calon Siswa Lainnya
                  </button>
                </div>
              </div>
            ) : loadingInfo ? (
              <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-sm font-semibold text-slate-500">
                Memuat informasi gelombang PPDB...
              </div>
            ) : gelombangList.length === 0 ? (
              <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center space-y-3">
                <Calendar className="mx-auto h-12 w-12 text-slate-300" />
                <h2 className="text-lg font-extrabold text-slate-900">
                  Belum Ada Gelombang PPDB Aktif
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Saat ini pendaftaran PPDB belum dibuka oleh panitia sekolah. Silakan periksa kembali nanti atau gunakan menu Cek Status Seleksi jika sudah mendaftar sebelumnya.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Sidebar Info Gelombang Aktif */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                    <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>Gelombang Dibuka</span>
                    </h2>

                    {selectedWave ? (
                      <div className="space-y-3 text-xs">
                        <div className="rounded-2xl bg-blue-50 border border-blue-200/70 p-3.5 space-y-1">
                          <p className="font-extrabold text-[#1E3A8A]">{selectedWave.nama}</p>
                          <p className="text-[11px] font-semibold text-blue-700">
                            Tahun Ajaran {selectedWave.tahunAjaran}
                          </p>
                          <p className="text-[11px] text-slate-600 pt-1">
                            Periode:{' '}
                            {new Date(selectedWave.tanggalMulai).toLocaleDateString('id-ID')} s.d.{' '}
                            {new Date(selectedWave.tanggalSelesai).toLocaleDateString('id-ID')}
                          </p>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-100">
                          <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>Sisa Kuota</span>
                          </span>
                          <span className="font-black text-emerald-700">
                            {selectedWave.sisaKuota} / {selectedWave.kuotaTotal} Kursi
                          </span>
                        </div>

                        {selectedWave.syaratText && (
                          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 space-y-1.5">
                            <p className="font-bold text-slate-800 flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-amber-600" />
                              <span>Persyaratan Berkas</span>
                            </p>
                            <p className="whitespace-pre-line text-[11px] text-slate-600 leading-relaxed">
                              {selectedWave.syaratText}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Form Pendaftaran Utama */}
                <form
                  onSubmit={handleSubmitPpdb}
                  className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Formulir Pendaftaran Calon Peserta Didik
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Kolom bertanda bintang (*) wajib diisi dengan data sesuai dokumen resmi (KK/Akta).
                    </p>
                  </div>

                  {formError && (
                    <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Bagian 1: Pilihan Program */}
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-700">
                      1. Pilihan Gelombang, Jenjang &amp; Jalur
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Gelombang Pendaftaran *
                        </label>
                        <SearchableSelect
                          value={form.gelombangId}
                          onChange={(val) => setForm({ ...form, gelombangId: val })}
                          options={gelombangList.map((g) => ({
                            value: String(g.id),
                            label: `${g.nama} (${g.tahunAjaran})`,
                            sublabel: `Sisa kuota: ${g.sisaKuota}`,
                          }))}
                          placeholder="Pilih gelombang..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Jalur Pendaftaran *
                        </label>
                        <SearchableSelect
                          value={form.jalurPendaftaran}
                          onChange={(val) => setForm({ ...form, jalurPendaftaran: val })}
                          options={[
                            { value: 'Reguler', label: 'Jalur Reguler / Umum' },
                            { value: 'Prestasi', label: 'Jalur Prestasi Akademik/Non-Akademik' },
                            { value: 'Afirmasi', label: 'Jalur Afirmasi / Beasiswa' },
                            { value: 'Zonasi', label: 'Jalur Zonasi / Domisili' },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Jenjang Tujuan *
                        </label>
                        <SearchableSelect
                          value={form.jenjangId}
                          onChange={(val) =>
                            setForm({ ...form, jenjangId: val, jurusanId: '' })
                          }
                          options={jenjangList.map((j) => ({
                            value: String(j.id),
                            label: `${j.kode} - ${j.nama}`,
                          }))}
                          placeholder="Pilih jenjang..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Jurusan / Peminatan (Bila Ada)
                        </label>
                        <SearchableSelect
                          value={form.jurusanId}
                          onChange={(val) => setForm({ ...form, jurusanId: val })}
                          allowClear
                          disabled={filteredJurusan.length === 0}
                          options={filteredJurusan.map((j) => ({
                            value: String(j.id),
                            label: `${j.kodeJurusan} - ${j.namaJurusan}`,
                          }))}
                          placeholder={
                            filteredJurusan.length === 0
                              ? 'Tidak ada peminatan pada jenjang ini'
                              : 'Pilih jurusan...'
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 2: Biodata Calon Siswa */}
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-700">
                      2. Biodata Calon Siswa &amp; Asal Sekolah
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Lengkap Calon Siswa *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.nama}
                          onChange={(e) => setForm({ ...form, nama: e.target.value })}
                          placeholder="Contoh: Ahmad Fauzan"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Jenis Kelamin *
                        </label>
                        <SearchableSelect
                          value={form.jenisKelamin}
                          onChange={(val) => setForm({ ...form, jenisKelamin: val })}
                          options={[
                            { value: 'L', label: 'Laki-laki' },
                            { value: 'P', label: 'Perempuan' },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          NISN (Bila Ada)
                        </label>
                        <input
                          type="text"
                          value={form.nisn}
                          onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                          placeholder="10 digit NISN"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tempat Lahir *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.tempatLahir}
                          onChange={(e) => setForm({ ...form, tempatLahir: e.target.value })}
                          placeholder="Kota / Kabupaten"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tanggal Lahir *
                        </label>
                        <input
                          type="date"
                          required
                          value={form.tanggalLahir}
                          onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })}
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Asal Sekolah Sebelumnya *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.asalSekolah}
                          onChange={(e) => setForm({ ...form, asalSekolah: e.target.value })}
                          placeholder="Contoh: TK Harapan / SDN 01 / SMPN 2"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Rata-rata Nilai Rapor (Opsional)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={form.nilaiRataRapor}
                          onChange={(e) => setForm({ ...form, nilaiRataRapor: e.target.value })}
                          placeholder="Contoh: 86.5"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Alamat Lengkap Domisili *
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={form.alamat}
                          onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                          placeholder="Jalan, RT/RW, Desa/Kelurahan, Kecamatan, Kota"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 3: Data Wali */}
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-700">
                      3. Data Orang Tua / Wali &amp; Kontak
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Orang Tua / Wali *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.namaWali}
                          onChange={(e) => setForm({ ...form, namaWali: e.target.value })}
                          placeholder="Nama Ayah / Ibu / Wali"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nomor WhatsApp / HP Wali *
                        </label>
                        <input
                          type="text"
                          required
                          value={form.telpWali}
                          onChange={(e) => setForm({ ...form, telpWali: e.target.value })}
                          placeholder="08xxxxxxxxxx"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Hubungan Wali
                        </label>
                        <SearchableSelect
                          value={form.hubunganWali}
                          onChange={(val) => setForm({ ...form, hubunganWali: val })}
                          options={[
                            { value: 'Orang Tua', label: 'Orang Tua Kandung' },
                            { value: 'Wali', label: 'Wali / Kerabat' },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Pekerjaan Orang Tua / Wali
                        </label>
                        <input
                          type="text"
                          value={form.pekerjaanWali}
                          onChange={(e) => setForm({ ...form, pekerjaanWali: e.target.value })}
                          placeholder="Wiraswasta / Karyawan / PNS / dll"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 4: Unggah Berkas */}
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-700">
                      4. Unggah Berkas Persyaratan (Maks. 3 MB/File)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <UploadField
                        label="Pas Foto Calon Siswa"
                        hint="Foto berwarna formal (JPG/PNG)"
                        value={form.fotoUrl}
                        uploading={uploadingField === 'fotoUrl'}
                        onUpload={(file) => handleUploadFile('fotoUrl', file)}
                      />
                      <UploadField
                        label="Scan / Foto Kartu Keluarga"
                        hint="Format JPG, PNG, atau PDF"
                        value={form.berkasKkUrl}
                        uploading={uploadingField === 'berkasKkUrl'}
                        onUpload={(file) => handleUploadFile('berkasKkUrl', file)}
                      />
                      <UploadField
                        label="Ijazah / SKL / Rapor"
                        hint="Dokumen kelulusan / nilai terakhir"
                        value={form.berkasIjazahUrl}
                        uploading={uploadingField === 'berkasIjazahUrl'}
                        onUpload={(file) => handleUploadFile('berkasIjazahUrl', file)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>Data dikirim langsung ke panitia PPDB sekolah.</span>
                    </p>
                    <button
                      type="submit"
                      disabled={submitting || uploadingField !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E3A8A] px-6 py-3 text-xs font-extrabold text-white shadow-md hover:bg-[#1D4ED8] disabled:opacity-50 transition"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>{submitting ? 'Mengirim Pendaftaran...' : 'Kirim Pendaftaran PPDB'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* TAB 2: CEK STATUS SELEKSI */}
        {activeTab === 'cek' && (
          <div className="space-y-6">
            <form
              onSubmit={handleCekStatus}
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-5 print:hidden"
            >
              <div className="text-center">
                <Search className="mx-auto h-10 w-10 text-blue-600 mb-2" />
                <h2 className="text-xl font-extrabold text-slate-900">
                  Cek Status Kelulusan &amp; Verifikasi PPDB
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan Nomor Pendaftaran dan Tanggal Lahir calon peserta didik sesuai saat mendaftar.
                </p>
              </div>

              {cekError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{cekError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Pendaftaran
                  </label>
                  <input
                    type="text"
                    required
                    value={cekNo}
                    onChange={(e) => setCekNo(e.target.value)}
                    placeholder="Contoh: PPDB-2025-0001"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono font-bold uppercase focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Lahir Calon Siswa
                  </label>
                  <input
                    type="date"
                    required
                    value={cekTglLahir}
                    onChange={(e) => setCekTglLahir(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={checking}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-5 py-3 text-xs font-extrabold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {checking ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Memeriksa Data...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Periksa Status Pendaftaran</span>
                  </>
                )}
              </button>
            </form>

            {cekResult && renderPrintableReceipt(cekResult)}
          </div>
        )}
      </div>
    </div>
  )
}

