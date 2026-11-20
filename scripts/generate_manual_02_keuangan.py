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

def build_keuangan_manual():
    output_path = os.path.join("docs", "user-manual", "02-panduan-keuangan-tu.docx")
    
    doc = create_base_document(
        book_series_title="BUKU 2: PANDUAN TATA USAHA & BENDAHARA KEUANGAN",
        book_subtitle="Pedoman Operasional Kasir SPP, Penagihan Biaya Non-SPP & Cicilan, Buku Kas Umum, Rekap Tunggakan, serta Penyusunan Laporan Arus Kas Terpadu Resmi.",
        doc_id="DOC-SIMS-02-KEU",
        target_roles="Bendahara Sekolah, Staf Tata Usaha, Kasir Administrasi Keuangan",
        version="1.0"
    )
    
    # ==================== DAFTAR ISI / RINGKASAN ====================
    add_heading_1(doc, "RINGKASAN EKSEKUTIF & DAFTAR ISI PANDUAN", page_break=False)
    add_paragraph(
        doc,
        "Buku Panduan Tata Usaha dan Bendahara Keuangan ini disusun secara komprehensif untuk memandu seluruh staf administrasi dalam mengelola arus keuangan sekolah secara transparan, akuntabel, dan rapi. Sistem ini mengintegrasikan transaksi kasir SPP harian, pembayaran cicilan uang gedung/kegiatan, pembukuan kas umum operasional, hingga pembuatan laporan arus kas resmi ber-kop surat sekolah."
    )
    
    toc_data = [
        ("BAB 1", "Pendahuluan & Gambaran Alur Keuangan Sekolah", "Prinsip akuntabilitas, struktur arus kas, dan navigasi menu keuangan"),
        ("BAB 2", "Master Tarif SPP & Skema Keringanan Biaya", "Konfigurasi tarif per tingkat/jurusan, diskon, dan beasiswa"),
        ("BAB 3", "Kasir Pembayaran SPP & Cetak Kwitansi Resmi", "Transaksi pembayaran multi-bulan, struk thermal, dan kwitansi A4"),
        ("BAB 4", "Tagihan Non-SPP & Sistem Cicilan Bertahap", "Penerbitan tagihan uang gedung/seragam, cicilan, dan sisa piutang"),
        ("BAB 5", "Rekapitulasi Tunggakan & Riwayat Transaksi", "Monitoring jatuh tempo, filter per kelas, dan surat pemberitahuan"),
        ("BAB 6", "Buku Kas Umum & Belanja Operasional Sekolah", "Pencatatan kas masuk non-siswa (BOS/Hibah) dan pengeluaran belanja"),
        ("BAB 7", "Laporan Arus Kas Terpadu & Penutupan Buku", "Konsolidasi inflow/outflow, lembar pengesahan TTD, dan cetak PDF kop resmi"),
        ("BAB 8", "SOP Rekonsiliasi Kasir & Penanganan Kendala (FAQ)", "Prosedur tutup kas harian, selisih kas, dan troubleshooting cetak"),
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
        "Prinsip Integritas dan Akuntabilitas Keuangan",
        "Seluruh transaksi penerimaan dan pengeluaran kas yang telah diinput ke dalam sistem akan secara otomatis terekam ke dalam Buku Kas Umum dan Laporan Arus Kas secara permanen. Pastikan nominal pembayaran, nama siswa, dan pos pengeluaran telah diverifikasi dengan bukti fisik sebelum menekan tombol simpan."
    )
    
    # ==================== BAB 1 ====================
    add_heading_1(doc, "BAB 1: PENDAHULUAN & GAMBARAN ALUR KEUANGAN SEKOLAH")
    
    add_heading_2(doc, "1.1 Peran Tata Usaha & Bendahara dalam Sistem")
    add_paragraph(
        doc,
        "Dalam ekosistem SIMS, bagian keuangan memegang tanggung jawab strategis dalam menjamin kelancaran likuiditas operasional sekolah. Pengelolaan keuangan dibagi menjadi 3 pilar utama:"
    )
    add_bullet(doc, "Penerimaan rutin bulanan siswa berdasarkan tarif yang ditetapkan yayasan atau sekolah.", "1. Penerimaan Rutin SPP: ")
    add_bullet(doc, "Penerimaan biaya pembangunan (DSP), seragam, praktikum, dan kegiatan insidental yang dapat dibayar bertahap (cicilan).", "2. Penerimaan Non-SPP & Insidental: ")
    add_bullet(doc, "Pencatatan dana masuk dari luar siswa (dana BOS, hibah) serta pengeluaran belanja operasional sekolah (ATK, listrik, perawatan fasilitas, honorarium).", "3. Kas Umum Operasional: ")
    
    add_heading_2(doc, "1.2 Diagram Alur Arus Kas Terpadu (Cash Flow Architecture)")
    add_paragraph(
        doc,
        "Sistem menerapkan konsolidasi otomatis di mana setiap rupiah uang masuk dari kasir maupun kas umum akan bermuara pada satu Laporan Arus Kas Terpadu:"
    )
    
    flow_rows = [
        ("Inflow Kasir SPP", "Siswa membayar SPP bulanan", "Buku Kas Masuk (Otomatis)", "Kwitansi SPP Sah"),
        ("Inflow Non-SPP", "Siswa membayar cicilan uang gedung", "Buku Kas Masuk (Otomatis)", "Tanda Terima Cicilan"),
        ("Inflow Kas Umum", "Pencairan dana BOS / Komite / Yayasan", "Buku Kas Masuk", "Buku Kas Umum"),
        ("Outflow Belanja", "Belanja ATK, renovasi, operasional", "Buku Kas Keluar", "Bukti Pengeluaran Kas (BKK)"),
        ("Saldo Akhir Kumulatif", "Total Inflow dikurangi Total Outflow", "Laporan Arus Kas Resmi", "Laporan Ditandatangani Kasek & Bendahara"),
    ]
    add_styled_table(
        doc,
        headers=["Sumber / Jalur Dana", "Aktivitas Transaksi", "Pencatatan Sistem", "Dokumen Bukti Fisik"],
        rows=flow_rows,
        col_widths=[Inches(1.5), Inches(1.8), Inches(1.5), Inches(1.3)]
    )
    
    add_heading_2(doc, "1.3 Lokasi Menu Navigasi Keuangan pada Sidebar")
    add_paragraph(doc, "Seluruh fitur keuangan dikelompokkan rapi pada bilah navigasi sisi kiri di bawah judul Keuangan & SPP:")
    add_bullet(doc, "Lokasi transaksi harian pembayaran SPP siswa dan cetak kwitansi.", "• Kasir Pembayaran SPP (/spp/kasir): ")
    add_bullet(doc, "Log pencarian riwayat seluruh pembayaran SPP berdasarkan tanggal dan metode.", "• Riwayat Transaksi (/spp/riwayat): ")
    add_bullet(doc, "Daftar siswa yang belum melunasi kewajiban SPP per kelas.", "• Rekap Tunggakan (/spp/tunggakan): ")
    add_bullet(doc, "Pengaturan besaran biaya SPP bulanan per jurusan dan jenjang.", "• Master Tarif SPP (/spp/tarif): ")
    add_bullet(doc, "Pengelolaan tagihan non-rutin seperti uang gedung, seragam, dan ujian.", "• Tagihan Non-SPP & Cicilan (/keuangan/tagihan): ")
    add_bullet(doc, "Pencatatan kas masuk operasional dan pengeluaran belanja sekolah.", "• Kas Umum & Pengeluaran (/keuangan/kas-umum): ")
    add_bullet(doc, "Rekapitulasi komprehensif kas masuk vs keluar dengan pratinjau cetak PDF.", "• Laporan Arus Kas Terpadu (/keuangan/laporan): ")
    
    # ==================== BAB 2 ====================
    add_heading_1(doc, "BAB 2: MASTER TARIF SPP & SKEMA KERINGANAN BIAYA")
    add_menu_path(doc, "Sidebar ➔ Keuangan & SPP ➔ Master Tarif SPP (/spp/tarif)")
    
    add_paragraph(
        doc,
        "Sebelum melayani transaksi pembayaran siswa di kasir, Bendahara harus mengonfigurasi Master Tarif SPP terlebih dahulu. Tarif SPP dapat dibedakan berdasarkan Tahun Ajaran, Tingkat Kelas (10, 11, 12), serta Program Keahlian / Jurusan."
    )
    
    add_heading_2(doc, "2.1 Kamus Data Pengaturan Tarif SPP")
    tarif_fields = [
        ("Tahun Ajaran", "Dropdown Pilihan", "Tahun ajaran berlaku tarif tersebut (contoh: 2024/2025)."),
        ("Tingkat Kelas", "Pilihan (10 / 11 / 12)", "Jenjang siswa yang dikenakan nominal tarif."),
        ("Program Jurusan", "Dropdown Pilihan", "Jurusan spesifik atau SEMUA JURUSAN jika tarifnya seragam."),
        ("Nominal Bulanan (Rp)", "Mata Uang (Rupiah)", "Besaran kewajiban SPP per bulan (contoh: Rp 250.000)."),
        ("Keterangan Kebijakan", "Teks Opsional", "Catatan rincian biaya yang tercakup di dalam SPP."),
    ]
    add_styled_table(
        doc,
        headers=["Kolom Formulir", "Tipe Data", "Deskripsi & Contoh Pengisian"],
        rows=tarif_fields,
        col_widths=[Inches(1.8), Inches(1.6), Inches(2.7)]
    )
    
    add_heading_2(doc, "2.2 Langkah Menambah Tarif SPP Baru")
    add_step(doc, 1, "Buka Menu Master Tarif", "Klik menu Master Tarif SPP pada kelompok Keuangan & SPP.")
    add_step(doc, 2, "Buka Dialog Penambahan", "Tekan tombol berwarna biru [+ Tambah Tarif SPP] di sudut kanan atas lembar kerja.")
    add_step(doc, 3, "Pilih Tahun Ajaran & Jenjang", "Pilih tahun ajaran aktif dan tentukan tingkat kelas menggunakan dropdown pencarian SearchableSelect.")
    add_step(doc, 4, "Tentukan Jurusan & Nominal", "Pilih jurusan terkait, lalu masukkan nominal biaya SPP dalam angka murni tanpa titik atau koma.")
    add_step(doc, 5, "Simpan Konfigurasi", "Klik [Simpan Tarif]. Sistem akan secara otomatis mengaitkan tarif ini kepada seluruh siswa aktif di rombel terkait.")
    
    add_callout(
        doc,
        "TIP",
        "Pemberian Beasiswa / Keringanan SPP",
        "Bagi siswa yang mendapatkan beasiswa yayasan, prestasi, atau KIP (Kartu Indonesia Pintar), potongan biaya atau pembebasan SPP dapat diaplikasikan langsung pada menu Kasir Pembayaran SPP dengan memilih opsi Diskon / Beasiswa saat proses checkout pembayaran."
    )
    
    # ==================== BAB 3 ====================
    add_heading_1(doc, "BAB 3: KASIR PEMBAYARAN SPP & CETAK KWITANSI RESMI")
    add_menu_path(doc, "Sidebar ➔ Keuangan & SPP ➔ Kasir Pembayaran SPP (/spp/kasir)")
    
    add_paragraph(
        doc,
        "Modul Kasir SPP dirancang untuk mempercepat proses pelayanan loket pembayaran dengan waktu layanan di bawah 30 detik per siswa. Kasir dapat melayani pembayaran satu bulan maupun multi-bulan sekaligus (misal 3 bulan atau 1 semester)."
    )
    
    add_heading_2(doc, "3.1 Prosedur Pelayanan Kasir Langkah demi Langkah")
    add_step(
        doc,
        1,
        "Pencarian Data Siswa",
        "Pada kotak pencarian Siswa Terdaftar, ketikkan Nama Siswa, NIS, atau NISN. Dropdown berfitur live search akan langsung menyaring daftar siswa dan menampilkan informasi Kelas serta status tagihan terakhir."
    )
    add_step(
        doc,
        2,
        "Pilih Bulan yang Hendak Dibayarkan",
        "Setelah siswa dipilih, tabel matriks 12 bulan (Juli s.d. Juni) akan ditampilkan. Bulan yang sudah lunas akan berwarna hijau dengan status LUNAS. Centang kotak pada bulan yang hendak dibayar siswa (contoh: centang Juli, Agustus, September).",
        [
            "Sistem secara otomatis menjumlahkan total nominal tagihan",
            "Pembayaran dapat dilakukan berurutan atau memilih beberapa bulan sekaligus"
        ]
    )
    add_step(
        doc,
        3,
        "Terapkan Potongan / Beasiswa (Jika Ada)",
        "Jika siswa berhak atas potongan, masukkan nominal diskon pada kolom Potongan / Beasiswa. Total tagihan bersih akan otomatis berkurang."
    )
    add_step(
        doc,
        4,
        "Pilih Metode Pembayaran & Input Uang Diterima",
        "Pilih metode pembayaran: TUNAI, TRANSFER BANK, atau QRIS. Masukkan nominal uang yang diserahkan wali murid pada kolom Jumlah Uang Diterima. Sistem akan mengalkulasi uang kembalian secara instan."
    )
    add_step(
        doc,
        5,
        "Simpan & Proses Transaksi",
        "Klik tombol hijau [Proses Pembayaran]. Sistem akan memvalidasi data, memperbarui status bulan menjadi lunas, mencatat transaksi ke audit trail dan buku kas umum, serta langsung menampilkan dialog Pratinjau Kwitansi Pembayaran."
    )
    
    add_heading_2(doc, "3.2 Format Cetak Kwitansi Resmi")
    add_paragraph(
        doc,
        "Sistem mendukung dua standar pencetakan kwitansi yang dapat dipilih oleh kasir sesuai dengan jenis printer yang tersedia di loket:"
    )
    add_bullet(doc, "Ukuran ringkas hemat kertas untuk printer kasir thermal roll 80mm / 58mm. Memuat nomor kwitansi, tanggal transaksi, nama siswa, bulan dibayar, nama kasir, dan QR code validasi keaslian kwitansi.", "1. Format Struk Kasir Termal (Receipt POS): ")
    add_bullet(doc, "Kwitansi formal setengah kertas A4 atau lembar penuh A4 lengkap dengan Kop Surat Sekolah resmi, stempel digital, rincian biaya terbilang, dan tanda tangan kasir bendahara.", "2. Format Kwitansi Lembar A4 Ber-Kop Resmi: ")
    
    add_callout(
        doc,
        "NOTE",
        "Kerapian Hasil Cetak Dokumen",
        "Fitur cetak SIMS telah dioptimalkan khusus untuk media kertas fisik. Seluruh tombol antarmuka, dialog modal, dan latar belakang abu-abu browser disembunyikan secara otomatis saat dialog print dibuka, sehingga hasil cetak pada kertas printer dijamin 100% bersih tanpa ada elemen web yang bocor."
    )
    
    # ==================== BAB 4 ====================
    add_heading_1(doc, "BAB 4: TAGIHAN NON-SPP & SISTEM CICILAN BERTAHAP")
    add_menu_path(doc, "Sidebar ➔ Keuangan & SPP ➔ Tagihan Non-SPP & Cicilan (/keuangan/tagihan)")
    
    add_paragraph(
        doc,
        "Selain SPP bulanan, sekolah memiliki berbagai pos kewajiban keuangan siswa yang bersifat berkala atau sekali bayar selama masa studi. Modul Tagihan Non-SPP memfasilitasi penagihan dan pembayaran bertahap (cicilan) secara transparan."
    )
    
    add_heading_2(doc, "4.1 Jenis Pos Biaya Non-SPP Standar")
    non_spp_types = [
        ("Uang Gedung / Dana Sumbangan Pendidikan (DSP)", "Tahunan / Sekali Awal Masuk", "Dapat dicicil 3 s.d. 10 kali pembayaran."),
        ("Paket Seragam & Atribut Sekolah", "Awal Tahun Ajaran Baru", "Pembelian bahan seragam dinas, pramuka, dan olahraga."),
        ("Uang Kegiatan & Praktikum Jurusan", "Per Semester", "Biaya bahan praktik bengkel/lab komputer dan asuransi PKL."),
        ("Biaya Ujian & Asesmen Nasional", "Menjelang Periode Ujian", "Biaya operasional pelaksanaan PTS, PAS, dan Uji Kompetensi Keahlian (UKK)."),
        ("Wisuda & Pelepasan Alumni", "Tingkat Akhir (Kelas 12)", "Biaya map ijazah, toga, foto buku kenangan, dan seremoni pelepasan."),
    ]
    add_styled_table(
        doc,
        headers=["Jenis Pos Biaya", "Periode Pembebanan", "Ketentuan Pembayaran"],
        rows=non_spp_types,
        col_widths=[Inches(2.5), Inches(1.8), Inches(1.8)]
    )
    
    add_heading_2(doc, "4.2 Prosedur Penerbitan Tagihan Massal per Kelas")
    add_step(doc, 1, "Buka Modul Tagihan", "Arahkan kursor ke menu Tagihan Non-SPP & Cicilan pada sidebar.")
    add_step(doc, 2, "Pilih Aksi Tagihan Massal", "Klik tombol [+ Terbitkan Tagihan Baru].")
    add_step(doc, 3, "Tentukan Sasaran Siswa", "Pilih Rombel / Kelas (misal: X-RPL-1) atau pilih siswa perorangan jika tagihan bersifat khusus.")
    add_step(doc, 4, "Isi Pos Biaya & Nominal", "Pilih Kategori Tagihan (misal: SERAGAM) dan ketikkan nominal kewajiban per siswa.")
    add_step(doc, 5, "Tentukan Tanggal Jatuh Tempo", "Atur batas akhir pelunasan agar sistem dapat memunculkan peringatan tunggakan bila telah lewat tempo.")
    add_step(doc, 6, "Terbitkan Tagihan", "Klik [Terbitkan Tagihan]. Seluruh siswa di kelas tersebut akan seketika memiliki kewajiban pembayaran baru pada akun portal masing-masing.")
    
    add_heading_2(doc, "4.3 Menginput Pembayaran Cicilan Bertahap")
    add_paragraph(
        doc,
        "Ketika orang tua siswa membayar sebagian dari total tagihan (misal: membayar Rp 500.000 dari total tagihan uang gedung Rp 2.500.000):"
    )
    add_step(doc, 1, "Cari Tagihan Siswa", "Ketikkan nama siswa pada kolom filter pencarian untuk menemukan tagihan yang bersangkutan.")
    add_step(doc, 2, "Klik Tombol Bayar Cicilan", "Tekan tombol bergambar dompet [Bayar Cicilan] pada baris tagihan.")
    add_step(doc, 3, "Input Nominal Cicilan", "Ketikkan jumlah uang yang disetorkan saat itu (contoh: 500000).")
    add_step(doc, 4, "Tinjau Sisa Piutang", "Sistem akan secara otomatis mengurangi saldo dan menampilkan Sisa Tagihan terbaru (Rp 2.000.000) serta mengubah status menjadi SEBAGIAN (Cicilan Aktif).")
    add_step(doc, 5, "Cetak Kwitansi Cicilan", "Tekan [Cetak Bukti Pembayaran] untuk memberikan tanda terima cicilan resmi kepada orang tua.")
    
    # ==================== BAB 5 ====================
    add_heading_1(doc, "BAB 5: REKAPITULASI TUNGGAKAN & RIWAYAT TRANSAKSI")
    add_menu_path(doc, "Sidebar ➔ Keuangan & SPP ➔ Rekap Tunggakan & Riwayat Transaksi")
    
    add_paragraph(
        doc,
        "Modul pengawasan ini membantu Bendahara dan Kepala Tata Usaha dalam memantau kepatuhan pembayaran SPP serta menyiapkan data penagihan bagi wali kelas dan bagian kesiswaan."
    )
    
    add_heading_2(doc, "5.1 Memantau Riwayat Transaksi Pembayaran (/spp/riwayat)")
    add_paragraph(
        doc,
        "Halaman Riwayat Transaksi mencatat seluruh rekaman kasir secara kronologis (dari transaksi paling mutakhir). Fitur-fitur unggulan pada halaman ini meliputi:"
    )
    add_bullet(doc, "Bendahara dapat melihat total penerimaan kasir pada tanggal hari ini, minggu ini, atau bulan tertentu.", "• Filter Rentang Tanggal: ")
    add_bullet(doc, "Menyaring transaksi yang dibayar secara Tunai, Transfer Bank, atau QRIS untuk memudahkan pencocokan (rekonsiliasi) mutasi rekening koran bank.", "• Filter Metode Pembayaran: ")
    add_bullet(doc, "Bila siswa kehilangan bukti bayar, kasir dapat mencetak ulang kwitansi resmi kapan saja dari baris transaksi terkait.", "• Cetak Ulang Kwitansi: ")
    
    add_heading_2(doc, "5.2 Menganalisis Rekapitulasi Tunggakan Siswa (/spp/tunggakan)")
    add_paragraph(
        doc,
        "Untuk mengetahui kelas mana yang memiliki tingkat tunggakan tertinggi menjelang periode Ujian Semester, Bendahara dapat memanfaatkan tabel Rekap Tunggakan:"
    )
    add_step(doc, 1, "Filter Rombel Kelas", "Pilih rombel kelas tertentu (contoh: XII TKJ 1) atau biarkan kosong untuk melihat rekapitulasi seluruh sekolah.")
    add_step(doc, 2, "Evaluasi Kartu KPI Tunggakan", "Perhatikan 3 kartu metrik ringkasan di atas tabel: Total Siswa Menunggak, Total Bulan Tertunggak, dan Estimasi Nominal Piutang Belum Tertagih.")
    add_step(doc, 3, "Penerbitan Surat Pemberitahuan", "Klik tombol [Cetak Daftar Tunggakan Kelas] untuk mencetak lembar daftar tagihan yang diserahkan kepada Wali Kelas guna tindak lanjut komunikasi dengan orang tua siswa.")
    
    # ==================== BAB 6 ====================
    add_heading_1(doc, "BAB 6: BUKU KAS UMUM & BELANJA OPERASIONAL SEKOLAH")
    add_menu_path(doc, "Sidebar ➔ Keuangan & SPP ➔ Kas Umum & Pengeluaran (/keuangan/kas-umum)")
    
    add_paragraph(
        doc,
        "Buku Kas Umum (BKU) berfungsi sebagai buku besar operasional kas sekolah non-siswa. Melalui menu ini, Bendahara mencatat dana bantuan pemerintah (BOS), dana hibah komite, serta seluruh pos belanja operasional sekolah."
    )
    
    add_heading_2(doc, "6.1 Pencatatan Penerimaan Kas Masuk Operasional (Inflow)")
    add_step(doc, 1, "Buka Menu Kas Umum", "Pilih menu Kas Umum & Pengeluaran pada kelompok Keuangan di sidebar.")
    add_step(doc, 2, "Klik Tombol Pemasukan", "Tekan tombol berwarna hijau [+ Catat Kas Masuk].")
    add_step(doc, 3, "Isi Formulir Pemasukan", "Pilih Kategori Sumber Dana (BOS REGULER, DANA KOMITE, HIBAH, YAYASAN), masukkan Nominal Rupiah, dan ketikkan Uraian/Keterangan transaksi secara jelas.")
    add_step(doc, 4, "Tentukan Rekening / Kas", "Pilih apakah uang disetorkan ke Kas Tunai Brankas atau Rekening Bank Sekolah.")
    add_step(doc, 5, "Simpan Transaksi", "Klik [Simpan Kas Masuk]. Saldo kas operasional sekolah akan otomatis bertambah seketika.")
    
    add_heading_2(doc, "6.2 Pencatatan Pengeluaran Belanja Sekolah (Outflow)")
    add_step(doc, 1, "Buka Formulir Pengeluaran", "Tekan tombol berwarna merah [- Catat Pengeluaran Kas].")
    add_step(doc, 2, "Tentukan Kategori Belanja", "Pilih pos anggaran belanja:")
    add_bullet(doc, "Pembelian kertas HVS, spidol, tinta printer, map, dan buku administrasi kelas.", "• BELANJA ATK & KANTOR: ")
    add_bullet(doc, "Pembayaran tagihan listrik PLN, internet IndiHome, air PDAM, dan kebersihan.", "• OPERASIONAL RUTIN: ")
    add_bullet(doc, "Perbaikan AC, servis komputer lab, perbaikan atap, dan pengecatan gedung.", "• PERAWATAN & SARPRAS: ")
    add_bullet(doc, "Honor guru piket, pemateri workshop, dan kegiatan kesiswaan.", "• HONORARIUM & KEGIATAN: ")
    add_step(doc, 3, "Input Nominal & Nomor Bukti Fisik", "Ketikkan jumlah uang yang dikeluarkan dan catat Nomor Bukti Nota / Bon fisik (contoh: NOTA-ATK-084).")
    add_step(doc, 4, "Simpan Pengeluaran", "Klik [Simpan Pengeluaran]. Sistem akan memotong saldo kas sekolah dan mencatat waktu mutasi secara mendetail.")
    
    add_callout(
        doc,
        "WARNING",
        "Penyimpanan Bukti Fisik Nota",
        "Setiap pengeluaran kas yang diinputkan ke sistem WAJIB didukung dengan bukti kuitansi nota fisik yang telah ditandatangani oleh penerima uang dan disetujui Kepala Sekolah. Berkas fisik harus diarsipkan per bulan sesuai nomor transaksi sistem."
    )
    
    # ==================== BAB 7 ====================
    add_heading_1(doc, "BAB 7: LAPORAN ARUS KAS TERPADU & PENUTUPAN BUKU")
    add_menu_path(doc, "Sidebar ➔ Keuangan & SPP ➔ Laporan Arus Kas Terpadu (/keuangan/laporan)")
    
    add_paragraph(
        doc,
        "Laporan Arus Kas Terpadu adalah dokumen akuntansi resmi puncak yang mengonsolidasikan seluruh aliran dana masuk dan keluar sekolah dalam suatu periode pembukuan tertentu. Laporan ini siap dicetak langsung dalam format dokumen resmi ber-kop surat sekolah dan lembar pengesahan tanda tangan pimpinan."
    )
    
    add_heading_2(doc, "7.1 Struktur Laporan Arus Kas Terpadu")
    add_paragraph(doc, "Dokumen laporan menyajikan informasi keuangan secara terstruktur menjadi 3 bagian utama:")
    add_bullet(doc, "Menampilkan rincian penerimaan Kasir SPP, penerimaan Tagihan Non-SPP, dan Kas Masuk Operasional.", "1. Rekapitulasi Arus Kas Masuk (Total Inflow): ")
    add_bullet(doc, "Menampilkan rincian seluruh belanja ATK, operasional, sarpras, dan honorarium.", "2. Rekapitulasi Arus Kas Keluar (Total Outflow): ")
    add_bullet(doc, "Menampilkan Saldo Awal Periode, Arus Kas Bersih (Surplus/Defisit), dan Saldo Akhir Kumulatif yang berada di brankas & bank.", "3. Saldo Kas Kumulatif: ")
    
    add_heading_2(doc, "7.2 Langkah Mencetak Dokumen Laporan Resmi")
    add_step(doc, 1, "Tentukan Periode Buku Kas", "Pilih Rentang Tanggal pembukuan yang ingin dilaporkan (contoh: 1 Juli s.d. 31 Desember untuk laporan semester).")
    add_step(doc, 2, "Buka Dialog Konfigurasi Cetak", "Klik tombol biru [Buka Dialog Cetak / Simpan PDF] di bagian atas halaman.")
    add_step(doc, 3, "Atur Lembar Pengesahan Tanda Tangan", "Pada modal konfigurasi, periksa dan sesuaikan data pejabat yang menandatangani:")
    add_bullet(doc, "Kota tempat laporan ditetapkan (contoh: Garut / Bandung / Jakarta).", "• Kota Titimangsa: ")
    add_bullet(doc, "Tanggal resmi penetapan dokumen (contoh: 31 Desember 2024).", "• Tanggal Dokumen: ")
    add_bullet(doc, "Nama lengkap dan NIP Kepala Sekolah serta Bendahara Pengelola.", "• Pejabat Penandatangan: ")
    add_step(doc, 4, "Buka Dialog Print Browser", "Klik tombol [Buka Dialog Cetak / Simpan PDF]. Sistem akan membuka dialog print standar browser.")
    add_step(doc, 5, "Simpan sebagai PDF atau Cetak Kertas", "Pilih Destination: Save as PDF untuk arsip digital atau pilih printer kantor untuk mencetak langsung di atas kertas A4.")
    
    add_heading_2(doc, "7.3 Ekspor Buku Kas ke Format Excel / CSV")
    add_paragraph(
        doc,
        "Bila Bendahara perlu mengolah data keuangan lebih lanjut untuk pelaporan pajak atau laporan yayasan, klik tombol [Ekspor Data (CSV)]. Seluruh baris transaksi akan terunduh ke dalam file spreadsheet yang dapat dibuka di Microsoft Excel."
    )
    
    # ==================== BAB 8 ====================
    add_heading_1(doc, "BAB 8: SOP REKONSILIASI KASIR & PENANGANAN KENDALA (FAQ)")
    
    add_heading_2(doc, "8.1 Prosedur Standar Operasional (SOP) Tutup Kas Harian")
    add_paragraph(
        doc,
        "Setiap loket kasir selesai melayani pembayaran di akhir hari kerja (pukul 15.00 WIB), kasir wajib melakukan penutupan buku kas harian melalui 4 tahap:"
    )
    add_bullet(doc, "Buka menu /spp/riwayat, atur filter tanggal hari ini dan filter metode pembayaran TUNAI. Catat total nominal penerimaan tunai sistem.", "Tahap 1: Hitung Rekap Sistem: ")
    add_bullet(doc, "Keluarkan uang fisik dari laci kasir, hitung seluruh lembaran uang kertas dan koin yang ada secara teliti.", "Tahap 2: Hitung Fisik Uang: ")
    add_bullet(doc, "Pastikan Nominal Fisik Uang sama persis dengan Nominal Rekap Tunai Sistem (Selisih = Rp 0).", "Tahap 3: Uji Rekonsiliasi Kas: ")
    add_bullet(doc, "Kasir dan Bendahara menandatangani lembar Berita Acara Kas Harian dan memasukkan uang tunai ke dalam brankas besi sekolah.", "Tahap 4: Serah Terima Brankas: ")
    
    add_heading_2(doc, "8.2 Tanya Jawab Masalah Umum (Troubleshooting & FAQ)")
    faq_keu = [
        ("Nama siswa tidak muncul saat dicari di loket kasir SPP", "Pastikan status siswa tersebut Aktif pada modul data siswa dan telah terdaftar dalam rombel kelas yang memiliki tahun ajaran aktif."),
        ("Printer kasir thermal tidak mencetak atau kertas keluar polos", "Periksa arah pemasangan gulungan kertas thermal (bagian sisi licin thermal harus menghadap ke atas / head printer) dan pastikan kabel USB terhubung kencang."),
        ("Terjadi salah input bulan pembayaran SPP oleh kasir", "Kasir dapat membatalkan transaksi pada hari yang sama dengan persetujuan Bendahara melalui tombol [Batalkan Transaksi] di menu Riwayat Transaksi."),
        ("Status pembayaran transfer bank belum masuk ke rekening sekolah", "Jangan mencetak kwitansi lunas sebelum staf kasir memverifikasi mutasi rekening koran atau notifikasi m-banking resmi sekolah."),
    ]
    add_styled_table(
        doc,
        headers=["Kendala / Pertanyaan Operasional", "Solusi & Panduan Bendahara"],
        rows=faq_keu,
        col_widths=[Inches(2.5), Inches(3.6)]
    )
    
    add_callout(
        doc,
        "TIP",
        "Dukungan Konsultasi Teknis",
        "Apabila Bendahara atau Staf Tata Usaha menemukan ketidaksesuaian perhitungan formula kasir atau membutuhkan penyesuaian pos akun baru, silakan berkoordinasi dengan Administrator Sistem IT Sekolah."
    )
    
    # Save document
    doc.save(output_path)
    print(f"✅ Dokumen berhasil dibuat: {output_path}")

if __name__ == "__main__":
    build_keuangan_manual()

