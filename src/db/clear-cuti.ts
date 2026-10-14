import { db } from './index';
import { pengajuanCuti } from './schema';
import { sql } from 'drizzle-orm';

async function clearCuti() {
  console.log('Sedang membersihkan seluruh data pengajuan cuti...');
  
  // Menghapus semua baris dan mereset ID sequence-nya
  await db.execute(sql`TRUNCATE TABLE ${pengajuanCuti} RESTART IDENTITY CASCADE`);
  
  console.log('Beres! Tabel pengajuan_cuti sekarang bersih total.');
  process.exit(0);
}

clearCuti().catch((err) => {
  console.error('Gagal membersihkan tabel cuti:', err);
  process.exit(1);
});