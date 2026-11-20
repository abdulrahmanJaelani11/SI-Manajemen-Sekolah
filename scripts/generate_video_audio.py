import asyncio
import os
import edge_tts

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs', 'video-assets', 'audio')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Suara AI Ceria & Bersemangat:
# id-ID-GadisNeural dengan tempo gesit (+8%) dan nada cerah (+4Hz)
VOICE = 'id-ID-GadisNeural'
RATE = '+8%'
PITCH = '+4Hz'

SECTIONS = [
    {
        "id": "01_pembuka_identitas_sistem",
        "title": "Bagian 1: Pembuka & Identitas Sistem",
        "text": """Selamat datang di Sistem Informasi Manajemen Sekolah Terpadu! Sebuah ekosistem digital komprehensif, yang dirancang untuk mengintegrasikan seluruh tata kelola pendidikan modern ke dalam satu platform terpusat!

Mulai dari portal publik sekolah yang informatif dan representatif, hingga keterhubungan data antar unit kerja; sistem ini hadir untuk mewujudkan transparansi, kecepatan operasional, dan kemudahan akses bagi seluruh pemangku kepentingan!

Dilengkapi dengan arsitektur autentikasi yang aman dan terenkripsi, seluruh data administratif institusi terlindungi secara optimal sejak pintu gerbang pertama."""
    },
    {
        "id": "02_dasbor_eksekutif",
        "title": "Bagian 2: Dasbor Eksekutif & Fleksibilitas Konfigurasi",
        "text": """Setelah masuk ke dalam sistem, pengelola sekolah langsung disambut oleh Dasbor Eksekutif yang informatif! Seluruh indikator kinerja utama, mulai dari populasi peserta didik, rekapitulasi tenaga pendidik, grafik keuangan berjalan, hingga persentase kehadiran harian, disajikan secara waktu nyata dan akurat!

Antarmuka aplikasi mengusung kenyamanan visual tingkat tinggi melalui fitur palet tema dinamis dan mode gelap yang dapat disesuaikan secara instan, mendukung efisiensi kerja staf tata usaha dalam berbagai kondisi pencahayaan!

Fleksibilitas sistem semakin diperkuat dengan pengaturan mode satuan pendidikan yang adaptif! Lembaga pendidikan dapat mengonfigurasi operasionalnya secara spesifik, baik untuk sekolah mandiri dengan satu jenjang tertentu, maupun yayasan perguruan terpadu yang menaungi multi jenjang dari tingkat dasar hingga menengah kejuruan!"""
    },
    {
        "id": "03_kesiswaan_cetak_kartu",
        "title": "Bagian 3: Manajemen Kesiswaan & Cetak Kartu Pelajar Massal",
        "text": """Pada modul kesiswaan, pengelolaan data induk peserta didik tersusun secara terstruktur, rapi, dan mudah ditelusuri! Sistem menyediakan penyaringan pintar berbasis rombongan belajar, penelusuran instan berdasarkan nomor induk, serta rekam profil komprehensif yang mencakup data akademik dan data orang tua wali.

Salah satu inovasi mutakhir pada versi ini adalah fitur Pencetakan Kartu Pelajar Massal! Petugas administrasi tidak perlu lagi mencetak kartu tanda pengenal satu per satu yang menyita waktu. Cukup pilih seluruh siswa dalam satu rombongan belajar atau kelas, lalu buka modul generator kartu terpadu dengan satu kali klik!

Sistem secara otomatis menyusun tata letak lembar cetak berstandar kartu identitas nasional di atas kertas A-Empat, lengkap dengan garis pemotongan presisi dan kode Kiu-Er unik terenkripsi untuk kebutuhan absensi pintar! Tata letak dapat diatur fleksibel, baik satu muka penuh hingga sepuluh kartu per lembar, maupun tampak depan dan belakang berdampingan, siap cetak secara efisien dan hemat biaya!"""
    },
    {
        "id": "04_akademik_erapor",
        "title": "Bagian 4: Akademik, Penjadwalan & E-Rapor Digital",
        "text": """Beralih ke pilar akademik, sistem mengoptimalkan seluruh kegiatan belajar mengajar di sekolah! Mulai dari pembagian rombongan belajar, penugasan wali kelas terverifikasi, hingga penyusunan jadwal pelajaran mingguan yang terstruktur dan bebas dari tumpang tindih waktu pengampu!

Bapak dan ibu guru dapat mengisi presensi kehadiran peserta didik secara langsung dari dalam kelas! Rekapitulasi presensi terintegrasi secara otomatis dengan buku induk wali kelas, memberikan pemantauan disiplin siswa secara berkesinambungan.

Pada akhir semester, pengelolaan nilai formatif dan sumatif terintegrasi langsung ke dalam modul E-Rapor Digital! Sistem menyajikan lembar laporan hasil belajar berstandar kurikulum nasional yang komprehensif, siap diunduh dalam format digital maupun dicetak resmi untuk dibagikan kepada orang tua wali!"""
    },
    {
        "id": "05_keuangan_kasir_spp",
        "title": "Bagian 5: Kasir SPP, Rekap Tunggakan & Akuntansi Keuangan",
        "text": """Pengelolaan keuangan sekolah kini menjadi jauh lebih transparan, tertib, dan akuntabel! Melalui modul Kasir Sumbangan Pembinaan Pendidikan, atau Es-Pé-Pé; bendahara dapat melayani transaksi iuran peserta didik dalam hitungan detik! Matriks status tagihan disajikan secara visual, memudahkan identifikasi kewajiban iuran yang telah lunas maupun yang belum diselesaikan.

Transaksi diproses secara instan dan menghasilkan kuitansi pembayaran resmi berstempel digital lengkap dengan kode verifikasi! Bukti transaksi dapat langsung dicetak pada printer struk kasir termal maupun printer dokumen standar, meminimalkan potensi kesalahan administrasi manual.

Pimpinan sekolah dapat memantau laporan tunggakan secara proporsional sesuai kalender berjalan melalui satu dasbor terpadu. Seluruh arus kas masuk dari pembayaran siswa terbukukan secara otomatis ke dalam Buku Kas Umum, berdampingan dengan pencatatan pengeluaran operasional sekolah demi menjaga kesehatan finansial lembaga!"""
    },
    {
        "id": "06_sarpras_perpustakaan",
        "title": "Bagian 6: Layanan Perpustakaan & Inventaris Sarpras",
        "text": """Kelancaran fasilitas pendukung diakomodasi melalui modul Perpustakaan dan Sarana Prasarana! Pengelolaan katalog pustaka, sirkulasi peminjaman buku, hingga perhitungan denda keterlambatan buku fisik diatur secara sistematis dan otomatis!

Sementara itu, pada modul sarana prasarana, seluruh aset sekolah tercatat mulai dari nomor seri, lokasi penempatan, kondisi kelayakan fisik, hingga nilai perolehan! Melalui fitur cetak label terpadu, petugas dapat mencetak stiker kode Kiu-Er aset secara massal untuk ditempelkan pada barang fisik, mempermudah proses sensus dan inventarisasi berkala!"""
    },
    {
        "id": "07_portal_siswa_wali",
        "title": "Bagian 7: Portal Mandiri Peserta Didik & Orang Tua",
        "text": """Komitmen pelayanan sekolah diperluas melalui Portal Mandiri bagi peserta didik dan orang tua wali! Dengan antarmuka yang ramah gawai pintar, wali murid dapat mengakses informasi penting putra-putrinya kapan saja dan di mana saja!

Mulai dari pemantauan catatan kehadiran harian, keterbukaan riwayat pelunasan iuran sekolah, jadwal kegiatan akademik, hingga kemudahan mengunduh laporan hasil belajar siswa secara mandiri; platform ini mempererat sinergi antara pihak sekolah dan keluarga!"""
    },
    {
        "id": "08_keamanan_penutup",
        "title": "Bagian 8: Keamanan Terpadu, Hak Akses RBAC & Penutup",
        "text": """Seluruh keunggulan operasional ini dipayungi oleh sistem keamanan tingkat tinggi! Pengaturan hak akses berbasis peran yang granular memastikan setiap pengguna hanya mengakses fitur yang menjadi wewenangnya, diperkuat dengan pencatatan log aktivitas sistem yang transparan dan terdokumentasi rapi!

Saatnya melangkah maju meninggalkan pencatatan manual yang rentan kendala! Wujudkan tata kelola institusi pendidikan yang modern, efisien, dan berdaya saing tinggi bersama Sistem Informasi Manajemen Sekolah Terpadu! Hubungi tim kami hari ini untuk konsultasi serta demonstrasi langsung, dan mulailah transformasi digital sekolah Anda!"""
    }
]

