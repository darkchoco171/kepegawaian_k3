// src/app/admin/cuti/hitung-cuti.ts
import { db } from '@/lib/db';
import { sisaCuti } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ANNUAL_CUTI_QUOTA, LAST_IMPORTED_BALANCE_YEAR } from './cuti-utils';

export async function getSisaCutiPegawai(
  idPegawai: string,
  currentYear = new Date().getFullYear(),
) {
  const tahunN2 = currentYear - 2;
  const tahunN1 = currentYear - 1;
  const tahunN = currentYear;

  // 1. Ambil Jatah Awal / Jatah Migrasi dari tabel sisa_cuti
  const dataSisaAwal = await db
    .select()
    .from(sisaCuti)
    .where(eq(sisaCuti.idPegawai, idPegawai));

  const getSaldo = (year: number) =>
    dataSisaAwal.find((row) => row.tahun === year)?.sisa ??
    (year > LAST_IMPORTED_BALANCE_YEAR ? ANNUAL_CUTI_QUOTA : 0);
  const jatahN2 = getSaldo(tahunN2);
  const jatahN1 = getSaldo(tahunN1);
  const jatahN = getSaldo(tahunN);

  const totalMaksAwal = ANNUAL_CUTI_QUOTA * 3;
  const totalSisa = jatahN2 + jatahN1 + jatahN;
  const totalTerpakai = Math.max(0, totalMaksAwal - totalSisa);

  return {
    terpakai: totalTerpakai,
    totalSisa,
    totalMaks: totalMaksAwal,
    sisaN2: jatahN2,
    sisaN1: jatahN1,
    sisaN: jatahN,
  };
}