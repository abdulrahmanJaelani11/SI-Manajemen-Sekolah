import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const BASE_URL = 'http://localhost:3001'

async function run() {
  console.log('🧪 Memverifikasi Modul Kalender Akademik & Audit Trail (Fase 5C)...')

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

  // 2. GET /api/akademik/kalender
  const getKalenderRes = await fetch(`${BASE_URL}/api/akademik/kalender`, { headers })
  console.log('GET /api/akademik/kalender HTTP Status:', getKalenderRes.status)
  if (!getKalenderRes.ok) throw new Error('GET /api/akademik/kalender gagal')
  const jsonKalender = await getKalenderRes.json()
  console.log('✅ Stats Kalender Akademik:', jsonKalender.data.stats)
  console.log(`✅ Total Agenda Terdaftar: ${jsonKalender.data.events.length}`)

  // 3. POST /api/akademik/kalender (Create Event)
  const postKalenderRes = await fetch(`${BASE_URL}/api/akademik/kalender`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      judul: 'Workshop Peningkatan Mutu Guru (Test)',
      deskripsi: 'Pelatihan pembuatan modul ajar kurikulum merdeka bagi dewan guru.',
      tanggalMulai: '2026-11-20',
      tanggalSelesai: '2026-11-21',
      kategori: 'kegiatan',
      warna: '#8b5cf6',
      tahunAjaran: '2024/2025',
      semester: 'ganjil',
      sasaran: 'guru',
      liburSekolah: false,
      isPublic: true,
    }),
  })
  console.log('POST /api/akademik/kalender HTTP Status:', postKalenderRes.status)
  if (!postKalenderRes.ok) throw new Error('POST /api/akademik/kalender gagal')
  const jsonCreatedEvent = await postKalenderRes.json()
  const createdEventId = jsonCreatedEvent.data.id
  console.log('✅ Agenda baru berhasil dibuat ID:', createdEventId)

  // 4. PUT /api/akademik/kalender/[id]
  const putKalenderRes = await fetch(`${BASE_URL}/api/akademik/kalender/${createdEventId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      judul: 'Workshop Peningkatan Mutu Guru (Updated)',
      tanggalMulai: '2026-11-20',
      tanggalSelesai: '2026-11-22',
      kategori: 'kegiatan',
    }),
  })
  console.log('PUT /api/akademik/kalender/[id] HTTP Status:', putKalenderRes.status)
  if (!putKalenderRes.ok) throw new Error('PUT /api/akademik/kalender/[id] gagal')
  console.log('✅ Update agenda kalender berhasil')

  // 5. DELETE /api/akademik/kalender/[id]
  const delKalenderRes = await fetch(`${BASE_URL}/api/akademik/kalender/${createdEventId}`, {
    method: 'DELETE',
    headers,
  })
  console.log('DELETE /api/akademik/kalender/[id] HTTP Status:', delKalenderRes.status)
  if (!delKalenderRes.ok) throw new Error('DELETE /api/akademik/kalender/[id] gagal')
  console.log('✅ Agenda kalender test berhasil dihapus')

  // 6. GET /api/pengaturan/audit-log
  const getAuditRes = await fetch(`${BASE_URL}/api/pengaturan/audit-log?limit=10`, { headers })
  console.log('GET /api/pengaturan/audit-log HTTP Status:', getAuditRes.status)
  if (!getAuditRes.ok) throw new Error('GET /api/pengaturan/audit-log gagal')
  const jsonAudit = await getAuditRes.json()
  console.log('✅ Stats Audit Trail:', jsonAudit.data.stats)
  console.log(`✅ Jumlah Log Audit di Halaman 1: ${jsonAudit.data.logs.length}`)
  console.log('✅ Sampel Log Terakhir:', {
    modul: jsonAudit.data.logs[0]?.modul,
    aksi: jsonAudit.data.logs[0]?.aksi,
    deskripsi: jsonAudit.data.logs[0]?.deskripsi,
  })

  // 7. GET /api/portal/kalender (Public)
  const getPublicKalenderRes = await fetch(`${BASE_URL}/api/portal/kalender`)
  console.log('GET /api/portal/kalender (Public) HTTP Status:', getPublicKalenderRes.status)
  if (!getPublicKalenderRes.ok) throw new Error('GET /api/portal/kalender gagal')
  const jsonPublicKalender = await getPublicKalenderRes.json()
  console.log(`✅ Jumlah Agenda Kalender Publik: ${jsonPublicKalender.data.length}`)

  // 8. Test UI Pages HTTP Status
  const pKalender = await fetch(`${BASE_URL}/akademik/kalender`)
  console.log('Halaman /akademik/kalender HTTP Status:', pKalender.status)
  if (pKalender.status !== 200) throw new Error('Halaman /akademik/kalender tidak 200')

  const pAudit = await fetch(`${BASE_URL}/pengaturan/audit-log`)
  console.log('Halaman /pengaturan/audit-log HTTP Status:', pAudit.status)
  if (pAudit.status !== 200) throw new Error('Halaman /pengaturan/audit-log tidak 200')

  const pSiswa = await fetch(`${BASE_URL}/portal/siswa`)
  console.log('Halaman /portal/siswa HTTP Status:', pSiswa.status)
  if (pSiswa.status !== 200) throw new Error('Halaman /portal/siswa tidak 200')

  console.log('🎉 SELURUH VERIFIKASI TAHAP 5C (KALENDER AKADEMIK & AUDIT TRAIL) BERHASIL SEMPURNA!')
}

run()
  .catch((e) => {
    console.error('❌ Error verifikasi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

