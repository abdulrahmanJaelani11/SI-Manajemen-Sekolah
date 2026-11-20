/**
 * Mengubah angka nominal Rupiah menjadi kalimat terbilang Bahasa Indonesia
 * Contoh: 150000 -> "Seratus Lima Puluh Ribu Rupiah"
 */
export function terbilang(nominal: number | bigint): string {
  const n = typeof nominal === 'bigint' ? Number(nominal) : nominal
  if (isNaN(n) || n === 0) return 'Nol Rupiah'

  const satuan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ]

  function konversi(nilai: number): string {
    if (nilai < 12) {
      return satuan[nilai]
    } else if (nilai < 20) {
      return konversi(nilai - 10) + ' Belas'
    } else if (nilai < 100) {
      return konversi(Math.floor(nilai / 10)) + ' Puluh ' + konversi(nilai % 10)
    } else if (nilai < 200) {
      return 'Seratus ' + konversi(nilai - 100)
    } else if (nilai < 1000) {
      return konversi(Math.floor(nilai / 100)) + ' Ratus ' + konversi(nilai % 100)
    } else if (nilai < 2000) {
      return 'Seribu ' + konversi(nilai - 1000)
    } else if (nilai < 1000000) {
      return konversi(Math.floor(nilai / 1000)) + ' Ribu ' + konversi(nilai % 1000)
    } else if (nilai < 1000000000) {
      return (
        konversi(Math.floor(nilai / 1000000)) +
        ' Juta ' +
        konversi(nilai % 1000000)
      )
    } else if (nilai < 1000000000000) {
      return (
        konversi(Math.floor(nilai / 1000000000)) +
        ' Miliar ' +
        konversi(nilai % 1000000000)
      )
    }
    return ''
  }

  const hasil = konversi(Math.floor(Math.abs(n))).replace(/\s+/g, ' ').trim()
  return (n < 0 ? 'Minus ' : '') + hasil + ' Rupiah'
}

/**
 * Format angka ke mata uang Rupiah
 * Contoh: 150000 -> "Rp 150.000"
 */
export function formatRupiah(nominal: number | string | any): string {
  const num = typeof nominal === 'string' ? parseFloat(nominal) : Number(nominal)
  if (isNaN(num)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Daftar 12 bulan siklus tahun ajaran akademik Indonesia (Juli s.d. Juni)
 */
export const BULAN_AKADEMIK = [
  { urutan: 1, nama: 'Juli' },
  { urutan: 2, nama: 'Agustus' },
  { urutan: 3, nama: 'September' },
  { urutan: 4, nama: 'Oktober' },
  { urutan: 5, nama: 'November' },
  { urutan: 6, nama: 'Desember' },
  { urutan: 7, nama: 'Januari' },
  { urutan: 8, nama: 'Februari' },
  { urutan: 9, nama: 'Maret' },
  { urutan: 10, nama: 'April' },
  { urutan: 11, nama: 'Mei' },
  { urutan: 12, nama: 'Juni' },
]

/**
 * Menghitung urutan bulan akademik maksimal yang sudah jatuh tempo (due)
 * relatif terhadap bulan dan tahun berjalan.
 * 
 * Siklus Tahun Ajaran (Juli s.d. Juni):
 * - Urutan 1 = Juli, ..., 5 = November, 6 = Desember, 7 = Januari, ..., 12 = Juni.
 * 
 * Aturan:
 * 1. Tahun Ajaran Masa Lalu (misal 2024/2025 jika sekarang 2026): seluruh 12 bulan sudah jatuh tempo -> return 12
 * 2. Tahun Ajaran Masa Depan (misal 2027/2028 jika sekarang 2026): belum ada yang jatuh tempo -> return 0
 * 3. Tahun Ajaran Berjalan (misal 2026/2027 saat ini di bulan November):
 *    - Bulan Juli - Desember: urutan = bulan - 6  (Juli=1, Ags=2, Sep=3, Okt=4, Nov=5, Des=6)
 *    - Bulan Januari - Juni:  urutan = bulan + 6  (Jan=7, Feb=8, Mar=9, Apr=10, Mei=11, Jun=12)
 */
export function getMaxDueUrutanBulan(tahunAjaran: string, refDate: Date = new Date()): number {
  if (!tahunAjaran) return 12

  const matches = tahunAjaran.match(/\d{4}/g)
  if (!matches || matches.length < 2) {
    return 12 // Fallback jika format tidak standar
  }

  const startYear = parseInt(matches[0], 10)
  const endYear = parseInt(matches[1], 10)

  const currentYear = refDate.getFullYear()
  const currentMonth = refDate.getMonth() + 1 // 1 s.d. 12

  // 1. Tahun ajaran masa lalu yang sudah selesai (setelah 30 Juni tahun akhir)
  if (currentYear > endYear || (currentYear === endYear && currentMonth > 6)) {
    return 12
  }

  // 2. Tahun ajaran masa depan yang belum dimulai (sebelum 1 Juli tahun awal)
  if (currentYear < startYear || (currentYear === startYear && currentMonth < 7)) {
    return 0
  }

  // 3. Tahun ajaran berjalan saat ini
  if (currentMonth >= 7) {
    return currentMonth - 6
  } else {
    return currentMonth + 6
  }
}
