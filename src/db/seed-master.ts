import { db } from './index';
import {
  masterKelasJabatan,
  masterJabatan,
  masterPangkatGolongan,
  masterJenjang,
  namaJenjangEnum,
} from './schema';
import { eq } from 'drizzle-orm';

type NamaJenjang = (typeof namaJenjangEnum.enumValues)[number];

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

// Master Jenjang (Berdasarkan Rumpun BKN)
const dataMasterJenjang: { namaJenjang: NamaJenjang; koefisienTahunan: string; targetAkNaik: string }[] = [
  // Keahlian
  { namaJenjang: 'Ahli Pertama', koefisienTahunan: '12.5', targetAkNaik: '50' },
  { namaJenjang: 'Ahli Muda', koefisienTahunan: '25', targetAkNaik: '100' },
  { namaJenjang: 'Ahli Madya', koefisienTahunan: '37.5', targetAkNaik: '150' },
  { namaJenjang: 'Ahli Utama', koefisienTahunan: '50', targetAkNaik: '200' },
  // Keterampilan
  { namaJenjang: 'Pemula', koefisienTahunan: '3.75', targetAkNaik: '15' },
  { namaJenjang: 'Terampil', koefisienTahunan: '5', targetAkNaik: '20' },
  { namaJenjang: 'Mahir', koefisienTahunan: '12.5', targetAkNaik: '50' },
  { namaJenjang: 'Penyelia', koefisienTahunan: '25', targetAkNaik: '100' },
];

