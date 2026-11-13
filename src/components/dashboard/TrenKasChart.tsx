'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import { formatRupiah } from '@/lib/terbilang'
import { BarChart3, TrendingUp, Calendar } from 'lucide-react'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface TrenKasChartProps {
  data: {
    bulan: string
    urutan: number
    nominal: number
  }[]
  totalPenerimaan: number
  tahunAjaran?: string
}

export default function TrenKasChart({ data, totalPenerimaan, tahunAjaran = '2024/2025' }: TrenKasChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar')

  const categories = data?.map((d) => d.bulan) || [
    'Juli', 'Ags', 'Sep', 'Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'
  ]
  const seriesData = data?.map((d) => d.nominal) || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  const chartOptions: ApexOptions = {
    chart: {
      type: chartType,
      height: 290,
      fontFamily: 'inherit',
      toolbar: { show: false },
      zoom: { enabled: false },
      dropShadow: chartType === 'area' ? {
        enabled: true,
        top: 4,
        left: 0,
        blur: 4,
        opacity: 0.15,
        color: '#3b82f6',
      } : undefined,
    },
    colors: ['#3b82f6'],
    fill: {
      type: chartType === 'area' ? 'gradient' : 'solid',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 95, 100],
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '42%',
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: chartType === 'area' ? 3 : 0,
      colors: ['#3b82f6'],
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '11px',
          fontWeight: 500,
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b',
          fontSize: '11px',
        },
        formatter: (val) => {
          if (val >= 1000000) return `${(val / 1000000).toFixed(1)} jt`
          if (val >= 1000) return `${Math.round(val / 1000)} rb`
          return `${val}`
        },
      },
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val) => formatRupiah(val),
        title: {
          formatter: () => 'Kas Terkumpul: ',
        },
      },
    },
  }

  const series = [
    {
      name: 'Realisasi Kas SPP',
      data: seriesData,
    },
  ]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
      {/* Header Grafik */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tren Realisasi Kas Masuk SPP (12 Bulan)
              </h3>
              <p className="text-xs text-slate-500">
                Penerimaan iuran bulanan tahun ajaran {tahunAjaran} (Juli s.d. Juni)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Type */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 text-xs">
            <button
              onClick={() => setChartType('bar')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                chartType === 'bar'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Batang
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                chartType === 'area'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Kurva
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900">
            <span>Total: {formatRupiah(totalPenerimaan || 0)}</span>
          </div>
        </div>
      </div>

      {/* Area Render Chart */}
      <div className="pt-4 -ml-3">
        <Chart options={chartOptions} series={series} type={chartType} height={290} />
      </div>

      {/* Catatan / Keterangan Kaki */}
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            <span>Realisasi Kas Masuk (Lunas)</span>
          </div>
        </div>
        <span className="text-slate-400">Data otomatis terupdate dari kasir</span>
      </div>
    </div>
  )
}
