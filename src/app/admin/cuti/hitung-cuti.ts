// src/app/admin/cuti/hitung-cuti.ts
import { db } from '@/lib/db';
import { sisaCuti } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getSisaCutiPegawai(idPegawai: string) {
  const currentYear = 2026; // Kalau mau dinamis bisa pakai new Date().getFullYear()
  const tahunN2 = currentYear - 2; // 2024
  const tahunN1 = currentYear - 1; // 2025
  const tahunN  = currentYear;     // 2026

  // 1. Ambil Jatah Awal / Jatah Migrasi dari tabel sisa_cuti
  const dataSisaAwal = await db
    .select()
    .from(sisaCuti)
    .where(eq(sisaCuti.idPegawai, idPegawai));

  // Tahun tanpa saldo tersimpan tidak menambah akumulasi sisa cuti.
  const jatahN2 = dataSisaAwal.find((s) => s.tahun === tahunN2)?.sisa ?? 0;
  const jatahN1 = dataSisaAwal.find((s) => s.tahun === tahunN1)?.sisa ?? 0;
  const jatahN  = dataSisaAwal.find((s) => s.tahun === tahunN)?.sisa ?? 0;

  const totalMaksAwal = 12 * 3;
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