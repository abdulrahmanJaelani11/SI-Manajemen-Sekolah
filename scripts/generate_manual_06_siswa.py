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

def build_siswa_manual():
    output_path = os.path.join("docs", "user-manual", "06-panduan-portal-siswa-wali.docx")
    
    doc = create_base_document(
        book_series_title="BUKU 6: PANDUAN PORTAL SISWA & WALI MURID",
        book_subtitle="Pedoman Akses Mandiri Layanan Sekolah Terpadu: Pengecekan Hasil Belajar & Rapor, Transparansi Pembayaran & Tagihan SPP, Rekapitulasi Presensi Kehadiran, Kalender Akademik, serta Informasi Pengumuman Resmi Sekolah.",
        doc_id="DOC-SIMS-06-SIS",
        target_roles="Peserta Didik (Siswa), Orang Tua / Wali Murid",
        version="1.0"
    )
    
    # ==================== DAFTAR ISI / RINGKASAN ====================
    add_heading_1(doc, "RINGKASAN EKSEKUTIF & DAFTAR ISI PANDUAN", page_break=False)
    add_paragraph(
        doc,
        "Buku Panduan Portal Siswa dan Wali Murid ini disusun untuk memberikan kemudahan bagi peserta didik dan para orang tua dalam memantau perkembangan studi, presensi harian, serta transparansi administrasi keuangan sekolah secara mandiri dari mana saja dan kapan saja melalui perangkat ponsel pintar (smartphone), tablet, maupun laptop."
    )
    
    toc_data = [
        ("BAB 1", "Pendahuluan & Akses Masuk Portal Siswa", "Transparansi layanan, login via NISN, dan pengamanan akun"),
        ("BAB 2", "Menjelajahi Informasi Publik & Berita Sekolah", "Landing page sekolah, agenda berita, fasilitas, dan kontak"),
        ("BAB 3", "Layanan Akademik, Jadwal & Hasil Belajar Rapor", "Jadwal KBM, pemantauan nilai harian, dan unduh rapor digital"),
        ("BAB 4", "Transparansi Keuangan, Riwayat & Tagihan SPP", "Cek status SPP, rincian biaya non-SPP, cicilan, dan kwitansi"),
        ("BAB 5", "Rekapitulasi Kehadiran & Presensi Harian Siswa", "Log kehadiran kelas, keterlambatan gerbang, dan persentase"),
        ("BAB 6", "Kalender Akademik & Agenda Kegiatan Sekolah", "Jadwal libur nasional, ujian semester, dan kegiatan kesiswaan"),
        ("BAB 7", "Panduan Pendaftaran Siswa Baru (PPDB Online)", "Alur pendaftaran mandiri calon siswa dan cek kelulusan"),
        ("BAB 8", "Pusat Bantuan & Layanan Tanya Jawab (FAQ)", "Lupa password, klaim pembayaran, izin sakit, dan kontak sekolah"),
    ]
    add_styled_table(
        doc,
        headers=["Bab", "Topik Pembahasan", "Ruang Lingkup Operasional"],
        rows=toc_data,
        col_widths=[Inches(0.9), Inches(2.6), Inches(2.6)]
    )
    
    add_callout(
        doc,
        "NOTE",
        "Kemitraan Positif Sekolah dan Orang Tua",
        "Portal mandiri ini dihadirkan sebagai wujud komitmen sekolah dalam membangun komunikasi terbuka dengan orang tua murid. Dengan memantau nilai akademik dan presensi secara berkala, orang tua dapat mendampingi putra-putrinya secara optimal demi masa depan yang gemilang."
    )
    
    # ==================== BAB 1 ====================
    add_heading_1(doc, "BAB 1: PENDAHULUAN & AKSES MASUK PORTAL SISWA")
    
    add_heading_2(doc, "1.1 Manfaat Portal Mandiri bagi Siswa & Orang Tua")
    add_paragraph(
        doc,
        "Di era transformasi digital, SIMS menyediakan Portal Siswa dan Wali Murid terpadu yang dapat diakses selama 24 jam sehari dengan berbagai kemudahan layanan:"
    )
    add_bullet(doc, "Orang tua dapat melihat status pelunasan SPP bulanan dan sisa cicilan uang gedung secara real-time tanpa harus datang antre di loket tata usaha.", "1. Transparansi Keuangan Terbuka: ")
    add_bullet(doc, "Nilai tugas harian, ujian tengah semester, dan rapor akhir semester dapat dipantau langsung setelah guru menginput nilai.", "2. Pemantauan Capaian Akademik: ")
    add_bullet(doc, "Orang tua dapat mengetahui catatan kehadiran putra-putrinya di sekolah secara objektif.", "3. Kepastian Kehadiran di Kelas: ")
    add_bullet(doc, "Agenda ujian, pembagian rapor, dan libur sekolah tersaji rapi dalam kalender terpadu.", "4. Akses Kalender Resmi: ")
    
    add_heading_2(doc, "1.2 Persyaratan Perangkat & Akses Jaringan")
    add_paragraph(
        doc,
        "Portal siswa didesain dengan konsep Mobile-Friendly Responsif sehingga nyaman digunakan pada berbagai ukuran layar:"
    )
    add_bullet(doc, "Gunakan aplikasi peramban Google Chrome, Safari, atau Samsung Internet.", "• Smartphone (Android / iPhone): ")
    add_bullet(doc, "Mendukung resolusi tablet untuk membaca lembar rapor secara leluasa.", "• Tablet / iPad: ")
    add_bullet(doc, "Sangat ideal untuk mencetak atau mengunduh berkas laporan dalam format PDF.", "• Komputer PC / Laptop: ")
    
    add_heading_2(doc, "1.3 Prosedur Masuk (Login) Siswa & Orang Tua")
    add_menu_path(doc, "Portal Web Sekolah ➔ Masuk Siswa (/portal/login-siswa)")
    add_step(doc, 1, "Kunjungi Halaman Login Siswa", "Buka peramban di ponsel Anda, ketikkan alamat portal sekolah lalu klik menu [Portal Siswa] atau akses langsung tautan /portal/login-siswa.")
    add_step(doc, 2, "Masukkan Nomor Induk Siswa Nasional (NISN)", "Ketikkan 10 digit NISN resmi siswa yang tertera pada kartu pelajar atau ijazah jenjang sebelumnya.")
    add_step(doc, 3, "Masukkan Kata Sandi / Tanggal Lahir", "Ketikkan kata sandi akun siswa (format bawaan: tanggal lahir siswa YYYY-MM-DD atau password yang diberikan pihak sekolah).")
    add_step(doc, 4, "Klik Masuk", "Tekan tombol [Masuk ke Portal]. Anda akan langsung diarahkan ke Dashboard Mandiri Siswa.")
    
    # ==================== BAB 2 ====================
    add_heading_1(doc, "BAB 2: MENJELAJAHI INFORMASI PUBLIK & BERITA SEKOLAH")
    add_menu_path(doc, "Portal Utama Sekolah (/portal)")
    
    add_paragraph(
        doc,
        "Selain area akun siswa, masyarakat umum, siswa, dan orang tua dapat mengakses informasi profil sekolah terkini pada Landing Page Portal Publik."
    )
    
    add_heading_2(doc, "2.1 Fitur Informasi pada Portal Publik")
    portal_sections = [
        ("Hero Banner Utama", "Menampilkan foto kegiatan unggulan, moto sekolah, dan sambutan Kepala Sekolah.", "Tampilan Utama"),
        ("Pilar Keunggulan Sekolah", "Informasi akreditasi A, fasilitas laboratorium mutakhir, dan prestasi siswa.", "Profil Lembaga"),
        ("Publikasi Berita & Artikel", "Warta seputar lomba, karya inovasi siswa, kunjungan industri, dan pengumuman dinas.", "Informasi Terkini"),
        ("Sarana & Prasarana", "Galeri foto ruang teori, perpustakaan digital, sarana olahraga, dan bengkel praktik.", "Fasilitas Kampus"),
        ("Dokumentasi Kegiatan", "Arsip foto upacara bendera, perkemahan pramuka, wisuda, dan pentas seni.", "Galeri Dokumentasi"),
        ("Direktori Guru & Pendidik", "Profil singkat dewan guru pengajar beserta mata pelajaran yang diampu.", "Tenaga Pengajar"),
    ]
    add_styled_table(
        doc,
        headers=["Bagian Halaman", "Uraian Konten Informasi", "Kategori Layanan"],
        rows=portal_sections,
        col_widths=[Inches(2.0), Inches(3.1), Inches(1.2)]
    )
    
    # ==================== BAB 3 ====================
    add_heading_1(doc, "BAB 3: LAYANAN AKADEMIK, JADWAL & HASIL BELAJAR RAPOR")
    add_menu_path(doc, "Dashboard Siswa ➔ Tab Akademik & Nilai (/portal/siswa)")
    
    add_paragraph(
        doc,
        "Pada menu Akademik, siswa dan orang tua dapat memantau seluruh proses kegiatan belajar-mengajar mulai dari jadwal harian hingga rekapitulasi nilai akhir semester."
    )
    
    add_heading_2(doc, "3.1 Memeriksa Jadwal Pelajaran Kelas Harian")
    add_paragraph(
        doc,
        "Siswa dapat melihat susunan mata pelajaran hari Senin sampai Jumat, lengkap dengan alokasi jam pelajaran, nama guru pengajar, dan ruang kelas atau laboratorium tempat belajar, sehingga siswa dapat mempersiapkan buku dan perlengkapan sejak malam hari."
    )
    
    add_heading_2(doc, "3.2 Pemantauan Nilai Akademik & Rapor Digital")
    add_step(doc, 1, "Pilih Semester Pembelajaran", "Pilih Semester yang ingin ditinjau (Ganjil atau Genap) pada tab Akademik.")
    add_step(doc, 2, "Tinjau Tabel Capaian Nilai", "Sistem menampilkan daftar seluruh mata pelajaran beserta KKM, Nilai Tugas, Nilai Penilaian Harian (PH), PTS, PAS, dan Nilai Akhir (NA).")
    add_step(doc, 3, "Periksa Keterangan Ketuntasan", "Mata pelajaran yang telah tuntas di atas KKM ditandai dengan badge hijau Tuntas, sementara nilai yang perlu perbaikan ditandai dengan badge Remedial.")
    add_step(doc, 4, "Unduh Rekap Hasil Belajar", "Klik tombol [Unduh Salinan Rapor (PDF)] untuk menyimpan berkas rapor digital di perangkat Anda.")
    
    # ==================== BAB 4 ====================
    add_heading_1(doc, "BAB 4: TRANSPARANSI KEUANGAN, RIWAYAT & TAGIHAN SPP")
    add_menu_path(doc, "Dashboard Siswa ➔ Tab Keuangan & SPP (/portal/siswa)")
    
    add_paragraph(
        doc,
        "Fitur transparansi keuangan memberikan kepastian penuh bagi orang tua mengenai kewajiban pembayaran sekolah dan riwayat transaksi yang sah."
    )
    
    add_heading_2(doc, "4.1 Status Pembayaran SPP Bulanan (12 Bulan)")
    add_paragraph(
        doc,
        "Tabel SPP menampilkan status 12 bulan dalam tahun ajaran aktif (Juli s.d. Juni):"
    )
    add_bullet(doc, "Bulan tersebut telah resmi dibayarkan. Tercantum tanggal bayar, nomor kwitansi sah, dan nama kasir penerima.", "• Status LUNAS (Badge Hijau): ")
    add_bullet(doc, "Kewajiban SPP bulan terkait belum disetorkan ke loket sekolah.", "• Status BELUM LUNAS (Badge Kuning/Oranye): ")
    
    add_heading_2(doc, "4.2 Pengecekan Tagihan Non-SPP & Riwayat Cicilan")
    add_paragraph(
        doc,
        "Untuk biaya uang gedung (DSP), seragam, atau ujian, sistem menyajikan kartu transparansi saldo:"
    )
    add_bullet(doc, "Menampilkan total kewajiban awal yang ditetapkan sekolah.", "1. Total Tagihan Awal: ")
    add_bullet(doc, "Menampilkan akumulasi seluruh cicilan yang telah disetor orang tua.", "2. Total Dana yang Telah Dibayar: ")
    add_bullet(doc, "Menampilkan sisa kewajiban piutang yang masih harus diselesaikan.", "3. Sisa Saldo Tagihan: ")
    add_bullet(doc, "Daftar tanggal dan nomor tanda terima setiap setoran cicilan dilakukan.", "4. Riwayat Angsuran: ")
    
    add_callout(
        doc,
        "TIP",
        "Penyimpanan Bukti Kwitansi Digital",
        "Orang tua dapat mengklik tombol [Lihat Kwitansi] pada baris riwayat pembayaran untuk membuka tanda terima resmi dan menyimpannya sebagai arsip bukti pembayaran yang sah."
    )
    
    # ==================== BAB 5 ====================
    add_heading_1(doc, "BAB 5: REKAPITULASI KEHADIRAN & PRESENSI HARIAN SISWA")
    add_menu_path(doc, "Dashboard Siswa ➔ Tab Presensi & Kehadiran (/portal/siswa)")
    
    add_paragraph(
        doc,
        "Tingkat kehadiran merupakan faktor krusial dalam kriteria kenaikan kelas. Portal siswa menyajikan rekapitulasi kehadiran secara transparan:"
    )
    
    add_heading_2(doc, "5.1 Ringkasan Kartu Metrik Kehadiran")
    absensi_metrics = [
        ("Total Hari Hadir (H)", "Jumlah hari siswa hadir penuh mengikuti kegiatan belajar di sekolah.", "Badge Hijau"),
        ("Izin Terkonfirmasi (I)", "Jumlah hari tidak hadir karena keperluan keluarga yang sah dan terkonfirmasi.", "Badge Biru"),
        ("Sakit Resmi (S)", "Jumlah hari tidak hadir dengan melampirkan surat dokter / orang tua.", "Badge Kuning"),
        ("Alpa / Tanpa Kabar (A)", "Jumlah hari ketidakhadiran tanpa pemberitahuan resmi yang sah.", "Badge Merah"),
        ("Persentase Kehadiran (%)", "Kalkulasi persentase kehadiran terhadap total hari efektif KBM (Ambang batas naik kelas: 85%).", "Persentase Kumulatif"),
    ]
    add_styled_table(
        doc,
        headers=["Indikator Kehadiran", "Penjelasan Tolok Ukur", "Keterangan"],
        rows=absensi_metrics,
        col_widths=[Inches(2.2), Inches(3.0), Inches(1.1)]
    )
    
    # ==================== BAB 6 ====================
    add_heading_1(doc, "BAB 6: KALENDER AKADEMIK & AGENDA KEGIATAN SEKOLAH")
    add_menu_path(doc, "Dashboard Siswa ➔ Tab Kalender Akademik (/portal/siswa)")
    
    add_paragraph(
        doc,
        "Untuk membantu siswa dan orang tua merencanakan agenda belajar dan liburan keluarga, sekolah mempublikasikan Kalender Akademik Resmi di portal mandiri."
    )
    
    add_heading_2(doc, "6.1 Agenda Penting yang Dapat Dipantau")
    add_bullet(doc, "Jadwal Penilaian Tengah Semester (PTS) dan Penilaian Akhir Semester (PAS).", "• Jadwal Ujian Sekolah: ")
    add_bullet(doc, "Tanggal resmi pembagian buku rapor semester kepada orang tua siswa.", "• Pembagian Rapor Semester: ")
    add_bullet(doc, "Tanggal libur hari besar keagamaan dan libur pergantian semester.", "• Libur Nasional & Libur Sekolah: ")
    add_bullet(doc, "Jadwal Masa Pengenalan Lingkungan Sekolah (MPLS), classmeeting, dan wisuda kelulusan.", "• Kegiatan Kesiswaan: ")
    
    # ==================== BAB 7 ====================
    add_heading_1(doc, "BAB 7: PANDUAN PENDAFTARAN SISWA BARU (PPDB ONLINE)")
    add_menu_path(doc, "Portal Utama Sekolah ➔ Menu PPDB Online (/portal/ppdb)")
    
    add_paragraph(
        doc,
        "Bagi calon siswa baru yang ingin mendaftar ke sekolah, portal menyediakan formulir pendaftaran digital yang mudah dan cepat."
    )
    
    add_heading_2(doc, "7.1 Langkah Mendaftar Mandiri PPDB")
    add_step(doc, 1, "Buka Halaman PPDB Online", "Akses menu PPDB Online pada portal sekolah, lalu klik tombol [Daftar Siswa Baru].")
    add_step(doc, 2, "Isi Identitas Pendaftar", "Lengkapi formulir online: NIK, NISN, Nama Lengkap, Tempat/Tanggal Lahir, Alamat, Asal Sekolah (SMP/MTs), dan Nama Orang Tua.")
    add_step(doc, 3, "Pilih Jurusan / Peminatan", "Pilih Program Jurusan Pilihan 1 dan Pilihan 2 sesuai minat bakat calon siswa.")
    add_step(doc, 4, "Unggah Berkas Persyaratan", "Unggah foto/scan Kartu Keluarga (KK), Akta Kelahiran, dan Nilai Rapor SMP (format JPG/PDF, ukuran maksimal 2 MB per berkas).")
    add_step(doc, 5, "Dapatkan Nomor Pendaftaran", "Setelah klik [Kirim Pendaftaran], sistem akan menerbitkan Tanda Bukti Pendaftaran online yang memuat Nomor Registrasi.")
    add_step(doc, 6, "Pantau Pengumuman Kelulusan", "Calon siswa dapat memeriksa status kelulusan secara berkala pada tab Cek Status PPDB menggunakan Nomor Pendaftaran dan NISN.")
    
    # ==================== BAB 8 ====================
    add_heading_1(doc, "BAB 8: PUSAT BANTUAN & LAYANAN TANYA JAWAB (FAQ)")
    
    add_heading_2(doc, "8.1 Pertanyaan Sering Diajukan (FAQ) Siswa & Orang Tua")
    faq_siswa = [
        ("Lupa NISN atau kata sandi untuk login ke portal siswa", "Silakan menghubungi Wali Kelas atau staf Tata Usaha Sekolah pada jam kerja untuk mendapatkan bantuan verifikasi dan reset kata sandi."),
        ("Sudah membayar SPP via kasir namun status di portal belum berubah lunas", "Muat ulang (refresh) halaman peramban Anda. Jika masih belum lunas, foto bukti kwitansi fisik Anda dan konfirmasi ke bagian Bendahara Sekolah."),
        ("Siswa berhalangan hadir ke sekolah karena sakit", "Orang tua wajib mengirimkan surat izin atau surat keterangan dokter kepada Wali Kelas melalui kontak resmi agar status absensi dicatat sebagai Sakit (bukan Alpa)."),
        ("Tampilan portal terpotong saat dibuka di smartphone", "Pastikan browser Anda tidak berada dalam mode 'Desktop Site'. Desain portal telah dioptimasi otomatis untuk tampilan mobile browser."),
    ]
    add_styled_table(
        doc,
        headers=["Pertanyaan / Kendala", "Solusi & Panduan bagi Orang Tua"],
        rows=faq_siswa,
        col_widths=[Inches(2.5), Inches(3.6)]
    )
    
    add_callout(
        doc,
        "TIP",
        "Saluran Layanan dan Kontak Pengaduan",
        "Untuk konsultasi akademik dan perkembangan belajar putra-putri Anda, silakan hubungi Wali Kelas masing-masing. Untuk urusan administrasi dan administrasi keuangan, silakan hubungi Loket Tata Usaha Sekolah pada jam kerja dinas."
    )
    
    # Save document
    doc.save(output_path)
    print(f"✅ Dokumen berhasil dibuat: {output_path}")

if __name__ == "__main__":
    build_siswa_manual()

