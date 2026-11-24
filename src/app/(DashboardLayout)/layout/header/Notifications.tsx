'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { usePermission } from '@/context/PermissionContext'

export interface NotificationItem {
  id: string
  dbId?: number
  category: string
  type: 'danger' | 'warning' | 'info' | 'success'
  title: string
  subtitle: string
  url: string
  isRead: boolean
  isPersistent?: boolean
  count?: number
  createdAt: string
}

const CATEGORY_ICONS: Record<string, string> = {
  'Kesiswaan & PPDB': 'solar:user-plus-bold-duotone',
  'Presensi & Kehadiran': 'solar:calendar-date-bold-duotone',
  'Kedisiplinan & BK': 'solar:shield-warning-bold-duotone',
  'Perpustakaan & Literasi': 'solar:book-bookmark-bold-duotone',
  'Keuangan & Tagihan': 'solar:wallet-money-bold-duotone',
  'Pengumuman': 'solar:megaphone-volume-bold-duotone',
  'Akademik': 'solar:square-academic-cap-bold-duotone',
  'Sistem': 'solar:bell-bing-bold-duotone',
}

const TYPE_STYLES = {
  danger: {
    bg: 'bg-rose-50/80 dark:bg-rose-950/40',
    border: 'border-rose-200/80 dark:border-rose-900/50',
    iconCls: 'bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400',
    badgeCls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    dotCls: 'bg-rose-500',
  },
  warning: {
    bg: 'bg-amber-50/80 dark:bg-amber-950/40',
    border: 'border-amber-200/80 dark:border-amber-900/50',
    iconCls: 'bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400',
    badgeCls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    dotCls: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50/80 dark:bg-blue-950/40',
    border: 'border-blue-200/80 dark:border-blue-900/50',
    iconCls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400',
    badgeCls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    dotCls: 'bg-blue-500',
  },
  success: {
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    border: 'border-emerald-200/80 dark:border-emerald-900/50',
    iconCls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400',
    badgeCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    dotCls: 'bg-emerald-500',
  },
}

function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    if (diffMs < 0) return 'Baru saja'
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) return 'Baru saja'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin} mnt lalu`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour} jam lalu`
    const diffDay = Math.floor(diffHour / 24)
    if (diffDay < 7) return `${diffDay} hr lalu`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

