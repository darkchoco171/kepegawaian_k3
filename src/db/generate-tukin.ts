import 'dotenv/config';
import { db } from './index';
import { tukinBulanan, pegawai, rekapPresensiBulanan, masterJabatan, masterKelasJabatan, masterPangkatGolongan } from './schema';
import { eq, and } from 'drizzle-orm';

async function generateTukin() {
  const BULAN = 8;
  const TAHUN = 2026;

  console.log(`Mencari data rekap presensi bulan ${BULAN}/${TAHUN}...`);

  const dataRekap = await db.select({
    idRekap: rekapPresensiBulanan.id,
    idPegawai: pegawai.id,
    nama: pegawai.namaLengkap,
    persentasePotongan: rekapPresensiBulanan.persentasePotongan,
    nominalDasar: masterKelasJabatan.baseTukin,
    idJabatan: masterJabatan.id,
    jenisKepegawaian: masterPangkatGolongan.jenisKepegawaian,
  })
  .from(rekapPresensiBulanan)
  .innerJoin(pegawai, eq(rekapPresensiBulanan.idPegawai, pegawai.id))
  .innerJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
  .innerJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id))
  .leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id))
  .where(
    and(
      eq(rekapPresensiBulanan.bulan, BULAN),
      eq(rekapPresensiBulanan.tahun, TAHUN)
    )
  );

  console.log(`Dapat ${dataRekap.length} data rekap bersih. Menghitung Tukin...`);

  const tukinToInsert = [];

  for (const data of dataRekap) {
    // FIX: parseFloat lebih aman buat DB string, ada fallback 0
    let nominalDasar = parseFloat(data.nominalDasar as string) || 0;
    let persenPotonganBulanan = parseFloat(data.persentasePotongan as string) || 0;

    // FIX: Kalau ada NaN dipaksa jadi 0
    if (isNaN(nominalDasar)) nominalDasar = 0;
    if (isNaN(persenPotonganBulanan)) persenPotonganBulanan = 0;

    const persentaseKehadiran = (30 / 100) - (persenPotonganBulanan / 100) * (30 / 100);
    const nominalKehadiran = Math.max(0, persentaseKehadiran * nominalDasar);
    const maksKehadiran = (30 / 100) * nominalDasar;
    const jumlahPotonganKehadiran = maksKehadiran - nominalKehadiran;

    const capaianKinerja = 'Baik';
    const persentaseKinerja = 1.00;
    const nominalKinerja = nominalDasar * (70 / 100);

    const statusPegawai = (data.jenisKepegawaian || "").toUpperCase();
    const isCpnsCpppk = statusPegawai.includes("CPNS") || statusPegawai.includes("CPPPK");

    let totalDibayarkan = nominalKehadiran + nominalKinerja;
    if (isCpnsCpppk) {
      totalDibayarkan = totalDibayarkan * (80 / 100);
    }

    if (isNaN(totalDibayarkan)) totalDibayarkan = 0;

    tukinToInsert.push({
      idPegawai: data.idPegawai,
      idMasterJabatan: data.idJabatan, 
      idRekapPresensiBulanan: data.idRekap,
      bulan: BULAN, tahun: TAHUN,
      nominalDasar: nominalDasar.toFixed(2),
      hasilKerja: 'Sesuai Ekspektasi',
      perilakuKerja: 'Sesuai Ekspektasi',
      capaianKinerja: capaianKinerja,
      persentaseKinerja: persentaseKinerja.toFixed(4),
      nominalKinerja: nominalKinerja.toFixed(2),
      dibayarkan: totalDibayarkan.toFixed(2),
    });
    
    await db.update(rekapPresensiBulanan).set({
      nominalKehadiran: nominalKehadiran.toFixed(2),
      jumlahPotonganKehadiran: jumlahPotonganKehadiran.toFixed(2)
    }).where(eq(rekapPresensiBulanan.id, data.idRekap));
  }

  if (tukinToInsert.length > 0) {
    try {
      await db.delete(tukinBulanan)
        .where(and(eq(tukinBulanan.bulan, BULAN), eq(tukinBulanan.tahun, TAHUN)));
      await db.insert(tukinBulanan).values(tukinToInsert);
      console.log(`Berhasil nge-generate ${tukinToInsert.length} data Tukin!`);
    } catch (error) {
      console.error("Gagal insert tukin:", error);
    }
  }

  process.exit(0);
}

generateTukin();