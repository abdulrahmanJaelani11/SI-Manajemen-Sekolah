'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import {
  Camera,
  X,
  ScanLine,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

interface QrScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (decodedText: string) => void
}

export default function QrScannerModal({
  isOpen,
  onClose,
  onScan,
}: QrScannerModalProps) {
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [isInitializing, setIsInitializing] = useState(true)
  const [manualCode, setManualCode] = useState('')

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const isScanningRef = useRef(false)

  // Play cashier beep using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 tone
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15)

      osc.connect(gain)
      gain.connect(audioCtx.destination)

      osc.start()
      osc.stop(audioCtx.currentTime + 0.15)
    } catch (e) {
      // AudioContext not allowed or not supported, ignore gracefully
    }
  }

  // Stop scanner safely
  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        isScanningRef.current = false
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
      } catch (err) {
        console.error('Error stopping QR scanner:', err)
      }
    }
  }

  // Start scanner with specific camera or back camera
  const startScanner = async (cameraId?: string) => {
    try {
      setIsInitializing(true)
      setCameraError(null)

      await stopScanner()

      const scannerId = 'qr-camera-stream'
      const element = document.getElementById(scannerId)
      if (!element) return

      const html5QrCode = new Html5Qrcode(scannerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      })
      html5QrCodeRef.current = html5QrCode

      const cameraConfig = cameraId
        ? { deviceId: { exact: cameraId } }
        : { facingMode: 'environment' }

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 12,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success Callback
          playBeep()
          stopScanner()
          onScan(decodedText)
          onClose()
        },
        () => {
          // Frame callback without QR, ignore
        }
      )

      isScanningRef.current = true
      setIsInitializing(false)
    } catch (err: any) {
      console.error('QR Scanner start error:', err)
      isScanningRef.current = false
      setIsInitializing(false)
      setCameraError(
        err?.message ||
          'Gagal mengakses kamera. Pastikan izin kamera aktif di browser Anda.'
      )
    }
  }

  // Initialize Cameras when Modal Opens
  useEffect(() => {
    if (!isOpen) {
      stopScanner()
      return
    }

    let isMounted = true

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return
        if (devices && devices.length) {
          setCameras(devices)
          // Prefer back/environment camera if available
          const backCam = devices.find((d) =>
            /back|rear|environment/i.test(d.label)
          )
          const chosenId = backCam ? backCam.id : devices[0].id
          setSelectedCameraId(chosenId)
          startScanner(chosenId)
        } else {
          // No cameras enumerated, try default environment
          startScanner()
        }
      })
      .catch((err) => {
        if (!isMounted) return
        console.warn('Could not list cameras, trying default:', err)
        startScanner()
      })

    return () => {
      isMounted = false
      stopScanner()
    }
  }, [isOpen])

  // Handle Switch Camera
  const handleCameraChange = (newCameraId: string) => {
    setSelectedCameraId(newCameraId)
    startScanner(newCameraId)
  }

  // Handle Manual Submit (Fallback)
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    playBeep()
    stopScanner()
    onScan(manualCode.trim())
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pindai QR Kartu Siswa
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Arahkan QR Code kartu pelajar ke dalam kotak pemindai
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopScanner()
              onClose()
            }}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Selector (if multiple) */}
        {cameras.length > 1 && (
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              <span>Pilih Kamera:</span>
            </span>
            <select
              value={selectedCameraId}
              onChange={(e) => handleCameraChange(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Kamera ${c.id.substring(0, 5)}...`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video Scanner Container */}
        <div className="relative flex flex-col items-center justify-center bg-slate-950 p-4">
          <div className="relative w-full max-w-[320px] aspect-square overflow-hidden rounded-2xl bg-black border-2 border-slate-700/60 shadow-inner flex items-center justify-center">
            {/* The element HTML5-qrcode mounts into */}
            <div id="qr-camera-stream" className="w-full h-full object-cover" />

            {/* Scanning Laser Line Overlay */}
            {!cameraError && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative h-[220px] w-[220px] rounded-xl border-2 border-dashed border-blue-400/70">
                  {/* Corner Targets */}
                  <div className="absolute -top-1 -left-1 h-4 w-4 border-t-3 border-l-3 border-blue-500" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 border-t-3 border-r-3 border-blue-500" />
                  <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-3 border-l-3 border-blue-500" />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-3 border-r-3 border-blue-500" />

                  {/* Animated Laser Bar */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-scanline" />
                </div>
              </div>
            )}

            {/* Error Message if camera failed */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white">
                <AlertCircle className="h-10 w-10 text-rose-500 mb-2" />
                <p className="text-xs font-semibold text-rose-400 mb-1">
                  Kamera Tidak Dapat Diakses
                </p>
                <p className="text-[11px] text-slate-300 max-w-xs mb-4">
                  {cameraError}
                </p>
                <button
                  onClick={() => startScanner(selectedCameraId)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Coba Lagi</span>
                </button>
              </div>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-slate-400">
            Posisikan kode QR di dalam bingkai bidik hingga terdengar bunyi konfirmasi
          </p>
        </div>

        {/* Manual Fallback Input */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Atau ketik/paste NIS secara manual..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Proses
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