const Notifications = () => {
  const { user } = usePermission()
  const isAdmin =
    user?.roleName?.toLowerCase().includes('admin') ||
    user?.roleName?.toLowerCase().includes('kepala') ||
    user?.roleId === 1

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [readIds, setReadIds] = useState<string[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // State Modal Siaran Pengumuman Baru (Admin)
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    category: 'Pengumuman',
    type: 'info' as 'info' | 'warning' | 'danger' | 'success',
    roleId: '',
    url: '',
  })
  const [broadcastSubmitting, setBroadcastSubmitting] = useState(false)
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null)

  // Load status tersimpan dari localStorage saat mount
  useEffect(() => {
    try {
      const storedRead = localStorage.getItem('sims_read_notifications')
      if (storedRead) {
        setReadIds(JSON.parse(storedRead))
      }
      const storedDismissed = localStorage.getItem('sims_dismissed_notifications')
      if (storedDismissed) {
        setDismissedIds(JSON.parse(storedDismissed))
      }
    } catch {
      // ignore
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const json = await res.json()
      if (json.success && json.data?.notifications) {
        setNotifications(json.data.notifications)
      }
    } catch (err) {
      console.error('Fetch notifications error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    // Polling berkala setiap 60 detik
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Notifikasi yang tidak diabaikan/dismiss
  const visibleNotifications = notifications.filter((n) => !dismissedIds.includes(n.id))

  // Cek apakah item dianggap sudah dibaca (dari database atau localStorage)
  const isItemRead = (item: NotificationItem) => {
    return item.isRead || readIds.includes(item.id)
  }

  const unreadItems = visibleNotifications.filter((n) => !isItemRead(n))
  const unreadCount = unreadItems.length

  const displayedNotifications =
    activeTab === 'unread' ? unreadItems : visibleNotifications

  // Tandai Semua Sudah Dibaca (Sinkronisasi ke Database & Local)
  const markAllAsRead = async () => {
    const allIds = visibleNotifications.map((n) => n.id)
    const updatedRead = Array.from(new Set([...readIds, ...allIds]))
    setReadIds(updatedRead)
    try {
      localStorage.setItem('sims_read_notifications', JSON.stringify(updatedRead))
    } catch {
      // ignore
    }

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      })
    } catch (err) {
      console.error('Failed to sync mark all read:', err)
    }
  }

  // Klik Item Notifikasi -> Tandai Dibaca (Sinkronisasi DB)
  const handleItemClick = async (item: NotificationItem) => {
    if (!isItemRead(item)) {
      const updated = Array.from(new Set([...readIds, item.id]))
      setReadIds(updated)
      try {
        localStorage.setItem('sims_read_notifications', JSON.stringify(updated))
      } catch {
        // ignore
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      )

      if (item.isPersistent || item.id.startsWith('db-')) {
        try {
          await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'mark_read', id: item.id }),
          })
        } catch (err) {
          console.error('Failed to sync mark read:', err)
        }
      }
    }
    setIsOpen(false)
  }

  // Hapus / Abaikan Notifikasi (Sinkronisasi DB jika persisten)
  const handleDismissItem = async (e: React.MouseEvent, item: NotificationItem) => {
    e.preventDefault()
    e.stopPropagation()

    const updated = Array.from(new Set([...dismissedIds, item.id]))
    setDismissedIds(updated)
    try {
      localStorage.setItem('sims_dismissed_notifications', JSON.stringify(updated))
    } catch {
      // ignore
    }

    setNotifications((prev) => prev.filter((n) => n.id !== item.id))

    if (item.isPersistent || item.id.startsWith('db-')) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id: item.id }),
        })
      } catch (err) {
        console.error('Failed to delete notification:', err)
      }
    }
  }

  // Submit Siaran Notifikasi Baru oleh Admin
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) return

    setBroadcastSubmitting(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastForm.title,
          message: broadcastForm.message,
          category: broadcastForm.category,
          type: broadcastForm.type,
          roleId: broadcastForm.roleId ? Number(broadcastForm.roleId) : null,
          url: broadcastForm.url.trim() || null,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setBroadcastSuccess('Pengumuman berhasil disiarkan ke seluruh target pengguna!')
        setBroadcastForm({
          title: '',
          message: '',
          category: 'Pengumuman',
          type: 'info',
          roleId: '',
          url: '',
        })
        fetchNotifications()
        setTimeout(() => {
          setBroadcastSuccess(null)
          setIsBroadcastOpen(false)
        }, 1500)
      } else {
        alert(json.message || 'Gagal menyiarkan pengumuman')
      }
    } catch (err) {
      console.error('Broadcast error:', err)
      alert('Terjadi kesalahan saat menyiarkan pengumuman')
    } finally {
      setBroadcastSubmitting(false)
    }
  }

  return (
    <>
      <div className='relative group/menu px-2 sm:px-3'>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              className='relative h-10 w-10 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition outline-none select-none cursor-pointer'
              title='Pemberitahuan Sistem'>
              <Icon
                icon={unreadCount > 0 ? 'tabler:bell-ringing' : 'tabler:bell'}
                height={21}
                width={21}
                className={unreadCount > 0 ? 'text-blue-600 dark:text-blue-400' : ''}
              />

              {/* Dynamic Notification Badge */}
              {unreadCount > 0 && (
                <span className='absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center px-1 rounded-full bg-rose-600 text-white text-[10px] font-black font-mono shadow-xs border-2 border-white dark:border-slate-900 animate-in zoom-in-50 duration-200'>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align='end'
            className='w-[calc(100vw-32px)] sm:w-[410px] p-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150'>
            {/* Header Dropdown */}
            <div className='px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40'>
              <div className='flex items-center gap-2'>
                <h3 className='text-sm font-bold text-slate-900 dark:text-white'>
                  Pusat Notifikasi
                </h3>
                {unreadCount > 0 ? (
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'>
                    {unreadCount} baru
                  </span>
                ) : (
                  <span className='px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'>
                    Semua terbaca
                  </span>
                )}
              </div>

              <div className='flex items-center gap-1.5'>
                {/* Tombol Buat Siaran khusus Admin */}
                {isAdmin && (
                  <button
                    type='button'
                    onClick={() => {
                      setIsOpen(false)
                      setIsBroadcastOpen(true)
                    }}
                    className='text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer'
                    title='Buat Siaran Pengumuman Baru'>
                    <Icon icon='solar:megaphone-volume-bold' height={13} width={13} />
                    <span>Siarkan</span>
                  </button>
                )}

                {unreadCount > 0 && (
                  <button
                    type='button'
                    onClick={markAllAsRead}
                    className='text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 rounded-md transition cursor-pointer'>
                    Tandai dibaca
                  </button>
                )}

                <button
                  type='button'
                  onClick={() => fetchNotifications()}
                  className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer ${
                    loading ? 'animate-spin text-blue-600' : ''
                  }`}
                  title='Segarkan Notifikasi'>
                  <Icon icon='solar:restart-linear' height={15} width={15} />
                </button>
              </div>
            </div>

            {/* Filter Tab: Semua vs Belum Dibaca */}
            <div className='flex items-center gap-2 px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs'>
              <button
                type='button'
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}>
                <span>Semua</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === 'all'
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                  {visibleNotifications.length}
                </span>
              </button>

              <button
                type='button'
                onClick={() => setActiveTab('unread')}
                className={`px-3 py-1 rounded-full font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'unread'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}>
                <span>Belum Dibaca</span>
                {unreadCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      activeTab === 'unread'
                        ? 'bg-white text-blue-700'
                        : 'bg-rose-500 text-white'
                    }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* List Notifikasi */}
            <SimpleBar className='max-h-[380px]'>
              {displayedNotifications.length === 0 ? (
                <div className='p-8 text-center flex flex-col items-center justify-center space-y-2.5'>
                  <div className='h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs'>
                    <Icon icon='solar:check-circle-bold' height={28} width={28} />
                  </div>
                  <div className='space-y-0.5'>
                    <p className='text-xs font-bold text-slate-800 dark:text-slate-200'>
                      {activeTab === 'unread'
                        ? 'Semua Sudah Dibaca'
                        : 'Tidak Ada Pemberitahuan Penting'}
                    </p>
                    <p className='text-[11px] text-slate-500 dark:text-slate-400 max-w-[250px] leading-relaxed'>
                      {activeTab === 'unread'
                        ? 'Tidak ada notifikasi baru yang belum dibaca saat ini.'
                        : 'Semua operasional kesiswaan, presensi, dan keuangan berjalan lancar.'}
                    </p>
                    {activeTab === 'unread' && visibleNotifications.length > 0 && (
                      <button
                        type='button'
                        onClick={() => setActiveTab('all')}
                        className='mt-2 inline-block text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'>
                        Tampilkan Semua Notifikasi
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className='divide-y divide-slate-100 dark:divide-slate-800/80'>
                  {displayedNotifications.map((item) => {
                    const isRead = isItemRead(item)
                    const style = TYPE_STYLES[item.type] || TYPE_STYLES.info
                    const iconName =
                      CATEGORY_ICONS[item.category] || 'solar:bell-bing-bold-duotone'

                    return (
                      <div
                        key={item.id}
                        className={`group relative flex items-start gap-3 p-3.5 transition-colors ${
                          isRead
                            ? 'opacity-65 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                        }`}>
                        {/* Icon Avatar */}
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs transition-transform group-hover:scale-105 ${style.iconCls}`}>
                          <Icon icon={iconName} height={19} width={19} />
                        </div>

                        {/* Konten Teks & Link Navigasi */}
                        <Link
                          href={item.url}
                          onClick={() => handleItemClick(item)}
                          className='flex-1 min-w-0 space-y-1 block pr-6'>
                          <div className='flex items-center gap-1.5 flex-wrap'>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${style.badgeCls}`}>
                              {item.category}
                            </span>

                            {item.isPersistent ? (
                              <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'>
                                <Icon icon='solar:pin-bold' height={9} width={9} />
                                Pengumuman
                              </span>
                            ) : (
                              <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'>
                                Operasional
                              </span>
                            )}

                            <span className='text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-auto'>
                              {formatTimeAgo(item.createdAt)}
                            </span>

                            {!isRead && (
                              <span className='h-2 w-2 rounded-full bg-blue-600 ring-2 ring-blue-100 dark:ring-blue-950 flex-shrink-0' />
                            )}
                          </div>

                          <h5
                            className={`text-xs font-bold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
                              isRead
                                ? 'text-slate-600 dark:text-slate-300'
                                : 'text-slate-900 dark:text-white'
                            }`}>
                            {item.title}
                          </h5>

                          <p className='text-[11px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2'>
                            {item.subtitle}
                          </p>
                        </Link>

                        {/* Tombol Hapus / Abaikan */}
                        <div className='absolute top-3.5 right-3 flex items-center gap-1'>
                          <button
                            type='button'
                            onClick={(e) => handleDismissItem(e, item)}
                            className='p-1 rounded-md text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition opacity-0 group-hover:opacity-100 cursor-pointer'
                            title='Abaikan notifikasi'>
                            <Icon icon='solar:trash-bin-trash-linear' height={14} width={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </SimpleBar>

            {/* Footer Dropdown */}
            <div className='px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500'>
              <span className='flex items-center gap-1'>
                <Icon icon='solar:shield-check-bold' height={13} width={13} className='text-emerald-500' />
                Sistem Notifikasi Terintegrasi
              </span>
              <span className='font-mono text-slate-400'>SIM Sekolah v1.0</span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* MODAL SIARKAN PENGUMUMAN BARU (ADMIN) */}
      <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
        <DialogContent className='sm:max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl'>
          <DialogHeader className='space-y-1'>
            <div className='flex items-center gap-2'>
              <div className='h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center'>
                <Icon icon='solar:megaphone-volume-bold' height={18} width={18} />
              </div>
              <DialogTitle className='text-base font-bold text-slate-900 dark:text-white'>
                Siarkan Pengumuman Baru
              </DialogTitle>
            </div>
            <DialogDescription className='text-xs text-slate-500 dark:text-slate-400'>
              Kirimkan pengumuman atau instruksi penting langsung ke pengguna sistem.
            </DialogDescription>
          </DialogHeader>

          {broadcastSuccess ? (
            <div className='p-6 text-center space-y-2'>
              <div className='h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce'>
                <Icon icon='solar:check-circle-bold' height={28} width={28} />
              </div>
              <p className='text-sm font-bold text-slate-900 dark:text-white'>
                {broadcastSuccess}
              </p>
            </div>
          ) : (
            <form onSubmit={handleBroadcastSubmit} className='space-y-3.5 mt-2'>
              <div>
                <label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1'>
                  Judul Pengumuman *
                </label>
                <input
                  type='text'
                  required
                  placeholder='Contoh: Rapat Dewan Guru & Libur Semester'
                  value={broadcastForm.title}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, title: e.target.value })
                  }
                  className='w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1'>
                    Kategori
                  </label>
                  <select
                    value={broadcastForm.category}
                    onChange={(e) =>
                      setBroadcastForm({ ...broadcastForm, category: e.target.value })
                    }
                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'>
                    <option value='Pengumuman'>Pengumuman</option>
                    <option value='Akademik'>Akademik</option>
                    <option value='Kesiswaan & PPDB'>Kesiswaan & PPDB</option>
                    <option value='Keuangan & Tagihan'>Keuangan & Tagihan</option>
                    <option value='Sistem'>Sistem</option>
                  </select>
                </div>

                <div>
                  <label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1'>
                    Tingkat Urgensi
                  </label>
                  <select
                    value={broadcastForm.type}
                    onChange={(e) =>
                      setBroadcastForm({
                        ...broadcastForm,
                        type: e.target.value as any,
                      })
                    }
                    className='w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'>
                    <option value='info'>Informasi Umum (Biru)</option>
                    <option value='warning'>Peringatan (Kuning)</option>
                    <option value='danger'>Penting / Mendesak (Merah)</option>
                    <option value='success'>Kabar Baik (Hijau)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1'>
                  Target Pengguna
                </label>
                <select
                  value={broadcastForm.roleId}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, roleId: e.target.value })
                  }
                  className='w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'>
                  <option value=''>Semua Pengguna (Broadcast Sekolah)</option>
                  <option value='4'>Hanya Guru & Pengajar</option>
                  <option value='14'>Hanya Wali Kelas</option>
                  <option value='3'>Hanya Bendahara / Keuangan</option>
                  <option value='2'>Hanya Tata Usaha</option>
                  <option value='1'>Hanya Administrator</option>
                </select>
              </div>

              <div>
                <label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1'>
                  Isi Pesan *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder='Tuliskan rincian pengumuman yang ingin disampaikan...'
                  value={broadcastForm.message}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, message: e.target.value })
                  }
                  className='w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                />
              </div>

              <div>
                <label className='block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1'>
                  Tautan Aksi / URL (Opsional)
                </label>
                <input
                  type='text'
                  placeholder='Contoh: /keuangan/tagihan atau /absensi/kelas'
                  value={broadcastForm.url}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, url: e.target.value })
                  }
                  className='w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <DialogFooter className='pt-2 gap-2 sm:gap-0'>
                <button
                  type='button'
                  onClick={() => setIsBroadcastOpen(false)}
                  className='px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer'>
                  Batal
                </button>
                <button
                  type='submit'
                  disabled={broadcastSubmitting}
                  className='px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer'>
                  {broadcastSubmitting ? (
                    <>
                      <Icon icon='solar:restart-linear' className='animate-spin' height={14} width={14} />
                      <span>Menyiarkan...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon='solar:plain-bold' height={14} width={14} />
                      <span>Kirim Siaran</span>
                    </>
                  )}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Notifications
