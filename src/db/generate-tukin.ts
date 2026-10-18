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
  .where(and(eq(rekapPresensiBulanan.bulan, BULAN), eq(rekapPresensiBulanan.tahun, TAHUN)));

  // Ambil histori Kinerja sebelumnya biar nggak keriset
  const existingTukin = await db.select().from(tukinBulanan).where(and(eq(tukinBulanan.bulan, BULAN), eq(tukinBulanan.tahun, TAHUN)));
  const mapTukin = new Map(existingTukin.map(t => [t.idPegawai, t]));

  let successCount = 0;

  for (const data of dataRekap) {
    let nominalDasar = parseFloat(data.nominalDasar as string) || 0;
    let persenPotonganBulanan = parseFloat(data.persentasePotongan as string) || 0;

    // RUMUS KEHADIRAN (30%) MBA NISA
    const persentaseKehadiranDesimal = (30 / 100) - (persenPotonganBulanan / 100) * (30 / 100);
    const nominalKehadiran = Math.max(0, persentaseKehadiranDesimal * nominalDasar);
    const maksKehadiran = (30 / 100) * nominalDasar;
    const jumlahPotonganKehadiran = maksKehadiran - nominalKehadiran;

    // TARIK NILAI KINERJA EKSISTING ATAU DEFAULT 100%
    const prevTukin = mapTukin.get(data.idPegawai);
    const capaianKinerja = prevTukin?.capaianKinerja || 'Baik';
    let rawPersenKinerja = prevTukin ? parseFloat(prevTukin.persentaseKinerja as string) : 1.0;
    if (rawPersenKinerja === 1 || isNaN(rawPersenKinerja)) {
      rawPersenKinerja = 0.70;
    }
    const persentaseKinerja = rawPersenKinerja;
    const hasilKerja = prevTukin?.hasilKerja || 'Sesuai Ekspektasi';
    const perilakuKerja = prevTukin?.perilakuKerja || 'Sesuai Ekspektasi';

    const nominalKinerja = nominalDasar * persentaseKinerja;

    const statusPegawai = (data.jenisKepegawaian || "").toUpperCase();
    const isPnsPppk = statusPegawai.includes("PNS") || statusPegawai.includes("PPPK");

    let totalDibayarkan = nominalKehadiran + nominalKinerja;
    if (isPnsPppk) totalDibayarkan = totalDibayarkan * (80 / 100);

    // EKSEKUSI UPSERT
    await db.insert(tukinBulanan).values({
      idPegawai: data.idPegawai,
      idMasterJabatan: data.idJabatan, 
      idRekapPresensiBulanan: data.idRekap,
      bulan: BULAN, tahun: TAHUN,
      nominalDasar: nominalDasar.toString(),
      hasilKerja: hasilKerja,
      perilakuKerja: perilakuKerja,
      capaianKinerja: capaianKinerja,
      persentaseKinerja: persentaseKinerja.toFixed(4),
      nominalKinerja: Math.round(nominalKinerja).toString(),
      dibayarkan: totalDibayarkan.toString(),
    }).onConflictDoUpdate({
      target: [tukinBulanan.idPegawai, tukinBulanan.bulan, tukinBulanan.tahun],
      set: {
        idRekapPresensiBulanan: data.idRekap,
        nominalDasar: nominalDasar.toString(),
        nominalKinerja: nominalKinerja.toString(),
        dibayarkan: totalDibayarkan.toString(),
        updatedAt: new Date(),
      }
    });
    
    // UPDATE REKAP PRESENSI 
    await db.update(rekapPresensiBulanan).set({
      nominalKehadiran: nominalKehadiran.toString(),
      jumlahPotonganKehadiran: jumlahPotonganKehadiran.toString()
    }).where(eq(rekapPresensiBulanan.id, data.idRekap));

    successCount++;
  }

  console.log(`Berhasil nge-generate & update ${successCount} data Tukin secara presisi!`);
  process.exit(0);
}

generateTukin();