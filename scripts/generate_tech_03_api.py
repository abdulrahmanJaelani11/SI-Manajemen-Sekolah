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

def build_tech_03_api():
    output_path = os.path.join("docs", "technical", "03-katalog-api-integrasi.docx")
    
    doc = create_base_document(
        book_series_title="BUKU TEKNIS 3: KATALOG REST API, SPESIFIKASI ENDPOINT & INTEGRASI SISTEM",
        book_subtitle="Dokumentasi Lengkap Antarmuka Pemrograman Aplikasi (RESTful API), Standar Unified JSON Envelope, Mekanisme Autentikasi JWT & API Guard, Rate Limiting & Proteksi Brute-Force, Serta Spesifikasi 10 Modul Endpoint Operasional.",
        doc_id="DOC-SIMS-TECH-03-API",
        target_roles="Backend Engineers, Frontend Developers, Mobile App Developers, Integration Specialists, QA Engineers",
        version="1.0",
        doc_category="Dokumen Teknis"
    )
    
    # ==================== DAFTAR ISI / RINGKASAN ====================
    add_heading_1(doc, "RINGKASAN EKSEKUTIF & DAFTAR ISI DOKUMEN TEKNIS", page_break=False)
    add_paragraph(
        doc,
        "Dokumen Teknis Buku 3 ini menyajikan spesifikasi antarmuka pemrograman aplikasi (Application Programming Interface / API) resmi dari Sistem Informasi Manajemen Sekolah Terpadu (SIMS) v1.0. Dokumen ini dirancang sebagai panduan definitif dan referensi teknis otoritatif bagi tim pengembang frontend, pengembang aplikasi mobile, insinyur integrasi pihak ketiga, dan auditor mutu perangkat lunak (QA Engineers). Seluruh komunikasi data dalam SIMS mengikuti standar arsitektur RESTful murni dengan format muatan (payload) JSON universal, perlindungan keamanan bertingkat (JWT session, API Guard RBAC, teacher scoping), dan penanganan batas laju (Rate Limiting) untuk menjamin keandalan sistem pada skala operasional penuh."
    )
    
    toc_data = [
        ("BAB 1", "Standar Arsitektur RESTful API & Protokol Komunikasi", "Resource design, HTTP verbs, status codes, dan Unified JSON Response Envelope"),
        ("BAB 2", "Mekanisme Keamanan API, Autentikasi & Rate Limiting", "NextAuth JWT, Portal Siswa NISN token, API Guard requirePermission, dan rate limiter"),
        ("BAB 3", "Spesifikasi API Autentikasi, Pengguna & Konfigurasi Lembaga", "Auth login/logout/me, reset limit, pengguna, RBAC hak akses, menu dinamis, profil & mode"),
        ("BAB 4", "Spesifikasi API Master Data Pokok, Rombel & Kalender Akademik", "Master jenjang, tingkat, jurusan, rombel kelas, mapel, tahun ajaran aktif, dan kalender"),
        ("BAB 5", "Spesifikasi API Kesiswaan, PPDB Online & Penilaian E-Rapor", "Data kesiswaan, stats, import/export CSV, nilai, bobot, rapor, presensi kelas/gerbang, PPDB"),
        ("BAB 6", "Spesifikasi API Keuangan, Transaksi SPP & Buku Kas Umum", "Kasir SPP, kuitansi thermal, tarif, tunggakan bulan berjalan, tagihan non-SPP, cicilan, kas"),
        ("BAB 7", "Spesifikasi API Perpustakaan, Sarpras & CMS Publik", "Katalog buku, sirkulasi QR barcode, denda, inventaris barang, ruangan, CMS, upload file"),
        ("BAB 8", "Standar Integrasi Eksternal, Webhooks & Best Practices", "Gateway WhatsApp notifikasi, rencana payment gateway VA/QRIS, Dapodik, dan checklist"),
    ]
    add_styled_table(
        doc,
        headers=["Bab", "Topik Pembahasan Teknis", "Cakupan Spesifikasi REST API"],
        rows=toc_data,
        col_widths=[Inches(0.9), Inches(2.6), Inches(2.6)]
    )
    
    add_callout(
        doc,
        "IMPORTANT",
        "Kepatuhan Protokol & Keamanan Komunikasi Data API",
        "Seluruh permintaan API wajib menggunakan protokol terenkripsi HTTPS (port 443). Setiap request mutasi data (POST, PUT, DELETE) wajib menyertakan cookie autentikasi yang valid atau Bearer Token, memiliki header 'Content-Type: application/json', dan tunduk pada pemeriksaan otorisasi berbasis peran (Role-Based Access Control) yang ditegakkan oleh middleware backend."
    )
    
    # ==================== BAB 1 ====================
    add_heading_1(doc, "BAB 1: STANDAR ARSITEKTUR RESTFUL API & PROTOKOL KOMUNIKASI")
    
    add_heading_2(doc, "1.1 Paradigma Arsitektur Berbasis Sumber Daya (Resource-Oriented REST)")
    add_paragraph(
        doc,
        "Arsitektur API pada SIMS mengadopsi prinsip representational state transfer (REST) yang memetakan entitas operasional sekolah sebagai sumber daya (*resources*) yang dapat diakses secara unik melalui Uniform Resource Identifiers (URI). Seluruh rute API tersentralisasi di bawah root URL aplikasi:"
    )
    add_bullet(doc, "Root URL API Standar: https://[domain-sekolah.sch.id]/api/", "• Base URL: ")
    add_bullet(doc, "Format Payload: JSON (JavaScript Object Notation) dengan encoding UTF-8 standar.", "• Data Format: ")
    add_bullet(doc, "Model Interaksi: Stateless (setiap request membawa kredensial autentikasi lengkap tanpa mempertahankan sesi memori server).", "• Sifat Koneksi: ")
    
    add_heading_2(doc, "1.2 Konvensi Metode HTTP (HTTP Verbs)")
    add_paragraph(
        doc,
        "Sistem menerapkan pemetaan fungsi CRUD (*Create, Read, Update, Delete*) terhadap metode HTTP standar secara ketat dan konsisten:"
    )
    
    verbs_data = [
        ("GET", "Membaca / Mengambil Sumber Daya", "Idempoten dan aman (read-only). Mendukung kueri filter, pencarian, dan pagination via query params. Contoh: GET /api/siswa?jenjangId=4"),
        ("POST", "Membuat Sumber Daya Baru", "Non-idempoten. Memproses data baru di body request JSON. Contoh: POST /api/spp/bayar untuk transaksi kuitansi."),
        ("PUT", "Memperbarui Sumber Daya Menyeluruh", "Idempoten. Menggantikan seluruh atau sebagian besar atribut sumber daya yang sudah ada. Contoh: PUT /api/pengaturan/sekolah."),
        ("DELETE", "Menghapus Sumber Daya", "Idempoten. Menghapus entitas berdasarkan identifier unik (ID). Contoh: DELETE /api/master/kelas/12."),
    ]
    add_styled_table(
        doc,
        headers=["Metode HTTP", "Tujuan Operasional", "Karakteristik & Contoh Penggunaan"],
        rows=verbs_data,
        col_widths=[Inches(1.1), Inches(2.2), Inches(2.8)]
    )
    
    add_heading_2(doc, "1.3 Standar Format Respon Universal (Unified JSON Envelope)")
    add_paragraph(
        doc,
        "Untuk memudahkan konsumsi data oleh klien (web dashboard, portal siswa, aplikasi mobile, maupun skrip eksternal), seluruh endpoint backend membungkus respon dalam struktur standar (Unified Envelope) melalui fungsi helper resmi src/lib/api-response.ts:"
    )
    
    add_heading_3(doc, "A. Struktur Respon Sukses (HTTP 200 OK / 201 Created)")
    add_code_block(doc, """// Format JSON Respon Sukses Universal
{
  "success": true,
  "message": "Data peserta didik berhasil dimuat",
  "data": [
    {
      "id": 1,
      "nis": "22230028",
      "nisn": "0051234028",
      "nama": "Abdul Rahman Jaelani",
      "kelas": { "id": 5, "namaKelas": "XII RPL 1" }
    }
  ],
  "meta": {
    "total": 37,
    "page": 1,
    "limit": 10,
    "totalPages": 4
  }
}""")
    
    add_heading_3(doc, "B. Struktur Respon Gagal / Kesalahan (HTTP 4xx / 5xx)")
    add_code_block(doc, """// Format JSON Respon Kesalahan Universal
{
  "success": false,
  "message": "Akses ditolak: Anda tidak memiliki hak akses [EDIT] pada modul ini",
  "error": "FORBIDDEN_INSUFFICIENT_PERMISSIONS",
  "meta": {
    "requiredModule": "/pengaturan/sekolah",
    "requiredAction": "edit",
    "timestamp": "2026-11-18T03:30:00.000Z"
  }
}""")

    add_heading_2(doc, "1.4 Standar Kode Status HTTP (HTTP Status Codes)")
    add_paragraph(
        doc,
        "Backend SIMS secara konsisten mengembalikan kode status standar IETF HTTP untuk merefleksikan hasil pemrosesan kueri:"
    )
    status_codes = [
        ("200 OK", "Permintaan berhasil diproses dan data dikembalikan sesuai kueri."),
        ("201 Created", "Entitas baru berhasil dibuat (misal pendaftaran PPDB atau pembuatan transaksi kuitansi)."),
        ("400 Bad Request", "Parameter atau muatan request tidak valid, field wajib kosong, atau tipe data salah."),
        ("401 Unauthorized", "Pengguna belum login atau token sesi JWT tidak ditemukan / kadaluwarsa."),
        ("403 Forbidden", "Pengguna terautentikasi namun peran (role) tidak memiliki izin akses modul yang diminta."),
        ("404 Not Found", "Sumber daya data dengan ID atau rute yang diminta tidak ditemukan di database."),
        ("429 Too Many Requests", "Permintaan melebihi batas rate limit (misal: proteksi brute-force login)."),
        ("500 Internal Error", "Terjadi kesalahan internal tak terduga pada server atau koneksi basis data."),
    ]
    add_styled_table(
        doc,
        headers=["Kode Status HTTP", "Deskripsi & Kondisi Pemicu"],
        rows=status_codes,
        col_widths=[Inches(1.8), Inches(4.3)]
    )

    # ==================== BAB 2 ====================
    add_heading_1(doc, "BAB 2: MEKANISME KEAMANAN API, AUTENTIKASI & RATE LIMITING")
    
    add_heading_2(doc, "2.1 Autentikasi Pengguna Staf & Administrator (NextAuth JWT Engine)")
    add_paragraph(
        doc,
        "Komunikasi API untuk staf sekolah, dewan guru, dan pimpinan diamankan menggunakan token berbasis JSON Web Token (JWT) yang dienkripsi secara simetris menggunakan algoritma HS256 / AES-GCM dengan secret key dari variabel lingkungan NEXTAUTH_SECRET. Token disimpan secara eksklusif dalam cookie peramban dengan atribut HttpOnly, Secure, SameSite=Lax, sehingga kebal terhadap serangan Cross-Site Scripting (XSS)."
    )
    add_paragraph(
        doc,
        "Setiap payload JWT token memuat klaim identitas yang kaya (Rich Identity Claims) untuk meminimalkan kueri basis data berulang pada setiap request:"
    )
    add_bullet(doc, "ID numerik unik akun pengguna di tabel sec_user.", "• userId (integer): ")
    add_bullet(doc, "Nama login akun pengguna.", "• username (string): ")
    add_bullet(doc, "Identifier peran dan nama peran resmi (misal: 'Administrator', 'Guru', 'Bendahara').", "• roleId & roleName: ")
    add_bullet(doc, "Penugasan unit jenjang utama guru/staf (jika berlaku spesifik).", "• jenjangId (nullable integer): ")
    add_bullet(doc, "Relasi ke data pegawai di tabel pegawai untuk sinkronisasi jadwal dan pengampu.", "• pegawaiId (nullable integer): ")
    add_bullet(doc, "Objek terenkapsulasi berisi status isGuru, daftar kelasIds yang diampu, dan status wali kelas.", "• guruScope (object): ")

    add_heading_2(doc, "2.2 Autentikasi Mandiri Siswa & Wali Murid (Portal Siswa)")
    add_paragraph(
        doc,
        "Siswa dan orang tua mengakses layanan mandiri melalui endpoint khusus `/api/portal/siswa/*`. Berbeda dengan staf sekolah, autentikasi siswa menggunakan nomor induk kependudukan/sekolah (NISN) dan tanggal lahir/kata sandi unik, yang menghasilkan token sesi terpisah portal_siswa_token sehingga ruang lingkup akses kesiswaan terisolasi secara menyeluruh dari panel administrasi sekolah."
    )

    add_heading_2(doc, "2.3 Mesin Penjaga Akses API (API Guard Engine & requirePermission)")
    add_paragraph(
        doc,
        "Setiap endpoint operasional yang memanipulasi data dilindungi oleh fungsi pembungkus keamanan terpusat src/lib/auth/api-guard.ts. Fungsi ini memeriksa apakah token sesi valid dan apakah peran pengguna memiliki izin yang cukup terhadap modul terkait:"
    )
    add_code_block(doc, """// Contoh Implementasi API Guard pada Endpoint Backend
import { requirePermission } from '@/lib/auth/api-guard'

export async function PUT(request: NextRequest) {
  // Verifikasi izin akses modul '/pengaturan/sekolah' dengan aksi 'edit'
  const auth = await requirePermission(request, '/pengaturan/sekolah', 'edit')
  if (auth.errorResponse) return auth.errorResponse

  // Lanjutkan eksekusi bisnis jika otorisasi valid
  const { user } = auth
  // ...
}""")

    add_heading_2(doc, "2.4 Teacher Scoping Guard (Pembatasan Lingkup Kerja Dewan Guru)")
    add_paragraph(
        doc,
        "Sistem menerapkan mekanisme penyaringan otomatis (*Automatic Scope Injection*) untuk pengguna berkedudukan Guru. Saat seorang guru memanggil endpoint data siswa (`/api/siswa`) atau nilai (`/api/akademik/nilai`), backend secara otomatis memeriksa parameter scope:"
    )
    add_bullet(doc, "Jika scope bernilai 'my_students' (default), kueri Prisma secara dinamis menginjeksi klausa 'where: { kelasId: { in: user.guruScope.kelasIds } }' sehingga guru hanya melihat siswa di kelas yang diampu atau kelas binaan wali.", "• Filter Binaan Otomatis: ")
    add_bullet(doc, "Penyaringan ini ditegakkan di level kueri Prisma ORM, bukan sekadar filter visual frontend, sehingga mencegah eskalasi akses data antar-jenjang.", "• Keamanan Server-Side: ")

    add_heading_2(doc, "2.5 Rate Limiting & Proteksi Serangan Brute-Force")
    add_paragraph(
        doc,
        "Untuk melindungi endpoint login dari serangan penebakan kata sandi otomatis (Brute-Force & Credential Stuffing), sistem mengintegrasikan pustaka src/lib/auth/rate-limiter.ts berbasis sliding memory window:"
    )
    add_bullet(doc, "Maksimal 5 kali percobaan gagal berturut-turut untuk kombinasi IP Address dan Username.", "• Batas Kegagalan: ")
    add_bullet(doc, "Akun dan IP akan diblokir sementara selama 15 menit (lockout). Setiap request lanjutan akan menghasilkan respon 429 Too Many Requests beserta sisa durasi penguncian.", "• Durasi Pemblokiran: ")
    add_bullet(doc, "Endpoint administratif POST /api/auth/reset-limit disediakan khusus bagi Superadmin untuk membuka blokir akun pengguna yang terkunci atas permintaan resmi.", "• Reset Darurat Admin: ")

    # ==================== BAB 3 ====================
    add_heading_1(doc, "BAB 3: SPESIFIKASI API AUTENTIKASI, PENGGUNA & KONFIGURASI LEMBAGA")
    
    add_heading_2(doc, "3.1 Kelompok Endpoint Autentikasi Staf & Administrasi")
    auth_endpoints = [
        ("POST", "/api/auth/login", "Autentikasi akun staf/guru menggunakan username dan password. Melibatkan rate-limiting check dan pembuatan JWT session cookie."),
        ("POST", "/api/auth/logout", "Mengakhiri sesi aktif pengguna, menghapus cookie sesi di peramban, dan mencatat log logout pada audit trail."),
        ("GET", "/api/auth/me", "Mengembalikan identitas lengkap pengguna yang sedang aktif login, termasuk peran, izin menu, dan profil pegawai."),
        ("POST", "/api/auth/reset-limit", "Endpoint khusus Superadmin untuk mereset counter rate-limiter akun yang terblokir akibat kegagalan login berulang."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=auth_endpoints,
        col_widths=[Inches(1.0), Inches(2.2), Inches(2.9)]
    )
    
    add_paragraph(doc, "Contoh Request & Respon Login (/api/auth/login):", bold_prefix="Spesifikasi Payload: ")
    add_code_block(doc, """// Request Payload (POST /api/auth/login)
{
  "username": "bendahara",
  "password": "Password123!"
}

// Respon Sukses (HTTP 200 OK)
{
  "success": true,
  "message": "Login berhasil. Selamat datang kembali!",
  "data": {
    "id": 3,
    "username": "bendahara",
    "namaLengkap": "Siti Nurhaliza, S.E.",
    "role": "Bendahara",
    "roleId": 3
  }
}""")

    add_heading_2(doc, "3.2 Kelompok Endpoint Manajemen Pengguna & Hak Akses (RBAC)")
    user_endpoints = [
        ("GET", "/api/pengaturan/pengguna", "Mengambil daftar seluruh akun pengguna dengan filter peranan (roleId), jenjang, status aktif, dan kata kunci nama/username."),
        ("POST", "/api/pengaturan/pengguna", "Membuat akun pengguna baru lengkap dengan enkripsi kata sandi Bcrypt, penugasan role, tautan pegawaiId, dan jenjangId."),
        ("PUT", "/api/pengaturan/pengguna/[id]", "Memperbarui biodata akun pengguna, pengubahan role, penugasan jenjang, atau reset kata sandi baru."),
        ("DELETE", "/api/pengaturan/pengguna/[id]", "Menonaktifkan atau menghapus akun pengguna dari sistem dengan proteksi pencegahan hapus akun diri sendiri."),
        ("GET", "/api/pengaturan/roles", "Mengambil daftar peranan master (Superadmin, Tata Usaha, Guru, Bendahara, Kesiswaan, Pustakawan)."),
        ("GET/PUT", "/api/pengaturan/hak-akses", "Membaca dan memperbarui matriks izin akses tabular (canView, canCreate, canEdit, canDelete) per role terhadap menu."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=user_endpoints,
        col_widths=[Inches(1.0), Inches(2.4), Inches(2.7)]
    )

    add_heading_2(doc, "3.3 Kelompok Endpoint Navigasi Menu Dinamis & Pengaturan Lembaga")
    menu_endpoints = [
        ("GET", "/api/menus/sidebar", "Endpoint berkinerja tinggi untuk memuat struktur navigasi sidebar secara dinamis sesuai izin hak akses peran pengguna yang login."),
        ("GET/POST", "/api/pengaturan/menu", "Listing dan pembuatan entitas navigasi menu sistem (sec_menu) lengkap dengan ikon Lucide/Solar dan path rute."),
        ("PUT", "/api/pengaturan/menu/reorder", "Menyimpan tata urutan (drag-and-drop ordering) navigasi menu berdasarkan kelompok menu."),
        ("GET", "/api/pengaturan/sekolah", "Memuat identitas profil sekolah, logo URL, kontak, warna tema CSS, status mode satuan pendidikan, dan daftar jenjang."),
        ("PUT", "/api/pengaturan/sekolah", "Menyimpan konfigurasi profil sekolah, palet warna dynamic theming, mode satuan pendidikan (SINGLE / MULTI), dan jenjang aktif."),
        ("GET", "/api/sekolah/mode", "Endpoint publik ultra-cepat untuk mendistribusikan metadata mode lembaga (isSingleJenjang, defaultJenjangId, hasJurusan)."),
        ("GET", "/api/pengaturan/audit-log", "Mengambil rekaman jejak audit sistem (sec_audit_log) dengan filter aktor, rentang tanggal, aksi, dan penelusuran snapshot data."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=menu_endpoints,
        col_widths=[Inches(1.0), Inches(2.4), Inches(2.7)]
    )

    # ==================== BAB 4 ====================
    add_heading_1(doc, "BAB 4: SPESIFIKASI API MASTER DATA POKOK, ROMBEL & KALENDER AKADEMIK")
    
    add_heading_2(doc, "4.1 Modul Master Jenjang, Tingkat & Kompetensi Keahlian (Jurusan)")
    master_endpoints = [
        ("GET", "/api/master/jenjang", "Mengambil daftar jenjang aktif (default) beserta relasi tingkat dan jurusan. Parameter ?includeInactive=true untuk konfigurasi admin."),
        ("GET", "/api/master/jurusan", "Listing seluruh kompetensi keahlian / jurusan SMK lengkap dengan kuota rombel dan status aktif."),
        ("POST/PUT/DELETE", "/api/master/jurusan/[id]", "Operasi CRUD kode jurusan, nama kompetensi keahlian, kepala program keahlian, dan deskripsi jurusan."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=master_endpoints,
        col_widths=[Inches(1.1), Inches(2.3), Inches(2.7)]
    )

    add_heading_2(doc, "4.2 Modul Rombongan Belajar (Rombel & Kelas)")
    kelas_endpoints = [
        ("GET", "/api/master/kelas", "Listing data rombel kelas dengan filter jenjangId, tingkatId, dan tahunAjaran. Menyertakan agregasi penghitungan keterisian siswa."),
        ("POST", "/api/master/kelas", "Membuat rombel kelas baru dengan validasi kapasitas maksimum siswa dan penunjukan wali kelas."),
        ("PUT/DELETE", "/api/master/kelas/[id]", "Ubah atribut rombel atau nonaktifkan kelas yang sudah tidak digunakan pada tahun ajaran baru."),
        ("GET", "/api/master/kelas/[id]/siswa", "Mengambil daftar nama dan biodata ringkas seluruh siswa yang terdaftar aktif dalam rombel kelas tersebut."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=kelas_endpoints,
        col_widths=[Inches(1.1), Inches(2.3), Inches(2.7)]
    )

    add_heading_2(doc, "4.3 Modul Periode Akademik, Jadwal & Kalender Sekolah")
    akademik_endpoints = [
        ("GET", "/api/akademik/tahun-ajaran", "Daftar master seluruh tahun ajaran akademik dan penanda semester (Ganjil / Genap)."),
        ("GET", "/api/akademik/tahun-ajaran/aktif", "Mengembalikan satu objek tahun ajaran dan semester yang sedang berjalan aktif sebagai acuan global seluruh menu sistem."),
        ("GET/POST", "/api/akademik/mapel", "Pengelolaan mata pelajaran, kelompok muatan (A/B/C), Kriteria Ketuntasan Minimal (KKM), dan alokasi jam per minggu."),
        ("GET/POST", "/api/akademik/jadwal", "Pengaturan jadwal pelajaran mingguan per kelas (hari, jam pelajaran, mata pelajaran, ruang kelas, dan guru pengampu)."),
        ("GET/POST", "/api/akademik/kalender", "Agenda kalender pendidikan terpadu (libur sekolah, jadwal PTS/PAS, rapat komite, dan upacara hari besar)."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=akademik_endpoints,
        col_widths=[Inches(1.1), Inches(2.4), Inches(2.6)]
    )

    # ==================== BAB 5 ====================
    add_heading_1(doc, "BAB 5: SPESIFIKASI API KESISWAAN, PPDB ONLINE & PENILAIAN E-RAPOR")
    
    add_heading_2(doc, "5.1 Modul Data Pokok Kesiswaan (Student Management Core)")
    siswa_endpoints = [
        ("GET", "/api/siswa", "Query data peserta didik dengan filter cerdas: pencarian nama/NIS, jenjang, kelas, jenis kelamin, status, serta teacher scope mode."),
        ("POST", "/api/siswa", "Pendaftaran siswa baru ke buku induk dengan validasi integritas NIS/NISN unik serta penempatan kelas perdana."),
        ("GET", "/api/siswa/[id]", "Detail komprehensif data siswa: profil kesiswaan, kontak wali, riwayat kelas, rekap nilai, pelanggaran BK, dan matriks 12 bulan SPP."),
        ("PUT/DELETE", "/api/siswa/[id]", "Pembaruan biodata siswa atau perubahan status kesiswaan (Aktif, Mutasi Keluar, Lulus, Dikeluarkan)."),
        ("GET", "/api/siswa/stats", "Kalkulasi 6 metrik statistik kesiswaan (total terdaftar, siswa aktif, laki-laki, perempuan, alumni, mutasi)."),
        ("GET", "/api/siswa/export", "Ekspor data pokok siswa ke dalam berkas format CSV terstandar."),
        ("POST", "/api/siswa/import", "Impor massal data siswa dari berkas spreadsheet CSV dengan sistem validasi baris otomatis."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=siswa_endpoints,
        col_widths=[Inches(1.1), Inches(2.2), Inches(2.8)]
    )

    add_heading_2(doc, "5.2 Modul Penilaian Akademik & E-Rapor Digital")
    nilai_endpoints = [
        ("GET/POST", "/api/akademik/nilai", "Penginputan dan pembacaan matriks nilai per mata pelajaran per kelas (Nilai Tugas, PH, PTS, PAS, dan Nilai Keterampilan)."),
        ("GET/POST", "/api/akademik/bobot", "Konfigurasi persentase bobot penilaian akhir rapor (contoh: Tugas 20%, PH 20%, PTS 30%, PAS 30%)."),
        ("GET", "/api/akademik/rapor", "Kompilasi rapor digital siswa siap cetak meliputi nilai capaian kompetensi, predikat huruf, ekstrakurikuler, dan catatan wali kelas."),
        ("POST", "/api/akademik/kenaikan-kelas", "Pemrosesan massal kenaikan tingkat kelas atau penentuan kelulusan siswa tingkat akhir."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=nilai_endpoints,
        col_widths=[Inches(1.1), Inches(2.4), Inches(2.6)]
    )

    add_heading_2(doc, "5.3 Modul Presensi Kehadiran & Layanan Kesiswaan Lanjutan")
    kesiswaan_endpoints = [
        ("GET/POST", "/api/absensi/kelas", "Presensi harian siswa di kelas per mata pelajaran (Hadir, Sakit, Izin, Alpa) dengan pencatatan real-time."),
        ("GET/POST", "/api/absensi/gerbang", "Pencatatan presensi kedatangan dan kepulangan gerbang sekolah menggunakan scan barcode kartu pelajar / RFID."),
        ("GET/POST", "/api/kesiswaan/ppdb", "Penerimaan peserta didik baru online: verifikasi formulir, berkas dokumen persyaratan, dan status seleksi kelulusan."),
        ("POST", "/api/kesiswaan/ppdb/enroll", "Konversi otomatis data calon pendaftar PPDB yang diterima menjadi data siswa resmi di buku induk sekolah."),
        ("GET/POST", "/api/kesiswaan/kedisiplinan", "Pencatatan buku sanksi poin pelanggaran tata tertib kesiswaan serta poin prestasi akademik/non-akademik."),
        ("GET/POST", "/api/kesiswaan/mutasi", "Administrasi mutasi siswa masuk dan penerbitan surat keterangan mutasi keluar."),
        ("GET/POST", "/api/kesiswaan/alumni", "Pendataan alumni, penelusuran lulusan (Tracer Study: Kuliah, Kerja, Wirausaha), dan legalisir dokumen."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=kesiswaan_endpoints,
        col_widths=[Inches(1.1), Inches(2.4), Inches(2.6)]
    )

    # ==================== BAB 6 ====================
    add_heading_1(doc, "BAB 6: SPESIFIKASI API KEUANGAN, TRANSAKSI SPP & BUKU KAS UMUM")
    
    add_heading_2(doc, "6.1 Modul Transaksi Pembayaran SPP & Kuitansi Digital")
    spp_endpoints = [
        ("POST", "/api/spp/bayar", "Transaksi kasir pelunasan tagihan SPP bulanan. Menghasilkan nomor kuitansi unik berformat TRX-YYYYMMDD-XXXX dan mencatat arus kas masuk."),
        ("GET", "/api/spp/riwayat", "Riwayat seluruh kuitansi transaksi pembayaran SPP dengan filter rentang tanggal, kelas, metode bayar (Tunai, Transfer, QRIS)."),
        ("GET", "/api/spp/transaksi/[noTransaksi]", "Pengambilan data rinci lembar kuitansi resmi untuk pencetakan ulang format struk thermal 58/80mm atau lembar A4 komite."),
        ("GET", "/api/spp/stats", "Agregasi metrik pendapatan SPP (realisasi penerimaan hari ini, penerimaan bulan berjalan, dan total tunggakan aktif)."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=spp_endpoints,
        col_widths=[Inches(1.1), Inches(2.4), Inches(2.6)]
    )
    
    add_paragraph(doc, "Contoh Request & Respon Transaksi Pembayaran SPP:", bold_prefix="Spesifikasi Payload: ")
    add_code_block(doc, """// Request Payload (POST /api/spp/bayar)
{
  "siswaId": 1,
  "tahunAjaran": "2026/2027",
  "bulanBayar": ["Juli", "Agustus", "September"],
  "nominalPerBulan": 150000,
  "metodePembayaran": "Tunai",
  "diterimaOleh": "Bendahara Sekolah"
}

// Respon Sukses (HTTP 201 Created)
{
  "success": true,
  "message": "Pembayaran SPP sebanyak 3 bulan berhasil diproses",
  "data": {
    "noTransaksi": "TRX-20261118-0012",
    "tanggalBayar": "2026-11-18T03:45:00.000Z",
    "totalBayar": 450000,
    "siswa": { "nama": "Abdul Rahman Jaelani", "nis": "22230028" },
    "kuitansiUrl": "/spp/kuitansi/TRX-20261118-0012"
  }
}""")

    add_heading_2(doc, "6.2 Modul Tarif Ketetapan SPP & Logika Tunggakan Berjalan")
    tarif_endpoints = [
        ("GET/POST", "/api/spp/tarif", "Pengaturan ketetapan standar tarif SPP bulanan per jenjang, tingkat kelas, dan tahun ajaran."),
        ("PUT/DELETE", "/api/spp/tarif/[id]", "Pembaruan nominal tarif atau penonaktifan pos tarif lama."),
        ("GET", "/api/spp/siswa/[id]", "Kompilasi status pembayaran 12 bulan akademik siswa (Juli s.d. Juni) dengan indikator lunas/belum bayar dan sisa tunggakan."),
        ("GET", "/api/spp/tunggakan", "Laporan rekapitulasi tunggakan sekolah. Menghitung tunggakan secara proporsional sesuai batas bulan berjalan pada tahun ajaran aktif."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=tarif_endpoints,
        col_widths=[Inches(1.1), Inches(2.3), Inches(2.7)]
    )

    add_heading_2(doc, "6.3 Modul Tagihan Non-SPP & Pembayaran Bertahap (Cicilan)")
    tagihan_endpoints = [
        ("GET/POST", "/api/keuangan/tagihan", "Pembuatan dan penagihan biaya pendidikan non-SPP (Uang Gedung, DSP, Seragam, Ujian Sertifikasi) secara massal atau perorangan."),
        ("POST", "/api/keuangan/tagihan/bayar", "Pembayaran angsuran tagihan non-SPP bertahap dengan pelacakan sisa saldo tagihan otomatis."),
        ("GET/POST", "/api/keuangan/tagihan/jenis", "Master jenis pos tagihan non-SPP dan nominal standar ketetapan rapat komite."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=tagihan_endpoints,
        col_widths=[Inches(1.1), Inches(2.4), Inches(2.6)]
    )

    add_heading_2(doc, "6.4 Modul Buku Kas Umum & Laporan Keuangan Terpadu")
    kas_endpoints = [
        ("GET/POST", "/api/keuangan/kas-umum", "Pencatatan mutasi transaksi penerimaan kas (debit) dan pengeluaran operasional (kredit) buku kas umum sekolah."),
        ("GET/POST", "/api/keuangan/kas-umum/kategori", "Master pos anggaran penerimaan dan pengeluaran operasional (BOS, Yayasan, Perawatan Gedung)."),
        ("GET", "/api/keuangan/laporan", "Laporan rekapitulasi arus kas masuk/keluar terpadu, posisi saldo akhir kas, dan cetak lembar buku kas umum resmi."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=kas_endpoints,
        col_widths=[Inches(1.1), Inches(2.4), Inches(2.6)]
    )

    # ==================== BAB 7 ====================
    add_heading_1(doc, "BAB 7: SPESIFIKASI API PERPUSTAKAAN, SARPRAS & CMS PUBLIK")
    
    add_heading_2(doc, "7.1 Modul Perpustakaan Digital & Sirkulasi QR Barcode")
    perpus_endpoints = [
        ("GET/POST", "/api/perpustakaan/buku", "Katalog master buku perpustakaan: ISBN, judul, pengarang, penerbit, nomor rak, stok total, dan unggah berkas sampul."),
        ("PUT/DELETE", "/api/perpustakaan/buku/[id]", "Ubah metadata buku atau arsipkan buku yang sudah rusak/dikeluarkan dari koleksi."),
        ("GET/POST", "/api/perpustakaan/sirkulasi", "Peminjaman buku menggunakan pemindaian QR barcode siswa dan barcode buku. Menetapkan tanggal jatuh tempo pengembalian."),
        ("PUT", "/api/perpustakaan/sirkulasi/[id]/kembali", "Pengembalian buku pinjaman dengan kalkulasi denda otomatis per hari jika melewati jatuh tempo."),
        ("GET/POST", "/api/perpustakaan/kategori", "Pengelolaan kategori klasifikasi koleksi buku (Buku Pelajaran, Fiksi, Ensiklopedia, Kejuruan)."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=perpus_endpoints,
        col_widths=[Inches(1.1), Inches(2.5), Inches(2.5)]
    )

    add_heading_2(doc, "7.2 Modul Sarana, Prasarana & Pelabelan Aset Fisik")
    sarpras_endpoints = [
        ("GET/POST", "/api/sarpras/ruangan", "Master data inventaris ruangan, nama laboratorium, denah gedung, dan penanggung jawab ruangan."),
        ("GET/POST", "/api/sarpras/barang", "Inventarisasi aset fisik barang sekolah: kode barang unik, merk/spesifikasi, sumber dana pengadaan, dan kondisi fisik."),
        ("GET/POST", "/api/sarpras/kategori", "Kategori aset perlengkapan (Elektronik, Mebel, Alat Lab, Kendaraan Dinas)."),
        ("GET", "/api/sarpras/barang/[id]", "Data spesifikasi aset lengkap untuk penyusunan cetak stiker label QR barcode aset inventaris."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=sarpras_endpoints,
        col_widths=[Inches(1.1), Inches(2.4), Inches(2.6)]
    )

    add_heading_2(doc, "7.3 Modul CMS Publik, Landing Page & Media Storage")
    cms_endpoints = [
        ("GET/POST", "/api/cms/carousel", "Pengelolaan banner slider gambar hero pada halaman depan portal web publik sekolah."),
        ("GET/POST", "/api/cms/berita", "Penerbitan artikel warta dan berita sekolah dengan URL slug yang ramah mesin pencari (SEO friendly)."),
        ("GET/POST", "/api/cms/fasilitas", "Galeri showcase sarana dan prasarana unggulan sekolah yang ditampilkan pada portal publik."),
        ("GET/POST", "/api/cms/kegiatan", "Dokumentasi album foto agenda kegiatan kesiswaan, ekstrakurikuler, dan prestasi sekolah."),
        ("POST", "/api/upload", "Endpoint multi-part form-data untuk mengunggah gambar logo sekolah, foto siswa, sampul buku, dan berkas syarat PPDB."),
    ]
    add_styled_table(
        doc,
        headers=["Metode", "Endpoint URI", "Fungsi & Cakupan Bisnis"],
        rows=cms_endpoints,
        col_widths=[Inches(1.1), Inches(2.3), Inches(2.7)]
    )

    # ==================== BAB 8 ====================
    add_heading_1(doc, "BAB 8: STANDAR INTEGRASI EKSTERNAL, WEBHOOKS & BEST PRACTICES")
    
    add_heading_2(doc, "8.1 Integrasi Notifikasi Instan WhatsApp Gateway")
    add_paragraph(
        doc,
        "SIMS menyediakan antarmuka webhook keluar (*Outgoing Webhook*) untuk berintegrasi dengan penyedia layanan WhatsApp Gateway (misal Fonnte, Waba, atau WhatsApp Cloud API resmi). Sistem memicu notifikasi otomatis pada kejadian-kejadian kritis berikut:"
    )
    add_bullet(doc, "Terkirim otomatis ke nomor WhatsApp orang tua/wali sesaat setelah kasir menyimpan transaksi pembayaran SPP atau tagihan.", "• Notifikasi Pembayaran SPP: ")
    add_bullet(doc, "Pemberitahuan kepada orang tua saat siswa melakukan presensi scan barcode/RFID di gerbang sekolah (Jam Datang & Jam Pulang).", "• Notifikasi Presensi Gerbang: ")
    add_bullet(doc, "Pemberitahuan resmi kesiswaan/BK jika siswa melakukan pelanggaran tata tertib berat atau panggilan orang tua.", "• Surat Panggilan Disiplin: ")
    
    add_paragraph(doc, "Contoh Payload Integrasi WhatsApp Gateway:", bold_prefix="Spesifikasi Payload Webhook: ")
    add_code_block(doc, """// Format Payload Webhook Keluar (SIMS -> WhatsApp Gateway)
{
  "target": "081234567890",
  "message": "*KUITANSI PEMBAYARAN SPP RESMI*\\n\\nTerima kasih, pembayaran SPP atas nama *Abdul Rahman Jaelani* (NIS: 22230028) untuk periode *Juli, Agustus 2026* sebesar *Rp 300.000* telah berhasil diterima.\\n\\nNo. Transaksi: TRX-20261118-0012\\nStatus: LUNAS\\nUnduh Kuitansi: https://sekolah.sch.id/spp/kuitansi/TRX-20261118-0012",
  "delay": 2,
  "countryCode": "62"
}""")

    add_heading_2(doc, "8.2 Rencana Integrasi Pembayaran Digital (Virtual Account & QRIS)")
    add_paragraph(
        doc,
        "Untuk memfasilitasi pembayaran non-tunai langsung dari portal siswa/wali, arsitektur API telah disiapkan untuk integrasi dengan Payment Gateway nasional (Midtrans / Xendit). Alur transaksi closed-loop dirancang dengan ketentuan keamanan tinggi:"
    )
    add_step(doc, 1, "Inisiasi Tagihan di Portal Siswa", "Siswa/wali memilih bulan tagihan SPP dan menekan tombol 'Bayar via Transfer / QRIS'. Endpoint internal membuat Snap Token transaksi.")
    add_step(doc, 2, "Pembayaran oleh Nasabah", "Wali murid melakukan transfer ke nomor rekening Virtual Account (BCA/BRI/Mandiri) atau memindai kode QRIS dinamis.")
    add_step(doc, 3, "Notifikasi Webhook Callback", "Payment gateway mengirimkan HTTP POST callback ke endpoint backend SIMS (/api/keuangan/webhook/midtrans).")
    add_step(doc, 4, "Verifikasi Signature Key & Pelunasan Transaksi", "Backend memvalidasi signature key SHA-512 callback. Jika valid, status tagihan otomatis diubah menjadi Lunas dan kuitansi diterbitkan tanpa campur tangan staf kasir.")

    add_heading_2(doc, "8.3 Sinkronisasi Eksternal Data Dapodik & EMIS Kemenag")
    add_paragraph(
        doc,
        "Untuk memenuhi kewajiban pelaporan berkala ke Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen) atau Kementerian Agama (Kemenag), API SIMS mendukung ekspor data terpetakan (*Standardized Data Mapping*) yang selaras dengan spesifikasi Dapodikdasmen dan EMIS 4.0:"
    )
    add_bullet(doc, "Mapping atribut kesiswaan: NISN, NIK, No Kartu Keluarga, Nama Ibu Kandung, Tempat/Tanggal Lahir, Titik Koordinat Rumah.", "• Data Pokok Siswa: ")
    add_bullet(doc, "Mapping atribut pendidik: NUPTK, PegID, Status Kepegawaian (PNS/PPPK/GTY), Sertifikasi Pendidik, Riwayat Pendidikan.", "• Data Guru & PTK: ")

    add_heading_2(doc, "8.4 Panduan Pengujian & Checklist Debugging REST API")
    add_paragraph(
        doc,
        "Sebelum merilis integrasi baru ke lingkungan produksi, tim pengembang dan QA Engineers diwajibkan melakukan pengujian komprehensif mengacu pada checklist berikut:"
    )
    chk_items = [
        ("Pengujian Autentikasi & Otorisasi", "Pastikan request tanpa cookie JWT menghasilkan HTTP 401, dan request dengan role tidak berizin menghasilkan HTTP 403 Forbidden."),
        ("Validasi Input & Tipe Data", "Uji request dengan payload JSON tidak lengkap atau format salah untuk memastikan server mengembalikan HTTP 400 dengan pesan kesalahan yang informatif."),
        ("Pengujian Rate Limiting", "Simulasikan 6 kali kegagalan login berturut-turut untuk memastikan sistem memblokir akses dan mengembalikan HTTP 429 Too Many Requests."),
        ("Verifikasi Audit Trail Logging", "Pastikan setiap aksi mutasi data (POST, PUT, DELETE) tercatat secara akurat di tabel sec_audit_log lengkap dengan data snapshot JSON."),
        ("Uji Konkurensi & Transaksi Kasir", "Simulasikan pembayaran simultan pada siswa yang sama untuk memastikan kueri menggunakan transaksi Prisma ACID tanpa risiko double payment."),
    ]
    add_styled_table(
        doc,
        headers=["Komponen Pengujian Kritis", "Kriteria Keberhasilan & Prosedur Verifikasi"],
        rows=chk_items,
        col_widths=[Inches(2.1), Inches(4.0)]
    )
    
    add_callout(
        doc,
        "TIP",
        "Pemanfaatan Perangkat Postman / Bruno",
        "Gunakan koleksi Postman resmi SIMS yang disertakan dalam repositori untuk mengimpor seluruh definisi endpoint beserta contoh variabel lingkungan dan runner otomasi pengujian unit."
    )

    # Simpan berkas dokumen Word
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    print(f"✅ Buku Teknis 3 berhasil dibuat di: {output_path}")

if __name__ == "__main__":
    build_tech_03_api()
