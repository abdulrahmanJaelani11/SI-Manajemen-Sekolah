import prisma from '../src/lib/prisma';

interface RawStudent {
  nama: string;
  kelasNama: string;
  jenisKelamin: 'L' | 'P';
}

const rawStudents: RawStudent[] = [
  // --- XII TITL ---
  { nama: 'SABILA', kelasNama: 'XII TITL', jenisKelamin: 'P' },
  { nama: 'KINTAN JUWITA SARI', kelasNama: 'XII TITL', jenisKelamin: 'P' },
  { nama: 'SITI SOPIAH', kelasNama: 'XII TITL', jenisKelamin: 'P' },
  { nama: 'SILVIA FEBRIANTI', kelasNama: 'XII TITL', jenisKelamin: 'P' },
  { nama: 'BUDI MAULANA HARIS', kelasNama: 'XII TITL', jenisKelamin: 'L' },
  { nama: 'IMAM SOBARI', kelasNama: 'XII TITL', jenisKelamin: 'L' },

  // --- XII TKR 1 & 2 ---
  { nama: 'MELANI', kelasNama: 'XII TKR 2', jenisKelamin: 'P' },
  { nama: 'RIO FAJAR RAMADHAN', kelasNama: 'XII TKR 2', jenisKelamin: 'L' },
  { nama: 'ILYAS ALAMSYAH', kelasNama: 'XII TKR 2', jenisKelamin: 'L' },
  { nama: 'RACHMAT WIJAYA', kelasNama: 'XII TKR 2', jenisKelamin: 'L' },
  { nama: 'IRVAN FAELANI', kelasNama: 'XII TKR 2', jenisKelamin: 'L' },
  { nama: 'IMBANG', kelasNama: 'XII TKR 2', jenisKelamin: 'L' },
  { nama: 'WIREDA SAPARUDIN', kelasNama: 'XII TKR 1', jenisKelamin: 'L' },
  { nama: 'MUHAMAD SAHRUL MAULANA', kelasNama: 'XII TKR 1', jenisKelamin: 'L' },
  { nama: 'DEDE RIPAL PADILAH', kelasNama: 'XII TKR 1', jenisKelamin: 'L' },
  { nama: 'MUHAMAD RIZAL PRATAMA', kelasNama: 'XII TKR 2', jenisKelamin: 'L' },
  { nama: 'AHMAD FARHANNUDIN', kelasNama: 'XII TKR 2', jenisKelamin: 'L' },
  { nama: 'AHMAD FADILLAH', kelasNama: 'XII TKR 1', jenisKelamin: 'L' },
  { nama: 'ABDUL GOPUR SATIBI', kelasNama: 'XII TKR 2', jenisKelamin: 'L' },
  { nama: 'MUHAMMAD IQBAL FADILAH', kelasNama: 'XII TKR 1', jenisKelamin: 'L' },
  { nama: 'CEP LULUN', kelasNama: 'XII TKR 1', jenisKelamin: 'L' },
  { nama: 'RIZKY SAPUTRA', kelasNama: 'XII TKR 2', jenisKelamin: 'L' },
  { nama: 'MUHAMMAD AGUNG PERMANA', kelasNama: 'XII TKR 2', jenisKelamin: 'L' },
  { nama: 'TIO CANDRA', kelasNama: 'XII TKR 1', jenisKelamin: 'L' },
  { nama: 'ROHMAT ARIFFIN HIDAYAT', kelasNama: 'XII TKR 1', jenisKelamin: 'L' },

  // --- XII RPL 1 & 2 ---
  { nama: 'PARIZAH SAMROTUL PUADAH', kelasNama: 'XII RPL 2', jenisKelamin: 'P' },
  { nama: 'DERLINA TARISA', kelasNama: 'XII RPL 1', jenisKelamin: 'P' },
  { nama: 'ABDUL RAHMAN JAELANI', kelasNama: 'XII RPL 1', jenisKelamin: 'L' },
  { nama: 'HERA KHOERUNISA', kelasNama: 'XII RPL 2', jenisKelamin: 'P' },
  { nama: 'RAINI NUR FADIYAH', kelasNama: 'XII RPL 2', jenisKelamin: 'P' },
  { nama: 'AGUNG WIRA', kelasNama: 'XII RPL 1', jenisKelamin: 'L' },
  { nama: 'RAHMAYANTI', kelasNama: 'XII RPL 1', jenisKelamin: 'P' },
  { nama: 'HILMA DIANA HERMAWATI', kelasNama: 'XII RPL 1', jenisKelamin: 'P' },
  { nama: 'ADINDA KURNIA', kelasNama: 'XII RPL 2', jenisKelamin: 'P' },
  { nama: 'NYNDIA ARTANTI KHAIRUN NYSSA', kelasNama: 'XII RPL 2', jenisKelamin: 'P' },
  { nama: 'INDRI SRIWAHYUNI', kelasNama: 'XII RPL 1', jenisKelamin: 'P' },
  { nama: 'NENG NURJANAH', kelasNama: 'XII RPL 1', jenisKelamin: 'P' },
];

