import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, apiSuccess } from '@/lib/api-response'
import { getClientIp, checkRateLimit } from '@/lib/auth/rate-limiter'

function generateKodeRegistrasi(tahun: string, seqNum: number): string {
  const yearPrefix = (tahun || String(new Date().getFullYear())).replace(/[^0-9]/g, '').slice(0, 4) || String(new Date().getFullYear())
  return `PPDB-${yearPrefix}-${String(seqNum).padStart(4, '0')}`
}

export async function GET() {
  try {
    const now = new Date()

    const [gelombangList, jenjangList, jurusanList, profil] = await Promise.all([
      prisma.ppdbGelombang.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { pendaftar: true },
          },
        },
        orderBy: { tanggalMulai: 'asc' },
      }),
      prisma.refJenjang.findMany({
        where: { active: true },
        orderBy: { urutan: 'asc' },
      }),
      prisma.jurusan.findMany({
        where: { active: true },
        orderBy: { namaJurusan: 'asc' },
      }),
      prisma.sekolahProfil.findFirst(),
    ])

    const gelombangFormatted = gelombangList.map((g) => {
      const start = new Date(g.tanggalMulai)
      const end = new Date(g.tanggalSelesai)
      const isOpenToday = now >= start && now <= end && g._count.pendaftar < g.kuotaTotal

      return {
        id: g.id,
        nama: g.nama,
        tahunAjaran: g.tahunAjaran,
        tanggalMulai: g.tanggalMulai,
        tanggalSelesai: g.tanggalSelesai,
        kuotaTotal: g.kuotaTotal,
        biayaDaftar: Number(g.biayaDaftar),
        syaratText: g.syaratText,
        isActive: g.isActive,
        jumlahPendaftar: g._count.pendaftar,
        sisaKuota: Math.max(0, g.kuotaTotal - g._count.pendaftar),
        isOpenToday,
      }
    })

    return apiSuccess({
      message: 'Informasi PPDB berhasil dimuat',
      data: {
        gelombangList: gelombangFormatted,
        jenjangList,
        jurusanList,
        profil: profil || null,
      },
    })
  } catch (error: any) {
    console.error('API Portal PPDB GET Error:', error)
    return apiError('Gagal memuat informasi PPDB: ' + (error?.message || 'Server error'), 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateCheck = checkRateLimit(`ppdb_register_${ip}`, 10, 15 * 60 * 1000)
    if (!rateCheck.allowed) {
      return apiError(
        `Terlalu banyak pengiriman pendaftaran. Silakan coba lagi dalam ${rateCheck.resetInSeconds} detik.`,
        429
      )
    }

    const body = await request.json()
    const {
      gelombangId,
      jenjangId,
      jurusanId,
      jalurPendaftaran,
      nama,
      jenisKelamin,
      nisn,
      nik,
      tempatLahir,
      tanggalLahir,
      alamat,
      asalSekolah,
      nilaiRataRapor,
      noHpSiswa,
      emailSiswa,
      namaWali,
      telpWali,
      pekerjaanWali,
      hubunganWali,
      fotoUrl,
      berkasKkUrl,
      berkasIjazahUrl,
    } = body

    if (
      !gelombangId ||
      !jenjangId ||
      !nama?.trim() ||
      !jenisKelamin ||
      !tempatLahir?.trim() ||
      !tanggalLahir ||
      !alamat?.trim() ||
      !asalSekolah?.trim() ||
      !namaWali?.trim() ||
      !telpWali?.trim()
    ) {
      return apiError(
        'Gelombang, Jenjang, Biodata Calon Siswa, Asal Sekolah, dan Data Wali wajib diisi lengkap.',
        400
      )
    }

    const gId = Number(gelombangId)
    const jId = Number(jenjangId)
    const gelombang = await prisma.ppdbGelombang.findUnique({
      where: { id: gId },
      include: { _count: { select: { pendaftar: true } } },
    })

    if (!gelombang || !gelombang.isActive) {
      return apiError('Gelombang PPDB tidak ditemukan atau sudah ditutup.', 400)
    }

    const now = new Date()
    if (now < new Date(gelombang.tanggalMulai) || now > new Date(gelombang.tanggalSelesai)) {
      return apiError('Pendaftaran gelombang ini berada di luar jadwal yang dibuka.', 400)
    }

    if (gelombang._count.pendaftar >= gelombang.kuotaTotal) {
      return apiError('Kuota pendaftar untuk gelombang ini sudah penuh.', 400)
    }

    const parsedDate = new Date(tanggalLahir)
    if (Number.isNaN(parsedDate.getTime())) {
      return apiError('Format tanggal lahir tidak valid.', 400)
    }

    // Generate nomor pendaftaran unik secara aman
    const lastApplicant = await prisma.ppdbPendaftar.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    })
    let nextSeq = (lastApplicant?.id || 0) + 1
    let noPendaftaran = generateKodeRegistrasi(gelombang.tahunAjaran, nextSeq)

    while (
      await prisma.ppdbPendaftar.findUnique({
        where: { noPendaftaran },
        select: { id: true },
      })
    ) {
      nextSeq += 1
      noPendaftaran = generateKodeRegistrasi(gelombang.tahunAjaran, nextSeq)
    }

    const created = await prisma.ppdbPendaftar.create({
      data: {
        noPendaftaran,
        gelombangId: gId,
        jenjangId: jId,
        jurusanId: jurusanId ? Number(jurusanId) : null,
        jalurPendaftaran: jalurPendaftaran ? String(jalurPendaftaran).trim() : 'Reguler',
        nama: String(nama).trim(),
        jenisKelamin: jenisKelamin === 'P' ? 'P' : 'L',
        nisn: nisn ? String(nisn).trim() : null,
        nik: nik ? String(nik).trim() : null,
        tempatLahir: String(tempatLahir).trim(),
        tanggalLahir: parsedDate,
        alamat: String(alamat).trim(),
        asalSekolah: String(asalSekolah).trim(),
        nilaiRataRapor:
          nilaiRataRapor !== undefined && nilaiRataRapor !== '' && nilaiRataRapor !== null
            ? Number(nilaiRataRapor)
            : null,
        noHpSiswa: noHpSiswa ? String(noHpSiswa).trim() : null,
        emailSiswa: emailSiswa ? String(emailSiswa).trim() : null,
        namaWali: String(namaWali).trim(),
        telpWali: String(telpWali).trim(),
        pekerjaanWali: pekerjaanWali ? String(pekerjaanWali).trim() : null,
        hubunganWali: hubunganWali ? String(hubunganWali).trim() : 'Orang Tua',
        fotoUrl: fotoUrl ? String(fotoUrl).trim() : null,
        berkasKkUrl: berkasKkUrl ? String(berkasKkUrl).trim() : null,
        berkasIjazahUrl: berkasIjazahUrl ? String(berkasIjazahUrl).trim() : null,
        statusSeleksi: 'menunggu',
      },
      include: {
        gelombang: true,
        jenjang: true,
        jurusan: true,
      },
    })

    return apiSuccess({
      message: `Pendaftaran berhasil! Nomor Pendaftaran Anda: ${created.noPendaftaran}`,
      data: created,
      status: 201,
    })
  } catch (error: any) {
    console.error('API Portal PPDB POST Error:', error)
    return apiError('Gagal menyimpan pendaftaran PPDB: ' + (error?.message || 'Server error'), 500)
  }
}

