'use client'

import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  Printer,
  X,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Building2,
  Layers,
  Sparkles,
} from 'lucide-react'
import SearchableSelect from '@/components/ui/searchable-select'

export interface AssetLabelItem {
  id: number
  kodeBarang: string
  namaBarang: string
  merk?: string | null
  noSeri?: string | null
  tahunPengadaan?: number | null
  sumberDana?: string | null
  namaRuangan?: string | null
  gedung?: string | null
}

interface LabelAsetModalProps {
  isOpen: boolean
  onClose: () => void
  items: AssetLabelItem[]
  schoolName?: string
}

export default function LabelAsetModal({
  isOpen,
  onClose,
  items,
  schoolName = 'SMK BAKTI DARMA',
}: LabelAsetModalProps) {
  const [qrMap, setQrMap] = useState<Record<string, string>>({})
  const [loadingQr, setLoadingQr] = useState(true)
  const [copiesPerItem, setCopiesPerItem] = useState(1)
  const [labelSize, setLabelSize] = useState<'a4_grid' | 'thermal'>('a4_grid')

  // Generate QR Codes for each asset
  useEffect(() => {
    if (!isOpen || items.length === 0) return

    setLoadingQr(true)
    const map: Record<string, string> = {}

    Promise.all(
      items.map(async (item) => {
        try {
          const url = await QRCode.toDataURL(`AST:${item.kodeBarang}`, {
            width: 256,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: { dark: '#0f172a', light: '#ffffff' },
          })
          map[item.kodeBarang] = url
        } catch (e) {
          console.error('Error generating QR for', item.kodeBarang, e)
        }
      })
    ).then(() => {
      setQrMap(map)
      setLoadingQr(false)
    })
  }, [isOpen, items])

  if (!isOpen || items.length === 0) return null

  // Generate full list considering copies
  const allLabels: AssetLabelItem[] = []
  items.forEach((item) => {
    for (let i = 0; i < copiesPerItem; i++) {
      allLabels.push(item)
    }
  })

  // Handle Isolated Window Print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      alert('Pop-up jendela cetak diblokir oleh browser. Harap izinkan pop-up untuk mencetak label aset.')
      return
    }

    const isGrid = labelSize === 'a4_grid'

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Cetak Label QR Aset Inventaris - ${schoolName}</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            padding: ${isGrid ? '8mm' : '0'};
          }
          @page {
            size: ${isGrid ? 'A4 portrait' : '60mm 40mm'};
            margin: ${isGrid ? '6mm' : '0'};
          }
          .grid-container {
            display: grid;
            grid-template-columns: ${isGrid ? 'repeat(2, 1fr)' : '1fr'};
            gap: ${isGrid ? '4mm' : '0'};
          }
          .label-card {
            border: 1px dashed #64748b;
            border-radius: 6px;
            padding: 2.5mm 3mm;
            page-break-inside: avoid;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: ${isGrid ? '48mm' : '38mm'};
          }
          .label-header {
            border-bottom: 1.5px solid #0f172a;
            padding-bottom: 1mm;
            margin-bottom: 1.5mm;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .label-title {
            font-size: 7.5pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #0f172a;
          }
          .label-badge {
            font-size: 6pt;
            font-weight: 700;
            padding: 1px 4px;
            border-radius: 3px;
            background: #e2e8f0;
            color: #334155;
          }
          .label-body {
            display: flex;
            align-items: center;
            gap: 2.5mm;
            flex: 1;
          }
          .qr-box {
            width: 25mm;
            height: 25mm;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-box img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .info-box {
            flex: 1;
            min-width: 0;
          }
          .kode-aset {
            font-family: monospace;
            font-size: 9pt;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.5px;
            margin-bottom: 1mm;
          }
          .nama-aset {
            font-size: 8pt;
            font-weight: 700;
            color: #1e293b;
            line-height: 1.2;
            max-height: 2.4em;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .sub-info {
            font-size: 6.5pt;
            color: #475569;
            margin-top: 1mm;
            line-height: 1.3;
          }
          .sub-info strong {
            color: #0f172a;
          }
          .label-footer {
            margin-top: 1.5mm;
            padding-top: 1mm;
            border-top: 0.5px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            font-size: 5.5pt;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="grid-container">
          ${allLabels
            .map((b) => {
              const qr = qrMap[b.kodeBarang] || ''
              return `
              <div class="label-card">
                <div class="label-header">
                  <span class="label-title">INVENTARIS ASET • ${schoolName}</span>
                  <span class="label-badge">${b.sumberDana || 'ASET SEKOLAH'}</span>
                </div>
                <div class="label-body">
                  <div class="qr-box">
                    <img src="${qr}" alt="${b.kodeBarang}" />
                  </div>
                  <div class="info-box">
                    <div class="kode-aset">${b.kodeBarang}</div>
                    <div class="nama-aset">${b.namaBarang}</div>
                    <div class="sub-info">
                      ${b.merk ? `<div>Merk: <strong>${b.merk}</strong></div>` : ''}
                      <div>Lokasi: <strong>${b.namaRuangan || 'Umum'}</strong> ${b.gedung ? `(${b.gedung})` : ''}</div>
                      <div>Tahun: <strong>${b.tahunPengadaan || '-'}</strong></div>
                    </div>
                  </div>
                </div>
                <div class="label-footer">
                  <span>Scan QR untuk validasi sarpras</span>
                  <span>MILIK RESMI SEKOLAH</span>
                </div>
              </div>
            `
            })
            .join('')}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Pratinjau & Cetak Label QR Aset Sarpras
              </h3>
              <p className="text-xs text-gray-400">
                Mencetak label stiker identitas fisik dengan QR Code siap tempel pada barang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Format Lembar Cetak
            </label>
            <SearchableSelect
              options={[
                { value: 'a4_grid', label: 'Lembar A4 Grid Stiker', sublabel: '2 Kolom rapi per halaman' },
                { value: 'thermal', label: 'Label Stiker Satuan / Thermal', sublabel: 'Ukuran 60mm x 40mm' },
              ]}
              value={labelSize}
              onChange={(val) => setLabelSize((val as 'a4_grid' | 'thermal') || 'a4_grid')}
              placeholder="Pilih Format..."
              searchPlaceholder="Cari format..."
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Jumlah Salinan per Aset
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={copiesPerItem}
              onChange={(e) => setCopiesPerItem(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Live Preview of Labels */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            Pratinjau Desain Stiker ({items.length} item dipilih • {allLabels.length} total label cetak):
          </span>

          {loadingQr ? (
            <div className="p-8 text-center text-xs text-gray-400">
              Menyiapkan QR Code aset...
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allLabels.slice(0, 4).map((b, idx) => (
                <div
                  key={`${b.id}-${idx}`}
                  className="bg-white text-gray-900 p-3 rounded-lg border border-dashed border-gray-400 shadow-xs flex flex-col justify-between"
                  style={{ minHeight: '130px' }}
                >
                  <div className="flex justify-between items-center border-b border-gray-900 pb-1 mb-1.5 text-[9px] font-bold">
                    <span>INVENTARIS ASET • {schoolName}</span>
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[8px]">{b.sumberDana || 'BOS'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 bg-white border border-gray-200 rounded p-0.5 flex-shrink-0 flex items-center justify-center">
                      {qrMap[b.kodeBarang] ? (
                        <img src={qrMap[b.kodeBarang]} alt={b.kodeBarang} className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-[8px] text-gray-400">QR Loading</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-bold text-[11px] text-gray-900 leading-none">{b.kodeBarang}</div>
                      <div className="font-bold text-[10px] text-gray-800 line-clamp-1 mt-0.5">{b.namaBarang}</div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        {b.merk && <span>{b.merk} • </span>}
                        <span>{b.namaRuangan || 'Umum'}</span>
                      </div>
                      <div className="text-[8px] text-gray-400 mt-0.5">Pengadaan: {b.tahunPengadaan || '-'}</div>
                    </div>
                  </div>

                  <div className="mt-1.5 pt-1 border-t border-gray-200 flex justify-between text-[7px] text-gray-500">
                    <span>Scan untuk info spesifikasi</span>
                    <span>HAK MILIK SEKOLAH</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {allLabels.length > 4 && (
            <p className="text-[11px] text-gray-400 italic text-center">
              + {allLabels.length - 4} label lainnya akan otomatis diikutsertakan dalam dokumen cetak.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
          <span className="text-gray-400">Siapkan kertas stiker A4 atau label thermal sebelum mencetak.</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={loadingQr}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-xs disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Buka Dialog Cetak ({allLabels.length} Label)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

