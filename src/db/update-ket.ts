import 'dotenv/config';
import { db } from './index';
import { pegawai } from './schema';
import { eq, ilike } from 'drizzle-orm';

async function updateKeterangan() {
  await db.update(pegawai)
    .set({ keterangan: 'Dit. Bina Wasuji' })
    .where(ilike(pegawai.namaLengkap, '%Tresye Widiastuty Paidi%'));

  console.log("Berhasil update keterangan pegawai!");
  process.exit(0);
}

updateKeterangan();