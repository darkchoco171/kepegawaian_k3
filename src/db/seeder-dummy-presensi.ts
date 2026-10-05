import 'dotenv/config';
import { db } from './index';
import { pegawai, presensiHarian } from './schema';
import { eq, sql } from 'drizzle-orm';

async function seedDummyPresensi() {
  console.log("Menyiapkan data DUMMY Presensi untuk Agustus 2026...");

  // Ambil 2 pegawai pertama di database Anda
  const pegawaiList = await db.select().from(pegawai).limit(2);
  
  if (pegawaiList.length < 2) {
    console.error("Jumlah pegawai di DB kurang dari 2. Tidak bisa jalankan dummy.");
    process.exit(1);
  }

  const p1 = pegawaiList[0]; // Pegawai Sempurna
  const p2 = pegawaiList[1]; // Pegawai ada Lupa Absen & Telat

  // Hapus presensi dummy lama (jika di-run berulang kali)
  await db.delete(presensiHarian).where(sql`EXTRACT(MONTH FROM tgl) = 8 AND EXTRACT(YEAR FROM tgl) = 2026`);

  // Tanggal kerja Agustus 2026 (19 hari)
  const tglKerja = [
    '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07',
    '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
    '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
    '2026-08-24', '2026-08-26', '2026-08-27', '2026-08-28'
  ];

  // ==========================================
//   # PEGAWAI 1: Sempurna (WFO, 0 menit telat, 0 lupa absen)
//   # Target Excel: %Pot = 0, Kehadiran 30%, Dibayarkan = Nominal Dasar
//   # ==========================================
  for (const tgl of tglKerja) {
    await db.insert(presensiHarian).values({
      idPegawai: p1.id,
      tgl: tgl,
      sistemKerja: 'WFO',
      cekIn: '07:30:00',
      cekOut: '16:00:00',
      jamMasukStandar: '07:30:00',
      jamToleransiMasuk: '08:30:00',
      jamPulangStandar: '16:00:00',
      jamToleransiPulang: '17:00:00',
      terlambat: 0,
      menitKerja: 480,
      statusAnomali: null
    });
  }
  console.log(`Dummy Pegawai 1 (${p1.namaLengkap}) - 19 Hari Sempurna berhasil diinsert.`);

  // ==========================================
//   # PEGAWAI 2: Ada Lupa Absen (2x) & Telat (Total 46 Menit)
//   # Target Excel: %Pot = 5 (dari 2 Lupa Absen), Kehadiran 28.5%
//   # ==========================================
  for (let i = 0; i < tglKerja.length; i++) {
    const tgl = tglKerja[i];
    
    if (i < 2) {
      // Hari 1 & 2: Lupa Absen (WFO tapi gak ada cekOut)
      await db.insert(presensiHarian).values({
        idPegawai: p2.id,
        tgl: tgl,
        sistemKerja: 'WFO',
        cekIn: '07:30:00',
        cekOut: null, // Lupa absen
        statusAnomali: 'LUPA_ABSEN'
      });
    } 
    else if (i < 4) {
      // Hari 3 & 4: WFO Telat (23 menit x 2 hari = 46 menit)
      await db.insert(presensiHarian).values({
        idPegawai: p2.id,
        tgl: tgl,
        sistemKerja: 'WFO',
        cekIn: '08:53:00', // Telat 23 menit
        cekOut: '16:00:00',
        terlambat: 23,
        statusAnomali: null
      });
    } 
    else if (i < 14) {
      // Hari 5-14: Dinas Luar (10 hari)
      await db.insert(presensiHarian).values({
        idPegawai: p2.id,
        tgl: tgl,
        sistemKerja: 'Dinas Luar',
        cekIn: '07:30:00',
        cekOut: '16:00:00',
        terlambat: 0,
        statusAnomali: null
      });
    } 
    else {
      // Sisa 5 hari: WFO normal
      await db.insert(presensiHarian).values({
        idPegawai: p2.id,
        tgl: tgl,
        sistemKerja: 'WFO',
        cekIn: '07:30:00',
        cekOut: '16:00:00',
        terlambat: 0,
        statusAnomali: null
      });
    }
  }
  console.log(`Dummy Pegawai 2 (${p2.namaLengkap}) - 2 Lupa Absen + 46 Menit Telat berhasil diinsert.`);

  console.log("\nSeeding Dummy Selesai! Lanjut jalankan generate-rekap.ts dan generate-tukin.ts.");
  process.exit(0);
}

seedDummyPresensi().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});