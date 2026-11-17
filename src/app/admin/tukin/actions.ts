// src/app/admin/tukin/actions.ts
'use server';

import { db } from '@/lib/db';
import { tukinBulanan, rekapPresensiBulanan } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hitungTukinDibayarkan } from '@/lib/tukin/calculation';
import { getPegawaiTanpaRekapPresensi } from '@/lib/tukin/period-validation';

export async function kalkulasiTukinMassal(bulan: number, tahun: number) {
  try {
    if (
      !Number.isInteger(bulan) ||
      bulan < 1 ||
      bulan > 12 ||
      !Number.isInteger(tahun) ||
      tahun < 1900 ||
      tahun > 9999
    ) {
      return { status: 'error', message: 'Periode kalkulasi Tukin tidak valid.' };
    }

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
    const pegawaiTanpaPresensi = getPegawaiTanpaRekapPresensi(listKinerja, listPresensi);
    const pegawaiTanpaPresensiSet = new Set(pegawaiTanpaPresensi);
    const listKinerjaDenganPresensi = listKinerja.filter(
      (kinerja) => !pegawaiTanpaPresensiSet.has(kinerja.idPegawai),
    );
    if (listKinerjaDenganPresensi.length === 0) {
      return {
        status: 'error',
        message: `Tidak ada Tukin yang dikalkulasi karena rekap presensi ${String(bulan).padStart(2, '0')}/${tahun} belum tersedia.`,
      };
    }

    // 3. Gabungin Duitnya (Kinerja 70% + Presensi 30%)
    const presensiByPegawai = new Map(listPresensi.map((presensi) => [presensi.idPegawai, presensi]));
    let updatedCount = 0;
    for (const kinerja of listKinerjaDenganPresensi) {
      const presensi = presensiByPegawai.get(kinerja.idPegawai);
      if (!presensi) {
        throw new Error(`Rekap presensi ${String(bulan).padStart(2, '0')}/${tahun} tidak ditemukan.`);
      }

      const nominalKehadiranNum = Number(presensi.nominalKehadiran || 0);

      // Hitung total bersih
      const totalDibayarkan = hitungTukinDibayarkan(
        Number(kinerja.nominalKinerja || 0),
        nominalKehadiranNum,
      );

      // Update tabel tukin_bulanan
      await db.update(tukinBulanan)
        .set({
          idRekapPresensiBulanan: presensi.id,
          dibayarkan: totalDibayarkan.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(tukinBulanan.id, kinerja.id));
        
      updatedCount++;
    }

    revalidatePath('/admin/tukin');
    const skippedMessage = pegawaiTanpaPresensi.length > 0
      ? ` ${pegawaiTanpaPresensi.length} pegawai dilewati karena belum memiliki rekap presensi.`
      : '';
    return {
      status: 'success',
      message: `Berhasil mengkalkulasi ${updatedCount} data Tukin.${skippedMessage}`,
    };
  } catch (error: any) {
    console.error('Error kalkulasi tukin:', error);
    return { status: 'error', message: error.message };
  }
}