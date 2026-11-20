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

def build_kesiswaan_manual():
    output_path = os.path.join("docs", "user-manual", "04-panduan-kesiswaan-bk-ppdb.docx")
    
    doc = create_base_document(
        book_series_title="BUKU 4: PANDUAN KESISWAAN, BK & PPDB",
        book_subtitle="Pedoman Operasional Pengelolaan PPDB Online & Seleksi, Buku Kedisiplinan & Poin Pelanggaran/Prestasi (BK), Mutasi Siswa, serta Buku Induk & Penelusuran Alumni.",
        doc_id="DOC-SIMS-04-KSW",
        target_roles="Wakil Kepala Sekolah Bidang Kesiswaan, Panitia PPDB Online, Guru Bimbingan Konseling (BK), Staf Kesiswaan",
        version="1.0"
    )
    
    # ==================== DAFTAR ISI / RINGKASAN ====================
    add_heading_1(doc, "RINGKASAN EKSEKUTIF & DAFTAR ISI PANDUAN", page_break=False)
    add_paragraph(
        doc,
        "Buku Panduan Kesiswaan, Bimbingan Konseling (BK), dan Panitia PPDB ini disusun untuk memandu pengelolaan data peserta didik sepanjang siklus hidup pendidikannya di sekolah. Dimulai dari proses penerimaan peserta didik baru (PPDB online), pembinaan karakter dan disiplin melalui sistem poin terukur, pelayanan mutasi siswa masuk/keluar, hingga pemeliharaan arsip Buku Induk dan penelusuran jejaring alumni (tracer study)."
    )
    
    toc_data = [
        ("BAB 1", "Pendahuluan & Siklus Hidup Peserta Didik", "Tupoksi kesiswaan/BK, siklus siswa di sekolah, dan menu sidebar"),
        ("BAB 2", "Penerimaan Peserta Didik Baru (PPDB Online)", "Verifikasi berkas, seleksi jalur, pengumuman, dan konversi rombel"),
        ("BAB 3", "Kedisiplinan & Buku Poin Bimbingan Konseling", "Katalog poin pelanggaran, poin prestasi, ambang SP, dan konseling"),
        ("BAB 4", "Manajemen Mutasi Siswa Masuk & Keluar", "Prosedur siswa pindahan, mutasi keluar, dan SK pindah resmi"),
        ("BAB 5", "Buku Induk Siswa & Arsip Permanen Lembaga", "Standar data buku induk, verifikasi ijazah, dan pengarsipan"),
        ("BAB 6", "Pelacakan Alumni & Kemitraan (Tracer Study)", "Direktori lulusan, pelacakan kerja/kuliah (BKK), dan akreditasi"),
        ("BAB 7", "Panduan Pemecahan Masalah Kesiswaan (FAQ)", "Solusi kendala PPDB, koreksi poin BK, dan pembatalan mutasi"),
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
        "Objektivitas dan Kerahasiaan Data Konseling",
        "Data catatan kedisiplinan dan riwayat bimbingan konseling peserta didik bersifat konfidensial dan hanya dapat diakses oleh Guru BK, Wali Kelas, dan Pimpinan Kesiswaan. Seluruh pencatatan poin pelanggaran maupun apresiasi prestasi harus didasarkan pada bukti faktual demi menjamin pembinaan karakter yang adil."
    )
    
    # ==================== BAB 1 ====================
    add_heading_1(doc, "BAB 1: PENDAHULUAN & SIKLUS HIDUP PESERTA DIDIK")
    
    add_heading_2(doc, "1.1 Peran Unit Kesiswaan & Bimbingan Konseling (BK)")
    add_paragraph(
        doc,
        "Bidang kesiswaan memiliki tanggung jawab utama dalam memelihara ketertiban, membina karakter, dan mendampingi tumbuh kembang potensi siswa. Dalam SIMS, fungsi kesiswaan didukung oleh tiga pilar:"
    )
    add_bullet(doc, "Mengelola pintu gerbang masuknya siswa baru secara transparan, akuntabel, dan berbasis data digital tanpa berkas fisik yang menumpuk.", "1. Panitia PPDB Online: ")
    add_bullet(doc, "Mencatat pelanggaran tata tertib dan capaian prestasi secara kuantitatif dengan sistem pembobotan poin yang transparan.", "2. Guru Bimbingan Konseling (BK): ")
    add_bullet(doc, "Menata mutasi keluar/masuk siswa, memperbarui nomor induk, serta mengarsipkan data permanen pada Buku Induk dan direktori alumni.", "3. Staf Administrasi Kesiswaan: ")
    
    add_heading_2(doc, "1.2 Siklus Hidup Peserta Didik (Student Lifecycle)")
    lifecycle_rows = [
        ("Fase 1: Calon Siswa", "Mendaftar melalui formulir portal PPDB online dan melengkapi berkas.", "PPDB Online (/kesiswaan/ppdb)"),
        ("Fase 2: Siswa Baru Lolos", "Diverifikasi panitia, dinyatakan lolos seleksi, dan membayar biaya awal.", "Konversi Rombel Otomatis"),
        ("Fase 3: Siswa Aktif", "Menjalani KBM, presensi harian, penilaian akademik, dan pembinaan karakter.", "Buku Kedisiplinan & Presensi"),
        ("Fase 4: Mutasi (Jika Ada)", "Pindah rombel internal, mutasi masuk dari sekolah lain, atau mutasi keluar.", "Mutasi Siswa (/kesiswaan/mutasi)"),
        ("Fase 5: Alumni", "Lulus dari kelas 12, data diarsipkan permanen ke Buku Induk dan Tracer Study.", "Alumni & BKK (/kesiswaan/alumni)"),
    ]
    add_styled_table(
        doc,
        headers=["Fase Kehidupan Siswa", "Aktivitas & Status Operasional", "Modul Sistem Terkait"],
        rows=lifecycle_rows,
        col_widths=[Inches(1.8), Inches(2.6), Inches(1.7)]
    )
    
    add_heading_2(doc, "1.3 Lokasi Menu Navigasi Kesiswaan")
    add_menu_path(doc, "Sidebar ➔ Kesiswaan & PPDB")
    add_bullet(doc, "Verifikasi pendaftar baru, seleksi nilai/jalur, dan penetapan status kelulusan.", "• PPDB Online & Seleksi (/kesiswaan/ppdb): ")
    add_bullet(doc, "Pencatatan poin pelanggaran tata tertib dan poin apresiasi prestasi siswa.", "• Kedisiplinan & Poin BK (/kesiswaan/kedisiplinan): ")
    add_bullet(doc, "Administrasi siswa pindahan masuk, mutasi keluar, dan cetak SK pindah.", "• Mutasi Siswa (/kesiswaan/mutasi): ")
    add_bullet(doc, "Arsip data induk permanen siswa dan direktori penelusuran jejaring alumni.", "• Buku Induk & Alumni (/kesiswaan/alumni): ")
    
    # ==================== BAB 2 ====================
    add_heading_1(doc, "BAB 2: PENERIMAAN PESERTA DIDIK BARU (PPDB ONLINE)")
    add_menu_path(doc, "Sidebar ➔ Kesiswaan & PPDB ➔ PPDB Online & Seleksi (/kesiswaan/ppdb)")
    
    add_paragraph(
        doc,
        "Modul PPDB Online mengintegrasikan formulir pendaftaran publik yang diakses oleh calon siswa dan orang tua dari portal web sekolah (/portal/ppdb) dengan panel verifikasi panitia di dashboard admin."
    )
    
    add_heading_2(doc, "2.1 Tahapan Alur Seleksi PPDB")
    add_paragraph(doc, "Proses seleksi PPDB terdiri dari 5 langkah terpadu:")
    add_step(doc, 1, "Pendaftaran Mandiri oleh Calon Siswa", "Calon peserta didik mengakses portal web sekolah, mengisi identitas diri (NIK, NISN, Asal Sekolah), memilih Program Jurusan yang diminati, serta mengunggah berkas persyaratan (Scan KK, Akta Kelahiran, dan Nilai Rapor SMP).")
    add_step(doc, 2, "Verifikasi Berkas oleh Panitia", "Panitia membuka menu /kesiswaan/ppdb, memeriksa kecocokan berkas digital yang diunggah, dan menetapkan status berkas: TERVERIFIKASI atau BERKAS TIDAK LENGKAP.")
    add_step(doc, 3, "Input Nilai Ujian / Wawancara", "Panitia menginputkan nilai hasil tes kompetensi akademik, tes minat bakat, atau hasil wawancara peminatan jurusan ke dalam sistem.")
    add_step(doc, 4, "Penetapan Kelulusan Seleksi", "Ketua panitia menetapkan status akhir pendaftar: DITERIMA, CADANGAN, atau TIDAK DITERIMA. Hasil pengumuman langsung dapat dilihat oleh calon siswa secara mandiri di portal publik.")
    add_step(doc, 5, "Konversi Otomatis Menjadi Siswa Aktif", "Setelah calon siswa melakukan daftar ulang, panitia menekan tombol [Konversi ke Siswa Aktif]. Sistem secara otomatis mendaftarkan siswa ke tabel Master Siswa Pokok, menerbitkan Nomor Induk Siswa (NIS), dan menempatkannya ke dalam Rombel Kelas 10.")
    
    add_heading_2(doc, "2.2 Kamus Status Seleksi PPDB")
    ppdb_statuses = [
        ("MENUNGGU VERIFIKASI", "Pendaftar baru menyelesaikan formulir online dan menunggu pengecekan berkas oleh panitia.", "Warna Kuning"),
        ("BERKAS LENGKAP", "Berkas administrasi telah diperiksa dan dinyatakan memenuhi syarat mengikuti seleksi.", "Warna Biru"),
        ("DITERIMA (LOLOS)", "Calon peserta didik dinyatakan resmi diterima sebagai siswa baru sekolah.", "Warna Hijau"),
        ("TIDAK DITERIMA", "Pendaftar tidak memenuhi ambang batas passing grade nilai atau kuota jurusan penuh.", "Warna Merah"),
        ("TERKONVERSI", "Siswa telah resmi daftar ulang dan masuk ke database siswa aktif kelas 10.", "Warna Ungu"),
    ]
    add_styled_table(
        doc,
        headers=["Status Pendaftar", "Keterangan Operasional", "Indikator Visual"],
        rows=ppdb_statuses,
        col_widths=[Inches(2.0), Inches(3.0), Inches(1.1)]
    )
    
    # ==================== BAB 3 ====================
    add_heading_1(doc, "BAB 3: KEDISIPLINAN & BUKU POIN BIMBINGAN KONSELING")
    add_menu_path(doc, "Sidebar ➔ Kesiswaan & PPDB ➔ Kedisiplinan & Poin BK (/kesiswaan/kedisiplinan)")
    
    add_paragraph(
        doc,
        "Untuk menciptakan iklim sekolah yang tertib dan kondusif, SIMS menerapkan Sistem Pembobotan Poin Kedisiplinan. Sistem ini mencatat tidak hanya pelanggaran tata tertib, tetapi juga memberikan poin apresiasi positif bagi siswa yang berprestasi."
    )
    
    add_heading_2(doc, "3.1 Klasifikasi Pelanggaran Tata Tertib & Bobot Poin")
    violations = [
        ("Kategori 1: Pelanggaran Ringan", "Terlambat masuk sekolah, atribut seragam tidak lengkap, rambut tidak rapi.", "5 - 10 Poin"),
        ("Kategori 2: Pelanggaran Sedang", "Membolos jam pelajaran, keluar lingkungan sekolah tanpa izin, merokok.", "15 - 25 Poin"),
        ("Kategori 3: Pelanggaran Berat", "Berkelahi / tawuran, membawa senjata tajam, pelecehan, perundungan (bullying).", "50 - 75 Poin"),
        ("Kategori 4: Pelanggaran Kritis", "Penyalahgunaan narkoba, tindak pidana, pencurian aset sekolah.", "100 Poin (Drop Out)"),
    ]
    add_styled_table(
        doc,
        headers=["Tingkat Pelanggaran", "Bentuk Tindakan Pelanggaran", "Bobot Poin Sanksi"],
        rows=violations,
        col_widths=[Inches(2.2), Inches(2.7), Inches(1.2)]
    )
    
    add_heading_2(doc, "3.2 Apresiasi Poin Prestasi Siswa (Poin Positif)")
    add_paragraph(
        doc,
        "Sebagai bentuk keadilan pembinaan, siswa yang mengukir prestasi berhak mendapatkan Poin Prestasi yang berfungsi mengurangi akumulasi poin pelanggaran atau menambah rekam jejak positif di buku rapor:"
    )
    add_bullet(doc, "Mendapatkan apresiasi 15 - 25 Poin Prestasi.", "• Juara Lomba Tingkat Kecamatan / Kota: ")
    add_bullet(doc, "Mendapatkan apresiasi 30 - 50 Poin Prestasi.", "• Juara Lomba Tingkat Provinsi: ")
    add_bullet(doc, "Mendapatkan apresiasi 75 - 100 Poin Prestasi.", "• Juara Lomba Tingkat Nasional / Internasional: ")
    add_bullet(doc, "Mendapatkan apresiasi 10 - 20 Poin Prestasi per semester.", "• Keaktifan Pengurus OSIS / Pramuka / Ekskul: ")
    
    add_heading_2(doc, "3.3 Ambang Batas Surat Peringatan (SP) & Prosedur Konseling")
    add_paragraph(doc, "Sistem secara otomatis memicu notifikasi peringatan saat akumulasi poin pelanggaran siswa mencapai ambang batas:")
    add_bullet(doc, "Teguran lisan dan bimbingan konseling tahap 1 oleh Wali Kelas.", "1. Akumulasi 25 Poin: ")
    add_bullet(doc, "Penerbitan Surat Peringatan 1 (SP-1) dan pemanggilan orang tua ke sekolah oleh Guru BK.", "2. Akumulasi 50 Poin: ")
    add_bullet(doc, "Penerbitan Surat Peringatan 2 (SP-2) disertai skorsing belajar mandiri selama 3 hari.", "3. Akumulasi 75 Poin: ")
    add_bullet(doc, "Penerbitan SP-3 / Sidang Pleno Dewan Guru untuk pengembalian siswa kepada orang tua.", "4. Akumulasi 100 Poin: ")
    
    add_callout(
        doc,
        "TIP",
        "Pencetakan Surat Panggilan Orang Tua",
        "Guru BK dapat mencetak Surat Panggilan Orang Tua resmi ber-kop sekolah secara instan langsung dari halaman detail siswa terkait dengan mengklik tombol [Cetak Surat Panggilan Orang Tua]."
    )
    
    # ==================== BAB 4 ====================
    add_heading_1(doc, "BAB 4: MANAJEMEN MUTASI SISWA MASUK & KELUAR")
    add_menu_path(doc, "Sidebar ➔ Kesiswaan & PPDB ➔ Mutasi Siswa (/kesiswaan/mutasi)")
    
    add_paragraph(
        doc,
        "Administrasi perpindahan siswa harus tercatat secara akurat demi tertib data pada pangkalan data pendidikan (Dapodik). SIMS memfasilitasi pencatatan tiga skenario mutasi:"
    )
    
    add_heading_2(doc, "4.1 Mutasi Masuk (Siswa Pindahan)")
    add_step(doc, 1, "Buka Menu Mutasi", "Pilih menu Mutasi Siswa, lalu klik tab Mutasi Masuk.")
    add_step(doc, 2, "Registrasi Siswa Pindahan", "Klik [+ Tambah Siswa Pindahan]. Masukkan Nomor Surat Rekomendasi Dinas, Nama Sekolah Asal, NISN, serta alasan pindah.")
    add_step(doc, 3, "Penempatan Rombel", "Pilih Rombel Kelas tujuan yang masih memiliki kuota daya tampung ruangan.")
    add_step(doc, 4, "Simpan Mutasi", "Klik [Simpan Data Mutasi]. Siswa akan otomatis tercantum pada daftar siswa kelas tersebut.")
    
    add_heading_2(doc, "4.2 Mutasi Keluar & Penerbitan Surat Keterangan Pindah")
    add_step(doc, 1, "Cari Siswa Terkait", "Pada tab Mutasi Keluar, gunakan pencarian untuk menemukan siswa yang mengajukan pindah.")
    add_step(doc, 2, "Lengkapi Data Kepindahan", "Isi formulir mutasi keluar: Tanggal Keluar, Sekolah Tujuan, Alasan Kepindahan (mengikuti orang tua, jarak rumah, dsb).")
    add_step(doc, 3, "Verifikasi Kewajiban Keuangan & Perpustakaan", "Pastikan siswa tidak memiliki tunggakan SPP dan tidak ada tanggungan buku pinjaman yang belum dikembalikan.")
    add_step(doc, 4, "Cetak SK Mutasi Resmi", "Klik tombol [Cetak Surat Keterangan Pindah]. Dokumen formal ber-kop sekolah siap ditandatangani oleh Kepala Sekolah.")
    
    # ==================== BAB 5 ====================
    add_heading_1(doc, "BAB 5: BUKU INDUK SISWA & ARSIP PERMANEN LEMBAGA")
    add_menu_path(doc, "Sidebar ➔ Kesiswaan & PPDB ➔ Buku Induk & Alumni (/kesiswaan/alumni)")
    
    add_paragraph(
        doc,
        "Buku Induk Siswa adalah dokumen fisik dan digital paling fundamental di sebuah lembaga pendidikan yang wajib disimpan selamanya (arsip permanen statis). Setiap perubahan status siswa dari masuk hingga lulus terekam di modul ini."
    )
    
    add_heading_2(doc, "5.1 Komponen Standar Buku Induk Siswa")
    add_paragraph(doc, "Setiap lembar Buku Induk memuat data komprehensif yang mencakup:")
    add_bullet(doc, "NIS, NISN, NIK, nama lengkap, tempat/tanggal lahir, jenis kelamin, agama, dan pas foto resmi.", "• Identitas Pribadi: ")
    add_bullet(doc, "Nama ayah, nama ibu, pekerjaan, penghasilan bulanan, alamat tempat tinggal, dan kontak aktif.", "• Identitas Orang Tua / Wali: ")
    add_bullet(doc, "Nama sekolah asal, nomor ijazah SMP/MTs, dan tahun kelulusan jenjang sebelumnya.", "• Riwayat Pendidikan Sebelumnya: ")
    add_bullet(doc, "Rangkuman nilai akhir seluruh semester (semester 1 s.d. 6) dan nomor seri ijazah kelulusan.", "• Lembar Hasil Belajar: ")
    
    add_heading_2(doc, "5.2 Prosedur Pencarian & Verifikasi Berkas Ijazah")
    add_paragraph(
        doc,
        "Bila terdapat kebutuhan verifikasi ijazah oleh instansi kepolisian, TNI, perguruan tinggi, atau perusahaan tempat alumni melamar kerja, staf kesiswaan dapat mengetikkan Nomor Seri Ijazah atau NISN pada kolom pencarian Buku Induk untuk menampilkan salinan arsip data siswa dalam hitungan detik."
    )
    
    # ==================== BAB 6 ====================
    add_heading_1(doc, "BAB 6: PELACAKAN ALUMNI & KEMITRAAN (TRACER STUDY)")
    add_menu_path(doc, "Sidebar ➔ Kesiswaan & PPDB ➔ Buku Induk & Alumni (/kesiswaan/alumni)")
    
    add_paragraph(
        doc,
        "Penelusuran tamatan (Tracer Study) merupakan instrumen vital bagi sekolah (terutama jenjang SMK/SMA) untuk mengevaluasi keterserapan lulusan di dunia usaha, industri, dan perguruan tinggi (Bursa Kerja Khusus - BKK)."
    )
    
    add_heading_2(doc, "6.1 Tiga Pilar Status Keterserapan Alumni (BMW)")
    alumni_types = [
        ("B (Bekerja)", "Alumni yang telah diterima bekerja di perusahaan swasta, BUMN, institusi pemerintah, atau mitra industri sekolah.", "Warna Hijau"),
        ("M (Melanjutkan Pendidikan)", "Alumni yang melanjutkan studi ke jenjang perguruan tinggi negeri (PTN) maupun swasta (PTS).", "Warna Biru"),
        ("W (Wirausaha)", "Alumni yang merintis usaha mandiri, startup, atau usaha perdagangan keluarga secara produktif.", "Warna Oranye"),
        ("Masa Transisi / Mencari Kerja", "Alumni yang sedang dalam proses melamar kerja atau menunggu masa perkuliahan.", "Warna Abu-Abu"),
    ]
    add_styled_table(
        doc,
        headers=["Kategori Status", "Deskripsi Keterserapan Lulusan", "Indikator Visual"],
        rows=alumni_types,
        col_widths=[Inches(2.0), Inches(3.0), Inches(1.1)]
    )
    
    add_heading_2(doc, "6.2 Pemanfaatan Data Alumni untuk Akreditasi")
    add_paragraph(
        doc,
        "Data rekapitulasi persentase kebekerjaan alumni dapat diekspor langsung ke berkas spreadsheet (Excel/CSV) untuk memenuhi instrumen borang Akreditasi Sekolah (BAN-S/M) dan laporan evaluasi penjaminan mutu dinas pendidikan."
    )
    
    # ==================== BAB 7 ====================
    add_heading_1(doc, "BAB 7: PANDUAN PEMECAHAN MASALAH KESISWAAN (FAQ)")
    
    add_heading_2(doc, "7.1 Tanya Jawab Kendala Operasional Kesiswaan & BK")
    faq_ksw = [
        ("Calon peserta didik mengeluh berkas persyaratan gagal diunggah saat PPDB", "Pastikan berkas berformat gambar (JPG/PNG) atau PDF dengan ukuran maksimal 2 MB per berkas. Panitia juga dapat membantu mengunggah berkas secara langsung dari panel admin."),
        ("Salah mencatatkan nama siswa saat menginput poin pelanggaran kedisiplinan", "Pencatatan poin yang salah dapat dibatalkan atau dikoreksi oleh Guru BK berwenang melalui menu riwayat pelanggaran dengan mencantumkan alasan koreksi pada log audit."),
        ("Siswa yang sudah diproses mutasi keluar ternyata batal pindah", "Administrator IT atau Kesiswaan dapat mengubah status siswa kembali menjadi Aktif dan mengembalikan siswa ke rombel kelas asalnya."),
        ("Siswa alumni belum terdata pada direktori penelusuran tamatan", "Pastikan proses Kelulusan pada menu Kenaikan Kelas & Kelulusan telah dieksekusi dengan status LULUS agar data siswa otomatis terpromosikan ke direktori alumni."),
    ]
    add_styled_table(
        doc,
        headers=["Kendala / Pertanyaan Kesiswaan", "Solusi & Panduan Penanganan"],
        rows=faq_ksw,
        col_widths=[Inches(2.5), Inches(3.6)]
    )
    
    add_callout(
        doc,
        "TIP",
        "Koordinasi Kesiswaan dan Bimbingan Konseling",
        "Lakukan rapat koordinasi bulanan antara Pimpinan Kesiswaan, Guru BK, dan seluruh Wali Kelas untuk mengevaluasi data siswa yang mendekati ambang batas SP-1 atau membutuhkan pendampingan khusus."
    )
    
    # Save document
    doc.save(output_path)
    print(f"✅ Dokumen berhasil dibuat: {output_path}")

if __name__ == "__main__":
    build_kesiswaan_manual()

