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
    add_menu_path
)

def build_admin_manual():
    output_path = os.path.join("docs", "user-manual", "01-panduan-administrator.docx")
    
    doc = create_base_document(
        book_series_title="BUKU 1: PANDUAN ADMINISTRATOR SISTEM",
        book_subtitle="Pedoman Operasional Lengkap untuk Super Administrator dan Staf IT dalam Pengelolaan Akun, Matriks Hak Akses (RBAC), Identitas Lembaga, Konfigurasi Master Data Akademik, serta Pengawasan Keamanan Sistem (Audit Trail).",
        doc_id="DOC-SIMS-01-ADM",
        target_roles="Super Administrator, Administrator Sistem, Koordinator Tim IT Sekolah",
        version="1.0"
    )
    
    # ==================== DAFTAR ISI / RINGKASAN ====================
    add_heading_1(doc, "RINGKASAN EKSEKUTIF & DAFTAR ISI PANDUAN", page_break=False)
    add_paragraph(
        doc,
        "Buku Panduan Administrator Sistem ini disusun secara khusus bagi penanggung jawab operasional teknis Sistem Informasi Manajemen Sekolah Terpadu (SIMS). Sebagai pemegang otoritas tertinggi, Administrator memegang kendali penuh atas keamanan data, hak akses personel sekolah, integritas basis data akademik, dan kepatuhan terhadap standar operasional sekolah."
    )
    
    toc_data = [
        ("BAB 1", "Pendahuluan & Arsitektur Akses Sistem", "Persyaratan teknis, alur login, dan navigasi antarmuka dashboard"),
        ("BAB 2", "Manajemen Akun Pengguna & Keamanan Kredensial", "Pendaftaran akun staf, reset password, aktivasi/blokir akun"),
        ("BAB 3", "Manajemen Peran & Matriks Hak Akses (RBAC)", "Konfigurasi role, hak akses menu, dan pembatasan izin kerja"),
        ("BAB 4", "Profil & Identitas Sekolah", "Pengaturan identitas legal, kepala sekolah, bendahara, kop surat resmi"),
        ("BAB 5", "Setup Master Data Pokok Akademik", "Tahun ajaran, jurusan, rombel/kelas, mata pelajaran, pegawai, siswa"),
        ("BAB 6", "Pengawasan Keamanan & Audit Trail", "Pemantauan aktivitas real-time, perbandingan snapshot data, ekspor CSV"),
        ("BAB 7", "Pemeliharaan Sistem & Panduan Pemecahan Masalah", "Backup database, penanganan sesi, dan troubleshooting"),
    ]
    add_styled_table(
        doc,
        headers=["Bab", "Topik Pembahasan", "Ruang Lingkup Operasional"],
        rows=toc_data,
        col_widths=[Inches(0.9), Inches(2.5), Inches(2.7)]
    )
    
    add_callout(
        doc,
        "IMPORTANT",
        "Kerahasiaan Kredensial Akun Administrator",
        "Akun berstatus Administrator memiliki wewenang penuh untuk mengubah, menghapus, dan memanipulasi seluruh data transaksi keuangan, nilai siswa, dan akun staf. Jangan pernah membagikan kata sandi akun Admin kepada siapa pun dan pastikan selalu melakukan Logout saat meninggalkan perangkat kerja."
    )
    
    # ==================== BAB 1 ====================
    add_heading_1(doc, "BAB 1: PENDAHULUAN & ARSITEKTUR AKSES SISTEM")
    
    add_heading_2(doc, "1.1 Gambaran Umum Sistem Manajemen Sekolah")
    add_paragraph(
        doc,
        "Sistem Informasi Manajemen Sekolah Terpadu (SIMS) merupakan platform enterprise terintegrasi yang dirancang untuk mengotomatisasi seluruh pilar layanan operasional sekolah, mulai dari administrasi kesiswaan, kegiatan belajar-mengajar, absensi digital berbasis QR code, pengelolaan kasir SPP dan keuangan terpadu, katalog perpustakaan, manajemen aset sarana dan prasarana (sarpras), hingga publikasi portal website eksternal."
    )
    
    add_heading_2(doc, "1.2 Persyaratan Perangkat Keras & Peramban (Browser)")
    add_paragraph(
        doc,
        "Agar antarmuka sistem dapat berjalan secara maksimal dengan performa tinggi dan responsif, pastikan perangkat kerja Administrator memenuhi spesifikasi standar berikut:"
    )
    
    spec_rows = [
        ("Perangkat Komputer / Laptop", "Minimum Processor Dual-Core 2.0 GHz, RAM 4 GB (Disarankan 8 GB)", "Mendukung kelancaran multitasking tab browser"),
        ("Sistem Operasi", "Windows 10/11, macOS Catalina+, atau Linux Ubuntu 20.04+", "Kompatibel penuh dengan seluruh sistem operasi modern"),
        ("Peramban Web (Browser)", "Google Chrome (v110+), Microsoft Edge (v110+), Mozilla Firefox (v115+)", "Sangat disarankan menggunakan Google Chrome atau Edge"),
        ("Resolusi Layar", "Minimum 1366 x 768 piksel (Optimal pada 1920 x 1080 Full HD)", "Menjamin tampilan dashboard dan tabel data tidak terpotong"),
        ("Koneksi Jaringan", "Akses jaringan lokal sekolah (LAN/Wi-Fi) atau Internet minimal 5 Mbps", "Diperlukan untuk sinkronisasi data dan audit log real-time"),
    ]
    add_styled_table(
        doc,
        headers=["Komponen", "Spesifikasi Minimum / Rekomendasi", "Keterangan"],
        rows=spec_rows,
        col_widths=[Inches(1.8), Inches(2.7), Inches(1.6)]
    )
    
    add_heading_2(doc, "1.3 Prosedur Masuk (Login) Administrator")
    add_menu_path(doc, "Halaman Autentikasi Sistem ➔ Form Login (/auth/login)")
    add_paragraph(
        doc,
        "Untuk mengakses area kontrol dashboard, Administrator harus melakukan autentikasi kredensial melalui formulir login terproteksi:"
    )
    
    add_step(
        doc,
        1,
        "Membuka Peramban Web",
        "Buka peramban Google Chrome atau Microsoft Edge, lalu ketikkan alamat domain/IP lokal server sekolah (contoh: http://localhost:3001 atau domain resmi sekolah yang ditentukan)."
    )
    add_step(
        doc,
        2,
        "Memasukkan Kredensial Administrator",
        "Pada halaman login, masukkan Nama Pengguna (Username) dan Kata Sandi (Password) akun Administrator Anda.",
        [
            "Username default bawaan: admin (atau email staf IT yang didaftarkan)",
            "Password awal: Pastikan segera diubah pada login pertama demi keamanan"
        ]
    )
    add_step(
        doc,
        3,
        "Verifikasi dan Masuk ke Dashboard",
        "Klik tombol [Masuk ke Sistem]. Sistem akan memvalidasi token JWT dan mengarahkan Anda langsung ke halaman muka Dashboard Utama."
    )
    
    add_callout(
        doc,
        "TIP",
        "Keamanan Sesi & Auto-Logout",
        "Sistem dilengkapi pengaman sesi otomatis. Jika browser ditinggalkan tanpa aktivitas selama lebih dari 8 jam, sesi login akan kedaluwarsa secara otomatis dan Administrator diwajibkan melakukan login ulang untuk mencegah penyalahgunaan akses oleh pihak yang tidak berwenang."
    )
    
    add_heading_2(doc, "1.4 Anatomi Antarmuka Dashboard Administrator")
    add_paragraph(
        doc,
        "Antarmuka SIMS didesain dengan prinsip ergonomis modern yang terbagi ke dalam 4 area utama:"
    )
    add_bullet(doc, "Terletak di sisi kiri layar, memuat pengelompokan modul seperti Menu Utama, Akademik & Kesiswaan, Presensi & Kehadiran, Keuangan & SPP, Perpustakaan, Sarpras, CMS, dan Pengaturan Sistem.", "1. Panel Bilah Samping (Sidebar Navigation): ")
    add_bullet(doc, "Terletak di sisi atas, menampilkan tombol ciutkan sidebar, tombol beralih mode gelap/terang (Dark/Light mode), dan avatar profil pengguna aktif.", "2. Bilah Atas (Top Header): ")
    add_bullet(doc, "Menampilkan jejak lokasi menu yang sedang dibuka agar memudahkan navigasi kembali ke menu induk.", "3. Penunjuk Navigasi (Breadcrumbs): ")
    add_bullet(doc, "Area kerja utama yang menampilkan kartu metrik ringkasan (KPI Cards), filter pencarian instan (SearchableSelect), tabel data interaktif, dan tombol aksi pengoperasian.", "4. Lembar Kerja Konten (Main Workspace): ")
    
    # ==================== BAB 2 ====================
    add_heading_1(doc, "BAB 2: MANAJEMEN AKUN PENGGUNA & KEAMANAN KREDENSIAL")
    add_menu_path(doc, "Sidebar ➔ Pengaturan Sistem ➔ Akun Pengguna (/pengaturan/pengguna)")
    
    add_paragraph(
        doc,
        "Modul Akun Pengguna berfungsi sebagai pusat kontrol identitas digital seluruh pegawai dan staf sekolah yang berhak login ke dalam sistem. Melalui modul ini, Administrator dapat mendaftarkan akun baru, menonaktifkan staf yang telah purnatugas, dan mereset kata sandi staf yang lupa password."
    )
    
    add_heading_2(doc, "2.1 Kamus Data Informasi Akun Pengguna")
    user_fields = [
        ("Nama Lengkap", "Teks (Wajib)", "Nama resmi pemilik akun beserta gelar kependidikan jika ada."),
        ("Username", "Teks Unik (Wajib)", "ID unik untuk login tanpa spasi (contoh: ahmad.dahlan atau bendahara01)."),
        ("Email Resmi", "Email Valid (Wajib)", "Alamat surat elektronik aktif untuk komunikasi sistem."),
        ("Password", "Kombinasi Karakter", "Kata sandi awal minimum 6 karakter (kombinasi huruf dan angka)."),
        ("Peran (Role)", "Pilihan Dropdown", "Hak kelompok kerja (Administrator, Guru, Tata Usaha, dsb)."),
        ("Status Akun", "Pilihan (Aktif / Nonaktif)", "Status operasional; akun nonaktif ditolak seketika saat login."),
    ]
    add_styled_table(
        doc,
        headers=["Nama Kolom", "Tipe Data & Validasi", "Deskripsi & Petunjuk Pengisian"],
        rows=user_fields,
        col_widths=[Inches(1.5), Inches(1.8), Inches(2.8)]
    )
    
    add_heading_2(doc, "2.2 Langkah Menambahkan Akun Pengguna Baru")
    add_step(doc, 1, "Buka Menu Akun Pengguna", "Arahkan kursor pada sidebar, klik kelompok Pengaturan Sistem lalu pilih Akun Pengguna.")
    add_step(doc, 2, "Buka Modal Pendaftaran", "Klik tombol berwarna biru [+ Tambah Pengguna Baru] di sudut kanan atas halaman.")
    add_step(doc, 3, "Isi Formulir Identitas", "Lengkapi kolom Nama Lengkap, Username, Email, dan tentukan Password sementara untuk pengguna tersebut.")
    add_step(doc, 4, "Tentukan Peran (Role)", "Gunakan dropdown pencarian untuk memilih peran yang sesuai dengan tupoksi pegawai (misal: BEND_KEUANGAN untuk staf kasir).")
    add_step(doc, 5, "Simpan Data", "Tekan tombol [Simpan Pengguna]. Sistem akan memvalidasi keunikan username dan email, lalu menyimpan akun secara instan.")
    
    add_heading_2(doc, "2.3 Prosedur Reset Password & Penguncian Akun")
    add_paragraph(
        doc,
        "Jika terdapat guru atau staf yang lupa kata sandinya atau perangkatnya hilang, Administrator dapat melakukan penanganan darurat melalui prosedur berikut:"
    )
    add_step(doc, 1, "Cari Pengguna Terkait", "Gunakan kotak pencarian cepat di atas tabel akun dengan mengetikkan nama atau username pengguna.")
    add_step(doc, 2, "Klik Aksi Ubah / Edit", "Pada kolom paling kanan baris akun tersebut, klik tombol ikon pensil [Edit].")
    add_step(doc, 3, "Input Password Pengganti", "Ketikkan kata sandi baru pada kolom Ubah Password. Kosongkan kolom ini jika hanya ingin mengubah data profil tanpa mengganti password.")
    add_step(doc, 4, "Menonaktifkan Akun (Jika Diperlukan)", "Jika pegawai sedang dalam masa cuti panjang atau mutasi keluar, ubah saklar Status Akun menjadi Nonaktif (Blokir). Akun tersebut seketika tidak dapat masuk ke sistem.")
    add_step(doc, 5, "Konfirmasi Pembaruan", "Klik tombol [Perbarui Akun] untuk menyimpan perubahan.")
    
    add_callout(
        doc,
        "WARNING",
        "Dampak Penonaktifan Akun",
        "Menonaktifkan akun TIDAK AKAN menghapus riwayat transaksi masa lalu yang pernah dibuat oleh pengguna tersebut (seperti riwayat pencatatan SPP atau nilai siswa). Data historis tetap utuh demi menjaga keabsahan pembukuan dan audit trail sekolah."
    )
    
    # ==================== BAB 3 ====================
    add_heading_1(doc, "BAB 3: MANAJEMEN PERAN & MATRIKS HAK AKSES (RBAC)")
    add_menu_path(doc, "Sidebar ➔ Pengaturan Sistem ➔ Manajemen Peran & Matriks Hak Akses (/pengaturan/hak-akses)")
    
    add_paragraph(
        doc,
        "Arsitektur keamanan SIMS menerapkan mekanisme Role-Based Access Control (RBAC) granular tingkat tinggi. Mekanisme ini menjamin prinsip pemisahan wewenang (Segregation of Duties), di mana pengguna hanya diizinkan melihat dan memanipulasi modul yang relevan dengan tugas kedinasannya."
    )
    
    add_heading_2(doc, "3.1 Struktur Peran Standar Bawaan Sistem")
    role_rows = [
        ("Administrator (SUPERADMIN)", "Akses mutlak ke seluruh modul sistem tanpa pembatasan.", "Kepala Lab IT / Superadmin"),
        ("Tata Usaha (STAFF_TU)", "Pengelolaan data induk siswa, mutasi, dan pencetakan surat.", "Staf Administrasi TU"),
        ("Bendahara Keuangan (BENDAHARA)", "Kasir SPP, cicilan tagihan, buku kas umum, dan laporan keuangan.", "Bendahara Sekolah"),
        ("Guru Pengajar (GURU)", "Jadwal mengajar, presensi kelas harian, dan input nilai rapor.", "Dewan Guru / Pendidik"),
        ("Wali Kelas (WALI_KELAS)", "Fitur guru ditambah rekap catatan karakter dan cetak rapor kelas.", "Wali Kelas Siswa"),
        ("Petugas Perpustakaan (PUSTAKAWAN)", "Katalog buku perpustakaan, sirkulasi peminjaman QR, denda.", "Pengelola Perpustakaan"),
        ("Pengelola Sarpras (SARPRAS)", "Master ruangan, inventaris barang, audit kondisi, dan label QR.", "Staf Bagian Perlengkapan"),
        ("Petugas PPDB & BK (KESISWAAN)", "Verifikasi pendaftar baru dan pencatatan buku pelanggaran disiplin.", "Panitia PPDB & Guru BK"),
    ]
    add_styled_table(
        doc,
        headers=["Kode & Nama Peran (Role)", "Cakupan Izin Operasional", "Pemegang Peran"],
        rows=role_rows,
        col_widths=[Inches(2.0), Inches(2.6), Inches(1.5)]
    )
    
    add_heading_2(doc, "3.2 Cara Mengonfigurasi Matriks Hak Akses Menu")
    add_paragraph(
        doc,
        "Pada halaman Matriks Hak Akses (/pengaturan/hak-akses), disajikan tabel kisi-kisi (matrix grid) yang menghubungkan antara Daftar Menu di sisi kiri dengan Daftar Peran di sisi kolom atas:"
    )
    add_step(doc, 1, "Pilih Peran Target", "Pilih peran yang ingin Anda atur hak aksesnya dari tab atau kolom peran yang tersedia.")
    add_step(doc, 2, "Tinjau Hak Akses Menu", "Periksa daftar menu yang terbagi per kategori (Akademik, Presensi, Keuangan, Perpustakaan, Sarpras, Pengaturan).")
    add_step(doc, 3, "Beri Tanda Centang (Checklist)", "Centang kotak untuk memberikan izin akses membuka menu tersebut, atau hilangkan centang untuk menyembunyikan menu dari navigasi sidebar peran terkait.")
    add_step(doc, 4, "Menyimpan Matriks", "Klik tombol [Simpan Matriks Hak Akses] di bagian atas tabel. Seluruh staf yang memiliki peran tersebut akan langsung mendapatkan pembaruan menu saat halaman browser dimuat ulang.")
    
    add_callout(
        doc,
        "TIP",
        "Pengujian Hak Akses Baru",
        "Setelah mengubah matriks hak akses untuk peran tertentu (misalnya GURU), Anda dapat menguji hasilnya dengan cara login menggunakan salah satu akun guru pengajar pada jendela penyamaran (Incognito Window) peramban untuk memastikan menu yang disembunyikan benar-benar tidak tampil."
    )
    
    # ==================== BAB 4 ====================
    add_heading_1(doc, "BAB 4: PENGATURAN IDENTITAS & PROFIL SEKOLAH")
    add_menu_path(doc, "Sidebar ➔ Pengaturan Sistem ➔ Profil & Tema Sekolah (/pengaturan/sekolah)")
    
    add_paragraph(
        doc,
        "Data identitas sekolah yang dikonfigurasi pada menu ini digunakan sebagai sumber data tunggal (Single Source of Truth) untuk menghasilkan Kop Surat Resmi, Lembar Pengesahan Tanda Tangan, Kwitansi Pembayaran SPP, Dokumen E-Rapor Siswa, dan Berita Acara Inventaris."
    )
    
    add_heading_2(doc, "4.1 Bagian Data Pokok Lembaga Pendidikan")
    school_fields = [
        ("Nama Lembaga Sekolah", "Wajib diisi sesuai nama legal pada SK Izin Operasional Kementerian Pendidikan."),
        ("Nomor Pokok Sekolah Nasional (NPSN)", "8 digit angka resmi identitas sekolah dari Pusdatin Kemendikbud."),
        ("Nomor Statistik Sekolah (NSS/NDS)", "Nomor statistik resmi pendataan yayasan atau dinas pendidikan setempat."),
        ("Status Akreditasi & Jenjang", "Peringkat akreditasi (contoh: Terakreditasi A) dan jenjang (SMK / SMA / SMP)."),
        ("Alamat Lengkap & Kode Pos", "Alamat jalan, kelurahan, kecamatan, kota/kabupaten, dan kode pos posko sekolah."),
        ("Kontak Telepon, Email & Website", "Nomor telepon operasional, email dinas, dan alamat situs web portal publik."),
    ]
    add_styled_table(
        doc,
        headers=["Elemen Identitas", "Petunjuk Konfigurasi Resmi"],
        rows=school_fields,
        col_widths=[Inches(2.3), Inches(3.8)]
    )
    
    add_heading_2(doc, "4.2 Konfigurasi Pejabat Penandatangan Resmi")
    add_paragraph(
        doc,
        "Pada bagian bawah formulir profil sekolah, terdapat pengaturan Pejabat Penandatangan yang akan otomatis dicetak pada lembar pengesahan dokumen resmi:"
    )
    add_bullet(doc, "Nama lengkap beserta gelar kependidikan dan NIP/NUPTK resmi. Pejabat ini akan tercantum di lembar pengesahan E-Rapor, Laporan Arus Kas, dan SK Mutasi.", "1. Kepala Sekolah: ")
    add_bullet(doc, "Nama lengkap dan NIP/NIK staf bendahara yang berwenang mengesahkan dokumen penerimaan kas, kwitansi SPP, dan buku kas umum.", "2. Bendahara Sekolah: ")
    add_bullet(doc, "Kota resmi yang dicantumkan pada titimangsa dokumen cetak (contoh: Garut, Bandung, Jakarta).", "3. Kota Tempat Penetapan Dokumen: ")
    
    add_heading_2(doc, "4.3 Pengaturan Logo Sekolah & Kop Dokumen")
    add_paragraph(
        doc,
        "Administrator dapat memperbarui logo sekolah dengan mengunggah berkas gambar resmi (format PNG dengan latar transparan atau JPEG resolusi tajam minimal 300x300 piksel). Logo ini akan secara otomatis terintegrasi pada kop cetak seluruh laporan di sistem."
    )
    
    # ==================== BAB 5 ====================
    add_heading_1(doc, "BAB 5: SETUP AWAL MASTER DATA POKOK AKADEMIK")
    add_paragraph(
        doc,
        "Sebelum staf operasional (guru, kasir, panitia PPDB) mulai menggunakan sistem secara harian, Administrator diwajibkan memastikan seluruh data master pokok telah terkonfigurasi dengan benar sesuai hierarki akademik sekolah."
    )
    
    add_heading_2(doc, "5.1 Urutan Kronologis Setup Master Data")
    setup_steps = [
        ("Tahap 1", "Tahun Ajaran & Semester", "/akademik/tahun-ajaran", "Tentukan tahun aktif (misal 2024/2025) dan semester (Ganjil/Genap)."),
        ("Tahap 2", "Program Jurusan / Peminatan", "/jurusan", "Daftarkan jurusan sekolah (misal: Rekayasa Perangkat Lunak, Otomotif, dsb)."),
        ("Tahap 3", "Rombongan Belajar (Kelas)", "/kelas", "Bentuk rombel kelas (misal: X RPL 1, XI TKJ 2) dan tentukan wali kelasnya."),
        ("Tahap 4", "Master Mata Pelajaran", "/akademik/mapel", "Input daftar mapel, kode mata pelajaran, kelompok, dan KKM standar."),
        ("Tahap 5", "Data Guru & Tenaga Kependidikan", "/pegawai", "Daftarkan NIK/NIP guru, status kepegawaian (PNS/GTY/PTY), dan kontak."),
        ("Tahap 6", "Data Siswa Pokok", "/siswa", "Registrasi NIS, NISN, nama lengkap, rombel kelas aktif, dan data orang tua."),
    ]
    add_styled_table(
        doc,
        headers=["Tahap", "Entitas Master", "Lokasi Navigasi Menu", "Deskripsi Setup"],
        rows=setup_steps,
        col_widths=[Inches(0.8), Inches(1.8), Inches(1.5), Inches(2.0)]
    )
    
    add_heading_2(doc, "5.2 Prosedur Pengisian Rombel & Pembagian Kelas")
    add_menu_path(doc, "Sidebar ➔ Akademik & Kesiswaan ➔ Rombel & Kelas (/kelas)")
    add_step(doc, 1, "Buka Menu Kelas", "Arahkan ke menu Rombel & Kelas pada bilah sisi navigasi.")
    add_step(doc, 2, "Tambah Rombel Baru", "Klik tombol [+ Tambah Rombel Baru].")
    add_step(doc, 3, "Input Detail Kelas", "Pilih Tingkat Kelas (10, 11, 12), Program Jurusan, dan masukkan Nama Rombel secara jelas (contoh: X-RPL-1).")
    add_step(doc, 4, "Tetapkan Wali Kelas & Ruangan", "Gunakan dropdown berfitur pencarian untuk memilih Guru yang ditugaskan sebagai Wali Kelas serta Ruangan tempat belajar mengajar.")
    add_step(doc, 5, "Simpan Rombel", "Klik tombol [Simpan Kelas]. Rombel tersebut siap diisi oleh siswa aktif.")
    
    # ==================== BAB 6 ====================
    add_heading_1(doc, "BAB 6: PENGAWASAN KEAMANAN & AUDIT TRAIL")
    add_menu_path(doc, "Sidebar ➔ Pengaturan Sistem ➔ Audit Trail & Log Aktivitas (/pengaturan/audit-log)")
    
    add_paragraph(
        doc,
        "Modul Audit Trail merupakan sistem pengawasan keamanan digital yang merekam seluruh jejak mutasi data secara kronologis dan tidak dapat dimanipulasi (Tamper-Resistant). Modul ini memberikan akuntabilitas mutlak atas siapa melakukan apa, kapan waktu terjadinya, dari perangkat mana, dan apa data sebelum serta sesudah perubahan."
    )
    
    add_heading_2(doc, "6.1 Kartu Ringkasan Metrik Pengawasan (KPI)")
    add_paragraph(
        doc,
        "Pada bagian atas dasbor Audit Trail disajikan 4 kartu indikator kesehatan aktivitas sistem:"
    )
    add_bullet(doc, "Akumulasi seluruh log mutasi data sejak sistem pertama kali dioperasikan.", "1. Total Log Aktivitas: ")
    add_bullet(doc, "Jumlah transaksi, autentikasi, dan perubahan yang berlangsung pada tanggal hari ini.", "2. Aktivitas Hari Ini: ")
    add_bullet(doc, "Jumlah aksi mutasi data kritis seperti penambahan (CREATE), pengubahan (UPDATE), dan penghapusan (DELETE).", "3. Perubahan Data: ")
    add_bullet(doc, "Jumlah peringatan anomali atau upaya akses yang ditolak oleh sistem keamanan.", "4. Peringatan Keamanan (Warning): ")
    
    add_heading_2(doc, "6.2 Menggunakan Filter Pencarian Multi-Kriteria")
    add_paragraph(
        doc,
        "Untuk menyelidiki insiden tertentu (misal: mencari tahu siapa yang menghapus nilai siswa atau transaksi SPP), manfaatkan panel filter pencarian interaktif:"
    )
    add_step(doc, 1, "Filter Modul Sistem", "Pilih modul spesifik pada dropdown pencarian: AKADEMIK, KEUANGAN, KESISWAAN, PERPUSTAKAAN, SARPRAS, atau AUTH.")
    add_step(doc, 2, "Filter Jenis Tindakan (Aksi)", "Pilih jenis mutasi yang dicari: CREATE (Tambah data), UPDATE (Ubah data), DELETE (Hapus data), atau LOGIN/LOGOUT.")
    add_step(doc, 3, "Filter Status Eksekusi", "Pilih status SUCCESS untuk transaksi yang berhasil atau FAILED/WARNING untuk transaksi yang gagal/mencurigakan.")
    add_step(doc, 4, "Cari Kata Kunci Spesifik", "Ketikkan nama siswa, nomor kwitansi, atau username pelaku pada kolom pencarian teks bebas.")
    
    add_heading_2(doc, "6.3 Memeriksa Snapshot Perbandingan Data (Sebelum vs Sesudah)")
    add_paragraph(
        doc,
        "Keunggulan utama Audit Trail SIMS adalah kemampuannya menyimpan rekaman snapshot data JSON pada setiap aksi UPDATE atau DELETE:"
    )
    add_step(doc, 1, "Buka Detail Log", "Pada tabel log audit, klik tombol mata [Lihat Detail] pada baris transaksi yang ingin diinvestigasi.")
    add_step(doc, 2, "Evaluasi Modal Komparasi", "Sistem akan membuka dialog modal yang menampilkan dua kolom berdampingan:")
    add_bullet(doc, "Menampilkan kondisi data asli sebelum tombol simpan ditekan oleh pengguna.", "• Kolom Data Sebelum (Old Snapshot): ")
    add_bullet(doc, "Menampilkan kondisi nilai baru yang diinputkan pengguna ke dalam sistem.", "• Kolom Data Sesudah (New Snapshot): ")
    add_step(doc, 3, "Tinjau Alamat IP & Agen Peramban", "Dialog juga mencantumkan alamat IP perangkat pelaku dan nama sistem operasi browser yang digunakan untuk keperluan forensik IT.")
    
    add_heading_2(doc, "6.4 Mengekspor Log Audit ke Berkas CSV")
    add_paragraph(
        doc,
        "Untuk keperluan audit independen oleh komite sekolah, yayasan, atau auditor dinas pendidikan, Administrator dapat mengekspor seluruh riwayat log audit ke berkas spreadsheet CSV:"
    )
    add_step(doc, 1, "Terapkan Filter Periode", "Atur filter rentang tanggal atau modul yang ingin diekspor pada tabel log.")
    add_step(doc, 2, "Klik Tombol Ekspor CSV", "Tekan tombol berwarna hijau [Ekspor Data (CSV)] di bagian kanan atas lembar kerja.")
    add_step(doc, 3, "Unduh Berkas", "Peramban akan secara otomatis mengunduh berkas dengan nama audit_trail_sekolah_YYYY-MM-DD.csv yang dapat dibuka menggunakan Microsoft Excel.")
    
    # ==================== BAB 7 ====================
    add_heading_1(doc, "BAB 7: PEMELIHARAAN SISTEM & PANDUAN PEMECAHAN MASALAH")
    
    add_heading_2(doc, "7.1 Prosedur Pencadangan (Backup) Database Berkala")
    add_paragraph(
        doc,
        "Sangat disarankan bagi Staf IT Administrator untuk melakukan pencadangan berkala basis data PostgreSQL setiap akhir pekan atau sebelum melakukan pembaruan kalender akademik baru:"
    )
    add_bullet(doc, "Jalankan perintah utilitas PostgreSQL pada terminal server: pg_dump -U postgres -d db_manajemen_sekolah > backup_sims_tanggal.sql", "1. Perintah Backup Standar: ")
    add_bullet(doc, "Salin berkas backup .sql ke media penyimpanan sekunder (seperti hard drive eksternal atau Google Drive institusi terenkripsi).", "2. Penyimpanan Cadangan: ")
    add_bullet(doc, "Jika server mengalami kerusakan perangkat keras, database dapat dipulihkan kapan saja dengan perintah: psql -U postgres -d db_manajemen_sekolah < backup_sims_tanggal.sql", "3. Prosedur Restore: ")
    
    add_heading_2(doc, "7.2 Tanya Jawab Masalah Umum (Troubleshooting & FAQ)")
    faq_data = [
        ("Staf mengeluh menu tertentu hilang dari sidebar", "Periksa menu /pengaturan/hak-akses. Pastikan kotak centang menu tersebut untuk peran staf terkait dalam kondisi tercentang, lalu minta staf melakukan refresh browser (Ctrl + F5)."),
        ("Kwitansi atau laporan cetak terpotong di printer", "Pastikan pengaturan ukuran kertas pada dialog print diatur ke A4 (atau Roll 80mm untuk printer kasir thermal), dan nonaktifkan opsi 'Headers and footers' pada menu More Settings browser."),
        ("Pengguna tidak bisa login dengan pesan 'Kredensial Tidak Cocok'", "Periksa menu /pengaturan/pengguna. Pastikan status akun aktif (bukan Nonaktif) dan lakukan Reset Password jika staf benar-benar lupa kata sandinya."),
        ("Sistem terasa lambat saat memuat ribuan data siswa", "Manfaatkan kolom filter per rombel kelas dan pagination halaman (10, 25, 50 data per halaman) untuk mempercepat perenderan tabel di browser."),
    ]
    add_styled_table(
        doc,
        headers=["Gejala Masalah / Kendala", "Langkah Solusi Administrator"],
        rows=faq_data,
        col_widths=[Inches(2.5), Inches(3.6)]
    )
    
    add_callout(
        doc,
        "TIP",
        "Kontak Bantuan & Dukungan Teknis",
        "Apabila timbul kendala teknis tak terduga terkait basis data atau modul sistem, tim IT sekolah dapat memeriksa catatan log server aplikasi atau menghubungi tim pengembang sistem terpadu untuk mendapatkan pendampingan lebih lanjut."
    )
    
    # Save the document
    doc.save(output_path)
    print(f"✅ Dokumen berhasil dibuat: {output_path}")

if __name__ == "__main__":
    build_admin_manual()

