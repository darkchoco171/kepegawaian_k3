import 'dotenv/config';
import { db } from './index';
import { tukinBulanan, pegawai, rekapPresensiBulanan } from './schema';
import { eq } from 'drizzle-orm';

async function cekHasil() {
  // Ambil 5 data pertama aja buat sampel
  const hasil = await db.select({
    nama: pegawai.namaLengkap,
    hariKerja: rekapPresensiBulanan.hariKerja,
    nominalDasar: tukinBulanan.nominalDasar,
    dibayarkan: tukinBulanan.dibayarkan
  })
  .from(tukinBulanan)
  .innerJoin(pegawai, eq(tukinBulanan.idPegawai, pegawai.id))
  .innerJoin(rekapPresensiBulanan, eq(tukinBulanan.idRekapPresensiBulanan, rekapPresensiBulanan.id))
  .limit(5);

  console.table(hasil);
  process.exit(0);
}

cekHasil();