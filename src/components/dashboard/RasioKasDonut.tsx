'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import { formatRupiah } from '@/lib/terbilang'
import { PieChart, ShieldCheck, AlertCircle } from 'lucide-react'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface RasioKasDonutProps {
  totalPenerimaan: number
  estimasiTunggakan: number
}

export default function RasioKasDonut({
  totalPenerimaan,
  estimasiTunggakan,
}: RasioKasDonutProps) {
  const total = totalPenerimaan + estimasiTunggakan
  const persenTerbayar = total > 0 ? Math.round((totalPenerimaan / total) * 100) : 0
  const persenTunggakan = total > 0 ? 100 - persenTerbayar : 0

  const series = [totalPenerimaan || 0, estimasiTunggakan || 0]

  const chartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 230,
      fontFamily: 'inherit',
    },
    labels: ['Kas Terhimpun', 'Sisa Piutang / Tunggakan'],
    colors: ['#10b981', '#f43f5e'],
    plotOptions: {
      pie: {
        donut: {
          size: '74%',
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
              formatter: () => `${persenTerbayar}%`,
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Kolektibilitas',
              fontSize: '10px',
              fontFamily: 'inherit',
              fontWeight: 700,
              color: '#64748b',
              formatter: () => `${persenTerbayar}%`,
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
        formatter: (val) => formatRupiah(val),
      },
    },
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Rasio Kolektibilitas Kas
            </h3>
            <p className="text-xs text-slate-500">Perbandingan kas masuk vs tunggakan</p>
          </div>
        </div>
      </div>

      {/* Chart Donut */}
      <div className="py-2 flex items-center justify-center">
        <Chart options={chartOptions} series={series} type="donut" height={220} width="100%" />
      </div>

      {/* Breakdown Legend Detail */}
      <div className="space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-md bg-emerald-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Kas Terhimpun ({persenTerbayar}%)
            </span>
          </div>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formatRupiah(totalPenerimaan || 0)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-md bg-rose-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Sisa Piutang ({persenTunggakan}%)
            </span>
          </div>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
            {formatRupiah(estimasiTunggakan || 0)}
          </span>
        </div>
      </div>
    </div>
  )
}
