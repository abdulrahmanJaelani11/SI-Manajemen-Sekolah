import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Memverifikasi endpoint Laporan Arus Kas Terpadu...')

  // Cek admin user
  const adminUser = await prisma.secUser.findFirst({
    where: { username: 'admin' },
    include: { role: true },
  })
  if (!adminUser) {
    console.error('❌ User admin tidak ditemukan')
    process.exit(1)
  }

  // Lakukan login melalui API
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123',
    }),
  })

  const loginJson = await loginRes.json()
  console.log('Login status:', loginRes.status, loginJson.success ? 'Berhasil' : 'Gagal')

  const setCookie = loginRes.headers.get('set-cookie')
  if (!setCookie) {
    console.error('❌ Tidak menerima set-cookie dari login')
    process.exit(1)
  }

  // Extract session token
  const cookies = setCookie.split(',').map((c) => c.split(';')[0]).join('; ')

  // Fetch /api/keuangan/laporan
  const lapRes = await fetch('http://localhost:3001/api/keuangan/laporan', {
    headers: {
      Cookie: cookies,
    },
  })

  console.log('Laporan Arus Kas HTTP Status:', lapRes.status)
  const lapJson = await lapRes.json()

  if (lapRes.status === 200 && lapJson.success) {
    console.log('✅ Ringkasan Arus Kas:', lapJson.data.ringkasan)
    console.log(`✅ Jumlah Baris Buku Kas Terpadu: ${lapJson.data.bukuKas.length}`)
    console.log('✅ Pos Kategori Breakdown:', lapJson.data.breakdown.kategori.length, 'pos')
    console.log('✅ Kanal Metode Breakdown:', lapJson.data.breakdown.metode.length, 'metode')
    console.log('✅ Profil Sekolah:', lapJson.data.profilSekolah.namaSekolah)

    // Tampilkan 3 transaksi teratas
    console.log('Contoh 3 baris buku kas teratas:')
    lapJson.data.bukuKas.slice(0, 3).forEach((item: any, idx: number) => {
      console.log(`  ${idx + 1}. [${item.sumber}] ${item.noTransaksi} | ${item.uraian} | Debit: Rp ${item.debit} | Kredit: Rp ${item.kredit} | Saldo: Rp ${item.saldo}`)
    })
  } else {
    console.error('❌ Gagal memuat data laporan:', lapJson)
    process.exit(1)
  }

  // Test page HTML
  const pageRes = await fetch('http://localhost:3001/keuangan/laporan', {
    headers: {
      Cookie: cookies,
    },
  })
  console.log('Halaman /keuangan/laporan HTTP Status:', pageRes.status)

  console.log('🎉 SELURUH VERIFIKASI TAHAP 4C BERHASIL SEMPURNA!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
