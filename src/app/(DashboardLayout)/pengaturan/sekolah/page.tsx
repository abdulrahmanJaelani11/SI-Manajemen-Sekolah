'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2,
  Palette,
  FileText,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Camera,
  Globe,
  Mail,
  Phone,
  Sparkles,
} from 'lucide-react'

const THEME_PRESETS = [
  {
    id: 'default',
    nama: 'Default Modern Blue',
    primary: '#5d87ff',
    primaryDark: '#4570ea',
    accent: '#13deb9',
    nuansa: 'Tampilan bawaan template modern dan bersih',
  },
  {
    id: 'maarif_emerald',
    nama: 'Ma\'arif Emerald',
    primary: '#138241',
    primaryDark: '#064b39',
    accent: '#059669',
    nuansa: 'Nuansa hijau zamrud Islami elegan dan tenang',
  },
  {
    id: 'ocean_sapphire',
    nama: 'Ocean Sapphire',
    primary: '#0284c7',
    primaryDark: '#0c4a6e',
    accent: '#0369a1',
    nuansa: 'Nuansa biru laut profesional, segar, dan berwibawa',
  },
  {
    id: 'royal_indigo',
    nama: 'Royal Indigo',
    primary: '#4f46e5',
    primaryDark: '#1e1b4b',
    accent: '#6366f1',
    nuansa: 'Nuansa ungu indigo modern, elegan, dan berteknologi',
  },
  {
    id: 'burgundy_crimson',
    nama: 'Burgundy Crimson',
    primary: '#be123c',
    primaryDark: '#4c0519',
    accent: '#e11d48',
    nuansa: 'Nuansa merah marun anggun, berkarakter, dan dinamis',
  },
  {
    id: 'modern_slate',
    nama: 'Modern Slate',
    primary: '#475569',
    primaryDark: '#0f172a',
    accent: '#64748b',
    nuansa: 'Nuansa monokrom abu-abu gelap minimalis nan premium',
  },
]

