'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import { GraduationCap } from 'lucide-react'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface JenjangDonutChartProps {
  jenjangList: {
    id: number
    kode: string
    nama: string
    totalSiswa: number
  }[]
  totalSiswa: number
}

const COLOR_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

export default function JenjangDonutChart({
  jenjangList,
  totalSiswa,
}: JenjangDonutChartProps) {
  const labels = jenjangList?.map((j) => j.kode) || ['SD', 'SMP', 'SMA']
  const series = jenjangList?.map((j) => j.totalSiswa) || [0, 0, 0]
  const colors = COLOR_PALETTE.slice(0, Math.max(labels.length, 1))

  // Jika semua siswa 0, berikan representasi aman
  const hasData = series.some((val) => val > 0)
  const safeSeries = hasData ? series : [1]
  const safeLabels = hasData ? labels : ['Belum Ada Data']
  const safeColors = hasData ? colors : ['#cbd5e1']

  const chartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 220,
      fontFamily: 'inherit',
    },
    labels: safeLabels,
    colors: safeColors,
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '11px',
              fontFamily: 'inherit',
              fontWeight: 600,
              color: '#64748b',
              offsetY: -4,
            },
            value: {
              show: true,
              fontSize: '18px',
              fontFamily: 'monospace',
              fontWeight: 800,
              color: '#0f172a',
              offsetY: 4,
              formatter: (val) => `${val} Siswa`,
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total Siswa',
              fontSize: '10px',
              fontFamily: 'inherit',
              fontWeight: 700,
              color: '#64748b',
              formatter: () => `${totalSiswa || 0}`,
            },
          },
        },
      },
    },
    stroke: {
      width: 2,
      colors: ['#ffffff'],
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => `${val} Siswa Aktif`,
      },
    },
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Distribusi Jenjang Sekolah
            </h3>
            <p className="text-xs text-slate-500">Komposisi peserta didik aktif per tingkatan</p>
          </div>
        </div>
      </div>

      {/* Donut Chart */}
      <div className="py-2 flex items-center justify-center">
        <Chart options={chartOptions} series={safeSeries} type="donut" height={210} width="100%" />
      </div>

      {/* Legend & Breakdown List */}
      <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        {jenjangList?.map((j, idx) => {
          const total = totalSiswa || 1
          const pct = Math.round((j.totalSiswa / total) * 100)
          const color = COLOR_PALETTE[idx % COLOR_PALETTE.length]

          return (
            <div key={j.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {j.kode} <span className="text-slate-400 font-normal">({j.nama})</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {j.totalSiswa}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
