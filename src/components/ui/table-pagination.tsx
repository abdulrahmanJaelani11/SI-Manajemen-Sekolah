'use client'

import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

export interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  className?: string
  compact?: boolean
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  className = '',
  compact = false,
}: TablePaginationProps) {
  if (totalItems <= 0) {
    return null
  }

  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1))
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems)

  // Generate page numbers with intelligent sliding window & ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      let start = Math.max(2, safeCurrentPage - 1)
      let end = Math.min(totalPages - 1, safeCurrentPage + 1)

      if (safeCurrentPage <= 3) {
        start = 2
        end = 4
      } else if (safeCurrentPage >= totalPages - 2) {
        start = totalPages - 3
        end = totalPages - 1
      }

      if (start > 2) {
        pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push('...')
      }

      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl text-xs text-slate-600 dark:text-slate-400 select-none ${className}`}
    >
      {/* Kiri: Info Data & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <p className="font-medium text-slate-600 dark:text-slate-400">
          Menampilkan <span className="font-bold text-slate-900 dark:text-white">{startItem}</span> -{' '}
          <span className="font-bold text-slate-900 dark:text-white">{endItem}</span> dari{' '}
          <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> data
        </p>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="hidden md:inline text-slate-500 dark:text-slate-400">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value)
                onPageSizeChange(newSize)
                onPageChange(1)
              }}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} baris
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanan: Navigasi Halaman */}
      <div className="flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end">
        {/* Tombol First Page */}
        <button
          type="button"
          disabled={safeCurrentPage === 1}
          onClick={() => onPageChange(1)}
          title="Halaman Pertama"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Tombol Prev Page */}
        <button
          type="button"
          disabled={safeCurrentPage === 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          title="Halaman Sebelumnya"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Nomor Halaman */}
        <div className="flex items-center gap-1 px-1">
          {compact ? (
            <span className="px-2 font-bold text-slate-800 dark:text-slate-200">
              {safeCurrentPage} / {totalPages || 1}
            </span>
          ) : (
            getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-slate-400 select-none"
                  >
                    ...
                  </span>
                )
              }

              const pageNum = Number(p)
              const isActive = pageNum === safeCurrentPage

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })
          )}
        </div>

        {/* Tombol Next Page */}
        <button
          type="button"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          title="Halaman Selanjutnya"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Tombol Last Page */}
        <button
          type="button"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Halaman Terakhir"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
export default TablePagination
