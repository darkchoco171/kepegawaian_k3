import 'dotenv/config';
import { db } from './index'; 
import { presensiHarian } from './schema';

async function clearPresensi() {
  console.log("Lagi mangkas semua record presensi harian...");
  
  // Perintah DELETE tanpa kondisi WHERE buat ngosongin seluruh isi tabel presensi_harian
  await db.delete(presensiHarian);
  
  console.log("Mantap! Tabel presensi_harian sekarang udah bersih dan kosong.");
  process.exit(0);
}

clearPresensi().catch((err) => {
  console.error("Gagal ngebersihin tabel:", err);
  process.exit(1);
});