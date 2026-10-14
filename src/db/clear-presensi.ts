import 'dotenv/config';
import { db } from './index';
import { presensiHarian, rekapPresensiBulanan, tukinBulanan, pengajuanCuti } from './schema';

async function clearPresensi() {
  console.log("Memulai pembersihan data presensi & kinerja...");

  // 1. Hapus Tukin Bulanan / Manajemen Kinerja (punya foreign key ke rekap_presensi_bulanan)
  console.log("→ Menghapus data tukin bulanan & manajemen kinerja...");
  await db.delete(tukinBulanan);


  // 2. Hapus Rekap Presensi Bulanan
  console.log("→ Menghapus data rekap presensi bulanan...");
  await db.delete(rekapPresensiBulanan);

  // 3. Hapus Presensi Harian
  console.log("→ Menghapus data presensi harian...");
  await db.delete(presensiHarian);

  // 4. Hapus Pengajuan Cuti
  console.log("→ Menghapus data pengajuan cuti...");
  await db.delete(pengajuanCuti);
  

  console.log("Semua data presensi harian, rekapitulasi bulanan, manajemen kinerja, dan tukin berhasil dibersihkan.");
  process.exit(0);
}

clearPresensi().catch((err) => {
  console.error("Gagal membersihkan data:", err);
  process.exit(1);
});