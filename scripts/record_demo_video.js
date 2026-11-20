const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VIDEOS_DIR = path.join(__dirname, '..', 'docs', 'video-assets', 'videos');
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

const STORAGE_STATE_PATH = path.join(__dirname, '..', 'docs', 'video-assets', 'auth_state.json');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function smoothScroll(page, targetY, durationMs = 2500) {
  await page.evaluate(async ({ targetY, durationMs }) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();
    return new Promise((resolve) => {
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const ease = 0.5 - Math.cos(progress * Math.PI) / 2;
        window.scrollTo(0, startY + diff * ease);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }, { targetY, durationMs });
}

async function moveMouseSmooth(page, targetX, targetY, steps = 25) {
  await page.mouse.move(targetX, targetY, { steps });
}

// 1. Rekam Bagian 1: Pembuka & Portal Publik (Target: ~40 detik)
async function recordPart1(browser) {
  console.log('\n🎬 [1/8] Merekam Bagian 1: Pembuka & Portal Publik (~40s)...');
  const tempDir = path.join(VIDEOS_DIR, 'temp_p1');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const context = await browser.newContext({
    recordVideo: { dir: tempDir, size: { width: 1920, height: 1080 } },
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Buka portal publik
  await page.goto('http://localhost:3000/portal', { waitUntil: 'networkidle' });
  await wait(4000);

  // Gerakkan kursor ke Hero Carousel
  await moveMouseSmooth(page, 960, 480);
  await wait(4000);

  // Scroll perlahan ke bawah menyorot 4 Pilar & Profil
  await smoothScroll(page, 620, 3500);
  await moveMouseSmooth(page, 480, 520);
  await wait(4500);

  // Scroll ke Banner SPP & Berita
  await smoothScroll(page, 1400, 4000);
  await moveMouseSmooth(page, 960, 500);
  await wait(5000);

  // Scroll ke Fasilitas & Agenda
  await smoothScroll(page, 2200, 4000);
  await wait(4000);

  // Scroll kembali ke atas
  await smoothScroll(page, 0, 3000);
  await wait(2000);

  // Sorot tombol Masuk Admin di topbar
  await moveMouseSmooth(page, 1500, 20);
  await wait(2000);
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
  await wait(3000);

  await page.close();
  const videoPath = await page.video().path();
  await context.close();

  const finalPath = path.join(VIDEOS_DIR, '01_video_pembuka_identitas.webm');
  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  fs.renameSync(videoPath, finalPath);
  fs.rmdirSync(tempDir, { recursive: true });
  console.log('   ✅ Video Bagian 1 tersimpan:', path.basename(finalPath));
}

// 2. Rekam Bagian 2: Dasbor Eksekutif & Fleksibilitas Konfigurasi (Target: ~56 detik)
async function recordPart2(browser) {
  console.log('\n🎬 [2/8] Merekam Bagian 2: Dasbor Eksekutif & Mode Jenjang (~56s)...');
  const tempDir = path.join(VIDEOS_DIR, 'temp_p2');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const context = await browser.newContext({
    recordVideo: { dir: tempDir, size: { width: 1920, height: 1080 } },
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
  await wait(2500);

  // Input username perlahan
  await moveMouseSmooth(page, 960, 480);
  await page.click('#username1');
  await page.type('#username1', 'admin', { delay: 120 });
  await wait(1000);

  // Input password perlahan
  await page.click('#password1');
  await page.type('#password1', 'admin123', { delay: 120 });
  await wait(1500);

  // Klik tombol Masuk
  await moveMouseSmooth(page, 960, 620);
  await page.click('button[type="submit"]');
  await wait(4000);

  // Simpan auth state untuk bagian berikutnya
  await context.storageState({ path: STORAGE_STATE_PATH });

  // Dasbor Utama
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await wait(3000);

  // Sorot 4 Kartu Metrik Kinerja
  await moveMouseSmooth(page, 450, 260);
  await wait(3000);
  await moveMouseSmooth(page, 750, 260);
  await wait(3000);
  await moveMouseSmooth(page, 1050, 260);
  await wait(3000);
  await moveMouseSmooth(page, 1350, 260);
  await wait(3000);

  // Scroll perlahan ke grafik kas
  await smoothScroll(page, 450, 3000);
  await moveMouseSmooth(page, 800, 500);
  await wait(5000);

  // Buka menu Pengaturan Sekolah
  await page.goto('http://localhost:3000/pengaturan/sekolah', { waitUntil: 'networkidle' });
  await wait(3000);

  // Scroll ke panel mode jenjang
  await smoothScroll(page, 300, 2000);
  await moveMouseSmooth(page, 600, 450);
  await wait(6000);

  await page.close();
  const videoPath = await page.video().path();
  await context.close();

  const finalPath = path.join(VIDEOS_DIR, '02_video_dasbor_eksekutif.webm');
  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  fs.renameSync(videoPath, finalPath);
  fs.rmdirSync(tempDir, { recursive: true });
  console.log('   ✅ Video Bagian 2 tersimpan:', path.basename(finalPath));
}

// 3. Rekam Bagian 3: Manajemen Kesiswaan & Cetak Kartu Massal (Target: ~68 detik)
async function recordPart3(browser) {
  console.log('\n🎬 [3/8] Merekam Bagian 3: Kesiswaan & Cetak Kartu Pelajar Massal (~68s)...');
  const tempDir = path.join(VIDEOS_DIR, 'temp_p3');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const context = await browser.newContext({
    storageState: STORAGE_STATE_PATH,
    recordVideo: { dir: tempDir, size: { width: 1920, height: 1080 } },
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Buka Data Siswa
  await page.goto('http://localhost:3000/siswa', { waitUntil: 'networkidle' });
  await wait(3500);

  // Tinjau tabel data siswa
  await moveMouseSmooth(page, 600, 360);
  await wait(4000);
  await smoothScroll(page, 200, 2000);
  await wait(4000);

  // Sorot filter & search
  await moveMouseSmooth(page, 1400, 220);
  await wait(3000);

  // Centang checkbox pilih siswa
  const selectAll = await page.$('table thead input[type="checkbox"], table tbody tr:first-child input[type="checkbox"]');
  if (selectAll) {
    const box = await selectAll.boundingBox();
    if (box) {
      await moveMouseSmooth(page, box.x + box.width / 2, box.y + box.height / 2);
      await selectAll.click();
      await wait(3000);
    }
  }

  // Centang beberapa baris tambahan jika ada
  const rowCheckboxes = await page.$$('table tbody tr input[type="checkbox"]');
  for (let i = 0; i < Math.min(3, rowCheckboxes.length); i++) {
    await rowCheckboxes[i].click().catch(() => {});
    await wait(800);
  }
  await wait(2500);

  // Klik tombol Cetak Kartu ({x} Terpilih)
  const cetakBtn = await page.$('button:has-text("Cetak Kartu"), button:has-text("Cetak")');
  if (cetakBtn) {
    const btnBox = await cetakBtn.boundingBox();
    if (btnBox) {
      await moveMouseSmooth(page, btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
      await wait(1000);
      await cetakBtn.click();
      await wait(4000);
    }
  }

  // Interaksi di dalam Modal Cetak Kartu Massal
  // Tinjau kartu depan
  await moveMouseSmooth(page, 960, 500);
  await wait(7000);

  // Klik tab layout "Tampak Depan & Belakang" jika ada
  const tabs = await page.$$('button[role="tab"], div[role="tablist"] button');
  if (tabs.length > 1) {
    await tabs[1].click().catch(() => {});
    await wait(5000);
  }

  // Sorot tombol Print Dokumen
  await moveMouseSmooth(page, 1100, 750);
  await wait(5000);

  // Tutup modal
  const closeBtn = await page.$('button[aria-label="Close"], button:has-text("Tutup"), button:has-text("Batal")');
  if (closeBtn) {
    await closeBtn.click().catch(() => {});
    await wait(3000);
  }

  await wait(3000);
  await page.close();
  const videoPath = await page.video().path();
  await context.close();

  const finalPath = path.join(VIDEOS_DIR, '03_video_kesiswaan_cetak_kartu.webm');
  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  fs.renameSync(videoPath, finalPath);
  fs.rmdirSync(tempDir, { recursive: true });
  console.log('   ✅ Video Bagian 3 tersimpan:', path.basename(finalPath));
}

// 4. Rekam Bagian 4: Akademik, Penjadwalan & E-Rapor Digital (Target: ~54 detik)
async function recordPart4(browser) {
  console.log('\n🎬 [4/8] Merekam Bagian 4: Akademik & Rombel Belajar (~54s)...');
  const tempDir = path.join(VIDEOS_DIR, 'temp_p4');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const context = await browser.newContext({
    storageState: STORAGE_STATE_PATH,
    recordVideo: { dir: tempDir, size: { width: 1920, height: 1080 } },
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Kalender Akademik
  await page.goto('http://localhost:3000/akademik/kalender', { waitUntil: 'networkidle' });
  await wait(3500);
  await moveMouseSmooth(page, 700, 400);
  await wait(4000);
  await smoothScroll(page, 300, 2500);
  await wait(5000);
  await smoothScroll(page, 0, 2000);
  await wait(3000);

  // Pindah ke Kelas & Rombel
  await page.goto('http://localhost:3000/kelas', { waitUntil: 'networkidle' });
  await wait(3500);
  await moveMouseSmooth(page, 800, 350);
  await wait(4000);
  await smoothScroll(page, 350, 3000);
  await wait(6000);
  await smoothScroll(page, 0, 2500);
  await wait(4000);

  await page.close();
  const videoPath = await page.video().path();
  await context.close();

  const finalPath = path.join(VIDEOS_DIR, '04_video_akademik_erapor.webm');
  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  fs.renameSync(videoPath, finalPath);
  fs.rmdirSync(tempDir, { recursive: true });
  console.log('   ✅ Video Bagian 4 tersimpan:', path.basename(finalPath));
}

// 5. Rekam Bagian 5: Kasir SPP & Rekap Tunggakan (Target: ~64 detik)
async function recordPart5(browser) {
  console.log('\n🎬 [5/8] Merekam Bagian 5: Kasir SPP & Rekap Tunggakan (~64s)...');
  const tempDir = path.join(VIDEOS_DIR, 'temp_p5');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const context = await browser.newContext({
    storageState: STORAGE_STATE_PATH,
    recordVideo: { dir: tempDir, size: { width: 1920, height: 1080 } },
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Riwayat SPP
  await page.goto('http://localhost:3000/spp/riwayat', { waitUntil: 'networkidle' });
  await wait(3500);
  await moveMouseSmooth(page, 650, 380);
  await wait(4000);
  await smoothScroll(page, 250, 2500);
  await wait(5000);

  // Sorot filter bulan & status
  await moveMouseSmooth(page, 1300, 220);
  await wait(4000);
  await smoothScroll(page, 0, 2000);
  await wait(3000);

  // Rekap Tunggakan
  await page.goto('http://localhost:3000/spp/tunggakan', { waitUntil: 'networkidle' });
  await wait(3500);
  await moveMouseSmooth(page, 750, 350);
  await wait(4000);
  await smoothScroll(page, 300, 3000);
  await wait(6000);
  await smoothScroll(page, 600, 3000);
  await wait(6000);
  await smoothScroll(page, 0, 2500);
  await wait(4000);

  await page.close();
  const videoPath = await page.video().path();
  await context.close();

  const finalPath = path.join(VIDEOS_DIR, '05_video_keuangan_kasir_spp.webm');
  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  fs.renameSync(videoPath, finalPath);
  fs.rmdirSync(tempDir, { recursive: true });
  console.log('   ✅ Video Bagian 5 tersimpan:', path.basename(finalPath));
}

// 6. Rekam Bagian 6: Layanan Perpustakaan & Inventaris Sarpras (Target: ~41 detik)
async function recordPart6(browser) {
  console.log('\n🎬 [6/8] Merekam Bagian 6: Sarana & Prasarana Kampus (~41s)...');
  const tempDir = path.join(VIDEOS_DIR, 'temp_p6');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const context = await browser.newContext({
    storageState: STORAGE_STATE_PATH,
    recordVideo: { dir: tempDir, size: { width: 1920, height: 1080 } },
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Sarpras di portal
  await page.goto('http://localhost:3000/portal/fasilitas', { waitUntil: 'networkidle' });
  await wait(3500);
  await moveMouseSmooth(page, 800, 350);
  await wait(4000);
  await smoothScroll(page, 400, 3000);
  await wait(5000);
  await smoothScroll(page, 800, 3000);
  await wait(5000);
  await smoothScroll(page, 0, 2500);
  await wait(4000);

  await page.close();
  const videoPath = await page.video().path();
  await context.close();

  const finalPath = path.join(VIDEOS_DIR, '06_video_sarpras_perpustakaan.webm');
  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  fs.renameSync(videoPath, finalPath);
  fs.rmdirSync(tempDir, { recursive: true });
  console.log('   ✅ Video Bagian 6 tersimpan:', path.basename(finalPath));
}

// 7. Rekam Bagian 7: Portal Mandiri Peserta Didik & Orang Tua (Target: ~32 detik)
async function recordPart7(browser) {
  console.log('\n🎬 [7/8] Merekam Bagian 7: Portal Siswa & PPDB Online (~32s)...');
  const tempDir = path.join(VIDEOS_DIR, 'temp_p7');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const context = await browser.newContext({
    recordVideo: { dir: tempDir, size: { width: 1920, height: 1080 } },
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Login Siswa / Wali
  await page.goto('http://localhost:3000/portal/login-siswa', { waitUntil: 'networkidle' });
  await wait(3000);
  await moveMouseSmooth(page, 960, 480);
  await wait(4000);

  // PPDB Online
  await page.goto('http://localhost:3000/portal/ppdb', { waitUntil: 'networkidle' });
  await wait(3500);
  await smoothScroll(page, 350, 2500);
  await moveMouseSmooth(page, 850, 450);
  await wait(5000);
  await smoothScroll(page, 0, 2000);
  await wait(3000);

  await page.close();
  const videoPath = await page.video().path();
  await context.close();

  const finalPath = path.join(VIDEOS_DIR, '07_video_portal_siswa_wali.webm');
  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  fs.renameSync(videoPath, finalPath);
  fs.rmdirSync(tempDir, { recursive: true });
  console.log('   ✅ Video Bagian 7 tersimpan:', path.basename(finalPath));
}

// 8. Rekam Bagian 8: Keamanan Terpadu, Hak Akses RBAC & Penutup (Target: ~40 detik)
async function recordPart8(browser) {
  console.log('\n🎬 [8/8] Merekam Bagian 8: Hak Akses RBAC & Penutup (~40s)...');
  const tempDir = path.join(VIDEOS_DIR, 'temp_p8');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const context = await browser.newContext({
    storageState: STORAGE_STATE_PATH,
    recordVideo: { dir: tempDir, size: { width: 1920, height: 1080 } },
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // Pengaturan Pengguna (RBAC)
  await page.goto('http://localhost:3000/pengaturan/pengguna', { waitUntil: 'networkidle' });
  await wait(3500);
  await moveMouseSmooth(page, 750, 360);
  await wait(4000);
  await smoothScroll(page, 200, 2000);
  await wait(4000);

  // Penutup: Portal Kontak & CTA
  await page.goto('http://localhost:3000/portal', { waitUntil: 'networkidle' });
  await wait(2000);
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await wait(3000);
  await moveMouseSmooth(page, 960, 600);
  await wait(5000);

  await page.close();
  const videoPath = await page.video().path();
  await context.close();

  const finalPath = path.join(VIDEOS_DIR, '08_video_keamanan_penutup.webm');
  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  fs.renameSync(videoPath, finalPath);
  fs.rmdirSync(tempDir, { recursive: true });
  console.log('   ✅ Video Bagian 8 tersimpan:', path.basename(finalPath));
}

// 0. Rekam Master Video Terusan (Continuous Full Video: 00:00 - 06:39)
async function recordMasterVideo(browser) {
  console.log('\n🎥 [MASTER] Merekam Video Penuh Terpadu (00:00 - 06:39, ~6.5 menit)...');
  const tempDir = path.join(VIDEOS_DIR, 'temp_master');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const context = await browser.newContext({
    recordVideo: { dir: tempDir, size: { width: 1920, height: 1080 } },
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  // --- Babak 1: Portal Publik (00:00 - 00:40) ---
  console.log('   ▶ Menjalankan alur Babak 1...');
  await page.goto('http://localhost:3000/portal', { waitUntil: 'networkidle' });
  await wait(4000);
  await moveMouseSmooth(page, 960, 480);
  await wait(4000);
  await smoothScroll(page, 620, 3500);
  await wait(4000);
  await smoothScroll(page, 1400, 3500);
  await wait(4000);
  await smoothScroll(page, 0, 3000);
  await wait(2500);
  await moveMouseSmooth(page, 1500, 20);
  await wait(2000);
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
  await wait(3500);

  // --- Babak 2: Dasbor Eksekutif (00:40 - 01:36) ---
  console.log('   ▶ Menjalankan alur Babak 2...');
  await page.click('#username1');
  await page.type('#username1', 'admin', { delay: 100 });
  await wait(1000);
  await page.click('#password1');
  await page.type('#password1', 'admin123', { delay: 100 });
  await wait(1200);
  await page.click('button[type="submit"]');
  await wait(4000);
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await wait(3000);
  await moveMouseSmooth(page, 450, 260);
  await wait(2500);
  await moveMouseSmooth(page, 750, 260);
  await wait(2500);
  await moveMouseSmooth(page, 1050, 260);
  await wait(2500);
  await moveMouseSmooth(page, 1350, 260);
  await wait(2500);
  await smoothScroll(page, 450, 3000);
  await wait(4000);
  await page.goto('http://localhost:3000/pengaturan/sekolah', { waitUntil: 'networkidle' });
  await wait(3000);
  await smoothScroll(page, 300, 2000);
  await moveMouseSmooth(page, 600, 450);
  await wait(6000);

  // --- Babak 3: Kesiswaan & Kartu Pelajar (01:36 - 02:44) ---
  console.log('   ▶ Menjalankan alur Babak 3...');
  await page.goto('http://localhost:3000/siswa', { waitUntil: 'networkidle' });
  await wait(3500);
  await moveMouseSmooth(page, 600, 360);
  await wait(4000);
  await smoothScroll(page, 200, 2000);
  await wait(4000);
  const rowCheckboxes = await page.$$('table tbody tr input[type="checkbox"]');
  for (let i = 0; i < Math.min(4, rowCheckboxes.length); i++) {
    await rowCheckboxes[i].click().catch(() => {});
    await wait(600);
  }
  await wait(2000);
  const cetakBtn = await page.$('button:has-text("Cetak Kartu"), button:has-text("Cetak")');
  if (cetakBtn) {
    await cetakBtn.click();
    await wait(4000);
    await moveMouseSmooth(page, 960, 500);
    await wait(6000);
    const tabs = await page.$$('button[role="tab"], div[role="tablist"] button');
    if (tabs.length > 1) {
      await tabs[1].click().catch(() => {});
      await wait(5000);
    }
    const closeBtn = await page.$('button[aria-label="Close"], button:has-text("Tutup"), button:has-text("Batal")');
    if (closeBtn) await closeBtn.click().catch(() => {});
    await wait(2500);
  }

  // --- Babak 4: Akademik & Rombel (02:44 - 03:38) ---
  console.log('   ▶ Menjalankan alur Babak 4...');
  await page.goto('http://localhost:3000/akademik/kalender', { waitUntil: 'networkidle' });
  await wait(3500);
  await smoothScroll(page, 300, 2500);
  await wait(5000);
  await page.goto('http://localhost:3000/kelas', { waitUntil: 'networkidle' });
  await wait(3500);
  await smoothScroll(page, 350, 3000);
  await wait(6000);

  // --- Babak 5: Kasir SPP & Tunggakan (03:38 - 04:42) ---
  console.log('   ▶ Menjalankan alur Babak 5...');
  await page.goto('http://localhost:3000/spp/riwayat', { waitUntil: 'networkidle' });
  await wait(3500);
  await smoothScroll(page, 250, 2500);
  await wait(5000);
  await page.goto('http://localhost:3000/spp/tunggakan', { waitUntil: 'networkidle' });
  await wait(3500);
  await smoothScroll(page, 400, 3000);
  await wait(6000);

  // --- Babak 6: Sarpras (04:42 - 05:23) ---
  console.log('   ▶ Menjalankan alur Babak 6...');
  await page.goto('http://localhost:3000/portal/fasilitas', { waitUntil: 'networkidle' });
  await wait(3500);
  await smoothScroll(page, 500, 3000);
  await wait(6000);

  // --- Babak 7: Portal Siswa & PPDB (05:23 - 05:55) ---
  console.log('   ▶ Menjalankan alur Babak 7...');
  await page.goto('http://localhost:3000/portal/login-siswa', { waitUntil: 'networkidle' });
  await wait(3500);
  await moveMouseSmooth(page, 960, 480);
  await wait(3000);
  await page.goto('http://localhost:3000/portal/ppdb', { waitUntil: 'networkidle' });
  await wait(3500);
  await smoothScroll(page, 300, 2500);
  await wait(5000);

  // --- Babak 8: Hak Akses & Penutup (05:55 - 06:39) ---
  console.log('   ▶ Menjalankan alur Babak 8...');
  await page.goto('http://localhost:3000/pengaturan/pengguna', { waitUntil: 'networkidle' });
  await wait(3500);
  await smoothScroll(page, 250, 2000);
  await wait(4000);
  await page.goto('http://localhost:3000/portal', { waitUntil: 'networkidle' });
  await wait(2000);
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await wait(6000);

  await page.close();
  const videoPath = await page.video().path();
  await context.close();

  const finalPath = path.join(VIDEOS_DIR, '00_video_demonstrasi_penuh.webm');
  if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
  fs.renameSync(videoPath, finalPath);
  fs.rmdirSync(tempDir, { recursive: true });
  console.log('   ✅ Video Master Penuh tersimpan:', path.basename(finalPath));
}

async function main() {
  console.log('🚀 Memulai perekaman video screen capture otomatis (1920x1080, Full HD)...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  try {
    // Rekam 8 klip modular per bagian yang sinkron durasi audionya
    await recordPart1(browser);
    await recordPart2(browser);
    await recordPart3(browser);
    await recordPart4(browser);
    await recordPart5(browser);
    await recordPart6(browser);
    await recordPart7(browser);
    await recordPart8(browser);

    // Rekam master video penuh (00:00 - 06:39)
    await recordMasterVideo(browser);

    console.log('\n🎉 SELURUH VIDEO SCREEN CAPTURE BERHASIL DIREKAM!');
  } catch (err) {
    console.error('❌ Terjadi kesalahan saat merekam video:', err);
  } finally {
    await browser.close();
    if (fs.existsSync(STORAGE_STATE_PATH)) fs.unlinkSync(STORAGE_STATE_PATH);
  }
}

main();
