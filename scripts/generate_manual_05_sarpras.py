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

def build_sarpras_manual():
    output_path = os.path.join("docs", "user-manual", "05-panduan-perpustakaan-sarpras.docx")
    
    doc = create_base_document(
        book_series_title="BUKU 5: PANDUAN PERPUSTAKAAN & SARPRAS",
        book_subtitle="Pedoman Operasional Pengelolaan Perpustakaan Digital, Sirkulasi & Scan Barcode, Manajemen Sarana & Prasarana (Master Ruangan & Aset Barang), Cetak Label Barcode/QR Aset, serta Kalender & Agenda Sekolah.",
        doc_id="DOC-SIMS-05-SAR",
        target_roles="Petugas Perpustakaan (Pustakawan), Pengelola Sarana & Prasarana (Sarpras), Bagian Logistik & Aset",
        version="1.0"
    )
    
    # ==================== DAFTAR ISI / RINGKASAN ====================
    add_heading_1(doc, "RINGKASAN EKSEKUTIF & DAFTAR ISI PANDUAN", page_break=False)
    add_paragraph(
        doc,
        "Buku Panduan Unit Penunjang Perpustakaan dan Sarana Prasarana (Sarpras) ini disusun untuk mengoptimalkan pengelolaan sumber daya fisik dan fasilitas penunjang pembelajaran di sekolah. Meliputi katalogisasi pustaka digital dan sirkulasi peminjaman berbasis QR barcode, penataan master ruangan gedung, pencatatan aset inventaris dan kondisinya, pencetakan label stiker QR code aset, serta penataan agenda tahunan kalender akademik sekolah."
    )
    
    toc_data = [
        ("BAB 1", "Pendahuluan & Fasilitas Penunjang Pendidikan", "Peran perpustakaan & sarpras, struktur modul, dan navigasi menu"),
        ("BAB 2", "Perpustakaan Digital - Katalog Koleksi Pustaka", "ISBN, rak, kategori, unggah sampul buku, dan kontrol stok"),
        ("BAB 3", "Sirkulasi Peminjaman, Pengembalian & Denda", "Peminjaman cepat via scan QR, pengembalian, dan denda otomatis"),
        ("BAB 4", "Sarana Prasarana - Master Ruangan & Gedung", "Inventarisasi ruang teori, lab, bengkel, kapasitas, dan PJ ruang"),
        ("BAB 5", "Manajemen Inventaris & Aset Barang Sekolah", "Pencatatan aset barang, sumber perolehan, kondisi, dan mutasi"),
        ("BAB 6", "Penerbitan & Pencetakan Label QR Code Aset", "Format label stiker aset, generate barcode/QR, dan SOP penempelan"),
        ("BAB 7", "Kalender Akademik & Agenda Kegiatan Sekolah", "Kalender visual bulanan, penanda libur/ujian, dan publikasi portal"),
        ("BAB 8", "Audit Fisik Aset & Panduan Masalah (FAQ)", "SOP stock opname tahunan, penghapusan aset rusak, dan FAQ"),
    ]
    add_styled_table(
        doc,
        headers=["Bab", "Topik Pembahasan", "Ruang Lingkup Operasional"],
        rows=toc_data,
        col_widths=[Inches(0.9), Inches(2.6), Inches(2.6)]
    )
    
    add_callout(
        doc,
        "IMPORTANT",
        "Akuntabilitas Pengamanan Aset dan Bahan Pustaka",
        "Seluruh aset sarana sekolah dan koleksi buku perpustakaan merupakan barang milik lembaga/negara yang dibiayai oleh dana yayasan, komite, atau bantuan pemerintah (BOS). Pengelola sarpras dan pustakawan diwajibkan melakukan pencatatan tertib, audit berkala, dan penempelan label QR code pada setiap fisik barang."
    )
    
    # ==================== BAB 1 ====================
    add_heading_1(doc, "BAB 1: PENDAHULUAN & FASILITAS PENUNJANG PENDIDIKAN")
    
    add_heading_2(doc, "1.1 Peran Fasilitas Penunjang dalam Kualitas Pembelajaran")
    add_paragraph(
        doc,
        "Fasilitas sekolah yang terpelihara baik dan perpustakaan yang kaya literatur merupakan prasyarat mutlak bagi tercapainya standar mutu pendidikan. SIMS mengintegrasikan dua pilar fasilitas ini:"
    )
    add_bullet(doc, "Mengotomatisasi katalog buku, riwayat pembaca, sirkulasi peminjaman kilat menggunakan pemindai barcode/QR, serta monitoring denda keterlambatan buku secara adil.", "1. Perpustakaan & Literasi Digital: ")
    add_bullet(doc, "Menginventarisasi seluruh gedung, ruang kelas, laboratorium komputer, dan ribuan aset fisik (mebel, laptop, proyektor, AC, alat bengkel) lengkap dengan stiker label barcode penelusuran lokasi.", "2. Sarana & Prasarana (Sarpras): ")
    add_bullet(doc, "Menata agenda kegiatan belajar-mengajar, upacara, ujian semester, serta libur nasional yang tersinkronisasi langsung ke portal publik siswa.", "3. Kalender Akademik Sekolah: ")
    
    add_heading_2(doc, "1.2 Lokasi Menu Navigasi Perpustakaan & Sarpras pada Sidebar")
    add_menu_path(doc, "Sidebar Navigasi ➔ Kelompok Perpustakaan & Sarana Prasarana")
    add_bullet(doc, "Pengelolaan data bibliografi buku, nomor panggil, dan unggah sampul.", "• Katalog Buku & Pustaka (/perpustakaan/buku): ")
    add_bullet(doc, "Pelayanan meja sirkulasi peminjaman, pengembalian, dan denda keterlambatan.", "• Sirkulasi & Scan QR (/perpustakaan/sirkulasi): ")
    add_bullet(doc, "Pendataan denah ruang, laboratorium, kapasitas siswa, dan guru penanggung jawab.", "• Master Ruangan & Lokasi (/sarpras/ruangan): ")
    add_bullet(doc, "Inventaris barang, pelacakan kondisi fisik, riwayat mutasi, dan cetak label barcode.", "• Inventaris & Aset Barang (/sarpras/barang): ")
    add_bullet(doc, "Tampilan kalender visual bulanan dan penjadwalan kegiatan resmi sekolah.", "• Kalender & Agenda Sekolah (/akademik/kalender): ")
    
    # ==================== BAB 2 ====================
    add_heading_1(doc, "BAB 2: PERPUSTAKAAN DIGITAL - KATALOG KOLEKSI PUSTAKA")
    add_menu_path(doc, "Sidebar ➔ Perpustakaan & Literasi ➔ Katalog Buku & Pustaka (/perpustakaan/buku)")
    
    add_paragraph(
        doc,
        "Modul Katalog Buku berfungsi sebagai pangkalan data utama koleksi pustaka sekolah (buku teks pelajaran, buku referensi, fiksi, jurnal ilmiah, dan karya sastra). Pengelola perpustakaan dapat mengelola data buku dengan standar perpustakaan modern."
    )
    
    add_heading_2(doc, "2.1 Kamus Data Pengisian Katalog Buku")
    book_fields = [
        ("Nomor ISBN", "Teks (10/13 Digit)", "International Standard Book Number resmi yang tertera pada sampul buku belakang."),
        ("Judul Buku", "Teks Wajib", "Judul lengkap pustaka beserta anak judul jika ada."),
        ("Nama Pengarang", "Teks Wajib", "Penulis utama atau tim penyusun buku pelajaran."),
        ("Penerbit & Tahun Terbit", "Teks & Angka", "Nama badan penerbit (contoh: Erlangga) dan tahun publikasi (contoh: 2023)."),
        ("Kategori / Klasifikasi", "Dropdown Pilihan", "Pilihan kategori (BUKU TEKS, FIKSI, REFERENSI, TEKNOLOGI, SAINS, SOSIAL)."),
        ("Lokasi Rak Pustaka", "Teks Lokasi", "Nomor lemari dan rak penempatan fisik (contoh: Rak A-02 / DDC 004)."),
        ("Jumlah Stok Koleksi", "Angka Numerik", "Total eksemplar fisik buku yang dimiliki perpustakaan sekolah."),
        ("Gambar Sampul (Cover)", "File Upload / URL Link", "Berkas sampul depan buku (format JPG/PNG) untuk visualisasi katalog."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Formulir", "Tipe Data", "Deskripsi & Petunjuk Pengisian"],
        rows=book_fields,
        col_widths=[Inches(1.8), Inches(1.8), Inches(2.5)]
    )
    
    add_heading_2(doc, "2.2 Langkah Menambahkan Koleksi Buku Baru")
    add_step(doc, 1, "Buka Menu Katalog Buku", "Arahkan ke kelompok Perpustakaan & Literasi pada sidebar, klik Katalog Buku & Pustaka.")
    add_step(doc, 2, "Buka Dialog Tambah Buku", "Klik tombol biru [+ Tambah Koleksi Buku] di bagian atas lembar kerja.")
    add_step(doc, 3, "Input Detail Bibliografi", "Ketikkan Judul, Pengarang, Penerbit, Tahun Terbit, dan tentukan Kategori menggunakan dropdown pencarian SearchableSelect.")
    add_step(doc, 4, "Unggah Berkas Sampul Buku", "Pustakawan dapat memilih opsi: Mengunggah berkas gambar langsung dari komputer (Upload File) atau menempelkan tautan gambar sampul (URL Gambar).")
    add_step(doc, 5, "Simpan Buku", "Klik [Simpan Buku]. Pustaka akan otomatis terdaftar dan langsung mendapatkan Barcode Kode Buku unik dari sistem.")
    
    # ==================== BAB 3 ====================
    add_heading_1(doc, "BAB 3: SIRKULASI PEMINJAMAN, PENGEMBALIAN & DENDA")
    add_menu_path(doc, "Sidebar ➔ Perpustakaan & Literasi ➔ Sirkulasi & Scan QR (/perpustakaan/sirkulasi)")
    
    add_paragraph(
        doc,
        "Meja layanan sirkulasi didesain untuk transaksi cepat dengan bantuan pemindai barcode / kamera QR. Layanan mencakup peminjaman baru, perpanjangan masa pinjam, pengembalian buku, dan penagihan denda keterlambatan."
    )
    
    add_heading_2(doc, "3.1 Prosedur Peminjaman Buku (Check-Out)")
    add_step(doc, 1, "Pencarian Siswa Peminjam", "Pada kolom Anggota / Siswa, ketikkan Nama Siswa atau scan kartu pelajar QR siswa.")
    add_step(doc, 2, "Pilih Buku yang Dipinjam", "Ketikkan judul buku atau scan barcode pada buku fisik menggunakan scanner barcode USB.")
    add_step(doc, 3, "Tetapkan Durasi Pinjam", "Sistem secara default menetapkan masa pinjam selama 7 hari kalender (dapat disesuaikan jika diperlukan).")
    add_step(doc, 4, "Simpan Transaksi Peminjaman", "Klik tombol [Proses Peminjaman]. Status eksemplar buku otomatis berubah menjadi DIPINJAM dan stok buku tersedia berkurang satu.")
    
    add_heading_2(doc, "3.2 Prosedur Pengembalian Buku & Denda Otomatis (Check-In)")
    add_step(doc, 1, "Cari Transaksi Peminjaman Aktif", "Ketikkan nama siswa atau scan barcode buku yang dikembalikan pada tab Pengembalian.")
    add_step(doc, 2, "Pemeriksaan Keterlambatan", "Sistem menghitung selisih hari antara Tanggal Kembali Aktual dengan Tanggal Jatuh Tempo:")
    add_bullet(doc, "Tidak dikenakan denda keterlambatan (Denda = Rp 0).", "• Jika Tepat Waktu: ")
    add_bullet(doc, "Sistem secara otomatis mengalikan jumlah hari telat dengan tarif denda harian (misal: Rp 1.000 / hari per buku).", "• Jika Terlambat: ")
    add_step(doc, 3, "Pemeriksaan Kondisi Fisik Buku", "Pilih kondisi buku: BAIK, RUSAK, atau HILANG (buku hilang dikenakan biaya penggantian buku).")
    add_step(doc, 4, "Konfirmasi Pengembalian", "Klik [Selesaikan Pengembalian]. Buku otomatis kembali ke stok tersedia dan siap dipinjam oleh siswa lain.")
    
    # ==================== BAB 4 ====================
    add_heading_1(doc, "BAB 4: SARANA PRASARANA - MASTER RUANGAN & GEDUNG")
    add_menu_path(doc, "Sidebar ➔ Sarana & Prasarana ➔ Master Ruangan & Lokasi (/sarpras/ruangan)")
    
    add_paragraph(
        doc,
        "Modul Master Ruangan berfungsi mendata seluruh unit tata ruang bangunan fisik sekolah. Data ruangan ini terhubung langsung dengan modul Jadwal Pelajaran (ruang KBM) dan modul Inventaris Aset (lokasi penempatan barang)."
    )
    
    add_heading_2(doc, "4.1 Klasifikasi Kategori Ruangan Sekolah")
    room_types = [
        ("RUANG KELAS TEORI", "Ruang belajar KBM harian siswa kelas 10, 11, dan 12.", "Kapasitas 32 - 36 Siswa"),
        ("LABORATORIUM KOMPUTER", "Ruang praktikum TIK, coding, dan ujian asesmen nasional berbasis komputer (ANBK).", "Kapasitas 36 - 40 PC Komputer"),
        ("BENGKEL / WORKSHOP JURUSAN", "Ruang praktikum kejuruan (Otomotif, Mesin, Elektronika, Tata Boga).", "Kapasitas 30 - 36 Siswa"),
        ("RUANG PERPUSTAKAAN", "Ruang baca, koleksi pustaka, dan area literasi digital mandiri.", "Kapasitas 50 Pengunjung"),
        ("KANTOR GURU & TATA USAHA", "Ruang kerja pendidik, kepala sekolah, dan administrasi tata usaha.", "Kapasitas Staf Pegawai"),
        ("FASILITAS UMUM", "Masjid/Musholla, Aula Pertemuan, Kantin, Unit Kesehatan Sekolah (UKS), Toilet.", "Fasilitas Komunal"),
    ]
    add_styled_table(
        doc,
        headers=["Kategori Ruangan", "Fungsi & Peruntukan", "Standar Kapasitas"],
        rows=room_types,
        col_widths=[Inches(2.2), Inches(2.7), Inches(1.2)]
    )
    
    add_heading_2(doc, "4.2 Prosedur Menambah Data Ruangan Baru")
    add_step(doc, 1, "Buka Menu Master Ruangan", "Klik menu Master Ruangan & Lokasi pada kelompok Sarana & Prasarana.")
    add_step(doc, 2, "Klik Tambah Ruangan", "Tekan tombol biru [+ Tambah Ruangan Baru].")
    add_step(doc, 3, "Isi Parameter Ruang", "Ketikkan Kode Ruang (contoh: LAB-KOMP-01), Nama Ruangan (contoh: Lab Komputer Jaringan 1), Gedung / Lantai, dan Luas Ruang (m2).")
    add_step(doc, 4, "Tetapkan Penanggung Jawab Ruangan", "Gunakan dropdown pencarian SearchableSelect untuk memilih Guru / Pegawai yang ditugaskan sebagai Pengelola Ruangan.")
    add_step(doc, 5, "Simpan Ruangan", "Klik [Simpan Ruangan]. Ruang tersebut langsung tersedia untuk penempatan inventaris aset barang.")
    
    # ==================== BAB 5 ====================
    add_heading_1(doc, "BAB 5: MANAJEMEN INVENTARIS & ASET BARANG SEKOLAH")
    add_menu_path(doc, "Sidebar ➔ Sarana & Prasarana ➔ Inventaris & Aset Barang (/sarpras/barang)")
    
    add_paragraph(
        doc,
        "Modul Inventaris Barang mencatat setiap aset berharga milik sekolah secara mendetail. Pencatatan ini mencakup kode inventaris unik, lokasi penempatan ruangan, sumber perolehan dana, nilai aset, serta audit kondisi fisik barang."
    )
    
    add_heading_2(doc, "5.1 Kategori Kondisi Fisik Barang")
    condition_types = [
        ("BAIK (Optimal)", "Barang berfungsi normal 100%, fisik utuh, dan layak digunakan dalam operasional KBM.", "Warna Hijau"),
        ("RUSAK RINGAN (Butuh Servis)", "Barang mengalami kendala teknis ringan (contoh: kabel longgar, tombol lepas) dan masih dapat diperbaiki.", "Warna Kuning"),
        ("RUSAK BERAT (Afkir)", "Barang rusak permanen, tidak dapat diperbaiki, atau biaya perbaikan melebihi nilai ekonomis barang.", "Warna Merah"),
    ]
    add_styled_table(
        doc,
        headers=["Status Kondisi Fisik", "Kriteria Kelayakan Teknis", "Indikator Visual"],
        rows=condition_types,
        col_widths=[Inches(2.0), Inches(3.0), Inches(1.1)]
    )
    
    add_heading_2(doc, "5.2 Prosedur Pendaftaran Aset Baru")
    add_step(doc, 1, "Buka Menu Inventaris", "Akses menu Inventaris & Aset Barang pada sidebar.")
    add_step(doc, 2, "Buka Formulir Aset", "Klik tombol [+ Tambah Barang Aset].")
    add_step(doc, 3, "Input Spesifikasi Aset", "Ketikkan Nama Barang (contoh: Proyektor Epson EB-X500), Merek/Model, Nomor Seri Pabrik, dan Jumlah Unit.")
    add_step(doc, 4, "Tentukan Sumber Dana & Harga", "Pilih Sumber Perolehan (DANA BOS, DANA YAYASAN, HIBAH PEMERINTAH) dan masukkan Harga Pembelian per unit.")
    add_step(doc, 5, "Pilih Lokasi Ruangan", "Gunakan dropdown berfitur pencarian untuk menempatkan aset pada Ruangan tujuan (contoh: Ruang Teori 11).")
    add_step(doc, 6, "Simpan Aset", "Klik [Simpan Aset]. Sistem akan secara otomatis menerbitkan Kode Inventaris Aset unik.")
    
    # ==================== BAB 6 ====================
    add_heading_1(doc, "BAB 6: PENERBITAN & PENCETAKAN LABEL QR CODE ASET")
    add_menu_path(doc, "Sidebar ➔ Sarana & Prasarana ➔ Inventaris & Aset Barang ➔ Cetak Label")
    
    add_paragraph(
        doc,
        "Untuk memudahkan verifikasi fisik saat audit dan mencegah hilangnya aset sekolah, setiap barang yang terdaftar wajib dipasangi stiker Label Aset resmi yang memuat QR Code dan Barcode unik identitas barang."
    )
    
    add_heading_2(doc, "6.1 Struktur Elemen Label Stiker Aset")
    add_paragraph(doc, "Setiap stiker label aset yang digenerate oleh sistem memuat informasi standar:")
    add_bullet(doc, "Nama resmi lembaga pendidikan dan logo sekolah.", "1. Header Identitas Sekolah: ")
    add_bullet(doc, "Kode alfanumerik unik sistem (contoh: AST-RPL-2024-0012).", "2. Nomor Kode Aset / Barcode: ")
    add_bullet(doc, "Nama barang dan spesifikasi singkat merek/model.", "3. Nama & Jenis Aset: ")
    add_bullet(doc, "Lokasi gedung dan ruangan tempat barang seharusnya berada.", "4. Lokasi Ruangan Resmi: ")
    add_bullet(doc, "Tahun aset dibeli atau dihibahkan ke sekolah.", "5. Tahun Perolehan: ")
    add_bullet(doc, "Dapat dipindai menggunakan kamera smartphone untuk membuka detail riwayat barang secara instan.", "6. QR Code Verifikasi: ")
    
    add_heading_2(doc, "6.2 Langkah Mencetak Label Stiker Aset")
    add_step(doc, 1, "Pilih Aset yang Hendak Diberi Label", "Pada tabel inventaris barang, centang kotak pada barang yang ingin dicetak labelnya atau klik tombol ikon QR code pada baris barang terkait.")
    add_step(doc, 2, "Buka Dialog Label Aset", "Sistem akan membuka modal Pratinjau Label Aset Resmi yang menampilkan tampilan stiker siap cetak.")
    add_step(doc, 3, "Pilih Format Lembar Cetak", "Pilih mode cetak: Single Label (printer label stiker khusus) atau Lembar A4 (mencetak banyak stiker sekaligus di atas kertas stiker tom & jerry).")
    add_step(doc, 4, "Cetak Label", "Klik [Cetak Label / Simpan PDF]. Tempelkan stiker fisik pada permukaan aset barang yang mudah terlihat dan terlindung dari gesekan (contoh: bagian belakang monitor atau sisi meja).")
    
    # ==================== BAB 7 ====================
    add_heading_1(doc, "BAB 7: KALENDER AKADEMIK & AGENDA KEGIATAN SEKOLAH")
    add_menu_path(doc, "Sidebar ➔ Akademik & Kesiswaan ➔ Kalender & Agenda Sekolah (/akademik/kalender)")
    
    add_paragraph(
        doc,
        "Modul Kalender Akademik merupakan sentral penjadwalan kegiatan sekolah sepanjang tahun ajaran. Menampilkan visualisasi grid bulanan yang interaktif dan secara otomatis disinkronkan ke Portal Publik Siswa & Orang Tua."
    )
    
    add_heading_2(doc, "7.1 Tampilan Visual Grid Bulanan & Daftar Agenda")
    add_paragraph(
        doc,
        "Halaman Kalender menyajikan dua mode tampilan yang dapat dialihkan secara fleksibel:"
    )
    add_bullet(doc, "Tampilan kalender meja 7 kolom (Senin s.d. Minggu). Tanggal yang memiliki agenda ditandai dengan kotak warna tematik dan penanda Hari Libur Nasional berwarna merah terang.", "1. Tampilan Grid Bulanan Interaktif: ")
    add_bullet(doc, "Daftar urutan kronologis agenda dari tanggal terdekat lengkap dengan target sasaran audiens (Semua, Dewan Guru, Siswa, atau Wali Murid).", "2. Tampilan Daftar / List Agenda: ")
    
    add_heading_2(doc, "7.2 Langkah Menambahkan Agenda Baru")
    add_step(doc, 1, "Buka Menu Kalender", "Pilih menu Kalender & Agenda Sekolah pada sidebar.")
    add_step(doc, 2, "Klik Tambah Agenda", "Tekan tombol biru [+ Tambah Agenda Baru].")
    add_step(doc, 3, "Isi Rincian Acara", "Ketikkan Judul Agenda (contoh: Penilaian Akhir Semester Ganjil), Tanggal Mulai, dan Tanggal Selesai.")
    add_step(doc, 4, "Tentukan Kategori & Warna Acara", "Pilih Kategori (UJIAN, LIBUR NASIONAL, KEGIATAN, RAPAT DINAS, MPLS) dan pilih warna visual acara.")
    add_step(doc, 5, "Atur Saklar Libur Sekolah", "Aktifkan saklar Apakah Hari Libur? jika pada tanggal tersebut KBM diliburkan.")
    add_step(doc, 6, "Simpan Agenda", "Klik [Simpan Agenda]. Acara akan langsung tampil di kalender dashboard admin dan portal mandiri siswa.")
    
    # ==================== BAB 8 ====================
    add_heading_1(doc, "BAB 8: AUDIT FISIK ASET & PANDUAN MASALAH (FAQ)")
    
    add_heading_2(doc, "8.1 SOP Audit Fisik Berkala (Stock Opname)")
    add_paragraph(
        doc,
        "Setiap akhir semester ganjil dan genap, Petugas Sarpras bersama Kepala Bengkel/Lab wajib melakukan Stock Opname Fisik Aset:"
    )
    add_bullet(doc, "Cetak lembar rekapitulasi inventaris per ruangan dari menu /sarpras/barang.", "Tahap 1: Cetak Daftar Inventaris Ruangan: ")
    add_bullet(doc, "Kunjungi setiap ruangan fisik, hitung jumlah barang aktual, dan cocokkan nomor kode asetnya.", "Tahap 2: Verifikasi Fisik di Lapangan: ")
    add_bullet(doc, "Uji fungsi operasional barang dan perbarui status kondisi barang pada sistem (Baik, Rusak Ringan, Rusak Berat).", "Tahap 3: Uji Kelayakan Fungsi: ")
    add_bullet(doc, "Susun Berita Acara Hasil Audit Sarpras untuk ditandatangani Kepala Sekolah.", "Tahap 4: Pengesahan Berita Acara: ")
    
    add_heading_2(doc, "8.2 Tanya Jawab Kendala Operasional (FAQ)")
    faq_sar = [
        ("Barcode buku perpustakaan tidak terbaca saat di-scan", "Pastikan lensa pemindai barcode bersih dan barcode pada buku tidak lecek/kotor. Pustakawan juga dapat mengetikkan nomor ISBN atau judul buku secara manual."),
        ("Barang inventaris dipindahkan ke ruangan lain (misal dari Ruang 10 ke Lab 2)", "Buka data aset tersebut di menu /sarpras/barang, klik tombol [Edit], ubah pilihan Lokasi Ruangan ke ruangan baru, lalu klik [Perbarui Aset]. Riwayat mutasi akan tercatat otomatis pada audit trail."),
        ("Barang aset rusak total dan tidak bisa digunakan lagi", "Ubah status kondisi barang menjadi RUSAK BERAT. Untuk proses penghapusan aset (afkir), buat Berita Acara Penghapusan Aset dengan persetujuan pimpinan yayasan/kepala sekolah."),
        ("Agenda kalender akademik tidak muncul pada portal mandiri siswa", "Pastikan saklar 'Publikasikan ke Portal Siswa' dalam posisi Aktif (Centang) saat membuat atau mengedit agenda tersebut."),
    ]
    add_styled_table(
        doc,
        headers=["Kendala / Pertanyaan Operasional", "Solusi & Tindakan Petugas"],
        rows=faq_sar,
        col_widths=[Inches(2.5), Inches(3.6)]
    )
    
    add_callout(
        doc,
        "TIP",
        "Pemberdayaan Duta Perpustakaan & Tim Sarpras",
        "Sekolah dapat memberdayakan pengurus OSIS atau siswa piket perpustakaan untuk membantu proses pelayanan sirkulasi buku pada jam istirahat di bawah pengawasan guru pustakawan."
    )
    
    # Save document
    doc.save(output_path)
    print(f"✅ Dokumen berhasil dibuat: {output_path}")

if __name__ == "__main__":
    build_sarpras_manual()

