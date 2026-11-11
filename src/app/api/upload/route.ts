import { NextRequest } from 'next/server'
import storage from '@/lib/storage'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth/get-current-user'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/csv',
]

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    // Di lingkungan produksi, validasi otentikasi wajib aktif
    if (!user && process.env.NODE_ENV === 'production') {
      return apiError('Otentikasi diperlukan untuk mengunggah berkas', 401)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const subfolder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return apiError('Berkas (file) tidak ditemukan dalam permintaan', 400)
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError('Ukuran berkas melebihi batas maksimal 5 MB', 400)
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return apiError(
        'Format berkas tidak didukung. Harap unggah gambar (JPEG/PNG/WEBP) atau PDF/CSV.',
        400
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await storage.upload(buffer, file.name, subfolder)

    return apiSuccess({
      message: 'Berkas berhasil diunggah',
      data: result,
    })
  } catch (error: any) {
    console.error('API Upload Error:', error)
    return apiError('Gagal mengunggah berkas: ' + (error?.message || 'Server error'), 500)
  }
}
