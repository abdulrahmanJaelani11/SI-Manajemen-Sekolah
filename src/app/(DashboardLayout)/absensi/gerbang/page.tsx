'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import {
  QrCode,
  Camera,
  CameraOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Users,
  Sliders,
  X,
  ScanLine,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { usePermission } from '@/context/PermissionContext'
import QrScannerModal from '@/components/spp/QrScannerModal'

export default function PresensiGerbangPage() {
  const { canCreate, canEdit } = usePermission()
  const allowCreate = canCreate('/absensi/gerbang')
  const allowEdit = canEdit('/absensi/gerbang')

  const [loading, setLoading] = useState(true)
  const [scanMode, setScanMode] = useState<'auto' | 'masuk' | 'pulang'>('auto')
  const [liveTime, setLiveTime] = useState('')
  const [tanggal, setTanggal] = useState('')

  // Data
  const [logs, setLogs] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalSiswaAktif: 0,
    totalMasuk: 0,
    totalHadirTepat: 0,
    totalTerlambat: 0,
    totalPulang: 0,
    totalIzinSakitAlpa: 0,
    belumHadir: 0,
  })
  const [pengaturan, setPengaturan] = useState({
    jamMasukSiswa: '07:15',
    batasTerlambatSiswa: 0,
    jamPulangSiswa: '14:00',
    jamMasukPegawai: '07:00',
    jamPulangPegawai: '15:30',
  })

  // Scanner Inputs & Camera
  const [manualInput, setManualInput] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [isInitializingCamera, setIsInitializingCamera] = useState(false)
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [isModalScannerOpen, setIsModalScannerOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<{
    success: boolean
    action?: string
    duplicate?: boolean
    message: string
    siswa?: any
    lateMinutes?: number
    waktuScan?: string
  } | null>(null)

  // Modal Pengaturan Jam
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [configForm, setConfigForm] = useState(pengaturan)
  const [savingConfig, setSavingConfig] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const html5QrRef = useRef<Html5Qrcode | null>(null)
  const isScanningRef = useRef(false)
  const isProcessingRef = useRef(false)
  const lastScannedCodeRef = useRef<{ code: string; mode: string; time: number }>({
    code: '',
    mode: '',
    time: 0,
  })
  const processScanRef = useRef<(rawCode: string) => void>(() => {})

  // Jam digital live WIB
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setLiveTime(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      )
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/absensi/gerbang')
      const json = await res.json()
      if (json.success && json.data) {
        setTanggal(json.data.tanggal)
        setLogs(json.data.logs || [])
        setStats(json.data.stats)
        if (json.data.pengaturan) {
          setPengaturan(json.data.pengaturan)
          setConfigForm(json.data.pengaturan)
        }
      }
    } catch (err) {
      console.error('Fetch gerbang error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    return () => {
      stopCamera()
    }
  }, [])

  // Web Audio Beep Feedback
  const playFeedbackSound = (type: 'ok' | 'late' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      if (type === 'ok') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(987.77, ctx.currentTime) // B5
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      } else if (type === 'late') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(659.25, ctx.currentTime)
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      } else {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        gain.gain.setValueAtTime(0.18, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      }

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
    } catch {
      // ignore audio error
    }
  }

  const processScanCode = async (rawCode: string) => {
    const trimmed = rawCode.trim()
    if (!trimmed || isProcessingRef.current) return

    if (!allowCreate) {
      setLastScanResult({
        success: false,
        message: 'Akses ditolak: akun Anda tidak memiliki izin mencatat presensi gerbang.',
      })
      return
    }

    // Cooldown 3 detik untuk kartu + mode yang sama agar kamera kiosk tidak spam
    const now = Date.now()
    if (
      lastScannedCodeRef.current.code === trimmed &&
      lastScannedCodeRef.current.mode === scanMode &&
      now - lastScannedCodeRef.current.time < 3000
    ) {
      return
    }
    lastScannedCodeRef.current = { code: trimmed, mode: scanMode, time: now }

    isProcessingRef.current = true
    setIsProcessing(true)
    try {
      const res = await fetch('/api/absensi/gerbang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed, mode: scanMode }),
      })
      const json = await res.json()

      if (json.success && json.data) {
        const isLate = (json.data.lateMinutes || 0) > 0
        playFeedbackSound(isLate ? 'late' : 'ok')
        setLastScanResult({
          success: true,
          action: json.data.action,
          duplicate: json.data.duplicate,
          message: json.message,
          siswa: json.data.siswa,
          lateMinutes: json.data.lateMinutes,
          waktuScan: json.data.waktuScan,
        })
        await fetchData()
      } else {
        playFeedbackSound('error')
        setLastScanResult({
          success: false,
          message: json.message || 'Kartu QR tidak dikenali',
        })
      }
    } catch (err: any) {
      playFeedbackSound('error')
      setLastScanResult({
        success: false,
        message: 'Terjadi kesalahan koneksi: ' + err.message,
      })
    } finally {
      isProcessingRef.current = false
      setIsProcessing(false)
      setManualInput('')
      inputRef.current?.focus()
    }
  }

  // Pastikan callback kamera selalu memanggil versi terbaru processScanCode (tidak stale closure)
  useEffect(() => {
    processScanRef.current = processScanCode
  })

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      processScanCode(manualInput)
    }
  }

  // Kiosk Continuous Camera Scanner (disamakan dengan engine QrScannerModal Kasir SPP)
  const stopCamera = async () => {
    if (html5QrRef.current && isScanningRef.current) {
      try {
        isScanningRef.current = false
        await html5QrRef.current.stop()
        html5QrRef.current.clear()
      } catch {
        // ignore stop error
      }
    }
    html5QrRef.current = null
    setCameraActive(false)
  }

  const startCameraWithId = async (cameraId?: string) => {
    setCameraError(null)
    setIsInitializingCamera(true)
    try {
      await stopCamera()
      const scannerId = 'gate-qr-reader'
      const el = document.getElementById(scannerId)
      if (!el) return

      const qr = new Html5Qrcode(scannerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      })
      html5QrRef.current = qr

      const cameraConfig = cameraId
        ? { deviceId: { exact: cameraId } }
        : { facingMode: 'environment' }

      await qr.start(
        cameraConfig,
        {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.max(
              180,
              Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72)
            )
            return { width: size, height: size }
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          processScanRef.current(decodedText)
        },
        () => {}
      )
      isScanningRef.current = true
      setCameraActive(true)
    } catch (err: any) {
      console.error('Camera error:', err)
      isScanningRef.current = false
      setCameraError(err?.message || 'Kamera tidak dapat diakses. Periksa izin browser.')
      setCameraActive(false)
    } finally {
      setIsInitializingCamera(false)
    }
  }

  const startCamera = async () => {
    setCameraError(null)
    setIsInitializingCamera(true)
    try {
      const devices = await Html5Qrcode.getCameras()
      if (devices && devices.length > 0) {
        setCameras(devices)
        const existingValid = devices.find((d) => d.id === selectedCameraId)
        const backCam = devices.find((d) => /back|rear|environment/i.test(d.label))
        const chosenId = existingValid
          ? existingValid.id
          : backCam
            ? backCam.id
            : devices[0].id
        setSelectedCameraId(chosenId)
        await startCameraWithId(chosenId)
      } else {
        await startCameraWithId()
      }
    } catch {
      // Fallback langsung bila getCameras() ditolak sebelum izin muncul
      await startCameraWithId(selectedCameraId || undefined)
    }
  }

  const handleCameraChange = async (newCameraId: string) => {
    setSelectedCameraId(newCameraId)
    await startCameraWithId(newCameraId)
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingConfig(true)
    try {
      const res = await fetch('/api/absensi/gerbang', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm),
      })
      const json = await res.json()
      if (json.success) {
        setPengaturan(json.data)
        setIsConfigOpen(false)
      } else {
        alert(json.message || 'Gagal menyimpan pengaturan')
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSavingConfig(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Presensi Gerbang (Scan QR Kartu Pelajar)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Terminal kiosk presensi harian otomatis menggunakan kamera maupun scanner USB barcode/QR.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-mono font-bold text-slate-800 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>{liveTime || '--:--:--'} WIB</span>
          </div>

          {allowEdit && (
            <button
              onClick={() => setIsConfigOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <Sliders className="h-4 w-4 text-blue-600" />
              <span>Jam Masuk: {pengaturan.jamMasukSiswa}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-emerald-500">
          <span className="text-xs font-medium text-slate-500">Hadir Masuk</span>
          <p className="mt-1 text-2xl font-black text-emerald-600">
            {stats.totalMasuk}{' '}
            <span className="text-xs font-medium text-slate-400">
              / {stats.totalSiswaAktif}
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-amber-500">
          <span className="text-xs font-medium text-slate-500">Terlambat</span>
          <p className="mt-1 text-2xl font-black text-amber-600">{stats.totalTerlambat} Siswa</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-blue-500">
          <span className="text-xs font-medium text-slate-500">Sudah Pulang</span>
          <p className="mt-1 text-2xl font-black text-blue-600">{stats.totalPulang} Siswa</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 border-t-4 border-t-slate-400">
          <span className="text-xs font-medium text-slate-500">Belum Hadir / S/I/A</span>
          <p className="mt-1 text-2xl font-black text-slate-700 dark:text-slate-200">
            {stats.belumHadir} Siswa
          </p>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KIRI: TERMINAL SCANNER (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
          {/* Mode Switch */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Mode Pencatatan Scan
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setScanMode('auto')}
                className={`rounded-lg py-2 font-bold transition ${
                  scanMode === 'auto'
                    ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Otomatis
              </button>
              <button
                type="button"
                onClick={() => setScanMode('masuk')}
                className={`rounded-lg py-2 font-bold transition ${
                  scanMode === 'masuk'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Jam Masuk
              </button>
              <button
                type="button"
                onClick={() => setScanMode('pulang')}
                className={`rounded-lg py-2 font-bold transition ${
                  scanMode === 'pulang'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Jam Pulang
              </button>
            </div>
          </div>

          {/* Input Scanner USB / Manual */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Input Scanner USB / Ketik NIS Kartu Pelajar
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-2.5 h-4 w-4 text-blue-600" />
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  disabled={!allowCreate}
                  placeholder="Arahkan kursor di sini lalu scan..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs font-mono font-bold focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={!allowCreate || !manualInput.trim() || isProcessing}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                Catat
              </button>
            </div>
          </form>

          {/* Embedded Camera Scanner */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-blue-600" />
                <span>Kamera Kiosk QR (Otomatis)</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    await stopCamera()
                    setIsModalScannerOpen(true)
                  }}
                  disabled={!allowCreate}
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  title="Gunakan scanner pop-up (sama seperti Kasir SPP)"
                >
                  <ScanLine className="h-3.5 w-3.5" />
                  <span>Pop-up</span>
                </button>
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={!allowCreate || isInitializingCamera}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{isInitializingCamera ? 'Menyiapkan...' : 'Aktifkan Kamera'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700"
                  >
                    <CameraOff className="h-3.5 w-3.5" />
                    <span>Matikan</span>
                  </button>
                )}
              </div>
            </div>

            {/* Camera Selector (jika terdeteksi > 1 kamera atau setelah kamera aktif) */}
            {cameras.length > 1 && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800/50">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Kamera:</span>
                </span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="flex-1 max-w-[220px] rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Kamera ${c.id.substring(0, 6)}...`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative w-full max-w-[320px] aspect-square mx-auto overflow-hidden rounded-2xl bg-black border-2 border-slate-200 dark:border-slate-700 shadow-inner flex items-center justify-center">
              <div
                id="gate-qr-reader"
                className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
              />

              {/* Laser Bidik Overlay saat kamera aktif */}
              {cameraActive && !cameraError && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="relative h-[220px] w-[220px] rounded-xl border-2 border-dashed border-blue-400/70">
                    <div className="absolute -top-1 -left-1 h-4 w-4 border-t-3 border-l-3 border-blue-500" />
                    <div className="absolute -top-1 -right-1 h-4 w-4 border-t-3 border-r-3 border-blue-500" />
                    <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-3 border-l-3 border-blue-500" />
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-3 border-r-3 border-blue-500" />
                    <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-scanline" />
                  </div>
                </div>
              )}

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-400">
                  <QrCode className="h-12 w-12 text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-300">
                    {isInitializingCamera ? 'Menghubungkan Kamera...' : 'Kamera Scanner Nonaktif'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Klik &quot;Aktifkan Kamera&quot; untuk memindai berkelanjutan, atau &quot;Pop-up&quot; untuk modal scanner.
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                {cameraError}
              </div>
            )}
          </div>
        </div>

        {/* KANAN: KARTU HASIL SCAN TERAKHIR & LIVE FEED (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Last Scan Highlight Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Status Pemindaian Terakhir
            </h3>

            {!lastScanResult ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center dark:border-slate-800">
                <Sparkles className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-500">
                  Menunggu scan QR Kartu Pelajar pertama hari ini...
                </p>
              </div>
            ) : !lastScanResult.success ? (
              <div className="flex items-center gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                <AlertCircle className="h-10 w-10 text-rose-600 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-extrabold">Pemindaian Gagal</h4>
                  <p className="text-xs mt-0.5">{lastScanResult.message}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl overflow-hidden border border-slate-200 bg-white flex-shrink-0 flex items-center justify-center">
                    {lastScanResult.siswa?.fotoUrl ? (
                      <img
                        src={lastScanResult.siswa.fotoUrl}
                        alt={lastScanResult.siswa.nama}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-black text-blue-600">
                        {lastScanResult.siswa?.nama?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {lastScanResult.siswa?.nama}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      NIS: {lastScanResult.siswa?.nis} •{' '}
                      {lastScanResult.siswa?.jenjang?.kode}{' '}
                      {lastScanResult.siswa?.kelas?.namaKelas || '-'}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {lastScanResult.message}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right flex-shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
                      lastScanResult.duplicate
                        ? 'bg-slate-200 text-slate-700'
                        : lastScanResult.action === 'pulang'
                        ? 'bg-blue-100 text-blue-800'
                        : (lastScanResult.lateMinutes || 0) > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {lastScanResult.action === 'pulang' ? (
                      <LogOut className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {lastScanResult.duplicate
                        ? 'SUDAH TERCATAT'
                        : lastScanResult.action === 'pulang'
                        ? 'PULANG'
                        : (lastScanResult.lateMinutes || 0) > 0
                        ? `TERLAMBAT ${lastScanResult.lateMinutes}m`
                        : 'TEPAT WAKTU'}
                    </span>
                  </span>
                  <span className="block mt-1 font-mono text-xs font-bold text-slate-500">
                    Pukul {lastScanResult.waktuScan} WIB
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Live Feed Hari Ini */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Log Kehadiran Gerbang Hari Ini ({logs.length})
                </h3>
                <p className="text-xs text-slate-500">Tanggal: {tanggal || '-'}</p>
              </div>
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Segarkan</span>
              </button>
            </div>

            {loading ? (
              <div className="p-10 text-center text-xs text-slate-400">Memuat log hari ini...</div>
            ) : logs.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                Belum ada presensi yang tercatat hari ini.
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:bg-slate-800/60 sticky top-0">
                    <tr>
                      <th className="px-5 py-3">Siswa</th>
                      <th className="px-4 py-3">Kelas</th>
                      <th className="px-4 py-3 text-center">Masuk</th>
                      <th className="px-4 py-3 text-center">Pulang</th>
                      <th className="px-5 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {logs.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {l.siswa?.nama}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            NIS: {l.siswa?.nis}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {l.kelas?.jenjang?.kode || l.siswa?.jenjang?.kode}{' '}
                          {l.kelas?.namaKelas || l.siswa?.kelas?.namaKelas || '-'}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-emerald-600">
                          {l.jamMasuk || '-'}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-blue-600">
                          {l.jamPulang || '-'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              l.status === 'hadir'
                                ? 'bg-emerald-100 text-emerald-800'
                                : l.status === 'terlambat'
                                ? 'bg-amber-100 text-amber-800'
                                : l.status === 'sakit'
                                ? 'bg-blue-100 text-blue-800'
                                : l.status === 'izin'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL PENGATURAN JAM PRESENSI */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Pengaturan Jam Masuk & Pulang
              </h3>
              <button
                onClick={() => setIsConfigOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Masuk Siswa
                  </label>
                  <input
                    type="time"
                    value={configForm.jamMasukSiswa}
                    onChange={(e) => setConfigForm({ ...configForm, jamMasukSiswa: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Toleransi Telat (Menit)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={configForm.batasTerlambatSiswa}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, batasTerlambatSiswa: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jam Pulang Siswa
                </label>
                <input
                  type="time"
                  value={configForm.jamPulangSiswa}
                  onChange={(e) => setConfigForm({ ...configForm, jamPulangSiswa: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Masuk Pegawai
                  </label>
                  <input
                    type="time"
                    value={configForm.jamMasukPegawai}
                    onChange={(e) => setConfigForm({ ...configForm, jamMasukPegawai: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Pulang Pegawai
                  </label>
                  <input
                    type="time"
                    value={configForm.jamPulangPegawai}
                    onChange={(e) => setConfigForm({ ...configForm, jamPulangPegawai: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingConfig ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Scanner QR Pop-up (menggunakan komponen yang sama dengan Kasir SPP) */}
      <QrScannerModal
        isOpen={isModalScannerOpen}
        onClose={() => setIsModalScannerOpen(false)}
        onScan={(decodedText) => processScanRef.current(decodedText)}
      />
    </div>
  )
}

