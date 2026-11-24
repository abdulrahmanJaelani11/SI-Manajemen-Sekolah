import React from 'react'

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse p-1 select-none">
      {/* 1. Header Page Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          {/* Breadcrumb / Category Tag */}
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
          {/* Page Title */}
          <div className="h-8 w-64 md:w-80 bg-slate-300 dark:bg-slate-700 rounded-xl" />
          {/* Subtitle / Description */}
          <div className="h-4 w-48 md:w-96 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-36 bg-blue-200 dark:bg-blue-900/40 rounded-xl" />
        </div>
      </div>

      {/* 2. Stat Cards Skeleton (4 Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="h-7 w-24 bg-slate-300 dark:bg-slate-700 rounded-lg" />
            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        ))}
      </div>

      {/* 3. Filter & Search Bar Skeleton */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="h-10 w-full md:w-72 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="h-10 w-36 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-36 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* 4. Data Table Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="h-12 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between gap-4">
          <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-44 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded hidden md:block" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded hidden sm:block" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>

        {/* Table Rows (6 Shimmer Rows) */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="px-6 py-4 flex items-center justify-between gap-4"
            >
              <div className="h-4 w-8 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="flex items-center gap-3 w-44">
                <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded hidden md:block" />
              <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full hidden sm:block" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Table Footer / Pagination Skeleton */}
        <div className="h-14 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
