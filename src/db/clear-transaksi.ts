import path from "path";
import * as dotenv from "dotenv";
import { db } from "./index";
import { absensi, cuti } from "./schema";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function clearTransaksi() {
  console.log("🧹 Menghapus semua data absensi dan cuti...");
  
  // Hapus tabel cuti dulu karena punya foreign key ke absensi
  await db.delete(cuti);
  // Baru hapus tabel absensi
  await db.delete(absensi);

  console.log("✨ Berhasil mengosongkan tabel absensi & cuti!");
  process.exit(0);
}

clearTransaksi().catch((err) => {
  console.error("Gagal menghapus data:", err);
  process.exit(1);
});