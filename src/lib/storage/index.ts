import fs from 'fs'
import path from 'path'

export interface StorageUploadResult {
  url: string
  path: string
  filename: string
  size: number
}

export interface StorageService {
  upload(
    fileBuffer: Buffer,
    originalFilename: string,
    subfolder: string
  ): Promise<StorageUploadResult>
  delete(filePathOrUrl: string): Promise<boolean>
}

/**
 * Driver Penyimpanan Lokal (Development)
 * Menyimpan file ke public/uploads/[subfolder] dan URL dapat diakses via /[subfolder]/[filename]
 */
class LocalStorageService implements StorageService {
  private uploadDir: string

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads')
  }

  private ensureDirExists(targetPath: string) {
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true })
    }
  }

  async upload(
    fileBuffer: Buffer,
    originalFilename: string,
    subfolder: string = 'general'
  ): Promise<StorageUploadResult> {
    const targetFolder = path.join(this.uploadDir, subfolder)
    this.ensureDirExists(targetFolder)

    const ext = path.extname(originalFilename).toLowerCase()
    const rawName = path
      .basename(originalFilename, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50)
    const uniqueFilename = `${Date.now()}_${rawName}${ext}`
    const fullPath = path.join(targetFolder, uniqueFilename)

    await fs.promises.writeFile(fullPath, fileBuffer)

    const publicUrl = `/uploads/${subfolder}/${uniqueFilename}`

    return {
      url: publicUrl,
      path: fullPath,
      filename: uniqueFilename,
      size: fileBuffer.length,
    }
  }

  async delete(filePathOrUrl: string): Promise<boolean> {
    try {
      if (!filePathOrUrl) return false

      let relativePath = filePathOrUrl
      if (filePathOrUrl.startsWith('/uploads/')) {
        relativePath = filePathOrUrl.replace('/uploads/', '')
      }

      const fullPath = path.join(this.uploadDir, relativePath)

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath)
        return true
      }
      return false
    } catch (err) {
      console.error('LocalStorage delete error:', err)
      return false
    }
  }
}

/**
 * Driver Penyimpanan Supabase Storage (Production Ready)
 * Menggunakan Supabase Storage API jika STORAGE_DRIVER="supabase"
 */
class SupabaseStorageService implements StorageService {
  private bucket: string
  private supabaseUrl: string
  private serviceKey: string

  constructor() {
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'sekolah_uploads'
    this.supabaseUrl = process.env.SUPABASE_URL || ''
    this.serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  }

  async upload(
    fileBuffer: Buffer,
    originalFilename: string,
    subfolder: string = 'general'
  ): Promise<StorageUploadResult> {
    // Dynamic import atau fetch langsung jika SDK belum dipasang
    if (!this.supabaseUrl || !this.serviceKey) {
      throw new Error(
        'Supabase Storage credentials are missing in environment variables.'
      )
    }

    const ext = path.extname(originalFilename).toLowerCase()
    const rawName = path
      .basename(originalFilename, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50)
    const uniqueFilename = `${subfolder}/${Date.now()}_${rawName}${ext}`

    // Menggunakan REST API Supabase Storage langsung (zero dependency)
    const uploadEndpoint = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${uniqueFilename}`
    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceKey}`,
        'Content-Type': 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: new Uint8Array(fileBuffer),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to upload to Supabase Storage: ${errorText}`)
    }

    const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${uniqueFilename}`

    return {
      url: publicUrl,
      path: uniqueFilename,
      filename: path.basename(uniqueFilename),
      size: fileBuffer.length,
    }
  }

  async delete(filePathOrUrl: string): Promise<boolean> {
    try {
      if (!this.supabaseUrl || !this.serviceKey || !filePathOrUrl) return false

      let objectKey = filePathOrUrl
      const publicPrefix = `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/`
      if (filePathOrUrl.startsWith(publicPrefix)) {
        objectKey = filePathOrUrl.replace(publicPrefix, '')
      }

      const deleteEndpoint = `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${objectKey}`
      const response = await fetch(deleteEndpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.serviceKey}`,
        },
      })

      return response.ok
    } catch (err) {
      console.error('SupabaseStorage delete error:', err)
      return false
    }
  }
}

/**
 * Storage Service Factory
 * Otomatis memilih driver berdasarkan konfigurasi .env (STORAGE_DRIVER)
 */
const driverType = (process.env.STORAGE_DRIVER || 'local').toLowerCase()

export const storage: StorageService =
  driverType === 'supabase'
    ? new SupabaseStorageService()
    : new LocalStorageService()

export default storage
