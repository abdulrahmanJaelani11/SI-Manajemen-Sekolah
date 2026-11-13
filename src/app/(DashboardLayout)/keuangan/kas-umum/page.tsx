'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  X,
  Upload,
  FileText,
  Wallet,
  Tags,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { formatRupiah } from '@/lib/terbilang'
import { usePermission } from '@/context/PermissionContext'

export default function KasUmumPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/keuangan/kas-umum')
  const allowEdit = canEdit('/keuangan/kas-umum')
  const allowDelete = canDelete('/keuangan/kas-umum')

  const [activeTab, setActiveTab] = useState<'transaksi' | 'kategori'>('transaksi')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  const [transaksiList, setTransaksiList] = useState<any[]>([])
  const [kategoriList, setKategoriList] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalPemasukan: 0,
    totalPengeluaran: 0,
    saldoKasUmum: 0,
    totalTransaksi: 0,
  })

  // Filters
  const [filterJenis, setFilterJenis] = useState('all')
  const [filterKategori, setFilterKategori] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal Transaksi
  const [isTrxOpen, setIsTrxOpen] = useState(false)
  const [editingTrx, setEditingTrx] = useState<any>(null)
  const [modalJenisHint, setModalJenisHint] = useState<'pemasukan' | 'pengeluaran'>('pengeluaran')
  const [savingTrx, setSavingTrx] = useState(false)
  const [uploadingNota, setUploadingNota] = useState(false)
  const [trxForm, setTrxForm] = useState({
    kategoriId: '',
    tanggal: new Date().toISOString().slice(0, 10),
    nominal: 0,
    metode: 'Tunai',
    pihakTerkait: '',
    uraian: '',
    lampiranUrl: '',
  })

  // Modal Kategori
  const [isKatModalOpen, setIsKatModalOpen] = useState(false)
  const [editingKat, setEditingKat] = useState<any>(null)
  const [savingKat, setSavingKat] = useState(false)
  const [katForm, setKatForm] = useState({
    kode: '',
    nama: '',
    jenis: 'pengeluaran',
    keterangan: '',
    active: true,
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterJenis !== 'all') params.set('jenis', filterJenis)
      if (filterKategori !== 'all') params.set('kategoriId', filterKategori)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/keuangan/kas-umum?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setTransaksiList(json.data.transaksiList || [])
        setStats(json.data.stats)
        setKategoriList(json.data.kategoriList || [])
      }
    } catch (err) {
      console.error('Fetch kas umum error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterJenis, filterKategori, startDate, endDate])

  const modalKategoriOptions = useMemo(() => {
    return kategoriList
      .filter((k) => k.active && (editingTrx ? true : k.jenis === modalJenisHint))
      .map((k) => ({
        value: String(k.id),
        label: `[${k.kode}] ${k.nama}`,
        sublabel: k.jenis === 'pemasukan' ? 'Kas Masuk' : 'Kas Keluar',
      }))
  }, [kategoriList, modalJenisHint, editingTrx])

  const openCreateTrx = (jenis: 'pemasukan' | 'pengeluaran') => {
    setEditingTrx(null)
    setModalJenisHint(jenis)
    const firstKat = kategoriList.find((k) => k.active && k.jenis === jenis)
    setTrxForm({
      kategoriId: firstKat ? String(firstKat.id) : '',
      tanggal: new Date().toISOString().slice(0, 10),
      nominal: 0,
      metode: 'Tunai',
      pihakTerkait: '',
      uraian: '',
      lampiranUrl: '',
    })
    setIsTrxOpen(true)
  }

  const openEditTrx = (t: any) => {
    setEditingTrx(t)
    setModalJenisHint(t.jenis === 'pemasukan' ? 'pemasukan' : 'pengeluaran')
    setTrxForm({
      kategoriId: String(t.kategoriId),
      tanggal: new Date(t.tanggal).toISOString().slice(0, 10),
      nominal: t.nominal,
      metode: t.metode,
      pihakTerkait: t.pihakTerkait || '',
      uraian: t.uraian,
      lampiranUrl: t.lampiranUrl || '',
    })
    setIsTrxOpen(true)
  }

  const handleUploadNota = async (file: File) => {
    setUploadingNota(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'keuangan')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success && json.data?.url) {
        setTrxForm((prev) => ({ ...prev, lampiranUrl: json.data.url }))
      } else {
        alert(json.message || 'Gagal mengunggah bukti nota')
      }
    } catch (err: any) {
      alert('Gagal upload: ' + err.message)
    } finally {
      setUploadingNota(false)
    }
  }

  const handleSaveTrx = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingTrx(true)
    setFeedback(null)
    try {
      const method = editingTrx ? 'PUT' : 'POST'
      const payload = editingTrx ? { ...trxForm, id: editingTrx.id } : trxForm
      const res = await fetch('/api/keuangan/kas-umum', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setIsTrxOpen(false)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message || 'Gagal menyimpan transaksi' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingTrx(false)
    }
  }

  const handleDeleteTrx = async (t: any) => {
    if (!confirm(`Hapus transaksi ${t.noBukti}?`)) return
    setFeedback(null)
    try {
      const res = await fetch(`/api/keuangan/kas-umum?id=${t.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    }
  }

  const openKatModal = (k?: any) => {
    if (k) {
      setEditingKat(k)
      setKatForm({
        kode: k.kode,
        nama: k.nama,
        jenis: k.jenis,
        keterangan: k.keterangan || '',
        active: k.active,
      })
    } else {
      setEditingKat(null)
      setKatForm({
        kode: '',
        nama: '',
        jenis: 'pengeluaran',
        keterangan: '',
        active: true,
      })
    }
    setIsKatModalOpen(true)
  }

  const handleSaveKat = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingKat(true)
    setFeedback(null)
    try {
      const method = editingKat ? 'PUT' : 'POST'
      const payload = editingKat ? { ...katForm, id: editingKat.id } : katForm
      const res = await fetch('/api/keuangan/kas-umum/kategori', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setIsKatModalOpen(false)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingKat(false)
    }
  }

  const handleDeleteKat = async (k: any) => {
    if (!confirm(`Hapus kategori kas "${k.nama}"?`)) return
    setFeedback(null)
    try {
      const res = await fetch(`/api/keuangan/kas-umum/kategori?id=${k.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kas Umum &amp; Pengeluaran Operasional
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Catat pemasukan non-siswa (BOS, donasi, unit usaha) dan seluruh pengeluaran operasional sekolah.
          </p>
        </div>

        {allowCreate && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openCreateTrx('pemasukan')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
            >
              <ArrowDownCircle className="h-4 w-4" />
              <span>Catat Pemasukan</span>
            </button>
            <button
              onClick={() => openCreateTrx('pengeluaran')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-rose-700 transition"
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span>Catat Pengeluaran</span>
            </button>
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-emerald-600">Total Kas Masuk Lain</p>
          <p className="mt-1 text-xl font-black font-mono text-emerald-700">
            {formatRupiah(stats.totalPemasukan)}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-rose-600">Total Pengeluaran</p>
          <p className="mt-1 text-xl font-black font-mono text-rose-700">
            {formatRupiah(stats.totalPengeluaran)}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-blue-600">Selisih Kas Umum</p>
          <p className="mt-1 text-xl font-black font-mono text-slate-900 dark:text-white">
            {formatRupiah(stats.saldoKasUmum)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500">Jumlah Transaksi</p>
          <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            {stats.totalTransaksi} Bukti
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('transaksi')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'transaksi'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Catatan Kas Masuk &amp; Keluar ({transaksiList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('kategori')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'kategori'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tags className="h-4 w-4" />
          <span>Master Pos Kas ({kategoriList.length})</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR TRANSAKSI */}
      {activeTab === 'transaksi' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari no. bukti, uraian, atau pihak terkait..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchData()
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <button
                onClick={fetchData}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Cari
              </button>
            </div>

            <SearchableSelect
              value={filterJenis}
              onChange={(val) => setFilterJenis(val)}
              options={[
                { value: 'all', label: 'Semua Jenis' },
                { value: 'pemasukan', label: 'Pemasukan (+)' },
                { value: 'pengeluaran', label: 'Pengeluaran (-)' },
              ]}
            />

            <SearchableSelect
              value={filterKategori}
              onChange={(val) => setFilterKategori(val)}
              options={[
                { value: 'all', label: 'Semua Pos Kas' },
                ...kategoriList.map((k) => ({ value: String(k.id), label: k.nama })),
              ]}
            />

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              title="Dari tanggal"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              title="Sampai tanggal"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">No. Bukti &amp; Tanggal</th>
                    <th className="px-4 py-3">Pos Kas</th>
                    <th className="px-4 py-3">Uraian &amp; Pihak Terkait</th>
                    <th className="px-4 py-3">Metode &amp; Nota</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        Memuat catatan kas umum...
                      </td>
                    </tr>
                  ) : transaksiList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        Belum ada transaksi kas masuk/pengeluaran operasional yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    transaksiList.map((t) => {
                      const isMasuk = t.jenis === 'pemasukan'
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-800">{t.noBukti}</div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(t.tanggal).toLocaleDateString('id-ID')}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                isMasuk
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {isMasuk ? 'Masuk' : 'Keluar'}
                            </span>
                            <div className="mt-1 font-semibold text-slate-800">
                              {t.kategori?.nama}
                            </div>
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-slate-700">{t.uraian}</p>
                            {t.pihakTerkait && (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {isMasuk ? 'Dari: ' : 'Penerima: '}
                                {t.pihakTerkait}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-700">{t.metode}</div>
                            {t.lampiranUrl && (
                              <a
                                href={t.lampiranUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline mt-0.5"
                              >
                                <FileText className="h-3 w-3" />
                                <span>Lihat Nota</span>
                              </a>
                            )}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-mono font-black whitespace-nowrap ${
                              isMasuk ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isMasuk ? '+' : '-'}
                            {formatRupiah(t.nominal)}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex gap-1">
                              {allowEdit && (
                                <button
                                  onClick={() => openEditTrx(t)}
                                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {allowDelete && (
                                <button
                                  onClick={() => handleDeleteTrx(t)}
                                  className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER POS KAS */}
      {activeTab === 'kategori' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {allowCreate && (
              <button
                onClick={() => openKatModal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Pos Kas</span>
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Pos Kas</th>
                  <th className="px-4 py-3">Jenis Arus Kas</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kategoriList.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{k.kode}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{k.nama}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-lg border px-2 py-0.5 text-[11px] font-bold capitalize ${
                          k.jenis === 'pemasukan'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {k.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {allowEdit && (
                          <button
                            onClick={() => openKatModal(k)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {allowDelete && (
                          <button
                            onClick={() => handleDeleteKat(k)}
                            className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TRANSAKSI KAS */}
      {isTrxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveTrx}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingTrx
                  ? `Edit Transaksi ${editingTrx.noBukti}`
                  : modalJenisHint === 'pemasukan'
                    ? 'Catat Pemasukan Kas Lainnya'
                    : 'Catat Pengeluaran Operasional'}
              </h3>
              <button type="button" onClick={() => setIsTrxOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Kategori / Pos Kas *</label>
                <SearchableSelect
                  value={trxForm.kategoriId}
                  onChange={(val) => setTrxForm({ ...trxForm, kategoriId: val })}
                  options={modalKategoriOptions}
                  placeholder="Pilih pos kas..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={trxForm.tanggal}
                    onChange={(e) => setTrxForm({ ...trxForm, tanggal: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={trxForm.nominal}
                    onChange={(e) => setTrxForm({ ...trxForm, nominal: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Metode Kas</label>
                  <SearchableSelect
                    value={trxForm.metode}
                    onChange={(val) => setTrxForm({ ...trxForm, metode: val })}
                    options={[
                      { value: 'Tunai', label: 'Kas Tunai' },
                      { value: 'Bank / Transfer', label: 'Rekening Bank / Transfer' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    {modalJenisHint === 'pemasukan' ? 'Sumber Dana' : 'Penerima / Vendor'}
                  </label>
                  <input
                    type="text"
                    value={trxForm.pihakTerkait}
                    onChange={(e) => setTrxForm({ ...trxForm, pihakTerkait: e.target.value })}
                    placeholder="Contoh: Toko ATK / PLN / Yayasan"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Uraian Transaksi *</label>
                <textarea
                  rows={2}
                  required
                  value={trxForm.uraian}
                  onChange={(e) => setTrxForm({ ...trxForm, uraian: e.target.value })}
                  placeholder="Rincian keperluan pengeluaran / sumber pemasukan..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-700 block">Bukti Nota / Kwitansi</span>
                  {trxForm.lampiranUrl ? (
                    <a
                      href={trxForm.lampiranUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-600 hover:underline"
                    >
                      Berkas terunggah (Klik lihat)
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">Opsional (JPG/PNG/PDF)</span>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100">
                  <Upload className="h-3.5 w-3.5 text-blue-600" />
                  <span>{uploadingNota ? 'Mengunggah...' : 'Unggah Nota'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleUploadNota(f)
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsTrxOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingTrx || uploadingNota}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingTrx ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL POS KAS */}
      {isKatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveKat}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingKat ? 'Edit Pos Kas' : 'Tambah Pos Kas'}
              </h3>
              <button type="button" onClick={() => setIsKatModalOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Kode *</label>
                  <input
                    type="text"
                    required
                    value={katForm.kode}
                    onChange={(e) => setKatForm({ ...katForm, kode: e.target.value })}
                    placeholder="KLR-06"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Jenis Arus Kas *</label>
                  <SearchableSelect
                    value={katForm.jenis}
                    onChange={(val) => setKatForm({ ...katForm, jenis: val })}
                    options={[
                      { value: 'pemasukan', label: 'Pemasukan (+)' },
                      { value: 'pengeluaran', label: 'Pengeluaran (-)' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Nama Pos Kas *</label>
                <input
                  type="text"
                  required
                  value={katForm.nama}
                  onChange={(e) => setKatForm({ ...katForm, nama: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsKatModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingKat}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingKat ? 'Menyimpan...' : 'Simpan Pos Kas'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

