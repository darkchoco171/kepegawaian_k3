import 'dotenv/config';
import { db } from './index'; 
import { presensiHarian } from './schema';
import { eq, isNotNull } from 'drizzle-orm';

async function cekCuti() {
  const dataCuti = await db.select()
    .from(presensiHarian)
    .where(eq(presensiHarian.sistemKerja, 'Cuti'))
    .limit(5);
    
  console.log("Contoh data cuti yang masuk ke database:", dataCuti);
  process.exit(0);
}

cekCuti();