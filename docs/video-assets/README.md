# Paket Produksi Video & Demonstrasi SIMS v1.0

Direktori ini berisi seluruh paket aset siap pakai untuk pembuatan video tutorial dan demonstrasi produk **Sistem Informasi Manajemen Sekolah Terpadu (SIMS)** sesuai naskah master pada dokumen [`docs/skrip-video-demo-sims.md`](../skrip-video-demo-sims.md).

---

## 📁 Struktur Direktori Aset

```text
docs/video-assets/
├── videos/                              # Rekaman Layar Aplikasi Langsung (1920 × 1080 Full HD, .webm)
│   ├── 00_video_demonstrasi_penuh.webm  # Video Master Penuh (Alur Menyeluruh Babak 1 s.d. 8)
│   ├── 01_video_pembuka_identitas.webm  # Bagian 1: Landing Page & Form Login
│   ├── 02_video_dasbor_eksekutif.webm   # Bagian 2: Login, Dasbor Eksekutif & Pengaturan Mode Jenjang
│   ├── 03_video_kesiswaan_cetak_kartu.webm # Bagian 3: Data Siswa & Modal Cetak Kartu Massal QR
│   ├── 04_video_akademik_erapor.webm    # Bagian 4: Kalender Akademik & Kelas Rombel
│   ├── 05_video_keuangan_kasir_spp.webm # Bagian 5: Riwayat SPP & Rekap Tunggakan
│   ├── 06_video_sarpras_perpustakaan.webm # Bagian 6: Sarana Prasarana & Fasilitas Sekolah
│   ├── 07_video_portal_siswa_wali.webm  # Bagian 7: Portal Siswa Mandiri & PPDB Online
│   └── 08_video_keamanan_penutup.webm   # Bagian 8: Hak Akses RBAC & Banner Call to Action
│
├── audio/                               # File Narasi Suara AI Ceria & Bersemangat (id-ID-GadisNeural)
│   ├── 00_narasi_lengkap_semua_bagian.mp3 # Master Audio Penuh (Seluruh Babak Bersambung)
│   ├── 01_pembuka_identitas_sistem.mp3
│   ├── 02_dasbor_eksekutif.mp3
│   ├── 03_kesiswaan_cetak_kartu.mp3
│   ├── 04_akademik_erapor.mp3
│   ├── 05_keuangan_kasir_spp.mp3
│   ├── 06_sarpras_perpustakaan.mp3
│   ├── 07_portal_siswa_wali.mp3
│   └── 08_keamanan_penutup.mp3
│
└── screenshots/                         # Tangkapan Layar Resolusi Full HD (1920 × 1080)
    ├── 01_01_portal_depan_hero.png
    ├── 01_02_portal_keunggulan_profil.png
    ├── 01_03_halaman_login_admin.png
    ├── 02_01_dasbor_eksekutif_admin.png
    ├── 02_02_pengaturan_sekolah_mode.png
    ├── 03_01_direktori_data_siswa.png
    ├── 03_02_modal_cetak_kartu_massal.png
    ├── 04_01_akademik_kalender.png
    ├── 04_02_akademik_kelas_rombel.png
    ├── 05_01_kasir_spp_riwayat.png
    ├── 05_02_spp_rekap_tunggakan.png
    ├── 06_01_sarpras_fasilitas_sekolah.png
    ├── 07_01_portal_siswa_login.png
    ├── 07_02_portal_ppdb_online.png
    ├── 08_01_pengaturan_pengguna_rbac.png
    └── 08_02_portal_kontak_cta.png
```

---

## 🎬 Tabel Pemetaan Klip Video & Audio Narasi (1:1 Pairing Guide)

Setiap klip video telah direkam langsung dari aplikasi Chrome dengan pergerakan kursor dan scroll yang halus, diselaraskan dengan durasi audio narator:

| No | Babak / Modul | File Video Klip (1080p) | File Audio Narator (Ceria) | Screenshot Pendukung |
|:---:|:---|:---|:---|:---|
| ⭐ | **Master Penuh (00:00 - 06:39)** | `00_video_demonstrasi_penuh.webm` | `00_narasi_lengkap_semua_bagian.mp3` | Seluruh Screenshot |
| 1 | **Pembuka & Portal Muka** | `01_video_pembuka_identitas.webm` *(47s)* | `01_pembuka_identitas_sistem.mp3` *(40s)* | `01_01_...`, `01_02_...`, `01_03_...` |
| 2 | **Dasbor & Mode Jenjang** | `02_video_dasbor_eksekutif.webm` *(51s)* | `02_dasbor_eksekutif.mp3` *(56s)* | `02_01_...`, `02_02_...` |
| 3 | **Kesiswaan & Cetak Kartu** | `03_video_kesiswaan_cetak_kartu.webm` *(1m 23s)* | `03_kesiswaan_cetak_kartu.mp3` *(1m 08s)* | `03_01_...`, `03_02_...` |
| 4 | **Akademik & Rombel** | `04_video_akademik_erapor.webm` *(46s)* | `04_akademik_erapor.mp3` *(54s)* | `04_01_...`, `04_02_...` |
| 5 | **Kasir SPP & Tunggakan** | `05_video_keuangan_kasir_spp.webm` *(1m 00s)* | `05_keuangan_kasir_spp.mp3` *(1m 04s)* | `05_01_...`, `05_02_...` |
| 6 | **Sarpras & Fasilitas** | `06_video_sarpras_perpustakaan.webm` *(33s)* | `06_sarpras_perpustakaan.mp3` *(41s)* | `06_01_...` |
| 7 | **Portal Siswa & PPDB** | `07_video_portal_siswa_wali.webm` *(27s)* | `07_portal_siswa_wali.mp3` *(32s)* | `07_01_...`, `07_02_...` |
| 8 | **Hak Akses & Penutup** | `08_video_keamanan_penutup.webm` *(29s)* | `08_keamanan_penutup.mp3` *(40s)* | `08_01_...`, `08_02_...` |

---

## 🛠️ Cara Merakit di CapCut / Canva / Premiere (Kurang dari 5 Menit)

1. **Buka CapCut / Canva / Premiere Pro:** Buat proyek video dengan format horizontal **16:9 (1920 × 1080)**.
2. **Impor Folder `videos/` dan `audio/`:** Tarik semua file video dan audio ke dalam editor.
3. **Pilihan Alur Kerja:**
   - **Metode Instan (1 Track Penuh):** Tarik `00_video_demonstrasi_penuh.webm` ke track video, dan letakkan `00_narasi_lengkap_semua_bagian.mp3` di track audio tepat di bawahnya.
   - **Metode Modular (Per Bagian):** Pasangkan klip video `01_...` dengan audio `01_...`, klip `02_...` dengan audio `02_...`, hingga bagian `08_...`. Anda dapat memotong atau menyesuaikan kecepatan video (*Speed 0.9x – 1.1x*) dengan sangat mudah agar transisi pas di akhir kalimat.
4. **Sentuhan Akhir (Opsional):**
   - Tambahkan musik latar (*Background Music / BGM*) instrumental korporat/ceria dengan volume rendah (-22 dB / 12%).
   - Tambahkan efek transisi antar klip (misal: *Mix / Dissolve* 0,5 detik).
5. **Ekspor Video:** Simpan ke format **MP4 (1080p, 60fps)**. Video tutorial siap ditayangkan atau dipresentasikan!
