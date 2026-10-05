import { db } from './index';
import {
  masterKelasJabatan,
  masterJabatan,
  masterPangkatGolongan,
} from './schema';
import { eq } from 'drizzle-orm';

// Nominal dasar tukin per kelas jabatan.
const dataKelasTukin = [
  { kelasJabatan: 1, baseTukin: '2531250' },
  { kelasJabatan: 2, baseTukin: '2708250' },
  { kelasJabatan: 3, baseTukin: '2898000' },
  { kelasJabatan: 4, baseTukin: '2985000' },
  { kelasJabatan: 5, baseTukin: '3134250' },
  { kelasJabatan: 6, baseTukin: '3510400' },
  { kelasJabatan: 7, baseTukin: '3915950' },
  { kelasJabatan: 8, baseTukin: '4595150' },
  { kelasJabatan: 9, baseTukin: '5079200' },
  { kelasJabatan: 10, baseTukin: '5979200' },
  { kelasJabatan: 11, baseTukin: '8757600' },
  { kelasJabatan: 12, baseTukin: '9896000' },
  { kelasJabatan: 13, baseTukin: '10936000' },
  { kelasJabatan: 14, baseTukin: '17064000' },
  { kelasJabatan: 15, baseTukin: '19280000' },
  { kelasJabatan: 16, baseTukin: '27577500' },
  { kelasJabatan: 17, baseTukin: '33240000' },
];

const dataPangkatGolongan = [
  { jenisKepegawaian: 'PNS', pangkat: 'Pengatur', golongan: 'II/c', angkaKreditMinimal: '20.00', urutanJenjang: 1 },
  { jenisKepegawaian: 'PNS', pangkat: 'Pengatur Tk. I', golongan: 'II/d', angkaKreditMinimal: '20.00', urutanJenjang: 2 },
  { jenisKepegawaian: 'PNS', pangkat: 'Penata Muda', golongan: 'III/a', angkaKreditMinimal: '50.00', urutanJenjang: 3 },
  { jenisKepegawaian: 'PNS', pangkat: 'Penata Muda Tk. I', golongan: 'III/b', angkaKreditMinimal: '50.00', urutanJenjang: 4 },
  { jenisKepegawaian: 'PNS', pangkat: 'Penata', golongan: 'III/c', angkaKreditMinimal: '100.00', urutanJenjang: 5 },
  { jenisKepegawaian: 'PNS', pangkat: 'Penata Tk. I', golongan: 'III/d', angkaKreditMinimal: '100.00', urutanJenjang: 6 },
  { jenisKepegawaian: 'PNS', pangkat: 'Pembina', golongan: 'IV/a', angkaKreditMinimal: '150.00', urutanJenjang: 7 },
  { jenisKepegawaian: 'PNS', pangkat: 'Pembina Tk. I', golongan: 'IV/b', angkaKreditMinimal: '150.00', urutanJenjang: 8 },
  { jenisKepegawaian: 'PNS', pangkat: 'Pembina Utama Muda', golongan: 'IV/c', angkaKreditMinimal: '150.00', urutanJenjang: 9 },
  { jenisKepegawaian: 'PPPK', pangkat: 'PPPK', golongan: 'VII', angkaKreditMinimal: null, urutanJenjang: 100 },
  { jenisKepegawaian: 'PPPK', pangkat: 'PPPK', golongan: 'IX', angkaKreditMinimal: null, urutanJenjang: 101 },
  { jenisKepegawaian: 'NON-ASN', pangkat: 'Tenaga Non-ASN', golongan: '-', angkaKreditMinimal: null, urutanJenjang: 999 },
];

