'use client'

import React, { useEffect, useState } from 'react'
import {
  FileSpreadsheet,
  Plus,
  Search,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  X,
  History,
  Printer,
  RotateCcw,
  Coins,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'
import { formatRupiah } from '@/lib/terbilang'
import { usePermission } from '@/context/PermissionContext'

const STATUS_TAGIHAN: Record<string, { label: string; style: string }> = {
  belum_bayar: {
    label: 'Belum Bayar',
    style: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  cicilan: {
    label: 'Cicilan',
    style: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  lunas: {
    label: 'Lunas',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  batal: {
    label: 'Dibatalkan',
    style: 'bg-slate-100 text-slate-500 border-slate-200',
  },
}

export default function TagihanNonSppPage() {
  const { canCreate, canEdit, canDelete } = usePermission()
  const allowCreate = canCreate('/keuangan/tagihan')
  const allowEdit = canEdit('/keuangan/tagihan')
  const allowDelete = canDelete('/keuangan/tagihan')

  const [activeTab, setActiveTab] = useState<'tagihan' | 'jenis'>('tagihan')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )

  // Data
  const [tagihanList, setTagihanList] = useState<any[]>([])
  const [jenisList, setJenisList] = useState<any[]>([])
  const [siswaList, setSiswaList] = useState<any[]>([])
  const [kelasList, setKelasList] = useState<any[]>([])
  const [tahunAjaranList, setTahunAjaranList] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalTagihanCount: 0,
    totalNominalTagihan: 0,
    totalTerbayar: 0,
    totalSisaPiutang: 0,
    jumlahLunas: 0,
    jumlahCicilan: 0,
    jumlahBelumBayar: 0,
  })

  // Filters
  const [filterJenis, setFilterJenis] = useState('all')
  const [filterKelas, setFilterKelas] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal Generate Tagihan
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [savingGenerate, setSavingGenerate] = useState(false)
  const [genForm, setGenForm] = useState({
    targetMode: 'individu',
    siswaId: '',
    kelasId: '',
    jenisId: '',
    tahunAjaran: '2024/2025',
    judul: '',
    nominalTagihan: 0,
    diskon: 0,
    jatuhTempo: '',
    keterangan: '',
  })

  // Modal Bayar / Cicil
  const [payTarget, setPayTarget] = useState<any>(null)
  const [savingPay, setSavingPay] = useState(false)
  const [payForm, setPayForm] = useState({
    nominalBayar: 0,
    metodeBayar: 'Tunai',
    tanggalBayar: new Date().toISOString().slice(0, 10),
    keterangan: '',
  })

  // Modal Riwayat Cicilan & Kuitansi
  const [historyTarget, setHistoryTarget] = useState<any>(null)

  // Modal Jenis Tagihan
  const [isJenisModalOpen, setIsJenisModalOpen] = useState(false)
  const [editingJenis, setEditingJenis] = useState<any>(null)
  const [savingJenis, setSavingJenis] = useState(false)
  const [jenisForm, setJenisForm] = useState({
    kode: '',
    nama: '',
    nominalDefault: 0,
    bolehCicil: true,
    keterangan: '',
    active: true,
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterJenis !== 'all') params.set('jenisId', filterJenis)
      if (filterKelas !== 'all') params.set('kelasId', filterKelas)
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      const res = await fetch(`/api/keuangan/tagihan?${params.toString()}`)
      const json = await res.json()
      if (json.success && json.data) {
        setTagihanList(json.data.tagihanList || [])
        setStats(json.data.stats)
        setJenisList(json.data.jenisList || [])
        setSiswaList(json.data.siswaList || [])
        setKelasList(json.data.kelasList || [])
        setTahunAjaranList(json.data.tahunAjaranList || [])
      }
    } catch (err) {
      console.error('Fetch tagihan error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterJenis, filterKelas, filterStatus])

  const openGenerateModal = () => {
    const activeTa = tahunAjaranList.find((t) => t.isActive)?.nama || '2024/2025'
    setGenForm({
      targetMode: 'individu',
      siswaId: '',
      kelasId: '',
      jenisId: '',
      tahunAjaran: activeTa,
      judul: '',
      nominalTagihan: 0,
      diskon: 0,
      jatuhTempo: '',
      keterangan: '',
    })
    setIsGenerateOpen(true)
  }

  const handleSelectJenisForGen = (jenisIdVal: string) => {
    const found = jenisList.find((j) => String(j.id) === jenisIdVal)
    setGenForm((prev) => ({
      ...prev,
      jenisId: jenisIdVal,
      judul: found ? `${found.nama} ${prev.tahunAjaran}` : prev.judul,
      nominalTagihan: found ? found.nominalDefault : prev.nominalTagihan,
    }))
  }

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingGenerate(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/keuangan/tagihan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genForm),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setIsGenerateOpen(false)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message || 'Gagal membuat tagihan' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingGenerate(false)
    }
  }

  const openPayModal = (item: any) => {
    setPayTarget(item)
    setPayForm({
      nominalBayar: item.sisaTagihan,
      metodeBayar: 'Tunai',
      tanggalBayar: new Date().toISOString().slice(0, 10),
      keterangan: '',
    })
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payTarget) return
    setSavingPay(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/keuangan/tagihan/bayar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagihanId: payTarget.id,
          ...payForm,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setPayTarget(null)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message || 'Gagal memproses pembayaran' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingPay(false)
    }
  }

  const handleVoidPayment = async (paymentId: number, noTrx: string) => {
    if (!confirm(`Batalkan (VOID) transaksi cicilan ${noTrx}?`)) return
    setFeedback(null)
    try {
      const res = await fetch('/api/keuangan/tagihan/bayar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pembayaranId: paymentId }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setHistoryTarget(null)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    }
  }

  const handleDeleteTagihan = async (item: any) => {
    if (!confirm(`Hapus tagihan "${item.kodeTagihan}" (${item.siswa?.nama})?`)) return
    setFeedback(null)
    try {
      const res = await fetch(`/api/keuangan/tagihan?id=${item.id}`, { method: 'DELETE' })
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

  const openJenisModal = (j?: any) => {
    if (j) {
      setEditingJenis(j)
      setJenisForm({
        kode: j.kode,
        nama: j.nama,
        nominalDefault: j.nominalDefault,
        bolehCicil: j.bolehCicil,
        keterangan: j.keterangan || '',
        active: j.active,
      })
    } else {
      setEditingJenis(null)
      setJenisForm({
        kode: '',
        nama: '',
        nominalDefault: 0,
        bolehCicil: true,
        keterangan: '',
        active: true,
      })
    }
    setIsJenisModalOpen(true)
  }

  const handleSaveJenis = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingJenis(true)
    setFeedback(null)
    try {
      const method = editingJenis ? 'PUT' : 'POST'
      const payload = editingJenis ? { ...jenisForm, id: editingJenis.id } : jenisForm
      const res = await fetch('/api/keuangan/tagihan/jenis', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setFeedback({ type: 'success', message: json.message })
        setIsJenisModalOpen(false)
        await fetchData()
      } else {
        setFeedback({ type: 'error', message: json.message })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message })
    } finally {
      setSavingJenis(false)
    }
  }

  const handleDeleteJenis = async (j: any) => {
    if (!confirm(`Hapus pos tagihan "${j.nama}"?`)) return
    setFeedback(null)
    try {
      const res = await fetch(`/api/keuangan/tagihan/jenis?id=${j.id}`, { method: 'DELETE' })
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
            Tagihan Non-SPP &amp; Pembayaran Cicilan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola tagihan uang pangkal, seragam, daftar ulang, ujian, beserta pembayaran lunas maupun angsuran bertahap.
          </p>
        </div>

        {allowCreate && (
          <button
            onClick={openGenerateModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Buat / Generate Tagihan</span>
          </button>
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

      {/* 4 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500">Total Nilai Tagihan</p>
          <p className="mt-1 text-xl font-black font-mono text-slate-900 dark:text-white">
            {formatRupiah(stats.totalNominalTagihan)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.totalTagihanCount} invoice aktif</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-emerald-600">Total Dana Masuk</p>
          <p className="mt-1 text-xl font-black font-mono text-emerald-700">
            {formatRupiah(stats.totalTerbayar)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.jumlahLunas} tagihan lunas</p>
        </div>
        <div className="rounded-2xl border border-rose-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-rose-600">Sisa Piutang Tagihan</p>
          <p className="mt-1 text-xl font-black font-mono text-rose-700">
            {formatRupiah(stats.totalSisaPiutang)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {stats.jumlahCicilan} cicilan • {stats.jumlahBelumBayar} belum bayar
          </p>
        </div>
        <div className="rounded-2xl border border-blue-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold text-blue-600">Pos Biaya Aktif</p>
          <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            {jenisList.filter((j) => j.active).length} Jenis
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Master kategori tagihan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('tagihan')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'tagihan'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Daftar Tagihan &amp; Kasir Cicilan ({tagihanList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('jenis')}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'jenis'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins className="h-4 w-4" />
          <span>Master Pos Tagihan ({jenisList.length})</span>
        </button>
      </div>

      {/* TAB 1: TAGIHAN SISWA */}
      {activeTab === 'tagihan' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode INV, nama/NIS siswa, atau judul..."
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
                className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Cari
              </button>
            </div>

            <SearchableSelect
              value={filterJenis}
              onChange={(val) => setFilterJenis(val)}
              options={[
                { value: 'all', label: 'Semua Pos Tagihan' },
                ...jenisList.map((j) => ({ value: String(j.id), label: j.nama })),
              ]}
            />

            <SearchableSelect
              value={filterKelas}
              onChange={(val) => setFilterKelas(val)}
              options={[
                { value: 'all', label: 'Semua Kelas' },
                ...kelasList.map((k) => ({
                  value: String(k.id),
                  label: `${k.jenjang?.kode || ''} - ${k.namaKelas}`,
                })),
              ]}
            />

            <SearchableSelect
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'belum_bayar', label: 'Belum Bayar' },
                { value: 'cicilan', label: 'Dalam Cicilan' },
                { value: 'lunas', label: 'Lunas' },
              ]}
            />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Siswa &amp; Kelas</th>
                    <th className="px-4 py-3">Tagihan &amp; T.A</th>
                    <th className="px-4 py-3 text-right">Wajib Bayar</th>
                    <th className="px-4 py-3 text-right">Terbayar / Sisa</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                        Memuat data tagihan...
                      </td>
                    </tr>
                  ) : tagihanList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                        Belum ada tagihan Non-SPP yang dibuat.
                      </td>
                    </tr>
                  ) : (
                    tagihanList.map((item) => {
                      const st = STATUS_TAGIHAN[item.status] || STATUS_TAGIHAN.belum_bayar
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                            <div>{item.kodeTagihan}</div>
                            {item.jatuhTempo && (
                              <div className="text-[10px] font-sans font-normal text-slate-400">
                                JT: {new Date(item.jatuhTempo).toLocaleDateString('id-ID')}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{item.siswa?.nama}</div>
                            <div className="text-[11px] text-slate-500">
                              NIS: {item.siswa?.nis} •{' '}
                              {item.siswa?.kelas
                                ? `${item.siswa.jenjang?.kode || ''} ${item.siswa.kelas.namaKelas}`
                                : 'Non-Kelas'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{item.judul}</div>
                            <div className="text-[11px] text-slate-500">
                              {item.jenis?.nama} • TA {item.tahunAjaran}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                            {formatRupiah(item.wajibBayar)}
                            {item.diskon > 0 && (
                              <div className="text-[10px] text-emerald-600 font-normal">
                                Diskon: -{formatRupiah(item.diskon)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <div className="font-bold text-emerald-700">
                              {formatRupiah(item.totalTerbayar)}
                            </div>
                            <div className="text-[11px] text-rose-600 font-semibold">
                              Sisa: {formatRupiah(item.sisaTagihan)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-extrabold ${st.style}`}
                            >
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {allowCreate && item.sisaTagihan > 0 && (
                                <button
                                  onClick={() => openPayModal(item)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                                >
                                  <Wallet className="h-3.5 w-3.5" />
                                  <span>Bayar</span>
                                </button>
                              )}
                              <button
                                onClick={() => setHistoryTarget(item)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                                title="Riwayat cicilan & cetak"
                              >
                                <History className="h-3.5 w-3.5" />
                                <span>Riwayat ({item.pembayaran?.length || 0})</span>
                              </button>
                              {allowDelete && item.totalTerbayar === 0 && (
                                <button
                                  onClick={() => handleDeleteTagihan(item)}
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

      {/* TAB 2: MASTER POS TAGIHAN */}
      {activeTab === 'jenis' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {allowCreate && (
              <button
                onClick={() => openJenisModal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Pos Tagihan</span>
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Pos Tagihan</th>
                  <th className="px-4 py-3 text-right">Nominal Default</th>
                  <th className="px-4 py-3 text-center">Skema Cicilan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jenisList.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{j.kode}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{j.nama}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                      {formatRupiah(j.nominalDefault)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-lg border px-2 py-0.5 text-[11px] font-bold ${
                          j.bolehCicil
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {j.bolehCicil ? 'Boleh Dicicil' : 'Wajib Lunas Sekaligus'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {allowEdit && (
                          <button
                            onClick={() => openJenisModal(j)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {allowDelete && (
                          <button
                            onClick={() => handleDeleteJenis(j)}
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

      {/* MODAL GENERATE TAGIHAN */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleGenerateSubmit}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Buat / Generate Tagihan Non-SPP
              </h3>
              <button type="button" onClick={() => setIsGenerateOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Target Penerima Tagihan *</label>
                <SearchableSelect
                  value={genForm.targetMode}
                  onChange={(val) => setGenForm({ ...genForm, targetMode: val })}
                  options={[
                    { value: 'individu', label: 'Individu (1 Siswa Tertentu)' },
                    { value: 'kelas', label: 'Massal 1 Kelas' },
                    { value: 'semua_aktif', label: 'Massal Seluruh Siswa Aktif' },
                  ]}
                />
              </div>

              {genForm.targetMode === 'individu' && (
                <div>
                  <label className="block font-bold mb-1">Pilih Siswa *</label>
                  <SearchableSelect
                    value={genForm.siswaId}
                    onChange={(val) => setGenForm({ ...genForm, siswaId: val })}
                    options={siswaList.map((s) => ({
                      value: String(s.id),
                      label: `${s.nama} (${s.nis})`,
                      sublabel: s.kelas ? `${s.jenjang?.kode || ''} ${s.kelas.namaKelas}` : '-',
                    }))}
                    placeholder="Cari nama/NIS siswa..."
                  />
                </div>
              )}

              {genForm.targetMode === 'kelas' && (
                <div>
                  <label className="block font-bold mb-1">Pilih Kelas Target *</label>
                  <SearchableSelect
                    value={genForm.kelasId}
                    onChange={(val) => setGenForm({ ...genForm, kelasId: val })}
                    options={kelasList.map((k) => ({
                      value: String(k.id),
                      label: `${k.jenjang?.kode || ''} - ${k.namaKelas}`,
                    }))}
                    placeholder="Pilih kelas..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Jenis / Pos Tagihan *</label>
                  <SearchableSelect
                    value={genForm.jenisId}
                    onChange={handleSelectJenisForGen}
                    options={jenisList
                      .filter((j) => j.active)
                      .map((j) => ({
                        value: String(j.id),
                        label: j.nama,
                        sublabel: formatRupiah(j.nominalDefault),
                      }))}
                    placeholder="Pilih jenis..."
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Tahun Ajaran *</label>
                  <input
                    type="text"
                    required
                    value={genForm.tahunAjaran}
                    onChange={(e) => setGenForm({ ...genForm, tahunAjaran: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Judul / Nama Tagihan *</label>
                <input
                  type="text"
                  required
                  value={genForm.judul}
                  onChange={(e) => setGenForm({ ...genForm, judul: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    min={1000}
                    required
                    value={genForm.nominalTagihan}
                    onChange={(e) =>
                      setGenForm({ ...genForm, nominalTagihan: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Diskon (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={genForm.diskon}
                    onChange={(e) => setGenForm({ ...genForm, diskon: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={genForm.jatuhTempo}
                    onChange={(e) => setGenForm({ ...genForm, jatuhTempo: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsGenerateOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingGenerate}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingGenerate ? 'Memproses...' : 'Generate Tagihan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL BAYAR / CICIL */}
      {payTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitPayment}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Pembayaran / Cicilan Tagihan
                </h3>
                <p className="text-xs text-slate-500">
                  {payTarget.kodeTagihan} • {payTarget.siswa?.nama}
                </p>
              </div>
              <button type="button" onClick={() => setPayTarget(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Judul Tagihan:</span>
                <span className="font-bold">{payTarget.judul}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sisa Kewajiban:</span>
                <span className="font-mono font-black text-rose-600">
                  {formatRupiah(payTarget.sisaTagihan)}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold">Nominal Dibayar Sekarang (Rp) *</label>
                  {payTarget.jenis?.bolehCicil && (
                    <button
                      type="button"
                      onClick={() =>
                        setPayForm({ ...payForm, nominalBayar: payTarget.sisaTagihan })
                      }
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Bayar Lunas Penuh
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min={payTarget.jenis?.bolehCicil ? 1000 : payTarget.sisaTagihan}
                  max={payTarget.sisaTagihan}
                  readOnly={!payTarget.jenis?.bolehCicil}
                  value={payForm.nominalBayar}
                  onChange={(e) =>
                    setPayForm({ ...payForm, nominalBayar: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Metode Bayar</label>
                  <SearchableSelect
                    value={payForm.metodeBayar}
                    onChange={(val) => setPayForm({ ...payForm, metodeBayar: val })}
                    options={[
                      { value: 'Tunai', label: 'Tunai (Loket)' },
                      { value: 'Transfer', label: 'Transfer Bank' },
                      { value: 'QRIS', label: 'QRIS Sekolah' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Tanggal Bayar</label>
                  <input
                    type="date"
                    required
                    value={payForm.tanggalBayar}
                    onChange={(e) => setPayForm({ ...payForm, tanggalBayar: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Keterangan (Opsional)</label>
                <input
                  type="text"
                  value={payForm.keterangan}
                  onChange={(e) => setPayForm({ ...payForm, keterangan: e.target.value })}
                  placeholder="Contoh: Angsuran ke-1"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPayTarget(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingPay}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingPay ? 'Memproses...' : 'Catat Pembayaran'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL RIWAYAT CICILAN & CETAK KUITANSI */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Riwayat Cicilan &amp; Bukti Pembayaran
                </h3>
                <p className="text-xs font-mono text-blue-600">
                  {historyTarget.kodeTagihan} • {historyTarget.siswa?.nama}
                </p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak</span>
                </button>
                <button onClick={() => setHistoryTarget(null)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
              <div>
                <span className="text-slate-500 block">Wajib Bayar</span>
                <strong className="font-mono">{formatRupiah(historyTarget.wajibBayar)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Sudah Terbayar</span>
                <strong className="font-mono text-emerald-700">
                  {formatRupiah(historyTarget.totalTerbayar)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Sisa Kewajiban</span>
                <strong className="font-mono text-rose-600">
                  {formatRupiah(historyTarget.sisaTagihan)}
                </strong>
              </div>
            </div>

            {!historyTarget.pembayaran || historyTarget.pembayaran.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Belum ada transaksi pembayaran yang masuk untuk tagihan ini.
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b">
                  <tr>
                    <th className="px-3 py-2">No. Transaksi &amp; Tgl</th>
                    <th className="px-3 py-2">Metode</th>
                    <th className="px-3 py-2 text-right">Nominal</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-right print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {historyTarget.pembayaran.map((p: any) => (
                    <tr key={p.id} className={p.status === 'void' ? 'opacity-50 line-through' : ''}>
                      <td className="px-3 py-2">
                        <div className="font-mono font-bold text-slate-800">{p.noTransaksi}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(p.tanggalBayar).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-3 py-2">{p.metodeBayar}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">
                        {formatRupiah(p.nominalBayar)}
                      </td>
                      <td className="px-3 py-2 text-center uppercase text-[10px] font-bold">
                        {p.status}
                      </td>
                      <td className="px-3 py-2 text-right print:hidden">
                        {allowDelete && p.status === 'sah' && (
                          <button
                            onClick={() => handleVoidPayment(p.id, p.noTransaksi)}
                            className="inline-flex items-center gap-1 rounded border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Void</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL MASTER JENIS TAGIHAN */}
      {isJenisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveJenis}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingJenis ? 'Edit Pos Tagihan' : 'Tambah Pos Tagihan'}
              </h3>
              <button type="button" onClick={() => setIsJenisModalOpen(false)}>
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
                    value={jenisForm.kode}
                    onChange={(e) => setJenisForm({ ...jenisForm, kode: e.target.value })}
                    placeholder="UGD-01"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Nominal Default (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={jenisForm.nominalDefault}
                    onChange={(e) =>
                      setJenisForm({ ...jenisForm, nominalDefault: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Nama Pos Tagihan *</label>
                <input
                  type="text"
                  required
                  value={jenisForm.nama}
                  onChange={(e) => setJenisForm({ ...jenisForm, nama: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="bolehCicil"
                  type="checkbox"
                  checked={jenisForm.bolehCicil}
                  onChange={(e) => setJenisForm({ ...jenisForm, bolehCicil: e.target.checked })}
                />
                <label htmlFor="bolehCicil" className="font-bold">
                  Boleh Dibayar Secara Cicilan / Angsuran
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsJenisModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingJenis}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingJenis ? 'Menyimpan...' : 'Simpan Pos Tagihan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