async def generate_audio():
    print(f"🎙️ Memulai pembuatan file audio narasi Ceria & Bersemangat menggunakan suara: {VOICE} ({RATE}, {PITCH})...\n")
    
    full_text_list = []
    
    for idx, sec in enumerate(SECTIONS, 1):
        filename = f"{sec['id']}.mp3"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        print(f"[{idx}/{len(SECTIONS)}] Men-generate: {sec['title']} -> {filename}...")
        communicate = edge_tts.Communicate(sec['text'], VOICE, rate=RATE, pitch=PITCH)
        await communicate.save(filepath)
        size_kb = os.path.getsize(filepath) / 1024
        print(f"      ✅ Berhasil ({size_kb:.1f} KB)\n")
        
        full_text_list.append(sec['text'])

    # Buat satu file gabungan penuh (full continuous audio)
    full_filename = "00_narasi_lengkap_semua_bagian.mp3"
    full_filepath = os.path.join(OUTPUT_DIR, full_filename)
    full_text = "\n\n ... \n\n".join(full_text_list)
    print(f"[*] Men-generate Master Audio Penuh: {full_filename}...")
    communicate_full = edge_tts.Communicate(full_text, VOICE, rate=RATE, pitch=PITCH)
    await communicate_full.save(full_filepath)
    full_size_kb = os.path.getsize(full_filepath) / 1024
    print(f"      ✅ Master Audio Selesai ({full_size_kb:.1f} KB)\n")
    print(f"🎉 Seluruh audio narasi CERIA & BERSEMANGAT berhasil disimpan di: {OUTPUT_DIR}")

if __name__ == '__main__':
    asyncio.run(generate_audio())