const dataJabatan = [
  { namaJabatan: 'Direktur Bina Kelembagaan Keselamatan dan Kesehatan Kerja', kelasJabatan: 15, jenisJabatan: 'Pimpinan Tinggi Pratama' },
  { namaJabatan: 'Pengawas Ketenagakerjaan Ahli Utama', kelasJabatan: 14, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Penguji K3 Ahli Madya', kelasJabatan: 12, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Pengawas Ketenagakerjaan Ahli Madya', kelasJabatan: 12, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Pengawas Ketenagakerjaan Ahli Muda', kelasJabatan: 10, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Penguji K3 Ahli Muda', kelasJabatan: 10, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Kepala Sub Bagian Tata Usaha', kelasJabatan: 10, jenisJabatan: 'Administrasi Pengawas' },
  { namaJabatan: 'Analis Sumber Daya Manusia Aparatur Ahli Pertama', kelasJabatan: 8, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Pranata Komputer Ahli Pertama', kelasJabatan: 8, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Penguji K3 Ahli Pertama', kelasJabatan: 8, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Pengawas Ketenagakerjaan Ahli Pertama', kelasJabatan: 8, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Analis Pengelolaan Keuangan APBN Ahli Pertama', kelasJabatan: 8, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Arsiparis Ahli Pertama', kelasJabatan: 8, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Penelaah Teknis Kebijakan', kelasJabatan: 7, jenisJabatan: 'Administrasi Pelaksana' },
  { namaJabatan: 'Penata Layanan Operasional', kelasJabatan: 7, jenisJabatan: 'Administrasi Pelaksana' },
  { namaJabatan: 'Penata Kelola Sistem dan Teknologi Informasi', kelasJabatan: 7, jenisJabatan: 'Administrasi Pelaksana' },
  { namaJabatan: 'Arsiparis Mahir', kelasJabatan: 7, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Pranata Keuangan APBN Terampil', kelasJabatan: 7, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Pranata Komputer Mahir', kelasJabatan: 7, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Arsiparis Terampil', kelasJabatan: 6, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Pranata Komputer Terampil', kelasJabatan: 6, jenisJabatan: 'Fungsional' },
  { namaJabatan: 'Pengemudi' },
  { namaJabatan: 'Petugas Kebersihan' },
];

async function seedMaster() {
  console.log('Memulai proses seeding data master...');

  try {
    // 1. Master Kelas Jabatan / Tukin
    const kelasMap = new Map<number, string>();

    for (const item of dataKelasTukin) {
      const existing = await db.query.masterKelasJabatan.findFirst({
        where: eq(masterKelasJabatan.kelasJabatan, item.kelasJabatan),
      });

      if (!existing) {
        const [inserted] = await db
          .insert(masterKelasJabatan)
          .values({
            kelasJabatan: item.kelasJabatan,
            baseTukin: item.baseTukin,
          })
          .returning({ id: masterKelasJabatan.id });
        kelasMap.set(item.kelasJabatan, inserted.id);
      } else {
        kelasMap.set(item.kelasJabatan, existing.id);
      }
    }
    console.log('Master Kelas Jabatan berhasil diisi.');

    // 2. Master Pangkat & Golongan
    for (const item of dataPangkatGolongan) {
      const existing = await db.query.masterPangkatGolongan.findFirst({
        where: eq(masterPangkatGolongan.golongan, item.golongan),
      });

      if (!existing) {
        await db.insert(masterPangkatGolongan).values({
          jenisKepegawaian: item.jenisKepegawaian as 'PNS' | 'PPPK' | 'NON-ASN',
          pangkat: item.pangkat,
          golongan: item.golongan,
          angkaKreditMinimal: item.angkaKreditMinimal,
          urutanJenjang: item.urutanJenjang,
        });
      }
    }
    console.log('Master Pangkat & Golongan berhasil diisi.');

    // 3. Master Jabatan
    for (const item of dataJabatan) {
      const idKelas = item.kelasJabatan
        ? kelasMap.get(item.kelasJabatan)
        : null;

      if (item.kelasJabatan && !idKelas) {
        console.warn(`ID Kelas Jabatan ${item.kelasJabatan} tidak ditemukan untuk "${item.namaJabatan}", dilewati.`);
        continue;
      }

      const existing = await db.query.masterJabatan.findFirst({
        where: eq(masterJabatan.namaJabatan, item.namaJabatan),
      });

      if (!existing) {
        await db.insert(masterJabatan).values({
          namaJabatan: item.namaJabatan,
          jenisJabatan: item.jenisJabatan ?? null,
          idKelasJabatan: idKelas ?? null,
        });
      }
    }
    console.log('Master Jabatan berhasil diisi.');

    console.log('Seeding data master selesai!');
  } catch (error) {
    console.error('❌Terjadi kesalahan saat seeding master:', error);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

seedMaster();