export default function PengaturanSekolahPage() {
  const [activeTab, setActiveTab] = useState<'identitas' | 'visi_misi' | 'tema'>('identitas')

  const [formData, setFormData] = useState({
    namaSekolah: 'Sistem Informasi Manajemen Sekolah Terpadu',
    npsn: '10203040',
    bentukPendidikan: 'Multi-Jenjang',
    sejarah: '',
    visiMisi: '',
    alamat: '',
    telepon: '',
    email: '',
    website: '',
    logoUrl: '',
    warnaPrimary: '#5d87ff',
    warnaPrimaryDark: '#4570ea',
    warnaAccent: '#13deb9',
    temaPreset: 'default',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const fetchProfil = async () => {
      try {
        const res = await fetch('/api/pengaturan/sekolah')
        const data = await res.json()
        if (data.success && data.data) {
          setFormData((prev) => ({
            ...prev,
            ...data.data,
          }))
        }
      } catch (err) {
        console.error('Fetch profil error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfil()
  }, [])

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('folder', 'logo')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      })
      const resJson = await res.json()
      if (resJson.success) {
        setFormData((prev) => ({ ...prev, logoUrl: resJson.data.url }))
      } else {
        alert(resJson.message || 'Gagal mengunggah logo')
      }
    } catch (err: any) {
      alert('Error saat upload: ' + err.message)
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // Pilih Preset Tema
  const handleApplyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setFormData((prev) => ({
      ...prev,
      warnaPrimary: preset.primary,
      warnaPrimaryDark: preset.primaryDark,
      warnaAccent: preset.accent,
      temaPreset: preset.id,
    }))

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('school-theme-updated', {
          detail: {
            warnaPrimary: preset.primary,
            warnaPrimaryDark: preset.primaryDark,
            warnaAccent: preset.accent,
          },
        })
      )
    }
  }

  // Simpan Pengaturan
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setStatusMessage(null)

    try {
      const res = await fetch('/api/pengaturan/sekolah', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const resJson = await res.json()

      if (resJson.success) {
        setStatusMessage({ type: 'success', text: 'Pengaturan sekolah & tema berhasil disimpan!' })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('school-theme-updated', {
              detail: {
                warnaPrimary: formData.warnaPrimary,
                warnaPrimaryDark: formData.warnaPrimaryDark,
                warnaAccent: formData.warnaAccent,
              },
            })
          )
        }
      } else {
        setStatusMessage({ type: 'error', text: resJson.message || 'Gagal menyimpan profil sekolah' })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Terjadi kesalahan jaringan: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Profil Lembaga & Kustomisasi Tema
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Konfigurasi identitas resmi sekolah, visi-misi, serta Dynamic Theming Engine untuk mengubah skema warna sistem.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
        </button>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tab Navigasi */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('identitas')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === 'identitas'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Identitas & Kontak
        </button>

        <button
          onClick={() => setActiveTab('visi_misi')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === 'visi_misi'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <FileText className="h-4 w-4" />
          Visi, Misi & Sejarah
        </button>

        <button
          onClick={() => setActiveTab('tema')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === 'tema'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          <Palette className="h-4 w-4" />
          Kustomisasi Tema & Warna
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: IDENTITAS & KONTAK */}
        {activeTab === 'identitas' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Logo Upload */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 flex items-center justify-center p-2">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo Sekolah"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 text-center">
                      <Camera className="h-7 w-7 mb-1" />
                      <span className="text-[10px] font-medium">Logo Sekolah</span>
                    </div>
                  )}
                </div>
                <label className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {isUploadingLogo ? 'Mengunggah...' : 'Pilih Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={isUploadingLogo}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Input Identitas */}
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nama Resmi Lembaga / Sekolah *
                  </label>
                  <input
                    type="text"
                    value={formData.namaSekolah}
                    onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nomor Pokok Sekolah Nasional (NPSN)
                  </label>
                  <input
                    type="text"
                    placeholder="8 digit nomor NPSN"
                    value={formData.npsn || ''}
                    onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Bentuk Layanan Pendidikan
                  </label>
                  <input
                    type="text"
                    placeholder="Yayasan Terpadu / Multi-Jenjang"
                    value={formData.bentukPendidikan || ''}
                    onChange={(e) => setFormData({ ...formData, bentukPendidikan: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="0812-3456-7890"
                    value={formData.telepon || ''}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Alamat Surel Resmi (Email)
                  </label>
                  <input
                    type="email"
                    placeholder="info@sekolah.sch.id"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Alamat Fisik Kampus / Sekolah
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Kode Pos"
                    value={formData.alamat || ''}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VISI, MISI & SEJARAH */}
        {activeTab === 'visi_misi' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rumusan Visi, Misi & Tujuan Lembaga
              </label>
              <textarea
                rows={6}
                value={formData.visiMisi || ''}
                onChange={(e) => setFormData({ ...formData, visiMisi: e.target.value })}
                placeholder="Visi: ...&#10;Misi: ...&#10;Tujuan: ..."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Narasi Sejarah & Profil Singkat
              </label>
              <textarea
                rows={6}
                value={formData.sejarah || ''}
                onChange={(e) => setFormData({ ...formData, sejarah: e.target.value })}
                placeholder="Sejarah pendirian sekolah, tokoh perintis, dan tonggak perkembangan..."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* TAB 3: DYNAMIC THEMING ENGINE */}
        {activeTab === 'tema' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Dynamic Theming Engine (Preset Palet Warna)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih palet warna serasi dengan satu klik. Nilai warna disimpan ke basis data dan dapat diterapkan secara instan.
              </p>
            </div>

            {/* Grid 6 Preset Tema */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {THEME_PRESETS.map((p) => {
                const isSelected = formData.temaPreset === p.id

                return (
                  <div
                    key={p.id}
                    onClick={() => handleApplyPreset(p)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500 dark:border-blue-500 dark:bg-blue-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.nama}</h4>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{p.nuansa}</p>

                    {/* Sampel Warna Palet */}
                    <div className="mt-3 flex items-center gap-2">
                      <div
                        className="h-6 w-8 rounded shadow-sm border border-black/10"
                        style={{ backgroundColor: p.primary }}
                        title="Warna Primer"
                      />
                      <div
                        className="h-6 w-8 rounded shadow-sm border border-black/10"
                        style={{ backgroundColor: p.primaryDark }}
                        title="Warna Primer Gelap"
                      />
                      <div
                        className="h-6 w-8 rounded shadow-sm border border-black/10"
                        style={{ backgroundColor: p.accent }}
                        title="Warna Aksen"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Color Picker Kustom */}
            <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Kustomisasi Hex Warna Mandiri
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Warna Primer (Primary)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.warnaPrimary}
                      onChange={(e) => setFormData({ ...formData, warnaPrimary: e.target.value, temaPreset: 'custom' })}
                      className="h-9 w-12 rounded cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={formData.warnaPrimary}
                      onChange={(e) => setFormData({ ...formData, warnaPrimary: e.target.value, temaPreset: 'custom' })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Warna Primer Gelap (Dark)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.warnaPrimaryDark}
                      onChange={(e) => setFormData({ ...formData, warnaPrimaryDark: e.target.value, temaPreset: 'custom' })}
                      className="h-9 w-12 rounded cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={formData.warnaPrimaryDark}
                      onChange={(e) => setFormData({ ...formData, warnaPrimaryDark: e.target.value, temaPreset: 'custom' })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Warna Aksen (Accent)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.warnaAccent}
                      onChange={(e) => setFormData({ ...formData, warnaAccent: e.target.value, temaPreset: 'custom' })}
                      className="h-9 w-12 rounded cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={formData.warnaAccent}
                      onChange={(e) => setFormData({ ...formData, warnaAccent: e.target.value, temaPreset: 'custom' })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pratinjau Langsung (Live Preview) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pratinjau Langsung (Live Preview):
              </span>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  style={{ backgroundColor: formData.warnaPrimary }}
                  className="rounded-lg px-4 py-2 text-xs font-bold text-white shadow"
                >
                  Tombol Primer
                </button>
                <button
                  type="button"
                  style={{ backgroundColor: formData.warnaPrimaryDark }}
                  className="rounded-lg px-4 py-2 text-xs font-bold text-white shadow"
                >
                  Tombol Gelap
                </button>
                <span
                  style={{ color: formData.warnaPrimary }}
                  className="text-xs font-bold"
                >
                  Teks Berwarna Primer
                </span>
                <span
                  style={{ backgroundColor: formData.warnaAccent + '25', color: formData.warnaAccent }}
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                >
                  Badge Aksen
                </span>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
