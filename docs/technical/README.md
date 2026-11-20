# 🛠️ Paket Dokumen Teknis Perangkat Lunak (Technical Documentation)
## Sistem Informasi Manajemen Sekolah Terpadu (SIMS) v1.0

Dokumentasi teknis resmi ini disusun untuk memberikan panduan komprehensif, arsitektur sistem, kamus data, spesifikasi API, serta panduan operasional bagi arsitek perangkat lunak (*Software Architects*), pengembang (*Software Engineers*), administrator basis data (*DBA*), insinyur integrasi, serta tim infrastruktur (*DevOps*). Seluruh berkas disajikan dalam format **Microsoft Word (`.docx`)** menggunakan template cover resmi Canva, tata letak standar A4, dan penomoran bab di halaman baru.

---

### 📂 Daftar Berkas Buku Dokumen Teknis Resmi (.docx)

| No | Berkas Buku Teknis (.docx) | Target Pembaca | Cakupan Spesifikasi Teknis Utama | Status |
|:---:|:---|:---|:---|:---:|
| **1** | [**`01-arsitektur-sistem-desain.docx`**](./01-arsitektur-sistem-desain.docx) | Software Engineers, System Architects, Security Auditors | Arsitektur Next.js 16 App Router (Turbopack), Server vs Client Components, Tech Stack terintegrasi, Model Hak Akses RBAC, Mesin Audit Trail, dan Mitigasi Keamanan Siber. | **Selesai** ✅ |
| **2** | [**`02-kamus-data-database-erd.docx`**](./02-kamus-data-database-erd.docx) | Database Administrators (DBA), Backend Engineers, Data Engineers | Arsitektur PostgreSQL 15+, Skema Prisma ORM, Diagram Relasi Entitas (ERD), Kamus Data Lengkap 43 Tabel Relasional, Indeks Kueri Kritis, Integritas Referensial, dan Disaster Recovery. | **Selesai** ✅ |
| **3** | [**`03-katalog-api-integrasi.docx`**](./03-katalog-api-integrasi.docx) | Backend Engineers, Frontend Devs, Mobile Devs, QA Engineers | Standar RESTful API, Unified JSON Envelope, NextAuth JWT & Portal Siswa Auth, API Guard RBAC, Rate Limiting Brute-Force, Spesifikasi 10 Modul Endpoint, Webhook WhatsApp, dan Payment Gateway. | **Selesai** ✅ |
| **4** | [**`04-panduan-deployment-devops.docx`**](./04-panduan-deployment-devops.docx) | DevOps, System Administrators, IT Operations | Panduan Instalasi Server Linux, Environment Variables, Reverse Proxy Nginx, SSL Let's Encrypt, Containerization Docker, CI/CD Pipeline, Otomasi Backup Database, dan Troubleshooting. | **Selesai** ✅ |

---

### 🎨 Ketentuan Format Standar yang Diterapkan:
1. **Cover Eksklusif (Canva Template):** Menggunakan grafis banner resolusi tinggi asli, subjudul resmi per buku, serta area kosong untuk penyematan Logo, Nama Sekolah, dan Versi/Tahun saat implementasi mandiri oleh pihak sekolah.
2. **Lembar Kontrol Dokumen:** Tertera pada Halaman 2 lengkap dengan Nomor Dokumen resmi (`DOC-SIMS-TECH-0X`), Sasaran Pembaca, Versi Teknis v1.0, dan Status Pengesahan.
3. **Standar Bab (New Page):** Setiap bab utama selalu dimulai pada halaman baru (*New Page*).
4. **Border Tabel 100% Seragam:** Seluruh sisi tabel (Atas, Bawah, Kiri, Kanan, dan Garis Dalam) konsisten menggunakan warna abu-abu lembut institusi (`#CBD5E1`).
5. **Code Blocks & API Payloads:** Blok kode monospaced Consolas dalam wadah abu-abu lembut (`#F8FAFC`) dengan border halus (`#E2E8F0`).
