import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import storage from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pegawaiId = parseInt(id, 10)
    if (isNaN(pegawaiId)) return apiError('ID pegawai tidak valid', 400)

    const pegawai = await prisma.pegawai.findUnique({
      where: { id: pegawaiId },
    })

    if (!pegawai) return apiError('Data pegawai tidak ditemukan', 404)

    return apiSuccess({
      message: 'Detail pegawai berhasil dimuat',
      data: pegawai,
    })
  } catch (error: any) {
    console.error('API Pegawai Detail Error:', error)
    return apiError('Gagal memuat detail pegawai: ' + (error?.message || 'Server error'), 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pegawaiId = parseInt(id, 10)
    if (isNaN(pegawaiId)) return apiError('ID pegawai tidak valid', 400)

    const body = await request.json()
    const {
      nip,
      nama,
      jenisKelamin,
      jenisPegawai,
      jabatan,
      bidangStudi,
      kontak,
      email,
      alamat,
      fotoUrl,
      statusKepegawaian,
      active,
    } = body

    const existing = await prisma.pegawai.findUnique({
      where: { id: pegawaiId },
    })
    if (!existing) return apiError('Data pegawai tidak ditemukan', 404)

    if (nip && String(nip).trim() !== existing.nip) {
      const duplicate = await prisma.pegawai.findUnique({
        where: { nip: String(nip).trim() },
      })
      if (duplicate) return apiError(`Pegawai dengan NIP "${nip}" sudah terdaftar`, 409)
    }

    if (fotoUrl && existing.fotoUrl && fotoUrl !== existing.fotoUrl) {
      await storage.delete(existing.fotoUrl)
    }

    const updated = await prisma.pegawai.update({
      where: { id: pegawaiId },
      data: {
        nip: nip !== undefined ? (nip ? String(nip).trim() : null) : undefined,
        ...(nama ? { nama: String(nama).trim() } : {}),
        ...(jenisKelamin ? { jenisKelamin: jenisKelamin === 'P' ? 'P' : 'L' } : {}),
        ...(jenisPegawai ? { jenisPegawai } : {}),
        jabatan: jabatan !== undefined ? (jabatan ? String(jabatan).trim() : null) : undefined,
        bidangStudi: bidangStudi !== undefined ? (bidangStudi ? String(bidangStudi).trim() : null) : undefined,
        kontak: kontak !== undefined ? (kontak ? String(kontak).trim() : null) : undefined,
        email: email !== undefined ? (email ? String(email).trim() : null) : undefined,
        alamat: alamat !== undefined ? (alamat ? String(alamat).trim() : null) : undefined,
        fotoUrl: fotoUrl !== undefined ? (fotoUrl ? String(fotoUrl).trim() : null) : undefined,
        ...(statusKepegawaian ? { statusKepegawaian } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      },
    })

    return apiSuccess({
      message: 'Data pegawai berhasil diperbarui',
      data: updated,
    })
  } catch (error: any) {
    console.error('API Pegawai PUT Error:', error)
    return apiError('Gagal memperbarui data pegawai: ' + (error?.message || 'Server error'), 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pegawaiId = parseInt(id, 10)
    if (isNaN(pegawaiId)) return apiError('ID pegawai tidak valid', 400)

    const existing = await prisma.pegawai.findUnique({
      where: { id: pegawaiId },
    })
    if (!existing) return apiError('Data pegawai tidak ditemukan', 404)

    if (existing.fotoUrl) {
      await storage.delete(existing.fotoUrl)
    }

    await prisma.pegawai.delete({
      where: { id: pegawaiId },
    })

    return apiSuccess({
      message: 'Data pegawai berhasil dihapus',
      data: null,
    })
  } catch (error: any) {
    console.error('API Pegawai DELETE Error:', error)
    return apiError('Gagal menghapus data pegawai: ' + (error?.message || 'Server error'), 500)
  }
}
