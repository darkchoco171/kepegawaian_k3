// src/app/admin/tukin/dummy-actions.ts
'use server';

import { db } from '@/lib/db';
import { rekapPresensiBulanan, pegawai, masterJabatan, masterKelasJabatan } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function injectDummyPresensi() {
  try {
    // 1. Tarik semua pegawai beserta Base Tukin-nya
    const allPegawai = await db
      .select({
        idPegawai: pegawai.id,
        baseTukin: masterKelasJabatan.baseTukin,
      })
      .from(pegawai)
      .leftJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
      .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id));

    const bulan = 10; // Kita set ke Oktober
    const tahun = 2026; // Tahun saat ini

    // 2. Loop dan masukin data dummy presensi (Asumsi 100% hadir)
    for (const p of allPegawai) {
      if (!p.baseTukin) continue;

      const baseTukinNum = Number(p.baseTukin);
      // Porsi maksimal kehadiran biasanya 30% dari total Tukin
      const nominalKehadiranNum = baseTukinNum * 0.30; 

      await db
        .insert(rekapPresensiBulanan)
        .values({
          idPegawai: p.idPegawai,
          bulan,
          tahun,
          hariKerja: 22,
          totalMenitTerlambat: 0,
          jumlahLupaAbsen: 0,
          jumlahAlpa: 0,
          jumlahCtGugurKandunganGt1Bln: 0,
          persentasePotongan: '0', 
          persentaseKehadiran: '100', // Hadir 100%
          nominalKehadiran: nominalKehadiranNum.toFixed(2),
          jumlahPotonganKehadiran: '0',
        })
        .onConflictDoNothing(); // Aman kalau kepencet 2x, nggak bakal duplikat
    }

    revalidatePath('/admin/tukin');
    return { success: true, message: 'Data Dummy Presensi Bulan 10/2026 berhasil disuntik! 💉' };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message };
  }
}