// src/lib/tukin/tukin.ts
'use server';

import { db } from '@/db'; // Sesuaikan path db drizzle lu
import { 
  rekapPresensiBulanan, 
  tukinBulanan, 
  pegawai, 
  masterJabatan, 
  masterKelasJabatan, 
  masterPangkatGolongan 
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// ============================================================
// 1. FUNGSI READ: Ambil Data Tukin & Rekap Presensi
// ============================================================
export async function getTukinData(bulan: number = 8, tahun: number = 2026) {
  try {
    const data = await db
      .select({
        idRekap: rekapPresensiBulanan.id,
        idPegawai: pegawai.id,
        nip: pegawai.nip,
        nama: pegawai.namaLengkap,
        jabatan: masterJabatan.namaJabatan,
        baseTukin: masterKelasJabatan.baseTukin,
        jenisKepegawaian: masterPangkatGolongan.jenisKepegawaian,
        // Kolom presensi asli dari skema
        hariKerja: rekapPresensiBulanan.hariKerja,
        totalMenitTerlambat: rekapPresensiBulanan.totalMenitTerlambat,
        jumlahLupaAbsen: rekapPresensiBulanan.jumlahLupaAbsen,
        jumlahAlpa: rekapPresensiBulanan.jumlahAlpa,
        persentasePotongan: rekapPresensiBulanan.persentasePotongan,
        persentaseKehadiran: rekapPresensiBulanan.persentaseKehadiran,
        nominalKehadiran: rekapPresensiBulanan.nominalKehadiran,
        jumlahPotonganKehadiran: rekapPresensiBulanan.jumlahPotonganKehadiran,
      })
      .from(rekapPresensiBulanan)
      .innerJoin(pegawai, eq(rekapPresensiBulanan.idPegawai, pegawai.id))
      .leftJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
      .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id))
      .leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id))
      .where(
        and(
          eq(rekapPresensiBulanan.bulan, bulan),
          eq(rekapPresensiBulanan.tahun, tahun)
        )
      );

    return { status: 'success', data };
  } catch (error: any) {
    console.error('Gagal mengambil data Tukin:', error);
    return { status: 'error', message: error.message, data: [] };
  }
}

// ============================================================
// 2. FUNGSI UPDATE / DISPENSASI: Edit Manual Angka Rekap
// ============================================================
export async function updateDispensasiRekap(
  idRekap: string, // UUID
  payload: {
    jumlahLupaAbsen: number;
    totalMenitTerlambat: number;
    jumlahAlpa: number;
  }
) {
  try {
    // 1. Hitung Ulang Persentase Potongan berdasarkan rumus poin
    // Rumus: (terlambat * 0.01) + (lupa_absen * 1) + (alpa * 3)
    const potTerlambat = payload.totalMenitTerlambat * 0.01;
    const potLupaAbsen = payload.jumlahLupaAbsen * 1.0;
    const potAlpa = payload.jumlahAlpa * 3.0;

    const totalPotonganPersen = potTerlambat + potLupaAbsen + potAlpa;
    
    // Rumus Kehadiran: Maksimal 30% dikurangi potongan (dikali faktor skala kehadiran 0.3)
    const persentaseKehadiran = Math.max(0, 30 - (totalPotonganPersen * 0.3));

    // 2. Update langsung ke database (skema original)
    await db
      .update(rekapPresensiBulanan)
      .set({
        jumlahLupaAbsen: payload.jumlahLupaAbsen,
        totalMenitTerlambat: payload.totalMenitTerlambat,
        jumlahAlpa: payload.jumlahAlpa,
        persentasePotongan: totalPotonganPersen.toFixed(4),
        persentaseKehadiran: persentaseKehadiran.toFixed(4),
      })
      .where(eq(rekapPresensiBulanan.id, idRekap));

    // 3. Trigger Revalidate cache Next.js supaya UI langsung ke-refresh otomatis
    revalidatePath('/tukin');

    return { status: 'success', message: 'Data rekap berhasil diperbarui!' };
  } catch (error: any) {
    console.error('Gagal update dispensasi rekap:', error);
    return { status: 'error', message: error.message };
  }
}