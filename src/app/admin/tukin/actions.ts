// src/app/admin/tukin/actions.ts
'use server';

import { db } from '@/lib/db';
import { tukinBulanan, rekapPresensiBulanan } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function kalkulasiTukinMassal(bulan: number, tahun: number) {
  try {
    // 1. Tarik semua data kinerja bulanan bulan ini
    const listKinerja = await db.select().from(tukinBulanan).where(
      and(eq(tukinBulanan.bulan, bulan), eq(tukinBulanan.tahun, tahun))
    );

    if (listKinerja.length === 0) {
      return { status: 'error', message: 'Data kinerja bulan ini kosong. Silahkan input dahulu di Manajemen Kinerja!' };
    }

    // 2. Tarik semua rekap presensi bulan ini
    const listPresensi = await db.select().from(rekapPresensiBulanan).where(
      and(eq(rekapPresensiBulanan.bulan, bulan), eq(rekapPresensiBulanan.tahun, tahun))
    );

    // 3. Gabungin Duitnya (Kinerja 70% + Presensi 30%)
    let updatedCount = 0;
    for (const kinerja of listKinerja) {
      const presensi = listPresensi.find(p => p.idPegawai === kinerja.idPegawai);
      
      let nominalKehadiranNum = 0;
      let idRekap = null;

      if (presensi) {
        nominalKehadiranNum = Number(presensi.nominalKehadiran || 0);
        idRekap = presensi.id;
      }

      // Hitung total bersih
      const totalDibayarkan = Number(kinerja.nominalKinerja || 0) + nominalKehadiranNum;

      // Update tabel tukin_bulanan
      await db.update(tukinBulanan)
        .set({
          idRekapPresensiBulanan: idRekap,
          dibayarkan: totalDibayarkan.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(tukinBulanan.id, kinerja.id));
        
      updatedCount++;
    }

    revalidatePath('/admin/tukin');
    return { status: 'success', message: `Berhasil mengkalkulasi dan menggabungkan ${updatedCount} data Tukin!` };
  } catch (error: any) {
    console.error('Error kalkulasi tukin:', error);
    return { status: 'error', message: error.message };
  }
}