const dataPangkatGolongan = [
  // Keterampilan / Golongan II
  { jenisKepegawaian: 'PNS', pangkat: 'Pengatur Muda', golongan: 'II/a', angkaKreditMinimal: '20.00', urutanJenjang: 0, jenjangTarget: 'Pemula' },
  { jenisKepegawaian: 'PNS', pangkat: 'Pengatur Muda Tk. I', golongan: 'II/b', angkaKreditMinimal: '20.00', urutanJenjang: 1, jenjangTarget: 'Terampil' },
  { jenisKepegawaian: 'PNS', pangkat: 'Pengatur', golongan: 'II/c', angkaKreditMinimal: '20.00', urutanJenjang: 2, jenjangTarget: 'Terampil' },
  { jenisKepegawaian: 'PNS', pangkat: 'Pengatur Tk. I', golongan: 'II/d', angkaKreditMinimal: '20.00', urutanJenjang: 3, jenjangTarget: 'Terampil' },

  // Keahlian / Golongan III
  { jenisKepegawaian: 'PNS', pangkat: 'Penata Muda', golongan: 'III/a', angkaKreditMinimal: '50.00', urutanJenjang: 4, jenjangTarget: 'Ahli Pertama' },
  { jenisKepegawaian: 'PNS', pangkat: 'Penata Muda Tk. I', golongan: 'III/b', angkaKreditMinimal: '50.00', urutanJenjang: 5, jenjangTarget: 'Ahli Pertama' },
  { jenisKepegawaian: 'PNS', pangkat: 'Penata', golongan: 'III/c', angkaKreditMinimal: '100.00', urutanJenjang: 6, jenjangTarget: 'Ahli Muda' },
  { jenisKepegawaian: 'PNS', pangkat: 'Penata Tk. I', golongan: 'III/d', angkaKreditMinimal: '100.00', urutanJenjang: 7, jenjangTarget: 'Ahli Muda' },

  // Keahlian / Golongan IV
  { jenisKepegawaian: 'PNS', pangkat: 'Pembina', golongan: 'IV/a', angkaKreditMinimal: '150.00', urutanJenjang: 8, jenjangTarget: 'Ahli Madya' },
  { jenisKepegawaian: 'PNS', pangkat: 'Pembina Tk. I', golongan: 'IV/b', angkaKreditMinimal: '150.00', urutanJenjang: 9, jenjangTarget: 'Ahli Madya' },
  { jenisKepegawaian: 'PNS', pangkat: 'Pembina Utama Muda', golongan: 'IV/c', angkaKreditMinimal: '150.00', urutanJenjang: 10, jenjangTarget: 'Ahli Madya' },
  { jenisKepegawaian: 'PNS', pangkat: 'Pembina Utama Madya', golongan: 'IV/d', angkaKreditMinimal: '150.00', urutanJenjang: 11, jenjangTarget: 'Ahli Utama' },
  { jenisKepegawaian: 'PNS', pangkat: 'Pembina Utama', golongan: 'IV/e', angkaKreditMinimal: '150.00', urutanJenjang: 12, jenjangTarget: 'Ahli Utama' },

  // Lainnya
  { jenisKepegawaian: 'PPPK', pangkat: 'PPPK', golongan: 'VII', angkaKreditMinimal: null, urutanJenjang: 100, jenjangTarget: null },
  { jenisKepegawaian: 'PPPK', pangkat: 'PPPK', golongan: 'IX', angkaKreditMinimal: null, urutanJenjang: 101, jenjangTarget: null },
  { jenisKepegawaian: 'NON-ASN', pangkat: 'Tenaga Non-ASN', golongan: '-', angkaKreditMinimal: null, urutanJenjang: 999, jenjangTarget: null },
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

    // 2. Master Jenjang (Keahlian & Keterampilan)
    const jenjangMap = new Map<string, string>();

    for (const item of dataMasterJenjang) {
      const existing = await db.query.masterJenjang.findFirst({
        where: eq(masterJenjang.namaJenjang, item.namaJenjang),
      });

      if (!existing) {
        const [inserted] = await db
          .insert(masterJenjang)
          .values({
            namaJenjang: item.namaJenjang,
            koefisienTahunan: item.koefisienTahunan,
            targetAkNaik: item.targetAkNaik,
          })
          .returning({ id: masterJenjang.id });
        jenjangMap.set(item.namaJenjang, inserted.id);
      } else {
        await db
          .update(masterJenjang)
          .set({
            koefisienTahunan: item.koefisienTahunan,
            targetAkNaik: item.targetAkNaik,
          })
          .where(eq(masterJenjang.id, existing.id));
        jenjangMap.set(item.namaJenjang, existing.id);
      }
    }
    console.log('Master Jenjang berhasil diisi.');

    // 3. Master Pangkat & Golongan (Dilink ke master_jenjang)
    const existingPangkatGolongan = await db
      .select({
        id: masterPangkatGolongan.id,
        golongan: masterPangkatGolongan.golongan,
        urutanJenjang: masterPangkatGolongan.urutanJenjang,
      })
      .from(masterPangkatGolongan);
    const pangkatGolonganMap = new Map(
      existingPangkatGolongan.map((item) => [item.golongan, item]),
    );

    let temporaryUrutan = existingPangkatGolongan.reduce(
      (max, item) => Math.max(max, item.urutanJenjang),
      0,
    ) + 1;
    for (const item of dataPangkatGolongan) {
      const existing = pangkatGolonganMap.get(item.golongan);
      if (existing) {
        await db
          .update(masterPangkatGolongan)
          .set({ urutanJenjang: temporaryUrutan })
          .where(eq(masterPangkatGolongan.id, existing.id));
        temporaryUrutan += 1;
      }
    }

    for (const item of dataPangkatGolongan) {
      const existing = pangkatGolonganMap.get(item.golongan);
      const idJenjang = item.jenjangTarget ? jenjangMap.get(item.jenjangTarget) : null;

      if (!existing) {
        await db.insert(masterPangkatGolongan).values({
          idMasterJenjang: idJenjang ?? null,
          jenisKepegawaian: item.jenisKepegawaian as 'PNS' | 'PPPK' | 'NON-ASN',
          pangkat: item.pangkat,
          golongan: item.golongan,
          angkaKreditMinimal: item.angkaKreditMinimal,
          urutanJenjang: item.urutanJenjang,
        });
      } else {
        await db
          .update(masterPangkatGolongan)
          .set({
            idMasterJenjang: idJenjang ?? null,
            jenisKepegawaian: item.jenisKepegawaian as 'PNS' | 'PPPK' | 'NON-ASN',
            pangkat: item.pangkat,
            angkaKreditMinimal: item.angkaKreditMinimal,
            urutanJenjang: item.urutanJenjang,
          })
          .where(eq(masterPangkatGolongan.id, existing.id));
      }
    }
    console.log('Master Pangkat & Golongan berhasil diisi.');

    // 4. Master Jabatan
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
    console.error('❌ Terjadi kesalahan saat seeding master:', error);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

seedMaster();