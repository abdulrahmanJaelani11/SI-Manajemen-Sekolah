const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'video-assets', 'screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Memulai pengambilan screenshot resolusi Full HD (1920x1080)...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // Helper untuk screenshot
  const capture = async (name, delayMs = 1200) => {
    if (delayMs > 0) await page.waitForTimeout(delayMs);
    const filepath = path.join(OUTPUT_DIR, name);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`  📸 Tersimpan: ${name}`);
  };

  // 1. Portal Depan
  console.log('\n[1/8] Mengambil gambar Portal Publik...');
  await page.goto('http://localhost:3000/portal', { waitUntil: 'networkidle' });
  await capture('01_01_portal_depan_hero.png', 1500);

  await page.evaluate(() => window.scrollBy({ top: 580, behavior: 'smooth' }));
  await capture('01_02_portal_keunggulan_profil.png', 1500);

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await capture('08_02_portal_kontak_cta.png', 1500);

  // 2. Halaman Login Admin
  console.log('\n[2/8] Mengambil gambar Halaman Login Admin...');
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
  await capture('01_03_halaman_login_admin.png', 1000);

  // Lakukan Login
  console.log('\n[*] Melakukan autentikasi masuk sebagai Administrator...');
  await page.fill('#username1', 'admin');
  await page.fill('#password1', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  // 3. Dasbor Utama
  console.log('\n[3/8] Mengambil gambar Dasbor Eksekutif...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await capture('02_01_dasbor_eksekutif_admin.png', 2000);

  // 4. Pengaturan Sekolah
  console.log('\n[4/8] Mengambil gambar Pengaturan Sekolah & Mode Jenjang...');
  await page.goto('http://localhost:3000/pengaturan/sekolah', { waitUntil: 'networkidle' });
  await capture('02_02_pengaturan_sekolah_mode.png', 1500);

  // 5. Data Siswa & Modal Cetak Kartu Massal
  console.log('\n[5/8] Mengambil gambar Modul Kesiswaan & Cetak Kartu...');
  await page.goto('http://localhost:3000/siswa', { waitUntil: 'networkidle' });
  await capture('03_01_direktori_data_siswa.png', 2000);

  // Coba centang siswa dan buka modal cetak kartu massal jika ada
  try {
    const tableCheckbox = await page.$('table tbody tr:first-child input[type="checkbox"], table thead input[type="checkbox"]');
    if (tableCheckbox) {
      await tableCheckbox.click();
      await page.waitForTimeout(800);
    }
    const cetakBtn = await page.$('button:has-text("Cetak Kartu"), button:has-text("Cetak")');
    if (cetakBtn) {
      await cetakBtn.click();
      await page.waitForTimeout(1500);
      await capture('03_02_modal_cetak_kartu_massal.png', 1000);
      // Tutup modal
      const closeBtn = await page.$('button[aria-label="Close"], button:has-text("Tutup"), button:has-text("Batal")');
      if (closeBtn) await closeBtn.click().catch(() => {});
    }
  } catch (e) {
    console.log('    Catatan modal cetak:', e.message);
  }

  // 6. Akademik (Kalender & Kelas Rombel)
  console.log('\n[6/8] Mengambil gambar Modul Akademik...');
  await page.goto('http://localhost:3000/akademik/kalender', { waitUntil: 'networkidle' }).catch(() => {});
  await capture('04_01_akademik_kalender.png', 1500);

  await page.goto('http://localhost:3000/kelas', { waitUntil: 'networkidle' }).catch(() => {});
  await capture('04_02_akademik_kelas_rombel.png', 1500);

  // 7. Keuangan & Kasir SPP
  console.log('\n[7/8] Mengambil gambar Modul Keuangan & Kasir SPP...');
  await page.goto('http://localhost:3000/spp/riwayat', { waitUntil: 'networkidle' }).catch(() => {});
  await capture('05_01_kasir_spp_riwayat.png', 1500);

  await page.goto('http://localhost:3000/spp/tunggakan', { waitUntil: 'networkidle' }).catch(() => {});
  await capture('05_02_spp_rekap_tunggakan.png', 1500);

  // 8. Sarpras, Portal Siswa, PPDB, & Pengaturan Role
  console.log('\n[8/8] Mengambil gambar Sarpras, Portal Siswa, PPDB & Hak Akses...');
  await page.goto('http://localhost:3000/portal/fasilitas', { waitUntil: 'networkidle' }).catch(() => {});
  await capture('06_01_sarpras_fasilitas_sekolah.png', 1500);

  await page.goto('http://localhost:3000/portal/login-siswa', { waitUntil: 'networkidle' }).catch(() => {});
  await capture('07_01_portal_siswa_login.png', 1000);

  await page.goto('http://localhost:3000/portal/ppdb', { waitUntil: 'networkidle' }).catch(() => {});
  await capture('07_02_portal_ppdb_online.png', 1500);

  await page.goto('http://localhost:3000/pengaturan/pengguna', { waitUntil: 'networkidle' }).catch(() => {});
  await capture('08_01_pengaturan_pengguna_rbac.png', 1500);

  await browser.close();
  console.log('\n🎉 Seluruh tangkapan layar Full HD (1920x1080) berhasil disimpan!');
}

run().catch((err) => {
  console.error('❌ Gagal mengambil screenshot:', err);
  process.exit(1);
});
