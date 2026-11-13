import { NextRequest } from 'next/server'
import storage from '@/lib/storage'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getClientIp, checkRateLimit } from '@/lib/auth/rate-limiter'

const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateCheck = checkRateLimit(`ppdb_upload_${ip}`, 20, 15 * 60 * 1000)
    if (!rateCheck.allowed) {
      return apiError(
        `Terlalu banyak unggahan berkas. Silakan coba lagi dalam ${rateCheck.resetInSeconds} detik.`,
        429
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return apiError('Berkas tidak ditemukan dalam permintaan', 400)
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError('Ukuran berkas melebihi batas maksimal 3 MB', 400)
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return apiError(
        'Format berkas harus JPG, PNG, WEBP, atau PDF.',
        400
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const result = await storage.upload(buffer, file.name, 'ppdb')

    return apiSuccess({
      message: 'Berkas PPDB berhasil diunggah',
      data: result,
    })
  } catch (error: any) {
    console.error('API Portal PPDB Upload Error:', error)
    return apiError('Gagal mengunggah berkas: ' + (error?.message || 'Server error'), 500)
  }
}

