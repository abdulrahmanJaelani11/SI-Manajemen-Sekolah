import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return apiError('Slug artikel berita tidak valid', 400)
    }

    const berita = await prisma.berita.findUnique({
      where: { slug },
    })

    if (!berita) {
      return apiError('Artikel berita tidak ditemukan', 404)
    }

    return apiSuccess({
      message: 'Detail artikel berita berhasil dimuat',
      data: berita,
    })
  } catch (error: any) {
    console.error('API Berita Detail Error:', error)
    return apiError('Gagal memuat berita: ' + (error?.message || 'Server error'), 500)
  }
}
