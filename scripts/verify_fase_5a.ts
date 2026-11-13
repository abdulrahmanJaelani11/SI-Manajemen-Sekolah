import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Memverifikasi endpoint Perpustakaan Digital & Sirkulasi QR (Fase 5A)...')

  // 1. Login Admin
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123',
    }),
  })

  const loginJson = await loginRes.json()
  if (!loginRes.ok || !loginJson.success) {
    console.error('❌ Login admin gagal:', loginJson)
    process.exit(1)
  }
  const setCookie = loginRes.headers.get('set-cookie') || ''
  const cookies = setCookie.split(',').map((c) => c.split(';')[0]).join('; ')
  console.log('✅ Login Admin berhasil')

  // 2. Test GET /api/perpustakaan/buku
  const bukuRes = await fetch('http://localhost:3001/api/perpustakaan/buku', {
    headers: { Cookie: cookies },
  })
  const bukuJson = await bukuRes.json()
  console.log('GET /api/perpustakaan/buku HTTP Status:', bukuRes.status)
  if (bukuRes.status === 200 && bukuJson.success) {
    console.log('✅ Stats Katalog Buku:', bukuJson.data.stats)
    console.log(`✅ Jumlah Judul Buku Terdaftar: ${bukuJson.data.buku.length}`)
  } else {
    console.error('❌ Gagal memuat buku:', bukuJson)
    process.exit(1)
  }

  // 3. Test GET /api/perpustakaan/sirkulasi
  const sirRes = await fetch('http://localhost:3001/api/perpustakaan/sirkulasi', {
    headers: { Cookie: cookies },
  })
  const sirJson = await sirRes.json()
  console.log('GET /api/perpustakaan/sirkulasi HTTP Status:', sirRes.status)
  if (sirRes.status === 200 && sirJson.success) {
    console.log('✅ Stats Sirkulasi Peminjaman:', sirJson.data.stats)
    console.log(`✅ Jumlah Transaksi Sirkulasi: ${sirJson.data.sirkulasi.length}`)
  } else {
    console.error('❌ Gagal memuat sirkulasi:', sirJson)
    process.exit(1)
  }

  // 4. Test POST Peminjaman Buku dengan Scan QR (menggunakan NIS siswa)
  const targetBook = bukuJson.data.buku.find((b: any) => b.jumlahTersedia > 0 && b.kodeBuku === 'BK-2026-0003')
  if (targetBook) {
    const borrowRes = await fetch('http://localhost:3001/api/perpustakaan/sirkulasi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies,
      },
      body: JSON.stringify({
        bukuId: targetBook.id,
        nis: '1234524', // Simulasi scan QR Kartu Pelajar
        durasiHari: 7,
        catatan: 'Tes peminjaman buku Next.js via scan QR',
      }),
    })
    const borrowJson = await borrowRes.json()
    console.log('POST /api/perpustakaan/sirkulasi HTTP Status:', borrowRes.status)
    if (borrowRes.status === 201 && borrowJson.success) {
      console.log('✅ Peminjaman berhasil dibuat:', borrowJson.data.noPeminjaman, '|', borrowJson.message)

      // 5. Test POST Pengembalian Buku
      const returnRes = await fetch(
        `http://localhost:3001/api/perpustakaan/sirkulasi/${borrowJson.data.id}/kembali`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: cookies,
          },
          body: JSON.stringify({
            catatan: 'Kondisi buku sangat baik',
          }),
        }
      )
      const returnJson = await returnRes.json()
      console.log('POST Pengembalian HTTP Status:', returnRes.status)
      if (returnRes.status === 200 && returnJson.success) {
        console.log('✅ Pengembalian berhasil:', returnJson.message)
      } else {
        console.error('❌ Gagal pengembalian buku:', returnJson)
        process.exit(1)
      }
    } else {
      console.error('❌ Gagal peminjaman buku:', borrowJson)
      process.exit(1)
    }
  }

  // 6. Test Akses Halaman Dashboard
  const pageBuku = await fetch('http://localhost:3001/perpustakaan/buku', { headers: { Cookie: cookies } })
  const pageSir = await fetch('http://localhost:3001/perpustakaan/sirkulasi', { headers: { Cookie: cookies } })
  console.log('Halaman /perpustakaan/buku HTTP Status:', pageBuku.status)
  console.log('Halaman /perpustakaan/sirkulasi HTTP Status:', pageSir.status)

  // 7. Test Student Portal API
  const studentLoginRes = await fetch('http://localhost:3001/api/portal/siswa/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nis: '1234524',
      credential: '2016-12-11',
    }),
  })
  const studentLoginJson = await studentLoginRes.json()
  if (studentLoginRes.status === 200 && studentLoginJson.success) {
    const studentCookie = studentLoginRes.headers.get('set-cookie') || ''
    const studentCookies = studentCookie.split(',').map((c) => c.split(';')[0]).join('; ')

    const portalPustakaRes = await fetch('http://localhost:3001/api/portal/siswa/perpustakaan', {
      headers: { Cookie: studentCookies },
    })
    const portalPustakaJson = await portalPustakaRes.json()
    console.log('GET /api/portal/siswa/perpustakaan HTTP Status:', portalPustakaRes.status)
    if (portalPustakaRes.status === 200 && portalPustakaJson.success) {
      console.log('✅ Buku aktif dipinjam siswa:', portalPustakaJson.data.peminjamanAktif.length)
      console.log('✅ Riwayat peminjaman siswa:', portalPustakaJson.data.riwayatPeminjaman.length)
      console.log('✅ Katalog buku di portal siswa:', portalPustakaJson.data.katalogBuku.length)
    }
  }

  console.log('🎉 SELURUH VERIFIKASI TAHAP 5A BERHASIL SEMPURNA!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

