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

def build_tech_02_db():
    output_path = os.path.join("docs", "technical", "02-kamus-data-database-erd.docx")
    
    doc = create_base_document(
        book_series_title="BUKU TEKNIS 2: KAMUS DATA BASIS DATA & RELASI ENTITAS (ERD)",
        book_subtitle="Dokumentasi Arsitektur Basis Data Relasional PostgreSQL, Spesifikasi Pemodelan Skema Prisma ORM, Diagram Relasi Entitas (ERD), Kamus Data Lengkap per Tabel, Indeksasi Kueri, Integritas Referensial, serta Nilai Enumerasi Sistem.",
        doc_id="DOC-SIMS-TECH-02-DB",
        target_roles="Database Administrators (DBA), Backend Engineers, Data Engineers, Software Architects",
        version="1.0",
        doc_category="Dokumen Teknis"
    )
    
    # ==================== DAFTAR ISI / RINGKASAN ====================
    add_heading_1(doc, "RINGKASAN EKSEKUTIF & DAFTAR ISI DOKUMEN TEKNIS", page_break=False)
    add_paragraph(
        doc,
        "Dokumen Teknis Buku 2 ini menyajikan spesifikasi arsitektur data komprehensif dari Sistem Informasi Manajemen Sekolah Terpadu (SIMS) v1.0. Dokumen ini memuat dokumentasi terperinci mengenai struktur basis data relasional PostgreSQL yang dikelola melalui Prisma ORM. Meliputi 16 kelompok tabel utama, pemodelan relasi antar-entitas (Entity-Relationship Diagram / ERD), integritas referensial (foreign keys), strategi pengindeksan data kueri kritis, serta kamus data field-by-field yang menjadi panduan mutlak bagi administrator basis data (DBA) dan insinyur perangkat lunak backend."
    )
    
    toc_data = [
        ("BAB 1", "Arsitektur Basis Data PostgreSQL & Prisma ORM", "Paradigma ACID, parameter koneksi, konvensi snake_case, dan DDL"),
        ("BAB 2", "Diagram Relasi Entitas (ERD) & Konseptual Data Model", "Peta relasi 1-to-N, N-to-N, foreign key cascade, dan integritas data"),
        ("BAB 3", "Kamus Data Keamanan, RBAC & Identitas Lembaga", "Spesifikasi tabel sec_role, sec_user, sec_menu, sec_role_menu, sekolah_profil"),
        ("BAB 4", "Kamus Data Master Pokok, Akademik & Penilaian", "Spesifikasi tabel rombel, mapel, jadwal, pegawai, siswa, nilai, dan rapor"),
        ("BAB 5", "Kamus Data Presensi, Kesiswaan, PPDB & Alumni", "Spesifikasi tabel absensi gerbang/kelas, PPDB online, poin BK, mutasi, alumni"),
        ("BAB 6", "Kamus Data Keuangan, Kasir SPP & Kas Umum", "Spesifikasi tabel spp_tarif, spp_pembayaran, tagihan non-SPP, cicilan, buku_kas"),
        ("BAB 7", "Kamus Data Perpustakaan, Sarpras & Audit Trail", "Spesifikasi tabel perpus_buku, sirkulasi, sarpras_barang, kalender, audit_log"),
        ("BAB 8", "Strategi Indeksasi, Optimasi & Disaster Recovery", "Pengindeksan performa tinggi, partisi data, migrasi skema, dan backup"),
    ]
    add_styled_table(
        doc,
        headers=["Bab", "Topik Pembahasan Teknis", "Cakupan Spesifikasi Skema Basis Data"],
        rows=toc_data,
        col_widths=[Inches(0.9), Inches(2.6), Inches(2.6)]
    )
    
    add_callout(
        doc,
        "IMPORTANT",
        "Kepatuhan Manipulasi Skema Basis Data",
        "Seluruh perubahan struktur tabel, tipe data kolom, dan penambahan indeks WAJIB dilakukan melalui berkas definisi terpusat prisma/schema.prisma dan disinkronkan menggunakan perintah resmi Prisma CLI (npx prisma db push atau npx prisma migrate). Dilarang keras memodifikasi DDL tabel secara langsung melalui kueri SQL mentah pada lingkungan produksi."
    )
    
    # ==================== BAB 1 ====================
    add_heading_1(doc, "BAB 1: ARSITEKTUR BASIS DATA POSTGRESQL & PRISMA ORM")
    
    add_heading_2(doc, "1.1 Pemilihan RDBMS PostgreSQL & Jaminan Transaksi ACID")
    add_paragraph(
        doc,
        "SIMS mengadopsi PostgreSQL versi 15+ sebagai mesin basis data relasional tingkat enterprise (*Enterprise Relational Database Management System*). PostgreSQL dipilih karena keandalannya dalam menangani konkurensi data masif, kepatuhan mutlak terhadap prinsip ACID (Atomicity, Consistency, Isolation, Durability), serta dukungannya terhadap tipe data tingkat lanjut seperti JSONB dan pengindeksan parsial."
    )
    
    add_heading_2(doc, "1.2 Parameter Koneksi & Connection Pooling")
    add_paragraph(
        doc,
        "Koneksi aplikasi ke basis data dikelola melalui URL koneksi terstandar pada berkas lingkungan `.env`:"
    )
    add_code_block(doc, """# Konfigurasi Koneksi PostgreSQL (Prisma Provider)
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/db_manajemen_sekolah?schema=public&connection_limit=20&pool_timeout=10"
""")
    add_paragraph(
        doc,
        "Parameter `connection_limit=20` membatasi jumlah pool koneksi simultan untuk mencegah kejenuhan memori pada server database, sementara `pool_timeout=10` menentukan batas waktu toleransi tunggu permintaan koneksi sebelum melempar exception."
    )
    
    add_heading_2(doc, "1.3 Konvensi Penamaan Skema (Schema Conventions)")
    add_paragraph(
        doc,
        "Untuk menjaga konsistensi antara kode TypeScript (yang mengadopsi camelCase) dengan standar penamaan PostgreSQL (yang mengadopsi snake_case), skema Prisma menerapkan pemetaan eksplisit:"
    )
    add_bullet(doc, "Setiap model Prisma menggunakan anotasi @@map(\"nama_tabel\") (contoh: model SecUser dipetakan ke tabel fisik sec_user).", "• Pemetaan Nama Tabel (Table Mapping): ")
    add_bullet(doc, "Setiap properti kolom camelCase dipetakan ke kolom fisik snake_case melalui atribut @map(\"nama_kolom\") (contoh: namaLengkap dipetakan ke nama_lengkap).", "• Pemetaan Nama Kolom (Column Mapping): ")
    add_bullet(doc, "Kolom tanggal pencatatan audit menggunakan created_at (default now()) dan updated_at (@updatedAt).", "• Kolom Audit Standar: ")
    
    # ==================== BAB 2 ====================
    add_heading_1(doc, "BAB 2: DIAGRAM RELASI ENTITAS (ERD) & KONSEPTUAL DATA MODEL")
    
    add_paragraph(
        doc,
        "Arsitektur data SIMS dirancang dalam bentuk model relasional terintegrasi tinggi, di mana setiap modul fungsional saling bertukar kunci asing (*Foreign Keys*) untuk menjaga integritas transaksi."
    )
    
    add_heading_2(doc, "2.1 Ringkasan Kluster Relasi Antarmodul")
    erd_clusters = [
        ("Kluster 1: Keamanan & RBAC", "sec_role, sec_user, sec_menu, sec_role_menu", "Menghubungkan identitas pengguna dengan peran dan matriks izin menu aplikasi."),
        ("Kluster 2: Struktur Akademik", "ref_jenjang, ref_tingkat, jurusan, kelas, tahun_ajaran", "Hierarki pendidikan: Jenjang ➔ Tingkat ➔ Jurusan ➔ Rombel Kelas ➔ Siswa."),
        ("Kluster 3: Ketenagaan (SDM)", "pegawai, pegawai_dokumen", "Data guru/pegawai yang menjadi wali kelas, pengajar mapel, dan penanggung jawab ruangan."),
        ("Kluster 4: Kesiswaan & Portofolio", "siswa, siswa_wali, siswa_dokumen", "Data induk siswa yang terhubung ke rombel kelas, presensi, keuangan, dan rapor."),
        ("Kluster 5: Pembelajaran & Nilai", "mata_pelajaran, jadwal_pelajaran, nilai_siswa", "Relasi jadwal mingguan, kelas, guru pengajar, dan lembar capaian hasil belajar."),
        ("Kluster 6: Keuangan & Kas Terpadu", "spp_tarif, spp_pembayaran, tagihan, buku_kas", "Pencatatan kasir SPP dan pengeluaran kas umum yang terkonsolidasi."),
        ("Kluster 7: Fasilitas & Inventaris", "sarpras_ruangan, sarpras_barang, perpus_buku", "Aset barang yang tertaut ke ruangan fisik dan sirkulasi buku perpustakaan."),
        ("Kluster 8: Log Pengawasan", "sec_audit_log", "Tabel independen yang merekam mutasi dari seluruh kluster di atas."),
    ]
    add_styled_table(
        doc,
        headers=["Kluster Relasi Data", "Tabel-Tabel Terkait", "Cakupan Fungsional Arsitektur"],
        rows=erd_clusters,
        col_widths=[Inches(1.8), Inches(2.2), Inches(2.1)]
    )
    
    add_heading_2(doc, "2.2 Integritas Referensial & Kebijakan Cascade Delete")
    add_paragraph(
        doc,
        "Untuk mencegah terjadinya data yatim (*orphan records*) maupun penghapusan data kritis secara tidak sengaja, sistem menerapkan 3 strategi integritas referensial:"
    )
    add_bullet(doc, "Diterapkan pada relasi master-detail yang tidak berdiri sendiri, seperti sec_role_menu (jika role dihapus, izin menu terkait otomatis terhapus).", "• Cascade Delete (onDelete: Cascade): ")
    add_bullet(doc, "Diterapkan pada relasi penugasan personel, seperti penanggung jawab ruangan pj_pegawai_id (jika pegawai dihapus, ruangan tetap ada dengan PJ bernilai NULL).", "• Set Null (onDelete: SetNull): ")
    add_bullet(doc, "Diterapkan pada transaksi keuangan dan data induk vital (contoh: kategori barang tidak boleh dihapus jika masih ada barang yang terdaftar di kategori tersebut).", "• Restrict (onDelete: Restrict): ")
    
    # ==================== BAB 3 ====================
    add_heading_1(doc, "BAB 3: KAMUS DATA KEAMANAN, RBAC & IDENTITAS LEMBAGA")
    
    add_heading_2(doc, "3.1 Tabel `sec_role` (Master Peran / Kelompok Kerja)")
    add_paragraph(doc, "Menyimpan definisi peran pengguna yang menentukan cakupan tugas operasional dalam aplikasi.")
    role_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik peran."),
        ("nama_role", "VARCHAR(100)", "Unique", "NO", "Nama peran (contoh: SUPERADMIN, GURU, BENDAHARA, STAFF_TU)."),
        ("keterangan", "VARCHAR(255)", "-", "YES", "Deskripsi singkat fungsi peran."),
        ("active", "BOOLEAN", "DEFAULT true", "NO", "Status keaktifan peran (true/false)."),
        ("created_at", "TIMESTAMP", "DEFAULT now()", "NO", "Waktu pembuatan record peran."),
        ("updated_at", "TIMESTAMP", "@updatedAt", "NO", "Waktu pembaruan record peran."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint / Nilai Bawaan", "Null?", "Deskripsi Kolom"],
        rows=role_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.6), Inches(0.6), Inches(1.6)]
    )
    
    add_heading_2(doc, "3.2 Tabel `sec_user` (Akun Pengguna Sistem)")
    add_paragraph(doc, "Menyimpan kredensial autentikasi pengguna yang berhak masuk ke area dashboard.")
    user_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik pengguna."),
        ("username", "VARCHAR(100)", "Unique", "NO", "ID unik untuk login (tanpa spasi)."),
        ("password", "VARCHAR(255)", "-", "NO", "Hash kata sandi terenkripsi Bcrypt (10 rounds)."),
        ("nama_lengkap", "VARCHAR(150)", "-", "NO", "Nama lengkap pengguna beserta gelar."),
        ("email", "VARCHAR(150)", "-", "YES", "Alamat email dinas pengguna."),
        ("role_id", "INT", "FK -> sec_role(id)", "NO", "ID peran aktif pengguna."),
        ("active", "BOOLEAN", "DEFAULT true", "NO", "Status akun (true = aktif, false = diblokir)."),
        ("created_at", "TIMESTAMP", "DEFAULT now()", "NO", "Waktu pendaftaran akun."),
        ("updated_at", "TIMESTAMP", "@updatedAt", "NO", "Waktu pembaruan akun."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint / Nilai Bawaan", "Null?", "Deskripsi Kolom"],
        rows=user_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.6), Inches(0.6), Inches(1.6)]
    )
    
    add_heading_2(doc, "3.3 Tabel `sec_role_menu` (Matriks Izin Otorisasi Granular)")
    add_paragraph(doc, "Tabel persimpangan yang memetakan izin akses menu per role secara dinamis.")
    role_menu_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik record izin."),
        ("role_id", "INT", "FK -> sec_role(id)", "NO", "ID peran pemilik izin."),
        ("menu_id", "INT", "FK -> sec_menu(id)", "NO", "ID menu target izin."),
        ("can_view", "BOOLEAN", "DEFAULT true", "NO", "Hak menampilkan menu pada navigasi."),
        ("can_create", "BOOLEAN", "DEFAULT false", "NO", "Hak menambah data baru di modul terkait."),
        ("can_edit", "BOOLEAN", "DEFAULT false", "NO", "Hak menyunting data di modul terkait."),
        ("can_delete", "BOOLEAN", "DEFAULT false", "NO", "Hak menghapus data di modul terkait."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint / Nilai Bawaan", "Null?", "Deskripsi Kolom"],
        rows=role_menu_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.6), Inches(0.6), Inches(1.6)]
    )
    
    # ==================== BAB 4 ====================
    add_heading_1(doc, "BAB 4: KAMUS DATA KELOMPOK MASTER DATA POKOK, AKADEMIK & NILAI")
    
    add_heading_2(doc, "4.1 Tabel `siswa` (Master Data Peserta Didik)")
    add_paragraph(doc, "Pangkalan data induk seluruh siswa aktif, pindahan, dan purnastudi.")
    siswa_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik siswa."),
        ("nis", "VARCHAR(30)", "Unique", "NO", "Nomor Induk Siswa internal sekolah."),
        ("nisn", "VARCHAR(20)", "Unique", "YES", "Nomor Induk Siswa Nasional (10 digit Kemendikbud)."),
        ("nama_lengkap", "VARCHAR(150)", "-", "NO", "Nama resmi siswa sesuai akta lahir."),
        ("jenis_kelamin", "VARCHAR(10)", "L / P", "NO", "Jenis kelamin (Laki-laki / Perempuan)."),
        ("tempat_lahir", "VARCHAR(100)", "-", "YES", "Kota/kabupaten kelahiran siswa."),
        ("tanggal_lahir", "DATE", "-", "YES", "Tanggal kelahiran siswa."),
        ("alamat", "TEXT", "-", "YES", "Alamat domisili tempat tinggal lengkap."),
        ("kelas_id", "INT", "FK -> kelas(id)", "YES", "ID rombongan belajar kelas aktif siswa."),
        ("status_siswa", "VARCHAR(20)", "DEFAULT 'aktif'", "NO", "Status operasional: aktif, mutasi, lulus, keluar."),
        ("foto_url", "VARCHAR(255)", "-", "YES", "Tautan berkas pas foto siswa."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint", "Null?", "Deskripsi Kolom"],
        rows=siswa_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.5), Inches(0.6), Inches(1.7)]
    )
    
    add_heading_2(doc, "4.2 Tabel `pegawai` (Master Data Guru & Tenaga Kependidikan)")
    add_paragraph(doc, "Menyimpan data identitas pendidik dan staf administrasi sekolah.")
    pegawai_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik pegawai."),
        ("nip", "VARCHAR(30)", "Unique", "YES", "Nomor Induk Pegawai bagi ASN/PNS."),
        ("nik", "VARCHAR(30)", "Unique", "YES", "Nomor Induk Kependudukan KTP."),
        ("nama_lengkap", "VARCHAR(150)", "-", "NO", "Nama lengkap pendidik beserta gelar kependidikan."),
        ("jenis_kelamin", "VARCHAR(10)", "L / P", "NO", "Jenis kelamin pegawai."),
        ("jabatan", "VARCHAR(100)", "-", "YES", "Jabatan dinas (contoh: Guru Produktif, Kepala TU)."),
        ("status_pegawai", "VARCHAR(50)", "PNS/GTY/PTY", "NO", "Status ikatan kerja kepegawaian."),
        ("telepon", "VARCHAR(30)", "-", "YES", "Nomor kontak WhatsApp dinas aktif."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint", "Null?", "Deskripsi Kolom"],
        rows=pegawai_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.5), Inches(0.6), Inches(1.7)]
    )
    
    add_heading_2(doc, "4.3 Tabel `nilai_siswa` (Rekam Capaian Hasil Belajar Siswa)")
    add_paragraph(doc, "Menyimpan nilai kuantitatif akademik hasil penilaian guru mata pelajaran.")
    nilai_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik nilai."),
        ("siswa_id", "INT", "FK -> siswa(id)", "NO", "ID siswa yang dinilai."),
        ("mapel_id", "INT", "FK -> mata_pelajaran(id)", "NO", "ID mata pelajaran terkait."),
        ("semester", "VARCHAR(10)", "ganjil / genap", "NO", "Semester pelaksanaan penilaian."),
        ("tahun_ajaran", "VARCHAR(20)", "contoh: 2024/2025", "NO", "Tahun ajaran aktif saat penilaian."),
        ("nilai_tugas", "DECIMAL(5,2)", "DEFAULT 0", "YES", "Rata-rata nilai tugas/portofolio (skala 0-100)."),
        ("nilai_ph", "DECIMAL(5,2)", "DEFAULT 0", "YES", "Rata-rata nilai Penilaian Harian (skala 0-100)."),
        ("nilai_pts", "DECIMAL(5,2)", "DEFAULT 0", "YES", "Nilai Penilaian Tengah Semester (skala 0-100)."),
        ("nilai_pas", "DECIMAL(5,2)", "DEFAULT 0", "YES", "Nilai Penilaian Akhir Semester (skala 0-100)."),
        ("nilai_akhir", "DECIMAL(5,2)", "Kalkulasi Bobot", "YES", "Nilai Akhir kumulatif rapor siswa."),
        ("predikat", "VARCHAR(2)", "A / B / C / D", "YES", "Predikat huruf mutu capaian hasil belajar."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint", "Null?", "Deskripsi Kolom"],
        rows=nilai_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.5), Inches(0.6), Inches(1.7)]
    )
    
    # ==================== BAB 5 ====================
    add_heading_1(doc, "BAB 5: KAMUS DATA KELOMPOK PRESENSI, KESISWAAN, PPDB & ALUMNI")
    
    add_heading_2(doc, "5.1 Tabel `absensi_kelas` (Presensi Harian Tatap Muka Siswa)")
    add_paragraph(doc, "Mencatat absensi harian per jam pelajaran atau per hari di ruang kelas.")
    absensi_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik presensi."),
        ("siswa_id", "INT", "FK -> siswa(id)", "NO", "ID siswa yang diabsen."),
        ("kelas_id", "INT", "FK -> kelas(id)", "NO", "ID kelas tempat absensi berlangsung."),
        ("tanggal", "DATE", "Indexed", "NO", "Tanggal KBM presensi dilaksanakan."),
        ("status", "VARCHAR(10)", "H / S / I / A", "NO", "Status: H (Hadir), S (Sakit), I (Izin), A (Alpa)."),
        ("keterangan", "TEXT", "-", "YES", "Catatan alasan ketidakhadiran atau nomor surat."),
        ("guru_id", "INT", "FK -> pegawai(id)", "YES", "ID guru pencatat presensi."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint", "Null?", "Deskripsi Kolom"],
        rows=absensi_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.5), Inches(0.6), Inches(1.7)]
    )
    
    add_heading_2(doc, "5.2 Tabel `ppdb_pendaftar` (Pendaftaran Siswa Baru Online)")
    add_paragraph(doc, "Menyimpan data calon peserta didik yang mendaftar melalui portal publik.")
    ppdb_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik pendaftaran."),
        ("no_pendaftaran", "VARCHAR(50)", "Unique, Indexed", "NO", "Nomor registrasi unik pendaftar."),
        ("nama_lengkap", "VARCHAR(150)", "-", "NO", "Nama lengkap calon peserta didik."),
        ("nisn", "VARCHAR(20)", "Indexed", "YES", "NISN SMP/MTs calon siswa."),
        ("asal_sekolah", "VARCHAR(150)", "-", "YES", "Nama SMP/MTs asal pendaftar."),
        ("jurusan_pilihan_1", "INT", "FK -> jurusan(id)", "NO", "Pilihan kejuruan prioritas utama."),
        ("status_seleksi", "VARCHAR(30)", "DEFAULT 'menunggu'", "NO", "Status: menunggu, berkas_lengkap, diterima, ditolak."),
        ("is_converted", "BOOLEAN", "DEFAULT false", "NO", "Flag apakah sudah dikonversi ke siswa aktif."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint", "Null?", "Deskripsi Kolom"],
        rows=ppdb_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.5), Inches(0.6), Inches(1.7)]
    )
    
    add_heading_2(doc, "5.3 Tabel `kedisiplinan_pelanggaran` (Buku Poin BK & Tata Tertib)")
    add_paragraph(doc, "Mencatat pelanggaran tata tertib dan apresiasi prestasi siswa.")
    bk_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik pelanggaran."),
        ("siswa_id", "INT", "FK -> siswa(id)", "NO", "ID siswa yang bersangkutan."),
        ("kategori_id", "INT", "FK -> kedisiplinan_kategori", "NO", "ID kategori bentuk pelanggaran."),
        ("tanggal", "DATE", "-", "NO", "Tanggal kejadian pelanggaran."),
        ("poin", "INT", "-", "NO", "Bobot poin sanksi yang dibebankan."),
        ("tindakan", "TEXT", "-", "YES", "Sanksi atau tindakan pembinaan langsung."),
        ("petugas_id", "INT", "FK -> pegawai(id)", "NO", "ID Guru BK atau staf pencatat."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint", "Null?", "Deskripsi Kolom"],
        rows=bk_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.5), Inches(0.6), Inches(1.7)]
    )
    
    # ==================== BAB 6 ====================
    add_heading_1(doc, "BAB 6: KAMUS DATA KELOMPOK KEUANGAN, KASIR SPP & KAS UMUM")
    
    add_heading_2(doc, "6.1 Tabel `spp_pembayaran` (Transaksi Kasir Pembayaran SPP)")
    add_paragraph(doc, "Merekam setiap transaksi pembayaran SPP bulanan siswa yang sah di loket kasir.")
    spp_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik pembayaran SPP."),
        ("no_kwitansi", "VARCHAR(50)", "Unique, Indexed", "NO", "Nomor kwitansi resmi kasir."),
        ("siswa_id", "INT", "FK -> siswa(id)", "NO", "ID siswa pembayar."),
        ("bulan_bayar", "VARCHAR(50)", "contoh: 'Juli 2024'", "NO", "Nama bulan tagihan yang dibayarkan."),
        ("jumlah_bayar", "DECIMAL(12,2)", "-", "NO", "Nominal rupiah yang disetorkan ke kasir."),
        ("potongan", "DECIMAL(12,2)", "DEFAULT 0", "NO", "Nominal diskon atau beasiswa jika ada."),
        ("metode_bayar", "VARCHAR(30)", "tunai/transfer/qris", "NO", "Metode transaksi pembayaran."),
        ("petugas_id", "INT", "FK -> sec_user(id)", "NO", "ID staf kasir penerima pembayaran."),
        ("created_at", "TIMESTAMP", "Indexed", "NO", "Waktu presisi pembayaran disetorkan."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint", "Null?", "Deskripsi Kolom"],
        rows=spp_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.5), Inches(0.6), Inches(1.7)]
    )
    
    add_heading_2(doc, "6.2 Tabel `keuangan_buku_kas` (Buku Kas Umum Operasional Sekolah)")
    add_paragraph(doc, "Mencatat arus kas masuk dan kas keluar operasional sekolah (Inflow & Outflow).")
    kas_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik buku kas."),
        ("no_transaksi", "VARCHAR(50)", "Unique, Indexed", "NO", "Nomor bukti pembukuan kas."),
        ("tanggal", "DATE", "Indexed", "NO", "Tanggal transaksi kas."),
        ("tipe", "VARCHAR(10)", "MASUK / KELUAR", "NO", "Jenis arus: MASUK (Debit) atau KELUAR (Kredit)."),
        ("kategori", "VARCHAR(50)", "Indexed", "NO", "Pos anggaran (BOS, ATK, Listrik, Sarpras, Honor)."),
        ("nominal", "DECIMAL(15,2)", "-", "NO", "Nilai uang transaksi rupiah."),
        ("saldo_berjalan", "DECIMAL(15,2)", "-", "NO", "Posisi saldo kumulatif pascatransaksi."),
        ("uraian", "TEXT", "-", "NO", "Keterangan rincian tujuan transaksi."),
        ("no_bukti", "VARCHAR(100)", "-", "YES", "Nomor nota fisik atau kuitansi eksternal."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint", "Null?", "Deskripsi Kolom"],
        rows=kas_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.5), Inches(0.6), Inches(1.7)]
    )
    
    # ==================== BAB 7 ====================
    add_heading_1(doc, "BAB 7: KAMUS DATA KELOMPOK PERPUSTAKAAN, SARPRAS & AUDIT TRAIL")
    
    add_heading_2(doc, "7.1 Tabel `perpus_buku` (Katalog Pustaka Digital)")
    add_paragraph(doc, "Pangkalan data koleksi buku dan bahan pustaka sekolah.")
    buku_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik buku."),
        ("kode_buku", "VARCHAR(50)", "Unique, Indexed", "NO", "Barcode nomor inventaris buku unik."),
        ("isbn", "VARCHAR(30)", "Indexed", "YES", "Nomor ISBN resmi penerbit."),
        ("judul", "VARCHAR(255)", "Indexed", "NO", "Judul lengkap pustaka."),
        ("pengarang", "VARCHAR(150)", "-", "NO", "Nama penulis buku."),
        ("kategori_id", "INT", "FK -> perpus_kategori", "NO", "ID klasifikasi genre buku."),
        ("lokasi_rak", "VARCHAR(50)", "-", "YES", "Nomor lemari / rak penempatan fisik."),
        ("jumlah_total", "INT", "DEFAULT 1", "NO", "Total eksemplar fisik yang dimiliki."),
        ("jumlah_tersedia", "INT", "DEFAULT 1", "NO", "Jumlah buku yang siap dipinjam saat ini."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint", "Null?", "Deskripsi Kolom"],
        rows=buku_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.5), Inches(0.6), Inches(1.7)]
    )
    
    add_heading_2(doc, "7.2 Tabel `sarpras_barang` (Inventaris Aset Barang Sekolah)")
    add_paragraph(doc, "Mencatat aset fisik sekolah, lokasi ruangan, dan audit kondisi fisiknya.")
    sarpras_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik aset barang."),
        ("kode_barang", "VARCHAR(50)", "Unique, Indexed", "NO", "Nomor kode stiker barcode/QR aset."),
        ("nama_barang", "VARCHAR(150)", "-", "NO", "Nama barang (contoh: Proyektor Epson)."),
        ("ruangan_id", "INT", "FK -> sarpras_ruangan", "YES", "ID ruangan penempatan barang."),
        ("sumber_dana", "VARCHAR(50)", "BOS/Yayasan/Hibah", "YES", "Asal perolehan pembiayaan aset."),
        ("kondisi_utama", "VARCHAR(30)", "Indexed", "NO", "Kondisi: baik, rusak_ringan, rusak_berat."),
        ("jumlah_total", "INT", "DEFAULT 1", "NO", "Total unit fisik aset yang dicatat."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint", "Null?", "Deskripsi Kolom"],
        rows=sarpras_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.5), Inches(0.6), Inches(1.7)]
    )
    
    add_heading_2(doc, "7.3 Tabel `sec_audit_log` (Perekam Jejak Mutasi & Forensik IT)")
    add_paragraph(doc, "Merekam jejak audit keamanan seluruh perubahan data sistem.")
    audit_cols = [
        ("id", "SERIAL", "PK, Auto", "NO", "Identifier unik log audit."),
        ("user_id", "INT", "Indexed", "YES", "ID pengguna pelaksana mutasi."),
        ("modul", "VARCHAR(50)", "Indexed", "NO", "Modul: AKADEMIK, KEUANGAN, SARPRAS, dsb."),
        ("aksi", "VARCHAR(50)", "Indexed", "NO", "Aksi: CREATE, UPDATE, DELETE, LOGIN, EXPORT."),
        ("deskripsi", "TEXT", "-", "NO", "Narasi peristiwa aktivitas."),
        ("data_sebelum", "TEXT / JSONB", "-", "YES", "Snapshot data sebelum operasi dieksekusi."),
        ("data_sesudah", "TEXT / JSONB", "-", "YES", "Snapshot data setelah operasi dieksekusi."),
        ("ip_address", "VARCHAR(50)", "-", "YES", "Alamat IP perangkat klien asal."),
        ("status", "VARCHAR(20)", "DEFAULT 'SUCCESS'", "NO", "Status eksekusi: SUCCESS, FAILED, WARNING."),
        ("created_at", "TIMESTAMP", "Indexed", "NO", "Waktu pencatatan mutasi sistem."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Fisik", "Tipe Data", "Constraint", "Null?", "Deskripsi Kolom"],
        rows=audit_cols,
        col_widths=[Inches(1.2), Inches(1.1), Inches(1.5), Inches(0.6), Inches(1.7)]
    )
    
    # ==================== BAB 8 ====================
    add_heading_1(doc, "BAB 8: STRATEGI INDEKSASI, OPTIMASI & DISASTER RECOVERY")
    
    add_heading_2(doc, "8.1 Matriks Pengindeksan Kolom Kueri Kritis (Indexing Strategy)")
    add_paragraph(
        doc,
        "Untuk mencegah terjadinya Full Table Scan saat data mencapai puluhan ribu baris, skema basis data dilengkapi indeks B-Tree pada kolom-kolom pencarian frekuensi tinggi:"
    )
    add_bullet(doc, "Kolom username pada sec_user, nis & nisn pada siswa, no_kwitansi pada spp_pembayaran, dan kode_barang pada sarpras_barang.", "1. Indeks Kolom Unik (B-Tree Unique Index): ")
    add_bullet(doc, "Kolom tanggal pada absensi_kelas, tanggal pada keuangan_buku_kas, dan created_at pada sec_audit_log untuk mempercepat query filter rentang waktu.", "2. Indeks Kolom Tanggal (Temporal Index): ")
    add_bullet(doc, "Kolom modul dan aksi pada sec_audit_log, serta status_siswa pada tabel siswa.", "3. Indeks Status Kategori (Categorical Index): ")
    
    add_heading_2(doc, "8.2 Prosedur Pencadangan (Backup) & Pemulihan (Disaster Recovery)")
    add_paragraph(
        doc,
        "DBA wajib menerapkan strategi pencadangan data otomatis menggunakan utilitas bawaan PostgreSQL:"
    )
    add_code_block(doc, """# 1. Prosedur Pencadangan Harian (Cron Job Otomatis)
pg_dump -U postgres -h localhost -d db_manajemen_sekolah -F c -b -v -f "/backup/sims_db_$(date +%Y%m%d_%H%M%S).dump"

# 2. Prosedur Pemulihan Basis Data (Disaster Recovery)
pg_restore -U postgres -h localhost -d db_manajemen_sekolah -v -c "/backup/sims_db_20261113_140000.dump"
""")
    
    add_callout(
        doc,
        "TIP",
        "Rekomendasi Pemeliharaan Rutin DBA",
        "Jalankan kueri pemeliharaan VACUUM ANALYZE; setiap akhir bulan kalender akademik untuk memperbarui statistik perencana kueri (Query Planner) PostgreSQL dan mengklaim kembali ruang disk dari tuple yang telah dihapus."
    )
    
    # Save document
    doc.save(output_path)
    print(f"✅ Dokumen berhasil dibuat: {output_path}")

if __name__ == "__main__":
    build_tech_02_db()

