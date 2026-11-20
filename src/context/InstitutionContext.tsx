'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface ActiveJenjang {
  id: number
  kode: string
  nama: string
  urutan: number
  tingkat: { id: number; tingkat: string; urutan: number }[]
  jurusan: { id: number; kodeJurusan: string; namaJurusan: string }[]
}

export interface InstitutionState {
  namaSekolah: string
  modeJenjang: 'SINGLE' | 'MULTI'
  isSingleJenjang: boolean
  defaultJenjangId: number | null
  jenjangUtama: { id: number; kode: string; nama: string; active?: boolean } | null
  activeJenjangList: ActiveJenjang[]
  hasJurusan: boolean
  loading: boolean
  refreshInstitution: () => Promise<void>
}

const defaultState: InstitutionState = {
  namaSekolah: 'Sistem Manajemen Sekolah',
  modeJenjang: 'MULTI',
  isSingleJenjang: false,
  defaultJenjangId: null,
  jenjangUtama: null,
  activeJenjangList: [],
  hasJurusan: true,
  loading: true,
  refreshInstitution: async () => {},
}

const InstitutionContext = createContext<InstitutionState>(defaultState)

export const useInstitution = () => useContext(InstitutionContext)

export function InstitutionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<InstitutionState, 'refreshInstitution' | 'loading'>>({
    namaSekolah: 'Sistem Manajemen Sekolah',
    modeJenjang: 'MULTI',
    isSingleJenjang: false,
    defaultJenjangId: null,
    jenjangUtama: null,
    activeJenjangList: [],
    hasJurusan: true,
  })
  const [loading, setLoading] = useState(true)

  const fetchMode = useCallback(async () => {
    try {
      const res = await fetch('/api/sekolah/mode')
      const json = await res.json()
      if (json.success && json.data) {
        setState({
          namaSekolah: json.data.namaSekolah || 'Sistem Manajemen Sekolah',
          modeJenjang: json.data.modeJenjang || 'MULTI',
          isSingleJenjang: json.data.isSingleJenjang ?? false,
          defaultJenjangId: json.data.defaultJenjangId || null,
          jenjangUtama: json.data.jenjangUtama || null,
          activeJenjangList: json.data.activeJenjangList || [],
          hasJurusan: json.data.hasJurusan ?? true,
        })
      }
    } catch (err) {
      console.error('Failed to load institution mode:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMode()

    const handleUpdate = () => {
      fetchMode()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('sekolah-updated', handleUpdate)
      return () => {
        window.removeEventListener('sekolah-updated', handleUpdate)
      }
    }
  }, [fetchMode])

  return (
    <InstitutionContext.Provider
      value={{
        ...state,
        loading,
        refreshInstitution: fetchMode,
      }}
    >
      {children}
    </InstitutionContext.Provider>
  )
}