async function seed() {
  console.log(`Menyiapkan penambahan ${rawStudents.length} siswa dari dokumen resmi...`);

  // 1. Ambil data kelas & jurusan
  const allKelas = await prisma.kelas.findMany();
  const kelasMap = new Map<string, typeof allKelas[0]>();
  for (const k of allKelas) {
    kelasMap.set(k.namaKelas.trim().toUpperCase(), k);
  }

  const smkJenjang = await prisma.refJenjang.findFirst({
    where: { kode: 'SMK' },
  });

  if (!smkJenjang) {
    throw new Error('Jenjang SMK tidak ditemukan di database.');
  }

  // Helper title case nama
  const toTitleCase = (str: string) => {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  let count = 0;
  for (let i = 0; i < rawStudents.length; i++) {
    const s = rawStudents[i];
    const kelas = kelasMap.get(s.kelasNama.trim().toUpperCase());

    if (!kelas) {
      console.warn(`Kelas ${s.kelasNama} tidak ditemukan!`);
      continue;
    }

    const nis = `2223${String(i + 1).padStart(4, '0')}`;
    const nisn = `005${String(1234000 + i + 1)}`;
    const namaFormatted = toTitleCase(s.nama);
    const emailPrefix = s.nama.toLowerCase().replace(/[^a-z0-9]/g, '.').substring(0, 20);
    const emailSiswa = `${emailPrefix}@siswa.smktekman.sch.id`;

    // Tanggal lahir realistis 2004-2005
    const birthMonth = (i % 12) + 1;
    const birthDay = ((i * 7) % 28) + 1;
    const birthYear = i % 2 === 0 ? 2004 : 2005;
    const tanggalLahir = new Date(`${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`);

    await prisma.siswa.create({
      data: {
        nis,
        nisn,
        nama: namaFormatted,
        jenisKelamin: s.jenisKelamin,
        jenjangId: smkJenjang.id,
        kelasId: kelas.id,
        jurusanId: kelas.jurusanId,
        tahunMasuk: 2022,
        status: 'aktif',
        tempatLahir: 'Garut',
        tanggalLahir,
        alamat: 'Kab. Garut, Jawa Barat',
        telpSiswa: `08${(1000000000 + (i * 1234567) % 900000000).toString()}`,
        emailSiswa,
        namaWali: `Wali ${namaFormatted.split(' ')[0]}`,
        telpWali: `08${(1100000000 + (i * 2345678) % 900000000).toString()}`,
        pekerjaanWali: 'Wiraswasta / Pegawai',
        hubunganWali: 'Orang Tua',
        prestasi: 'Siswa Eligible SNMPTN 2022',
        fotoUrl: '',
      },
    });

    count++;
    console.log(`[${count}/${rawStudents.length}] Berhasil menambahkan: ${namaFormatted} (${s.kelasNama})`);
  }

  const totalSiswa = await prisma.siswa.count();
  console.log(`\n✅ Selesai! Total siswa di database sekarang: ${totalSiswa}`);
}

seed()
  .catch((err) => {
    console.error('Error saat seeding siswa:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
