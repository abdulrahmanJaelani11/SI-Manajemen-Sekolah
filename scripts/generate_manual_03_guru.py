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

def build_guru_manual():
    output_path = os.path.join("docs", "user-manual", "03-panduan-guru-wali-kelas.docx")
    
    doc = create_base_document(
        book_series_title="BUKU 3: PANDUAN GURU & WALI KELAS",
        book_subtitle="Pedoman Operasional Pendidik dalam Pengelolaan Jadwal Mengajar, Presensi Harian Kelas, Penginputan Nilai (PH, PTS, PAS), Rekapitulasi Sikap & Ekstrakurikuler, serta Pencetakan E-Rapor Resmi.",
        doc_id="DOC-SIMS-03-GUR",
        target_roles="Dewan Guru Mata Pelajaran, Wali Kelas, Koordinator Kurikulum",
        version="1.0"
    )
    
    # ==================== DAFTAR ISI / RINGKASAN ====================
    add_heading_1(doc, "RINGKASAN EKSEKUTIF & DAFTAR ISI PANDUAN", page_break=False)
    add_paragraph(
        doc,
        "Buku Panduan Guru dan Wali Kelas ini dirancang secara khusus untuk memfasilitasi pendidik dalam melaksanakan tugas pokok dan fungsinya (tupoksi) secara digital. Mulai dari memeriksa jadwal mengajar mingguan, mencatat presensi kehadiran siswa di kelas, menginput nilai harian dan ujian, menyusun catatan perkembangan karakter, hingga mencetak buku laporan hasil belajar (E-Rapor) resmi yang siap diserahkan kepada orang tua/wali murid."
    )
    
    toc_data = [
        ("BAB 1", "Pendahuluan & Hak Akses Akun Pendidik", "Peran guru vs wali kelas, alur login, dan navigasi dashboard"),
        ("BAB 2", "Jadwal Mengajar & Alokasi Jam Tatap Muka", "Pengecekan jadwal mingguan, ruang kelas, dan jadwal piket"),
        ("BAB 3", "Presensi Harian Siswa di Ruang Kelas", "Input kehadiran (H/S/I/A), rekap kehadiran, dan sinkronisasi QR"),
        ("BAB 4", "Pengelolaan & Penginputan Nilai Siswa", "Input nilai Tugas, PH, PTS, PAS, pembobotan nilai, dan batas KKM"),
        ("BAB 5", "Pengelolaan Rapor Khusus Wali Kelas", "Input sikap karakter, ekstrakurikuler, catatan wali, dan cetak E-Rapor"),
        ("BAB 6", "Kenaikan Kelas & Kelulusan Siswa", "Evaluasi ketuntasan, penetapan status kenaikan, dan promosi rombel"),
        ("BAB 7", "Presensi Mandiri Pendidik & Tenaga Pengajar", "Absensi datang/pulang harian guru dan rekap kehadiran bulanan"),
        ("BAB 8", "Panduan Pemecahan Masalah Guru (FAQ)", "Solusi koreksi nilai, siswa belum masuk daftar, dan tips cetak rapor"),
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
        "Ketetapan Integritas Penginputan Nilai",
        "Nilai yang diinputkan ke dalam sistem merupakan dokumen resmi hasil belajar peserta didik yang memiliki implikasi hukum kependidikan. Pastikan seluruh nilai Tugas, PH, PTS, dan PAS telah diverifikasi keabsahannya sebelum melakukan penguncian nilai semester."
    )
    
    # ==================== BAB 1 ====================
    add_heading_1(doc, "BAB 1: PENDAHULUAN & HAK AKSES AKUN PENDIDIK")
    
    add_heading_2(doc, "1.1 Pembagian Peran: Guru Mata Pelajaran vs Wali Kelas")
    add_paragraph(
        doc,
        "Sistem Informasi Manajemen Sekolah Terpadu (SIMS) membedakan wewenang pendidik ke dalam dua tingkatan hak akses operasional:"
    )
    add_bullet(doc, "Berhak mengakses jadwal mengajar pribadinya, mencatat presensi kelas pada jam pelajarannya, serta menginput nilai mata pelajaran yang diampunya untuk seluruh rombel kelas yang ditugaskan.", "1. Guru Mata Pelajaran (Role: GURU): ")
    add_bullet(doc, "Memiliki seluruh hak akses Guru Mapel, ditambah wewenang kepengurusan kelas binaannya: memantau presensi kumulatif kelas, menginput catatan sikap/karakter, mengisi catatan prestasi ekstrakurikuler, menuliskan pesan wali kelas, memproses kenaikan kelas, dan mencetak dokumen E-Rapor resmi.", "2. Wali Kelas (Role: WALI_KELAS): ")
    
    add_heading_2(doc, "1.2 Prosedur Masuk (Login) Akun Pendidik")
    add_menu_path(doc, "Halaman Login Sistem (/auth/login)")
    add_step(
        doc,
        1,
        "Akses URL Sistem",
        "Buka peramban web (Google Chrome atau Microsoft Edge) pada laptop atau smartphone Anda, lalu akses alamat sistem sekolah."
    )
    add_step(
        doc,
        2,
        "Masukkan Kredensial Pendidik",
        "Ketikkan Username atau Email resmi Anda dan Password yang telah diberikan oleh Administrator IT Sekolah.",
        [
            "Username biasanya berupa NIP atau nama.guru (contoh: ahmad.dahlan)",
            "Ganti password sementara Anda pada menu profil di sudut kanan atas demi keamanan"
        ]
    )
    add_step(
        doc,
        3,
        "Masuk ke Dashboard Guru",
        "Klik tombol [Masuk ke Sistem]. Sistem akan menampilkan beranda dengan ringkasan jadwal mengajar hari ini dan kalender kegiatan sekolah."
    )
    
    # ==================== BAB 2 ====================
    add_heading_1(doc, "BAB 2: JADWAL MENGAJAR & ALOKASI JAM TATAP MUKA")
    add_menu_path(doc, "Sidebar ➔ Akademik & Kesiswaan ➔ Jadwal Pelajaran (/akademik/jadwal)")
    
    add_paragraph(
        doc,
        "Melalui modul Jadwal Pelajaran, setiap pendidik dapat memantau secara pasti alokasi waktu mengajar, rombel binaan, mata pelajaran, serta ruangan pembelajaran tempat berlangsungnya kegiatan tatap muka."
    )
    
    add_heading_2(doc, "2.1 Tampilan Matriks Jadwal Mengajar Mingguan")
    add_paragraph(
        doc,
        "Pada halaman Jadwal Pelajaran, disajikan tabel kalender mingguan dari hari Senin hingga Jumat/Sabtu. Setiap kotak jadwal memuat informasi penting:"
    )
    add_bullet(doc, "Rentang jam tatap muka (contoh: 07.15 - 08.45 WIB / Jam ke 1-2).", "• Jam Pelajaran: ")
    add_bullet(doc, "Mata pelajaran yang diajarkan (contoh: Pemrograman Web & Perangkat Bergerak).", "• Mata Pelajaran: ")
    add_bullet(doc, "Nama rombongan belajar sasaran (contoh: XI RPL 1).", "• Kelas / Rombel: ")
    add_bullet(doc, "Lokasi fisik ruangan (contoh: Lab Komputer 2 atau Ruang Teori 10).", "• Ruangan: ")
    
    add_heading_2(doc, "2.2 Langkah Memeriksa & Menyaring Jadwal Pribadi")
    add_step(doc, 1, "Buka Menu Jadwal Pelajaran", "Klik Akademik & Kesiswaan pada sidebar, lalu pilih Jadwal Pelajaran.")
    add_step(doc, 2, "Gunakan Filter Guru", "Pada dropdown Guru Pengajar, ketikkan nama Anda pada kolom pencarian SearchableSelect.")
    add_step(doc, 3, "Tinjau Beban Mengajar", "Sistem akan menyaring dan menampilkan seluruh jadwal mengajar Anda dalam sepekan beserta total ekuivalensi jam tatap muka.")
    
    # ==================== BAB 3 ====================
    add_heading_1(doc, "BAB 3: PRESENSI HARIAN SISWA DI RUANG KELAS")
    add_menu_path(doc, "Sidebar ➔ Presensi & Kehadiran ➔ Absensi & Rekap Kelas (/absensi/kelas)")
    
    add_paragraph(
        doc,
        "Pencatatan presensi siswa di kelas dilakukan oleh guru mata pelajaran pada setiap jam pelajaran atau oleh wali kelas saat apel pagi. Pencatatan yang tertib menjamin akurasi data kehadiran pada lembar buku rapor."
    )
    
    add_heading_2(doc, "3.1 Status Kehadiran Standar Nasional")
    absensi_statuses = [
        ("H (Hadir)", "Siswa hadir fisik di ruang kelas mengikuti KBM secara aktif.", "Warna Hijau"),
        ("S (Sakit)", "Siswa tidak hadir karena sakit (disertai surat dokter / pemberitahuan orang tua).", "Warna Kuning / Oranye"),
        ("I (Izin)", "Siswa berhalangan hadir karena keperluan keluarga yang sah dan terkonfirmasi.", "Warna Biru"),
        ("A (Alpa / Tanpa Keterangan)", "Siswa tidak hadir tanpa ada kabar atau surat resmi dari orang tua.", "Warna Merah"),
    ]
    add_styled_table(
        doc,
        headers=["Kode Status", "Kriteria Keterangan", "Indikator Visual"],
        rows=absensi_statuses,
        col_widths=[Inches(1.8), Inches(3.2), Inches(1.5)]
    )
    
    add_heading_2(doc, "3.2 Langkah Pengisian Presensi Harian Kelas")
    add_step(doc, 1, "Pilih Rombel & Tanggal", "Pilih Kelas (misal: X-RPL-1) dan pastikan Tanggal Presensi sesuai dengan hari KBM.")
    add_step(doc, 2, "Muat Daftar Siswa", "Sistem akan menampilkan seluruh siswa di kelas tersebut dengan status default HADIR.")
    add_step(doc, 3, "Ubah Status Siswa yang Berhalangan", "Cari nama siswa yang tidak berada di kelas, lalu klik tombol status yang sesuai: [Sakit], [Izin], atau [Alpa].")
    add_step(doc, 4, "Tulis Catatan Keterangan (Opsional)", "Bila diperlukan, ketikkan alasan izin atau nomor surat dokter pada kolom catatan.")
    add_step(doc, 5, "Simpan Presensi", "Tekan tombol biru [Simpan Presensi Kelas]. Data kehadiran akan langsung terakumulasi pada rekapitulasi kehadiran rapor siswa.")
    
    add_callout(
        doc,
        "TIP",
        "Integrasi Presensi Gerbang (QR Card)",
        "Bila sekolah mengaktifkan Presensi Gerbang QR, status kedatangan siswa di gerbang sekolah (Jam Datang & Status Tepat Waktu/Terlambat) akan menjadi referensi otomatis bagi guru di dalam kelas, sehingga guru dapat mengetahui apakah siswa membolos atau tertahan di piket."
    )
    
    # ==================== BAB 4 ====================
    add_heading_1(doc, "BAB 4: PENGELOLAAN & PENGINPUTAN NILAI SISWA")
    add_menu_path(doc, "Sidebar ➔ Akademik & Kesiswaan ➔ Input Nilai Siswa (/akademik/nilai)")
    
    add_paragraph(
        doc,
        "Modul Penilaian dirancang fleksibel untuk mengakomodasi kurikulum yang berlaku (Kurikulum Merdeka maupun Kurikulum 2013). Guru mata pelajaran menginput capaian pembelajaran secara bertahap sepanjang semester."
    )
    
    add_heading_2(doc, "4.1 Komponen Nilai Hasil Belajar")
    nilai_components = [
        ("Nilai Tugas & Portofolio (TGS)", "Rata-rata pekerjaan rumah, tugas individu, proyek, dan praktikum bengkel/lab.", "20% - 30%"),
        ("Penilaian Harian / Formatif (PH)", "Rata-rata evaluasi bab / tujuan pembelajaran (TP) yang telah diselesaikan.", "30% - 40%"),
        ("Penilaian Tengah Semester (PTS)", "Asesmen sumatif tengah semester untuk mengukur daya serap materi.", "15% - 20%"),
        ("Penilaian Akhir Semester (PAS/PAT)", "Asesmen akhir semester / evaluasi komprehensif seluruh materi semester.", "20% - 25%"),
    ]
    add_styled_table(
        doc,
        headers=["Komponen Nilai", "Deskripsi Penilaian", "Bobot Standar (%)"],
        rows=nilai_components,
        col_widths=[Inches(2.5), Inches(2.6), Inches(1.3)]
    )
    
    add_heading_2(doc, "4.2 Prosedur Menginput Nilai Siswa")
    add_step(doc, 1, "Pilih Kelas & Mata Pelajaran", "Gunakan dropdown pencarian SearchableSelect untuk memilih Rombel Kelas dan Mata Pelajaran yang Anda ampu.")
    add_step(doc, 2, "Pilih Semester & Jenis Nilai", "Tentukan Semester (Ganjil/Genap) dan pilih komponen yang hendak diinput (misal: Penilaian Harian 1 atau Nilai PAS).")
    add_step(doc, 3, "Input Angka Nilai", "Ketikkan angka nilai (skala 0 - 100) pada kolom siswa terkait. Siswa dengan nilai di bawah KKM akan disorot otomatis dengan latar merah lembut.")
    add_step(doc, 4, "Simpan Penilaian", "Klik tombol [Simpan Nilai]. Nilai Akhir (NA) dan Predikat huruf (A, B, C, D) akan dihitung secara otomatis oleh sistem.")
    
    # ==================== BAB 5 ====================
    add_heading_1(doc, "BAB 5: PENGELOLAAN RAPOR KHUSUS WALI KELAS")
    add_menu_path(doc, "Sidebar ➔ Akademik & Kesiswaan ➔ Rekap & E-Rapor (/akademik/rapor)")
    
    add_paragraph(
        doc,
        "Menu Rekap & E-Rapor merupakan pusat kerja utama Wali Kelas menjelang akhir semester. Di sini seluruh nilai dari guru-guru mata pelajaran dikonsolidasikan menjadi satu kesatuan dokumen Rapor Siswa yang utuh."
    )
    
    add_heading_2(doc, "5.1 Komponen Tambahan yang Wajib Diisi Wali Kelas")
    add_paragraph(
        doc,
        "Selain nilai akademik dari guru mapel, Wali Kelas bertanggung jawab melengkapi aspek non-akademik peserta didik:"
    )
    add_bullet(doc, "Pengamatan perkembangan karakter, integritas, gotong royong, dan kemandirian siswa.", "1. Penilaian Sikap Spiritual & Sosial: ")
    add_bullet(doc, "Nama kegiatan ekskul (Pramuka, Paskibra, PMR, Olahraga), predikat (Sangat Baik / Baik), dan keterangan keaktifan.", "2. Ekstrakurikuler: ")
    add_bullet(doc, "Pesan personal, motivasi belajar, dan saran perbaikan kompetensi yang dicetak pada halaman akhir rapor.", "3. Catatan & Pesan Wali Kelas: ")
    add_bullet(doc, "Rekap jumlah sakit, izin, dan alpa yang ditarik otomatis dari modul presensi kelas.", "4. Rekapitulasi Kehadiran: ")
    
    add_heading_2(doc, "5.2 Langkah Mencetak Dokumen E-Rapor Resmi")
    add_step(doc, 1, "Pilih Kelas Binaan", "Pada menu /akademik/rapor, pilih rombel kelas yang Anda pimpin.")
    add_step(doc, 2, "Periksa Kelengkapan Nilai", "Pastikan seluruh mata pelajaran telah berstatus Tuntas (seluruh nilai mapel telah masuk 100%).")
    add_step(doc, 3, "Buka Pratinjau Rapor Siswa", "Klik tombol ikon printer / [Pratinjau E-Rapor] pada baris siswa yang bersangkutan.")
    add_step(doc, 4, "Tinjau Halaman Rapor", "Sistem akan menampilkan lembar rapor lengkap ber-kop surat resmi sekolah, tabel nilai capaian, catatan wali kelas, dan kolom tanda tangan resmi (Wali Kelas, Orang Tua, dan Kepala Sekolah).")
    add_step(doc, 5, "Cetak Rapor", "Tekan tombol [Cetak Dokumen / Simpan PDF]. Rapor siap dicetak di atas kertas A4 putih polos.")
    
    # ==================== BAB 6 ====================
    add_heading_1(doc, "BAB 6: KENAIKAN KELAS & KELULUSAN SISWA")
    add_menu_path(doc, "Sidebar ➔ Akademik & Kesiswaan ➔ Kenaikan Kelas (/akademik/kenaikan-kelas)")
    
    add_paragraph(
        doc,
        "Pada akhir tahun ajaran (Semester Genap), Wali Kelas bersama Dewan Guru menggelar rapat pleno kenaikan kelas. SIMS mempermudah eksekusi hasil rapat melalui penetapan status massal."
    )
    
    add_heading_2(doc, "6.1 Kriteria Penentuan Kenaikan Kelas")
    add_paragraph(doc, "Sistem secara cerdas memberikan rekomendasi kelayakan kenaikan kelas berdasarkan 3 indikator:")
    add_bullet(doc, "Maksimum mata pelajaran di bawah KKM tidak melebihi ambang batas regulasi (maksimal 2-3 mapel).", "• Ketuntasan Akademik: ")
    add_bullet(doc, "Tingkat kehadiran minimum 85% dari total hari efektif KBM.", "• Persentase Presensi: ")
    add_bullet(doc, "Predikat sikap dan budi pekerti minimal BAIK (B).", "• Nilai Karakter Sikap: ")
    
    add_heading_2(doc, "6.2 Prosedur Eksekusi Kenaikan Kelas")
    add_step(doc, 1, "Buka Menu Kenaikan Kelas", "Akses menu Kenaikan Kelas pada akhir semester genap.")
    add_step(doc, 2, "Pilih Kelas Asal", "Pilih rombel kelas yang hendak diproses (misal: X-RPL-1).")
    add_step(doc, 3, "Tentukan Status Siswa", "Pada tabel siswa, pilih status masing-masing peserta didik: NAIK KE KELAS BERIKUTNYA, TINGGAL DI KELAS YANG SAMA, atau LULUS (khusus kelas 12).")
    add_step(doc, 4, "Pilih Rombel Tujuan", "Tentukan rombel baru penempatan siswa untuk tahun ajaran berikutnya (misal: XI-RPL-1).")
    add_step(doc, 5, "Proses Kenaikan Massal", "Klik tombol [Simpan & Promosikan Kelas]. Siswa akan otomatis berpindah rombel pada tahun ajaran baru.")
    
    # ==================== BAB 7 ====================
    add_heading_1(doc, "BAB 7: PRESENSI MANDIRI PENDIDIK & TENAGA PENGAJAR")
    add_menu_path(doc, "Sidebar ➔ Presensi & Kehadiran ➔ Presensi Guru & Pegawai (/absensi/pegawai)")
    
    add_paragraph(
        doc,
        "Sebagai tenaga profesional, pendidik diwajibkan mencatatkan kehadiran datang dan pulang setiap hari kerja sebagai bukti fisik beban kerja dan dasar penghitungan tunjangan kinerja / honorarium."
    )
    
    add_heading_2(doc, "7.1 Prosedur Absensi Harian Guru")
    add_step(doc, 1, "Akses Menu Presensi Pegawai", "Buka menu Presensi Guru & Pegawai pada sidebar.")
    add_step(doc, 2, "Verifikasi Waktu Datang", "Sistem akan mendeteksi waktu real-time server. Klik tombol hijau [Presensi Masuk] saat tiba di sekolah.")
    add_step(doc, 3, "Presensi Pulang", "Saat jam dinas berakhir, buka kembali menu ini dan klik tombol biru [Presensi Pulang].")
    add_step(doc, 4, "Melihat Rekap Bulanan", "Guru dapat meninjau persentase kehadiran bulanan, total jam kerja, dan akumulasi keterlambatan pada tabel rekapitulasi mandiri.")
    
    # ==================== BAB 8 ====================
    add_heading_1(doc, "BAB 8: PANDUAN PEMECAHAN MASALAH GURU (FAQ)")
    
    add_heading_2(doc, "8.1 Tanya Jawab Kendala Operasional Guru")
    faq_guru = [
        ("Nama siswa tidak muncul di lembar penilaian mata pelajaran", "Periksa apakah siswa tersebut sudah dimasukkan ke dalam rombel kelas yang Anda pilih. Jika belum, hubungi Staf Tata Usaha untuk melengkapi penempatan rombel siswa."),
        ("Nilai yang sudah disimpan salah input angka dan ingin diubah", "Selama semester aktif belum dikunci oleh kurikulum, guru dapat membuka kembali formulir input nilai, mengubah angka, dan menekan [Simpan Nilai] ulang."),
        ("Format cetak E-Rapor terpotong atau halaman menjadi terlalu panjang", "Gunakan peramban Google Chrome, atur Paper Size ke A4, atur Margins ke Default, dan nonaktifkan opsi 'Headers and footers' pada menu More Settings cetak."),
        ("Status presensi siswa tidak tersimpan saat jaringan internet lambat", "Pastikan muncul notifikasi hijau 'Presensi Berhasil Disimpan'. Jika gagal, refresh halaman peramban (F5) dan simpan kembali."),
    ]
    add_styled_table(
        doc,
        headers=["Kendala / Pertanyaan Guru", "Solusi & Tindakan yang Disarankan"],
        rows=faq_guru,
        col_widths=[Inches(2.5), Inches(3.6)]
    )
    
    add_callout(
        doc,
        "TIP",
        "Layanan Bantuan Kurikulum & IT",
        "Bila Bapak/Ibu Guru mengalami kendala terkait pengaturan bobot penilaian, perubahan jadwal mengajar, atau mutasi siswa binaan, silakan berkoordinasi langsung dengan Tim Kurikulum atau Administrator IT Sekolah."
    )
    
    # Save document
    doc.save(output_path)
    print(f"✅ Dokumen berhasil dibuat: {output_path}")

if __name__ == "__main__":
    build_guru_manual()

