import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE_URL = 'http://localhost:3001'

async function run() {
  console.log('🧪 Memverifikasi Modul Sarana Prasarana (Sarpras) & Aset Sekolah (Fase 5B)...')

  // 1. Login Admin
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123',
    }),
  })

  if (!loginRes.ok) {
    throw new Error(`Login gagal dengan status ${loginRes.status}`)
  }

  const setCookie = loginRes.headers.get('set-cookie') || ''
  const cookieHeader = setCookie.split(',').map((c) => c.split(';')[0]).join('; ')
  console.log('✅ Login Admin berhasil')

  const headers = {
    'Content-Type': 'application/json',
    Cookie: cookieHeader,
  }

  // 2. GET /api/sarpras/ruangan
  const getRuanganRes = await fetch(`${BASE_URL}/api/sarpras/ruangan`, { headers })
  console.log('GET /api/sarpras/ruangan HTTP Status:', getRuanganRes.status)
  if (!getRuanganRes.ok) throw new Error('GET /api/sarpras/ruangan gagal')
  const jsonRuangan = await getRuanganRes.json()
  console.log('✅ Stats Ruangan:', jsonRuangan.data.stats)
  console.log(`✅ Jumlah Ruangan Terdaftar: ${jsonRuangan.data.ruangan.length}`)

  // 3. POST /api/sarpras/ruangan (Create Test Room)
  const postRuanganRes = await fetch(`${BASE_URL}/api/sarpras/ruangan`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      kodeRuangan: 'R-UKS-TEST',
      namaRuangan: 'Ruang UKS & Konseling Siswa (Test)',
      gedung: 'Gedung A (Utama)',
      lantai: 1,
      kapasitas: 8,
      luasM2: 24,
      kategori: 'lainnya',
      kondisi: 'baik',
      keterangan: 'Fasilitas tempat tidur periksa dan lemari P3K',
    }),
  })
  console.log('POST /api/sarpras/ruangan HTTP Status:', postRuanganRes.status)
  if (!postRuanganRes.ok) throw new Error('POST /api/sarpras/ruangan gagal')
  const jsonCreatedRuangan = await postRuanganRes.json()
  const createdRuanganId = jsonCreatedRuangan.data.id
  console.log('✅ Ruangan baru berhasil dibuat ID:', createdRuanganId)

  // 4. GET /api/sarpras/kategori
  const getKategoriRes = await fetch(`${BASE_URL}/api/sarpras/kategori`, { headers })
  console.log('GET /api/sarpras/kategori HTTP Status:', getKategoriRes.status)
  const jsonKategori = await getKategoriRes.json()
  console.log(`✅ Jumlah Kategori Barang: ${jsonKategori.data.length}`)
  const katId = jsonKategori.data[0]?.id

  // 5. GET /api/sarpras/barang
  const getBarangRes = await fetch(`${BASE_URL}/api/sarpras/barang`, { headers })
  console.log('GET /api/sarpras/barang HTTP Status:', getBarangRes.status)
  if (!getBarangRes.ok) throw new Error('GET /api/sarpras/barang gagal')
  const jsonBarang = await getBarangRes.json()
  console.log('✅ Stats Inventaris Barang:', jsonBarang.data.stats)
  console.log(`✅ Total Item Aset Terdaftar: ${jsonBarang.data.barang.length}`)

  // 6. POST /api/sarpras/barang (Create Test Asset)
  const postBarangRes = await fetch(`${BASE_URL}/api/sarpras/barang`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      kodeBarang: 'AST-TEST-0099',
      namaBarang: 'Tensimeter Digital & Timbangan Badan',
      kategoriId: katId,
      ruanganId: createdRuanganId,
      merk: 'Omron HEM-7120',
      spesifikasi: 'Layar LCD digital, akurasi tinggi, baterai AA',
      tahunPengadaan: 2024,
      sumberDana: 'BOS Reguler',
      hargaPerolehan: 850000,
      jumlahTotal: 2,
      jumlahBaik: 2,
      jumlahRusakRingan: 0,
      jumlahRusakBerat: 0,
      jumlahAfkir: 0,
      kondisiUtama: 'baik',
      keterangan: 'Peralatan pemeriksaan kesehatan siswa di UKS',
    }),
  })
  console.log('POST /api/sarpras/barang HTTP Status:', postBarangRes.status)
  if (!postBarangRes.ok) throw new Error('POST /api/sarpras/barang gagal')
  const jsonCreatedBarang = await postBarangRes.json()
  const createdBarangId = jsonCreatedBarang.data.id
  console.log('✅ Aset barang baru berhasil didaftarkan ID:', createdBarangId)

  // 7. PUT /api/sarpras/barang/[id]
  const putBarangRes = await fetch(`${BASE_URL}/api/sarpras/barang/${createdBarangId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      namaBarang: 'Tensimeter Digital Omron (Updated)',
      kategoriId: katId,
      jumlahTotal: 3,
      jumlahBaik: 2,
      jumlahRusakRingan: 1,
    }),
  })
  console.log('PUT /api/sarpras/barang/[id] HTTP Status:', putBarangRes.status)
  if (!putBarangRes.ok) throw new Error('PUT /api/sarpras/barang/[id] gagal')
  console.log('✅ Update aset barang berhasil')

  // 8. DELETE /api/sarpras/barang/[id]
  const delBarangRes = await fetch(`${BASE_URL}/api/sarpras/barang/${createdBarangId}`, {
    method: 'DELETE',
    headers,
  })
  console.log('DELETE /api/sarpras/barang/[id] HTTP Status:', delBarangRes.status)
  if (!delBarangRes.ok) throw new Error('DELETE /api/sarpras/barang/[id] gagal')
  console.log('✅ Aset barang test berhasil dihapus')

  // 9. DELETE /api/sarpras/ruangan/[id]
  const delRuanganRes = await fetch(`${BASE_URL}/api/sarpras/ruangan/${createdRuanganId}`, {
    method: 'DELETE',
    headers,
  })
  console.log('DELETE /api/sarpras/ruangan/[id] HTTP Status:', delRuanganRes.status)
  if (!delRuanganRes.ok) throw new Error('DELETE /api/sarpras/ruangan/[id] gagal')
  console.log('✅ Ruangan test berhasil dihapus')

  // 10. Check UI Pages
  const pRuangan = await fetch(`${BASE_URL}/sarpras/ruangan`)
  console.log('Halaman /sarpras/ruangan HTTP Status:', pRuangan.status)
  if (pRuangan.status !== 200) throw new Error('Halaman /sarpras/ruangan tidak 200')

  const pBarang = await fetch(`${BASE_URL}/sarpras/barang`)
  console.log('Halaman /sarpras/barang HTTP Status:', pBarang.status)
  if (pBarang.status !== 200) throw new Error('Halaman /sarpras/barang tidak 200')

  console.log('🎉 SELURUH VERIFIKASI TAHAP 5B (SARPRAS & ASET) BERHASIL SEMPURNA!')
}

run()
  .catch((e) => {
    console.error('❌ Error verifikasi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
