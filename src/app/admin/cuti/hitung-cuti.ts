// src/app/admin/cuti/hitung-cuti.ts
import { db } from '@/lib/db';
import { pengajuanCuti } from '@/db/schema';
import { eq, and, inArray, sum } from 'drizzle-orm';

export async function getSisaCutiPegawai(idPegawai: string) {
  // 1. Ambil total hari cuti yang memotong kuota (Tahunan & Sakit) yang DISETUJUI
  const result = await db
    .select({
      totalTerpakai: sum(pengajuanCuti.jumlahHari)
    })
    .from(pengajuanCuti)
    .where(
      and(
        eq(pengajuanCuti.idPegawai, idPegawai),
        eq(pengajuanCuti.statusPengajuan, 'Disetujui'),
        inArray(pengajuanCuti.jenisCuti, ['Tahunan', 'Sakit'])
      )
    );

  const cutiTerpakai = Number(result[0]?.totalTerpakai || 0);

  // 2. Logika Potongan N-2 (Maks total 36 hari dari 3 tahun)
  let jatahN2 = 12; // 2024
  let jatahN1 = 12; // 2025
  let jatahN = 12;  // 2026

  let sisaPotongan = cutiTerpakai;

  if (sisaPotongan > 0) {
    const potong = Math.min(jatahN2, sisaPotongan);
    jatahN2 -= potong;
    sisaPotongan -= potong;
  }
  if (sisaPotongan > 0) {
    const potong = Math.min(jatahN1, sisaPotongan);
    jatahN1 -= potong;
    sisaPotongan -= potong;
  }
  if (sisaPotongan > 0) {
    const potong = Math.min(jatahN, sisaPotongan);
    jatahN -= potong;
  }

  const totalSisa = jatahN2 + jatahN1 + jatahN;

  return {
    terpakai: cutiTerpakai,
    totalSisa,
    totalMaks: 36, // Total jatah 3 tahun
  };
}