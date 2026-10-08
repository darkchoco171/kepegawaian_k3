// src/app/admin/tukin/excel-actions.ts
'use server';

import { db } from '@/lib/db';
import { tukinBulanan, rekapPresensiBulanan, masterKelasJabatan, masterJabatan, pegawai } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Fungsi buat ngambil data utuh untuk Export (Digabung sama data Presensi)
export async function getExportDataTukin(bulan: number, tahun: number) {
  const data = await db.select({
    nip: pegawai.nip,
    nama: pegawai.namaLengkap,
    capaianKinerja: tukinBulanan.capaianKinerja,
    persentaseKinerja: tukinBulanan.persentaseKinerja,
    nominalDasar: tukinBulanan.nominalDasar,
    nominalKinerja: tukinBulanan.nominalKinerja,
    // Ambil data pendukung dari rekap presensi kalau ada
    persentaseKehadiran: rekapPresensiBulanan.persentaseKehadiran,
    nominalKehadiran: rekapPresensiBulanan.nominalKehadiran,
    dibayarkan: tukinBulanan.dibayarkan,
  })
  .from(tukinBulanan)
  .leftJoin(pegawai, eq(tukinBulanan.idPegawai, pegawai.id))
  .leftJoin(rekapPresensiBulanan, eq(tukinBulanan.idRekapPresensiBulanan, rekapPresensiBulanan.id))
  .where(and(eq(tukinBulanan.bulan, bulan), eq(tukinBulanan.tahun, tahun)));

  return data;
}

// Fungsi Import Excel (Template buat baca file upload Mba Nisa)
export async function prosesImportExcel(dataExcel: any[]) {
  try {
    let successCount = 0;
    let failCount = 0;

    for (const row of dataExcel) {
      // Pastikan kolom Excel sesuai: NIP, Hasil Kerja, Perilaku Kerja
      const nip = row['NIP']?.toString();
      const hasilKerja = row['Hasil Kerja'];
      const perilakuKerja = row['Perilaku Kerja'];

      if (!nip || !hasilKerja || !perilakuKerja) {
        failCount++;
        continue;
      }

      // 1. Cari data pegawai berdasarkan NIP beserta Jabatan & Base Tukin-nya
      const dataPegawai = await db
        .select({
          idPegawai: pegawai.id,
          idJabatan: pegawai.idJabatan,
          baseTukin: masterKelasJabatan.baseTukin,
        })
        .from(pegawai)
        .leftJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
        .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id))
        .where(eq(pegawai.nip, nip))
        .limit(1);

      if (dataPegawai.length === 0 || !dataPegawai[0].baseTukin) {
        failCount++;
        continue;
      }

      const idPegawaiValue = dataPegawai[0].idPegawai;
      const idJabatanValue = dataPegawai[0].idJabatan;
      const baseTukinValue = dataPegawai[0].baseTukin;

      if (!idPegawaiValue || !idJabatanValue || !baseTukinValue) {
        failCount++;
        continue;
      }

      // 2. Gunakan rumus matriks kinerja yang sama
      // (Bisa dibikin fungsi terpisah atau dipanggil ulang di sini)
      let capaianKinerja = 'Baik';
      let persentaseKinerja = 1.00; // 100%

      const kombinasi = `${hasilKerja}|${perilakuKerja}`;
      if (kombinasi === 'Di Atas Ekspektasi|Di Atas Ekspektasi') {
        capaianKinerja = 'Sangat Baik';
        persentaseKinerja = 1.20;
      } else if (kombinasi.includes('Di Bawah Ekspektasi')) {
        capaianKinerja = 'Butuh Perbaikan';
        persentaseKinerja = 0.75;
      }

      const nominalDasarNum = Number(baseTukinValue);
      // Porsi Kinerja adalah 70% dari base tukin dikali persentase capaian
      const nominalKinerjaNum = nominalDasarNum * 0.70 * persentaseKinerja;

      const dateNow = new Date();
      const bulan = dateNow.getMonth() + 1;
      const tahun = dateNow.getFullYear();

      // 3. Upsert ke tabel tukinBulanan
      await db
        .insert(tukinBulanan)
        .values({
          idPegawai: idPegawaiValue,
          idMasterJabatan: idJabatanValue,
          bulan,
          tahun,
          nominalDasar: nominalDasarNum.toString(),
          hasilKerja,
          perilakuKerja,
          capaianKinerja,
          persentaseKinerja: persentaseKinerja.toString(),
          nominalKinerja: nominalKinerjaNum.toFixed(2),
          dibayarkan: nominalKinerjaNum.toFixed(2),
        })
        .onConflictDoUpdate({
          target: [tukinBulanan.idPegawai, tukinBulanan.bulan, tukinBulanan.tahun],
          set: {
            hasilKerja,
            perilakuKerja,
            capaianKinerja,
            persentaseKinerja: persentaseKinerja.toString(),
            nominalKinerja: nominalKinerjaNum.toFixed(2),
            updatedAt: new Date(),
          },
        });

      successCount++;
    }

    revalidatePath('/admin/tukin');
    return { 
      status: 'success', 
      message: `Import Berhasil! ${successCount} data diproses, ${failCount} baris diabaikan (format salah/NIP tidak ditemukan).` 
    };
  } catch (error: any) {
    return { status: 'error', message: error.message };
  }
}