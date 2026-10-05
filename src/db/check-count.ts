import 'dotenv/config';
import { db } from './index'; 
import { presensiHarian } from './schema';
import * as xlsx from 'xlsx';
import { sql } from 'drizzle-orm';

async function checkCount() {
  console.log("Menghitung total baris di database...");
  const dbResult = await db.select({ count: sql<number>`count(*)` }).from(presensiHarian);
  const totalDb = Number(dbResult[0].count);

  console.log("Membaca file Excel...");
  const workbook = xlsx.readFile('data_presensi.xlsx', { cellDates: true });
  const rows: any[][] = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: null });

  // Hitung baris valid di Excel (mengabaikan baris kosong total)
  let excelValidRows = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row && row.length > 0 && !row.every(cell => cell === null)) {
      const col0 = String(row[0]).trim().toLowerCase();
      const col1 = String(row[1]).trim().toLowerCase();
      // Abaikan baris header / metadata
      if (col0 !== 'no' && col1 !== 'nama pegawai' && !(col0 === '1' && col1 === '2')) {
        excelValidRows++;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Total Baris di Database  : ${totalDb}`);
  console.log(`Total Baris Valid di Excel : ${excelValidRows}`);
  console.log(`Selisih                  : ${excelValidRows - totalDb} baris`);
  console.log(`========================================\n`);

  process.exit(0);
}

checkCount().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});