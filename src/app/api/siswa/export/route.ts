import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jenjangId = searchParams.get('jenjangId')
    const kelasId = searchParams.get('kelasId')
    const status = searchParams.get('status')

    const where: any = {}
    if (jenjangId) where.jenjangId = parseInt(jenjangId, 10)
    if (kelasId) where.kelasId = parseInt(kelasId, 10)
    if (status) where.status = status

    const siswaList = await prisma.siswa.findMany({
      where,
      orderBy: [{ jenjang: { urutan: 'asc' } }, { nama: 'asc' }],
      include: {
        jenjang: true,
        kelas: true,
        jurusan: true,
      },
    })

    // Header CSV standar
    const headers = [
      'NIS',
      'NISN',
      'Nama Lengkap',
      'Jenis Kelamin (L/P)',
      'Jenjang',
      'Kelas',
      'Jurusan',
      'Status (aktif/alumni/mutasi)',
      'Tahun Masuk',
      'Tempat Lahir',
      'Tanggal Lahir (YYYY-MM-DD)',
      'Alamat',
      'No HP Siswa',
      'Email Siswa',
      'Nama Wali',
      'No HP Wali',
      'Hubungan Wali',
      'Prestasi',
    ]

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return ''
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const rows = siswaList.map((s) => [
      escapeCsv(s.nis),
      escapeCsv(s.nisn || ''),
      escapeCsv(s.nama),
      escapeCsv(s.jenisKelamin),
      escapeCsv(s.jenjang?.kode || ''),
      escapeCsv(s.kelas?.namaKelas || ''),
      escapeCsv(s.jurusan?.kodeJurusan || ''),
      escapeCsv(s.status),
      escapeCsv(s.tahunMasuk || ''),
      escapeCsv(s.tempatLahir || ''),
      escapeCsv(s.tanggalLahir ? s.tanggalLahir.toISOString().split('T')[0] : ''),
      escapeCsv(s.alamat || ''),
      escapeCsv(s.telpSiswa || ''),
      escapeCsv(s.emailSiswa || ''),
      escapeCsv(s.namaWali || ''),
      escapeCsv(s.telpWali || ''),
      escapeCsv(s.hubunganWali || ''),
      escapeCsv(s.prestasi || ''),
    ])

    // Sertakan UTF-8 BOM (\uFEFF) agar Microsoft Excel langsung membaca aksen/karakter dengan benar
    const csvContent =
      '\uFEFF' +
      [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join(
        '\r\n'
      )

    const filename = `data_siswa_${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('API Siswa Export Error:', error)
    return NextResponse.json(
      { success: false, message: 'Gagal mengekspor data siswa' },
      { status: 500 }
    )
  }
}
