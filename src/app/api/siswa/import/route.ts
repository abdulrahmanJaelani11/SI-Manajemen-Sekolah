import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return apiError('Berkas CSV siswa tidak ditemukan', 400)
    }

    const text = await file.text()
    // Hapus BOM jika ada
    const cleanText = text.replace(/^\uFEFF/, '')
    const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0)

    if (lines.length < 2) {
      return apiError('Berkas CSV kosong atau tidak memiliki baris data', 400)
    }

    // Fungsi parser baris CSV sederhana dengan dukungan kutipan
    const parseCsvLine = (line: string): string[] => {
      const result: string[] = []
      let cur = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim())
          cur = ''
        } else {
          cur += char
        }
      }
      result.push(cur.trim())
      return result
    }

    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase())

    // Ambil semua master data untuk lookup cepat
    const [allJenjang, allKelas, allJurusan] = await Promise.all([
      prisma.refJenjang.findMany(),
      prisma.kelas.findMany(),
      prisma.jurusan.findMany(),
    ])

    const jenjangMap = new Map(allJenjang.map((j) => [j.kode.toUpperCase(), j.id]))
    const kelasMap = new Map(allKelas.map((k) => [k.namaKelas.toUpperCase(), k.id]))
    const jurusanMap = new Map(allJurusan.map((j) => [j.kodeJurusan.toUpperCase(), j.id]))

    const successList: any[] = []
    const errorList: { row: number; nis?: string; nama?: string; error: string }[] = []

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1
      const values = parseCsvLine(lines[i])
      if (values.length < 3) continue

      // Map values berdasarkan indeks header standar:
      // 0: NIS, 1: NISN, 2: Nama, 3: JK, 4: Jenjang, 5: Kelas, 6: Jurusan, 7: Status, 8: Tahun Masuk
      const nis = values[0]
      const nisn = values[1] || null
      const nama = values[2]
      const jenisKelamin = values[3]?.toUpperCase() === 'P' ? 'P' : 'L'
      const jenjangKode = values[4]?.toUpperCase()
      const kelasNama = values[5]?.toUpperCase()
      const jurusanKode = values[6]?.toUpperCase()
      const status = values[7]?.toLowerCase() || 'aktif'
      const tahunMasuk = values[8] ? parseInt(values[8], 10) : new Date().getFullYear()

      if (!nis || !nama) {
        errorList.push({
          row: rowNum,
          error: 'NIS dan Nama Lengkap wajib diisi',
        })
        continue
      }

      // Validasi jenjang
      const jenjangId = jenjangMap.get(jenjangKode) || allJenjang[0]?.id
      if (!jenjangId) {
        errorList.push({
          row: rowNum,
          nis,
          nama,
          error: `Jenjang "${jenjangKode}" tidak ditemukan di sistem`,
        })
        continue
      }

      // Cari kelas & jurusan jika ada
      const kelasId = kelasNama ? kelasMap.get(kelasNama) || null : null
      const jurusanId = jurusanKode ? jurusanMap.get(jurusanKode) || null : null

      try {
        const student = await prisma.siswa.upsert({
          where: { nis },
          update: {
            nama,
            nisn: nisn || undefined,
            jenisKelamin,
            jenjangId,
            kelasId,
            jurusanId,
            status,
            tahunMasuk: isNaN(tahunMasuk) ? new Date().getFullYear() : tahunMasuk,
          },
          create: {
            nis,
            nisn,
            nama,
            jenisKelamin,
            jenjangId,
            kelasId,
            jurusanId,
            status,
            tahunMasuk: isNaN(tahunMasuk) ? new Date().getFullYear() : tahunMasuk,
          },
        })
        successList.push(student.id)
      } catch (err: any) {
        errorList.push({
          row: rowNum,
          nis,
          nama,
          error: err?.message || 'Gagal menyimpan ke basis data',
        })
      }
    }

    return apiSuccess({
      message: `Impor CSV selesai. Berhasil: ${successList.length}, Gagal: ${errorList.length}`,
      data: {
        totalProcessed: lines.length - 1,
        successCount: successList.length,
        failedCount: errorList.length,
        errors: errorList,
      },
    })
  } catch (error: any) {
    console.error('API Siswa Import Error:', error)
    return apiError('Gagal memproses berkas impor CSV: ' + (error?.message || 'Server error'), 500)
  }
}
