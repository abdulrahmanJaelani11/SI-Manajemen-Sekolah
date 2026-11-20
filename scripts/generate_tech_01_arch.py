import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx_manual_builder import (
    create_base_document,
    add_heading_1,
    add_heading_2,
    add_heading_3,
    add_paragraph,
    add_bullet,
    add_step,
    add_callout,
    add_styled_table,
    add_menu_path,
    add_code_block
)

def build_tech_01_arch():
    output_path = os.path.join("docs", "technical", "01-arsitektur-sistem-desain.docx")
    
    doc = create_base_document(
        book_series_title="BUKU TEKNIS 1: ARSITEKTUR SISTEM, DESAIN PERANGKAT LUNAK & KEAMANAN",
        book_subtitle="Dokumentasi Arsitektur Perangkat Lunak Tingkat Tinggi (High-Level Architecture), Spesifikasi Tech Stack Terintegrasi (Next.js 16, React 19, TypeScript, Prisma ORM, PostgreSQL), Pola Desain Komponen, Model Hak Akses (RBAC), Sistem Audit Trail, serta Mitigasi Keamanan Siber.",
        doc_id="DOC-SIMS-TECH-01-ARCH",
        target_roles="Software Engineers, System Architects, Security Auditors, IT Lead / DevOps",
        version="1.0",
        doc_category="Dokumen Teknis"
    )
    
    # ==================== DAFTAR ISI / RINGKASAN ====================
    add_heading_1(doc, "RINGKASAN EKSEKUTIF & DAFTAR ISI DOKUMEN TEKNIS", page_break=False)
    add_paragraph(
        doc,
        "Dokumen Teknis Buku 1 ini menyajikan blueprint arsitektur perangkat lunak komprehensif dari Sistem Informasi Manajemen Sekolah Terpadu (SIMS) v1.0. Dokumen ini ditujukan sebagai referensi teknis otoritatif bagi tim pengembang perangkat lunak, arsitek sistem, dan auditor keamanan dalam memahami fondasi arsitektur, aliran data antar-lapisan, integrasi tech stack modern (Next.js 16 App Router, React 19, TypeScript, Prisma ORM, PostgreSQL), serta mekanisme pertahanan keamanan siber dan audit trail sistem."
    )
    
    toc_data = [
        ("BAB 1", "Arsitektur Sistem Tingkat Tinggi (High-Level Architecture)", "Next.js App Router, Turbopack, Client/Server Component, dan API Handlers"),
        ("BAB 2", "Spesifikasi Tech Stack & Ekosistem Perangkat Lunak", "Frontend, Backend, ORM, Basis Data PostgreSQL, dan pustaka pendukung"),
        ("BAB 3", "Model Keamanan & Otorisasi Hak Akses (RBAC Engine)", "Mekanisme JWT NextAuth, skema tabel RBAC dinamis, dan route guards"),
        ("BAB 4", "Arsitektur Pengawasan Sistem & Audit Trail Logger", "Tabel sec_audit_log, logger non-blocking, dan snapshot diff JSON"),
        ("BAB 5", "Mitigasi Kerentanan Siber & Standar Keamanan Data", "Proteksi SQL Injection, mitigasi XSS, enkripsi Bcrypt, dan batasan sesi"),
        ("BAB 6", "Sistem Desain Antarmuka & Pola Komponen Atomik", "Theme Provider Dark/Light, SearchableSelect, dan engine cetak resmi"),
        ("BAB 7", "Struktur Direktori Proyek & Konvensi Rekayasa Kode", "Peta direktori src/app, standar penamaan, dan penanganan error standar"),
    ]
    add_styled_table(
        doc,
        headers=["Bab", "Topik Pembahasan Teknis", "Cakupan Spesifikasi Arsitektur"],
        rows=toc_data,
        col_widths=[Inches(0.9), Inches(2.6), Inches(2.6)]
    )
    
    add_callout(
        doc,
        "IMPORTANT",
        "Kepatuhan Arsitektur dan Standar Rekayasa Kode",
        "Seluruh pengembangan fitur baru dan integrasi pihak ketiga diwajibkan mematuhi standar arsitektur yang dituangkan dalam dokumen ini, termasuk pemisahan tugas komponen server/client, penggunaan Prisma parameterized queries untuk mencegah SQL Injection, serta pemanggilan rutin logAudit() pada setiap mutasi data."
    )
    
    # ==================== BAB 1 ====================
    add_heading_1(doc, "BAB 1: ARSITEKTUR SISTEM TINGKAT TINGGI (HIGH-LEVEL ARCHITECTURE)")
    
    add_heading_2(doc, "1.1 Paradigma Arsitektur Next.js 16 App Router & Turbopack")
    add_paragraph(
        doc,
        "SIMS dibangun di atas fondasi Next.js 16 dengan Turbopack bundler yang mengadopsi paradigma App Router modern. Paradigma ini menggabungkan rendering sisi server (Server-Side Rendering / SSR) dengan interaktivitas sisi klien (Client-Side Hydration) secara optimal, menghasilkan waktu muat awal (*First Contentful Paint*) yang sangat cepat dan keamanan data yang terisolasi."
    )
    
    add_heading_2(doc, "1.2 Arsitektur Tiga Lapis (Three-Tier Architecture)")
    add_paragraph(
        doc,
        "Sistem menerapkan pemisahan tanggung jawab (*Separation of Concerns*) ke dalam tiga lapisan logis utama:"
    )
    
    arch_layers = [
        ("Presentation Layer (Frontend)", "React 19 Server & Client Components, TailwindCSS, DashboardLayout", "Bertanggung jawab atas antarmuka pengguna, rendering grafis, penanganan event formulir, dan validasi visual."),
        ("Application & Business Logic Layer", "Next.js Route Handlers (/api/*), Middleware, Audit Logger, NextAuth", "Menjalankan aturan bisnis sekolah, verifikasi hak akses RBAC, kalkulasi keuangan, dan orkestrasi alur transaksi."),
        ("Data Persistence Layer", "Prisma ORM Client & PostgreSQL 15+ Relational Database", "Bertanggung jawab atas persistensi data relasional, transaksi ACID, pengindeksan data, dan integritas referensial."),
    ]
    add_styled_table(
        doc,
        headers=["Lapisan Arsitektur (Layer)", "Teknologi & Modul Utama", "Tanggung Jawab Teknis"],
        rows=arch_layers,
        col_widths=[Inches(1.8), Inches(2.1), Inches(2.2)]
    )
    
    add_heading_2(doc, "1.3 Pemisahan Server Components vs Client Components")
    add_paragraph(
        doc,
        "Untuk menjaga keamanan dan performa transmisi data, sistem membagi komponen ke dalam dua kategori secara tegas:"
    )
    add_bullet(doc, "Komponen yang dirender 100% di server tanpa menyertakan kode JavaScript ke peramban. Sangat aman untuk menjalankan operasi basis data sensitif, membaca variabel lingkungan privat (.env), dan mengurangi ukuran bundle klien.", "• React Server Components (RSC): ")
    add_bullet(doc, "Komponen interaktif yang ditandai dengan direktif 'use client' di baris teratas. Digunakan untuk elemen UI interaktif seperti modal dialog, dropdown SearchableSelect, kalkulasi kasir kasir, dan penanganan klik tombol.", "• Client Components ('use client'): ")
    
    add_heading_2(doc, "1.4 Pola API Route Handlers & Serverless Functions")
    add_paragraph(
        doc,
        "Seluruh komunikasi data antara frontend dan backend berlangsung melalui endpoint RESTful Route Handlers di direktori `src/app/api/`. Setiap rute mengekspor fungsi HTTP eksplisit (GET, POST, PUT, DELETE) dengan pembungkus standar response:"
    )
    add_code_block(doc, """// Pola Standar API Route Handler (Next.js 16)
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiSuccess, apiError } from '@/lib/api-response'
import { logAudit } from '@/lib/audit-logger'

export async function GET(req: NextRequest) {
  try {
    const data = await prisma.akademikKalender.findMany({ orderBy: { tanggalMulai: 'asc' } })
    return apiSuccess({ data, message: 'Daftar kalender berhasil dimuat' })
  } catch (error: any) {
    return apiError(error.message, 500)
  }
}""")
    
    # ==================== BAB 2 ====================
    add_heading_1(doc, "BAB 2: SPESIFIKASI TECH STACK & EKOSISTEM PERANGKAT LUNAK")
    
    add_paragraph(
        doc,
        "Pemilihan komponen tech stack didasarkan pada prinsip keandalan jangka panjang (*LTS / Long-Term Support*), keamanan tipe data statis (*Type Safety*), dan skalabilitas konkurensi tinggi."
    )
    
    add_heading_2(doc, "2.1 Matriks Teknologi Inti Sistem")
    tech_matrix = [
        ("Framework Inti", "Next.js v16.3.5 (Turbopack Engine)", "Framework React full-stack dengan perutean berbasis folder (App Router)."),
        ("Bahasa Pemrograman", "TypeScript v5.x (Strict Mode: True)", "Menjamin pencegahan bug runtime melalui pengetikan statis ketat."),
        ("Pustaka Antarmuka (UI)", "React v19.x & TailwindCSS v3.4.x", "Rendering antarmuka reaktif dan styling utility-first yang efisien."),
        ("ORM & Migrasi", "Prisma ORM v6.x Client & Studio", "Object-Relational Mapping dengan skema terpusat di prisma/schema.prisma."),
        ("Basis Data Relasional", "PostgreSQL v15+ (ACID Compliant)", "Engine basis data enterprise dengan dukungan JSONB dan relasi kompleks."),
        ("Autentikasi & Sesi", "NextAuth.js v4.x / JWT Strategy", "Manajemen token sesi terenkripsi HTTP-Only Cookie."),
        ("Tipografi & Desain", "Solar Icons, Lucide React & Tabler Icons", "Keluarga ikon vektor modern beresolusi tajam."),
        ("Pemrosesan Dokumen", "python-docx v1.2 & PyMuPDF (fitz)", "Engine pembangkitan berkas Word (.docx) dan PDF otomatis."),
    ]
    add_styled_table(
        doc,
        headers=["Kategori Komponen", "Teknologi & Versi Rilis", "Peran & Justifikasi Teknis"],
        rows=tech_matrix,
        col_widths=[Inches(1.8), Inches(2.2), Inches(2.1)]
    )
    
    add_heading_2(doc, "2.2 Pengelolaan Basis Data Relasional dengan Prisma ORM")
    add_paragraph(
        doc,
        "Prisma ORM bertindak sebagai jembatan data typesafe antara TypeScript dan PostgreSQL. Skema basis data terdefinisi tunggal pada berkas `prisma/schema.prisma`. Seluruh model data dikonversi secara otomatis menjadi tipe TypeScript statis, sehingga setiap pemanggilan data terverifikasi pada saat proses kompilasi kode."
    )
    
    # ==================== BAB 3 ====================
    add_heading_1(doc, "BAB 3: MODEL KEAMANAN & OTORISASI HAK AKSES (RBAC ENGINE)")
    
    add_paragraph(
        doc,
        "Keamanan akses SIMS mengimplementasikan arsitektur Role-Based Access Control (RBAC) granular yang terdesentralisasi pada tingkat basis data. Tidak ada hak akses yang di-*hardcode* di dalam kode program; seluruh izin menu dikontrol secara dinamis."
    )
    
    add_heading_2(doc, "3.1 Skema Data Entitas RBAC")
    add_paragraph(
        doc,
        "Hubungan antar-entitas otorisasi dibangun melalui 4 tabel utama pada PostgreSQL:"
    )
    add_bullet(doc, "Menyimpan daftar peran kerja (Admin, Guru, Bendahara, Wali Kelas, Pustakawan, Sarpras, Kesiswaan).", "• secRole: ")
    add_bullet(doc, "Menyimpan seluruh pohon navigasi menu dan sub-menu aplikasi beserta URL rutenya.", "• secMenu: ")
    add_bullet(doc, "Tabel relasi many-to-many yang memetakan menu apa saja yang berhak diakses oleh peran tertentu, lengkap dengan flag hak operasional (canRead, canCreate, canUpdate, canDelete).", "• secRoleMenu: ")
    add_bullet(doc, "Tabel pemetaan yang menghubungkan satu akun pengguna (secUser) ke satu atau beberapa peran kerja.", "• secUserRole: ")
    
    add_heading_2(doc, "3.2 Alur Autentikasi JSON Web Token (JWT)")
    add_step(doc, 1, "Pengiriman Kredensial", "Klien mengirimkan Username/Email dan Password melalui POST /api/auth/callback/credentials.")
    add_step(doc, 2, "Verifikasi Hash Kredensial", "Backend memvalidasi akun pada basis data dan mencocokkan password terenkripsi menggunakan Bcrypt compare.")
    add_step(doc, 3, "Penyusunan Payload Token", "Jika cocok, sistem membentuk token JWT yang memuat identitas pengguna, ID peran, daftar kode peran aktif, dan masa berlaku token.")
    add_step(doc, 4, "Penyimpanan Cookie HTTP-Only", "Token ditandatangani dengan algoritma HS256 menggunakan kunci rahasia NEXTAUTH_SECRET dan disimpan pada browser sebagai Secure HTTP-Only Cookie.")
    add_step(doc, 5, "Resolusi Matriks Menu Dinamis", "Saat pengguna memuat halaman dashboard, sistem mengeksekusi query relasional secRoleMenu untuk menyaring daftar menu sidebar yang berhak ditampilkan secara real-time.")
    
    # ==================== BAB 4 ====================
    add_heading_1(doc, "BAB 4: ARSITEKTUR PENGAWASAN SISTEM & AUDIT TRAIL LOGGER")
    
    add_paragraph(
        doc,
        "Untuk menjamin integritas data dan memenuhi standar audit forensik IT, SIMS dilengkapi modul Audit Trail otomatis yang merekam setiap operasi mutasi data (CREATE, UPDATE, DELETE) serta autentikasi (LOGIN, LOGOUT)."
    )
    
    add_heading_2(doc, "4.1 Struktur Skema Tabel Audit Log (`sec_audit_log`)")
    audit_columns = [
        ("id", "BIGSERIAL (Primary Key)", "Identifier unik berurutan kronologis."),
        ("userId", "BIGINT (Indexed)", "ID pengguna pelaksana aksi mutasi."),
        ("username", "VARCHAR(100)", "Nama pengguna saat aksi dieksekusi."),
        ("role", "VARCHAR(50)", "Peran aktif pengguna saat melakukan mutasi."),
        ("modul", "VARCHAR(50) (Indexed)", "Modul sistem (AKADEMIK, KEUANGAN, KESISWAAN, SARPRAS, PERPUS, AUTH)."),
        ("aksi", "VARCHAR(50) (Indexed)", "Jenis aksi (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, EXPORT)."),
        ("deskripsi", "TEXT", "Narasi penjelasan peristiwa transaksi."),
        ("dataSebelum", "JSONB (Nullable)", "Snapshot kondisi data lengkap sebelum operasi UPDATE/DELETE."),
        ("dataSesudah", "JSONB (Nullable)", "Snapshot kondisi data lengkap setelah operasi CREATE/UPDATE."),
        ("ipAddress", "VARCHAR(50)", "Alamat IP perangkat klien asal transaksi."),
        ("userAgent", "TEXT", "Identitas peramban web dan sistem operasi perangkat."),
        ("status", "VARCHAR(20) (Indexed)", "Status hasil eksekusi (SUCCESS, FAILED, WARNING)."),
        ("createdAt", "TIMESTAMP (Indexed)", "Waktu presisi mutasi data (waktu server)."),
    ]
    add_styled_table(
        doc,
        headers=["Nama Kolom", "Tipe Data & Indeks", "Deskripsi Fungsional Forensik"],
        rows=audit_columns,
        col_widths=[Inches(1.5), Inches(2.1), Inches(2.5)]
    )
    
    add_heading_2(doc, "4.2 Implementasi Logger Non-Blocking (`src/lib/audit-logger.ts`)")
    add_paragraph(
        doc,
        "Pencatatan audit log diimplementasikan secara asinkronus dan non-blocking agar tidak menambah beban latency (waktu respons) pada operasi utama pengguna:"
    )
    add_code_block(doc, """// Implementasi Helper logAudit (src/lib/audit-logger.ts)
export async function logAudit(params: {
  userId?: number | string
  username?: string
  role?: string
  modul: 'AKADEMIK' | 'KEUANGAN' | 'KESISWAAN' | 'PERPUSTAKAAN' | 'SARPRAS' | 'AUTH'
  aksi: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT'
  deskripsi: string
  dataSebelum?: any
  dataSesudah?: any
  ipAddress?: string
  userAgent?: string
  status?: 'SUCCESS' | 'FAILED' | 'WARNING'
}) {
  try {
    await prisma.auditLog.create({
      data: {
        ...params,
        dataSebelum: params.dataSebelum ? JSON.stringify(params.dataSebelum) : null,
        dataSesudah: params.dataSesudah ? JSON.stringify(params.dataSesudah) : null,
        status: params.status || 'SUCCESS',
      }
    })
  } catch (err) {
    console.error('Audit log recording failed silently:', err)
  }
}""")
    
    # ==================== BAB 5 ====================
    add_heading_1(doc, "BAB 5: MITIGASI KERENTANAN SIBER & STANDAR KEAMANAN DATA")
    
    add_paragraph(
        doc,
        "Arsitektur keamanan SIMS dirancang mengacu pada standar OWASP Top 10 untuk memitigasi potensi ancaman keamanan siber pada institusi pendidikan."
    )
    
    add_heading_2(doc, "5.1 Mitigasi SQL Injection (Parameterized Queries)")
    add_paragraph(
        doc,
        "Sistem tidak pernah mengeksekusi string query SQL mentah (*raw string concatenation*). Seluruh interaksi basis data dilewatkan melalui Prisma Query Engine yang secara otomatis menggunakan Parameterized Queries / Prepared Statements, sehingga karakter berbahaya seperti kutip tunggal atau injeksi UNION SELECT akan diperlakukan murni sebagai literal string tanpa dieksekusi oleh PostgreSQL engine."
    )
    
    add_heading_2(doc, "5.2 Mitigasi Cross-Site Scripting (XSS)")
    add_paragraph(
        doc,
        "React Virtual DOM secara native melakukan sanitasi dan *HTML-escaping* terhadap seluruh variabel yang dirender ke antarmuka peramban. Sistem menghindari penggunaan `dangerouslySetInnerHTML`. Untuk input teks bebas dari pengguna, sistem menerapkan sanitasi server-side sebelum disimpan ke basis data."
    )
    
    add_heading_2(doc, "5.3 Keamanan Kredensial & Kriptografi Kata Sandi")
    add_paragraph(
        doc,
        "Kata sandi pengguna dienkripsi searah (*one-way cryptographic hash*) menggunakan algoritma Bcrypt dengan Salt Rounds minimum 10. Kata sandi asli dalam bentuk teks polos (*plaintext*) tidak pernah dicatat pada log server, audit trail, maupun tabel basis data."
    )
    
    # ==================== BAB 6 ====================
    add_heading_1(doc, "BAB 6: SISTEM DESAIN & POLA KOMPONEN ATOMIK")
    
    add_paragraph(
        doc,
        "Konsistensi antarmuka pengguna dibangun menggunakan sistem desain komponen atomik (*Atomic Design System*) yang menjamin standarisasi tampilan di seluruh modul dashboard."
    )
    
    add_heading_2(doc, "6.1 Standarisasi Dropdown Pencarian (`SearchableSelect`)")
    add_paragraph(
        doc,
        "Untuk mencegah kendala pemilihan data pada tabel dengan ribuan baris siswa atau guru, seluruh elemen pemilihan di sistem distandarisasi menggunakan komponen `SearchableSelect` yang dilengkapi:"
    )
    add_bullet(doc, "Menyaring opsi secara real-time saat pengguna mengetik nama atau nomor induk.", "• Fitur Live Search Cepat: ")
    add_bullet(doc, "Mendukung penyesuaian otomatis saat dashboard beralih ke Mode Gelap.", "• Kompatibilitas Dark/Light Mode: ")
    add_bullet(doc, "Dapat dioperasikan menggunakan tombol panah atas/bawah dan tombol Enter.", "• Navigasi Keyboard Penuh: ")
    
    add_heading_2(doc, "6.2 Engine Pratinjau & Format Cetak Dokumen Resmi")
    add_paragraph(
        doc,
        "Setiap modul pelaporan resmi (Kwitansi SPP, E-Rapor, Laporan Arus Kas, Label Aset) memiliki aturan CSS Print Media `@media print` terisolasi:"
    )
    add_bullet(doc, "Sidebar navigasi, top header, tombol aksi, dan dialog modal abu-abu disembunyikan sepenuhnya dari lembar cetak.", "• Eliminasi Elemen UI Web: ")
    add_bullet(doc, "Format dokumen otomatis menerapkan ukuran A4 atau Thermal Roll 80mm dengan skala 100% tanpa margin ganda.", "• Presisi Skala Media Kertas: ")
    add_bullet(doc, "Kop surat sekolah, logo resmi, dan kolom tanda tangan pimpinan tercetak simetris pada lembar fisik.", "• Kop Dokumen Resmi: ")
    
    # ==================== BAB 7 ====================
    add_heading_1(doc, "BAB 7: STRUKTUR DIREKTORI PROYEK & KONVENSI REKAYASA KODE")
    
    add_paragraph(
        doc,
        "Struktur direktori proyek disusun secara modular berbasis App Router untuk memudahkan kolaborasi antartim pengembang perangkat lunak."
    )
    
    add_heading_2(doc, "7.1 Peta Arsitektur Direktori Utama")
    dir_map = [
        ("src/app/(DashboardLayout)/*", "Halaman antarmuka dashboard admin terproteksi (Akademik, Keuangan, Kesiswaan, Sarpras, Pengaturan)."),
        ("src/app/portal/*", "Halaman portal web publik sekolah (Landing Page, Profil, Berita, PPDB, dan Portal Mandiri Siswa)."),
        ("src/app/api/*", "Seluruh rute REST API Route Handlers backend (GET, POST, PUT, DELETE) yang melayani data sistem."),
        ("src/components/*", "Komponen antarmuka atomik yang dapat digunakan kembali (SearchableSelect, Modals, Forms, Alerts)."),
        ("src/lib/*", "Utilitas sistem, inisialisasi prisma client (prisma.ts), helper audit log (audit-logger.ts), dan API wrappers."),
        ("prisma/*", "Skema database relasional (schema.prisma) dan berkas migrasi database PostgreSQL."),
        ("public/*", "Aset statis publik (logo sekolah, ikon, gambar ilustrasi, dan folder unggahan berita/sampul buku)."),
        ("scripts/*", "Skrip utilitas otomasi (seeding data awal, verifikasi end-to-end, dan generator dokumen teknis/manual)."),
        ("docs/*", "Pusat dokumentasi resmi institusi (Buku User Manual dan Dokumen Teknis Perangkat Lunak)."),
    ]
    add_styled_table(
        doc,
        headers=["Jalur Direktori (Path)", "Deskripsi & Peran Arsitektur"],
        rows=dir_map,
        col_widths=[Inches(2.5), Inches(3.6)]
    )
    
    add_heading_2(doc, "7.2 Konvensi Penanganan Kesalahan Terpusat (Error Handling)")
    add_paragraph(
        doc,
        "Untuk mencegah kebocoran informasi teknis server (*stack trace leakage*), setiap kesalahan di lapis API ditangkap melalui blok try-catch dan dikembalikan dalam struktur response JSON terstandar dengan HTTP code yang sesuai (400, 401, 403, 404, 500)."
    )
    
    add_callout(
        doc,
        "TIP",
        "Rekomendasi Pemeliharaan Kode Sumber",
        "Sebelum melakukan commit kode baru ke repository Git, pengembang diwajibkan menjalankan verifikasi pemeriksaan tipe TypeScript statis: npx tsc --noEmit guna memastikan nol kesalahan tipe pada seluruh basis kode."
    )
    
    # Save document
    doc.save(output_path)
    print(f"✅ Dokumen berhasil dibuat: {output_path}")

if __name__ == "__main__":
    build_tech_01_arch()

